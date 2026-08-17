import * as THREE from 'three';

export class Earth {
  constructor(scene) {
    this.orbitalGroup = new THREE.Group();
    this.localGroup = new THREE.Group();
    scene.add(this.orbitalGroup, this.localGroup);

    // Orbital Earth
    const earthGeo = new THREE.SphereGeometry(90, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.7,
      metalness: 0.0,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.y = -60;
    this.orbitalGroup.add(earth);

    // Continents patches
    const continentColors = [0x2a6aa8, 0x306b9a, 0x2f5f8c, 0x25618f];
    for (let i = 0; i < 8; i++) {
      const patch = new THREE.Mesh(
        new THREE.SphereGeometry(3 + Math.random() * 2, 16, 16),
        new THREE.MeshStandardMaterial({
          color: continentColors[i % continentColors.length],
          roughness: 0.8,
        })
      );
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * 2 * Math.PI;
      const r = 90;
      patch.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        -60 + r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      this.orbitalGroup.add(patch);
    }

    // Clouds
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xe8f6ff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(93, 64, 64),
      cloudMat
    );
    cloud.position.y = -60;
    this.orbitalGroup.add(cloud);

    const atmGeo = new THREE.SphereGeometry(92, 64, 64);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    atmosphere.position.y = -60;
    this.orbitalGroup.add(atmosphere);

    // Local terrain
    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 800),
      new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 })
    );
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -60;
    this.localGroup.add(terrain);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 1.2, 32),
      new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.6,
        roughness: 0.3,
      })
    );
    pad.position.set(0, -58.8, 0);
    this.localGroup.add(pad);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(7, 8.5, 64),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.4,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -58.8;
    this.localGroup.add(ring);

    // Center marking
    const mark = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(0, -58.8, 0);
    this.localGroup.add(mark);

    for (let i = 0; i < 6; i++) {
      const light = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0xffe080 })
      );
      const angle = (i / 6) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 7.5, -58.65, Math.sin(angle) * 7.5);
      this.localGroup.add(light);
    }

    // Low structures
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    building.position.set(15, -59, 10);
    this.localGroup.add(building);
  }

  update(phase) {
    const orbitalPhases = ['orbital', 'entry'];
    const isOrbital = orbitalPhases.includes(phase);
    this.orbitalGroup.visible = isOrbital;
    this.localGroup.visible = !isOrbital;
    if (isOrbital) {
      this.orbitalGroup.position.set(0, 0, 80);
    } else {
      this.orbitalGroup.position.set(0, 0, 0);
    }
  }
}
