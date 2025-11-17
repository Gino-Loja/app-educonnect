# Database Migrations

Este directorio contiene las migraciones SQL para el sistema de tareas de EduTask.

## Migraciones Disponibles

### `20251022135512_create_tasks_system.sql`

Crea el sistema completo de tareas que incluye:

#### Tablas Creadas:
1. **`tasks`** - Tareas creadas por estudiantes
2. **`proposals`** - Propuestas de profesores para tareas
3. **`task_submissions`** - Entregas de trabajo por parte de profesores
4. **`reviews`** - Sistema de reseñas bidireccional (estudiante ↔ profesor)

#### Enums Creados:
- `task_status`: Estados de las tareas (open, in_progress, submitted, completed, cancelled, disputed)
- `task_priority`: Prioridad de las tareas (low, normal, high, urgent)
- `payment_type`: Tipo de pago (per_hour, fixed, negotiable)
- `proposal_status`: Estados de las propuestas (pending, accepted, rejected, withdrawn)

#### Características:
- Row Level Security (RLS) configurado para todas las tablas
- Índices optimizados para consultas frecuentes
- Triggers automáticos para:
  - Actualizar timestamps (`updated_at`)
  - Contar propuestas automáticamente
  - Gestionar aceptación de propuestas
- Validaciones a nivel de base de datos (constraints)
- Relaciones entre tablas configuradas

## Cómo Aplicar las Migraciones

### Opción 1: Aplicar a Supabase Local (Desarrollo)

```bash
# Iniciar Supabase localmente
npx supabase start

# Aplicar migraciones
npx supabase db push

# Ver status
npx supabase status
```

### Opción 2: Aplicar a Supabase Cloud (Producción)

#### A. Usando Supabase CLI:

```bash
# Login a Supabase
npx supabase login

# Vincular proyecto
npx supabase link --project-ref <your-project-ref>

# Aplicar migraciones
npx supabase db push
```

#### B. Usando el Dashboard de Supabase:

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `20251022135512_create_tasks_system.sql`
4. Ejecuta el SQL

### Opción 3: Crear y Aplicar Nueva Migración

```bash
# Crear nueva migración
npx supabase migration new <nombre_descriptivo>

# Editar el archivo generado en supabase/migrations/

# Aplicar
npx supabase db push
```

## Verificar la Instalación

Después de aplicar las migraciones, verifica que todo esté correcto:

```sql
-- Verificar que las tablas existan
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('tasks', 'proposals', 'task_submissions', 'reviews');

-- Verificar enums
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'task_status';

-- Verificar políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('tasks', 'proposals', 'task_submissions', 'reviews');
```

## Actualizar TypeScript Types

Después de aplicar las migraciones, actualiza tus tipos TypeScript:

```bash
# Generar tipos desde Supabase
npx supabase gen types typescript --local > src/model/schema.ts

# O si está en producción
npx supabase gen types typescript --project-id <your-project-id> > src/model/schema.ts
```

**Nota**: Los tipos ya están actualizados en `src/model/schema.ts` para estas migraciones.

## Rollback (Revertir Migraciones)

Si necesitas revertir una migración:

```bash
# Ver historial
npx supabase migration list

# Revertir última migración
npx supabase db reset

# O manualmente ejecuta DROP statements en SQL Editor
```

## Estructura de Datos

### Flujo de Trabajo de una Tarea:

1. **Estudiante** crea una `task` (status: 'open')
2. **Profesores** crean `proposals` para la tarea
3. **Estudiante** acepta una propuesta → task pasa a 'in_progress'
4. **Profesor** envía `task_submission` → task pasa a 'submitted'
5. **Estudiante** revisa y aprueba → task pasa a 'completed'
6. **Ambos** pueden crear `reviews` mutuamente

### Ejemplo de Uso:

```typescript
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/model/schema'

const supabase = createClient()

// Crear una tarea
const { data: task, error } = await supabase
  .from('tasks')
  .insert({
    student_id: userId,
    title: 'Ayuda con Cálculo Diferencial',
    description: 'Necesito ayuda con derivadas parciales...',
    subject: 'Mathematics',
    academic_level: 'University',
    budget_min: 20,
    budget_max: 50,
    payment_type: 'per_hour',
    due_date: '2025-11-01T23:59:59Z'
  })
  .select()
  .single()

// Ver propuestas para una tarea
const { data: proposals } = await supabase
  .from('proposals')
  .select(`
    *,
    teacher:profiles!proposals_teacher_id_fkey(name, profile_picture_url)
  `)
  .eq('task_id', taskId)
  .eq('status', 'pending')
```

## Soporte

Para problemas o preguntas:
- Revisa la documentación de Supabase: https://supabase.com/docs
- Documentación de migraciones: https://supabase.com/docs/guides/cli/local-development#database-migrations
