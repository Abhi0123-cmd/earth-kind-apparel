-- Add unique constraint on profiles.user_id so we can FK to it
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add FK from support_tickets.user_id to profiles.user_id
ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add FK from ticket_messages.sender_id to profiles.user_id
ALTER TABLE public.ticket_messages
  ADD CONSTRAINT ticket_messages_sender_id_profiles_fkey
  FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;