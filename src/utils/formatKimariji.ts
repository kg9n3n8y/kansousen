export function formatKimariji(kimariji: string, decisionNumber: number | null): string {
  if (!kimariji) return '';
  if (!decisionNumber || decisionNumber >= kimariji.length) {
    return kimariji;
  }
  const leading = kimariji.slice(0, decisionNumber);
  const trailing = kimariji.slice(decisionNumber);
  return `${leading}︵${trailing}︶`;
}
