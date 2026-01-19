import { NextResponse } from 'next/server';
import { parseAppleNote, TransactionData } from '@/lib/services/parser';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Ensure these environment variables are set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role for backend actions typically, or Anon if RLS allows
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.text();
        if (!body) {
            return NextResponse.json({ error: 'Empty body' }, { status: 400 });
        }

        // 1. Parse the text
        const { recognized, unrecognized } = parseAppleNote(body);

        // 2. Check for duplicates
        // We get all fingerprints from the parsed result
        const fingerprints = recognized.map(t => t.fingerprint);

        // Query DB to see which already exist
        let duplicates: string[] = [];
        if (fingerprints.length > 0) {
            const { data, error } = await supabase
                .from('transactions')
                .select('fingerprint')
                .in('fingerprint', fingerprints);

            if (!error && data) {
                duplicates = data.map((d: any) => d.fingerprint);
            }
        }

        // Mark transactions as duplicate if found
        const processed = recognized.map(t => ({
            ...t,
            is_duplicate: duplicates.includes(t.fingerprint)
        }));

        return NextResponse.json({
            recognized: processed,
            unrecognized, // Returns the full raw string of failed lines
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
