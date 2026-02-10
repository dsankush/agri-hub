import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { productSchema, validateInput } from '@/lib/validation';
import { createAuditLog, AuditAction } from '@/lib/audit';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await db.getOne('SELECT * FROM products WHERE id = $1', [id]);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    // Increment view count
    await db.query('UPDATE products SET view_count = view_count + 1 WHERE id = $1', [id]);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const oldProduct = await db.getOne('SELECT * FROM products WHERE id = $1', [id]);
    if (!oldProduct) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateInput(productSchema.partial(), body);
    if (!validation.success) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const data = validation.data;
    const updated = await db.update('products', id, {
      ...data,
      product_image_url: data.product_image_url || null,
      source_url: data.source_url || null,
      updated_by: user.id,
    });

    await createAuditLog({
      action: AuditAction.PRODUCT_UPDATE,
      entityType: 'product',
      entityId: id,
      oldValues: oldProduct,
      newValues: data,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await db.delete('products', id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    await createAuditLog({
      action: AuditAction.PRODUCT_DELETE,
      entityType: 'product',
      entityId: id,
      oldValues: deleted,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
  }
}
