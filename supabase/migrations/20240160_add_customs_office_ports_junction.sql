CREATE TABLE public.customs_office_ports (
  customs_office_id UUID NOT NULL
    REFERENCES public.customs_offices(id) ON DELETE CASCADE,
  port_id UUID NOT NULL
    REFERENCES public.ports(id) ON DELETE CASCADE,
  PRIMARY KEY (customs_office_id, port_id)
);

CREATE INDEX idx_customs_office_ports_customs ON public.customs_office_ports(customs_office_id);
CREATE INDEX idx_customs_office_ports_port ON public.customs_office_ports(port_id);

ALTER TABLE public.customs_office_ports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read customs_office_ports"
  ON public.customs_office_ports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow staff to insert customs_office_ports"
  ON public.customs_office_ports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('export_staff', 'import_staff', 'finance', 'super_admin')
    )
  );

CREATE POLICY "Allow staff to delete customs_office_ports"
  ON public.customs_office_ports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('export_staff', 'import_staff', 'finance', 'super_admin')
    )
  );
