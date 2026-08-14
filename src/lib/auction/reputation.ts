export function getReputationTier(score: number): { label: string; color: string } {
  if (score >= 150) return { label: "طلایی", color: "#ca8a04" };
  if (score >= 100) return { label: "نقره‌ای", color: "#6b7280" };
  if (score >= 60) return { label: "برنزی", color: "#b45309" };
  return { label: "نیازمند بهبود", color: "#dc2626" };
}