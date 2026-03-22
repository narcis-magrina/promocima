-- ═══════════════════════════════════════════════════════════════════════════════
--  SCHEMA COMPLETO — PROMOCIMA
--  Generado: 2026-03-22
--  Ejecutar en un proyecto Supabase nuevo desde el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. TABLAS ─────────────────────────────────────────────────────────────────

CREATE TABLE public.empresas (
  id text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  activa boolean NOT NULL,
  created_at timestamp with time zone
);

CREATE TABLE public.perfiles (
  id uuid NOT NULL,
  email text NOT NULL,
  nombre text NOT NULL,
  rol text NOT NULL,
  participe_id text,
  activo boolean NOT NULL,
  created_at timestamp with time zone NOT NULL,
  participe_ids text[] NOT NULL,
  empresa_id text NOT NULL
);

CREATE TABLE public.clientes (
  id text NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL,
  cif text,
  telefono text,
  email text,
  notas text,
  created_at timestamp with time zone,
  empresa_id text NOT NULL
);

CREATE TABLE public.intermediarios (
  id text NOT NULL,
  nombre text NOT NULL,
  empresa text,
  telefono text,
  email text,
  created_at timestamp with time zone,
  empresa_id text NOT NULL
);

CREATE TABLE public.participes (
  id text NOT NULL,
  tipo text NOT NULL,
  nombre text NOT NULL,
  nif text,
  direccion text,
  email text,
  telefono text,
  centro_coste integer NOT NULL,
  activo boolean,
  fecha_alta date,
  created_at timestamp with time zone,
  empresa_id text NOT NULL
);

CREATE TABLE public.prestamos (
  id text NOT NULL,
  alias text NOT NULL,
  centro_coste text,
  cliente_id text,
  intermediario_id text,
  importe numeric(14,2) NOT NULL,
  fecha_inicio date NOT NULL,
  duracion_meses integer NOT NULL,
  dia_cobro integer NOT NULL,
  periodicidad text,
  tipo_prestamo text NOT NULL,
  interes_ordinario numeric(5,2) NOT NULL,
  interes_demora numeric(5,2) NOT NULL,
  comision_apertura numeric(5,2),
  estado text,
  fecha_cancelacion date,
  judicializado boolean,
  fecha_judicializacion date,
  importe_demanda numeric(14,2),
  created_at timestamp with time zone,
  demanda_principal numeric(12,2),
  demanda_interes_ordinario numeric(12,2),
  demanda_gastos numeric(12,2),
  cirbe boolean,
  garantia_tasacion numeric(14,2),
  garantia_tipo text,
  garantia_direccion text,
  meses_carencia integer,
  origen_prestamo_id text,
  empresa_id text NOT NULL
);

CREATE TABLE public.cobros (
  id text NOT NULL,
  prestamo_id text,
  cuota_num text NOT NULL,
  fecha_teorica date,
  fecha_real date NOT NULL,
  importe numeric(14,2) NOT NULL,
  tipo text,
  notas text,
  created_at timestamp with time zone,
  importe_principal numeric(12,2),
  importe_interes_ordinario numeric(12,2),
  importe_interes_demora numeric(12,2),
  importe_gastos numeric(12,2),
  gastos_devengan numeric(12,2),
  modalidad_recalculo text,
  fecha_real_cobro date,
  importe_real_cobro numeric(12,2),
  empresa_id text NOT NULL
);

CREATE TABLE public.titulares (
  id text NOT NULL,
  cliente_id text NOT NULL,
  nombre text NOT NULL,
  cif text,
  tipo text NOT NULL,
  created_at timestamp with time zone,
  tipo_id character varying,
  sector_id character varying,
  codigo_pais text,
  codigo_provincia text,
  estado_validacion text,
  ultimo_error_bde text,
  empresa_id text NOT NULL
);

CREATE TABLE public.contratos_ccp (
  id text NOT NULL,
  participe_id text,
  prestamo_id text,
  fecha_firma date NOT NULL,
  importe_participacion numeric(14,2) NOT NULL,
  porcentaje_participacion numeric(8,4) NOT NULL,
  porcentaje_gestion numeric(5,2),
  porcentaje_apertura numeric(5,2),
  activo boolean,
  fecha_alta date,
  created_at timestamp with time zone,
  empresa_id text NOT NULL
);

