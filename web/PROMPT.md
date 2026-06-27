Role: Expert Full-Stack Engineer & Database Architect.
Task: Devise a technical migration plan and generate code to transition from local mock data to a persistent Supabase/Prisma backend.

Constraints:

    Context: Analyze all current useState and useEffect hooks in the src/ directory to identify data shapes.

    Infrastructure: * Initialize Prisma using DATABASE_URL from .env.

        Extract all required fields from existing mock objects to create a comprehensive schema.prisma.

        Implement Role-Based Access Control (RBAC) within the schema (e.g., Admin, Staff, User).

    Authentication & Middleware:

        Create a Next.js proxy.ts (middleware) to verify Supabase JWTs and user roles.

        Optimization: Implement a mechanism to store the user auth token/session in a way that minimizes redundant supabase.auth.getUser() calls.

    Data Seeding & State:

        Create prisma/seed.js using the current mock data as the initial production dataset.

        Remove all hardcoded mock data instances across the codebase.

        Initialize Zustand stores to fetch data from the new Prisma API endpoints. This state must drive all existing graphs, diagrams, and charts.

    Safety: Ensure all changes are non-breaking and include a regression checklist to verify that UI components still render correctly with the new async data flow.

Output Required:

    The updated schema.prisma.

    The proxy.ts middleware logic.

    The Zustand store implementation.

    A step-by-step execution plan for the terminal.

Suggested Technical Plan for You

If you are executing this yourself, here is the architectural flow you should follow:
1. Database Schema (RBAC)

In your schema.prisma, ensure you link the Supabase auth.users table to your public User profile to manage roles.
Code snippet

enum Role {
  ADMIN
  USER
  STAFF
}

model Profile {
  id    String @id @default(uuid())
  email String @unique
  role  Role   @default(USER)
  // Add fields extracted from your mock data here
}

2. The Middleware Proxy (proxy.ts)

To avoid hitting the Supabase API on every single internal request, verify the JWT locally using the SUPABASE_JWT_SECRET.

    Token Storage: Use a secure, HTTP-only cookie to store the session.

    Role Check: Decode the JWT to check the role claim before allowing the request to proceed to your API routes.

3. State Management (Zustand)

Instead of calling useEffect in every chart component, create a global store:

    Hydration: Fetch data in a top-level layout.tsx or a dedicated provider.

    Selectors: Have your charts subscribe to specific slices of the Zustand store to prevent unnecessary re-renders.

4. Regression Testing

    Type Check: Run npx tsc --noEmit after removing mock data. If the types match your Prisma-generated types, your UI components shouldn't break.

    Loading States: Since you're moving from instant mock data to async DB calls, ensure every component has a skeleton or loading spinner.