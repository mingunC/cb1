'use client'

import { useState } from 'react'

export default function TestEmailPage() {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testEmail = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/quotes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: '59373443-cdb0-465f-bb98-b12e3aff90c0',
          contractorId: 'f8a315aa-6930-476c-9cc3-5eac9cb9306b',
          price: '50000',
          description: 'Test quote submission',
          pdfUrl: 'test.pdf',
          pdfFilename: 'test.pdf'
        })
      })

      const data = await response.json()
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (error: any) {
      setResult({
        error: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Email Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Quote Submission Email</h2>
          <p className="text-gray-600 mb-4">
            This will test the quote submission API and email sending
          </p>
          
          <button
            onClick={testEmail}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Testing...' : 'Test Email Sending'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
