'use client'

import React, { useState, useEffect } from 'react'
import { X, DollarSign, FileText, Upload, RefreshCw, CheckCircle, Trash2, File } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/clients'
import { Project } from '@/types/contractor'
import { formatPrice } from '@/lib/contractor/projectHelpers'

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  mode: 'create' | 'view'
  contractorId?: string
  onSuccess: () => void
}

/**
 * 견적서 모달 컴포넌트
 */
export default function QuoteModal({ 
  isOpen, 
  onClose, 
  project, 
  mode, 
  contractorId, 
  onSuccess 
}: QuoteModalProps) {
  const [price, setPrice] = useState('')
  const [priceDisplay, setPriceDisplay] = useState('')
  const [detailedDescription, setDetailedDescription] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 금액 입력 핸들러
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numericValue = value.replace(/[^0-9]/g, '')
    setPrice(numericValue)
    setPriceDisplay(formatPrice(numericValue))
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be 10MB or less')
        return
      }
      setPdfFile(file)
      toast.success('File selected')
    }
  }

  // 파일 삭제 핸들러
  const handleRemoveFile = () => {
    setPdfFile(null)
    // input 요소 초기화
    const input = document.getElementById('pdf-upload') as HTMLInputElement
    if (input) input.value = ''
    toast.success('File removed')
  }

  // 모달 상태 초기화
  useEffect(() => {
    if (mode === 'view' && project?.contractor_quote) {
      const priceValue = project.contractor_quote.price?.toString() || ''
      setPrice(priceValue)
      setPriceDisplay(formatPrice(priceValue))
      setDetailedDescription(project.contractor_quote.description || '')
    } else if (mode === 'create') {
      setPrice('')
      setPriceDisplay('')
      setDetailedDescription('')
      setPdfFile(null)
    }
    setIsSubmitting(false)
  }, [mode, project?.id, isOpen])

  // 견적서 업로드 함수
  const uploadQuote = async (file: File, projectId: string, contractorId: string) => {
    const supabase = createBrowserClient()
    const fileName = `${projectId}_${contractorId}_${Date.now()}.pdf`
    
    const { data, error } = await supabase.storage
      .from('contractor-quotes')
      .upload(fileName, file)
    
    if (error) throw error
    
    return {
      pdfUrl: fileName,
      pdfFilename: file.name
    }
  }

  // 견적서 다운로드 함수
  const downloadQuote = async (pdfUrl: string) => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.storage
      .from('contractor-quotes')
      .createSignedUrl(pdfUrl, 3600)
    
    if (error) throw error
    
    window.open(data.signedUrl, '_blank')
  }

  // ✅ 개선된 폼 제출 핸들러 - API 호출로 변경
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !contractorId) return

    if (!pdfFile) {
      toast.error('Please upload a detailed quote PDF file.')
      return
    }

    if (isSubmitting) {
      console.log('Already submitting')
      return
    }

    setIsSubmitting(true)
    
    try {
      // 1단계: PDF 파일 업로드
      console.log('📤 Uploading PDF file...')
      const uploadResult = await uploadQuote(pdfFile, project.id, contractorId)
      console.log('✅ PDF uploaded:', uploadResult.pdfUrl)
      
      // 2단계: API를 통해 견적서 제출 (이메일 자동 전송)
      console.log('📧 Submitting quote via API (with email)...')
      const response = await fetch('/api/quotes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          contractorId: contractorId,
          price: price,
          description: detailedDescription,
          pdfUrl: uploadResult.pdfUrl,
          pdfFilename: uploadResult.pdfFilename
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quote')
      }

      console.log('✅ Quote submitted successfully:', data)
      
      // 이메일 전송 결과 표시
      if (data.emailSent) {
        toast.success('Quote submitted and customer notified!')
      } else {
        toast.success('Quote submitted successfully!')
        if (data.emailError) {
          console.warn('Email notification failed:', data.emailError)
        }
      }
      
      setIsSubmitting(false)
      
      setTimeout(() => {
        onSuccess()
      }, 100)
      
    } catch (error: any) {
      console.error('Quote submission error:', error)
      toast.error(error.message || 'An error occurred while submitting the quote')
      setIsSubmitting(false)
    }
  }

  // 모달 닫기 핸들러
  const handleClose = () => {
    setIsSubmitting(false)
    setPrice('')
    setPriceDisplay('')
    setDetailedDescription('')
    setPdfFile(null)
    onClose()
  }

  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {mode === 'create' ? 'Create Quote' : 'Submitted Quote'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {project.full_address}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto">
          {mode === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 견적 금액 */}
              <div>
                <label htmlFor="price" className="flex items-center gap-3 mb-3">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  <span className="text-md font-semibold text-gray-700">Total Quote Amount (CAD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <input
                    id="price"
                    type="text"
                    value={priceDisplay}
                    onChange={handlePriceChange}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    placeholder="50,000"
                    required
                  />
                </div>
              </div>

              {/* 상세 작업 내용 */}
              <div>
                <label htmlFor="detailed-description" className="flex items-center gap-3 mb-3">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <span className="text-md font-semibold text-gray-700">Detailed Work Description</span>
                </label>
                <textarea
                  id="detailed-description"
                  value={detailedDescription}
                  onChange={(e) => setDetailedDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
                  rows={6}
                  placeholder="Write work details that appeal to customers (Optional)"
                />
              </div>

              {/* ⚠️ 경고 메시지 */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-800 mb-1">Important Notice</h3>
                    <p className="text-sm text-amber-700">
                      Once submitted, quotes <strong>cannot be modified or cancelled</strong>. Please review carefully before submitting.
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF 업로드 - 개선된 디자인 */}
              <div>
                <label className="flex items-center gap-3 mb-3">
                  <Upload className="h-5 w-5 text-amber-500" />
                  <span className="text-md font-semibold text-gray-700">Detailed Quote (PDF) *</span>
                </label>
                
                {/* 파일이 선택되지 않았을 때 */}
                {!pdfFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer block">
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-gray-700 font-semibold text-lg mb-1">
                          Select a file or drag it here
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF files only (Max 10MB)
                        </p>
                      </div>
                    </label>
                  </div>
                ) : (
                  /* 파일이 선택되었을 때 - 명확한 시각적 피드백 */
                  <div className="border-2 border-green-500 bg-green-50 rounded-lg p-6 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-green-100 rounded-lg p-3">
                          <File className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <span className="text-sm font-semibold text-green-700">File Selected</span>
                          </div>
                          <p className="text-gray-900 font-semibold text-lg break-words mb-1">
                            {pdfFile.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Size: {formatFileSize(pdfFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                        title="Remove file"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* 파일 변경 버튼 */}
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="pdf-change"
                      />
                      <label 
                        htmlFor="pdf-change" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-green-500 text-green-700 rounded-md hover:bg-green-50 transition-colors cursor-pointer font-medium text-sm"
                      >
                        <Upload className="h-4 w-4" />
                        Select Different File
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 text-gray-700 bg-transparent border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 transition-colors font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : 'Submit Quote'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Quote Amount</h3>
                <p className="text-3xl font-bold text-amber-600">
                  ${priceDisplay || '0'} <span className="text-xl font-medium text-gray-500">CAD</span>
                </p>
              </div>

              <div className="space-y-4">
                {detailedDescription && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-2">Detailed Work Description</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                      {detailedDescription}
                    </p>
                  </div>
                )}
              </div>

              {project.contractor_quote?.pdf_url && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-2">Attached Detailed Quote</h3>
                  <button
                    onClick={async () => {
                      if (!project.contractor_quote?.pdf_url) return
                      try {
                        await downloadQuote(project.contractor_quote.pdf_url)
                      } catch (error) {
                        toast.error('Unable to download PDF file.')
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    {project.contractor_quote.pdf_filename || 'Download Quote'}
                  </button>
                </div>
              )}
              
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
