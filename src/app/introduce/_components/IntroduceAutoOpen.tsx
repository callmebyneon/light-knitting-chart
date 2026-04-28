'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { markIntroduceSeen, shouldAutoOpenIntroduce } from './Introducing';

export default function IntroduceAutoOpen() {
  const router = useRouter();

  useEffect(() => {
    if (!shouldAutoOpenIntroduce()) {
      return;
    }

    markIntroduceSeen();
    router.push('/introduce', { scroll: false });
  }, [router]);

  return null;
}
