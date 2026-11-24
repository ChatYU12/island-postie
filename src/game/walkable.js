/* Where the postie may stand on the island.
 *
 * Land comes from the shared height field. Water (sea, river, lake) is anything
 * at or below sea level, except where a road passes over it: the road samples
 * carry the bridge-deck height, so bridges are walkable without a separate mesh
 * query. Buildings and landmarks are circles from planet3d's obstacle list.
 * Everything is a pure function of the map context, cached on a coarse grid.
 */

const CELL = 2;

export function createWalkable(ctx) {
  const { heightAt, seaLevel, bounds } = ctx;
  const waterLine = seaLevel + 0.12;

  // Road samples bucketed by cell, so a lookup only scans neighbouring cells.
  const roadCells = new Map();
  const cellKey = (cx, cz) => cx * 4096 + cz;
  for (const route of ctx.routes || []) {
    const half = (route.width || 1.7) / 2 + 0.35;
    for (const p of route.points) {
      const k = cellKey(Math.floor(p.x / CELL), Math.floor(p.z / CELL));
      if (!roadCells.has(k)) roadCells.set(k, []);
      roadCells.get(k).push({ x: p.x, y: p.y, z: p.z, half });
    }
  }

  const obstacles = (ctx.obstacles || []).map((o) => ({ x: o.x, z: o.z, r: o.radius * 0.72 }));
  const obstacleCells = new Map();
  for (const o of obstacles) {
    const reach = Math.ceil((o.r + 1) / CELL);
    const cx = Math.floor(o.x / CELL), cz = Math.floor(o.z / CELL);
    for (let dx = -reach; dx <= reach; dx++) {
      for (let dz = -reach; dz <= reach; dz++) {
        const k = cellKey(cx + dx, cz + dz);
        if (!obstacleCells.has(k)) obstacleCells.set(k, []);
        obstacleCells.get(k).push(o);
      }
    }
  }

  /** Bridge deck or road surface under (x, z), or null. */
  function roadAt(x, z) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    let best = null, bestD = Infinity;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const list = roadCells.get(cellKey(cx + dx, cz + dz));
        if (!list) continue;
        for (const p of list) {
          const d = Math.hypot(p.x - x, p.z - z);
          if (d < p.half && d < bestD) { best = p; bestD = d; }
        }
      }
    }
    return best;
  }

  function blockedByObstacle(x, z) {
    const list = obstacleCells.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL)));
    if (!list) return false;
    for (const o of list) if (Math.hypot(o.x - x, o.z - z) < o.r) return true;
    return false;
  }

  /**
   * Where a walker stands at (x, z): { y, bridge } or null when it cannot.
   * A road sample that sits well above the ground is a bridge deck: the walker
   * stays on the deck over the river and over the sloping banks on either side
   * (earlier the banks dropped the walker into the channel, so bridges could not
   * be crossed).
   */
  function stand(x, z) {
    if (x < bounds.minX + 1 || x > bounds.maxX - 1 || z < bounds.minZ + 1 || z > bounds.maxZ - 1) return null;
    const h = heightAt(x, z);
    const road = roadAt(x, z);
    if (road && road.y > h + 0.2) return { y: road.y, bridge: true };
    if (h <= waterLine) return road ? { y: road.y, bridge: true } : null;
    if (!road && blockedByObstacle(x, z)) return null;
    return { y: road ? Math.max(h, road.y - 0.075) : h, bridge: false };
  }

  function standHeight(x, z) {
    const s = stand(x, z);
    return s ? s.y : null;
  }

  /** Can a walker step from `from` ({ y, bridge }) to (x, z)? Returns the new stance or null. */
  function step(from, x, z, distance) {
    const to = stand(x, z);
    if (to === null) return null;
    // Bridge rails: no stepping off the side of a deck onto the bank below.
    if (from.bridge && !to.bridge && to.y < from.y - 0.45) return null;
    // Rises steeper than ~60° (cliffs, canyon walls) stop the walker; drops are fine.
    if (to.y - from.y > Math.max(0.35, distance * 1.8)) return null;
    return to;
  }

  /** Nearest standable point to (x, z), searching outward in rings. */
  function nearestStandable(x, z, maxRadius = 12) {
    if (standHeight(x, z) !== null) return { x, z };
    for (let r = 0.5; r <= maxRadius; r += 0.5) {
      for (let a = 0; a < 16; a++) {
        const t = (a / 16) * Math.PI * 2;
        const px = x + Math.cos(t) * r, pz = z + Math.sin(t) * r;
        if (standHeight(px, pz) !== null) return { x: px, z: pz };
      }
    }
    return null;
  }

  return { stand, standHeight, step, nearestStandable, roadAt };
}
