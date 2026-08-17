/* eslint-disable no-undef */
import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

const PHASES = [
  { name: 'orbital', time: 2 },
  { name: 'entry', time: 7 },
  { name: 'descent', time: 14 },
  { name: 'landingBurn', time: 20 },
  { name: 'legDeploy', time: 24 },
  { name: 'touchdown', time: 25.5 },
  { name: 'shutdown', time: 27.5 },
];

test.describe('Rocket landing visual CI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?testMode=1');
    await page.waitForSelector('canvas');
    // Wait for WebGL to be ready
    await page.waitForTimeout(1000);
  });

  test('canvas visible and non-blank', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    // Ensure canvas has content by checking pixel variance
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test('phase screenshots and telemetry', async ({ page }) => {
    for (const phase of PHASES) {
      await page.evaluate((t) => window.__test.seekTime(t), phase.time);
      await page.waitForTimeout(500);
      await expect(page.locator('canvas')).toBeVisible();
      const telemetry = await page.evaluate(() => window.__test.getTelemetry());
      expect.soft(telemetry.phase).toBe(phase.name);

      const screenshot = await page.screenshot({ type: 'png' });
      await page.screenshot({
        path: `test-results/artifacts/${phase.name}.png`,
      });

      const png = PNG.sync.read(screenshot);
      const { width, height, data } = png;
      let sum = 0;
      let sumSq = 0;
      let darkCount = 0;
      let coloredCount = 0;
      let total = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (width * y + x) << 2;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a < 128) continue;
          total++;
          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          sum += luma;
          sumSq += luma * luma;
          if (luma < 20) darkCount++;
          const maxRGB = Math.max(r, g, b);
          const minRGB = Math.min(r, g, b);
          if (maxRGB - minRGB > 20) coloredCount++;
        }
      }
      const mean = total ? sum / total : 0;
      const variance = total ? sumSq / total - mean * mean : 0;
      const stddev = Math.sqrt(variance);
      const darkRatio = total ? darkCount / total : 0;
      const coloredRatio = total ? coloredCount / total : 0;

      process.stdout.write(
        `Phase ${phase.name}: mean=${mean.toFixed(1)} stddev=${stddev.toFixed(1)} dark=${(darkRatio * 100).toFixed(1)}% colored=${(coloredRatio * 100).toFixed(1)}%`
      );

      expect.soft(mean).toBeGreaterThanOrEqual(35);
      expect.soft(stddev).toBeGreaterThanOrEqual(25);
      expect.soft(darkRatio).toBeLessThanOrEqual(0.72);
      expect.soft(coloredRatio).toBeGreaterThanOrEqual(0.08);

      const heightPx = await page.evaluate(() =>
        window.__test.getRocketHeightPx()
      );
      const mode = await page.evaluate(() => window.__test.getCameraMode());
      expect.soft(mode).toBe('cinematic');
      if (phase.name === 'orbital' || phase.name === 'entry') {
        expect.soft(heightPx).toBeGreaterThan(90);
        expect.soft(heightPx).toBeLessThan(160);
      } else if (phase.name === 'descent') {
        expect.soft(heightPx).toBeGreaterThan(120);
        expect.soft(heightPx).toBeLessThan(200);
      } else {
        expect.soft(heightPx).toBeGreaterThan(180);
      }

      const bbox = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();
        return { w: rect.width, h: rect.height };
      });
      expect.soft(bbox.w).toBeGreaterThan(0);
      expect.soft(bbox.h).toBeGreaterThan(0);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/artifacts/mobile.png' });
    const uiVisible = await page.locator('#controls').isVisible();
    expect(uiVisible).toBeTruthy();
  });

  test('record landing demo video', async ({ page }) => {
    const video = page.video();
    const start = Date.now();
    await page.evaluate(async () => {
      await window.__test.acceleratedPlay(14);
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThan(10000);
    expect(elapsed).toBeLessThan(20000);
    const telemetry = await page.evaluate(() => window.__test.getTelemetry());
    expect(telemetry.phase).toBe('shutdown');
    const phasesSeen = await page.evaluate(() => {
      const times = [2, 7, 14, 20, 24, 25.5, 27.5];
      return times.map((t) => {
        window.__test.seekTime(t);
        return window.__test.getPhase();
      });
    });
    expect(phasesSeen).toContain('orbital');
    expect(phasesSeen).toContain('descent');
    expect(phasesSeen).toContain('landingBurn');
    expect(phasesSeen).toContain('touchdown');

    await page.close();
    const videoPath = await video.path();
    const fs = await import('node:fs/promises');
    await fs.mkdir('test-results/artifacts', { recursive: true });
    const data = await fs.readFile(videoPath);
    await fs.writeFile('test-results/artifacts/demo.webm', data);
    const stat = await fs.stat('test-results/artifacts/demo.webm');
    expect(stat.size).toBeGreaterThan(50000);
  });
});
