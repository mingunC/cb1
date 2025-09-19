-- Fix the send_contractor_selection_email function
CREATE OR REPLACE FUNCTION send_contractor_selection_email()
RETURNS TRIGGER AS $$
DECLARE
    project_info RECORD;
    contractor_info RECORD;
    email_subject TEXT;
    email_body TEXT;
BEGIN
    -- Get project and customer information
    SELECT 
        qr.space_type,
        qr.project_types,
        qr.budget,
        qr.full_address,
        qr.description,
        u.email as customer_email,
        COALESCE(
            u.raw_user_meta_data->>'name',
            u.raw_user_meta_data->>'full_name',
            u.email
        ) as customer_name
    INTO project_info
    FROM quote_requests qr
    LEFT JOIN auth.users u ON qr.customer_id = u.id
    WHERE qr.id = NEW.project_id;
    
    -- Get contractor information
    SELECT 
        c.company_name,
        c.contact_name,
        c.phone,
        c.email as contractor_email
    INTO contractor_info
    FROM contractors c
    WHERE c.id = NEW.contractor_id;
    
    -- Create email subject
    email_subject := '업체 선택 완료 알림 - ' || contractor_info.company_name;
    
    -- Create email body
    email_body := format('
안녕하세요 %s님,

귀하의 프로젝트에 대한 업체 선택이 완료되었습니다.

선택된 업체: %s
담당자: %s
연락처: %s

프로젝트 정보:
- 공간 유형: %s
- 주소: %s
- 예산: %s

선택된 업체에서 곧 연락드릴 예정입니다.

감사합니다.
',
        project_info.customer_name,
        contractor_info.company_name,
        COALESCE(contractor_info.contact_name, '담당자'),
        COALESCE(contractor_info.phone, '등록된 연락처 없음'),
        project_info.space_type,
        project_info.full_address,
        project_info.budget
    );
    
    -- Insert into email queue or send email
    -- (This would typically integrate with your email service)
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE NOTICE 'Email sending failed: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
