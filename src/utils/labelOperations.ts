import type { Label } from "@/extensions/dashboard/pages/types";

export function addLabel(labels: Label[], label: Label): Label[] {
  if (labels.some((l) => l.id === label.id)) return labels;
  return [...labels, label];
}

export function updateLabel(
  labels: Label[],
  id: string,
  updated: Partial<Label>
): Label[] {
  return labels.map((l) => (l.id === id ? { ...l, ...updated } : l));
}

export function deleteLabel(labels: Label[], id: string): Label[] {
  return labels.filter((l) => l.id !== id);
}

export function reorderLabels(
  labels: Label[],
  fromIndex: number,
  toIndex: number
): Label[] {
  if (fromIndex === toIndex) return labels;
  const result = [...labels];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
