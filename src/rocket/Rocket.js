import * as THREE from 'three';

export class Rocket {
  constructor(scene) {
    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      metalness: 0.8,
      roughness: 0.25,
    });
    const thermalMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.4,
      roughness: 0.6,
    });

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.8, 11, 32),
      bodyMat
    );
    body.castShadow = true;
    this.group.add(body);

    // panel seams
    for (let i = 0; i < 3; i++) {
      const seam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.41, 1.41, 0.03, 32),
        new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          metalness: 0.5,
          roughness: 0.3,
        })
      );
      seam.position.y = -4 + i * 3;
      this.group.add(seam);
    }

    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.45, 0.3, 32),
      thermalMat
    );
    band.position.y = 2;
    this.group.add(band);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 32), bodyMat);
    nose.position.y = 7.5;
    this.group.add(nose);

    const engine = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 1.2, 32),
      thermalMat
    );
    engine.position.y = -5.6;
    this.group.add(engine);

    const nozzles = [];
    for (let i = 0; i < 3; i++) {
      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0 + i * 0.1, 1.6, 0.6, 32),
        thermalMat
      );
      nozzle.position.y = -6.5;
      nozzle.rotation.z = (i / 3) * Math.PI * 2;
      this.group.add(nozzle);
      nozzles.push(nozzle);
    }

    const finGeo = new THREE.BoxGeometry(0.15, 2.2, 1.2);
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(finGeo, thermalMat);
      fin.position.set(0, -4.5, 0);
      fin.rotation.z = (i / 3) * Math.PI * 2;
      this.group.add(fin);
    }

    this.legs = [];
    const legMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.7,
      roughness: 0.4,
    });
    const legGeo = new THREE.BoxGeometry(0.28, 4, 0.28);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeo, legMat);
      const angle = (i / 4) * Math.PI * 2;
      leg.position.set(Math.cos(angle) * 1.9, -6, Math.sin(angle) * 1.9);
      this.group.add(leg);
      this.legs.push(leg);
    }
    this.legDeployed = false;

    // plume cone
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0xffd080,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.plume = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 4, 32, 1, true),
      plumeMat
    );
    this.plume.position.y = -9;
    this.plume.rotation.x = Math.PI;
    this.group.add(this.plume);
    this.plume.visible = false;

    const particleCount = 24;
    this.exhaustPositions = new Float32Array(particleCount * 3);
    const exhaustGeo = new THREE.BufferGeometry();
    exhaustGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.exhaustPositions, 3)
    );
    const exhaustMat = new THREE.PointsMaterial({
      size: 0.25,
      color: 0xffa733,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.exhaust = new THREE.Points(exhaustGeo, exhaustMat);
    this.group.add(this.exhaust);

    scene.add(this.group);
    this.exhaust.visible = false;
    this.plume.visible = false;
  }

  update(altitude, phase, progress, time) {
    this.group.position.y = altitude;

    const burnPhases = ['landingBurn', 'legDeploy', 'touchdown'];
    const plumeVisible = burnPhases.includes(phase);
    this.plume.visible = plumeVisible;
    if (plumeVisible) {
      this.plume.material.opacity = phase === 'touchdown' ? 0.35 : 0.6;
    }

    let exhaustVisible = false;
    let exhaustOpacity = 0.8;
    if (phase === 'landingBurn' || phase === 'legDeploy') {
      exhaustVisible = true;
    } else if (phase === 'touchdown') {
      exhaustVisible = true;
      exhaustOpacity = 0.4;
    }

    this.exhaust.visible = exhaustVisible;
    if (exhaustVisible) {
      const positions = this.exhaustPositions;
      const count = positions.length / 3;
      for (let i = 0; i < count; i++) {
        const x = Math.sin(time * 10 + i) * 0.5;
        const y = -Math.abs(Math.cos(time * 8 + i)) * 3;
        const z = Math.cos(time * 12 + i) * 0.5;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      this.exhaust.geometry.attributes.position.needsUpdate = true;
      this.exhaust.material.opacity = exhaustOpacity;
    }

    if (phase === 'legDeploy') {
      const deployProgress = progress;
      this.legs.forEach((leg) => {
        leg.rotation.z = deployProgress * 0.8;
      });
      if (progress >= 0.99) this.legDeployed = true;
    } else if (this.legDeployed) {
      this.legs.forEach((leg) => {
        leg.rotation.z = 0.8;
      });
    } else {
      this.legs.forEach((leg) => {
        leg.rotation.z = 0;
      });
    }
  }

  get position() {
    return this.group.position;
  }
}
