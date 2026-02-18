'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push('/dashboard');
            }
            setLoading(false);
        };
        checkAuth();
    }, [router]);

    const handleLogin = async () => {
        // Simple mock login for verification purposes
        // In a real app, this would be a proper Supabase Auth form
        await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'password123'
        });
        router.push('/dashboard');
    };

    if (loading) return <div className="container"><h1>Loading...</h1></div>;

    return (
        <div className="container" style={{ textAlign: 'center', paddingTop: '10rem' }}>
            <h1>Decision Log</h1>
            <p className="subtitle">Thinking transparency for better results.</p>
            <button className="btn btn-primary" onClick={handleLogin}>
                Sign In to Decision Log
            </button>
        </div>
    );
}
