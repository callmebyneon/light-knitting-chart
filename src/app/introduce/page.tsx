import Link from 'next/link';
import Introducing from './_components/Introducing';
import HeaderArea from '@/components/ui/shared/HeaderArea';

export default function IntroducePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderArea>
        <Link
          href="/"
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        >
          캔버스로 돌아가기
        </Link>
      </HeaderArea>

      <main className="pt-12">
        <Introducing mode="page" />
      </main>
    </div>
  );
}
