export class Telemetry {
  constructor() {
    this.altitude = 0;
    this.vSpeed = 0;
    this.fuel = 100;
    this.phase = 'idle';
  }

  update(rocket, phase) {
    this.phase = phase;
    this.altitude = Math.max(0, rocket.position.y);
    this.vSpeed = rocket.position.y > 0 ? -20 : 0;
    this.fuel = Math.max(0, 100 - this.altitude / 5);
  }
}
