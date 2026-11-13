-- ====================================================================
-- WORKOUT APP — ADD GOOGLE CALENDAR ICAL URL TO USER SETTINGS
-- ====================================================================

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS google_ical_url TEXT;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
