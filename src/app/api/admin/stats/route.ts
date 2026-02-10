import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [totalRes, activeRes, companiesRes, uploadsRes, byTypeRes, byCropRes, recentRes] = await Promise.all([
      db.query('SELECT COUNT(*) FROM products'),
      db.query('SELECT COUNT(*) FROM products WHERE is_active = true'),
      db.query('SELECT COUNT(DISTINCT company_name) FROM products'),
      db.query('SELECT COUNT(*) FROM upload_history'),
      db.getMany(`SELECT product_type as type, COUNT(*) as count FROM products WHERE product_type IS NOT NULL GROUP BY product_type ORDER BY count DESC LIMIT 10`),
      db.getMany(`SELECT unnest(suitable_crops) as crop, COUNT(*) as count FROM products WHERE suitable_crops IS NOT NULL GROUP BY crop ORDER BY count DESC LIMIT 10`),
      db.getMany(`SELECT a.*, u.email as user_email, u.full_name as user_name FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 10`),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: parseInt(totalRes.rows[0].count),
        activeProducts: parseInt(activeRes.rows[0].count),
        totalCompanies: parseInt(companiesRes.rows[0].count),
        totalUploads: parseInt(uploadsRes.rows[0].count),
        productsByType: byTypeRes,
        productsByCrop: byCropRes,
        recentActivity: recentRes,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
