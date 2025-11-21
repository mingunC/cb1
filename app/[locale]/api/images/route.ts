import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { supabase } from '@/lib/supabase'

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Image compression settings
const COMPRESSION_SETTINGS = {
  jpeg: { quality: 85, progressive: true },
  png: { quality: 90, compressionLevel: 8 },
  webp: { quality: 85 }
}

// Thumbnail settings
const THUMBNAIL_SIZE = { width: 300, height: 300 }

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'
    const generateThumbnail = formData.get('generateThumbnail') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${timestamp}-${randomString}.${fileExtension}`
    const thumbnailFileName = `${timestamp}-${randomString}-thumb.${fileExtension}`

    // Compress the main image
    let compressedBuffer: Buffer
    let thumbnailBuffer: Buffer | null = null

    if (file.type === 'image/jpeg') {
      compressedBuffer = await sharp(buffer)
        .jpeg(COMPRESSION_SETTINGS.jpeg)
        .toBuffer()
    } else if (file.type === 'image/png') {
      compressedBuffer = await sharp(buffer)
        .png(COMPRESSION_SETTINGS.png)
        .toBuffer()
    } else if (file.type === 'image/webp') {
      compressedBuffer = await sharp(buffer)
        .webp(COMPRESSION_SETTINGS.webp)
        .toBuffer()
    } else {
      // Fallback to JPEG
      compressedBuffer = await sharp(buffer)
        .jpeg(COMPRESSION_SETTINGS.jpeg)
        .toBuffer()
    }

    // Generate thumbnail if requested
    if (generateThumbnail) {
      thumbnailBuffer = await sharp(buffer)
        .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer()
    }

    // Upload main image to Supabase Storage
    const mainImagePath = `${folder}/${fileName}`
    const { data: mainImageData, error: mainImageError } = await supabase.storage
      .from('project-photos')
      .upload(mainImagePath, compressedBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (mainImageError) {
      console.error('Error uploading main image:', mainImageError)
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Upload thumbnail if generated
    let thumbnailPath: string | null = null
    if (thumbnailBuffer) {
      const thumbnailImagePath = `${folder}/${thumbnailFileName}`
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from('project-photos')
        .upload(thumbnailImagePath, thumbnailBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (thumbnailError) {
        console.error('Error uploading thumbnail:', thumbnailError)
        // Don't fail the entire request if thumbnail upload fails
      } else {
        thumbnailPath = thumbnailData.path
      }
    }

    // Get public URLs
    const { data: mainImageUrl } = supabase.storage
      .from('project-photos')
      .getPublicUrl(mainImagePath)

    const thumbnailUrl = thumbnailPath ? supabase.storage
      .from('project-photos')
      .getPublicUrl(thumbnailPath).data.publicUrl : null

    return NextResponse.json({
      success: true,
      data: {
        mainImage: {
          path: mainImageData.path,
          url: mainImageUrl.publicUrl,
          size: compressedBuffer.length,
          originalSize: file.size
        },
        thumbnail: thumbnailPath ? {
          path: thumbnailPath,
          url: thumbnailUrl,
          size: thumbnailBuffer?.length || 0
        } : null
      }
    })

  } catch (error) {
    console.error('Image compression error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve image info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      )
    }

    // Get file info from Supabase Storage
    const { data, error } = await supabase.storage
      .from('project-photos')
      .list(path.split('/').slice(0, -1).join('/'))

    if (error) {
      return NextResponse.json(
        { error: 'Failed to retrieve file info' },
        { status: 500 }
      )
    }

    const fileName = path.split('/').pop()
    const fileInfo = data.find(file => file.name === fileName)

    if (!fileInfo) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-photos')
      .getPublicUrl(path)

    return NextResponse.json({
      success: true,
      data: {
        path: fileInfo.name,
        size: fileInfo.metadata?.size,
        lastModified: fileInfo.updated_at,
        url: urlData.publicUrl
      }
    })

  } catch (error) {
    console.error('Get image info error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove images
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      )
    }

    // Delete file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('project-photos')
      .remove([path])

    if (error) {
      console.error('Error deleting file:', error)
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
