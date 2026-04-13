-- Track which members click "Apply" on job listings
-- Run this in your Supabase SQL editor

create table if not exists public.job_applications (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  member_name text not null,
  member_email text not null,
  clicked_at timestamptz default now()
);

-- Indexes
create index if not exists idx_job_applications_job_id on public.job_applications(job_id);
create index if not exists idx_job_applications_email on public.job_applications(member_email);

-- Prevent duplicate clicks from same member on same job
create unique index if not exists idx_job_applications_unique
  on public.job_applications(job_id, member_email);

-- RLS
alter table public.job_applications enable row level security;

create policy "Authenticated users can insert applications"
  on public.job_applications for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can view applications"
  on public.job_applications for select using (auth.role() = 'authenticated');
