import RootLayout from "./layout";

export default function NotFound() {
  return (
    <RootLayout>
      <div className="w-full h-full flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold">Not Found</h2>
        <p>잘못된 접근입니다.</p>
        <a href="/" className="underline mt-3 text-slate-700 hover:text-sky-500">돌아가기</a>
      </div>
    </RootLayout>
  );
}