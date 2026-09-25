export const SHIFT_LABELS = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  full_time: 'Integral',
  night: 'Noite'
};

export const SHIFT_ORDER = ['morning', 'afternoon', 'full_time', 'night'];

export function shiftLabel(name) {
  return SHIFT_LABELS[name] || name || '';
}

export function sortShifts(shifts) {
  return [...(shifts || [])].sort((left, right) => {
    const leftIndex = SHIFT_ORDER.indexOf(left.name);
    const rightIndex = SHIFT_ORDER.indexOf(right.name);
    const leftRank = leftIndex === -1 ? SHIFT_ORDER.length : leftIndex;
    const rightRank = rightIndex === -1 ? SHIFT_ORDER.length : rightIndex;
    return leftRank - rightRank;
  });
}
