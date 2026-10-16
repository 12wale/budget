"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FiLock } from "react-icons/fi";

export function AccountGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  if ((pathname === "/overview" && !user) || loading || user?.app_metadata?.email_verified === true) return children;

  return (
    <Card className="mx-auto max-w-lg mt-8">
      <CardBody className="py-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <FiLock className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">الميزة دي متاحة بعد تسجيل الدخول</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">خطتك الحالية تفضل متاحة على الصفحة الرئيسية. سجّل الدخول لحفظ المصروفات واستخدام باقي الأدوات.</p>
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="mt-5 inline-block">
          <Button>تسجيل الدخول</Button>
        </Link>
      </CardBody>
    </Card>
  );
}
