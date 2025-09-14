'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { Users, UserCheck, UserX, Search, Filter } from 'lucide-react'

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const supabase = createBrowserClient()
    
    try {
      // 모든 사용자 조회 (관리자 권한 필요)
      const { data, error } = await supabase
        .from('auth.users')
        .select('id, email, role, created_at, email_confirmed_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
      } else {
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    const supabase = createBrowserClient()
    
    try {
      const { error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: newRole
      })

      if (error) {
        alert(`역할 변경 실패: ${error.message}`)
      } else {
        alert('역할이 성공적으로 변경되었습니다.')
        fetchUsers() // 목록 새로고침
      }
    } catch (error) {
      alert('역할 변경 중 오류가 발생했습니다.')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'contractor':
        return 'bg-green-100 text-green-800'
      case 'customer':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자'
      case 'contractor':
        return '업체'
      case 'customer':
        return '고객'
      default:
        return role
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">사용자 관리</h1>
          <p className="text-gray-600">사용자 역할을 관리하고 권한을 변경할 수 있습니다.</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">모든 역할</option>
                  <option value="customer">고객</option>
                  <option value="contractor">업체</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              사용자 목록 ({filteredUsers.length}명)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일 확인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email_confirmed_at ? (
                        <span className="inline-flex items-center text-green-600">
                          <UserCheck className="h-4 w-4 mr-1" />
                          확인됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600">
                          <UserX className="h-4 w-4 mr-1" />
                          미확인
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {user.role !== 'customer' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'customer')}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            고객으로 변경
                          </button>
                        )}
                        {user.role !== 'contractor' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'contractor')}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            업체로 변경
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'admin')}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            관리자로 변경
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
