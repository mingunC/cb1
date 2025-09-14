-- 기존 업체들에게 샘플 주소 추가
-- 실제 운영 환경에서는 각 업체의 실제 주소로 업데이트해야 합니다

-- 업체 1: 서울시 강남구 테헤란로 123
UPDATE contractors 
SET address = '서울시 강남구 테헤란로 123' 
WHERE company_name LIKE '%Micks%' OR contact_name LIKE '%Mick%';

-- 업체 2: 서울시 서초구 서초대로 456
UPDATE contractors 
SET address = '서울시 서초구 서초대로 456' 
WHERE company_name LIKE '%Construction%' OR contact_name LIKE '%Smith%';

-- 업체 3: 서울시 마포구 홍대입구역 789
UPDATE contractors 
SET address = '서울시 마포구 홍대입구역 789' 
WHERE company_name LIKE '%Interior%' OR contact_name LIKE '%홍%';

-- 업체 4: 서울시 송파구 올림픽로 321
UPDATE contractors 
SET address = '서울시 송파구 올림픽로 321' 
WHERE company_name LIKE '%Renovation%' OR contact_name LIKE '%김%';

-- 업체 5: 서울시 영등포구 여의도동 654
UPDATE contractors 
SET address = '서울시 영등포구 여의도동 654' 
WHERE company_name LIKE '%Design%' OR contact_name LIKE '%이%';

-- 주소가 없는 모든 업체들에게 기본 주소 추가
UPDATE contractors 
SET address = '서울시 ' || 
  CASE 
    WHEN RANDOM() < 0.2 THEN '강남구 테헤란로 ' || (100 + (RANDOM() * 900)::INTEGER)
    WHEN RANDOM() < 0.4 THEN '서초구 서초대로 ' || (100 + (RANDOM() * 900)::INTEGER)
    WHEN RANDOM() < 0.6 THEN '마포구 홍대입구역 ' || (100 + (RANDOM() * 900)::INTEGER)
    WHEN RANDOM() < 0.8 THEN '송파구 올림픽로 ' || (100 + (RANDOM() * 900)::INTEGER)
    ELSE '영등포구 여의도동 ' || (100 + (RANDOM() * 900)::INTEGER)
  END
WHERE address IS NULL OR address = '';

-- 업데이트 결과 확인
SELECT id, company_name, contact_name, address, created_at 
FROM contractors 
ORDER BY created_at DESC;
