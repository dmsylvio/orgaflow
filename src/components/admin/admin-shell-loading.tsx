import LogoWhite from "./header/logo-white";

function BouncingDots() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span
        className="h-1 w-1 rounded-full bg-black animate-bounce-high"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-1 w-1 rounded-full bg-black animate-bounce-high"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-1 w-1 rounded-full bg-black animate-bounce-high"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

export default function AdminShellLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-100">
      <LogoWhite className="mb-8 w-32 fill-gray-900 md:w-40" />
      <BouncingDots />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
