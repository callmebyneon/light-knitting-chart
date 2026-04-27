'use client';

import { buttonClassName, inputClassBarebone } from '@/components/ui/sharedStyles';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useState } from 'react';
import Modal from '../ui/widgets/Modal';
import { Info } from 'lucide-react';

export default function TitleAreaClient() {
  const { title, setTitle } = useCanvasStore();
  const [ isInfoOpen, setInfoOpen ] = useState(false);

  return (
    <header className="fixed left-0 top-0 flex gap-3 h-12 w-full items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex min-w-0 items-center gap-3">
        <input
          type="text"
          defaultValue={title}
          placeholder="저장 파일명에 현재 제목이 함께 사용됩니다"
          onChange={(event) => setTitle(event.target.value)}
          className={`${inputClassBarebone} min-w-80 max-w-200 font-bold`}
        />
      </div>
      <p className="text-xs text-slate-500 ml-auto">저장 파일명에 현재 제목이 함께 사용됩니다.</p>
      <button
        type="button"
        aria-label="기본 기호 참고 정보 보기"
        className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-sky-50 hover:text-sky-700"
        onClick={() => setInfoOpen(true)}
      >
        <Info className="h-4 w-4" />
      </button>

      <Modal
        isOpen={isInfoOpen}
        title="기본 기호 참고 안내"
        onClose={() => setInfoOpen(false)}
      >
        <p>기본 SVG 기호 데이터는
          <a
            href="https://www.doanity.com/products/cm3kae5bq0007qdaaafj2r0ks"
            target="_blank"
            rel="noreferrer"
            className="inline-flex break-all text-sky-700 underline underline-offset-2"
          >
            대바늘 차트도안 만들기 EXCEL 파일 by moony_knit
          </a>
          에서 확인할 수 있는 기호 이미지의 일부를 참고해 구성했습니다.
        </p>
        <p className='break-keep mt-1'>이 앱은 간단하게 태블릿 환경에서 도안을 그리기 위해 만들어졌기 때문에, PC 환경에서 크고 자세한 대바늘 기호 도안은 위 엑셀 파일을 이용하여 만드는 것을 추천드립니다.</p>
        <p className='text-end text-slate-300'>v0.1.0</p>
      </Modal>
    </header>
  );
}