CREATE TABLE public.pagos_reales_participe (
  id text NOT NULL,
  contrato_ccp_id text,
  pago_prestamo_id text,
  principal_pendiente numeric(14,2),
  importe_gestion numeric(14,2),
  importe_bruto numeric(14,2),
  importe_retencion numeric(14,2),
  importe_neto numeric(14,2),
  fecha_pago_real date,
  observaciones text,
  created_at timestamp with time zone,
  importe_devengado numeric(12,2),
  empresa_id text NOT NULL
);

CREATE TABLE public.config (
  id integer NOT NULL,
  interes_ordinario numeric(5,2),
  interes_demora numeric(5,2),
  comision_apertura numeric(5,2),
  gestion numeric(5,2),
  porcentaje_irpf numeric(5,2),
  dia_cobro_participes integer,
  porcentaje_gestion_defecto numeric(5,2),
  porcentaje_apertura_defecto numeric(5,2),
  nombre_empresa text,
  "id_BdE" text,
  fecha_referencia date,
  fecha_cierre_portal date,
  empresa_id text NOT NULL
);

CREATE TABLE public.email_templates (
  id integer NOT NULL,
  nombre text NOT NULL,
  asunto text NOT NULL,
  cuerpo_html text NOT NULL,
  updated_at timestamp with time zone
);

CREATE TABLE public.emails_pendientes (
  id integer NOT NULL,
  para text NOT NULL,
  asunto text,
  nombre text,
  password text,
  url text,
  enviado boolean,
  template_nombre text,
  created_at timestamp with time zone
);

-- Tablas BdE
CREATE TABLE public."BdE_Sectores" (
  codigo character varying(5) NOT NULL,
  descripcion text NOT NULL
);

CREATE TABLE public."BdE_Tipos_id" (
  id character varying(1) NOT NULL,
  descripcion text NOT NULL
);

