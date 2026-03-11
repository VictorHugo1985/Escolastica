<!--
Sync Impact Report:
- Version change: 1.1.0 → 1.1.1
- List of modified principles: None (minor text cleanup)
- Added sections: Sync Impact Report
- Removed sections: None
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md (Injected concrete constitution gates)
  - ✅ updated: .specify/templates/tasks-template.md (Added Clean Code & Modularity checkpoints)
- Follow-up TODOs: None
-->

# Escolastica Constitution

Este proyecto tiene como propósito desarrollar una herramienta digital para Escuela NA, institución dedicada a la formación en filosofía, cultura y voluntariado, cuya Secretaría de Escolástica es responsable del registro y seguimiento académico de materias, instructores y miembros. La solución deberá resolver la problemática actual relacionada con el control de asistencia a clases, registro de notas de exámenes y gestión de altas y bajas de alumnos por materia.
La aplicación será una web responsive con enfoque mobile-first para el registro de asistencia principalmente, permitiendo a los instructores registrar asistencia de forma ágil desde dispositivos móviles. No obstante, el sistema deberá también permitir que el instructor gestione sus clases desde la web en entorno de escritorio, disponiendo de una vista que liste sus materias asignadas y le permita administrar asistencias y notas desde ese entorno si ese fuera su dispositivo habitual. Las funcionalidades administrativas, de configuración y análisis estarán optimizadas para entorno web de escritorio, facilitando el trabajo de la Secretaría de Escolástica.
El diseño de la base de datos relacional constituirá el contrato estructural del sistema y actuará como delimitante del desarrollo posterior de backend y frontend. El modelo de datos será la fuente única de verdad y deberá definirse antes de cualquier implementación funcional, incluyendo un diccionario de datos que detalle restricciones y tipos. Una vez aprobado el esquema base, este no debería modificarse para incorporar nuevas funcionalidades; el crecimiento del sistema deberá realizarse principalmente mediante extensiones modulares que no alteren la estructura existente ni el código ya implementado.
Todo el desarrollo deberá cumplir estrictamente los principios de Clean Code, promoviendo claridad, responsabilidad única, bajo acoplamiento y alta cohesión. La arquitectura deberá permitir escalabilidad progresiva sin reescrituras ni refactorizaciones disruptivas.

## Principios Fundamentales

### Arquitectura basada en datos — NO NEGOCIABLE
El diseño de la base de datos relacional constituye el contrato estructural del sistema y la fuente única de verdad. Ningún desarrollo de backend o frontend podrá iniciarse sin que el modelo de datos esté definido y aprobado. El esquema base delimita el alcance funcional del sistema y previene el desbordamiento del proyecto. Una vez ratificado el esquema inicial del MVP, no podrá modificarse para incorporar nuevas funcionalidades; la evolución principalmente deberá realizarse mediante extensiones compatibles que no alteren la estructura existente, no obstante tambien si fuera necesario de acuerdo a las especificaciones permitir cambiar en lo menor posible y bajo ratificacion el modelo de datos ya existente.

### Mobile-First — Diseño operacional
El sistema será desarrollado bajo un enfoque mobile-first para el registro de asistencias, priorizando rapidez, claridad y mínima fricción para instructores desde dispositivos móviles. No obstante, todas las funcionalidades críticas deberán ser accesibles también desde entorno web de escritorio. Los instructores dispondrán de una vista que liste sus materias asignadas y permita gestionar asistencias y notas tanto desde móvil como desde web.

### Código limpio & crecimiento modular
Todo el código deberá cumplir estrictamente principios de Clean Code: nombres descriptivos, funciones de responsabilidad única, bajo acoplamiento y alta cohesión. La arquitectura deberá permitir crecimiento progresivo sin modificar código existente, aplicando el principio abierto a extensión y cerrado a modificación. No se permitirá lógica duplicada ni soluciones temporales que comprometan mantenibilidad futura.

### Alcance controlado para el MVP
El alcance del MVP queda estrictamente delimitado a:
Gestión de usuarios con roles jerárquicos (administrador, instructor y miembro; bajo la premisa de que todo administrador e instructor posee inherentemente el perfil de miembro).
Autenticación mediante correo electrónico.
Registro de materias con instructor, horario y miembros asignados.
Registro y consulta de asistencias.
Registro de notas de exámenes.
Gestión de altas y bajas de miembros por materia, con historico de por alumno y materia especialmente de las bajas.
Vista del Kardex por alumno vigentes e historicas.
Vista para instructores con listado, calendarios y gestión de sus materias.
Cualquier funcionalidad fuera de este alcance requerirá evaluación formal y justificación basada en impacto organizacional real.

### Lineamientos organizacionales
El sistema existe para servir a la Secretaría de Escolástica de Escuela NA, facilitando el control, visualización y análisis de materias, asistencias, kardex, calendarios de instructores, notas y movimientos de alumnos. Toda decisión técnica deberá alinearse con la mejora operativa de esta área y no responder a complejidades innecesarias.

## Restricciones arquitectónicas
Base de datos relacional obligatoria.
Arquitectura por capas.
Backend desacoplado del frontend.
Validaciones obligatorias en backend.
Diseño responsive obligatorio.
Seguridad: Implementación de sesiones seguras, expiración por inactividad y protección contra fuerza bruta.
El modelo de datos define las relaciones estructurales (ej.: todo instructor es miembro).

## Flujo de desarrollo
El modelo entidad-relación del MVP debe aprobarse antes del desarrollo.
Ninguna historia de usuario se implementa sin criterios de aceptación claros.
Toda nueva funcionalidad debe demostrar compatibilidad con el esquema de datos existente.
Refactorizaciones mayores requieren justificación técnica documentada.
La simplicidad prevalece sobre la sofisticación técnica.

## Gobernanza

Esta Constitución prevalece sobre cualquier práctica técnica no documentada.
Toda propuesta que implique modificar el modelo de datos base o ampliar el alcance del MVP requerirá:
Justificación funcional formal (basada en las especificaciones de la carpeta `specs/`).
Evaluación de impacto estructural.
Plan de migración si aplica.
Aprobación explícita.
La complejidad debe justificarse; la simplicidad es el estándar por defecto.

Version: 1.1.1 | Ratified: 2026-03-03 | Last Amended: 2026-03-06
