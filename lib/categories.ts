import type { ExpenseCategory } from "@/types/budget.types";

export const PRESET_CATEGORIES: ExpenseCategory[] = [
  { id: "food",          labelKey: "categories.food",          icon: "food" },
  { id: "transport",     labelKey: "categories.transport",     icon: "transport" },
  { id: "housing",       labelKey: "categories.housing",       icon: "housing" },
  { id: "education",     labelKey: "categories.education",     icon: "education" },
  { id: "health",        labelKey: "categories.health",        icon: "health" },
  { id: "shopping",      labelKey: "categories.shopping",      icon: "shopping" },
  { id: "entertainment", labelKey: "categories.entertainment", icon: "entertainment" },
  { id: "other",         labelKey: "categories.other",         icon: "other" },
];

export function getCategoryById(id: string): ExpenseCategory | undefined {
  return PRESET_CATEGORIES.find((c) => c.id === id);
}
