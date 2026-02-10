import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
}
