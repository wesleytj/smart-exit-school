export function nextDisplayOrder(gates) {
  const orders = (gates || []).map((gate) => Number(gate.display_order) || 0);
  const max = orders.length > 0 ? Math.max(...orders) : 0;
  return Math.max(1, max + 1);
}
