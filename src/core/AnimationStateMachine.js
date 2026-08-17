export const PHASES = [
  'orbital',
  'entry',
  'descent',
  'landingBurn',
  'legDeploy',
  'touchdown',
  'shutdown',
];

const DURATIONS = {
  orbital: 4,
  entry: 6,
  descent: 8,
  landingBurn: 5,
  legDeploy: 2,
  touchdown: 1,
  shutdown: 2,
};

const ALTITUDE_KEY = {
  orbital: 400,
  entryStart: 400,
  entryEnd: 200,
  descentStart: 200,
  descentEnd: 50,
  landingBurnStart: 50,
  landingBurnEnd: 5,
  legDeployStart: 5,
  legDeployEnd: 2,
  touchdown: 2,
  shutdown: 2,
};

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function smoothstep(a, b, t) {
  const e = easeInOut(t);
  return a + (b - a) * e;
}

export class AnimationStateMachine {
  constructor() {
    this.time = 0;
    this.total = Object.values(DURATIONS).reduce((a, b) => a + b, 0);
    this.paused = false;
    this.ended = false;
  }

  advance(dt) {
    if (this.paused || this.ended) return;
    this.time += dt;
    if (this.time >= this.total) {
      this.time = this.total;
      this.ended = true;
    }
  }

  setTime(t) {
    this.time = Math.max(0, Math.min(t, this.total));
    this.ended = this.time >= this.total;
  }

  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
  reset() {
    this.time = 0;
    this.ended = false;
    this.paused = false;
  }

  getPhase() {
    let acc = 0;
    for (const p of PHASES) {
      const d = DURATIONS[p];
      if (this.time < acc + d) return p;
      acc += d;
    }
    return PHASES[PHASES.length - 1];
  }

  getPhaseProgress() {
    let acc = 0;
    for (const p of PHASES) {
      const d = DURATIONS[p];
      if (this.time < acc + d) {
        return (this.time - acc) / d;
      }
      acc += d;
    }
    return 1;
  }

  getAltitude() {
    const phase = this.getPhase();
    const progress = this.getPhaseProgress();
    switch (phase) {
      case 'orbital':
        return ALTITUDE_KEY.orbital;
      case 'entry':
        return smoothstep(
          ALTITUDE_KEY.entryStart,
          ALTITUDE_KEY.entryEnd,
          progress
        );
      case 'descent':
        return smoothstep(
          ALTITUDE_KEY.descentStart,
          ALTITUDE_KEY.descentEnd,
          progress
        );
      case 'landingBurn':
        return smoothstep(
          ALTITUDE_KEY.landingBurnStart,
          ALTITUDE_KEY.landingBurnEnd,
          progress
        );
      case 'legDeploy':
        return smoothstep(
          ALTITUDE_KEY.legDeployStart,
          ALTITUDE_KEY.legDeployEnd,
          progress
        );
      case 'touchdown':
        return ALTITUDE_KEY.touchdown;
      case 'shutdown':
        return ALTITUDE_KEY.shutdown;
      default:
        return 0;
    }
  }

  getVerticalSpeed() {
    const phase = this.getPhase();
    switch (phase) {
      case 'orbital':
        return 0;
      case 'entry':
        return (
          -(ALTITUDE_KEY.entryStart - ALTITUDE_KEY.entryEnd) / DURATIONS.entry
        );
      case 'descent':
        return (
          -(ALTITUDE_KEY.descentStart - ALTITUDE_KEY.descentEnd) /
          DURATIONS.descent
        );
      case 'landingBurn':
        return (
          -(ALTITUDE_KEY.landingBurnStart - ALTITUDE_KEY.landingBurnEnd) /
          DURATIONS.landingBurn
        );
      case 'legDeploy':
        return (
          -(ALTITUDE_KEY.legDeployStart - ALTITUDE_KEY.legDeployEnd) /
          DURATIONS.legDeploy
        );
      case 'touchdown':
        return 0;
      case 'shutdown':
        return 0;
      default:
        return 0;
    }
  }

  getFuel() {
    const burnPhaseStart =
      DURATIONS.orbital + DURATIONS.entry + DURATIONS.descent;
    const burnTime = DURATIONS.landingBurn + DURATIONS.legDeploy;
    if (this.time < burnPhaseStart) return 100;
    const burnProgress = Math.min(1, (this.time - burnPhaseStart) / burnTime);
    return Math.max(0, 100 * (1 - burnProgress));
  }
}
