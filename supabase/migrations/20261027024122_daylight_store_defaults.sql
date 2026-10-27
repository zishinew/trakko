-- Defaults match new stores created through Trakko's daylight editor.
-- Existing producer-selected colors and themes remain unchanged.
alter table public.stores alter column accent set default '#0069e0';
alter table public.stores alter column theme set default 'light';
