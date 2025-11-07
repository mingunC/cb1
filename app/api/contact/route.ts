import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Mailgun API configuration
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN
    const TO_EMAIL = process.env.CONTACT_EMAIL || 'admin@canadabeaver.pro'

    // 🔍 디버깅 로그 추가
    console.log('==========================================')
    console.log('📧 환경 변수 확인:')
    console.log('CONTACT_EMAIL:', process.env.CONTACT_EMAIL)
    console.log('TO_EMAIL (실제 사용):', TO_EMAIL)
    console.log('MAILGUN_DOMAIN:', MAILGUN_DOMAIN)
    console.log('==========================================')

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error('Mailgun configuration missing')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Prepare email content
    const emailData = new FormData()
    emailData.append('from', `Contact Form <noreply@${MAILGUN_DOMAIN}>`)
    emailData.append('to', TO_EMAIL)
    emailData.append('subject', `Contact Form: ${subject}`)
    emailData.append('text', `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `)
    emailData.append('html', `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `)
    emailData.append('h:Reply-To', email)

    // Send email via Mailgun
    const response = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
        },
        body: emailData,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Mailgun error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    const result = await response.json()
    console.log('Email sent successfully:', result)

    return NextResponse.json(
      { success: true, message: 'Email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}