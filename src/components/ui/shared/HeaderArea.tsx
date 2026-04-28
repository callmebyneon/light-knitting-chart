import Image from "next/image";

export default function HeaderArea({ children }: { children: React.ReactNode }) {
  return (
    <header className="fixed left-0 top-0 flex h-12 w-full items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
      <h1 className="flex items-center gap-2">
        <Image alt="LKC head logo" src="/logo_264.png" width={24} height={24} />
        <span className="hidden text-md font-bold text-slate-400 lg:block">Light Knitting Chart</span>
        <span className="text-md font-bold text-slate-400 lg:hidden">LKC</span>
      </h1>

      {children}
    </header>
  );
}