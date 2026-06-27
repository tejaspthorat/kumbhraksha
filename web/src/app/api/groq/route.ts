import { NextResponse } from 'next/server';
import { generatePredictions, generateSuggestions, generateDecisions } from '@/lib/groqService';

export async function POST(req: Request) {
  try {
    const { type, payload } = await req.json();

    if (!type || !payload) {
      return NextResponse.json({ error: 'Missing type or payload' }, { status: 400 });
    }

    if (type === 'predictions') {
      const result = await generatePredictions(payload);
      return NextResponse.json(result);
    } 
    else if (type === 'suggestions') {
      const { densityData, predictions } = payload;
      if (!densityData || !predictions) {
        return NextResponse.json({ error: 'Missing densityData or predictions in payload' }, { status: 400 });
      }
      const result = await generateSuggestions(densityData, predictions);
      return NextResponse.json(result);
    } 
    else if (type === 'decisions') {
      const { suggestions, densityData } = payload;
      if (!suggestions || !densityData) {
        return NextResponse.json({ error: 'Missing suggestions or densityData in payload' }, { status: 400 });
      }
      const result = await generateDecisions(suggestions, densityData);
      return NextResponse.json(result);
    } 
    else {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Groq API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
