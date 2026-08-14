export function maskBidderName(fullName: string | null | undefined): string {
  const name = (fullName || "کاربر").trim();
  if (name.length <= 2) return name + "***";
  return name.slice(0, 2) + "***" + name.slice(-1);
}