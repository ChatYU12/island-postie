/* Turns the names used in src/content/errands.js into places on the island.
 *
 *   'automation-post'        a keeper's place (position of the building)
 *   'resident@<region>'      a walking resident in that region, picked once per
 *                            errand step and remembered, so it stays the same person
 *   'fountain', 'windmill'…  a working facility from town-facilities.js
 *   anything else            a fixed point near the centre of the errand's region
 *                            (until that landmark gets an exact position)
 */

export function createTargets(ctx) {
  const regions = (ctx.regions || []).map((r) => ({
    id: r.id, name: r.name,
    x: r.position.x !== undefined ? r.position.x : r.position[0],
    z: r.position.z !== undefined ? r.position.z : r.position[2]
  }));

  function regionAt(x, z) {
    let best = null, bestD = Infinity;
    for (const r of regions) {
      const d = (r.x - x) ** 2 + (r.z - z) ** 2;
      if (d < bestD) { best = r; bestD = d; }
    }
    return best;
  }

  const placeById = new Map(ctx.places.map((p) => [p.id, p]));

  function residentById(id) {
    return ctx.residents().find((r) => r.id === id) || null;
  }

  /** Pick a resident in `region`, varied by `seed`, avoiding ids in `exclude`. */
  function pickResident(region, seed, exclude = []) {
    const pool = ctx.residents().filter((r) => r && isFinite(r.x) && !exclude.includes(r.id)
      && regionAt(r.x, r.z)?.id === region);
    const list = pool.length ? pool : ctx.residents().filter((r) => r && isFinite(r.x) && !exclude.includes(r.id));
    if (!list.length) return null;
    list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return list[seed % list.length].id;
  }

  /** Stable point for a landmark we have no exact position for. */
  function fallbackPoint(key, region) {
    const r = regions.find((g) => g.id === region) || regions[0];
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const a = (h % 360) * Math.PI / 180, d = 3 + (h % 5);
    return { x: r.x + Math.cos(a) * d, z: r.z + Math.sin(a) * d };
  }

  /**
   * Live position of a resolved target.
   * target: { kind: 'place'|'resident'|'landmark', id, x?, z? }
   */
  function positionOf(target) {
    if (!target) return null;
    if (target.kind === 'place') {
      const p = placeById.get(target.id);
      return p ? { x: p.position.x, z: p.position.z } : null;
    }
    if (target.kind === 'resident') {
      const r = residentById(target.id);
      return r ? { x: r.x, z: r.z } : null;
    }
    return { x: target.x, z: target.z };
  }

  /** Resolve an errands.js name into a target object (saved with the errand). */
  function resolve(name, region, seed, exclude) {
    if (placeById.has(name)) return { kind: 'place', id: name };
    if (name.startsWith('resident@')) {
      const id = pickResident(name.slice(9), seed, exclude);
      return id ? { kind: 'resident', id, region: name.slice(9) } : null;
    }
    const spot = ctx.landmarks && ctx.landmarks[name];
    if (spot) return { kind: 'landmark', id: name, x: spot.x, z: spot.z };
    const p = fallbackPoint(name, region);
    return { kind: 'landmark', id: name, x: p.x, z: p.z, approximate: true };
  }

  return { regions, regionAt, resolve, positionOf, placeById };
}
