"use client";

import { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { usePreferences } from "@/context/PreferencesContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { getCategoryById } from "@/lib/categories";
import { formatDate } from "@/lib/date";
import type { Expense } from "@/types/budget.types";

export default function ExpensesPage() {
  const { expenses, deleteExpense, summary } = useBudget();
  const { t, formatAmount, locale } = usePreferences();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const totalMinor = expenses.reduce((s, e) => s + e.amountMinor, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t("expenses.title")}</h1>
          {expenses.length > 0 && (
            <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
              {t("expenses.totalSpent")}: <strong className="tabular-nums">{formatAmount(totalMinor)}</strong>
            </p>
          )}
        </div>
        <Button size="sm" icon="➕" onClick={() => setAddOpen(true)}>
          {t("expenses.addExpense")}
        </Button>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
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
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--color-border)]" role="list">
            {sorted.map((expense) => {
              const category = getCategoryById(expense.categoryId);
              return (
                <li
                  key={expense.id}
                  className="flex items-center gap-3 px-5 py-4 md:px-6 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <span className="text-2xl w-9 text-center flex-shrink-0" aria-hidden="true">
                    {category?.icon ?? "📦"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      {t(category?.labelKey ?? "categories.other")}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                      {formatDate(expense.date, locale)}
                      {expense.note && ` · ${expense.note}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-sm font-bold tabular-nums">{formatAmount(expense.amountMinor)}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditTarget(expense)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-colors text-base"
                        style={{ color: "var(--color-muted)" }}
                        aria-label={`${t("expenses.editExpense")}: ${formatAmount(expense.amountMinor)}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteTarget(expense)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-danger-subtle)] transition-colors text-base"
                        style={{ color: "var(--color-muted)" }}
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

      {/* Delete Confirm Modal */}
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
              onClick={() => {
                if (deleteTarget) deleteExpense(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "var(--color-text)" }}>
          {t("expenses.deleteConfirm")}
        </p>
        {deleteTarget && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
            <p className="text-sm font-medium">{formatAmount(deleteTarget.amountMinor)}</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
              {formatDate(deleteTarget.date, locale)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