CREATE TABLE public."BdE_Titulares" (
  id uuid NOT NULL,
  tipo_id character varying(1),
  identificacion character varying(10) NOT NULL,
  nombre_razon_social character varying(80) NOT NULL,
  sector_institucional character varying(5),
  codigo_pais character varying(3),
  codigo_provincia character varying(2) NOT NULL,
  estado_validacion character varying(20),
  ultimo_error_bde character varying(4),
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

CREATE TABLE public."BdE_Titulares_Enviados" (
  identificacion text NOT NULL,
  hash_datos text,
  fecha_ultimo_envio timestamp with time zone
);

CREATE TABLE public."BdE_Operaciones" (
  id uuid NOT NULL,
  codigo_expediente character varying(20) NOT NULL,
  fecha_firma date NOT NULL,
  fecha_vencimiento date,
  importe_principal numeric(15,2),
  riesgo_total numeric(15,2),
  estado_operacion character varying(20),
  created_at timestamp with time zone,
  prestamo_id text,
  situacion_bde text,
  empresa_id text
);

CREATE TABLE public."BdE_Operaciones_Enviadas" (
  codigo_expediente text NOT NULL,
  importe_ultimo_envio numeric(15,2),
  riesgo_ultimo_envio numeric(15,2),
  fecha_ultimo_envio timestamp with time zone
);

CREATE TABLE public."BdE_Operaciones_Titulares" (
  operacion_id uuid NOT NULL,
  titular_id uuid NOT NULL
);


-- ── 2. PRIMARY KEYS ───────────────────────────────────────────────────────────

ALTER TABLE public.empresas                  ADD PRIMARY KEY (id);
ALTER TABLE public.perfiles                  ADD PRIMARY KEY (id);
ALTER TABLE public.clientes                  ADD PRIMARY KEY (empresa_id, id);
ALTER TABLE public.intermediarios            ADD PRIMARY KEY (empresa_id, id);
ALTER TABLE public.participes                ADD PRIMARY KEY (empresa_id, id);
ALTER TABLE public.prestamos                 ADD PRIMARY KEY (empresa_id, id);
ALTER TABLE public.cobros                    ADD PRIMARY KEY (empresa_id, id);
ALTER TABLE public.titulares                 ADD PRIMARY KEY (empresa_id, id);
ALTER TABLE public.contratos_ccp             ADD PRIMARY KEY (empresa_id, id);
ALTER TABLE public.pagos_reales_participe    ADD PRIMARY KEY (empresa_id, id);
ALTER TABLE public.config                    ADD PRIMARY KEY (empresa_id, id);
ALTER TABLE public.email_templates           ADD PRIMARY KEY (id);
ALTER TABLE public.emails_pendientes         ADD PRIMARY KEY (id);
ALTER TABLE public."BdE_Sectores"            ADD PRIMARY KEY (codigo);
ALTER TABLE public."BdE_Tipos_id"            ADD PRIMARY KEY (id);
ALTER TABLE public."BdE_Titulares"           ADD PRIMARY KEY (id);
ALTER TABLE public."BdE_Titulares_Enviados"  ADD PRIMARY KEY (identificacion);
ALTER TABLE public."BdE_Operaciones"         ADD PRIMARY KEY (id);
ALTER TABLE public."BdE_Operaciones_Enviadas" ADD PRIMARY KEY (codigo_expediente);
ALTER TABLE public."BdE_Operaciones_Titulares" ADD PRIMARY KEY (operacion_id, titular_id);


-- ── 3. UNIQUE CONSTRAINTS ─────────────────────────────────────────────────────

ALTER TABLE public."BdE_Operaciones"  ADD CONSTRAINT "BdE_Operaciones_codigo_expediente_key" UNIQUE (codigo_expediente);
ALTER TABLE public."BdE_Titulares"    ADD CONSTRAINT unique_nif_periodo UNIQUE (identificacion);
ALTER TABLE public.email_templates    ADD CONSTRAINT email_templates_nombre_key UNIQUE (nombre);
ALTER TABLE public.participes         ADD CONSTRAINT participes_nif_key UNIQUE (nif);


-- ── 4. FOREIGN KEYS ───────────────────────────────────────────────────────────

-- perfiles → empresas
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- clientes → empresas
ALTER TABLE public.clientes ADD CONSTRAINT clientes_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- intermediarios → empresas
ALTER TABLE public.intermediarios ADD CONSTRAINT intermediarios_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- participes → empresas
ALTER TABLE public.participes ADD CONSTRAINT participes_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- titulares → empresas + clientes
ALTER TABLE public.titulares ADD CONSTRAINT titulares_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);
ALTER TABLE public.titulares ADD CONSTRAINT titulares_cliente_fkey
  FOREIGN KEY (empresa_id, cliente_id) REFERENCES clientes(empresa_id, id);

-- prestamos → empresas + clientes + intermediarios + origen
ALTER TABLE public.prestamos ADD CONSTRAINT prestamos_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);
ALTER TABLE public.prestamos ADD CONSTRAINT prestamos_cliente_fkey
  FOREIGN KEY (empresa_id, cliente_id) REFERENCES clientes(empresa_id, id);
ALTER TABLE public.prestamos ADD CONSTRAINT prestamos_intermediario_fkey
  FOREIGN KEY (empresa_id, intermediario_id) REFERENCES intermediarios(empresa_id, id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE public.prestamos ADD CONSTRAINT prestamos_origen_prestamo_fkey
  FOREIGN KEY (empresa_id, origen_prestamo_id) REFERENCES prestamos(empresa_id, id) DEFERRABLE INITIALLY DEFERRED;

-- cobros → empresas + prestamos
ALTER TABLE public.cobros ADD CONSTRAINT cobros_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);
ALTER TABLE public.cobros ADD CONSTRAINT cobros_prestamo_fkey
  FOREIGN KEY (empresa_id, prestamo_id) REFERENCES prestamos(empresa_id, id);

-- contratos_ccp → empresas + prestamos + participes
ALTER TABLE public.contratos_ccp ADD CONSTRAINT contratos_ccp_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);
ALTER TABLE public.contratos_ccp ADD CONSTRAINT contratos_ccp_prestamo_fkey
  FOREIGN KEY (empresa_id, prestamo_id) REFERENCES prestamos(empresa_id, id);
