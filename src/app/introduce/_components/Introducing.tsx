'use client';

import Image from 'next/image';
import { Download, Info, Monitor, Share, Smartphone, Tablet, X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';

export const INTRODUCE_STORAGE_KEY = 'lkc:introduce-seen';

export type IntroduceDeviceType = 'desktop' | 'ios' | 'android' | 'other-mobile';

type IntroducingProps = {
  mode: 'page' | 'modal';
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
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
  const isStandalone = useSyncExternalStore(() => () => {}, isStandaloneDisplayMode, () => false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  // const [isInstallCardClosed, setIsInstallCardClosed] = useState(false);

  useEffect(() => {
    markIntroduceSeen();
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let isCancelled = false;

    const updateServiceWorkerStatus = async () => {
      const registration = await navigator.serviceWorker.getRegistration('/');

      if (isCancelled) {
        return;
      }

      setIsServiceWorkerReady(Boolean(registration));

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[PWA] service worker status', {
          hasRegistration: Boolean(registration),
          hasController: Boolean(navigator.serviceWorker.controller),
        });
      }
    };

    void updateServiceWorkerStatus();

    const handleControllerChange = () => {
      setIsServiceWorkerReady(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      isCancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[PWA] beforeinstallprompt fired');
    }
    setInstallPromptEvent(event as BeforeInstallPromptEvent);
    // setIsInstallCardClosed(false);
  };

  const handleAppInstalled = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[PWA] appinstalled fired');
    }
    setInstallPromptEvent(null);
    // setIsInstallCardClosed(true);
  };

  useEffect(() => {
    if (isStandalone) {
      return;
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleAndroidInstallClick = async () => {
    if (!installPromptEvent) {
      return;
    }

    await installPromptEvent.prompt();
    const choiceResult = await installPromptEvent.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log("사용자가 설치 프롬프트에 동의했습니다.");
      // setIsInstallCardClosed(true);
    }
  
    setInstallPromptEvent(null);
  };

  const showInstallGuide = deviceType !== 'desktop';
  const showAndroidInstallCard = deviceType === 'android' && !isStandalone && installPromptEvent !== null; //&& !isInstallCardClosed
  const showDebugBadges = process.env.NODE_ENV !== 'production';

  return (
    <div id="introduction-content" className={mode === 'page' ? 'mx-auto flex w-full h-[calc(100vh-3rem)] overflow-y-auto max-w-4xl flex-col gap-6 px-5 pt-8 pb-20 lg:py-20 sm:px-8 lg:px-10' : 'flex flex-col gap-5'}>
      <section className="rounded-3xl border border-slate-200 bg-sky-100 md:bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col items-start gap-4 md:flex-row">
          <div className="flex h-11 w-11 aspect-square items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-900 mb-3">Light Knitting Chart 소개</h1>
            <p className="break-keep text-sm leading-6 text-slate-600">
              Light Knitting Chart는 웹과 PC에서 편하게 사용할 수 있는 차트 관리 도구예요. 편집한 내용을 앱처럼 빠르게
              확인하고, 도안 작업에 필요한 화면을 한곳에 모아 관리할 수 있도록 만들었습니다.
            </p>
            <p className="break-keep text-sm leading-6 text-slate-600">
              기호 배경 색, PNG 아이콘 크기, 편집 화면 구성까지 실제 사용 흐름을 먼저 생각해서 정리했습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <Tablet className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">태블릿 중심 작업</h2>
          <p className="mt-2 break-keep text-sm leading-6 text-slate-600">
            태블릿 가로 화면을 기본 기준으로 두고, 손가락 터치와 확대, 이동 같은 조작을 먼저 고려해 설계했습니다.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <Monitor className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">웹 기반 편집</h2>
          <p className="mt-2 break-keep text-sm leading-6 text-slate-600">
            브라우저에서 바로 실행되며, 필요한 부분만 빠르게 확인하고 편집할 수 있도록 화면을 단순하게 구성했습니다.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <Download className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">앱처럼 설치</h2>
          <p className="mt-2 break-keep text-sm leading-6 text-slate-600">
            설치 가능한 환경에서는 홈 화면에 추가해 앱처럼 실행할 수 있도록 PWA 설치 흐름을 지원합니다.
          </p>
        </div>
      </section>

      {showInstallGuide ? (
        <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
              {deviceType === 'ios' ? <Share className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-sky-950">기기에 설치해서 사용해 보세요</h2>
                {showDebugBadges ? (
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                      prompt: {installPromptEvent ? 'ready' : 'waiting'}
                    </span>
                    <span className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                      sw: {isServiceWorkerReady ? 'ready' : 'missing'}
                    </span>
                    <span className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                      mode: {isStandalone ? 'standalone' : 'browser'}
                    </span>
                  </div>
                ) : null}
                {deviceType === 'ios' ? (
                  <p className="break-keep text-sm leading-6 text-sky-900">
                    iPhone 또는 iPad의 Safari에서는 공유 버튼을 누른 뒤 <strong>홈 화면에 추가</strong>를 선택하면 바로
                    설치할 수 있어요.
                  </p>
                ) : deviceType === 'android' ? (
                  <>
                    {showAndroidInstallCard ? (
                      <div className="rounded-[1.5rem] border border-sky-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 shadow-sm">
                            <Image
                              src="/icons/android-icon-144x144.png"
                              alt="Light Knitting Chart"
                              width={40}
                              height={40}
                              className="h-12 w-12 rounded-2xl object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex justify-center gap-3">
                              <div className="min-w-0">
                                {/* <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Install app</p> */}
                                {/* <h3 className="mt-1 text-lg font-semibold text-slate-950">홈 화면에 추가</h3> */}
                              </div>
                            </div>

                            <p className="mt-3 break-keep text-sm leading-6 text-slate-600 text-center">
                              Chrome이 이 사이트를 앱으로 설치할 수 있다고 판단하면, 아래 버튼으로 바로 홈 화면에 추가할 수 있어요.
                            </p>

                            <div className="mt-4 flex justify-center">
                              <button
                                type="button"
                                onClick={handleAndroidInstallClick}
                                className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-400 active:bg-sky-600"
                              >
                                홈 화면에 추가
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="break-keep text-sm leading-6 text-sky-900">
                        Android Chrome에서는 설치 가능한 조건이 갖춰지면 <strong>홈 화면에 추가</strong> 버튼이 자동으로 나타납니다.
                        아직 버튼이 보이지 않으면, 이 페이지를 조금 더 둘러보거나 Chrome 메뉴에서 설치를 확인해 주세요.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="break-keep text-sm leading-6 text-sky-900">
                    모바일 브라우저의 메뉴에서 <strong>홈 화면에 추가</strong> 또는 <strong>앱 설치</strong>를 선택하면
                    설치할 수 있어요.
                  </p>
                )}
              </div>

              {deviceType === 'android' && !showAndroidInstallCard ? (
                <p className="text-xs leading-5 text-sky-700">
                  설치 조건이 충족되면 Chrome이 자동으로 설치 가능 상태를 알려줍니다. 그때 이 카드의 버튼으로 바로 진행할 수 있어요.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col-reverse lg:flex-row lg:justify-between">
        <p className="mt-2 lg:mt-0 lg:text-end text-slate-300">v0.2.0</p>
        <p className="lg:text-right text-xs text-slate-400">
          <span>설치 안내는 기기와 브라우저 상태에 따라 달라질 수 있어요.</span>
          {mode !== 'page' ? <span> 필요하면 다시 확인할 수 있습니다.</span> : null}
        </p>
      </div>
    </div>
  );
}
