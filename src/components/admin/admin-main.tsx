import type { ReactNode } from "react";

export default function AdminMain({ children }: { children: ReactNode }) {
  return (
    <main className="h-screen h-screen-ios overflow-y-auto md:pl-56 xl:pl-64 min-h-0">
      <div className="pt-16 pb-16">{children}</div>
    </main>
  );
}
