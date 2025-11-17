-- Insert default platform settings record if none exists
INSERT INTO public.platform_settings (
  commission_rate,
  bank_name,
  account_holder,
  account_number,
  account_type,
  fiscal_id,
  contact_email,
  country,
  currency
)
SELECT
  15.00,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'Ecuador',
  'USD'
WHERE NOT EXISTS (
  SELECT 1 FROM public.platform_settings
);
