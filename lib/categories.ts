import type { ExpenseCategory } from "@/types/budget.types";

export const PRESET_CATEGORIES: ExpenseCategory[] = [
  { id: "food",          labelKey: "categories.food",          icon: "🍽️" },
  { id: "transport",     labelKey: "categories.transport",     icon: "🚌" },
  { id: "housing",       labelKey: "categories.housing",       icon: "🏠" },
  { id: "education",     labelKey: "categories.education",     icon: "📚" },
  { id: "health",        labelKey: "categories.health",        icon: "💊" },
  { id: "shopping",      labelKey: "categories.shopping",      icon: "🛍️" },
  { id: "entertainment", labelKey: "categories.entertainment", icon: "🎬" },
  { id: "other",         labelKey: "categories.other",         icon: "📦" },
];

export function getCategoryById(id: string): ExpenseCategory | undefined {
  return PRESET_CATEGORIES.find((c) => c.id === id);
}
