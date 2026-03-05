import { google } from 'googleapis';

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!clientEmail || !privateKey) {
    console.warn('⚠️ Google Drive API credentials missing in environment variables. Video uploads will fail.');
}

export const driveAuth = new google.auth.GoogleAuth({
    credentials: {
        client_email: clientEmail || '',
        private_key: privateKey || '',
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

export const drive = google.drive({ version: 'v3', auth: driveAuth });
