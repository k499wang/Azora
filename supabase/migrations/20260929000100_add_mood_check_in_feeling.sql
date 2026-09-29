-- The one word picked for the day, from the short list the ratings offer.
--
-- Additive and nullable, so an existing row reads as "no word picked" and a
-- build that predates this migration never selects or writes the column. Null
-- is also what "Not sure" stores: nobody is made to label a day.
--
-- Stored as the word's stable id, never its label. The length is held by a
-- constraint so a client bug cannot turn a one-word column into free text.
alter table public.mood_check_ins
  add column if not exists feeling text;

alter table public.mood_check_ins
  drop constraint if exists mood_check_ins_feeling_length;

alter table public.mood_check_ins
  add constraint mood_check_ins_feeling_length
  check (feeling is null or char_length(feeling) <= 32);
