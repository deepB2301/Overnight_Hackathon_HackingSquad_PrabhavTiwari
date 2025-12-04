-- Add new columns to attacks table for enhanced detection
ALTER TABLE public.attacks 
ADD COLUMN IF NOT EXISTS detection_method text DEFAULT 'ai',
ADD COLUMN IF NOT EXISTS mitre_tactic text,
ADD COLUMN IF NOT EXISTS mitre_technique text,
ADD COLUMN IF NOT EXISTS mitre_id text,
ADD COLUMN IF NOT EXISTS iocs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS signatures_matched jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS anomaly_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payload text,
ADD COLUMN IF NOT EXISTS response_code integer,
ADD COLUMN IF NOT EXISTS response_size integer;

-- Create index for faster searching
CREATE INDEX IF NOT EXISTS idx_attacks_attack_type ON public.attacks(attack_type);
CREATE INDEX IF NOT EXISTS idx_attacks_severity ON public.attacks(severity);
CREATE INDEX IF NOT EXISTS idx_attacks_mitre_id ON public.attacks(mitre_id);
CREATE INDEX IF NOT EXISTS idx_attacks_detected_at ON public.attacks(detected_at DESC);

-- Create reports table for automated reporting
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  report_type text NOT NULL DEFAULT 'summary',
  date_range_start timestamp with time zone,
  date_range_end timestamp with time zone,
  content jsonb DEFAULT '{}'::jsonb,
  generated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON public.reports
  FOR DELETE USING (auth.uid() = user_id);