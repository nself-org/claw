'use client';

import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

export function MemoryEmptyState(): React.ReactElement {
  return (
    <EmptyState
      variant="noResults"
      heading="No memories yet"
      description="Memories are extracted automatically as you chat."
    />
  );
}

export default MemoryEmptyState;
