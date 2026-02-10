import { Pool } from 'pg';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(prompt);
    
    // Hide input
    (stdin as any).setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    stdin.on('data', function onData(char: string) {
      char = char.toString('utf8');
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          // Enter pressed
          stdin.removeListener('data', onData);
          (stdin as any).setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          // Ctrl+C
          process.exit();
          break;
        case '\u007f':
        case '\b':
          // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.clearLine(0);
            stdout.cursorTo(0);
            stdout.write(prompt + '*'.repeat(password.length));
          }
          break;
        default:
          // Add character
          password += char;
          stdout.write('*');
          break;
      }
    });
  });
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

async function createAdmin() {
  console.log('\n🔐 Create Admin User\n');
  console.log('─'.repeat(50));
  console.log('');
  
  try {
    // Get email
    let email = '';
    while (!email) {
      email = await question('Email: ');
      
      if (!validateEmail(email)) {
        console.log('❌ Invalid email address. Please try again.\n');
        email = '';
      } else {
        // Check if email already exists
        const { rows } = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );
        
        if (rows.length > 0) {
          console.log('❌ A user with this email already exists.\n');
          email = '';
        }
      }
    }
    
    // Get full name
    let fullName = '';
    while (!fullName) {
      fullName = await question('Full Name: ');
      
      if (fullName.trim().length < 2) {
        console.log('❌ Full name must be at least 2 characters.\n');
        fullName = '';
      }
    }
    
    // Get password
    let password = '';
    while (!password) {
      password = await questionHidden('Password: ');
      
      const validation = validatePassword(password);
      if (!validation.valid) {
        console.log('\n❌ Password requirements not met:');
        validation.errors.forEach(err => console.log(`   • ${err}`));
        console.log('');
        password = '';
      }
    }
    
    // Confirm password
    const confirmPassword = await questionHidden('Confirm Password: ');
    
    if (password !== confirmPassword) {
      console.log('\n❌ Passwords do not match!\n');
      rl.close();
      await pool.end();
      process.exit(1);
    }
    
    // Get role
    console.log('\nRole:');
    console.log('  1. Super Admin (full access)');
    console.log('  2. Admin (product management)');
    console.log('  3. Editor (limited editing)');
    console.log('  4. Viewer (read-only)');
    
    let role = '';
    while (!role) {
      const roleChoice = await question('\nSelect role (1-4): ');
      
      switch (roleChoice) {
        case '1':
          role = 'super_admin';
          break;
        case '2':
          role = 'admin';
          break;
        case '3':
          role = 'editor';
          break;
        case '4':
          role = 'viewer';
          break;
        default:
          console.log('❌ Invalid choice. Please enter 1, 2, 3, or 4.');
      }
    }
    
    console.log('\n' + '─'.repeat(50));
    console.log('Review:');
    console.log(`  Email: ${email}`);
    console.log(`  Name:  ${fullName}`);
    console.log(`  Role:  ${role}`);
    console.log('─'.repeat(50));
    
    const confirm = await question('\nCreate this user? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ User creation cancelled.\n');
      rl.close();
      await pool.end();
      process.exit(0);
    }
    
    // Hash password
    console.log('\n🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert user
    console.log('💾 Creating user...');
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role`,
      [email, passwordHash, fullName, role]
    );
    
    const user = rows[0];
    
    console.log('\n✅ Admin user created successfully!\n');
    console.log('─'.repeat(50));
    console.log('User Details:');
    console.log(`  ID:    ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name:  ${user.full_name}`);
    console.log(`  Role:  ${user.role}`);
    console.log('─'.repeat(50));
    console.log('\n🎉 You can now login at: http://localhost:3000/admin/login\n');
    
  } catch (error) {
    console.error('\n❌ Failed to create admin user:', error);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Run
createAdmin();