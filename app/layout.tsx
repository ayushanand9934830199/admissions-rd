import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Admissions Portal — Restless Dreamers',
    description: 'Submit and manage your admissions application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1a1a2e',
                            color: '#f0f0ff',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            fontSize: '14px',
                        },
                        success: {
                            iconTheme: { primary: '#10b981', secondary: '#1a1a2e' },
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' },
                        },
                    }}
                />
                <Analytics />
            </body>
        </html>
    );
}
