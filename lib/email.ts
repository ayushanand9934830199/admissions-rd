import nodemailer from 'nodemailer';

export interface SmtpConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    from_name: string;
    from_email: string;
}

export interface StatusEmailPayload {
    to: string;
    applicantName: string;
    program: string;
    newStatus: string;
    message: string;
    templateHtml?: string;
    templateSubject?: string;
    smtp?: SmtpConfig;        // passed from API route (loaded from DB)
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'pending',
    under_review: 'under review',
    interview_scheduled: 'interview scheduled',
    accepted: 'accepted 🎉',
    rejected: 'not selected',
};

export function substituteVariables(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function buildDefaultHtml(payload: StatusEmailPayload): string {
    const { applicantName, program, newStatus, message } = payload;
    const statusLabel = STATUS_LABELS[newStatus] || newStatus;

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Application Update</title></head>
<body style="margin:0;padding:0;background:#E8E6D9;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#E8E6D9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FAFAF5;border-radius:16px;overflow:hidden;border:2px solid #0a0a0a;">
        <tr>
          <td style="background:#F2AE40;padding:36px 40px;text-align:center;border-bottom:2px solid #0a0a0a;">
            <h1 style="margin:0;color:#0a0a0a;font-size:26px;font-weight:800;text-transform:lowercase;">restless dreamers</h1>
            <p style="margin:6px 0 0;color:#0a0a0a;font-size:13px;font-weight:600;text-transform:lowercase;">admissions update</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#0a0a0a;font-size:16px;margin:0 0 16px;">dear <strong>${applicantName}</strong>,</p>
            <p style="color:#3d3d3d;font-size:15px;line-height:1.7;margin:0 0 24px;">your application for <strong>${program}</strong> has been reviewed. here's your latest status:</p>
            <div style="text-align:center;margin:0 0 28px;">
              <span style="display:inline-block;background:#0a0a0a;color:#F2AE40;border-radius:999px;padding:12px 32px;font-size:14px;font-weight:700;text-transform:lowercase;">${statusLabel}</span>
            </div>
            ${message ? `<div style="background:#F0EEE3;border:1px solid #d8d5c4;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
              <p style="margin:0 0 6px;color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">message from our team</p>
              <p style="margin:0;color:#0a0a0a;font-size:14px;line-height:1.7;">${message}</p>
            </div>` : ''}
            <p style="color:#888;font-size:13px;margin:0;">log in to your applicant portal to view your full application status.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px;border-top:1px solid #E0DECC;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:12px;">restless dreamers · admissions team<br/>this is an automated notification.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function createTransporter(smtp?: SmtpConfig) {
    // Use DB-loaded SMTP config if provided, otherwise fall back to .env
    const host = smtp?.host || process.env.EMAIL_HOST || 'smtp.mailersend.net';
    const port = smtp?.port || Number(process.env.EMAIL_PORT) || 587;
    const user = smtp?.username || process.env.EMAIL_USER || '';
    const pass = smtp?.password || process.env.EMAIL_PASS || '';

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass },
    });
}

export async function sendStatusEmail(payload: StatusEmailPayload) {
    const { to, applicantName, program, newStatus, message, templateHtml, templateSubject, smtp } = payload;

    const nameParts = applicantName.trim().split(/\s+/);
    const firstName = nameParts[0] || applicantName;
    const lastName = nameParts.slice(1).join(' ') || '';
    const statusLabel = STATUS_LABELS[newStatus] || newStatus;

    const vars: Record<string, string> = {
        username: firstName.toLowerCase(),
        email: to,
        full_name: applicantName,
        first_name: firstName,
        last_name: lastName,
        status: statusLabel,
        program,
        message: message || '',
    };

    const html = templateHtml ? substituteVariables(templateHtml, vars) : buildDefaultHtml(payload);
    const subject = templateSubject ? substituteVariables(templateSubject, vars) : `update on your application — ${program}`;

    const fromName = smtp?.from_name || 'Admissions Team';
    const fromEmail = smtp?.from_email || process.env.EMAIL_USER || '';
    const from = fromEmail ? `"${fromName}" <${fromEmail}>` : fromName;

    const transporter = createTransporter(smtp);

    await transporter.sendMail({ from, to, subject, html });
}
