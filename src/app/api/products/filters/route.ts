import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [companies, types, crops, seasons, states] = await Promise.all([
      db.getMany(`SELECT DISTINCT company_name FROM products WHERE is_active = true AND company_name IS NOT NULL ORDER BY company_name`),
      db.getMany(`SELECT DISTINCT product_type FROM products WHERE is_active = true AND product_type IS NOT NULL ORDER BY product_type`),
      db.getMany(`SELECT DISTINCT unnest(suitable_crops) as crop FROM products WHERE is_active = true ORDER BY crop`),
      db.getMany(`SELECT DISTINCT unnest(applied_seasons) as season FROM products WHERE is_active = true ORDER BY season`),
      db.getMany(`SELECT DISTINCT unnest(available_states) as state FROM products WHERE is_active = true ORDER BY state`),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        companies: companies.map(r => r.company_name),
        productTypes: types.map(r => r.product_type),
        crops: crops.map(r => r.crop),
        seasons: seasons.map(r => r.season),
        states: states.map(r => r.state),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch filters' }, { status: 500 });
  }
}
