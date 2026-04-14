-- Myca Collective - Database Schema
-- Run this in your Supabase SQL editor

-- Members table (matches Notion fields)
create table if not exists public.members (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  first_name text,
  last_name text,
  email text not null unique,
  phone text,
  photo_url text,
  title text,
  company text,
  occupation text,
  location text[] default '{}',
  linkedin text,
  comfort_food text,
  hoping_to_get text,
  excited_to_contribute text,
  asks_and_offers text,
  attended_events text[] default '{}',
  notion_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Applications table (pending review)
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  company text not null,
  title text not null,
  occupation text,
  linkedin text not null,
  email text not null,
  phone text,
  location text[] default '{}',
  comfort_food text not null,
  hoping_to_get text not null,
  excited_to_contribute text not null,
  photo_url text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  notion_id text unique,
  created_at timestamptz default now()
);

-- Groups table
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Group members junction table
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (group_id, member_id)
);

-- Channel join requests (for restricted channels requiring validation)
create table if not exists public.channel_requests (
  id uuid default gen_random_uuid() primary key,
  channel text not null,
  email text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  unique(channel, email)
);

-- Add columns to applications (added after initial schema)
alter table public.applications add column if not exists first_name text;
alter table public.applications add column if not exists last_name text;
alter table public.applications add column if not exists instagram text;
alter table public.applications add column if not exists website text;
alter table public.applications add column if not exists industry_focus text;
alter table public.applications add column if not exists skills text;
alter table public.applications add column if not exists interests text;
alter table public.applications add column if not exists years_experience text;
alter table public.applications add column if not exists referral_source text;
alter table public.applications add column if not exists referred_by_name text;
alter table public.applications add column if not exists referred_by_email text;
alter table public.applications add column if not exists tiktok text;
alter table public.applications add column if not exists twitter text;
alter table public.applications add column if not exists substack text;
alter table public.applications add column if not exists superpower text;
alter table public.applications add column if not exists asks text;
alter table public.applications add column if not exists offers text;

-- Email tracking for acceptance emails
alter table public.applications add column if not exists email_id text;
alter table public.applications add column if not exists email_status text;

-- Add instagram, skills, and interests to contacts (Notion-synced member table)
-- Skills/interests are comma-separated tags used for matching
alter table public.contacts add column if not exists instagram text;
alter table public.contacts add column if not exists substack text;
alter table public.contacts add column if not exists skills text;
alter table public.contacts add column if not exists interests text;

-- Unique constraint on contacts email (required for upsert on acceptance)
alter table public.contacts add constraint contacts_email_unique unique (email);

-- Indexes
create index if not exists idx_members_location on public.members using gin(location);
create index if not exists idx_members_email on public.members(email);
create index if not exists idx_members_notion_id on public.members(notion_id);
create index if not exists idx_applications_status on public.applications(status);

-- Full-text search
alter table public.members add column if not exists fts tsvector
  generated always as (
    to_tsvector('english',
      coalesce(full_name, '') || ' ' ||
      coalesce(title, '') || ' ' ||
      coalesce(company, '') || ' ' ||
      coalesce(occupation, '') || ' ' ||
      coalesce(comfort_food, '')
    )
  ) stored;

create index if not exists idx_members_fts on public.members using gin(fts);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists members_updated_at on public.members;
create trigger members_updated_at
  before update on public.members
  for each row execute function public.update_updated_at();

-- Row Level Security
alter table public.members enable row level security;
alter table public.applications enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Members: only authenticated users can read
create policy "Members are viewable by authenticated users"
  on public.members for select using (auth.role() = 'authenticated');

-- Applications: anyone can insert (public form), only service role can read
create policy "Anyone can submit an application"
  on public.applications for insert with check (true);

-- Groups: only authenticated users can read and manage
create policy "Groups are viewable by authenticated users"
  on public.groups for select using (auth.role() = 'authenticated');
create policy "Authenticated users can create groups"
  on public.groups for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete groups"
  on public.groups for delete using (auth.role() = 'authenticated');

create policy "Group members are viewable by authenticated users"
  on public.group_members for select using (auth.role() = 'authenticated');
create policy "Authenticated users can manage group members"
  on public.group_members for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can remove group members"
  on public.group_members for delete using (auth.role() = 'authenticated');

-- Channel requests: anyone can submit, authenticated users can view their own
alter table public.channel_requests enable row level security;
create policy "Anyone can request to join a channel"
  on public.channel_requests for insert with check (true);
create policy "Authenticated users can view their own requests"
  on public.channel_requests for select using (auth.role() = 'authenticated');

-- Enable realtime
alter publication supabase_realtime add table public.members;

-- Full-text search on contacts table for Ask Myca bot
alter table public.contacts add column if not exists search_text tsvector
  generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(company, '') || ' ' ||
      coalesce(role, '') || ' ' ||
      coalesce(occupation_type, '') || ' ' ||
      coalesce(location, '') || ' ' ||
      coalesce(industry_tags, '') || ' ' ||
      coalesce(focus_areas, '') || ' ' ||
      coalesce(skills, '') || ' ' ||
      coalesce(interests, '') || ' ' ||
      coalesce(superpower, '') || ' ' ||
      coalesce(asks, '') || ' ' ||
      coalesce(offers, '') || ' ' ||
      coalesce(notes, '') || ' ' ||
      coalesce(communities, '')
    )
  ) stored;

create index if not exists idx_contacts_search on public.contacts using gin(search_text);

-- RPC function for full-text search (used by the Ask Myca bot)
create or replace function search_contacts(query_text text, match_limit int default 25)
returns setof contacts as $$
  select *
  from contacts
  where is_myca_member = true
    and search_text @@ websearch_to_tsquery('english', query_text)
  order by ts_rank(search_text, websearch_to_tsquery('english', query_text)) desc
  limit match_limit;
$$ language sql stable;
