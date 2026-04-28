'use client';

import Link from 'next/link';
import { FilePen, Info } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { inputClassBarebone } from '@/components/ui/sharedStyles';
import { useCanvasStore } from '@/stores/useCanvasStore';

const MIN_TITLE_INPUT_CH = 12;
const TITLE_INPUT_PADDING_CH = 4;

export default function TitleAreaClient() {
  const { title, setTitle } = useCanvasStore();
  const [lastTitle, setLastTitle] = useState(title);

  const titleInputWidth = `${Math.max(title.length + TITLE_INPUT_PADDING_CH, MIN_TITLE_INPUT_CH)}ch`;

  return (
    <>
      <label className="mx-auto flex items-center gap-2">
        <FilePen size={16} color="#62748e" />
        <input
          id="chart-name"
          type="text"
          value={title}
          maxLength={48}
          placeholder={"제목"}
          onInput={(event) => setTitle(event.currentTarget.value)}
          onBlur={() => {
            if (title.trim() === '') {
              setTitle(lastTitle);
              return;
            }

            setLastTitle(title);
          }}
          style={{ width: titleInputWidth }}
          className={cn(inputClassBarebone, 'max-w-200 transition')}
        />
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
