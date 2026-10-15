"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FiDownload, FiShare } from "react-icons/fi";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallAppCard() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) {
      setShowInstructions((show) => !show);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setIsInstalled(true);
    setPromptEvent(null);
  }

  if (isInstalled) return null;

  return (
    <Card className="border-indigo-200 bg-gradient-to-l from-indigo-50/80 via-white to-cyan-50/70">
      <CardBody className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <FiDownload className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">ثبّت جيبك على هاتفك</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">افتح التطبيق مباشرة من الشاشة الرئيسية، من غير ما تبحث عنه في المتصفح.</p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={install} className="shrink-0">
          {promptEvent ? "تثبيت التطبيق" : "طريقة التثبيت"}
        </Button>
        {showInstructions && (
          <p className="basis-full text-xs leading-5 text-slate-600 sm:ps-[52px]">
            {isIOS ? (
              <>في Safari اضغط <FiShare className="mx-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" /> «مشاركة»، ثم اختر «إضافة إلى الشاشة الرئيسية».</>
            ) : (
              "افتح قائمة المتصفح ⋮ ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."
            )}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
