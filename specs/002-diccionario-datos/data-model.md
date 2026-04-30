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

## Diagrama de Relaciones Críticas
- `usuarios` 1:N `inscripciones` N:1 `clases` 1:N `sesiones` 1:N `asistencias`
- `materias` 1:N `temas` 1:N `sesiones` (opcional)
- `clases` 1:N `horarios` N:1 `aulas`
