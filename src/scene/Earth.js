import * as THREE from 'three';

export class Earth {
  constructor(scene) {
    const earthGeo = new THREE.SphereGeometry(60, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x2244aa,
      roughness: 0.8,
      metalness: 0.1,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.y = -60;
    scene.add(earth);

    const atmGeo = new THREE.SphereGeometry(62, 64, 64);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.15,
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    atmosphere.position.y = -60;
    scene.add(atmosphere);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 1, 32),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    pad.position.set(0, -59, 0);
    scene.add(pad);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -60;
    scene.add(ground);
  }
}
