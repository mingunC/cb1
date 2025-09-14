-- 포트폴리오 샘플 데이터 추가
-- 이 스크립트는 Supabase Dashboard의 SQL Editor에서 실행하세요

-- 먼저 기존 샘플 데이터가 있는지 확인
SELECT COUNT(*) as existing_count FROM portfolios;

-- 샘플 포트폴리오 데이터 추가
INSERT INTO portfolios (
  id,
  contractor_id,
  title,
  description,
  image_url,
  category,
  year,
  created_at,
  updated_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  '2707a61c-be13-4269-80d5-acece277a574', -- Micks Construction Co.
  '모던 주방 리노베이션',
  '화이트와 우드톤이 조화를 이룬 모던한 주방 공간으로 완전히 새롭게 단장했습니다. 기능성과 미적 요소를 모두 고려한 디자인으로 일상의 요리 시간이 더욱 즐거워집니다.',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
  '주거공간',
  '2024',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  '2707a61c-be13-4269-80d5-acece277a574', -- Micks Construction Co.
  '럭셔리 욕실 리뉴얼',
  '대리석과 골드 액센트가 돋보이는 고급스러운 욕실로 완전히 새롭게 단장했습니다. 프리미엄 소재와 세심한 마감으로 일상의 휴식 시간이 더욱 특별해집니다.',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop',
  '주거공간',
  '2024',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'a1b2c3d4-e5f6-7890-1234-567890abcdef', -- 다른 업체
  '미니멀 전체 리노베이션',
  '깔끔하고 실용적인 미니멀 디자인으로 완전히 새로워진 공간입니다. 불필요한 요소를 제거하고 본질적인 기능에 집중한 디자인으로 일상이 더욱 편리해집니다.',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
  '주거공간',
  '2024',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'b2c3d4e5-f6a7-8901-2345-67890abcdef0', -- 또 다른 업체
  '인더스트리얼 카페 인테리어',
  '노출된 벽돌과 철재로 만든 인더스트리얼 스타일의 카페 인테리어입니다. 브랜드 아이덴티티를 반영한 독창적인 공간으로 고객들에게 특별한 경험을 제공합니다.',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
  '상업공간',
  '2024',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'c3d4e5f6-a7b8-9012-3456-7890abcdef01', -- 또 다른 업체
  '스칸디나비안 거실 리노베이션',
  '따뜻한 나무 소재와 중성톤 컬러로 만든 스칸디나비안 스타일의 거실입니다. 자연스러운 재료와 미니멀한 디자인으로 편안하고 아늑한 공간을 연출했습니다.',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
  '주거공간',
  '2024',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440006',
  'd4e5f6a7-b8c9-0123-4567-890abcdef012', -- 또 다른 업체
  '모던 사무실 인테리어',
  '효율적인 업무 공간을 위한 모던한 사무실 인테리어입니다. 협업과 집중을 모두 고려한 공간 구성으로 업무 효율성을 극대화했습니다.',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
  '상업공간',
  '2024',
  NOW(),
  NOW()
);

-- 추가된 데이터 확인
SELECT 
  p.id,
  p.title,
  p.category,
  p.year,
  c.company_name
FROM portfolios p
JOIN contractors c ON p.contractor_id = c.id
ORDER BY p.created_at DESC;

-- 완료 메시지
SELECT 'Portfolio sample data added successfully!' as message;
