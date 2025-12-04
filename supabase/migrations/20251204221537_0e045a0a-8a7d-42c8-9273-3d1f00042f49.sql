-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create attacks table
CREATE TABLE public.attacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_ip TEXT,
  target_url TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  attack_type TEXT NOT NULL,
  confidence DECIMAL(5,2) DEFAULT 0,
  is_success BOOLEAN DEFAULT false,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  raw_request TEXT,
  raw_response TEXT,
  metadata JSONB DEFAULT '{}',
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on attacks
ALTER TABLE public.attacks ENABLE ROW LEVEL SECURITY;

-- Attacks policies
CREATE POLICY "Users can view their own attacks"
ON public.attacks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attacks"
ON public.attacks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attacks"
ON public.attacks FOR DELETE
USING (auth.uid() = user_id);

-- Create uploaded_files table
CREATE TABLE public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pcap', 'log', 'json', 'csv')),
  file_size INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  storage_path TEXT,
  analysis_results JSONB DEFAULT '{}',
  attacks_found INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on uploaded_files
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Uploaded files policies
CREATE POLICY "Users can view their own files"
ON public.uploaded_files FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
ON public.uploaded_files FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
ON public.uploaded_files FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
ON public.uploaded_files FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false);

-- Storage policies
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX idx_attacks_user_id ON public.attacks(user_id);
CREATE INDEX idx_attacks_detected_at ON public.attacks(detected_at DESC);
CREATE INDEX idx_attacks_attack_type ON public.attacks(attack_type);
CREATE INDEX idx_uploaded_files_user_id ON public.uploaded_files(user_id);
CREATE INDEX idx_uploaded_files_status ON public.uploaded_files(status);