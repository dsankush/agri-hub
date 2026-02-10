import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { columnSchema, validateInput } from '@/lib/validation';
import { createAuditLog, AuditAction } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const columns = await db.getMany('SELECT * FROM product_columns ORDER BY display_order, created_at');
    return NextResponse.json({ success: true, data: columns });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch columns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateInput(columnSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const column = await db.insert('product_columns', validation.data);

    await createAuditLog({
      action: AuditAction.COLUMN_CREATE,
      entityType: 'column',
      entityId: column.id,
      newValues: validation.data,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: column }, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ success: false, error: 'Column name already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create column' }, { status: 500 });
  }
}
