import * as THREE from 'three';

export class Rocket {
  constructor(scene) {
    this.group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.7,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2, 12, 16),
      bodyMat
    );
    body.castShadow = true;
    this.group.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 16), bodyMat);
    nose.position.y = 7.5;
    this.group.add(nose);

    this.legs = [];
    const legMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const legGeo = new THREE.BoxGeometry(0.3, 4, 0.3);
    for (let i = -1; i <= 1; i += 2) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(i * 1.8, -6, 0);
      this.group.add(leg);
      this.legs.push(leg);
    }
    this.legDeployed = false;

    const particleCount = 20;
    this.exhaustPositions = new Float32Array(particleCount * 3);
    const exhaustGeo = new THREE.BufferGeometry();
    exhaustGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.exhaustPositions, 3)
    );
    const exhaustMat = new THREE.PointsMaterial({
      size: 0.2,
      color: 0xffaa33,
      transparent: true,
      opacity: 0.8,
    });
    this.exhaust = new THREE.Points(exhaustGeo, exhaustMat);
    this.group.add(this.exhaust);

    scene.add(this.group);
    this.exhaust.visible = false;
  }

  update(altitude, phase, progress, time) {
    this.group.position.y = altitude;

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
