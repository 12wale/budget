// ─────────────────────────────────────────────
// i18n — Arabic + English string maps
// The app is Arabic-primary. English is the fallback.
// ─────────────────────────────────────────────

import type { Language } from "@/types/budget.types";

export const strings = {
  ar: {
    appName: "أمّن جيبك",
    tagline: "اعرف ميزانيتك هتكفيك لحد إمتى",

    nav: {
      overview: "الرئيسية",
      expenses: "المصروفات",
      simulator: "المحاكاة",
      settings: "الإعدادات",
    },

    setup: {
      headline: "اعرف ميزانيتك هتكفيك لحد إمتى",
      subheadline: "ابني خطة بسيطة من رصيدك المتاح، ومصاريفك الثابتة، وإنفاقك اليومي.",
      cta: "احسب ميزانيتي",
      privacy: "تُحفظ بيانات ميزانيتك بأمان في حسابك.",
      fields: {
        startingBalance: "إجمالي المبلغ المتاح",
        currency: "العملة",
        startDate: "تاريخ البداية",
        targetDate: "تاريخ الهدف",
        fixedCommitments: "الإلتزامات الثابتة",
        fixedCommitmentsHelper: "إيجار، فواتير، أو أي مصاريف ثابتة تُخصم مرة واحدة من المجموع.",
        plannedDailySpend: "الإنفاق اليومي المتوقع",
        plannedDailySpendHelper: "تقدير للمصاريف المتغيرة اليومية.",
      },
      edit: "تعديل الخطة",
    },

    overview: {
      title: "الرئيسية",
      availableAfterCommitments: "المتاح بعد الإلتزامات",
      availableHelper: "المبلغ الأولي مطروحًا منه الإلتزامات والمصاريف المسجّلة.",
      dailyLimit: "الحد اليومي المقترح",
      dailyLimitHelper: "هدف تخطيطي، وليس ضمانًا للإنفاق.",
      estimatedRunway: "الوقت المتبقي بالأيام",
      runwayHelper: "بناءً على معدل إنفاقك الحالي.",
      planStatus: "حالة الخطة",
      recentExpenses: "آخر المصروفات",
      noExpenses: "لم تُسجَّل أي مصاريف بعد.",
      addFirstExpense: "أضف أول مصروف",
      forecastBased: "بناءً على: ",
      forecastPlanned: "الإنفاق اليومي المخطط",
      forecastActual: "متوسط الإنفاق الفعلي",
      planExpired: "انتهت مدة الخطة",
      planExpiredSub: "تاريخ الهدف قد مضى. أنشئ خطة جديدة من الإعدادات.",
    },

    status: {
      healthy: "ضمن الخطة",
      above_target: "الإنفاق أعلى من الهدف",
      no_budget: "الميزانية مستنفدة بالإلتزامات",
      no_days_remaining: "لا أيام متبقية في الخطة",
      insufficient_data: "أضف مصاريف لحساب المتوسط الفعلي",
      expired: "انتهت الخطة",
    },

    expenses: {
      title: "المصروفات",
      totalSpent: "إجمالي الإنفاق",
      addExpense: "إضافة مصروف",
      editExpense: "تعديل المصروف",
      deleteExpense: "حذف المصروف",
      deleteConfirm: "هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع.",
      empty: "لا توجد مصاريف بعد.",
      emptySubtext: "اضغط «إضافة مصروف» لتسجيل أول مصروف.",
      fields: {
        amount: "المبلغ",
        date: "التاريخ",
        category: "الفئة",
        note: "ملاحظة (اختياري)",
        notePlaceholder: "وصف المكان أو السبب…",
      },
    },

    categories: {
      food: "طعام وبقالة",
      transport: "مواصلات",
      housing: "سكن وفواتير",
      education: "تعليم وعمل",
      health: "صحة",
      shopping: "تسوق",
      entertainment: "ترفيه",
      other: "أخرى",
    },

    simulator: {
      title: "المحاكاة",
      subtitle: "جرّب تغيير إنفاقك اليومي وشوف التأثير — من غير ما تغير بياناتك الحقيقية.",
      currentBaseline: "الوضع الحالي",
      scenario: "السيناريو الجديد",
      adjustedDailySpend: "الإنفاق اليومي المعدّل",
      runwayLabel: "الوقت المتبقي",
      exhaustionLabel: "تاريخ نفاد الميزانية",
      balanceOnTarget: "الرصيد في تاريخ الهدف",
      differenceLabel: "الفرق",
      days: "يوم",
      applyPlan: "طبّق هذه الخطة",
      resetScenario: "إعادة تعيين",
      applyWarning: "سيؤدي تطبيق هذه الخطة إلى تحديث الإنفاق اليومي المخطط في خطتك.",
      zeroSpendNote: "الإنفاق اليومي صفر — هذا النموذج لا يتنبأ بنفاد الميزانية من المصاريف اليومية وحدها.",
      noPlan: "أنشئ خطة أولًا لتتمكن من استخدام المحاكاة.",
    },

    settings: {
      title: "الإعدادات",
      currency: "العملة",
      language: "اللغة",
      privacy: "الخصوصية",
      privacyText: "بياناتك خاصة بحسابك، ويمكنك حذفها من الإعدادات في أي وقت.",
      exportData: "تصدير البيانات (CSV)",
      resetAll: "حذف كل البيانات",
      resetConfirm: "هل أنت متأكد؟ سيتم حذف خطتك ومصاريفك. لا يمكن التراجع.",
      resetWarning: "تصدير المصروفات متاح قبل حذف البيانات.",
      appVersion: "إصدار التطبيق",
    },

    common: {
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      confirm: "تأكيد",
      loading: "جاري التحميل…",
      error: "حدث خطأ",
      success: "تم بنجاح",
      days: "يوم",
      currency: "العملة",
      noData: "لا توجد بيانات",
      back: "رجوع",
      apply: "تطبيق",
      reset: "إعادة تعيين",
      disclaimer: "هذا تقدير وليس ضمانًا. استخدم الأداة للتخطيط فقط.",
    },

    errors: {
      required: "هذا الحقل مطلوب",
      positiveAmount: "أدخل مبلغًا أكبر من الصفر",
      validNumber: "أدخل رقمًا صحيحًا",
      targetDateAfterStart: "تاريخ الهدف يجب أن يكون بعد أو مساويًا لتاريخ البداية",
      commitmentsExceedBalance: "الإلتزامات الثابتة تتجاوز المبلغ المتاح",
      storageSave: "تعذّر حفظ البيانات في هذا المتصفح. جرّب تحرير مساحة التخزين.",
      storageLoad: "تعذّر قراءة البيانات المحلية. يمكنك المحاولة مجددًا أو إعادة التعيين.",
      planExpired: "انتهت مدة الخطة",
      noPlan: "لم يتم إنشاء خطة بعد",
    },

    forecast: {
      estimateNote: "هذا تقدير بناءً على البيانات المُدخلة وليس توقعًا ماليًا مضمونًا.",
      plannedMode: "بناءً على الإنفاق اليومي المخطط",
      actualMode: "بناءً على متوسط الإنفاق الفعلي (آخر {{days}} يوم)",
      fallbackToPlanned: "لا توجد بيانات كافية للمتوسط الفعلي — يستخدم التقدير المخطط.",
    },
  },

  en: {
    appName: "Will My Budget Last?",
    tagline: "Know how long your money may last",

    nav: {
      overview: "Overview",
      expenses: "Expenses",
      simulator: "Simulator",
      settings: "Settings",
    },

    setup: {
      headline: "Know how long your money may last",
      subheadline: "Build a simple plan from your available balance, upcoming commitments, and daily spending.",
      cta: "Calculate my budget",
      privacy: "Your plan is stored on this device in this version.",
      fields: {
        startingBalance: "Total available amount",
        currency: "Currency",
        startDate: "Plan start date",
        targetDate: "Target date",
        fixedCommitments: "Fixed commitments",
        fixedCommitmentsHelper: "Rent, bills, or any fixed costs reserved once from your total.",
        plannedDailySpend: "Expected daily spending",
        plannedDailySpendHelper: "Your estimated variable daily expenses.",
      },
      edit: "Edit plan",
    },

    overview: {
      title: "Overview",
      availableAfterCommitments: "Available after commitments",
      availableHelper: "Starting amount minus commitments and recorded expenses.",
      dailyLimit: "Suggested daily limit",
      dailyLimitHelper: "A planning target, not a spending guarantee.",
      estimatedRunway: "Estimated runway",
      runwayHelper: "Based on your current spending pace.",
      planStatus: "Plan status",
      recentExpenses: "Recent expenses",
      noExpenses: "No expenses recorded yet.",
      addFirstExpense: "Add your first expense",
      forecastBased: "Based on: ",
      forecastPlanned: "planned daily spending",
      forecastActual: "actual spending average",
      planExpired: "Plan ended",
      planExpiredSub: "Your target date has passed. Create a new plan from Settings.",
    },

    status: {
      healthy: "Within plan",
      above_target: "Spending above target",
      no_budget: "Budget fully reserved by commitments",
      no_days_remaining: "No days remaining in plan",
      insufficient_data: "Add expenses to calculate an actual average",
      expired: "Plan expired",
    },

    expenses: {
      title: "Expenses",
      totalSpent: "Total spent",
      addExpense: "Add expense",
      editExpense: "Edit expense",
      deleteExpense: "Delete expense",
      deleteConfirm: "Are you sure you want to delete this expense? This cannot be undone.",
      empty: "No expenses yet.",
      emptySubtext: "Tap 'Add expense' to record your first transaction.",
      fields: {
        amount: "Amount",
        date: "Date",
        category: "Category",
        note: "Note (optional)",
        notePlaceholder: "Where or why…",
      },
    },

    categories: {
      food: "Food & groceries",
      transport: "Transport",
      housing: "Housing & bills",
      education: "Education / work",
      health: "Health",
      shopping: "Shopping",
      entertainment: "Entertainment",
      other: "Other",
    },

    simulator: {
      title: "Simulator",
      subtitle: "Test different spending levels and see the impact — without changing your real data.",
      currentBaseline: "Current baseline",
      scenario: "New scenario",
      adjustedDailySpend: "Adjusted daily spending",
      runwayLabel: "Estimated runway",
      exhaustionLabel: "Estimated exhaustion date",
      balanceOnTarget: "Balance on target date",
      differenceLabel: "Difference",
      days: "days",
      applyPlan: "Apply this plan",
      resetScenario: "Reset scenario",
      applyWarning: "Applying this plan will update the planned daily spend in your budget.",
      zeroSpendNote: "Daily spend is zero — this model cannot predict exhaustion from daily spending alone.",
      noPlan: "Create a plan first to use the simulator.",
    },

    settings: {
      title: "Settings",
      currency: "Currency",
      language: "Language",
      privacy: "Privacy",
      privacyText: "Your data is private to your account, and you can delete it from settings at any time.",
      exportData: "Export data (CSV)",
      resetAll: "Delete all data",
      resetConfirm: "Are you sure? Your plan and expenses will be permanently deleted. This cannot be undone.",
      resetWarning: "You can export your expenses before deleting your data.",
      appVersion: "App version",
    },

    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      confirm: "Confirm",
      loading: "Loading…",
      error: "Something went wrong",
      success: "Saved",
      days: "days",
      currency: "Currency",
      noData: "No data",
      back: "Back",
      apply: "Apply",
      reset: "Reset",
      disclaimer: "This is an estimate, not a guarantee. Use this tool for planning purposes only.",
    },

    errors: {
      required: "This field is required",
      positiveAmount: "Enter an amount greater than zero",
      validNumber: "Enter a valid number",
      targetDateAfterStart: "The target date must be on or after the start date",
      commitmentsExceedBalance: "Fixed commitments exceed the available balance",
      storageSave: "Could not save changes in this browser. Try freeing browser storage.",
      storageLoad: "Your local data could not be read. You can try again or reset it.",
      planExpired: "Plan has expired",
      noPlan: "No plan created yet",
    },

    forecast: {
      estimateNote: "This is an estimate based on entered data and is not a guaranteed financial forecast.",
      plannedMode: "Based on planned daily spending",
      actualMode: "Based on actual spending average (last {{days}} days)",
      fallbackToPlanned: "Not enough data for actual average — using planned estimate.",
    },
  },
} as const;

export type StringKeys = typeof strings.ar;

// ─────────────────────────────────────────────
// Translation helper
// ─────────────────────────────────────────────

type DeepKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? `${K}` | `${K}.${DeepKeyOf<T[K]>}` : never }[keyof T]
  : never;

/** Simple dot-notation accessor */
function getByPath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

export function createTranslator(language: Language) {
  const dict = strings[language] as unknown as Record<string, unknown>;
  return function t(key: string, vars?: Record<string, string | number>): string {
    let value = getByPath(dict, key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(`{{${k}}}`, String(v));
      }
    }
    return value;
  };
}
