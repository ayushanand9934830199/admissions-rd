import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { R2_PUBLIC_URL } from '@/lib/r2';

export async function POST(req: Request) {
    try {
        const { invitationId, questionId, fileId, key } = await req.json();

        // fileId comes from Google Drive logic, 'key' is the new R2 field
        const finalKey = key || fileId;

        if (!invitationId || !questionId || !finalKey) {
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

        const fileUrl = `${R2_PUBLIC_URL}/${finalKey}`;

        const { error: submitError } = await supabase
            .from('video_submissions')
            .insert({
                invitation_id: invitationId,
                question_id: questionId,
                drive_file_id: finalKey, // We'll reuse the same column for simplicity or can rename it later
                drive_file_url: fileUrl
            });

        if (submitError) throw submitError;

        return NextResponse.json({ success: true, fileUrl });
    } catch (error: any) {
        console.error('Submit Error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
