import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { productSchema, productFilterSchema, validateInput } from '@/lib/validation';
import { createAuditLog, AuditAction } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filterResult = validateInput(productFilterSchema, params);
    const filters = filterResult.success ? filterResult.data : {
      page: 1, limit: 20, sort_by: 'created_at' as const, sort_order: 'desc' as const
    };

    const conditions: string[] = ['is_active = true'];
    const values: any[] = [];
    let idx = 1;

    if (filters.search) {
      conditions.push(`(product_name ILIKE $${idx} OR company_name ILIKE $${idx} OR brand_name ILIKE $${idx} OR product_description ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }
    if (filters.company_name) { conditions.push(`company_name = $${idx}`); values.push(filters.company_name); idx++; }
    if (filters.product_type) { conditions.push(`product_type = $${idx}`); values.push(filters.product_type); idx++; }
    if (filters.brand_name) { conditions.push(`brand_name = $${idx}`); values.push(filters.brand_name); idx++; }
    if (filters.suitable_crops) {
      const crops = filters.suitable_crops.split(',');
      conditions.push(`suitable_crops && $${idx}::text[]`);
      values.push(crops);
      idx++;
    }
    if (filters.applied_seasons) {
      const seasons = filters.applied_seasons.split(',');
      conditions.push(`applied_seasons && $${idx}::text[]`);
      values.push(seasons);
      idx++;
    }
    if (filters.organic_certified && filters.organic_certified !== 'all') {
      conditions.push(`organic_certified = $${idx}`);
      values.push(filters.organic_certified === 'true');
      idx++;
    }
    if (filters.iso_certified && filters.iso_certified !== 'all') {
      conditions.push(`iso_certified = $${idx}`);
      values.push(filters.iso_certified === 'true');
      idx++;
    }
    if (filters.govt_approved && filters.govt_approved !== 'all') {
      conditions.push(`govt_approved = $${idx}`);
      values.push(filters.govt_approved === 'true');
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await db.query(`SELECT COUNT(*) FROM products ${where}`, values);
    const total = parseInt(countResult.rows[0].count);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';

    const products = await db.getMany(
      `SELECT * FROM products ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateInput(productSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const data = validation.data;
    const product = await db.insert('products', {
      ...data,
      product_image_url: data.product_image_url || null,
      source_url: data.source_url || null,
      custom_fields: data.custom_fields ? JSON.stringify(data.custom_fields) : '{}',
      created_by: user.id,
      updated_by: user.id,
    });

    await createAuditLog({
      action: AuditAction.PRODUCT_CREATE,
      entityType: 'product',
      entityId: product.id,
      newValues: data,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Product create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}
