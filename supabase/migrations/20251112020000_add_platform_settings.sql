-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Financial settings
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),

    -- Bank account details
    bank_name TEXT,
    account_holder TEXT,
    account_number TEXT,
    account_type TEXT CHECK (account_type IN ('ahorros', 'corriente')),
    fiscal_id TEXT,
    contact_email TEXT,
    country TEXT,
    currency TEXT,
    swift_code TEXT,

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create single row constraint (only one settings record allowed)
CREATE UNIQUE INDEX IF NOT EXISTS platform_settings_singleton ON public.platform_settings ((TRUE));

-- Insert default settings
INSERT INTO public.platform_settings (commission_rate)
VALUES (15.00)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admin can view and update settings
CREATE POLICY "Admin can view platform settings"
    ON public.platform_settings
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "Admin can update platform settings"
    ON public.platform_settings
    FOR UPDATE
    TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_platform_settings_timestamp
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_settings_timestamp();
