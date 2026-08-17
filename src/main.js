import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Rocket } from './rocket/Rocket.js';
import { Earth } from './scene/Earth.js';
import { AnimationStateMachine } from './core/AnimationStateMachine.js';
import { UI } from './ui/UI.js';

function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function createStars(scene) {
  const params = new URLSearchParams(location.search);
  const testMode = params.get('testMode') === '1';
  const rand = testMode ? seededRandom(42) : Math.random;
  const count = 2000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2000 * Math.cbrt(rand());
    const theta = rand() * 2 * Math.PI;
    const phi = Math.acos(2 * rand() - 1);
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
    if (!canvas) throw new Error('Canvas missing');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.exposure = 1.2;
    return renderer;
  } catch {
    document.body.innerHTML =
      '<div style="color:white;padding:2rem">WebGL not supported</div>';
    return null;
  }
}

const renderer = initWebGL();
if (!renderer) throw new Error('WebGL unavailable');

const params = new URLSearchParams(location.search);
const testMode = params.get('testMode') === '1';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.002);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 120, 300);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const hemiLight = new THREE.HemisphereLight(0xaaaaee, 0x222222, 0.6);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(100, 200, 100);
dirLight.castShadow = true;
scene.add(dirLight);
const engineLight = new THREE.PointLight(0xffaa66, 2, 30);
scene.add(engineLight);

const earth = new Earth(scene);
createStars(scene);

const rocket = new Rocket(scene);
const stateMachine = new AnimationStateMachine();
const ui = new UI(stateMachine, rocket);

if (testMode) {
  const snapRender = () => {
    renderer.render(scene, camera);
  };
  const updateAll = () => {
    const phase = stateMachine.getPhase();
    earth.update(phase);
    const mode = ui.getCameraMode();
    updateCamera(mode, phase, true);
    controls.update();
    snapRender();
  };
  window.__test = {
    seekTime: (t) => {
      stateMachine.setTime(t);
      updateAll();
    },
    acceleratedPlay: (realDurationSec = 14) => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        const start = stateMachine.time;
        const end = stateMachine.total;
        const holdMs = 800;
        const rawDurationSec = Number(realDurationSec);
        const durationMs = Math.max(
          0,
          (isFinite(rawDurationSec) ? rawDurationSec : 14) * 1000
        );
        const effectiveMs = Math.max(0, durationMs - holdMs);
        const animate = (now) => {
          const elapsed = now - startTime;
          let timelineProgress;
          if (effectiveMs > 0) {
            if (elapsed < effectiveMs) {
              timelineProgress = elapsed / effectiveMs;
            } else {
              timelineProgress = 1;
            }
          } else {
            timelineProgress = 1;
          }
          const t = start + timelineProgress * (end - start);
          stateMachine.setTime(t);
          updateAll();
          if (elapsed < durationMs) {
            requestAnimationFrame(animate);
          } else {
            stateMachine.setTime(end);
            updateAll();
            resolve();
          }
        };
        requestAnimationFrame(animate);
      });
    },
    getPhase: () => stateMachine.getPhase(),
    getTelemetry: () => ({
      altitude: stateMachine.getAltitude(),
      phase: stateMachine.getPhase(),
      time: stateMachine.time,
    }),
    getCameraMode: () => ui.getCameraMode(),
    getRocketHeightPx: () => {
      const top = new THREE.Vector3(0, 7, 0);
      const bottom = new THREE.Vector3(0, -7, 0);
      rocket.group.localToWorld(top);
      rocket.group.localToWorld(bottom);
      top.project(camera);
      bottom.project(camera);
      const height = (Math.abs(top.y - bottom.y) * window.innerHeight) / 2;
      return height;
    },
    getVisibility: () => ({
      orbitalVisible: earth.orbitalGroup.visible,
      localVisible: earth.localGroup.visible,
    }),
  };
  // default cinematic
  ui.cameraMode = 'cinematic';
  document.getElementById('camera-mode').value = 'cinematic';
}

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

const padTarget = new THREE.Vector3(0, 5, 15);
const cinematicPresets = {
  orbital: new THREE.Vector3(0, 30, 90),
  entry: new THREE.Vector3(0, 20, 75),
  descent: new THREE.Vector3(0, 18, 65),
  landingBurn: new THREE.Vector3(0, 12, 45),
  legDeploy: new THREE.Vector3(0, 8, 35),
  touchdown: new THREE.Vector3(0, 6, 30),
  shutdown: new THREE.Vector3(0, 6, 32),
};

function updateCamera(mode, phase, snap = false) {
  if (mode === 'orbit') {
    controls.enabled = true;
    return;
  }
  controls.enabled = false;
  const pos = rocket.position;
  if (mode === 'chase') {
    camera.position.set(pos.x, pos.y + 12, pos.z + 28);
    controls.target.copy(rocket.group.position);
    return;
  }
  if (mode === 'pad') {
    if (snap || reducedMotion) {
      camera.position.copy(padTarget);
    } else {
      camera.position.lerp(padTarget, 0.04);
    }
    controls.target.set(0, -60, 0);
    return;
  }
  // cinematic
  const offset = cinematicPresets[phase] || cinematicPresets.descent;
  const targetPos = new THREE.Vector3(
    pos.x + offset.x,
    pos.y + offset.y,
    pos.z + offset.z
  );
  if (snap || reducedMotion) {
    camera.position.copy(targetPos);
  } else {
    camera.position.lerp(targetPos, 0.06);
  }
  controls.target.copy(rocket.group.position);
}

function animate(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  const effectiveDt = reducedMotion ? dt : dt;
  if (!testMode && !ui.isPaused) stateMachine.advance(effectiveDt);

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
  earth.update(phase);

  const orbitalPhases = ['orbital', 'entry'];
  const isOrbital = orbitalPhases.includes(phase);
  scene.fog = isOrbital ? null : new THREE.FogExp2(0x000000, 0.003);
  engineLight.position.copy(rocket.group.position);
  engineLight.visible =
    phase === 'landingBurn' || phase === 'legDeploy' || phase === 'touchdown';

  const telemetry = {
    altitude,
    vSpeed: stateMachine.getVerticalSpeed(),
    fuel: stateMachine.getFuel(),
    phase,
    time: stateMachine.time,
    total: stateMachine.total,
  };
  ui.updateTelemetry(telemetry);

  updateCamera(ui.getCameraMode(), phase);

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
