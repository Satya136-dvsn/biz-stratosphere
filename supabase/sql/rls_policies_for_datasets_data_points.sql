-- RLS policies for datasets table
DROP POLICY IF EXISTS "Datasets: select for owner" ON public.datasets;
DROP POLICY IF EXISTS "Datasets: insert for owner" ON public.datasets;
DROP POLICY IF EXISTS "Datasets: update for owner" ON public.datasets;
DROP POLICY IF EXISTS "Datasets: delete for owner" ON public.datasets;

CREATE POLICY "Datasets: select for owner" ON public.datasets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Datasets: insert for owner" ON public.datasets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Datasets: update for owner" ON public.datasets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Datasets: delete for owner" ON public.datasets
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS policies for data_points table
DROP POLICY IF EXISTS "DataPoints: select for owner" ON public.data_points;
DROP POLICY IF EXISTS "DataPoints: insert for owner" ON public.data_points;
DROP POLICY IF EXISTS "DataPoints: update for owner" ON public.data_points;
DROP POLICY IF EXISTS "DataPoints: delete for owner" ON public.data_points;

CREATE POLICY "DataPoints: select for owner" ON public.data_points
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "DataPoints: insert for owner" ON public.data_points
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "DataPoints: update for owner" ON public.data_points
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "DataPoints: delete for owner" ON public.data_points
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
