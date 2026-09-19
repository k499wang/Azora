-- One optional line, in the user's own words.
--
-- Additive and nullable, so an existing row reads as "nothing written" and a
-- build that predates this migration never selects or writes the column.
--
-- Short on purpose. This is the line under a check-in, not a journal: the
-- length is held by a constraint so a client bug cannot turn a daily row into
-- a document, and the screen caps it well below the limit.
alter table public.mood_check_ins
  add column if not exists note text;

alter table public.mood_check_ins
  drop constraint if exists mood_check_ins_note_length;

alter table public.mood_check_ins
  add constraint mood_check_ins_note_length
  check (note is null or char_length(note) <= 280);
