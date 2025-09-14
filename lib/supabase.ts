import { createClient } from '@supabase/supabase-js'
import { Database } from './types/database'

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Admin client for server-side operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Types for user roles
export type UserRole = 'customer' | 'contractor' | 'admin'

// Extended user type with role
export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

// Auth hook for getting current user and role
export const useAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, role: null, error }
  }

  // Get user role from auth.users table
  const { data: userData, error: roleError } = await supabase
    .from('auth.users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (roleError) {
    return { user, role: 'customer' as UserRole, error: roleError }
  }

  return { 
    user, 
    role: userData?.role as UserRole || 'customer', 
    error: null 
  }
}

// Function to update user role (admin only)
export const updateUserRole = async (userId: string, newRole: UserRole) => {
  const { data, error } = await supabase.rpc('update_user_role', {
    user_id: userId,
    new_role: newRole
  })

  return { data, error }
}

// Function to check if user is admin
export const isAdmin = async (userId?: string) => {
  const { data, error } = await supabase.rpc('is_admin', {
    user_id: userId
  })

  return { data, error }
}

// Function to get contractor profile
export const getContractorProfile = async (userId?: string) => {
  const { data, error } = await supabase.rpc('get_contractor_profile', {
    user_id: userId
  })

  return { data, error }
}

// Image upload function with compression
export const uploadImage = async (
  file: File,
  bucket: string = 'project-photos',
  folder?: string
): Promise<{ data: { path: string; fullPath: string } | null; error: any }> => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { data: null, error }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      data: {
        path: data.path,
        fullPath: urlData.publicUrl
      },
      error: null
    }
  } catch (error) {
    return { data: null, error }
  }
}

// Function to delete image
export const deleteImage = async (path: string, bucket: string = 'project-photos') => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path])

  return { data, error }
}

// Function to get signed URL for private images
export const getSignedUrl = async (path: string, bucket: string = 'project-photos', expiresIn: number = 3600) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  return { data, error }
}

// Database query helpers
export const db = {
  // Quotes
  quotes: {
    create: async (quoteData: Database['public']['Tables']['quotes']['Insert']) => {
      return await supabase.from('quotes').insert(quoteData).select()
    },
    getByCustomer: async (customerId: string) => {
      return await supabase.from('quotes').select('*').eq('customer_id', customerId)
    },
    getByContractor: async (contractorId: string) => {
      return await supabase.from('quotes').select('*').eq('contractor_id', contractorId)
    },
    update: async (id: string, updates: Database['public']['Tables']['quotes']['Update']) => {
      return await supabase.from('quotes').update(updates).eq('id', id).select()
    }
  },

  // Temp quotes
  tempQuotes: {
    create: async (tempQuoteData: Database['public']['Tables']['temp_quotes']['Insert']) => {
      return await supabase.from('temp_quotes').insert(tempQuoteData).select()
    },
    getByCustomer: async (customerId: string) => {
      return await supabase.from('temp_quotes').select('*').eq('customer_id', customerId)
    },
    getBySession: async (sessionId: string) => {
      return await supabase.from('temp_quotes').select('*').eq('session_id', sessionId)
    },
    update: async (id: string, updates: Database['public']['Tables']['temp_quotes']['Update']) => {
      return await supabase.from('temp_quotes').update(updates).eq('id', id).select()
    },
    delete: async (id: string) => {
      return await supabase.from('temp_quotes').delete().eq('id', id)
    }
  },

  // Contractors
  contractors: {
    create: async (contractorData: Database['public']['Tables']['contractors']['Insert']) => {
      return await supabase.from('contractors').insert(contractorData).select()
    },
    getByUser: async (userId: string) => {
      return await supabase.from('contractors').select('*').eq('user_id', userId).single()
    },
    getVerified: async () => {
      return await supabase.from('contractors').select('*').eq('status', 'active')
    },
    update: async (id: string, updates: Database['public']['Tables']['contractors']['Update']) => {
      return await supabase.from('contractors').update(updates).eq('id', id).select()
    }
  },

  // Portfolios
  portfolios: {
    create: async (portfolioData: Database['public']['Tables']['portfolios']['Insert']) => {
      return await supabase.from('portfolios').insert(portfolioData).select()
    },
    getByContractor: async (contractorId: string) => {
      return await supabase.from('portfolios').select('*').eq('contractor_id', contractorId)
    },
    getFeatured: async () => {
      return await supabase.from('portfolios').select('*').eq('is_featured', true)
    },
    update: async (id: string, updates: Database['public']['Tables']['portfolios']['Update']) => {
      return await supabase.from('portfolios').update(updates).eq('id', id).select()
    },
    delete: async (id: string) => {
      return await supabase.from('portfolios').delete().eq('id', id)
    }
  },

  // Reviews
  reviews: {
    create: async (reviewData: Database['public']['Tables']['reviews']['Insert']) => {
      return await supabase.from('reviews').insert(reviewData).select()
    },
    getByContractor: async (contractorId: string) => {
      return await supabase.from('reviews').select('*').eq('contractor_id', contractorId).eq('is_verified', true)
    },
    getByCustomer: async (customerId: string) => {
      return await supabase.from('reviews').select('*').eq('customer_id', customerId)
    },
    update: async (id: string, updates: Database['public']['Tables']['reviews']['Update']) => {
      return await supabase.from('reviews').update(updates).eq('id', id).select()
    }
  },

  // Events
  events: {
    create: async (eventData: Database['public']['Tables']['events']['Insert']) => {
      return await supabase.from('events').insert(eventData).select()
    },
    getActive: async () => {
      return await supabase.from('events').select('*').eq('is_active', true).order('start_date', { ascending: true })
    },
    update: async (id: string, updates: Database['public']['Tables']['events']['Update']) => {
      return await supabase.from('events').update(updates).eq('id', id).select()
    },
    delete: async (id: string) => {
      return await supabase.from('events').delete().eq('id', id)
    }
  }
}

// Export types
export type { Database }
