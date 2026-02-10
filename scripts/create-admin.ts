import { Pool } from 'pg';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise(r => rl.question(q, r));

async function createAdmin() {
  console.log('\n🔐 Create Admin User\n');
  try {
    const email = await ask('Email: ');
    const fullName = await ask('Full Name: ');
    const password = await ask('Password: ');
    
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'super_admin') RETURNING id, email, full_name, role`,
      [email, passwordHash, fullName]
    );
    
    console.log(`\n✅ Created: ${rows[0].email} (${rows[0].role})\n`);
  } catch (e) {
    console.error('❌ Failed:', e);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
