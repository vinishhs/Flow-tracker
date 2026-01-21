-- 002_add_financial_notes.sql

-- Create financial_notes table
CREATE TABLE IF NOT EXISTS financial_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  raw_text TEXT NOT NULL,
  total_in NUMERIC NOT NULL,
  total_out NUMERIC NOT NULL,
  net_balance NUMERIC NOT NULL,
  settled_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add note_id, sender_name, and recipient_name to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES financial_notes(id),
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT;

-- Disable RLS for now to allow anon inserts (as requested)
ALTER TABLE financial_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
