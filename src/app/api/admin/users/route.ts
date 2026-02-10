import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, createUser } from '@/lib/auth';
import { createAuditLog, AuditAction } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin required' }, { status: 403 });
    }
    const users = await db.getMany(
      'SELECT id, email, full_name, role, is_active, last_login_at, created_at FROM users ORDER BY created_at DESC'
    );
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin required' }, { status: 403 });
    }

    const { email, password, fullName, role } = await request.json();
    if (!email || !password || !fullName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const newUser = await createUser(email, password, fullName, role || 'admin');

    await createAuditLog({
      action: AuditAction.USER_CREATE,
      entityType: 'user',
      entityId: newUser.id,
      newValues: { email, fullName, role },
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: { id: newUser.id, email: newUser.email, full_name: newUser.full_name, role: newUser.role } }, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}
