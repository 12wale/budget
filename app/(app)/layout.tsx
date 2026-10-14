import { Suspense } from "react";
import { Providers } from "./_components/Providers";
import { Sidebar, BottomNav, StorageErrorBanner, MobileTopBar } from "./_components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-dvh w-full overflow-x-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Top Header */}
          <MobileTopBar />

          <main
            className="flex-1 flex flex-col pb-24 md:pb-8"
          >
            <div className="flex-1 mx-auto w-full max-w-[var(--content-max-width)] px-3.5 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[300px] text-slate-400 text-sm animate-pulse">
                    جاري التحميل…
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNav />

        {/* Storage Error Notification */}
        <StorageErrorBanner />
      </div>
    </Providers>
  );
}
