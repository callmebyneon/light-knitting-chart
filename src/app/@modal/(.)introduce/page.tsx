'use client';

import { useRouter } from 'next/navigation';
import Introducing from '@/app/introduce/_components/Introducing';
import Modal from '@/components/ui/widgets/Modal';

export default function IntroduceModalPage() {
  const router = useRouter();

  return (
    <Modal isOpen={true} title="Light Knitting Chart 소개" onClose={() => router.back()}>
      <Introducing mode="modal" />
    </Modal>
  );
}
