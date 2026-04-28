'use client';

import Link from 'next/link';
import { FilePen, Info } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { inputClassBarebone } from '@/components/ui/sharedStyles';
import { useCanvasStore } from '@/stores/useCanvasStore';

export default function TitleAreaClient() {
  const { title, setTitle } = useCanvasStore();
  const [lastTitle, setLastTitle] = useState(title);

  return (
    <>
      <label className="relative mx-auto flex items-center gap-2">
        <input
          type="text"
          value={title}
          maxLength={48}
          placeholder="파일 이름으로 현재 차트 제목을 사용합니다"
          onInput={(event) => setTitle(event.currentTarget.value)}
          onBlur={() => {
            if (title.trim() === '') {
              setTitle(lastTitle);
              return;
            }

            setLastTitle(title);
          }}
          className={cn(inputClassBarebone, 'min-w-80 max-w-200 w-fit pr-7.5 transition lg:min-w-0')}
        />
        <FilePen size={16} color="#62748e" className="absolute top-2.5 right-2" />
      </label>

      <p className="hidden text-xs text-slate-500 lg:block">파일 이름으로 현재 차트 제목을 사용합니다</p>

      <Link
        href="/introduce"
        aria-label="앱 소개 보기"
        className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-sky-50 hover:text-sky-700"
      >
        <Info size={16} />
      </Link>
    </>
  );
}
