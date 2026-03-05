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
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Validate the invitation is valid
        const { data: invite } = await supabase
            .from('interview_invitations')
            .select(`
                id, 
                status,
                applications (applicant_id)
            `)
            .eq('id', invitationId)
            .single();

        if (!invite) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const apps: any = invite.applications;
        const applicantId = Array.isArray(apps) ? apps[0]?.applicant_id : apps?.applicant_id;

        if (applicantId !== user.id) {
            // Allow admin
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (!profile || !['admin', 'admissions_head', 'admissions_associate'].includes(profile.role)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
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
