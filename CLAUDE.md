# PROMOCIMA — Contexto para Claude Code

Aplicación de gestión de préstamos privados con participaciones de inversores.
Stack: **Vue 3 + Vite + Supabase** · Deploy: **Vercel** (`https://promocima-prestamos.vercel.app`)
Supabase project ID: `lsdmmnxkrrliutleyehp`

---

## Estructura del proyecto

```
src/
  App.vue                  # Punto de entrada, routing manual, layout por rol
  main.js                  # Monta app, llama initAuth()
  supabase.js              # Cliente Supabase con custom fetch (retry + x-empresa-id header)
  styles.css               # Estilos globales (~44KB), variables CSS, componentes
  utils.js                 # Utilidades: fmtN, fmtDate, calcSituacion, etc.
  helpTexts.js             # Textos de ayuda contextuales
  composables/
    useAuth.js             # Singleton auth: sesión, perfil, rol, multi-empresa
    useDevengados.js       # Cálculo de intereses devengados
    useCrud.js             # Operaciones CRUD genéricas
    useMantenimiento.js    # Flag de mantenimiento
    usePersistedRef.js     # ref que persiste en localStorage
    useRouter.js           # Router manual (sin vue-router)
    useSort.js             # Ordenación reactiva de tablas
  utils/
    validar.js             # Validaciones de formularios
  components/              # ~28 componentes (ver lista abajo)

api/                       # Serverless functions de Vercel
  invitar.js               # Envío de invitaciones (crea user en Supabase + email)
  borrar-reset-password.js # Reset de contraseña
  usuarios/[id].js         # CRUD de usuarios vía API admin
  _supabase.js             # Cliente Supabase con service_role (solo backend)
  config.js                # Config compartida de API

public/                    # Páginas HTML standalone (no Vue)
  login.html               # Login estático
  activar-cuenta.html      # Activación de cuenta en primer login
  forgot-password.html     # Solicitud de reset de contraseña
  reset-password.html      # Establecer nueva contraseña

sql changes/
  histórico/               # Migraciones ya aplicadas (V1.0000 – V1.0006)
  pendientes/              # Migraciones pendientes de aplicar (V1.0007 – V1.0011)

Templates/                 # Plantillas HTML de emails (referencia, no se usan en el flujo actual)
```

---

## Componentes principales

| Componente | Descripción |
|---|---|
| `Dashboard.vue` | 3 KPIs consolidados: Capital Desplegado, Ingresos Mensuales, Incidencias |
| `Prestamos.vue` | Lista de préstamos con filtros, estado y paginación |
| `PrestamoDetalle.vue` | Detalle completo de un préstamo con tabs |
| `Cobros.vue` | Gestión de cobros programados y reales |
| `ContratosCCP.vue` | Lista de contratos de participación |
| `ContratoCCPDetalle.vue` | Detalle de contrato con cálculos de rentabilidad |
| `Participes.vue` | Gestión de partícipes inversores |
| `PagosParticipes.vue` | Pagos a partícipes |
| `GestionUsuarios.vue` | Administración de usuarios del sistema |
| `GestionEmpresas.vue` | Gestión multi-empresa |
| `ParticiPePortal.vue` | Vista reducida para usuarios con rol `participe` |
| `Administracion.vue` | Panel de administración (mantenimiento, backup) |
| `LoginView.vue` | Login en desarrollo local (en prod usa `login.html`) |

---

## Autenticación y roles

El sistema tiene tres roles: `admin`, `interno`, `participe`.

- El auth es un **singleton** en `useAuth.js` — un único estado compartido por toda la app.
- El routing es **manual** en `App.vue` usando `v-if/v-else-if` por rol y vista activa.
- **No se usa vue-router.**

### Flujo de invitación de usuarios
1. Admin rellena formulario en `GestionUsuarios.vue` (email, nombre, rol, accesos por empresa)
2. El frontend llama directamente a `POST /api/invitar` con el JWT del admin en el header
3. El serverless verifica que el usuario es admin (`verificarAdmin`) y llama a `supabase.auth.admin.inviteUserByEmail()`, que envía el email de invitación de Supabase al nuevo usuario
4. El serverless crea el perfil en `perfiles` (`activo: false`) y los accesos en `perfiles_empresas`
5. El usuario hace clic en el link del email y activa su cuenta en `public/activar-cuenta.html`

Si el usuario ya existe pero está inactivo, el serverless lo borra y reinvita (flujo de reinvitación).
**No se usa Google Apps Script ni tabla `emails_pendientes`.**

---

## Multi-empresa

La arquitectura multi-empresa usa la tabla `perfiles_empresas`:

```sql
perfiles_empresas (
  perfil_id     uuid  → perfiles.id
  empresa_id    text  → empresas.id
  participe_ids text[] -- IDs de partícipes de esta empresa para este usuario
  orden         int    -- 0 = empresa principal
)
```

