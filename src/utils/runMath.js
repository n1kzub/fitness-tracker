const KM_PER_MI = 1.609344;

export function distanceInUnit(distanceObj, targetUnit) {
  if (!distanceObj) return 0;
  const { value, unit } = distanceObj;
  if (unit === targetUnit) return Number(value) || 0;
  return targetUnit === 'mi'
    ? (Number(value) || 0) / KM_PER_MI
    : (Number(value) || 0) * KM_PER_MI;
}

export function paceSecPerUnit(durationSec, distanceValueInUnit) {
  if (!distanceValueInUnit || distanceValueInUnit <= 0) return 0;
  return Math.round(durationSec / distanceValueInUnit);
}

export function sortRunsNewestFirst(runs) {
  return [...runs].sort((a, b) => {
    const ad = new Date(a.date).getTime();
    const bd = new Date(b.date).getTime();
    if (bd !== ad) return bd - ad;

    const ac = new Date(a.createdAt || 0).getTime();
    const bc = new Date(b.createdAt || 0).getTime();
    return bc - ac;
  });
}
