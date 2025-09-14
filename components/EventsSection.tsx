import { Calendar, MapPin, Users, Clock } from 'lucide-react'

export default function EventsSection() {
  const events = [
    {
      id: 1,
      title: '2024 리노베이션 트렌드 세미나',
      description: '올해 가장 인기 있는 리노베이션 트렌드와 디자인 아이디어를 공유합니다.',
      type: '세미나',
      date: '2024-01-15',
      time: '14:00',
      location: '서울 코엑스 컨벤션센터',
      maxAttendees: 200,
      currentAttendees: 156,
      image: '/api/placeholder/400/250',
      featured: true
    },
    {
      id: 2,
      title: '주방 리노베이션 워크샵',
      description: '실제 주방 리노베이션 과정을 직접 체험하고 전문가의 조언을 받아보세요.',
      type: '워크샵',
      date: '2024-01-22',
      time: '10:00',
      location: '강남 리노베이션 쇼룸',
      maxAttendees: 30,
      currentAttendees: 28,
      image: '/api/placeholder/400/250',
      featured: true
    },
    {
      id: 3,
      title: '스마트홈 기술 전시회',
      description: '최신 스마트홈 기술과 IoT 기기를 활용한 리노베이션 사례를 소개합니다.',
      type: '전시회',
      date: '2024-01-28',
      time: '09:00',
      location: '삼성동 트레이드센터',
      maxAttendees: 500,
      currentAttendees: 234,
      image: '/api/placeholder/400/250',
      featured: false
    }
  ]

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case '세미나':
        return 'bg-blue-100 text-blue-800'
      case '워크샵':
        return 'bg-green-100 text-green-800'
      case '전시회':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            리노베이션 이벤트
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            전문가들과 함께하는 다양한 이벤트에 참여하여 
            리노베이션에 대한 지식과 영감을 얻어보세요.
          </p>
        </div>

        {/* 이벤트 카드들 */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              {/* 이벤트 이미지 */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">{event.type}</span>
                </div>
                
                {/* 이벤트 타입 배지 */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                </div>

                {/* 참석자 수 배지 */}
                <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="flex items-center text-sm font-medium text-gray-900">
                    <Users className="h-3 w-3 mr-1" />
                    {event.currentAttendees}/{event.maxAttendees}
                  </div>
                </div>
              </div>

              {/* 이벤트 정보 */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{event.title}</h3>
                <p className="text-gray-600 mb-4 text-sm line-clamp-2">{event.description}</p>

                {/* 이벤트 세부사항 */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    {event.date}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    {event.time}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                    {event.location}
                  </div>
                </div>

                {/* 참석률 바 */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>참석률</span>
                    <span>{Math.round((event.currentAttendees / event.maxAttendees) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(event.currentAttendees / event.maxAttendees) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* 등록 버튼 */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
                  이벤트 등록하기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 더 보기 버튼 */}
        <div className="text-center">
          <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-xl text-lg font-semibold transition-colors duration-200">
            모든 이벤트 보기
          </button>
        </div>
      </div>
    </section>
  )
}
