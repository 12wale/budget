import { Providers } from "./_components/Providers";
import { Sidebar, BottomNav, StorageErrorBanner } from "./_components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-dvh">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main
          className="flex-1 flex flex-col min-w-0"
          style={{ paddingBottom: "calc(var(--bottom-nav-height) + 8px)" }}
        >
          <div className="flex-1 mx-auto w-full max-w-[var(--content-max-width)] px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />

        {/* Storage error notification */}
        <StorageErrorBanner />
      </div>
    </Providers>
  );
}
