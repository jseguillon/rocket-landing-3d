export class UI {
  constructor(stateMachine, rocket) {
    this.stateMachine = stateMachine;
    this.rocket = rocket;
    this.paused = false;
    this.cameraMode = 'cinematic';
    this.quality = 'high';

    const playPause = document.getElementById('play-pause');
    playPause.addEventListener('click', () => {
      this.paused = !this.paused;
      if (this.paused) {
        stateMachine.pause();
        playPause.textContent = '▶';
        playPause.setAttribute('aria-label', 'Resume');
      } else {
        stateMachine.resume();
        playPause.textContent = '⏸';
        playPause.setAttribute('aria-label', 'Pause');
      }
    });

    document.getElementById('restart').addEventListener('click', () => {
      stateMachine.reset();
      this.updateScrubber(0);
    });

    document.getElementById('prev-phase').addEventListener('click', () => {
      const t = Math.max(0, stateMachine.time - 1);
      stateMachine.setTime(t);
    });
    document.getElementById('next-phase').addEventListener('click', () => {
      const t = Math.min(stateMachine.total, stateMachine.time + 1);
      stateMachine.setTime(t);
    });

    const scrubber = document.getElementById('scrubber');
    scrubber.addEventListener('input', (e) => {
      const v = Number(e.target.value) / 100;
      stateMachine.setTime(v * stateMachine.total);
    });

    document.getElementById('camera-mode').addEventListener('change', (e) => {
      this.cameraMode = e.target.value;
    });

    document.getElementById('quality').addEventListener('change', (e) => {
      this.quality = e.target.value;
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        playPause.click();
      }
      if (e.code === 'KeyR') stateMachine.reset();
    });
  }

  get isPaused() {
    return this.paused;
  }

  getCameraMode() {
    return this.cameraMode;
  }
  getQuality() {
    return this.quality;
  }

  updateTelemetry(t) {
    document.getElementById('telemetry-alt').textContent = Math.round(
      t.altitude
    );
    document.getElementById('telemetry-vs').textContent = Math.round(t.vSpeed);
    document.getElementById('telemetry-fuel').textContent = Math.round(t.fuel);
    document.getElementById('telemetry-phase').textContent = t.phase;
    const badge = document.getElementById('phase-badge');
    if (badge) badge.textContent = t.phase;
    const scrubber = document.getElementById('scrubber');
    const percent = (t.time / t.total) * 100;
    if (!scrubber.dragging) scrubber.value = percent;
  }

  updateScrubber(v) {
    const scrubber = document.getElementById('scrubber');
    scrubber.value = v;
  }
}
