-- 1. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_notes_date ON financial_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_notes_user_id ON financial_notes(user_id);

-- 2. Monthly Summary View (Multi-user aware)
CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT 
    user_id,
    date_trunc('month', created_at) AS month,
    SUM(total_in) AS total_income,
    SUM(total_out) AS total_expenses,
    SUM(net_balance) AS net_cash_flow,
    SUM(settled_amount) AS total_settled,
    COUNT(*) AS snapshots_processed
FROM financial_notes
GROUP BY user_id, month
ORDER BY month DESC;

-- 3. Pure Category Spending Trends (Excludes Lending/Debt)
CREATE OR REPLACE VIEW category_spending_trends AS
SELECT 
    user_id,
    date_trunc('month', transaction_date) AS month,
    category,
    SUM(amount) AS total_spent,
    COUNT(*) AS transaction_count
FROM transactions
WHERE transaction_type = 'expense' 
  AND category != 'LEND TO'
GROUP BY user_id, month, category
ORDER BY month DESC, total_spent DESC;

-- 4. Debt Flow Trends (Lending vs. Recovery)
CREATE OR REPLACE VIEW debt_flow_trends AS
SELECT 
    user_id,
    date_trunc('month', transaction_date) AS month,
    SUM(CASE WHEN category = 'LEND TO' THEN amount ELSE 0 END) AS total_lent,
    SUM(CASE WHEN category = 'Money In' THEN amount ELSE 0 END) AS total_recovered,
    COUNT(*) FILTER (WHERE category IN ('LEND TO', 'Money In')) AS transaction_count
FROM transactions
GROUP BY user_id, month
ORDER BY month DESC;

-- 5. Global Financial Stats (Summary Across All Time)
CREATE OR REPLACE VIEW global_financial_stats AS
WITH notes_agg AS (
    SELECT 
        user_id,
        SUM(total_in) AS total_income,
        SUM(total_out) AS total_expenses,
        SUM(net_balance) AS net_savings,
        SUM(settled_amount) AS total_settled,
        MIN(created_at) AS tracking_since,
        MAX(created_at) AS last_updated
    FROM financial_notes
    GROUP BY user_id
),
lent_agg AS (
    SELECT 
        user_id,
        SUM(amount) AS total_lent
    FROM transactions
    WHERE category = 'LEND TO'
    GROUP BY user_id
)
SELECT 
    n.user_id,
    n.total_income,
    n.total_expenses,
    n.total_settled,
    COALESCE(l.total_lent, 0) AS total_lent,
    n.net_savings,
    n.tracking_since,
    n.last_updated
FROM notes_agg n
LEFT JOIN lent_agg l ON n.user_id = l.user_id;
