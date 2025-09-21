import { NextRequest, NextResponse } from 'next/server';
import { sendContractorSelectionEmails, ContractorSelectionData } from '@/lib/contractor-selection';
import { createServerClient } from '@/lib/supabase/server-clients';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractorId, customerId, projectId, quoteId } = body;

    if (!contractorId || !customerId || !projectId || !quoteId) {
      return NextResponse.json(
        { error: 'Missing required fields: contractorId, customerId, projectId, quoteId' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createServerClient();

    // 업체 정보 조회
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('id, email, name, company_name, contact_name, phone')
      .eq('id', contractorId)
      .single();

    if (contractorError || !contractor) {
      console.error('Error fetching contractor:', contractorError);
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // 고객 정보 조회 (users 테이블에서)
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // 프로젝트 정보 조회
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('id, project_type, space_type, address')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 견적 정보 조회
    const { data: quote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .select('id, price')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('Error fetching quote:', quoteError);
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // 이메일 데이터 구성
    const emailData: ContractorSelectionData = {
      contractor: {
        id: contractor.id,
        email: contractor.email,
        name: contractor.name || contractor.contact_name || '업체 담당자',
        company_name: contractor.company_name || '업체명',
        contact_name: contractor.contact_name || contractor.name || '담당자',
        phone: contractor.phone
      },
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name || '고객님'
      },
      project: {
        id: project.id,
        project_type: project.project_type,
        space_type: project.space_type,
        address: project.address
      },
      quote: {
        id: quote.id,
        price: quote.price
      }
    };

    // 이메일 발송
    const emailResult = await sendContractorSelectionEmails(emailData);

    if (!emailResult.success) {
      console.error('Failed to send emails:', emailResult);
      return NextResponse.json(
        { 
          error: 'Failed to send notification emails',
          details: emailResult.results
        },
        { status: 500 }
      );
    }

    // 견적 상태를 'accepted'로 업데이트 (선택사항)
    const { error: updateError } = await supabase
      .from('contractor_quotes')
      .update({ status: 'accepted' })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating quote status:', updateError);
      // 이메일은 발송되었으므로 경고만 로그
    }

    return NextResponse.json({
      success: true,
      message: 'Contractor selection emails sent successfully',
      emailResults: emailResult.results
    });

  } catch (error: any) {
    console.error('Error in contractor selection API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}