ALTER TABLE public.contratos_ccp ADD CONSTRAINT contratos_ccp_participe_fkey
  FOREIGN KEY (empresa_id, participe_id) REFERENCES participes(empresa_id, id);

-- pagos_reales_participe → empresas + contratos_ccp
ALTER TABLE public.pagos_reales_participe ADD CONSTRAINT pagos_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);
ALTER TABLE public.pagos_reales_participe ADD CONSTRAINT pagos_contrato_ccp_fkey
  FOREIGN KEY (empresa_id, contrato_ccp_id) REFERENCES contratos_ccp(empresa_id, id);

-- config → empresas
ALTER TABLE public.config ADD CONSTRAINT config_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- BdE
ALTER TABLE public."BdE_Titulares" ADD CONSTRAINT titulares_tipo_id_fkey
  FOREIGN KEY (tipo_id) REFERENCES "BdE_Tipos_id"(id);
ALTER TABLE public."BdE_Titulares" ADD CONSTRAINT titulares_sector_institucional_fkey
  FOREIGN KEY (sector_institucional) REFERENCES "BdE_Sectores"(codigo);
ALTER TABLE public."BdE_Operaciones_Titulares" ADD CONSTRAINT "BdE_Operaciones_Titulares_operacion_id_fkey"
  FOREIGN KEY (operacion_id) REFERENCES "BdE_Operaciones"(id) ON DELETE CASCADE;
ALTER TABLE public."BdE_Operaciones_Titulares" ADD CONSTRAINT "BdE_Operaciones_Titulares_titular_id_fkey"
  FOREIGN KEY (titular_id) REFERENCES "BdE_Titulares"(id) ON DELETE CASCADE;


-- ── 5. FUNCIONES ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT empresa_id FROM perfiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_participe_ids()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(participe_ids, '{}') FROM perfiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ── 6. TRIGGER ────────────────────────────────────────────────────────────────

CREATE TRIGGER update_bde_titulares_updated_at
  BEFORE UPDATE ON public."BdE_Titulares"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── 7. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE public.empresas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intermediarios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobros                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titulares                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_ccp             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_reales_participe    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config                    ENABLE ROW LEVEL SECURITY;

-- empresas
CREATE POLICY empresas_select ON public.empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY empresas_insert ON public.empresas FOR INSERT TO authenticated WITH CHECK (get_my_rol() = 'admin');
CREATE POLICY empresas_update ON public.empresas FOR UPDATE TO authenticated USING (get_my_rol() = 'admin');
CREATE POLICY empresas_delete ON public.empresas FOR DELETE TO authenticated USING (get_my_rol() = 'admin');

-- perfiles
CREATE POLICY perfiles_own ON public.perfiles FOR ALL TO authenticated
  USING (true) WITH CHECK (auth.uid() = id);

-- clientes
CREATE POLICY clientes_empresa ON public.clientes FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- intermediarios
CREATE POLICY intermediarios_empresa ON public.intermediarios FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- participes
CREATE POLICY participes_empresa ON public.participes FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id() AND (get_my_rol() = ANY (ARRAY['admin','interno']) OR id = ANY (get_my_participe_ids())))
  WITH CHECK (empresa_id = get_my_empresa_id());

-- prestamos
CREATE POLICY prestamos_empresa ON public.prestamos FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- cobros
CREATE POLICY cobros_empresa ON public.cobros FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- titulares
CREATE POLICY titulares_empresa ON public.titulares FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- contratos_ccp
CREATE POLICY contratos_ccp_empresa ON public.contratos_ccp FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id() AND (get_my_rol() = ANY (ARRAY['admin','interno']) OR participe_id = ANY (get_my_participe_ids())))
  WITH CHECK (empresa_id = get_my_empresa_id());

-- pagos_reales_participe
CREATE POLICY pagos_participe_empresa ON public.pagos_reales_participe FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id() AND (get_my_rol() = ANY (ARRAY['admin','interno']) OR contrato_ccp_id IN (SELECT id FROM contratos_ccp WHERE participe_id = ANY (get_my_participe_ids()))))
  WITH CHECK (empresa_id = get_my_empresa_id());

-- config
CREATE POLICY config_empresa ON public.config FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());
