import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const result = await getAuditLogs({
      page: parseInt(params.page || '1'),
      limit: parseInt(params.limit || '50'),
      action: params.action,
      entityType: params.entityType,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
