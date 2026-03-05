import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { s3Client, R2_BUCKET } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: Request) {
    try {
        const { invitationId, questionId, mimeType, fileName } = await req.json();

        if (!invitationId || !questionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check Authentication - MUST be logged in as the applicant
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: invite } = await supabase
            .from('interview_invitations')
            .select(`
                id, 
                status,
                applications (applicant_id)
            `)
            .eq('id', invitationId)
            .single();

        if (!invite || invite.status !== 'pending') {
            return NextResponse.json({ error: 'Forbidden or expired' }, { status: 403 });
        }

        const apps: any = invite.applications;
        const applicantId = Array.isArray(apps) ? apps[0]?.applicant_id : apps?.applicant_id;

        if (applicantId !== user.id) {
            // Check if user is admin
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (!profile || !['admin', 'admissions_head', 'admissions_associate'].includes(profile.role)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Generate a Pre-signed URL for Cloudflare R2
        const key = `interviews/${invitationId}/${questionId}-${Date.now()}.webm`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            ContentType: mimeType || 'video/webm',
        });

        // URL expires in 1 hour
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return NextResponse.json({ uploadUrl, key });
    } catch (error: any) {
        console.error('Upload URL Error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
