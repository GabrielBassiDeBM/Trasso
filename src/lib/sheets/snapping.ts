export interface SnapRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const GRID_SIZE_MM = 4;
const SNAP_THRESHOLD_MM = 2.2;
const GRID_THRESHOLD_MM = 1.6;

interface AxisSnapResult {
  value: number;
  guides: number[];
}

function snapAxis(
  start: number,
  size: number,
  others: number[],
  pageSize: number,
): AxisSnapResult {
  const center = start + size / 2;
  const end = start + size;
  const candidates: { edge: number; target: number }[] = [];

  const targets = [...others, 0, pageSize, pageSize / 2];
  for (const target of targets) {
    candidates.push({ edge: start, target });
    candidates.push({ edge: center, target });
    candidates.push({ edge: end, target });
  }

  let best: { delta: number; target: number } | null = null;
  for (const candidate of candidates) {
    const delta = candidate.target - candidate.edge;
    if (Math.abs(delta) <= SNAP_THRESHOLD_MM && (!best || Math.abs(delta) < Math.abs(best.delta))) {
      best = { delta, target: candidate.target };
    }
  }

  if (best) {
    return { value: start + best.delta, guides: [best.target] };
  }

  const gridSnapped = Math.round(start / GRID_SIZE_MM) * GRID_SIZE_MM;
  if (Math.abs(gridSnapped - start) <= GRID_THRESHOLD_MM) {
    return { value: gridSnapped, guides: [] };
  }

  return { value: start, guides: [] };
}

export function computeSnap(
  rect: SnapRect,
  allRects: SnapRect[],
  pageWidthMm: number,
): { x: number; y: number; guidesX: number[]; guidesY: number[] } {
  const others = allRects.filter((r) => r.id !== rect.id);
  const xSnap = snapAxis(rect.x, rect.w, others.map((r) => r.x), pageWidthMm);
  const xSnapEnd = snapAxis(rect.x, rect.w, others.map((r) => r.x + r.w), pageWidthMm);
  const xSnapCenter = snapAxis(rect.x, rect.w, others.map((r) => r.x + r.w / 2), pageWidthMm);
  const ySnap = snapAxis(rect.y, rect.h, others.map((r) => r.y), Infinity);
  const ySnapEnd = snapAxis(rect.y, rect.h, others.map((r) => r.y + r.h), Infinity);
  const ySnapCenter = snapAxis(rect.y, rect.h, others.map((r) => r.y + r.h / 2), Infinity);

  const bestX = [xSnap, xSnapEnd, xSnapCenter].reduce((a, b) =>
    Math.abs(b.value - rect.x) < Math.abs(a.value - rect.x) ? b : a,
  );
  const bestY = [ySnap, ySnapEnd, ySnapCenter].reduce((a, b) =>
    Math.abs(b.value - rect.y) < Math.abs(a.value - rect.y) ? b : a,
  );

  return { x: bestX.value, y: bestY.value, guidesX: bestX.guides, guidesY: bestY.guides };
}
