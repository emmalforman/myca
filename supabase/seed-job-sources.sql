-- Seed job sources for auto-importing roles
-- Run this in your Supabase SQL editor AFTER creating the job_sources table

INSERT INTO public.job_sources (company_name, platform, slug, category) VALUES
  -- Food Startups / DTC Food
  ('Sweetgreen', 'greenhouse', 'sweetgreen', 'food-startup'),
  ('Hungryroot', 'greenhouse', 'hungryroot', 'food-startup'),
  ('Thrive Market', 'greenhouse', 'thrivemarket', 'food-startup'),
  ('Instacart', 'greenhouse', 'instacart', 'food-startup'),
  ('Faire', 'greenhouse', 'faire', 'food-startup'),
  ('Gopuff', 'lever', 'gopuff', 'food-startup'),
  ('Impossible Foods', 'ashby', 'impossible-foods', 'food-startup'),
  ('Upside Foods', 'greenhouse', 'upside', 'food-startup'),
  ('Olipop', 'greenhouse', 'olipop', 'food-startup'),
  ('AG1', 'greenhouse', 'ag1', 'food-startup'),
  ('Goldbelly', 'greenhouse', 'goldbelly', 'food-startup'),
  ('Olo', 'lever', 'olo', 'food-startup'),

  -- VC Firms
  ('a16z', 'greenhouse', 'a16z', 'vc'),
  ('General Catalyst', 'greenhouse', 'generalcatalyst', 'vc'),
  ('Greycroft', 'greenhouse', 'greycroft', 'vc'),
  ('Forerunner Ventures', 'ashby', 'forerunner', 'vc'),
  ('Index Ventures', 'lever', 'indexventures', 'vc'),

  -- Community / Membership
  ('Soho House', 'greenhouse', 'sohohouseco', 'community'),
  ('Chief', 'ashby', 'chief', 'community'),

  -- Other
  ('Ando', 'ashby', 'ando', 'other')

ON CONFLICT (platform, slug) DO NOTHING;
