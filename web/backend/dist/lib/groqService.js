"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePredictions = generatePredictions;
exports.generateSuggestions = generateSuggestions;
exports.generateDecisions = generateDecisions;
const GROQ_API_KEY = process.env.GROQ_API || process.env.GROQ_API_KEY;
const MODEL = "llama-3.1-8b-instant";
async function callGroq(messages) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured on the server.');
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            messages,
            model: MODEL,
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error: ${response.status} ${errText}`);
    }
    const data = (await response.json());
    return JSON.parse(data.choices[0].message.content);
}
async function generatePredictions(densityData) {
    const systemPrompt = `You are an AI crowd safety analyst for a live event venue. 
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
}`;
    const userMessage = `Current zone data: ${JSON.stringify(densityData)}`;
    return await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ]);
}
async function generateSuggestions(densityData, predictions) {
    const systemPrompt = `You are an AI crowd flow manager at a public safety event.
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
}`;
    const userMessage = `Zone density: ${JSON.stringify(densityData)}
Predictions: ${JSON.stringify(predictions)}`;
    return await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ]);
}
async function generateDecisions(suggestions, densityData) {
    const systemPrompt = `You are the final decision engine for a crowd safety command center.
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
}`;
    const userMessage = `Suggestions: ${JSON.stringify(suggestions)}
Current density: ${JSON.stringify(densityData)}`;
    return await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ]);
}
