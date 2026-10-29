'use client';

import ClasesVigentesList from '@/components/clases/ClasesVigentesList';

export default function MaterialesPage() {
  return <ClasesVigentesList title="Materiales" hrefFor={(c) => `/admin/materiales/${c.id}`} />;
}
