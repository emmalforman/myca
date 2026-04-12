-- Events table for Myca weekly calendar & newsletter
-- Run this in your Supabase SQL editor

-- Create the updated_at trigger function (if it doesn't already exist)
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  host text,
  host_company text,
  description text,
  date date not null,
  day_of_week text,
  start_time text,
  end_time text,
  location text,
  city text default 'New York',
  rsvp_url text,
  rsvp_platform text,
  cover_image_url text,
  source text default 'manual',
  source_event_id text,
  submitted_by_name text,
  submitted_by_email text,
  is_myca_member_event boolean default false,
  is_featured boolean default false,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  personal_note text,
  newsletter_included boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_events_date on public.events(date);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_city on public.events(city);
create index if not exists idx_events_source_event_id on public.events(source_event_id);

-- Auto-update updated_at (reuses existing function from schema.sql)
drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute function public.update_updated_at();

-- RLS
alter table public.events enable row level security;

create policy "Approved events are viewable by everyone"
  on public.events for select using (status = 'approved');

create policy "Anyone can submit events"
  on public.events for insert with check (true);
