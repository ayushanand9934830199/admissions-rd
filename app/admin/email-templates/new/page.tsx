import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EmailTemplateEditor from '@/components/EmailTemplateEditor';

export default async function NewEmailTemplatePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') redirect('/dashboard');

    const blankTemplate = {
        name: '',
        subject: 'update on your application — {{program}}',
        body_html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Update</title></head>
<body style="margin:0;padding:0;background:#E8E6D9;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#E8E6D9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FAFAF5;border-radius:16px;overflow:hidden;border:2px solid #0a0a0a;">
        <tr>
          <td style="background:#F2AE40;padding:36px 40px;text-align:center;border-bottom:2px solid #0a0a0a;">
            <h1 style="margin:0;color:#0a0a0a;font-size:26px;font-weight:800;text-transform:lowercase;">restless dreamers</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#0a0a0a;font-size:16px;margin:0 0 16px;">dear {{full_name}},</p>
            <p style="color:#3d3d3d;font-size:15px;line-height:1.7;margin:0 0 24px;">
              your application for <strong>{{program}}</strong> has been updated. your status is now:
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <span style="display:inline-block;background:#0a0a0a;color:#F2AE40;border-radius:999px;padding:12px 32px;font-size:14px;font-weight:700;text-transform:lowercase;">{{status}}</span>
            </div>
            <div style="background:#F0EEE3;border:1px solid #d8d5c4;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
              <p style="margin:0 0 8px;color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">message from our team</p>
              <p style="margin:0;color:#0a0a0a;font-size:14px;line-height:1.7;">{{message}}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px;border-top:1px solid #E0DECC;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:12px;">restless dreamers · admissions team</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        is_default: false,
    };

    return (
        <EmailTemplateEditor
            template={blankTemplate}
            isNew={true}
            userName={profile.full_name}
            userRole="admin"
        />
    );
}
