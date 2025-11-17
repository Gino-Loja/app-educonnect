# 💳 Sistema de Pagos por Cuotas - Guía de Implementación

## 📋 Resumen

Este sistema permite a los estudiantes dividir el pago de tareas en cuotas (2-5) cuando el presupuesto supera los $50. El pago se realiza por avances que el profesor va entregando.

---

## 🏗️ Arquitectura

### Base de Datos

#### 1. Tabla `tasks` - Columna nueva:
```sql
installments INTEGER DEFAULT 1 CHECK (installments >= 1 AND installments <= 5)
```

#### 2. Nueva tabla `payment_milestones`:
```sql
CREATE TABLE payment_milestones (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id),
    milestone_number INTEGER (1-5),
    title VARCHAR(255),
    description TEXT,
    amount NUMERIC(10, 2),
    due_date TIMESTAMP,
    status VARCHAR(50) -- 'pending', 'in_progress', 'submitted', 'approved', 'paid'
    submission_id UUID REFERENCES submissions(id),
    paid_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

---

## 🔄 Flujo Completo

### Paso 1: Estudiante Crea Tarea

**Ubicación:** `/workspace/mis-tareas/nueva`

**Componentes:**
- `InstallmentsSelector` - Selector de cuotas (solo si presupuesto > $50)

**Lógica:**
1. Estudiante ingresa presupuesto (min/max)
2. Si promedio > $50: muestra selector de cuotas (1-5)
3. Al crear tarea, se guarda `installments` en la tabla `tasks`

**Código de ejemplo:**
```tsx
import { InstallmentsSelector } from "@/components/forms/InstallmentsSelector"

// En el formulario:
const [installments, setInstallments] = useState(1)
const avgBudget = (budgetMin + budgetMax) / 2

<InstallmentsSelector
  budgetMin={budgetMin}
  budgetMax={budgetMax}
  value={installments}
  onChange={setInstallments}
/>
```

---

### Paso 2: Profesor Envía Propuesta

**Sin cambios** - El profesor propone un monto total como siempre.

---

### Paso 3: Estudiante Acepta Propuesta

**Ubicación:** `/workspace/propuestas`

**Componentes:**
- `AcceptProposalDialog` - Modal mejorado con plan de pagos

**Lógica:**
1. Muestra modal con resumen del acuerdo
2. Si installments > 1:
   - Muestra plan de cuotas
   - Calcula monto por avance
   - Explica proceso de pago por avances
3. Al confirmar:
   - Acepta propuesta (como siempre)
   - Crea milestones con `createMilestonesForTask()`

**Código de ejemplo:**
```tsx
import { AcceptProposalDialog } from "@/components/forms/AcceptProposalDialog"
import { createMilestonesForTask } from "@/lib/data/milestone-actions"

const handleAccept = async () => {
  // 1. Aceptar propuesta
  const result = await acceptProposal(proposalId)

  if (result.status === "success" && task.installments > 1) {
    // 2. Crear milestones
    await createMilestonesForTask(
      task.id,
      proposal.proposed_amount,
      task.installments
    )
  }
}

<AcceptProposalDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  onConfirm={handleAccept}
  proposal={proposalWithTask}
/>
```

---

### Paso 4: Sistema de Milestones/Avances

#### Estados de un Milestone:

1. **`pending`** - Esperando que el profesor trabaje
2. **`in_progress`** - Profesor trabajando en este avance
3. **`submitted`** - Profesor entregó el avance
4. **`approved`** - Estudiante aprobó el avance
5. **`paid`** - Pago realizado y confirmado

#### Flujo de Trabajo:

```
pending → in_progress → submitted → approved → paid
```

---

### Paso 5: Profesor Sube Avances

**Ubicación:** `/workspace/mis-trabajos/[taskId]`

**Lógica:**
1. Profesor ve los milestones de la tarea
2. Solo puede trabajar en el milestone actual (primer `pending` o `in_progress`)
3. Al subir avance:
   - Crea submission normal
   - Llama `submitMilestone(milestoneId, submissionId)`
   - Milestone pasa a `submitted`

**Código de ejemplo:**
```tsx
import { getMilestonesByTaskId, submitMilestone } from "@/lib/data/milestone-actions"

// Obtener milestones
const { milestones } = await getMilestonesByTaskId(taskId)

// Al subir avance
const handleSubmitWork = async (files, notes) => {
  // 1. Crear submission
  const submission = await createSubmission(taskId, files, notes)

  // 2. Marcar milestone como submitted
  if (currentMilestone) {
    await submitMilestone(currentMilestone.id, submission.id)
  }
}
```

---

### Paso 6: Estudiante Revisa y Aprueba

**Ubicación:** `/workspace/mis-tareas/[taskId]`

**Lógica:**
1. Estudiante ve avance entregado
2. Puede aprobar o pedir correcciones
3. Al aprobar:
   - Llama `approveMilestone(milestoneId)`
   - Milestone pasa a `approved`
   - Se habilita pago

**Código de ejemplo:**
```tsx
import { approveMilestone } from "@/lib/data/milestone-actions"

