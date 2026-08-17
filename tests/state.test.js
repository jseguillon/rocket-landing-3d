import { describe, it, expect } from 'vitest';
import { AnimationStateMachine } from '../src/core/AnimationStateMachine.js';

describe('AnimationStateMachine', () => {
  it('phase progression deterministic', () => {
    const sm = new AnimationStateMachine();
    expect(sm.getPhase()).toBe('orbital');
    sm.advance(4);
    expect(sm.getPhase()).toBe('entry');
    sm.advance(6);
    expect(sm.getPhase()).toBe('descent');
  });

  it('altitude decreases monotonically', () => {
    const sm = new AnimationStateMachine();
    const a1 = sm.getAltitude();
    sm.advance(10);
    const a2 = sm.getAltitude();
    expect(a2).toBeLessThan(a1);
  });

  it('terminal touchdown holds', () => {
    const sm = new AnimationStateMachine();
    sm.setTime(sm.total);
    expect(sm.getPhase()).toBe('shutdown');
    expect(sm.getAltitude()).toBeCloseTo(2, 1);
    sm.advance(10);
    expect(sm.getAltitude()).toBeCloseTo(2, 1);
  });

  it('fuel bounds 0-100', () => {
    const sm = new AnimationStateMachine();
    sm.advance(30);
    const fuel = sm.getFuel();
    expect(fuel).toBeGreaterThanOrEqual(0);
    expect(fuel).toBeLessThanOrEqual(100);
  });

  it('reset works', () => {
    const sm = new AnimationStateMachine();
    sm.advance(10);
    sm.reset();
    expect(sm.time).toBe(0);
    expect(sm.getPhase()).toBe('orbital');
  });

  it('setTime after end resumes correctly', () => {
    const sm = new AnimationStateMachine();
    sm.setTime(sm.total);
    expect(sm.ended).toBe(true);
    sm.setTime(sm.total / 2);
    expect(sm.ended).toBe(false);
    expect(sm.getPhase()).toBe('descent');
  });

  it('pause resume works', () => {
    const sm = new AnimationStateMachine();
    sm.pause();
    sm.advance(5);
    expect(sm.time).toBe(0);
    sm.resume();
    sm.advance(5);
    expect(sm.time).toBe(5);
  });

  it('exact phase boundaries', () => {
    const sm = new AnimationStateMachine();
    sm.setTime(4);
    expect(sm.getPhase()).toBe('entry');
    sm.setTime(10);
    expect(sm.getPhase()).toBe('descent');
  });

  it('monotonic altitude across timeline', () => {
    const sm = new AnimationStateMachine();
    let prev = sm.getAltitude();
    for (let t = 0; t <= sm.total; t += 0.5) {
      sm.setTime(t);
      const alt = sm.getAltitude();
      expect(alt).toBeLessThanOrEqual(prev + 0.001);
      prev = alt;
    }
  });

  it('fuel endpoints', () => {
    const sm = new AnimationStateMachine();
    expect(sm.getFuel()).toBe(100);
    sm.setTime(sm.total);
    expect(sm.getFuel()).toBeCloseTo(0, 1);
  });
});
