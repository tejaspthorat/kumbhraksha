You are an expert full-stack developer working on a hackathon project called 
"Crowd Management" — an AI-powered real-time crowd monitoring and decision 
system using camera feeds + YOLOv8 + Next.js.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT STACK (read-only context, do not change these)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Framework: Next.js 16.2.1, App Router, TypeScript
- Styling: Tailwind CSS v4, Framer Motion
- State: Zustand (web/src/lib/store.ts)
- Auth: Clerk
- DB: Prisma ORM + PostgreSQL (Supabase)
- Charts: Recharts
- ML Backend: FastAPI + YOLOv8 + OpenCV (fast-api/)
- Mock data lives in: web/src/lib/mock-data.ts
- API routes live in: web/src/app/api/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0 — READ BEFORE TOUCHING ANYTHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Read these files completely and map their data shapes before writing any code:

1. web/src/lib/store.ts
   → Identify every state slice, action, and TypeScript type

2. web/src/lib/mock-data.ts
   → Identify every hardcoded value used across the dashboard

3. web/src/app/api/ (all route files)
   → Map every existing API endpoint, its request/response shape

4. web/src/components/ — find and read these specific files:
   → predictions component (any file named predictions.tsx or similar)
   → suggestions component
   → decisions component
   → density component
   → Any dashboard page that renders these components

5. web/src/app/dashboard/ (main dashboard page)
   → Understand how components are assembled and what props flow down

After reading, produce a file map like:
  FILE → static fields found → store slice to wire → GROQ function to call
