import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    // 테스트 이메일 발송
    const testEmail = {
      to: 'mingun.ryan.choi@gmail.com', // 여기에 테스트할 이메일 주소 입력
      subject: '🧪 Canada Beaver - Mailgun 테스트 이메일',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
            .success { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Mailgun 설정 성공!</h1>
            </div>
            <p class="success">✅ 이메일이 정상적으로 발송되었습니다!</p>
            <p>Canada Beaver 플랫폼의 Mailgun 이메일 서비스가 올바르게 설정되었습니다.</p>
            
            <h3>설정 정보:</h3>
            <ul>
              <li>도메인: ${process.env.MAILGUN_DOMAIN}</li>
              <li>발송 시간: ${new Date().toLocaleString('ko-KR')}</li>
              <li>환경: ${process.env.NODE_ENV}</li>
            </ul>
            
            <p>이제 업체 선정 시 자동으로 이메일이 발송됩니다!</p>
            
            <div style="margin-top: 30px; padding: 15px; background: #e7f3ff; border-radius: 5px;">
              <h4>📧 사용 가능한 기능:</h4>
              <ul>
                <li>업체 선정 축하 이메일</li>
                <li>고객 알림 이메일</li>
                <li>수수료 계산 및 안내</li>
                <li>한국어 템플릿</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `,
      text: 'Mailgun 테스트 이메일입니다.'
    };

    const result = await sendEmail(testEmail);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '테스트 이메일이 발송되었습니다. 이메일함을 확인해주세요!',
        messageId: result.messageId,
        sentTo: testEmail.to
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '이메일 발송 실패',
        error: result.error
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '알 수 없는 오류가 발생했습니다',
      details: error
    }, { status: 500 });
  }
}

// POST 메서드로 특정 이메일 주소로 테스트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: '이메일 주소를 입력해주세요'
      }, { status: 400 });
    }
    
    const testEmail = {
      to: email,
      subject: '🧪 Canada Beaver - 업체 선정 알림 테스트',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #4A90E2;">🧪 테스트 이메일입니다</h2>
            <p>이 이메일은 Canada Beaver 플랫폼에서 발송된 테스트 이메일입니다.</p>
            <p>실제 업체 선정 시에는 더 상세한 정보가 포함됩니다:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 포함될 정보:</h3>
              <ul>
                <li>프로젝트 상세 정보</li>
                <li>견적 금액</li>
                <li>수수료 계산</li>
                <li>다음 단계 안내</li>
                <li>연락처 정보</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px;">발송 시간: ${new Date().toLocaleString('ko-KR')}</p>
          </div>
        </body>
        </html>
      `
    };
    
    const result = await sendEmail(testEmail);
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? `${email}로 테스트 이메일을 발송했습니다` : '발송 실패',
      error: result.error,
      messageId: result.success ? result.messageId : undefined
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
