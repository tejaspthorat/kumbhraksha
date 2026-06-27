import nodemailer from 'nodemailer';

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

interface StaffEmailProps {
  email: string;
  password: string;
  role: string;
  zone: string;
}

/**
 * Sends the "access granted" welcome email to a newly created coordinator.
 * Ported verbatim from the former Next.js server action so the backend is the
 * single source of truth for staff onboarding.
 */
export async function sendStaffWelcomeEmail({ email, password, role, zone }: StaffEmailProps) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[staff-email] SMTP not configured; skipping welcome email');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
          margin: 0; padding: 0;
          background: #030508; color: #ffffff;
        }
        .container {
          max-width: 600px; margin: 40px auto;
          background: rgba(10, 21, 32, 0.95);
          border: 1px solid rgba(78, 205, 196, 0.2);
          border-radius: 24px; overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .header {
          background: linear-gradient(135deg, #4ecdc4, #00d4ff);
          padding: 40px 20px; text-align: center;
        }
        .icon { font-size: 48px; margin-bottom: 20px; }
        .content { padding: 40px 30px; text-align: left; }
        .title {
          font-size: 28px; font-weight: 800; color: #ffffff;
          margin: 0 0 10px 0; letter-spacing: 0;
        }
        .subtitle { font-size: 16px; color: rgba(255,255,255,0.5); margin-bottom: 30px; }
        .card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px; padding: 24px; margin-bottom: 30px;
        }
        .info-group { margin-bottom: 16px; }
        .info-group:last-child { margin-bottom: 0; }
        .label {
          font-size: 10px; font-weight: 800; color: #4ecdc4;
          text-transform: uppercase; letter-spacing: 1.5px;
          margin-bottom: 4px;
        }
        .value { font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 500; }
        .footer {
          padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);
          font-size: 12px; color: rgba(255,255,255,0.2);
        }
        .btn {
          display: inline-block; padding: 14px 32px;
          background: linear-gradient(135deg, #4ecdc4, #00d4ff);
          border-radius: 12px; color: #030508 !important;
          text-decoration: none; font-weight: 800; font-size: 14px;
          margin-top: 10px; text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🛡️</div>
          <div class="title">Welcome, ${role.split(' ')[0]}</div>
        </div>
        <div class="content">
          <h2 class="title">System Access Granted</h2>
          <p class="subtitle">Your account for the Crowd Management Dashboard has been initialized. You are assigned to <strong>${zone}</strong>.</p>

          <div class="card">
            <div class="info-group">
              <div class="label">Access Link</div>
              <div class="value">Cloud Dashboard Command Center</div>
            </div>
            <div class="info-group">
              <div class="label">Identifier</div>
              <div class="value">${email}</div>
            </div>
            <div class="info-group">
              <div class="label">Temporary Key</div>
              <div class="value" style="font-family: monospace; letter-spacing: 1px;">${password}</div>
            </div>
          </div>

          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="btn">Launch Command Center</a>
          </center>
        </div>
        <div class="footer">
          &copy; 2026 CrowdAI Intelligence System. Restricted access only.
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await getTransport().sendMail({
    from: `"CrowdAI Global" <${process.env.SMTP_USER || 'system@crowdai.io'}>`,
    to: email,
    subject: '🛡️ Access Granted: Crowd Management System',
    html,
  });

  return info;
}
