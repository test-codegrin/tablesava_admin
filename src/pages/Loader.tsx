import { Spinner } from "@/components/ui/spinner";

function Loader({ fullscreen = false }: { fullscreen?: boolean }) {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm font-medium text-zinc-500">Restoring session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2">
      <Spinner className="size-6 text-primary" />
      <p className="text-sm text-zinc-400">Restoring session...</p>
    </div>
  );
}

export default Loader;