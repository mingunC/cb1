'use client'

import { useState } from 'react'
import PortfolioManagerTest from '@/components/PortfolioManagerTest'

export default function PortfolioTestPage() {
  const [contractorId] = useState('test-contractor-123')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">포트폴리오 관리 테스트</h1>
          <p className="text-gray-600 mb-6">
            이 페이지는 포트폴리오 관리 기능을 테스트하기 위한 페이지입니다.
          </p>
          
          <PortfolioManagerTest 
            contractorId={contractorId}
            onPortfolioUpdate={() => {
              console.log('포트폴리오가 업데이트되었습니다.')
            }}
          />
        </div>
      </div>
    </div>
  )
}
