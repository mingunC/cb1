'use client'

import React, { useState, useEffect } from 'react'
import { X, DollarSign, FileText, Upload, RefreshCw } from 'lucide-react'
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

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !contractorId) return

    if (!pdfFile) {
      toast.error('상세 견적서 PDF 파일을 업로드해주세요.')
      return
    }

    if (isSubmitting) {
      console.log('이미 제출 중입니다')
      return
    }

    setIsSubmitting(true)
    
    try {
      const supabase = createBrowserClient()
      const uploadResult = await uploadQuote(pdfFile, project.id, contractorId)
      
      const { error } = await supabase
        .from('contractor_quotes')
        .insert({
          project_id: project.id,
          contractor_id: contractorId,
          price: parseFloat(price),
          description: detailedDescription,
          pdf_url: uploadResult.pdfUrl,
          pdf_filename: uploadResult.pdfFilename,
          status: 'submitted', // 데이터베이스 제약 조건에 맞게 'submitted' 사용
          created_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('견적서가 성공적으로 제출되었습니다!')
      setIsSubmitting(false)
      
      setTimeout(() => {
        onSuccess()
      }, 100)
      
    } catch (error) {
      console.error('견적서 제출 오류:', error)
      toast.error('견적서 제출 중 오류가 발생했습니다')
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
                {mode === 'create' ? '견적서 작성' : '제출된 견적서'}
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
                  <span className="text-md font-semibold text-gray-700">총 견적 금액 (CAD)</span>
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
                  <span className="text-md font-semibold text-gray-700">상세 작업 내용</span>
                </label>
                <textarea
                  id="detailed-description"
                  value={detailedDescription}
                  onChange={(e) => setDetailedDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
                  rows={6}
                  placeholder="고객에게 어필할 수 있는 작업 내용을 작성해주세요 (선택사항)"
                />
              </div>

              {/* PDF 업로드 */}
              <div>
                <label className="flex items-center gap-3 mb-3">
                  <Upload className="h-5 w-5 text-amber-500" />
                  <span className="text-md font-semibold text-gray-700">상세 견적서 (PDF) *</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">
                      {pdfFile ? pdfFile.name : '파일을 선택하거나 여기에 드래그하세요.'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF 파일 업로드 (필수)
                    </p>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 text-gray-700 bg-transparent border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 transition-colors font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      제출 중...
                    </>
                  ) : '견적서 제출'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">견적 금액</h3>
                <p className="text-3xl font-bold text-amber-600">
                  ${priceDisplay || '0'} <span className="text-xl font-medium text-gray-500">CAD</span>
                </p>
              </div>

              <div className="space-y-4">
                {detailedDescription && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-2">상세 작업 내용</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                      {detailedDescription}
                    </p>
                  </div>
                )}
              </div>

              {project.contractor_quote?.pdf_url && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-2">첨부된 상세 견적서</h3>
                  <button
                    onClick={async () => {
                      if (!project.contractor_quote?.pdf_url) return
                      try {
                        await downloadQuote(project.contractor_quote.pdf_url)
                      } catch (error) {
                        toast.error('PDF 파일을 다운로드할 수 없습니다.')
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    {project.contractor_quote.pdf_filename || '견적서 다운로드'}
                  </button>
                </div>
              )}
              
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors font-semibold"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