const handleApproveWork = async (milestoneId) => {
  await approveMilestone(milestoneId)
  // Redirigir a página de pago o mostrar instrucciones
}
```

---

### Paso 7: Pago

**Flujo:**
1. Estudiante realiza transferencia bancaria por monto del milestone
2. Sube comprobante
3. Admin/Sistema verifica
4. Llama `markMilestoneAsPaid(milestoneId)`
5. Milestone pasa a `paid`
6. Se habilita siguiente milestone

---

## 📦 Archivos Creados

### 1. Migración SQL
```
supabase/migrations/add_payment_milestones.sql
```

### 2. Componentes React
```
src/components/forms/InstallmentsSelector.tsx
src/components/forms/AcceptProposalDialog.tsx
src/components/ui/radio-group.tsx
```

### 3. Server Actions
```
src/lib/data/milestone-actions.ts
```

---

## 🔧 Próximos Pasos para Implementación Completa

### 1. **Actualizar Formulario de Nueva Tarea**
- Importar `InstallmentsSelector`
- Agregar campo `installments` al schema de validación
- Guardar en DB al crear tarea

### 2. **Actualizar Lista de Propuestas**
- Reemplazar AlertDialog actual con `AcceptProposalDialog`
- Agregar lógica para crear milestones al aceptar

### 3. **Crear Vista de Milestones para Profesor**
- Mostrar lista de milestones
- Indicar milestone actual
- Botón "Subir Avance" solo para milestone activo

### 4. **Crear Vista de Milestones para Estudiante**
- Mostrar progreso de pagos
- Botones para aprobar avances
- Link a pago cuando milestone está `approved`

### 5. **Sistema de Pagos**
- Página de pago por milestone
- Upload de comprobante
- Verificación admin
- Notificaciones

---

## 🎨 Componentes UI Adicionales Recomendados

### MilestonesProgress
```tsx
// Vista de progreso para estudiante
<MilestonesProgress milestones={milestones} />
```

### MilestoneCard
```tsx
// Card individual de milestone
<MilestoneCard
  milestone={milestone}
  onSubmit={handleSubmit}  // Para profesor
  onApprove={handleApprove} // Para estudiante
/>
```

---

## 🧪 Testing

### Casos de Prueba:

1. ✅ Tarea con presupuesto < $50 (no muestra cuotas)
2. ✅ Tarea con presupuesto > $50 (muestra selector)
3. ✅ Crear tarea con 3 cuotas
4. ✅ Aceptar propuesta muestra plan de pagos
5. ✅ Milestones se crean correctamente
6. ✅ Profesor solo puede subir avance actual
7. ✅ Flujo completo de milestone
8. ✅ Cálculos de montos correctos

---

## 📊 Queries Útiles

### Ver milestones de una tarea:
```sql
SELECT * FROM payment_milestones
WHERE task_id = 'task-uuid'
ORDER BY milestone_number;
```

### Ver progreso de pagos:
```sql
SELECT
  milestone_number,
  amount,
  status,
  paid_at
FROM payment_milestones
WHERE task_id = 'task-uuid'
ORDER BY milestone_number;
```

### Próximo milestone pendiente:
```sql
SELECT * FROM payment_milestones
WHERE task_id = 'task-uuid'
AND status = 'pending'
ORDER BY milestone_number
LIMIT 1;
```

---

## 🔐 Seguridad (RLS Policies)

Ya implementadas en la migración:
- ✅ Estudiantes ven milestones de sus tareas
- ✅ Profesores ven milestones de tareas asignadas
- ✅ Solo estudiantes pueden crear milestones
- ✅ Ambos pueden actualizar status según roles

---

## 💡 Tips de Implementación

1. **Validación:** Siempre validar que `installments <= 5` y `>= 1`
2. **Redondeo:** Usar `.toFixed(2)` para montos
3. **Estados:** Seguir el flujo estricto de estados
4. **Notificaciones:** Enviar notificación en cada cambio de estado
5. **UX:** Mostrar progreso visual claro para ambas partes

---

## 📝 Notas Importantes

- Solo tareas con presupuesto > $50 pueden tener cuotas
- Máximo 5 cuotas
- El pago es secuencial: no se puede pagar cuota 2 antes de cuota 1
- Cada milestone debe tener un submission asociado
- El estudiante debe aprobar antes de que se habilite el pago

---

¿Listo para implementar? 🚀
