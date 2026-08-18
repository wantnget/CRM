-- CHECK constraints de `usuario` definidos en estructura_bd_crm.json
-- (entidades[].restricciones). Prisma no los expresa en el schema, así que se
-- declaran aquí; `prisma migrate diff` los ignora y no genera drift por ellos.

-- ADMIN_GENERAL opera fuera del alcance de una compañía; todo otro rol exige
-- compañía. Ver usuario.compania_id y la matriz de visibilidad del spec.
ALTER TABLE "usuario"
  ADD CONSTRAINT "ck_usuario_admin_general_sin_compania"
  CHECK (
    (rol_codigo = 'ADMIN_GENERAL' AND compania_id IS NULL)
    OR (rol_codigo <> 'ADMIN_GENERAL' AND compania_id IS NOT NULL)
  );

-- El rol GESTOR siempre tiene oficina ("Obligatorio para GESTOR" en el spec).
-- Para DIRECTOR, ADMIN_COMPANIA y ADMIN_GENERAL el campo es "No aplica".
ALTER TABLE "usuario"
  ADD CONSTRAINT "ck_usuario_gestor_con_oficina"
  CHECK (rol_codigo <> 'GESTOR' OR oficina_id IS NOT NULL);
