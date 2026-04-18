'use client';

import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

export function TopicsEmptyState(): React.ReactElement {
  return (
    <EmptyState
      variant="noResults"
      heading="No topics yet"
      description="Topics are auto-detected as conversations grow."
    />
  );
}

export default TopicsEmptyState;
