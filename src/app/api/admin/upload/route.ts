import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog, AuditAction } from '@/lib/audit';
import Papa from 'papaparse';

const FIELD_MAPPING: Record<string, string> = {
  'company_name': 'company_name', 'company': 'company_name',
  'product_name': 'product_name', 'product': 'product_name',
  'brand_name': 'brand_name', 'brand': 'brand_name',
  'product_description': 'product_description', 'description': 'product_description',
  'product_type': 'product_type', 'type': 'product_type',
  'sub_type': 'sub_type', 'subtype': 'sub_type',
  'applied_seasons': 'applied_seasons', 'seasons': 'applied_seasons',
  'suitable_crops': 'suitable_crops', 'crops': 'suitable_crops',
  'benefits': 'benefits', 'dosage': 'dosage',
  'application_method': 'application_method',
  'pack_sizes': 'pack_sizes', 'price_range': 'price_range',
  'available_states': 'available_states', 'states': 'available_states',
  'organic_certified': 'organic_certified', 'organic': 'organic_certified',
  'iso_certified': 'iso_certified', 'iso': 'iso_certified',
  'govt_approved': 'govt_approved', 'government_approved': 'govt_approved',
  'product_image_url': 'product_image_url', 'image_url': 'product_image_url',
  'source_url': 'source_url', 'notes': 'notes',
};

function parseArrayField(value: string): string[] {
  if (!value) return [];
  return value.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}

function parseBooleanField(value: string): boolean {
  const v = value?.toString().toLowerCase().trim();
  return ['true', 'yes', '1', 'y'].includes(v);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx'].includes(ext || '')) {
      return NextResponse.json({ success: false, error: 'Only CSV and XLSX files are supported' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ success: false, error: 'CSV parse errors', errors: parsed.errors }, { status: 400 });
    }

    const rows = parsed.data as Record<string, string>[];
    const errors: { row: number; message: string }[] = [];
    let successful = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const raw = rows[i];
        const mapped: Record<string, any> = {};

        for (const [key, value] of Object.entries(raw)) {
          const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
          const dbField = FIELD_MAPPING[normalizedKey];
          if (dbField) mapped[dbField] = value;
        }

        if (!mapped.company_name || !mapped.product_name) {
          errors.push({ row: i + 2, message: 'Missing company_name or product_name' });
          continue;
        }

        // Parse special fields
        const arrayFields = ['applied_seasons', 'suitable_crops', 'pack_sizes', 'available_states'];
        for (const f of arrayFields) {
          if (mapped[f] && typeof mapped[f] === 'string') mapped[f] = parseArrayField(mapped[f]);
        }

        const boolFields = ['organic_certified', 'iso_certified', 'govt_approved'];
        for (const f of boolFields) {
          mapped[f] = parseBooleanField(mapped[f] || 'false');
        }

        mapped.created_by = user.id;
        mapped.updated_by = user.id;

        await db.insert('products', mapped);
        successful++;
      } catch (error: any) {
        errors.push({ row: i + 2, message: error.message || 'Unknown error' });
      }
    }

    // Record upload history
    await db.insert('upload_history', {
      user_id: user.id,
      filename: file.name,
      file_type: ext,
      total_rows: rows.length,
      successful_rows: successful,
      failed_rows: errors.length,
      error_log: errors.length > 0 ? JSON.stringify(errors) : null,
    });

    await createAuditLog({
      action: AuditAction.PRODUCT_BULK_UPLOAD,
      entityType: 'upload',
      newValues: { filename: file.name, total: rows.length, successful, failed: errors.length },
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: { totalRows: rows.length, successfulRows: successful, failedRows: errors.length, errors },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
