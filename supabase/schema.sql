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

-- Enriched company metadata for better member matching
create table if not exists public.company_metadata (
  id uuid default gen_random_uuid() primary key,
  company_name text not null unique,
  industry text,           -- e.g. "Food & Beverage", "Agriculture", "Food Tech"
  sub_category text,       -- e.g. "Snacks", "Dairy Alternative", "Restaurant Tech"
  business_model text,     -- e.g. "DTC", "B2B", "Marketplace", "Retail", "SaaS"
  company_stage text check (company_stage in ('pre-seed', 'seed', 'series-a', 'series-b', 'growth', 'public', 'acquired', 'bootstrapped', null)),
  company_size text check (company_size in ('1-10', '11-50', '51-200', '201-500', '500+', null)),
  founded_year int,
  headquarters text,       -- city/region
  description text,        -- short company description
  keywords text,           -- comma-separated tags for matching (e.g. "plant-based,sustainability,snacks")
  enriched_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_company_metadata_name on public.company_metadata(company_name);
create index if not exists idx_company_metadata_industry on public.company_metadata(industry);

alter table public.company_metadata enable row level security;
create policy "Company metadata is viewable by everyone"
  on public.company_metadata for select using (true);
create policy "Anyone can insert company metadata"
  on public.company_metadata for insert with check (true);
create policy "Anyone can update company metadata"
  on public.company_metadata for update using (true);

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

-- Public read for directory
create policy "Members are viewable by everyone"
  on public.members for select using (true);

-- Applications: anyone can insert, only admin can read
create policy "Anyone can submit an application"
  on public.applications for insert with check (true);

-- Groups: public read, anyone can manage
create policy "Groups are viewable by everyone"
  on public.groups for select using (true);
create policy "Anyone can create groups"
  on public.groups for insert with check (true);
create policy "Anyone can delete groups"
  on public.groups for delete using (true);

create policy "Group members are viewable by everyone"
  on public.group_members for select using (true);
create policy "Anyone can manage group members"
  on public.group_members for insert with check (true);
create policy "Anyone can remove group members"
  on public.group_members for delete using (true);

-- Channel requests: anyone can submit, admin reads
alter table public.channel_requests enable row level security;
create policy "Anyone can request to join a channel"
  on public.channel_requests for insert with check (true);
create policy "Members can view their own requests"
  on public.channel_requests for select using (true);

-- Enable realtime
alter publication supabase_realtime add table public.members;
