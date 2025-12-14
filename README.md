# EduTask

Next.js 15 (App Router) app that conecta estudiantes y docentes para tareas y cursos, con pagos por hitos, chat en tiempo real y almacenamiento privado en MinIO.

## Stack
- Next.js 15.5.2 (App Router, React 19)
- TypeScript 5, strict mode
- Tailwind CSS 4 + Radix UI/shadcn patterns
- Supabase: auth y base de datos
- MinIO: archivos privados (perfil, tareas, entregas, comprobantes)

## Estructura clave
- `src/app/(auth)/*`: login/registro/cuenta
- `src/app/(main)/workspace`: vistas autenticadas (estudiante/teacher) y chat
- `src/app/dashboard`: dashboard general
- `src/application`: casos de uso
- `src/domain`: contratos de dominio
- `src/infrastructure/supabase`: repositorios Supabase
- `src/infrastructure/minio`: helpers de storage
- `src/lib/data`: server actions (adaptadores a casos de uso)
- `src/modules/chat`: UI y lógica de chat

## Comandos
```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Build producción
npm start        # Servir build
npm run lint     # ESLint
```

## Variables de entorno requeridas
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- MinIO: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
- Buckets MinIO (privados, crear previamente o se crean en uso):  
  `MINIO_PROFILE_BUCKET` (default `profile-pictures`),  
  `MINIO_TASK_ATTACHMENTS_BUCKET` (default `task-attachments`),  
  `MINIO_SUBMISSION_BUCKET` (default `task-progress`),  
  `MINIO_PAYMENT_PROOF_BUCKET` (default `comprobantes`).

## Notas de funcionalidad
- Chat carga 10 mensajes a la vez y permite “ver más” al hacer scroll.
- Botón “Finalizar Tarea” solo aparece cuando la tarea está en `submitted`.
- Almacenamiento migrado a MinIO (referencias, entregas, comprobantes, perfiles); URLs se sirven con firmas temporales.

## Desarrollo rápido
1) Copia `.env.local` con las variables anteriores.  
2) `npm install`  
3) `npm run dev` y abre `http://localhost:3000`.
