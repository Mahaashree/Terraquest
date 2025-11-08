-- Create products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode text NOT NULL UNIQUE,
  name text NOT NULL,
  carbon_footprint integer NOT NULL, -- 0-100 score
  recyclable boolean NOT NULL DEFAULT false,
  ethical_score integer NOT NULL, -- 0-100 score
  overall_score integer NOT NULL, -- 0-100 average sustainability score
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  display_name text,
  eco_score integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'Eco Rookie',
  total_scans integer NOT NULL DEFAULT 0,
  badges jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create scans table
CREATE TABLE public.scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create challenges table
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create rewards table
CREATE TABLE public.rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  points_required integer NOT NULL,
  partner_ngo text NOT NULL,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Products policies (public read)
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Scans policies
CREATE POLICY "Users can view their own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Challenges policies (public read)
CREATE POLICY "Anyone can view challenges"
  ON public.challenges FOR SELECT
  USING (true);

-- Rewards policies (public read)
CREATE POLICY "Anyone can view rewards"
  ON public.rewards FOR SELECT
  USING (true);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mock products
INSERT INTO public.products (barcode, name, carbon_footprint, recyclable, ethical_score, overall_score) VALUES
  ('8901030778261', 'Coca-Cola 500ml', 35, false, 50, 45),
  ('8901396301929', 'Tata Salt 1kg', 85, true, 75, 80),
  ('8901499010599', 'Dove Soap 100g', 60, true, 70, 65),
  ('8906009450012', 'Amul Milk 1L', 55, true, 80, 68),
  ('8906010940065', 'Parle-G Biscuits', 45, true, 60, 52),
  ('8906004595024', 'Fortune Sunflower Oil', 50, true, 65, 58),
  ('8901030567890', 'Paper Boat Drink', 70, true, 85, 78),
  ('8906009340078', 'Organic India Tea', 90, true, 95, 92),
  ('8901234567890', 'Himalaya Face Wash', 75, true, 80, 77),
  ('8906005678901', 'Dabur Honey 500g', 80, true, 90, 85);

-- Insert mock challenges
INSERT INTO public.challenges (title, description, points, icon) VALUES
  ('Eco Beginner', 'Scan your first eco-friendly product', 50, '🌱'),
  ('Green Week', 'Scan 5 sustainable products this week', 200, '♻️'),
  ('Plastic-Free Hero', 'Scan 3 plastic-free products', 150, '🚫'),
  ('Local Champion', 'Find and scan 2 locally-sourced products', 100, '🏪');

-- Insert mock rewards
INSERT INTO public.rewards (name, description, points_required, partner_ngo) VALUES
  ('Plant a Tree', 'GreenEarth Foundation will plant a tree in your name', 500, 'GreenEarth Foundation'),
  ('₹50 Eco Store Voucher', 'Redeem at participating eco-friendly stores', 300, 'EcoKart Network'),
  ('Beach Cleanup Donation', 'Fund beach cleanup efforts', 400, 'Ocean Warriors'),
  ('Solar Lamp for Villages', 'Donate a solar lamp to rural areas', 600, 'Light Up India');