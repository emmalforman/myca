-- Myca Member Directory Schema
-- Run this in your Supabase SQL editor to set up the database

-- Members table
create table if not exists public.members (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  photo_url text,
  title text,
  company text,
  location text,
  industry text,
  bio text,
  tags text[] default '{}',
  linkedin text,
  twitter text,
  website text,
  joined_date date,
  notion_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

-- Indexes for fast queries
create index if not exists idx_members_industry on public.members(industry);
create index if not exists idx_members_location on public.members(location);
create index if not exists idx_members_tags on public.members using gin(tags);
create index if not exists idx_members_notion_id on public.members(notion_id);
create index if not exists idx_members_email on public.members(email);

-- Full-text search index
alter table public.members add column if not exists fts tsvector
  generated always as (
    to_tsvector('english',
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '') || ' ' ||
      coalesce(title, '') || ' ' ||
      coalesce(company, '') || ' ' ||
      coalesce(bio, '') || ' ' ||
      coalesce(industry, '') || ' ' ||
      coalesce(location, '')
    )
  ) stored;

create index if not exists idx_members_fts on public.members using gin(fts);

-- Auto-update updated_at timestamp
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

-- Enable Row Level Security (public read, authenticated write)
alter table public.members enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Public read access for the directory
create policy "Members are viewable by everyone"
  on public.members for select using (true);

create policy "Groups are viewable by everyone"
  on public.groups for select using (true);

create policy "Group members are viewable by everyone"
  on public.group_members for select using (true);

-- Authenticated users can manage groups
create policy "Authenticated users can create groups"
  on public.groups for insert with check (true);

create policy "Authenticated users can delete groups"
  on public.groups for delete using (true);

create policy "Authenticated users can manage group members"
  on public.group_members for insert with check (true);

create policy "Authenticated users can remove group members"
  on public.group_members for delete using (true);

-- Enable realtime
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.group_members;
