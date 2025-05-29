CREATE OR REPLACE VIEW monthly_income_view AS
SELECT
  user_id,
  DATE_TRUNC('month', date::date) AS month,
  SUM(
    (SELECT SUM(quantity * unit_price) 
     FROM invoice_items 
     WHERE invoice_id = invoices.id)
  ) AS total_amount,
  COUNT(*) AS invoice_count,
  SUM(CASE WHEN status = 'paid' THEN 
    (SELECT SUM(quantity * unit_price) 
     FROM invoice_items 
     WHERE invoice_id = invoices.id)
    ELSE 0 END
  ) AS paid_amount,
  SUM(CASE WHEN status = 'unpaid' THEN 
    (SELECT SUM(quantity * unit_price) 
     FROM invoice_items 
     WHERE invoice_id = invoices.id)
    ELSE 0 END
  ) AS unpaid_amount
FROM
  invoices
GROUP BY
  user_id, DATE_TRUNC('month', date::date)
ORDER BY
  month DESC;

CREATE OR REPLACE VIEW yearly_income_view AS
SELECT
  user_id,
  DATE_TRUNC('year', date::date) AS year,
  SUM(
    (SELECT SUM(quantity * unit_price) 
     FROM invoice_items 
     WHERE invoice_id = invoices.id)
  ) AS total_amount,
  COUNT(*) AS invoice_count,
  SUM(CASE WHEN status = 'paid' THEN 
    (SELECT SUM(quantity * unit_price) 
     FROM invoice_items 
     WHERE invoice_id = invoices.id)
    ELSE 0 END
  ) AS paid_amount,
  SUM(CASE WHEN status = 'unpaid' THEN 
    (SELECT SUM(quantity * unit_price) 
     FROM invoice_items 
     WHERE invoice_id = invoices.id)
    ELSE 0 END
  ) AS unpaid_amount
FROM
  invoices
GROUP BY
  user_id, DATE_TRUNC('year', date::date)
ORDER BY
  year DESC;

CREATE OR REPLACE FUNCTION get_monthly_income(p_user_id UUID)
RETURNS TABLE (
  month DATE,
  total_amount DECIMAL,
  invoice_count INTEGER,
  paid_amount DECIMAL,
  unpaid_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', date::date)::DATE AS month,
    SUM(
      (SELECT SUM(quantity * unit_price) 
       FROM invoice_items 
       WHERE invoice_id = invoices.id)
    ) AS total_amount,
    COUNT(*) AS invoice_count,
    SUM(CASE WHEN status = 'paid' THEN 
      (SELECT SUM(quantity * unit_price) 
       FROM invoice_items 
       WHERE invoice_id = invoices.id)
      ELSE 0 END
    ) AS paid_amount,
    SUM(CASE WHEN status = 'unpaid' THEN 
      (SELECT SUM(quantity * unit_price) 
       FROM invoice_items 
       WHERE invoice_id = invoices.id)
      ELSE 0 END
    ) AS unpaid_amount
  FROM
    invoices
  WHERE
    user_id = p_user_id
    AND date::date >= (CURRENT_DATE - INTERVAL '12 months')
  GROUP BY
    DATE_TRUNC('month', date::date)
  ORDER BY
    month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_yearly_income(p_user_id UUID)
RETURNS TABLE (
  year DATE,
  total_amount DECIMAL,
  invoice_count INTEGER,
  paid_amount DECIMAL,
  unpaid_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('year', date::date)::DATE AS year,
    SUM(
      (SELECT SUM(quantity * unit_price) 
       FROM invoice_items 
       WHERE invoice_id = invoices.id)
    ) AS total_amount,
    COUNT(*) AS invoice_count,
    SUM(CASE WHEN status = 'paid' THEN 
      (SELECT SUM(quantity * unit_price) 
       FROM invoice_items 
       WHERE invoice_id = invoices.id)
      ELSE 0 END
    ) AS paid_amount,
    SUM(CASE WHEN status = 'unpaid' THEN 
      (SELECT SUM(quantity * unit_price) 
       FROM invoice_items 
       WHERE invoice_id = invoices.id)
      ELSE 0 END
    ) AS unpaid_amount
  FROM
    invoices
  WHERE
    user_id = p_user_id
  GROUP BY
    DATE_TRUNC('year', date::date)
  ORDER BY
    year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER VIEW monthly_income_view OWNER TO authenticated;
ALTER VIEW yearly_income_view OWNER TO authenticated;

ALTER VIEW monthly_income_view ENABLE ROW LEVEL SECURITY;
ALTER VIEW yearly_income_view ENABLE ROW LEVEL SECURITY;

CREATE POLICY monthly_income_view_policy ON monthly_income_view
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY yearly_income_view_policy ON yearly_income_view
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
