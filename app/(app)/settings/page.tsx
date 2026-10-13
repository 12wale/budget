"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useBudget } from "@/context/BudgetContext";
import { usePreferences } from "@/context/PreferencesContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import {
  exportExpensesCSV,
  downloadCSV,
  exportBackupJSON,
  downloadJSON,
  validateBackupJSON,
  clearAppData,
  saveAppData,
} from "@/lib/storage";
import type { Language, LocalAppDataV1 } from "@/types/budget.types";

export default function SettingsPage() {
  const router = useRouter();
  const { plan, expenses, resetAll } = useBudget();
  const { preferences, setLanguage, setCurrency, t } = usePreferences();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languageOptions = [
    { value: "ar", label: "العربية (Arabic)" },
    { value: "en", label: "English (الإنجليزية)" },
  ];

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    value: c.code,
    label: c.label,
  }));

  function handleExportCSV() {
    const data: LocalAppDataV1 = {
      schemaVersion: 1,
      plan,
      expenses,
      preferences,
    };
    const csv = exportExpensesCSV(data);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `budget-expenses-${dateStr}.csv`);
  }

  function handleExportJSON() {
    const data: LocalAppDataV1 = {
      schemaVersion: 1,
      plan,
      expenses,
      preferences,
    };
    const json = exportBackupJSON(data);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJSON(json, `budget-backup-${dateStr}.json`);
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateBackupJSON(content);
      if (!res.ok) {
        setImportStatus(`خطأ في استيراد الملف: ${res.error}`);
        return;
      }

      // Valid backup: save and reload
      saveAppData(res.data);
      setImportStatus("تم استيراد النسخة الاحتياطية بنجاح! يتم إعادة التحميل…");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleConfirmReset() {
    clearAppData();
    resetAll();
    setIsResetModalOpen(false);
    router.push("/overview");
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
          {t("common.disclaimer")}
        </p>
      </div>

      {/* Language & Currency Card */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">تفضيلات العرض واللغة</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="settings-language"
              label={t("settings.language")}
              value={preferences.language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              options={languageOptions}
            />

            <Select
              id="settings-currency"
              label={t("settings.currency")}
              value={preferences.currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencyOptions}
            />
          </div>
        </CardBody>
      </Card>

      {/* Data Management Card */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">إدارة البيانات والنسخ الاحتياطي</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="text-sm font-medium">{t("settings.exportData")}</p>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                تنزيل جميع المصاريف المسجلة في ملف CSV متوافق مع Excel.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              📥 تصدير CSV
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="text-sm font-medium">نسخة احتياطية كاملة (JSON)</p>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                حفظ خطتك ومصاريفك وتفضيلاتك في ملف للرجوع إليه أو نقله لجهاز آخر.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleExportJSON}>
                💾 حفظ نسخة
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                📂 استعادة نسخة
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>

          {importStatus && (
            <div
              role="alert"
              className="p-3 rounded-lg text-xs font-medium"
              style={{
                background: importStatus.includes("خطأ")
                  ? "var(--color-danger-subtle)"
                  : "var(--color-success-subtle)",
                color: importStatus.includes("خطأ")
                  ? "var(--color-danger)"
                  : "var(--color-success)",
              }}
            >
              {importStatus}
            </div>
          )}

          {/* Destructive Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-sm font-medium text-[var(--color-danger)]">
                {t("settings.resetAll")}
              </p>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                {t("settings.resetWarning")}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsResetModalOpen(true)}
            >
              🗑️ {t("settings.resetAll")}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Privacy Notice Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span aria-hidden="true">🔒</span>
            <h2 className="text-base font-semibold">{t("settings.privacy")}</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3 text-xs md:text-sm text-[var(--color-muted)]">
          <p>{t("settings.privacyText")}</p>
          <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
            <span>{t("settings.appVersion")}: 1.0.0</span>
            <span>بناء محلي آمن 100%</span>
          </div>
        </CardBody>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        open={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={t("settings.resetAll")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsResetModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleConfirmReset}>
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-[var(--color-danger)] font-medium">
            ⚠️ {t("settings.resetConfirm")}
          </p>
          <p style={{ color: "var(--color-muted)" }}>
            سيتم مسح الخطة المالية المسجلة وقائمة المصروفات بالكامل من متصفحك.
          </p>
        </div>
      </Modal>
    </div>
  );
}
