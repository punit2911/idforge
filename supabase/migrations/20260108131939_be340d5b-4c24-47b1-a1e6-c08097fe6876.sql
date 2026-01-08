
-- Add admin policies for pending_subscriptions table
CREATE POLICY "Admins can view all pending subscriptions"
ON public.pending_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all pending subscriptions"
ON public.pending_subscriptions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy for profiles (to see user emails)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
