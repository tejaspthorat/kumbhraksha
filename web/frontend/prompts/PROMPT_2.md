To transform your current flat mock-data schema into a relational, production-ready system with RBAC (Role-Based Access Control) and optimized state management, use the following prompt and implementation guide.
1. The Optimized Prompt for the AI

Use this prompt to ensure the AI understands the need for relational integrity without breaking your existing UI:

Task: Refactor schema.prisma from a flat mock structure to a Relational DB Model with RBAC and optimize the data fetching layer.

Requirements:

    Relational Mapping: Link Alert, Camera, Staff, and Prediction to a central Zone model using Foreign Keys instead of simple strings.

    RBAC Integration: Connect the Profile model to Supabase Auth (auth.users). Ensure the Role enum governs access to specific relations.

    Performance: Add @index to frequently queried fields (e.g., zoneId, time, resolved) to optimize dashboard queries.

    Zustand Sync: Create a synchronized fetcher in lib/store.ts that populates a global Zustand store from these new relational API endpoints.

    Non-Breaking Transition: Use optional relations or default values where necessary so existing frontend components don't crash during the migration.

    Seed Update: Modify prisma/seed.ts to create the parent records (Zones, Profiles) first, then map the mock data to these IDs.

2. Refactored schema.prisma (Relational & Optimized)

This structure introduces relations while maintaining compatibility.
Code snippet

// Optimized Relational Schema
enum Role {
  ADMIN
  STAFF
  USER
}

model Profile {
  id    String @id // This should match Supabase auth.users.id
  email String @unique
  role  Role   @default(USER)

  @@index([email])
}

model Zone {
  id          Int           @id @default(autoincrement())
  name        String        @unique
  people      Int           @default(0)
  area        Int
  density     Float
  level       String        // e.g., 'High', 'Medium', 'Low'
  
  // Relations
  alerts      Alert[]
  cameras     Camera[]
  staff       Staff[]
  predictions Prediction[]
  log         AlertLog[]

  @@index([name])
}

model Alert {
  id          Int      @id @default(autoincrement())
  type        String
  level       String
  title       String
  description String
  time        DateTime @default(now())
  resolved    Boolean  @default(false)
  
  // Foreign Key
  zoneId      Int
  zone        Zone     @relation(fields: [zoneId], references: [id])

  @@index([zoneId, resolved])
}

model Staff {
  id       Int    @id @default(autoincrement())
  name     String
  role     String
  status   String
  avatar   String
  tasks    Int
  lastSeen String

  // Foreign Key
  zoneId   Int
  zone     Zone   @relation(fields: [zoneId], references: [id])

  @@index([zoneId])
}
// ... repeat pattern for Camera, Prediction, etc.

3. Enhanced proxy.ts (Next.js Middleware)

This middleware handles the security layer by inspecting the JWT and enforcing route guards.
TypeScript

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('supabase-auth-token')?.value
  const { pathname } = request.nextUrl

  // 1. Public Routes
  if (pathname.startsWith('/login') || pathname.startsWith('/public-api')) {
    return NextResponse.next()
  }

  // 2. Token Check
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const secret = process.env.SUPABASE_JWT_SECRET!
    const decoded = jwt.verify(token, secret) as any
    const userRole = decoded.user_role || 'USER'

    // 3. RBAC Enforcement
    // Admin only routes
    if (pathname.startsWith('/dashboard/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 4. Header Injection for downstream API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', decoded.sub)
    response.headers.set('x-user-role', userRole)
    
    return response

  } catch (err) {
    // If token is expired or tampered
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/private/:path*',
  ],
}

4. Implementation Steps
Step	Action	Command/File
1	Generate the new client	npx prisma generate
2	Push schema changes	npx prisma db push
3	Update Seed Data	Edit prisma/seed.ts to create Zones first.
4	Global State	Create lib/store.ts using Zustand to fetch /api/zones.