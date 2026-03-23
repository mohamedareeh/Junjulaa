export function formatCurrency(value: string | number | null) {
  const num = Number(value ?? 0);
  return `MVR ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
