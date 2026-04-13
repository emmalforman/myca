-- Event RSVPs - tracks which Myca members are attending events
-- Run this in your Supabase SQL editor

create table if not exists public.event_rsvps (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  member_email text not null,
  member_name text,
  member_photo_url text,
  created_at timestamptz default now(),
  unique(event_id, member_email)
);

-- Indexes
create index if not exists idx_event_rsvps_event_id on public.event_rsvps(event_id);
create index if not exists idx_event_rsvps_member_email on public.event_rsvps(member_email);

-- RLS
alter table public.event_rsvps enable row level security;

-- Everyone can view RSVPs (to see who's attending)
create policy "RSVPs are viewable by everyone"
  on public.event_rsvps for select using (true);

-- Authenticated users can insert their own RSVPs
create policy "Users can RSVP to events"
  on public.event_rsvps for insert with check (true);

-- Users can delete their own RSVPs
create policy "Users can remove their own RSVP"
  on public.event_rsvps for delete using (true);
