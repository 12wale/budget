"use client";

import { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { usePreferences } from "@/context/PreferencesContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { getCategoryById } from "@/lib/categories";
import { formatDate } from "@/lib/date";
import type { Expense } from "@/types/budget.types";

export default function ExpensesPage() {
  const { expenses, deleteExpense, plan } = useBudget();
  const { t, formatAmount, locale } = usePreferences();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const totalMinor = expenses.reduce((s, e) => s + e.amountMinor, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header & Total Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t("expenses.title")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            سجل وتتبع جميع مصاريفك اليومية بدقة وسهولة.
          </p>
        </div>
        <Button size="md" icon="➕" className="w-full sm:w-auto" onClick={() => setAddOpen(true)}>
          {t("expenses.addExpense")}
        </Button>
      </div>

      {/* Summary KPI Bar */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100">
            <CardBody className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">{t("expenses.totalSpent")}</p>
                <p className="text-2xl font-extrabold text-indigo-700 tabular-nums">
                  {formatAmount(totalMinor)}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center text-xl shadow-xs">
                💸
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
            <CardBody className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">عدد المصروفات المسجلة</p>
                <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {expenses.length}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl shadow-xs">
                📝
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Expense List */}
      {sorted.length === 0 ? (
        <Card className="shadow-xs">
          <EmptyState
            icon="🧾"
            title={t("expenses.empty")}
            description={t("expenses.emptySubtext")}
            action={
              <Button onClick={() => setAddOpen(true)} icon="➕">
                {t("expenses.addExpense")}
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>تفاصيل المصروف</span>
            <span>المبلغ والإجراء</span>
          </div>

          <ul className="divide-y divide-slate-100" role="list">
            {sorted.map((expense) => {
              const category = getCategoryById(expense.categoryId);
              return (
                <li
                  key={expense.id}
                  className="flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-6 py-3 sm:py-4 hover:bg-slate-50/70 transition-colors group"
                >
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    {category?.icon ?? "📦"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {t(category?.labelKey ?? "categories.other")}
                      </p>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{formatDate(expense.date, locale)}</span>
                      {expense.note && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 bg-slate-100/80 px-1.5 py-0.5 rounded-md truncate max-w-[120px] sm:max-w-none">
                            {expense.note}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
                    <p className="text-sm sm:text-base font-extrabold text-slate-900 tabular-nums">
                      {formatAmount(expense.amountMinor)}
                    </p>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditTarget(expense)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-sm text-slate-400"
                        aria-label={`${t("expenses.editExpense")}: ${formatAmount(expense.amountMinor)}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteTarget(expense)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors text-sm text-slate-400"
                        aria-label={`${t("expenses.deleteExpense")}: ${formatAmount(expense.amountMinor)}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("expenses.addExpense")}
      >
        <ExpenseForm onSuccess={() => setAddOpen(false)} onCancel={() => setAddOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={t("expenses.editExpense")}
      >
        {editTarget && (
          <ExpenseForm
            expense={editTarget}
            onSuccess={() => setEditTarget(null)}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("expenses.deleteExpense")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!deleteTarget) return;
                const deleted = await deleteExpense(deleteTarget.id);
                if (deleted) setDeleteTarget(null);
              }}
            >
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            {t("expenses.deleteConfirm")}
          </p>
          {deleteTarget && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                {formatDate(deleteTarget.date, locale)}
              </span>
              <span className="text-base font-extrabold text-slate-900 tabular-nums">
                {formatAmount(deleteTarget.amountMinor)}
              </span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
