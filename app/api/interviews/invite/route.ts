import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendStatusEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { applicationId, templateId } = await req.json();

        if (!applicationId || !templateId) {
            return NextResponse.json({ error: 'Missing applicationId or templateId' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'admissions_head', 'admissions_associate'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get application details for email
        const { data: application, error: appError } = await supabase
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Create Invitation
        const { data: invitation, error: inviteError } = await supabase
            .from('interview_invitations')
            .insert({
                application_id: applicationId,
                template_id: templateId,
                invited_by: user.id,
                status: 'pending'
            })
            .select()
            .single();

        if (inviteError) {
            return NextResponse.json({ error: inviteError.message }, { status: 500 });
        }

        // Send Email
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const inviteLink = `${protocol}://${host}/interview/${invitation.id}`;

        const message = `We would like to invite you to complete a short asynchronous video interview for the ${application.program}. Please click the link below to begin. It should take about 10-15 minutes.\n\n${inviteLink}`;

        await sendStatusEmail({
            to: application.email,
            applicantName: application.full_name,
            program: application.program,
            newStatus: 'interview_scheduled',
            message: message,
        });

        // Also update the application status to interview_scheduled
        await supabase
            .from('applications')
            .update({ status: 'interview_scheduled' })
            .eq('id', applicationId);

        // Log status update
        await supabase.from('status_updates').insert({
            application_id: applicationId,
            old_status: application.status,
            new_status: 'interview_scheduled',
            message: message,
            sent_by: user.id
        });

        return NextResponse.json({ success: true, invitation });
    } catch (error: any) {
        console.error('Invite Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
