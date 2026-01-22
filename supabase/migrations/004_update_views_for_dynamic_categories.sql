-- 004_update_views_for_dynamic_categories.sql

-- 1. Update Category Spending Trends (Exclude both old and new lending categories)
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
  AND category NOT ILIKE 'Lent to%'
GROUP BY user_id, month, category
ORDER BY month DESC, total_spent DESC;

-- 2. Update Debt Flow Trends (Support dynamic names)
CREATE OR REPLACE VIEW debt_flow_trends AS
SELECT 
    user_id,
    date_trunc('month', transaction_date) AS month,
    SUM(CASE WHEN category = 'LEND TO' OR category ILIKE 'Lent to%' THEN amount ELSE 0 END) AS total_lent,
    SUM(CASE WHEN category = 'Money In' OR category ILIKE 'Money In%' THEN amount ELSE 0 END) AS total_recovered,
    COUNT(*) FILTER (WHERE category IN ('LEND TO', 'Money In') OR category ILIKE 'Lent to%' OR category ILIKE 'Money In%') AS transaction_count
FROM transactions
GROUP BY user_id, month
ORDER BY month DESC;

-- 3. Update Global Financial Stats (Support dynamic names and sum net_balance)
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
    WHERE category = 'LEND TO' OR category ILIKE 'Lent to%'
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
