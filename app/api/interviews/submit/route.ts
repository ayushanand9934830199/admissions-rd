import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { drive } from '@/lib/google-drive';

export async function POST(req: Request) {
    try {
        const { invitationId, questionId, fileId } = await req.json();

        if (!invitationId || !questionId || !fileId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Validate the invitation is valid
        const { data: invite } = await supabase
            .from('interview_invitations')
            .select('id, status')
            .eq('id', invitationId)
            .single();

        if (!invite) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Grant anyone with link read access to the file so admins can view it
        try {
            await drive.permissions.create({
                fileId: fileId,
                requestBody: { role: 'reader', type: 'anyone' },
            });
        } catch (authErr) {
            console.error('Failed to change drive permissions:', authErr);
            // Non-fatal, admin might still have domain access or we can handle it later
        }

        // Try getting the WebViewLink
        let fileUrl = '';
        try {
            const driveFile = await drive.files.get({ fileId, fields: 'webViewLink' });
            fileUrl = driveFile.data.webViewLink || '';
        } catch (e) {
            console.error('Failed to get view link', e);
        }

        const { error: submitError } = await supabase
            .from('video_submissions')
            .insert({
                invitation_id: invitationId,
                question_id: questionId,
                drive_file_id: fileId,
                drive_file_url: fileUrl
            });

        if (submitError) throw submitError;

        return NextResponse.json({ success: true, fileUrl });
    } catch (error: any) {
        console.error('Submit Error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
