import { google } from 'googleapis';

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, '\n');

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
