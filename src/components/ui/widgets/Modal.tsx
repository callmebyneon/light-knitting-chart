'use client';

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModalProps = {
  isOpen: boolean;
  title: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ isOpen, title, wide = false, onClose, children }: ModalProps) {
  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="모달 닫기"
        className="absolute inset-0 bg-slate-900/24"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn("relative z-10 w-full max-h-full max-w-screen overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_64px_rgba(15,23,42,0.18)]", wide === false ? `lg:max-w-md` : `lg:max-w-3xl`)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id="modal-title" className="text-base font-semibold text-slate-800">
            {title}
          </h3>
          <button
            type="button"
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-sky-300 hover:text-sky-700"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 text-sm leading-6 text-slate-600">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
