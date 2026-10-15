import {
  FiBookOpen,
  FiCoffee,
  FiFilm,
  FiHeart,
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";

const CATEGORY_ICONS = {
  food: FiCoffee,
  transport: FiTruck,
  housing: FiHome,
  education: FiBookOpen,
  health: FiHeart,
  shopping: FiShoppingBag,
  entertainment: FiFilm,
  other: FiPackage,
} as const;

export function CategoryIcon({ categoryId, className }: { categoryId: string; className?: string }) {
  const Icon = CATEGORY_ICONS[categoryId as keyof typeof CATEGORY_ICONS] ?? FiPackage;
  return <Icon className={className} aria-hidden="true" />;
}
