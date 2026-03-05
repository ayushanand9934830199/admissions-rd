'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Question {
    id: string;
    text: string;
    timeLimit: number;
}

interface Props {
    invitationId: string;
    questions: Question[];
}

export default function InterviewRecorder({ invitationId, questions }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'finished'>('idle');
    const [timeRemaining, setTimeRemaining] = useState(questions[0]?.timeLimit || 120);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const router = useRouter();
    const supabase = createClient();

    const currentQuestion = questions[currentIndex];

    // Request camera
    useEffect(() => {
        let stream: MediaStream | null = null;
        async function setupCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.muted = true; // prevent feedback
                }
            } catch (err) {
                console.error('Camera access denied', err);
                toast.error('Please allow camera and microphone access to continue.');
            }
        }
        if (status === 'idle') {
            setupCamera();
        }

        return () => {
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [status]);

    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (status === 'recording' && timeRemaining > 0) {
            timerId = setInterval(() => {
                setTimeRemaining(t => {
                    if (t <= 1) {
                        stopRecording();
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerId);
    }, [status, timeRemaining]);


    const startRecording = () => {
        if (!videoRef.current?.srcObject) {
            toast.error('Camera stream not found');
            return;
        }

        const stream = videoRef.current.srcObject as MediaStream;
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = handleUpload;

        // request data every second
        mediaRecorder.start(1000);
        setStatus('recording');
        setTimeRemaining(currentQuestion.timeLimit);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleUpload = async () => {
        setStatus('uploading');
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });

        try {
            // 1. Get Pre-signed Upload URL for Cloudflare R2
            const urlRes = await fetch('/api/interviews/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invitationId,
                    questionId: currentQuestion.id,
                    mimeType: blob.type
                })
            });
            const { uploadUrl, key, error: urlErr } = await urlRes.json();
            if (urlErr) throw new Error(urlErr);

            // 2. PUT Blob to R2 directly from Browser
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: blob,
                headers: {
                    'Content-Type': blob.type
                }
            });
            if (!uploadRes.ok) throw new Error('Failed to upload video to storage');

            // 3. Mark in DB
            const submitRes = await fetch('/api/interviews/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invitationId,
                    questionId: currentQuestion.id,
                    key
                })
            });

            if (!submitRes.ok) throw new Error('Failed to save submission');

            toast.success('Successfully uploaded response!');
            advanceNext();
        } catch (err: any) {
            console.error('Upload Error:', err);
            toast.error(err.message || 'Error occurred during upload. Please restart.');
            setStatus('idle');
        }
    };

    const advanceNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setStatus('idle');
            setTimeRemaining(questions[currentIndex + 1].timeLimit);
        } else {
            setStatus('finished');
            // Update invitation status to completed
            await supabase.from('interview_invitations').update({ status: 'completed' }).eq('id', invitationId);
            router.refresh();
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (status === 'finished') {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h1 style={{ fontSize: 24, marginBottom: 16 }}>Interview Complete</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Your responses have been securely uploaded. The team will be in touch shortly.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
            {/* Camera View */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden', border: '1px solid #333' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />

                {status === 'recording' && (
                    <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', animation: 'pulse-red 1.5s infinite' }} />
                        <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                )}

                {status === 'uploading' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, marginBottom: 16, borderColor: 'var(--amber-dark)' }} />
                        <p style={{ fontSize: 18, fontWeight: 600 }}>Uploading response...</p>
                        <p style={{ color: '#aaa', fontSize: 14 }}>Please do not close this window.</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="card" style={{ background: '#111', borderColor: '#333', padding: 24 }}>
                <p style={{ color: 'var(--amber-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    Question {currentIndex + 1} of {questions.length}
                </p>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.5, margin: '0 0 24px' }}>
                    {currentQuestion?.text}
                </h2>
                <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
                    You have up to <strong>{Math.floor(currentQuestion.timeLimit / 60)} minutes</strong> to respond. Ensure your face is clearly visible and background noise is minimal.
                </p>

                {status === 'idle' && (
                    <button className="btn btn-primary" onClick={startRecording} style={{ width: '100%', padding: '14px' }}>
                        Start Recording
                    </button>
                )}

                {status === 'recording' && (
                    <button className="btn btn-secondary" onClick={stopRecording} style={{ width: '100%', padding: '14px', background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>
                        Stop & Submit Answer
                    </button>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-red {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}} />
        </div>
    );
}
