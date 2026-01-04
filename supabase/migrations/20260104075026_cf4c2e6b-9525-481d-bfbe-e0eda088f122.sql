-- Chat history table for persistent conversations
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own chat messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = user_id);

-- Add marketplace columns to saved_designs
ALTER TABLE public.saved_designs
ADD COLUMN IF NOT EXISTS price numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS description text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_for_sale boolean NOT NULL DEFAULT false;

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;