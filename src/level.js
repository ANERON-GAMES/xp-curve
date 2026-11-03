export function levelForTotal(totals, total) {
  const last = totals.length - 1;
  if (total >= totals[last]) {
    return totals.length;
  }
  let low = 0;
  let high = last;
  while (low < high) {
    const mid = low + Math.floor((high - low + 1) / 2);
    if (totals[mid] <= total) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low + 1;
}
