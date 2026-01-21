-- Supabase SQL: Voting tables + RLS policies for anonymous event voting
-- This matches the app code which uses tables: votes, vote_options, user_votes
-- Run in Supabase SQL Editor.

-- 1) Tables
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  type text not null default 'general',
  question text not null,
  deadline timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.vote_options (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes(id) on delete cascade,
  option_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_option_id uuid not null references public.vote_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vote_option_id)
);

-- Helpful index (optional)
create index if not exists user_votes_vote_option_id_idx on public.user_votes(vote_option_id);
create index if not exists vote_options_vote_id_idx on public.vote_options(vote_id);
create index if not exists votes_event_id_idx on public.votes(event_id);

-- 2) RLS
alter table public.votes enable row level security;
alter table public.vote_options enable row level security;
alter table public.user_votes enable row level security;

-- Helper: a user has access to an event if they're the creator OR in users_events
-- NOTE: this is used inline in policies below.

-- votes: SELECT for event creator or accepted participant
drop policy if exists "votes_select_event_members" on public.votes;
create policy "votes_select_event_members"
on public.votes
for select
using (
  exists (
    select 1 from public.events e
    where e.id = votes.event_id
      and (e.creator_id = auth.uid()
           or exists (
             select 1 from public.users_events ue
             where ue.event_id = e.id and ue.user_id = auth.uid()
           ))
  )
);

-- votes: INSERT only for event creator
drop policy if exists "votes_insert_event_creator" on public.votes;
create policy "votes_insert_event_creator"
on public.votes
for insert
with check (
  exists (
    select 1 from public.events e
    where e.id = votes.event_id and e.creator_id = auth.uid()
  )
);

-- votes: UPDATE/DELETE only for event creator
drop policy if exists "votes_update_event_creator" on public.votes;
create policy "votes_update_event_creator"
on public.votes
for update
using (
  exists (select 1 from public.events e where e.id = votes.event_id and e.creator_id = auth.uid())
)
with check (
  exists (select 1 from public.events e where e.id = votes.event_id and e.creator_id = auth.uid())
);

drop policy if exists "votes_delete_event_creator" on public.votes;
create policy "votes_delete_event_creator"
on public.votes
for delete
using (
  exists (select 1 from public.events e where e.id = votes.event_id and e.creator_id = auth.uid())
);

-- vote_options: SELECT for event creator or accepted participant (via parent vote -> event)
drop policy if exists "vote_options_select_event_members" on public.vote_options;
create policy "vote_options_select_event_members"
on public.vote_options
for select
using (
  exists (
    select 1
    from public.votes v
    join public.events e on e.id = v.event_id
    where v.id = vote_options.vote_id
      and (e.creator_id = auth.uid()
           or exists (
             select 1 from public.users_events ue
             where ue.event_id = e.id and ue.user_id = auth.uid()
           ))
  )
);

-- vote_options: INSERT/UPDATE/DELETE only for event creator
drop policy if exists "vote_options_modify_event_creator" on public.vote_options;
create policy "vote_options_modify_event_creator"
on public.vote_options
for all
using (
  exists (
    select 1
    from public.votes v
    join public.events e on e.id = v.event_id
    where v.id = vote_options.vote_id and e.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.votes v
    join public.events e on e.id = v.event_id
    where v.id = vote_options.vote_id and e.creator_id = auth.uid()
  )
);

-- user_votes: SELECT for event creator or accepted participant (server uses this to compute totals)
drop policy if exists "user_votes_select_event_members" on public.user_votes;
create policy "user_votes_select_event_members"
on public.user_votes
for select
using (
  exists (
    select 1
    from public.vote_options vo
    join public.votes v on v.id = vo.vote_id
    join public.events e on e.id = v.event_id
    where vo.id = user_votes.vote_option_id
      and (e.creator_id = auth.uid()
           or exists (
             select 1 from public.users_events ue
             where ue.event_id = e.id and ue.user_id = auth.uid()
           ))
  )
);

-- user_votes: INSERT only for accepted participants or creator
drop policy if exists "user_votes_insert_event_members" on public.user_votes;
create policy "user_votes_insert_event_members"
on public.user_votes
for insert
with check (
  user_votes.user_id = auth.uid()
  and exists (
    select 1
    from public.vote_options vo
    join public.votes v on v.id = vo.vote_id
    join public.events e on e.id = v.event_id
    where vo.id = user_votes.vote_option_id
      and (e.creator_id = auth.uid()
           or exists (
             select 1 from public.users_events ue
             where ue.event_id = e.id and ue.user_id = auth.uid()
           ))
  )
);

-- user_votes: DELETE only own rows (needed for "revote" implementation)
drop policy if exists "user_votes_delete_own" on public.user_votes;
create policy "user_votes_delete_own"
on public.user_votes
for delete
using (user_votes.user_id = auth.uid());


