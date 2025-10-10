import { type historyPredict } from "../db/schema/history-predict";

type History = (typeof historyPredict.$inferSelect)[];

export const calculateMostCommonWaste = (histories: History): string => {
  if (histories.length === 0) return "-";

  const labelCounts = histories.reduce((acc, h) => {
    if (h.label) {
      acc[h.label] = (acc[h.label] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedLabels = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]);

  return sortedLabels[0]?.[0] || "-";
};

export const calculateRecyclingPotential = (histories: History): string => {
  if (histories.length === 0) return "Tidak ada data";

  const recyclable = [
    "brown-glass",
    "cardboard",
    "green-glass",
    "metal",
    "paper",
    "plastic",
    "white-glass",
  ];
  const partiallyRecyclable = ["battery", "clothes", "shoes"];
  // "biological" and "trash" are considered non-recyclable (score 0)

  let score = 0;
  histories.forEach((h) => {
    if (h.label && recyclable.includes(h.label)) {
      score += 1;
    } else if (h.label && partiallyRecyclable.includes(h.label)) {
      score += 0.5;
    }
  });

  const recyclingRatio = histories.length > 0 ? score / histories.length : 0;

  if (recyclingRatio > 0.7) {
    return "Tinggi";
  }
  if (recyclingRatio > 0.4) {
    return "Sedang";
  }
  return "Rendah";
};