Do not write any code yet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — STORE EXTENSION (non-breaking additions only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
In web/src/lib/store.ts, ADD (never remove) new state slices:

interface ZoneDensity {
  zoneId: string
  zoneName: string
  currentCount: number
  maxCapacity: number
  fillPercent: number        // currentCount / maxCapacity * 100
  entryRate: number          // people/min entering
  exitRate: number           // people/min leaving
  status: "safe" | "warning" | "critical"
}

interface Prediction {
  zoneId: string
  zoneName: string
  predictedCount: number
  timeToOvercrowd: number | null  // minutes, null if safe
  confidence: number              // 0-100
  trend: "rising" | "falling" | "stable"
}

interface Suggestion {
  id: string
  zoneId: string
  action: string             // e.g. "Redirect members to Zone C"
  priority: "critical" | "high" | "medium" | "low"
  reason: string
  affectedZones: string[]
}

interface Decision {
  id: string
  decision: string
  urgency: "critical" | "high" | "medium" | "low"
  affectedZones: string[]
  actionType: "stop_entry" | "limit_entry" | "redirect" | "open_zone" | "alert_staff"
  executedAt: string | null
}

Add to store:
  densityData: ZoneDensity[]
  predictions: Prediction[]
  suggestions: Suggestion[]
  decisions: Decision[]
  groqLoading: boolean
  groqError: string | null
  lastGroqRun: Date | null

Add actions:
  setDensityData, setPredictions, setSuggestions, setDecisions,
  setGroqLoading, setGroqError, refreshGroqInsights

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — DATA FETCHING FROM FASTAPI + PRISMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create web/src/lib/api.ts (or update existing):

fetchDensityData():
  → Call FastAPI endpoint (fast-api/app.py) for real YOLOv8 crowd counts per zone
  → Fallback: query Prisma DB for last known zone counts
  → Shape response into ZoneDensity[] and call setDensityData()

The FastAPI server returns camera detections — map camera IDs to zone IDs using 
cameras.json at the repo root.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — GROQ SERVICE (new file)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create web/src/lib/groqService.ts

Read GROQ_API_KEY from process.env.GROQ_API_KEY (server-side Next.js)
Model: "llama3-8b-8192"

IMPORTANT: All GROQ calls must go through a Next.js API route 
(web/src/app/api/groq/route.ts) to keep the key server-side only.
Never expose GROQ_API_KEY to the browser.

━━━━━ GROQ FUNCTION 1: generatePredictions ━━━━━
Input: ZoneDensity[]
System prompt:
"""
You are an AI crowd safety analyst for a live event venue. 
You receive real-time zone density data captured by YOLOv8 cameras.
Your job: predict which zones will overcrowd in the next 15-30 minutes.

Rules:
- A zone is "critical" if fillPercent > 90
- A zone is "warning" if fillPercent > 75
- Calculate timeToOvercrowd using entryRate vs exitRate delta
- Return ONLY valid JSON, no markdown, no explanation

Response format:
{
  "predictions": [
    {
      "zoneId": "string",
      "zoneName": "string", 
      "predictedCount": number,
      "timeToOvercrowd": number | null,
      "confidence": number,
      "trend": "rising" | "falling" | "stable"
    }
  ]
}
"""
User message: "Current zone data: ${JSON.stringify(densityData)}"

━━━━━ GROQ FUNCTION 2: generateSuggestions ━━━━━
Input: ZoneDensity[], Prediction[]
System prompt:
"""
You are an AI crowd flow manager at a public safety event.
You have real-time density data and AI predictions for each zone.
Your job: generate specific, actionable crowd management suggestions.

Possible actions you can suggest:
- "Stop entry at [gate/zone]"
- "Limit entry to [zone] to [N] persons per minute"  
- "Redirect attendees from [Zone A] to [Zone B]"
- "Open overflow zone [X]"
- "Deploy staff to [zone] for crowd control"
- "Announce via PA to move to [zone]"

Rules:
- Prioritize zones with timeToOvercrowd < 10 minutes as "critical"
- Zones with timeToOvercrowd 10-20 min are "high"
- Always suggest a receiving zone when redirecting
- Return ONLY valid JSON

Response format:
{
  "suggestions": [
    {
      "id": "string",
      "zoneId": "string",
      "action": "string",
      "priority": "critical" | "high" | "medium" | "low",
      "reason": "string",
      "affectedZones": ["string"]
    }
  ]
}
"""
User message: 
"Zone density: ${JSON.stringify(densityData)}
Predictions: ${JSON.stringify(predictions)}"

━━━━━ GROQ FUNCTION 3: generateDecisions ━━━━━
Input: Suggestion[], ZoneDensity[]
System prompt:
"""
You are the final decision engine for a crowd safety command center.
You receive AI-generated suggestions ranked by priority.
Your job: produce a final ordered list of decisions to execute RIGHT NOW.

Rules:
- Rank decisions: critical first, then high, medium, low
- Merge duplicate suggestions for the same zone
- Assign a concrete actionType to each decision
- If a zone is above 95% capacity, always include a stop_entry decision
- Return ONLY valid JSON

Response format:
{
  "decisions": [
    {
      "id": "string",
      "decision": "string",
      "urgency": "critical" | "high" | "medium" | "low",
      "affectedZones": ["string"],
      "actionType": "stop_entry" | "limit_entry" | "redirect" | "open_zone" | "alert_staff"
    }
  ]
}
"""
User message:
"Suggestions: ${JSON.stringify(suggestions)}
Current density: ${JSON.stringify(densityData)}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — API ROUTE FOR GROQ (server-side key protection)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create web/src/app/api/groq/route.ts

POST handler accepts:
  { type: "predictions" | "suggestions" | "decisions", payload: any }

Calls the appropriate groqService function server-side.
Returns the parsed JSON result.
Handles errors and returns { error: string } on failure.

Add to web/.env.local:
  GROQ_API_KEY=your_key_here
  FASTAPI_URL=http://localhost:8000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — UI COMPONENT UPDATES (non-breaking)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For each component, replace static/mock data with store selectors.
Never remove existing JSX structure — only update data sources.

density component:
  - Map densityData[] from store
  - Per zone: show name, currentCount/maxCapacity, animated fill bar
  - Color: green < 75%, orange 75-90%, red > 90%
  - Use Recharts BarChart or RadialBar for zone fill visualization
  - Animate transitions with Framer Motion

predictions component:
  - Map predictions[] from store
  - Show: zone name, trend icon (↑↓→), confidence badge, timeToOvercrowd
  - Dynamic icon: clock icon for time, fire icon if critical
  - Skeleton loader when groqLoading === true

suggestions component:
  - Map suggestions[] from store
  - Card per suggestion: action text, priority badge (color-coded), reason, zones
  - Priority colors: red=critical, orange=high, yellow=medium, green=low
  - Add "Refresh" button → triggers refreshGroqInsights action

decisions component:
  - Map decisions[] from store, sorted by urgency (critical first)
  - Each card: decision text, urgency chip, actionType icon, affected zones
  - actionType icons: 🚫 stop_entry, ⚠️ limit_entry, ↗️ redirect, 🟢 open_zone, 👮 alert_staff
  - Animate in with Framer Motion staggerChildren

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6 — ORCHESTRATION HOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create web/src/lib/hooks/useGroqOrchestrator.ts

Pipeline (runs in sequence, each step feeds the next):
  1. fetchDensityData() → setDensityData()
  2. POST /api/groq { type: "predictions", payload: densityData }
     → setPredictions()
  3. POST /api/groq { type: "suggestions", payload: { densityData, predictions }}
     → setSuggestions()
  4. POST /api/groq { type: "decisions", payload: { suggestions, densityData }}
     → setDecisions()

Trigger this pipeline:
  - On dashboard mount (useEffect)
  - Every 60 seconds (setInterval, clear on unmount)
  - When refreshGroqInsights() is called from any component

Set groqLoading = true at start, false at end.
On any failure: set groqError, fall back to previous store values (no blank UI).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD CONSTRAINTS — NEVER VIOLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NEVER expose GROQ_API_KEY in client-side code or browser network tab
- NEVER break existing Clerk auth, Prisma schema, or existing API routes
- NEVER remove existing UI components or change their exported prop signatures
- NEVER write GROQ_API_KEY as a literal string anywhere in code
- ALWAYS define TypeScript interfaces for every GROQ response before using it
- ALWAYS validate GROQ JSON response before writing to store (try/catch + type guard)
- ALWAYS keep mock-data.ts as fallback — if fetch fails, use mock values
- Commit after each phase with message: "phase N: [what changed]"