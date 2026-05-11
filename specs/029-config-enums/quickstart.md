# Quickstart: Configuración de Enumeraciones

**Branch**: `029-config-enums` | **Date**: 2026-05-11

Escenarios de integración para validar el flujo completo end-to-end.

---

## Pre-requisitos

- App corriendo en localhost
- Usuario con rol `Escolastico` autenticado
- DB migrada y seed aplicado (categorías y valores iniciales presentes)

---

## Escenario 1: Agregar un nuevo valor y verlo en un selector (US1 - golden path)

1. Ir a `/admin/configuracion/enums`
2. Verificar que se muestran 4 categorías configurables: Estado de Nota, Tipo de Nota Final, Tipo de Sesión, Motivo de Baja
3. Seleccionar **Tipo de Sesión**
4. Verificar que se muestran 4 valores activos: Clase, Examen, Práctica, Repaso
5. Hacer clic en **Agregar valor**
6. Ingresar código: `Taller`, etiqueta: `Taller`
7. Confirmar — verificar que aparece en la lista con estado `Activo`
8. Ir a `/admin/clases/:id` con una clase activa
9. Hacer clic en **Registrar sesión**
10. Verificar que el selector de Tipo de Sesión incluye **Taller** como opción
11. **Resultado esperado**: "Taller" disponible en el selector sin haber recargado la app

---

## Escenario 2: Desactivar un valor y verificar que no aparece en formularios nuevos

1. En la pantalla de configuración → Tipo de Sesión
2. Hacer clic en **Desactivar** sobre el valor "Repaso"
3. Confirmar la desactivación
4. Verificar que "Repaso" aparece en la lista con estado `Inactivo`
5. Ir a `/admin/clases/:id` → Registrar sesión
6. Verificar que "Repaso" ya NO aparece en el selector
7. Ir a una sesión existente registrada con tipo "Repaso" — verificar que sigue mostrando "Repaso" en el historial de sesiones
8. **Resultado esperado**: valor desactivado invisible en formularios nuevos, datos históricos intactos

---

## Escenario 3: Renombrar la etiqueta de un valor

1. En configuración → Estado de Nota
2. Hacer clic en **Editar** sobre "Sólido"
3. Cambiar etiqueta a "Bueno"
4. Guardar
5. Abrir la ficha de una inscripción que tenga nota "Solido" registrada
6. Verificar que ahora muestra la etiqueta "Bueno" (el código sigue siendo `Solido`)
7. **Resultado esperado**: renombre de etiqueta se refleja en toda la aplicación

---

## Escenario 4: Reactivar un valor desactivado

1. En configuración → Tipo de Sesión, "Repaso" está inactivo (del escenario 2)
2. Hacer clic en **Reactivar** sobre "Repaso"
3. Ir a Registrar sesión → verificar que "Repaso" vuelve a aparecer en el selector
4. **Resultado esperado**: reactivación inmediata, sin deploy

---

## Escenario 5: Validación de duplicados

1. En configuración → Motivo de Baja
2. Intentar agregar valor con código `Ausencia` (ya existe)
3. Verificar que se muestra error "El código ya existe en esta categoría"
4. Intentar agregar valor con etiqueta `Ausencia` y código distinto `AusenciaV2`
5. Verificar que se muestra error "La etiqueta ya existe en esta categoría"
6. **Resultado esperado**: formulario no se guarda, error claro al usuario

---

## Escenario 6: Visualizar enumeraciones no configurables (US2)

1. En `/admin/configuracion/enums` hacer scroll a la sección "Enumeraciones del sistema"
2. Verificar que aparecen las 5 categorías: Rol, Estado General, Estado de Clase, Estado de Inscripción, Estado de Asistencia
3. Verificar que cada una muestra sus valores con ícono de candado y etiqueta "Solo lectura"
4. Verificar que no hay botones de editar, agregar ni desactivar para estas categorías
5. **Resultado esperado**: visibilidad completa sin posibilidad de edición

---

## Escenario 7: Auditoría

1. Después de ejecutar escenarios 1–3, ir a `/admin/auditoria` (o consultar `logs_auditoria`)
2. Verificar que existen entradas para:
   - `CREATE` en `enum_valores` con `valor_nuevo: { categoria: "TipoSesion", codigo: "Taller" }`
   - `UPDATE` en `enum_valores` con `valor_anterior: { activo: true }`, `valor_nuevo: { activo: false }` para "Repaso"
   - `UPDATE` en `enum_valores` con `valor_anterior: { etiqueta: "Sólido" }`, `valor_nuevo: { etiqueta: "Bueno" }`
3. **Resultado esperado**: 100% de operaciones de escritura auditadas con actor correcto
