-- ============================================
-- Fix: Convert quote-submitted projects back to bidding
-- ============================================
-- 
-- 문제: 견적서 제출 시 프로젝트 상태가 'quote-submitted'로 변경되었으나,
--       올바른 워크플로우에서는 'bidding' 상태를 유지해야 합니다.
-- 
-- 해결: 'quote-submitted' 상태의 프로젝트를 'bidding'으로 되돌립니다.
--       (단, 이미 업체가 선택된 프로젝트는 제외)
-- ============================================

-- 1. 먼저 현재 'quote-submitted' 상태인 프로젝트 확인
SELECT 
  id,
  status,
  full_address,
  selected_contractor_id,
  created_at,
  updated_at
FROM quote_requests
WHERE status = 'quote-submitted'
ORDER BY created_at DESC;

-- 2. 'quote-submitted'를 'bidding'으로 변경
-- (업체가 선택되지 않은 프로젝트만)
UPDATE quote_requests
SET 
  status = 'bidding',
  updated_at = NOW()
WHERE status = 'quote-submitted'
  AND selected_contractor_id IS NULL;

-- 3. 변경 결과 확인
SELECT 
  id,
  status,
  full_address,
  selected_contractor_id,
  created_at,
  updated_at
FROM quote_requests
WHERE updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;

-- 4. 전체 상태 분포 확인
SELECT 
  status,
  COUNT(*) as count
FROM quote_requests
GROUP BY status
ORDER BY count DESC;

-- ============================================
-- 실행 순서:
-- 1. 쿼리 1번 실행 → 현재 상태 확인
-- 2. 쿼리 2번 실행 → 상태 변경
-- 3. 쿼리 3번 실행 → 변경 결과 확인
-- 4. 쿼리 4번 실행 → 전체 상태 확인
-- ============================================
