import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { driveAuth } from '@/lib/google-drive';

export async function POST(req: Request) {
    try {
        const { invitationId, questionId, mimeType, fileName } = await req.json();

        if (!invitationId || !questionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify the invitation belongs to the logged in user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Technically RLS handles most of this, but we specifically need to ensure the candidate owns this invite 
        // to prevent uploading garbage files on behalf of someone else.
        const { data: invite } = await supabase
            .from('interview_invitations')
            .select(`
                id,
                applications!inner ( applicant_id )
            `)
            .eq('id', invitationId)
            .single();

        const apps: any = invite?.applications;
        const applicantId = Array.isArray(apps) ? apps[0]?.applicant_id : apps?.applicant_id;

        if (!invite || applicantId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Generate a Resumable Upload URL from Google Drive API
        const accessToken = await driveAuth.getAccessToken();

        const metadata = {
            name: fileName || `submission_${invitationId}_${questionId}.webm`,
            mimeType: mimeType || 'video/webm'
        };

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Type': metadata.mimeType
            },
            body: JSON.stringify(metadata)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Google API Error: ${errText}`);
        }

        const uploadUrl = res.headers.get('location');
        if (!uploadUrl) {
            throw new Error('Failed to retrieve resumable upload URL from Google');
        }

        return NextResponse.json({ uploadUrl });
    } catch (error: any) {
        console.error('Upload URL Error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
