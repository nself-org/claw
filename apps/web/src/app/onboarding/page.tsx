'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function OnboardingPage(): React.ReactElement | null {
  const router = useRouter();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (onboardingComplete) {
      router.replace('/');
    }
  }, [onboardingComplete, router]);

  if (onboardingComplete) {
    return null;
  }

  return <OnboardingWizard />;
}
