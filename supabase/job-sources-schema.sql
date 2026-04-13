-- Tracked company job boards for auto-importing roles
-- Run this in your Supabase SQL editor

create table if not exists public.job_sources (
  id uuid default gen_random_uuid() primary key,
  company_name text not null,
  platform text not null check (platform in ('greenhouse', 'lever', 'ashby')),
  slug text not null,
  category text check (category in ('food-startup', 'large-food', 'vc', 'community', 'other')),
  is_active boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- Prevent duplicate sources
create unique index if not exists idx_job_sources_unique
  on public.job_sources(platform, slug);

create index if not exists idx_job_sources_active
  on public.job_sources(is_active) where is_active = true;

-- RLS
alter table public.job_sources enable row level security;

create policy "Authenticated users can view job sources"
  on public.job_sources for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage job sources"
  on public.job_sources for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update job sources"
  on public.job_sources for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete job sources"
  on public.job_sources for delete using (auth.role() = 'authenticated');
