-- 업체 선택 시 축하 이메일 발송 함수
CREATE OR REPLACE FUNCTION send_contractor_selection_email()
RETURNS TRIGGER AS $$
DECLARE
  contractor_info RECORD;
  project_info RECORD;
  email_content TEXT;
BEGIN
  -- contractor_quotes 테이블에서 status가 'accepted'로 변경된 경우에만 실행
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    
    -- 선택된 업체 정보 조회
    SELECT 
      c.company_name,
      c.contact_name,
      c.email,
      c.phone
    INTO contractor_info
    FROM contractors c
    WHERE c.id = NEW.contractor_id;
    
    -- 프로젝트 정보 조회
    SELECT 
      qr.space_type,
      qr.project_types,
      qr.budget,
      qr.full_address,
      qr.description,
      u.email as customer_email,
      u.user_metadata->>'name' as customer_name
    INTO project_info
    FROM quote_requests qr
    LEFT JOIN auth.users u ON qr.customer_id = u.id
    WHERE qr.id = NEW.project_id;
    
    -- 이메일 내용 생성
    email_content := format('
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 축하합니다!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">프로젝트에 선정되셨습니다</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">안녕하세요, %s님!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            <strong>%s</strong> 프로젝트에 제출하신 견적이 선택되었습니다! 
            고객님께서 귀하의 업체를 선택하여 주셨습니다.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333;">📋 프로젝트 정보</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;"><strong>공간 유형:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>예산:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>주소:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>제출 견적:</strong> $%s</li>
            </ul>
          </div>
          
          <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0066cc;">💰 다음 단계: 수수료 입금</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
              고객 정보를 전달받으시려면 <strong>수수료를 입금</strong>해주시기 바랍니다.<br>
              입금 확인 후 고객의 연락처와 상세 정보를 제공해드립니다.
            </p>
            
            <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px;">
              <p style="margin: 0; font-size: 14px;"><strong>입금 계좌:</strong> 국민은행 123456-78-901234</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>예금주:</strong> (주)리노베이션</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>수수료:</strong> 견적 금액의 5%% (최소 50,000원)</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://your-renovation-site.com/contractor" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              업체 대시보드 바로가기
            </a>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666;">
            <p>문의사항이 있으시면 언제든 연락주세요.</p>
            <p>이메일: support@renovation.com | 전화: 1588-1234</p>
          </div>
        </div>
      </div>
    ', 
    contractor_info.contact_name,
    COALESCE(project_info.description, '리노베이션'),
    project_info.space_type,
    project_info.budget,
    project_info.full_address,
    NEW.price
    );
    
    -- Supabase Edge Function 호출하여 이메일 발송
    PERFORM net.http_post(
      url := 'https://your-project-id.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'to', contractor_info.email,
        'subject', '🎉 축하합니다! 프로젝트에 선정되셨습니다 - 수수료 입금 안내',
        'html', email_content,
        'contractor_name', contractor_info.contact_name,
        'company_name', contractor_info.company_name
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS contractor_selection_email_trigger ON contractor_quotes;

CREATE TRIGGER contractor_selection_email_trigger
  AFTER UPDATE ON contractor_quotes
  FOR EACH ROW
  EXECUTE FUNCTION send_contractor_selection_email();
