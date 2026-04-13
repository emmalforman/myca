-- Jobs board for Myca members
-- Run this in your Supabase SQL editor

create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company text not null,
  location text,
  location_type text default 'onsite' check (location_type in ('onsite', 'remote', 'hybrid')),
  type text default 'full-time' check (type in ('full-time', 'part-time', 'contract', 'freelance', 'internship')),
  description text not null,
  apply_url text,
  apply_email text,
  salary_range text,
  submitted_by_name text,
  submitted_by_email text,
  contact_name text,
  contact_email text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_created_at on public.jobs(created_at desc);
create index if not exists idx_jobs_type on public.jobs(type);

-- Auto-update updated_at (reuses existing function from schema.sql)
drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.update_updated_at();

-- RLS
alter table public.jobs enable row level security;

create policy "Approved jobs are viewable by authenticated users"
  on public.jobs for select using (auth.role() = 'authenticated' and status = 'approved');

create policy "Authenticated users can submit jobs"
  on public.jobs for insert with check (auth.role() = 'authenticated');
