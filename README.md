# AgriHub - Agricultural Product Knowledge Hub

A full-stack secure web application for discovering and managing agricultural products. Built with Next.js 14, PostgreSQL (Supabase), and deployable on Vercel free tier.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure .env.local with your Supabase credentials

# 3. Run database migrations
npm run db:migrate

# 4. Seed sample data (10 products)
npm run db:seed

# 5. Create admin user
npm run create-admin

# 6. Start development server
npm run dev
```

- Public site: http://localhost:3000
- Admin panel: http://localhost:3000/admin/login

## Deploy to Vercel

1. Push code to GitHub
2. Import repo in Vercel
3. Add env variables: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `NEXTAUTH_URL`
4. Deploy

## Features

**Public:** Product search, filters (company/type/crop/season/certifications), card + table view, pagination, responsive

**Admin:** Secure login, product CRUD, bulk CSV upload, dynamic column manager, user management, audit logs, dashboard stats

**Security:** JWT + HttpOnly cookies, bcrypt, parameterized queries, role-based access, session management, audit trail

**Tech:** Next.js App Router, Tailwind CSS, PostgreSQL, Supabase Storage, Zod validation
