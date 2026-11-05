import { ChecklistItem } from "../components/Checklist";

/** Le « programme parfait » des vacances, réutilisé en scène 1 et 4. */
export const PLAN = [
  { label: "Me reposer", emoji: "😴" },
  { label: "Profiter", emoji: "🌴" },
  { label: "Devoirs en avance", emoji: "📚" },
] satisfies Pick<ChecklistItem, "label" | "emoji">[];