- La empresa activa se transmite a Supabase via header HTTP `x-empresa-id`
- El cliente Supabase en `supabase.js` inyecta este header en cada request
- Las RLS functions `get_my_empresa_id()` y `get_my_participe_ids()` leen el header

---

## Base de datos (Supabase / Postgres)

### Tablas principales
- `empresas` — empresas gestoras
- `prestamos` — préstamos activos e históricos
- `participes` — inversores/partícipes
- `contratos_ccp` — contratos de participación en préstamos
- `cobros` — cobros programados
- `cobros_reales` — cobros efectivamente realizados
- `pagos_reales_participe` — pagos a partícipes
- `perfiles` — usuarios del sistema
- `perfiles_empresas` — accesos multi-empresa por usuario
- `garantias`, `intermediarios`, `clientes` — entidades auxiliares

### Funciones SQL críticas
- `get_my_empresa_id()` — empresa activa del usuario (lee header HTTP)
- `get_my_participe_ids()` — array de IDs de partícipes del usuario
- `get_my_rol()` — rol del usuario autenticado
- `get_all_participes()` — todos los partícipes (solo admin)

### Patrón RLS para partícipes
Las políticas usan `participe_ids` (array), NO `participe_id` (singular):
```sql
-- CORRECTO
USING (participe_id = ANY(SELECT unnest(get_my_participe_ids())))
-- INCORRECTO (legacy, no usar)
USING (participe_id = get_my_participe_id())
```

---

## Patrones de código importantes

### Fetching paginado (límite 1000 filas de Supabase)
Todos los componentes que cargan colecciones grandes deben usar fetch paginado:
```js
async function fetchAll(query) {
  const PAGE = 1000
  let from = 0, all = []
  while (true) {
    const { data, error } = await query.range(from, from + PAGE - 1)
    if (error) throw error
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}
```
Componentes que ya lo implementan: `Prestamos.vue`, `Dashboard.vue`, `Cobros.vue`.

### Estado de préstamos (`calcSituacion`)
La función `calcSituacion` en `utils.js` calcula el estado de un préstamo.
**Debe llamarse al final de `cargarTodo()`**, después de que todos los datos estén cargados, para evitar race conditions.

### Formateo de números
Usar `fmtN(n)` de `utils.js` para números sin símbolo de moneda.
Para moneda, usar `fmtN(n) + ' €'` o el formato específico del componente.

### Inputs deshabilitados
Para evitar el bug de `-webkit-text-fill-color` en inputs disabled en Safari/Mac:
```css
/* Ya está en styles.css — no añadir estilos inline */
input:disabled, select:disabled { -webkit-text-fill-color: var(--text3); }
```

### Badges de estado
```html
<span class="badge" :class="badgeClass(estado)">{{ estado }}</span>
```
Clases: `badge-green` (al día), `badge-orange` (retraso), `badge-red` (judicial), `badge-gray` (cancelado/completado).

### Clases responsive de tablas
- `col-hide-mobile` — oculta columna en móvil
- `td-count` — celda de contador/número
- `progress-bar-hide-mobile` — oculta barra de progreso en móvil

---

## Variables de entorno

### Frontend (Vite — requieren prefijo VITE_)
```
VITE_SUPABASE_URL=https://lsdmmnxkrrliutleyehp.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

### Backend (Vercel serverless — sin prefijo)
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...  # Solo en funciones de api/
```

En desarrollo local crear `.env.local` con las variables VITE_.

---

## Migraciones SQL pendientes

Estas migraciones están en `sql changes/pendientes/` y AÚN NO se han aplicado en producción:

| Versión | Descripción |
|---|---|
| V1.0007 | Soporte multi-empresa en perfiles (columna `empresa_ids[]`) |
| V1.0008 | Header de empresa en RLS |
| V1.0009 | Drop de `empresa_id` legacy en perfiles |
| V1.0010 | Nueva tabla `perfiles_empresas` (rediseño multi-empresa) |
| V1.0011 | Función `get_all_participes()` para admins |

**Aplicar siempre en orden y en entorno de pruebas primero.**

---

## Comandos útiles

```bash
npm run dev      # Desarrollo local (puerto 5173)
npm run build    # Build de producción
npm run test     # Tests con Vitest
vercel --prod    # Deploy manual a producción
```

---

## Convenciones

- **Sin vue-router** — routing manual en App.vue con refs reactivos
- **Sin Pinia** — estado global via composables singleton
- **Sin TypeScript** — JavaScript puro (excepto `index.ts` que es externo)
- Los composables usan el patrón de estado singleton fuera del `export function`
- Los componentes hacen sus propias queries a Supabase (no hay store centralizado de datos)
- Los modales se implementan como componentes con `v-if` y `emits`
