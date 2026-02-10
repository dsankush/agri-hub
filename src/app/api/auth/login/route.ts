import { NextRequest, NextResponse } from 'next/server';
import { login, setAuthCookie } from '@/lib/auth';
import { loginSchema, validateInput } from '@/lib/validation';
import { createAuditLog, AuditAction } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateInput(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const { email, password } = validation.data;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const result = await login(email, password, ip, ua);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    await setAuthCookie(result.token);
    await createAuditLog({
      action: AuditAction.LOGIN,
      entityType: 'session',
      userId: result.user.id,
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({
      success: true,
      data: { user: { id: result.user.id, email: result.user.email, full_name: result.user.full_name, role: result.user.role } },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
