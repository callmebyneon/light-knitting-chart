import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="h-screen w-full overflow-hidden text-sm flex items-center justify-center fixed top-0 left-0">
      <Spinner className="size-8 text-[#00bcff]" />
    </div>
  );
}