/* The postie: a small figure built from primitives in the same flat, vertex-lit
 * style as the residents, plus a soft blob shadow (the island's shadow map is
 * static, so a moving figure needs its own contact shadow).
 */
import * as THREE from 'three';

const COLORS = {
  uniform: 0x2f6f9a, trim: 0xf1c75b, skin: 0xf3c9a5, cap: 0x23506f,
  bag: 0x9a6a3c, strap: 0x6e4a2a, boots: 0x3b3430, letter: 0xfffaf0
};

export function createPostie(scale = 1) {
  const root = new THREE.Group();
  root.name = 'postie';
  const body = new THREE.Group();
  root.add(body);
  const mats = {};
  const mat = (hex) => (mats[hex] ||= new THREE.MeshLambertMaterial({ color: hex }));
  const add = (geometry, hex, x, y, z, parent = body) => {
    const mesh = new THREE.Mesh(geometry, mat(hex));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  // Legs pivot at the hip so they can swing.
  const legs = [-0.09, 0.09].map((x) => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.34, 0);
    body.add(hip);
    add(new THREE.BoxGeometry(0.11, 0.3, 0.12), COLORS.uniform, 0, -0.15, 0, hip);
    add(new THREE.BoxGeometry(0.13, 0.07, 0.17), COLORS.boots, 0, -0.31, 0.02, hip);
    return hip;
  });
  add(new THREE.CylinderGeometry(0.19, 0.22, 0.42, 10), COLORS.uniform, 0, 0.55, 0);
  add(new THREE.CylinderGeometry(0.225, 0.225, 0.05, 10), COLORS.trim, 0, 0.4, 0);
  const arms = [-0.25, 0.25].map((x) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 0.72, 0);
    body.add(shoulder);
    add(new THREE.BoxGeometry(0.09, 0.3, 0.1), COLORS.uniform, 0, -0.14, 0, shoulder);
    add(new THREE.SphereGeometry(0.055, 8, 6), COLORS.skin, 0, -0.31, 0, shoulder);
    return shoulder;
  });
  add(new THREE.SphereGeometry(0.2, 14, 10), COLORS.skin, 0, 0.96, 0);
  add(new THREE.CylinderGeometry(0.2, 0.21, 0.12, 14), COLORS.cap, 0, 1.12, 0);
  add(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 14), COLORS.cap, 0, 1.06, 0.14).scale.set(1, 1, 0.75);
  add(new THREE.BoxGeometry(0.06, 0.05, 0.02), COLORS.trim, 0, 1.13, 0.205);
  // Satchel on the right hip with a letter peeking out, strap across the chest.
  add(new THREE.BoxGeometry(0.1, 0.24, 0.3), COLORS.bag, 0.27, 0.5, 0.02);
  add(new THREE.BoxGeometry(0.02, 0.12, 0.18), COLORS.letter, 0.3, 0.66, 0.02);
  add(new THREE.BoxGeometry(0.05, 0.6, 0.05), COLORS.strap, 0.02, 0.66, 0.17).rotation.z = -0.65;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 20),
    new THREE.MeshBasicMaterial({ color: 0x1d2a2a, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  shadow.renderOrder = 2;
  root.add(shadow);

  body.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  root.scale.setScalar(scale);

  let phase = 0;
  /** Walk cycle: `speed` in units/s, 0 when standing. */
  function animate(dt, speed) {
    const moving = speed > 0.05;
    phase = moving ? phase + dt * (6 + speed * 1.1) : phase * Math.pow(0.001, dt);
    const swing = moving ? Math.sin(phase) * 0.6 : Math.sin(phase) * 0.6 * 0.4;
    legs[0].rotation.x = swing; legs[1].rotation.x = -swing;
    arms[0].rotation.x = -swing * 0.8; arms[1].rotation.x = swing * 0.5;
    body.position.y = moving ? Math.abs(Math.sin(phase)) * 0.05 : 0;
  }

  return { root, animate };
}
