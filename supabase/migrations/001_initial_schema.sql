-- 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  total_balance NUMERIC DEFAULT 0,
  currency_code TEXT DEFAULT 'INR'
);

-- Create enum type for transaction_type
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'lending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_type transaction_type NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  recipient_name TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  fingerprint TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for monthly queries
CREATE INDEX IF NOT EXISTS idx_transactions_userid_date ON transactions (user_id, transaction_date);

-- Create monthly_snapshots table
CREATE TABLE IF NOT EXISTS monthly_snapshots (
  user_id UUID REFERENCES auth.users NOT NULL,
  month_year TEXT NOT NULL, -- Format 'YYYY-MM'
  total_in NUMERIC DEFAULT 0,
  total_out NUMERIC DEFAULT 0,
  total_lent NUMERIC DEFAULT 0,
  balance_carried_forward NUMERIC DEFAULT 0,
  PRIMARY KEY (user_id, month_year)
);

-- Trigger function to update snapshots
CREATE OR REPLACE FUNCTION update_monthly_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_month_year TEXT;
BEGIN
  -- Extract month-year from transaction_date (e.g., '2026-01')
  v_month_year := to_char(NEW.transaction_date, 'YYYY-MM');

  -- Update existing snapshot or insert new
  INSERT INTO monthly_snapshots (user_id, month_year, total_in, total_out, total_lent)
  VALUES (
    NEW.user_id,
    v_month_year,
    CASE WHEN NEW.transaction_type = 'income' THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.transaction_type = 'expense' THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.transaction_type = 'lending' THEN NEW.amount ELSE 0 END
  )
  ON CONFLICT (user_id, month_year) DO UPDATE
  SET
    total_in = monthly_snapshots.total_in + EXCLUDED.total_in,
    total_out = monthly_snapshots.total_out + EXCLUDED.total_out,
    total_lent = monthly_snapshots.total_lent + EXCLUDED.total_lent;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- create trigger
DROP TRIGGER IF EXISTS trg_update_snapshot ON transactions;
CREATE TRIGGER trg_update_snapshot
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_monthly_snapshot();
