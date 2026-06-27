import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

// Auth removed — the dashboard operates as a single shared "Control Room" identity.
const CONTROL_ROOM = {
  id: 'control-room',
  email: 'control@kumbhraksha.local',
  name: 'Control Room',
};

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');

    // 1. Determine if this is a public or mobile route
    const isPublic = pathString.startsWith('public/');
    const isMobile = pathString.startsWith('mobile/');
    
    let userId: string | null = null;
    let userEmail = '';
    let userName = '';

    // 2. Auth removed — attach the shared Control Room identity to dashboard routes.
    if (!isPublic && !isMobile) {
      userId = CONTROL_ROOM.id;
      userEmail = CONTROL_ROOM.email;
      userName = CONTROL_ROOM.name;
    }

    // 3. Build destination URL including query parameters
    const url = new URL(req.url);
    const destUrl = `${BACKEND_URL}/api/${pathString}${url.search}`;

    // 4. Set headers to pass to Express backend
    const headers = new Headers();
    
    // Copy incoming content-type
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    // Forward JWT token or coordinator secret
    const authorization = req.headers.get('authorization');
    if (authorization) headers.set('authorization', authorization);

    const coordSecret = req.headers.get('x-coordinator-internal-secret');
    if (coordSecret) headers.set('x-coordinator-internal-secret', coordSecret);

    const taskEditorToken = req.headers.get('x-task-editor-token');
    if (taskEditorToken) headers.set('x-task-editor-token', taskEditorToken);

    // Inject Clerk authenticated user details
    if (userId) {
      headers.set('x-user-id', userId);
      headers.set('x-user-email', userEmail);
      headers.set('x-user-name', userName);
    }

    // 5. Read body for write requests
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      try {
        body = await req.text();
      } catch (err) {
        // No body or failed to parse body
      }
    }

    // 6. Forward the request to Express server
    const backendRes = await fetch(destUrl, {
      method: req.method,
      headers,
      body: body || undefined,
      cache: 'no-store',
    });

    // 7. Preserve text and binary bodies from the backend.
    const resBody = await backendRes.arrayBuffer();
    
    // Build return headers
    const returnHeaders = new Headers();
    for (const headerName of ['content-type', 'cache-control', 'pragma', 'expires']) {
      const value = backendRes.headers.get(headerName);
      if (value) returnHeaders.set(headerName, value);
    }

    return new NextResponse(resBody, {
      status: backendRes.status,
      headers: returnHeaders,
    });

  } catch (error: any) {
    console.error('[API Gateway Error]:', error);
    return NextResponse.json({ error: 'Gateway Error', details: error.message }, { status: 502 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, context);
}
