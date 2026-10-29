'use client';

import ClasesVigentesList from '@/components/clases/ClasesVigentesList';

export default function ListasPage() {
  return <ClasesVigentesList title="Listas" hrefFor={(c) => `/admin/asistencia/${c.id}`} />;
}
