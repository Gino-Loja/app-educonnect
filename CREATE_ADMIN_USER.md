# Crear Usuario Administrador

## Opción 1: Desde SQL Editor de Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **SQL Editor**
3. Ejecuta esta query (reemplaza con tu email):

```sql
-- Actualizar un usuario existente a admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'tu_email@example.com';
```

## Opción 2: Crear un nuevo usuario admin desde cero

```sql
-- 1. Primero registra el usuario en Supabase Auth (usa la UI de signup normal)
-- 2. Luego actualiza su rol a admin:

UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@edutask.com';
```

## Verificar que el usuario es admin:

```sql
SELECT id, email, role
FROM profiles
WHERE role = 'admin';
```

## Flujo de Acceso:

1. **Registrarse/Login**: Ve a `http://localhost:3000/login` o `/signup`
2. **Iniciar sesión** con el usuario que actualizaste a admin
3. **Acceder al panel**: Una vez autenticado, ve a `http://localhost:3000/admin`
4. ¡Listo! Deberías ver el Dashboard de administrador

## Importante:

- El middleware `requireAdmin()` en el layout de `/admin` verifica que el usuario sea admin
- Si no eres admin, te redirigirá a `/workspace`
- Si no estás autenticado, te redirigirá a `/login`
