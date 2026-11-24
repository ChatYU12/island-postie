/* Things drawn in the island scene for the game:
 *   - a ground arrow at the postie's feet that points to the current errand target
 *   - a floating envelope above the target (follows walking residents)
 *   - hidden stamps: 5 per region, picked up by walking over them
 */
import * as THREE from 'three';

const STAMPS_PER_REGION = 5;

function envelope() {
  const g = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.06), new THREE.MeshBasicMaterial({ color: 0xfffaf0 }));
  const flap = new THREE.Mesh(new THREE.ConeGeometry(0.33, 0.2, 3), new THREE.MeshBasicMaterial({ color: 0xd66d88 }));
  flap.rotation.set(Math.PI, 0, Math.PI / 2); flap.position.set(0, 0.11, 0.035); flap.scale.set(1, 1, 0.2);
  g.add(paper, flap);
  return g;
}

function stampMesh() {
  const g = new THREE.Group();
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 12), new THREE.MeshBasicMaterial({ color: 0xe0574f }));
  edge.rotation.x = face.rotation.x = Math.PI / 2;
  g.add(edge, face);
  return g;
}

export function createMarkers({ group, walkable, regions, foundIds, onFound }) {
  // Arrow: a flat chevron on the ground, a little ahead of the postie.
  const arrow = new THREE.Mesh(
    new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0.55), new THREE.Vector2(0.32, 0), new THREE.Vector2(0.12, 0.05),
      new THREE.Vector2(0.12, -0.35), new THREE.Vector2(-0.12, -0.35), new THREE.Vector2(-0.12, 0.05), new THREE.Vector2(-0.32, 0)])),
    new THREE.MeshBasicMaterial({ color: 0xf1c75b, transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide })
  );
  arrow.renderOrder = 3;
  arrow.visible = false;
  group.add(arrow);

  const beacon = envelope();
  beacon.visible = false;
  group.add(beacon);

  // Hidden stamps: deterministic spots on walkable ground around each region centre.
  const stamps = [];
  for (const region of regions) {
    let seed = 0;
    for (const c of region.id) seed = (seed * 33 + c.charCodeAt(0)) >>> 0;
    for (let i = 0, tries = 0; i < STAMPS_PER_REGION && tries < 200; tries++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const a = (seed / 4294967296) * Math.PI * 2;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const d = 4 + (seed / 4294967296) * 13;
      const x = region.x + Math.cos(a) * d, z = region.z + Math.sin(a) * d;
      const y = walkable.standHeight(x, z);
      if (y === null) continue;
      const id = `${region.id}-${i}`;
      i++;
      if (foundIds.includes(id)) continue;
      const mesh = stampMesh();
      mesh.position.set(x, y + 0.55, z);
      mesh.userData.baseY = y + 0.55;
      group.add(mesh);
      stamps.push({ id, region: region.id, x, z, mesh });
    }
  }

  const tmp = new THREE.Vector3();
  let time = 0;

  /** Per moving frame. Markers only animate while the postie moves, so an idle
   *  island still costs no frames. Returns false (never asks for frames itself). */
  function update(dt, pos, target) {
    time += dt;
    let animating = false;

    if (target) {
      const dx = target.x - pos.x, dz = target.z - pos.z, dist = Math.hypot(dx, dz);
      arrow.visible = dist > 3.5;
      if (arrow.visible) {
        const yaw = Math.atan2(dx, dz);
        arrow.position.set(pos.x + Math.sin(yaw) * 1.1, pos.y + 0.12, pos.z + Math.cos(yaw) * 1.1);
        // The chevron points along +y of its shape; laid flat it points to -z,
        // so turning it by yaw + π about world up aims it at the target.
        arrow.rotation.set(-Math.PI / 2, 0, 0);
        arrow.rotateOnWorldAxis(tmp.set(0, 1, 0), yaw + Math.PI);
      }
      const ty = target.y !== undefined ? target.y : (walkable.standHeight(target.x, target.z) ?? pos.y);
      beacon.visible = true;
      beacon.position.set(target.x, ty + 2.6 + Math.sin(time * 3) * 0.12, target.z);
      beacon.rotation.y = time * 1.5;
    } else {
      arrow.visible = false;
      beacon.visible = false;
    }
    arrow.updateMatrixWorld(true);
    beacon.updateMatrixWorld(true);

    for (let i = stamps.length - 1; i >= 0; i--) {
      const s = stamps[i];
      const d = Math.hypot(s.x - pos.x, s.z - pos.z);
      if (d < 0.9) {
        s.mesh.removeFromParent();
        stamps.splice(i, 1);
        onFound(s);
        continue;
      }
      if (d < 25) {
        s.mesh.rotation.y = time * 2;
        s.mesh.position.y = s.mesh.userData.baseY + Math.sin(time * 2.4 + i) * 0.08;
        s.mesh.updateMatrixWorld(true);
      }
    }
    return animating;
  }

  return { update, remaining: () => stamps.length, total: regions.length * STAMPS_PER_REGION,
    list: () => stamps.map(({ id, x, z }) => ({ id, x, z })) };
}
