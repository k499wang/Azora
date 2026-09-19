-- What else was going on, alongside how the day was rated.
--
-- Additive, and defaulted, so every existing row reads as "no tags given"
-- rather than as a row this build cannot understand. A build that predates
-- this migration keeps working: it never selects the column and never writes
-- it, and the default fills it on insert.
--
-- `text[]` rather than a join table. A tag is a fixed, client-owned label from
-- a short catalogue — the same reasoning as `answers` being jsonb: the set is
-- product content that will be edited, and a table per edit is how a check-in
-- stops being editable. Nothing joins on these; they are read back with the
-- row that owns them and counted in memory.
alter table public.mood_check_ins
  add column if not exists tags text[] not null default '{}';

-- A guard against a client writing an unbounded list, not a product rule: the
-- catalogue is short and the screen caps selection well below this.
alter table public.mood_check_ins
  drop constraint if exists mood_check_ins_tags_length;

alter table public.mood_check_ins
  add constraint mood_check_ins_tags_length
  check (cardinality(tags) <= 20);
