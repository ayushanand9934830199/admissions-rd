import { S3Client } from '@aws-sdk/client-s3';

const region = 'auto';
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Cloudflare R2 credentials are missing');
    } else {
        console.warn('⚠️ Cloudflare R2 credentials missing in environment variables.');
    }
}

export const s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
});

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET;
export const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;
