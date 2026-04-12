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

-- Messages table (chat + DMs)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  channel text not null,
  sender_email text not null,
  sender_name text not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_channel_created
  on public.messages(channel, created_at desc);

alter table public.messages enable row level security;
create policy "Messages are viewable by everyone"
  on public.messages for select using (true);
create policy "Authenticated users can send messages"
  on public.messages for insert with check (true);

-- Track when each user last read each channel (for unread badges)
create table if not exists public.channel_last_read (
  email text not null,
  channel text not null,
  last_read_at timestamptz not null default now(),
  primary key (email, channel)
);

alter table public.channel_last_read enable row level security;
create policy "Users can read own last_read"
  on public.channel_last_read for select using (true);
create policy "Users can upsert own last_read"
  on public.channel_last_read for insert with check (true);
create policy "Users can update own last_read"
  on public.channel_last_read for update using (true);

-- DM email notification log (anti-spam: one email per recipient per cooldown)
create table if not exists public.dm_notification_log (
  recipient_email text primary key,
  last_notified_at timestamptz not null default now()
);

-- Enable realtime
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.messages;
