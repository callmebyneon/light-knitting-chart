'use client';

import { Download, Info, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';

export const INTRODUCE_STORAGE_KEY = 'lkc:introduce-seen';

export type IntroduceDeviceType = 'desktop' | 'ios' | 'android' | 'other-mobile';

type IntroducingProps = {
  mode: 'page' | 'modal';
};

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getIntroduceDeviceType() {
  if (typeof window === 'undefined') {
    return 'desktop' satisfies IntroduceDeviceType;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const hasTouch = window.matchMedia('(pointer: coarse)').matches || window.navigator.maxTouchPoints > 0;
  const isAndroid = userAgent.includes('android');
  const isIPhone = userAgent.includes('iphone');
  const isIPad = userAgent.includes('ipad');
  const isMacTouch = userAgent.includes('macintosh') && window.navigator.maxTouchPoints > 1;

  if (isIPhone || isIPad || isMacTouch) {
    return 'ios' satisfies IntroduceDeviceType;
  }

  if (isAndroid) {
    return 'android' satisfies IntroduceDeviceType;
  }

  if (hasTouch && /mobile|tablet|silk|kindle|touch/.test(userAgent)) {
    return 'other-mobile' satisfies IntroduceDeviceType;
  }

  return 'desktop' satisfies IntroduceDeviceType;
}

export function shouldAutoOpenIntroduce() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (isStandaloneDisplayMode()) {
    return false;
  }

  return window.localStorage.getItem(INTRODUCE_STORAGE_KEY) !== 'seen';
}

export function markIntroduceSeen() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(INTRODUCE_STORAGE_KEY, 'seen');
}

export default function Introducing({ mode }: IntroducingProps) {
  const deviceType = useSyncExternalStore(
    () => () => {},
    getIntroduceDeviceType,
    () => 'desktop',
  );

  useEffect(() => {
    markIntroduceSeen();
  }, []);

  const showInstallGuide = deviceType !== 'desktop';

  return (
    <div className={mode === 'page' ? 'mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-20 sm:px-8 lg:px-10' : 'flex flex-col gap-5'}>
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 aspect-square items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <h1 className="text-xl font-semibold text-slate-900">Light Knitting Chart 소개</h1>
            <p className="break-keep text-sm leading-6 text-slate-600">
              Light Knitting Chart는 태블릿과 PC에서 가볍게 대바늘 도안을 그리고, 레이어를 나눠 관리하고, 이미지를 참고
              레이어로 올려 정리할 수 있도록 만든 차트 편집 앱입니다.
            </p>
            <p className="break-keep text-sm leading-6 text-slate-600">
              기호 브러시, 배경 채우기, 선택과 반전, 레이어 분리, PNG 저장까지 한 화면 안에서 빠르게 이어서 작업할 수
              있게 구성했습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <Tablet className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">터치 중심 작업</h2>
          <p className="mt-2 break-keep text-sm leading-6 text-slate-600">
            태블릿을 기본 화면으로 두고, 두 손가락 핀치 줌과 손 이동 모드까지 고려해서 캔버스를 다룰 수 있습니다.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <Monitor className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">레이어 기반 편집</h2>
          <p className="mt-2 break-keep text-sm leading-6 text-slate-600">
            드로잉 레이어와 이미지 레이어를 구분해 관리하고, 필요한 부분만 선택하거나 복제해 도안을 정리할 수 있습니다.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <Download className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">이미지 저장</h2>
          <p className="mt-2 break-keep text-sm leading-6 text-slate-600">
            그리드와 코·단 수 표시 포함 여부를 정해서 결과 이미지를 저장하고, 같은 탭 안에서는 작업 상태도 이어서 복원할
            수 있습니다.
          </p>
        </div>
      </section>

      {showInstallGuide ? (
        <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
              {deviceType === 'ios' ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            </div>
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-sky-950">기기에 앱처럼 설치해서 사용할 수 있어요</h2>
              {deviceType === 'ios' ? (
                <p className="break-keep text-sm leading-6 text-sky-900">
                  iPhone 또는 iPad Safari에서는 공유 버튼을 누른 뒤 <strong>홈 화면에 추가</strong>를 선택하면 앱처럼
                  바로 실행할 수 있습니다.
                </p>
              ) : deviceType === 'android' ? (
                <p className="break-keep text-sm leading-6 text-sky-900">
                  Android Chrome 계열 브라우저에서는 메뉴를 열고 <strong>앱 설치</strong> 또는 <strong>홈 화면에
                  추가</strong>를 선택해 빠르게 실행할 수 있습니다.
                </p>
              ) : (
                <p className="break-keep text-sm leading-6 text-sky-900">
                  모바일 브라우저 메뉴에서 <strong>홈 화면에 추가</strong> 또는 <strong>앱 설치</strong> 항목을 선택해
                  앱처럼 꺼내 쓸 수 있습니다.
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <div className='flex justify-between'>
        <p className='text-end text-slate-300'>v0.1.2</p>
        <p className="text-right text-xs text-slate-400">첫 방문 안내 이후에도 우측 상단 안내 버튼으로 다시 열 수 있습니다.</p>
      </div>
    </div>
  );
}
