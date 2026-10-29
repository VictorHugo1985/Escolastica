    # Modelo de Datos Maestro (Resumen Estructural)

Este documento resume las entidades clave definidas en el `schema.prisma` basado en el Diccionario de Datos (Spec 002).

## 1. Núcleo de Usuarios
- **`roles`**: Catálogo de niveles de acceso (Escolastico, Instructor, Miembro, Probacionista, Ex-miembro).
- **`usuarios`**: Perfil detallado de identidad (sincronizado con Supabase Auth).

## 2. Estructura Académica (Pensum)
- **`materias`**: Catálogo maestro de asignaturas con `nivel` académico.
- **`temas`**: Unidades de contenido vinculadas a materias, con orden secuencial.

## 3. Instancias de Enseñanza
- **`clases`**: Oferta académica específica (Materia + Instructor + Código + Fecha Inicio/Fin).
- **`aulas`**: Catálogo de espacios físicos.
- **`horarios`**: Definición temporal y espacial de las clases (Día, Hora, Aula).

## 4. Seguimiento y Evaluación (Sesiones)
- **`sesiones`**: Registro individual de cada encuentro (Clase, Examen, Practica, Repaso).
- **`inscripciones`**: Vínculo entre alumno y clase (gestiona altas, bajas y conclusión de temario).
- **`asistencias`**: Presencia del alumno (Presente, Ausente, Licencia) vinculada a una sesión específica.
- **`notas`**: Resultados de evaluaciones vinculados a la inscripción.

## 5. Auditoría Transversal
- **`logs_auditoria`**: Registro inmutable de cambios críticos (`Json` anterior/nuevo).

## 6. Material de Clase (spec 032)
- **`material_clase`**: Cabecera única de material por clase (`clase_id` único, `comentarios`, `creado_por`). Se crea con el primer pago.
- **`pagos_material`**: Cada pago de material de un alumno (`inscripcion_id`, `fecha`, `monto DECIMAL(8,1) >= 0`, `comentarios`, `registrado_por`). Un alumno puede tener varios pagos.
- **`pago_material_temas`**: Temas (material) a los que corresponde cada pago (N:M con `temas`).
- Extensión modular: no modifica tablas existentes. Detalle completo en `specs/032-pago-material/data-model.md`.

## Diagrama de Relaciones Críticas
- `usuarios` 1:N `inscripciones` N:1 `clases` 1:N `sesiones` 1:N `asistencias`
- `materias` 1:N `temas` 1:N `sesiones` (opcional)
- `clases` 1:N `horarios` N:1 `aulas`
- `clases` 1:0..1 `material_clase` 1:N `pagos_material` N:1 `inscripciones`; `pagos_material` N:M `temas` (vía `pago_material_temas`)
