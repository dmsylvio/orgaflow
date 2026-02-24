export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh p-6">
      <div className="w-full">{children}</div>
    </main>
  );
}
