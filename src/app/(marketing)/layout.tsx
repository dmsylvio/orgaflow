export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
