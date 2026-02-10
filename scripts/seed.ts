import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sampleProducts = [
  {
    company_name: 'Syngenta India', product_name: 'Fortenza Duo', brand_name: 'Fortenza Duo',
    product_description: 'Combination seed treatment insecticide for corn that protects seedlings from early-season pests',
    product_type: 'Insecticide (Seedcare)', sub_type: 'Diamide + Neonicotinoid',
    applied_seasons: ['Kharif'], suitable_crops: ['Maize'],
    benefits: 'Long-lasting early pest protection', dosage: '4 ml/kg seed',
    application_method: 'Seed treatment', pack_sizes: ['32 ml', '20 L'],
    organic_certified: false, iso_certified: false, govt_approved: false,
    source_url: 'https://www.syngenta.co.in/fortenza-duo',
  },
  {
    company_name: 'Bayer CropScience', product_name: 'Confidor', brand_name: 'Confidor',
    product_description: 'Systemic insecticide with contact and stomach action',
    product_type: 'Insecticide', sub_type: 'Neonicotinoid',
    applied_seasons: ['Kharif', 'Rabi'], suitable_crops: ['Cotton', 'Rice', 'Vegetables'],
    benefits: 'Effective against sucking pests, long residual activity', dosage: '0.3-0.5 ml/L',
    application_method: 'Foliar spray', pack_sizes: ['100 ml', '250 ml', '500 ml', '1 L'],
    price_range: '₹400-2000', available_states: ['Punjab', 'Haryana', 'Maharashtra', 'Gujarat'],
    organic_certified: false, iso_certified: true, govt_approved: true,
  },
  {
    company_name: 'UPL Limited', product_name: 'Saaf', brand_name: 'Saaf',
    product_description: 'Broad spectrum fungicide for control of various fungal diseases',
    product_type: 'Fungicide', sub_type: 'Combination',
    applied_seasons: ['Kharif', 'Rabi', 'Zaid'], suitable_crops: ['Wheat', 'Rice', 'Vegetables', 'Fruits'],
    benefits: 'Preventive and curative action, broad spectrum control', dosage: '2 g/L',
    application_method: 'Foliar spray', pack_sizes: ['50 g', '250 g', '500 g', '1 kg'],
    price_range: '₹100-1500', available_states: ['All India'],
    organic_certified: false, iso_certified: true, govt_approved: true,
  },
  {
    company_name: 'Coromandel International', product_name: 'Gromor NPK 19:19:19', brand_name: 'Gromor',
    product_description: 'Water soluble fertilizer with balanced NPK ratio',
    product_type: 'Fertilizer', sub_type: 'Water Soluble',
    applied_seasons: ['All seasons'], suitable_crops: ['All crops'],
    benefits: 'Complete nutrition, quick absorption, no residue', dosage: '5 g/L',
    application_method: 'Drip irrigation / Foliar spray', pack_sizes: ['1 kg', '5 kg', '25 kg'],
    price_range: '₹200-4000', available_states: ['Karnataka', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu'],
    organic_certified: false, iso_certified: true, govt_approved: true,
  },
  {
    company_name: 'PI Industries', product_name: 'Nominee Gold', brand_name: 'Nominee Gold',
    product_description: 'Selective herbicide for control of weeds in rice',
    product_type: 'Herbicide', sub_type: 'Selective',
    applied_seasons: ['Kharif'], suitable_crops: ['Rice'],
    benefits: 'Effective against broad-leaf and grassy weeds', dosage: '120 ml/acre',
    application_method: 'Broadcast spray', pack_sizes: ['250 ml', '500 ml', '1 L'],
    price_range: '₹500-2500', available_states: ['West Bengal', 'Odisha', 'Bihar', 'Uttar Pradesh'],
    organic_certified: false, iso_certified: true, govt_approved: true,
  },
  {
    company_name: 'BASF India', product_name: 'Serifel', brand_name: 'Serifel',
    product_description: 'Biological insecticide based on entomopathogenic fungi',
    product_type: 'Bio-Insecticide', sub_type: 'Biological',
    applied_seasons: ['All seasons'], suitable_crops: ['Cotton', 'Vegetables', 'Fruits'],
    benefits: 'Eco-friendly, no residue, safe for beneficial insects', dosage: '2 ml/L',
    application_method: 'Foliar spray', pack_sizes: ['100 ml', '250 ml', '500 ml'],
    price_range: '₹800-3000', available_states: ['All India'],
    organic_certified: true, iso_certified: true, govt_approved: true,
  },
  {
    company_name: 'Dhanuka Agritech', product_name: 'EM-1', brand_name: 'EM-1',
    product_description: 'Broad spectrum fungicide for multiple crops',
    product_type: 'Fungicide', sub_type: 'Contact',
    applied_seasons: ['Kharif', 'Rabi'], suitable_crops: ['Grapes', 'Tomato', 'Potato', 'Onion'],
    benefits: 'Prevents and controls fungal diseases', dosage: '2-2.5 g/L',
    application_method: 'Foliar spray', pack_sizes: ['100 g', '250 g', '500 g', '1 kg'],
    price_range: '₹150-2000', available_states: ['Maharashtra', 'Karnataka', 'Gujarat'],
    organic_certified: false, iso_certified: true, govt_approved: true,
  },
  {
    company_name: 'Rallis India', product_name: 'Tata Manik', brand_name: 'Tata Manik',
    product_description: 'Selective herbicide for soybean crop',
    product_type: 'Herbicide', sub_type: 'Selective',
    applied_seasons: ['Kharif'], suitable_crops: ['Soybean'],
    benefits: 'Controls broad-leaf weeds effectively', dosage: '1 L/acre',
    application_method: 'Post-emergence spray', pack_sizes: ['500 ml', '1 L', '5 L'],
    price_range: '₹600-5000', available_states: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan'],
    organic_certified: false, iso_certified: true, govt_approved: true,
  },
  {
    company_name: 'Sumitomo Chemical', product_name: 'Plethora', brand_name: 'Plethora',
    product_description: 'Broad spectrum fungicide for various crops',
    product_type: 'Fungicide', sub_type: 'Systemic',
    applied_seasons: ['Kharif', 'Rabi'], suitable_crops: ['Wheat', 'Rice', 'Soybean', 'Chilli'],
    benefits: 'Preventive and curative, rainfast', dosage: '1 ml/L',
    application_method: 'Foliar spray', pack_sizes: ['100 ml', '250 ml', '500 ml', '1 L'],
    price_range: '₹500-4000', available_states: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar'],
    organic_certified: false, iso_certified: true, govt_approved: true,
  },
  {
    company_name: 'Godrej Agrovet', product_name: 'Manik Gold', brand_name: 'Manik Gold',
    product_description: 'Plant growth regulator for cotton',
    product_type: 'Plant Growth Regulator', sub_type: 'PGR',
    applied_seasons: ['Kharif'], suitable_crops: ['Cotton'],
    benefits: 'Reduces plant height, increases yield, better boll retention', dosage: '50-75 ml/acre',
    application_method: 'Foliar spray', pack_sizes: ['100 ml', '250 ml', '500 ml'],
    price_range: '₹300-1500', available_states: ['Gujarat', 'Maharashtra', 'Telangana', 'Karnataka'],
    organic_certified: false, iso_certified: true, govt_approved: true,
  },
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  try {
    let inserted = 0;
    for (const p of sampleProducts) {
      try {
        await pool.query(
          `INSERT INTO products (company_name, product_name, brand_name, product_description, product_type, sub_type, applied_seasons, suitable_crops, benefits, dosage, application_method, pack_sizes, price_range, available_states, organic_certified, iso_certified, govt_approved, source_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [p.company_name, p.product_name, p.brand_name, p.product_description, p.product_type, p.sub_type,
           p.applied_seasons, p.suitable_crops, p.benefits, p.dosage, p.application_method, p.pack_sizes,
           (p as any).price_range || null, (p as any).available_states || null,
           p.organic_certified, p.iso_certified, p.govt_approved, (p as any).source_url || null]
        );
        console.log(`✅ ${p.product_name} (${p.company_name})`);
        inserted++;
      } catch (e: any) {
        if (e.code === '23505') console.log(`⏭️  Skipped: ${p.product_name}`);
        else throw e;
      }
    }
    console.log(`\n✅ Seeded ${inserted} products!\n`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
