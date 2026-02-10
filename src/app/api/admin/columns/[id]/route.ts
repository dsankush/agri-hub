import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog, AuditAction } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin required' }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const updated = await db.update('product_columns', id, body);
    if (!updated) return NextResponse.json({ success: false, error: 'Column not found' }, { status: 404 });

    await createAuditLog({ action: AuditAction.COLUMN_UPDATE, entityType: 'column', entityId: id, newValues: body, userId: user.id });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update column' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Super admin required' }, { status: 403 });
    }
    const { id } = await params;
    const deleted = await db.delete('product_columns', id);
    if (!deleted) return NextResponse.json({ success: false, error: 'Column not found' }, { status: 404 });

    await createAuditLog({ action: AuditAction.COLUMN_DELETE, entityType: 'column', entityId: id, oldValues: deleted, userId: user.id });
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete column' }, { status: 500 });
  }
}
