import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Rocket } from './rocket/Rocket.js';
import { Earth } from './scene/Earth.js';
import { AnimationStateMachine } from './core/AnimationStateMachine.js';
import { UI } from './ui/UI.js';

function createStars(scene) {
  const count = 2000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2000 * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ size: 0.7, color: 0xffffff });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
}

function initWebGL() {
  try {
    const canvas = document.getElementById('c');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    return { renderer, ok: true };
  } catch {
    document.body.innerHTML =
      '<div style="color:white;padding:2rem">WebGL not supported</div>';
    return { renderer: null, ok: false };
  }
}

const { renderer, ok } = initWebGL();
if (!ok) {
  // graceful exit, no animation started
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 120, 300);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(100, 200, 100);
dirLight.castShadow = true;
scene.add(dirLight);

new Earth(scene);
createStars(scene);

const rocket = new Rocket(scene);
const stateMachine = new AnimationStateMachine();
const ui = new UI(stateMachine, rocket);

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
let last = performance.now();
let lastPixelRatio = renderer.getPixelRatio();

const cinematicTarget = new THREE.Vector3(0, 80, 250);
const padTarget = new THREE.Vector3(0, 5, 15);

function updateCamera(mode) {
  if (mode === 'orbit') {
    controls.enabled = true;
    return;
  }
  controls.enabled = false;
  if (mode === 'chase') {
    const pos = rocket.position;
    camera.position.set(pos.x, pos.y + 10, pos.z + 30);
    controls.target.copy(rocket.group.position);
  } else if (mode === 'pad') {
    if (!reducedMotion) {
      camera.position.lerp(padTarget, 0.05);
      controls.target.copy(new THREE.Vector3(0, 0, 0));
    }
  } else if (mode === 'cinematic') {
    if (!reducedMotion) {
      camera.position.lerp(cinematicTarget, 0.05);
      controls.target.set(0, 0, 0);
    }
  }
}

function animate(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  const effectiveDt = reducedMotion ? dt : dt;
  if (!ui.isPaused) stateMachine.advance(effectiveDt);

  const quality = ui.getQuality();
  const targetRatio =
    quality === 'high'
      ? Math.min(window.devicePixelRatio, 2)
      : quality === 'medium'
        ? Math.min(window.devicePixelRatio, 1.5)
        : 1;
  if (targetRatio !== lastPixelRatio) {
    renderer.setPixelRatio(targetRatio);
    lastPixelRatio = targetRatio;
  }

  const altitude = stateMachine.getAltitude();
  const phase = stateMachine.getPhase();
  const progress = stateMachine.getPhaseProgress();
  rocket.update(altitude, phase, progress, stateMachine.time);

  const telemetry = {
    altitude,
    vSpeed: stateMachine.getVerticalSpeed(),
    fuel: stateMachine.getFuel(),
    phase,
    time: stateMachine.time,
    total: stateMachine.total,
  };
  ui.updateTelemetry(telemetry);

  updateCamera(ui.getCameraMode());

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
