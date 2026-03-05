import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { driveAuth } from '@/lib/google-drive';

export async function POST(req: Request) {
    try {
        const { invitationId, questionId, mimeType, fileName } = await req.json();

        if (!invitationId || !questionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Unauthenticated access allowed: the unguessable UUID serves as the secure token
        const supabase = await createClient();

        const { data: invite } = await supabase
            .from('interview_invitations')
            .select('id, status')
            .eq('id', invitationId)
            .single();

        if (!invite || invite.status !== 'pending') {
            return NextResponse.json({ error: 'Forbidden or expired' }, { status: 403 });
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
