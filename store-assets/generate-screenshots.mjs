import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

// Screenshot 1: Main habits view
const page1 = await browser.newPage();
await page1.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page1.setContent(`
<html><body style="margin:0;padding:0;background:#0a0a0a">
<div style="background:#0a0a0a;min-height:100vh;color:white;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:16px;max-width:375px;margin:0 auto">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <div>
      <h1 style="font-size:28px;font-weight:bold;margin:0;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-style:italic">SOSE</h1>
      <div style="font-size:10px;letter-spacing:3px;color:#888;margin-top:2px">SUM OF SMALL EFFORTS</div>
    </div>
    <span style="background:linear-gradient(135deg,#a855f7,#ec4899);color:white;font-size:11px;padding:4px 10px;border-radius:12px">Premium Trial: 5 days left</span>
  </div>
  ${[
    { name: 'Morning Run', freq: 'Every day', streak: '12 days', done: true },
    { name: 'Read 30 mins', freq: 'Every day', streak: '8 days', done: true },
    { name: 'Meditate', freq: '5x per week', streak: '21 days', done: false },
    { name: 'Drink 2L Water', freq: 'Every day', streak: '5 days', done: true },
    { name: 'No Sugar', freq: 'Every day', streak: 'snoozed', snoozed: true },
    { name: 'Gym Session', freq: 'Mon, Wed, Fri', streak: '3 weeks', done: false },
  ].map(h => `
    <div style="background:#1a1a2e;border-radius:16px;padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:17px;font-weight:600">${h.name}</div>
          <div style="font-size:12px;color:#888;margin-top:2px">${h.freq}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:13px;color:${h.snoozed ? '#f59e0b' : '#a855f7'}">${h.snoozed ? '💤' : '🔥'} ${h.streak}</span>
          <div style="width:40px;height:40px;border-radius:50%;background:${h.done ? '#22c55e' : h.snoozed ? '#f59e0b' : 'transparent'};border:${!h.done && !h.snoozed ? '2px solid #333' : 'none'};display:flex;align-items:center;justify-content:center;font-size:${h.snoozed ? '18px' : '20px'}">${h.done ? '✓' : h.snoozed ? '😴' : '○'}</div>
        </div>
      </div>
    </div>
  `).join('')}
</div>
</body></html>`);
await page1.screenshot({ path: 'store-assets/screenshot-1-habits.png' });

// Screenshot 2: Onboarding
const page2 = await browser.newPage();
await page2.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page2.setContent(`
<html><body style="margin:0;padding:0;background:#0a0a0a">
<div style="background:#0a0a0a;min-height:100vh;color:white;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px;max-width:375px;margin:0 auto;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box">
  <div style="text-align:center;margin-bottom:40px">
    <h1 style="font-size:36px;font-weight:bold;margin:0;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Welcome to SOSE</h1>
    <p style="color:#888;margin-top:8px;font-size:14px">Sum Of Small Efforts</p>
  </div>
  <div style="display:flex;flex-direction:column;gap:24px;margin-bottom:40px">
    ${[
      { icon: '✅', title: 'Track Daily Habits', desc: 'Build streaks and stay consistent with daily, weekly, or custom schedules' },
      { icon: '📦', title: 'Blocks', desc: 'Organise habits into focused periods like a 30-day challenge or training phase' },
      { icon: '😴', title: 'Smart Snooze', desc: 'Skip a day without breaking your streak — perfect for rest days' },
      { icon: '📊', title: 'Stats & History', desc: 'View your progress with detailed streaks and 14-day retroactive logging' },
    ].map(f => `
      <div style="display:flex;gap:16px;align-items:flex-start">
        <div style="font-size:28px;min-width:40px;text-align:center">${f.icon}</div>
        <div>
          <div style="font-weight:600;font-size:16px;margin-bottom:4px">${f.title}</div>
          <div style="color:#888;font-size:13px;line-height:1.4">${f.desc}</div>
        </div>
      </div>
    `).join('')}
  </div>
  <button style="width:100%;padding:16px;border-radius:12px;border:none;background:linear-gradient(135deg,#a855f7,#ec4899);color:white;font-size:16px;font-weight:600">Get Started</button>
  <p style="text-align:center;color:#666;font-size:12px;margin-top:12px">7 days free premium trial included</p>
</div>
</body></html>`);
await page2.screenshot({ path: 'store-assets/screenshot-2-onboarding.png' });

// Screenshot 3: Stats page
const page3 = await browser.newPage();
await page3.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page3.setContent(`
<html><body style="margin:0;padding:0;background:#0a0a0a">
<div style="background:#0a0a0a;min-height:100vh;color:white;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:16px;max-width:375px;margin:0 auto">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
    <h2 style="font-size:22px;font-weight:bold;margin:0;color:white">Your Stats</h2>
    <span style="color:#888;font-size:13px">Last 30 days</span>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
    <div style="background:#1a1a2e;border-radius:16px;padding:20px;text-align:center">
      <div style="font-size:36px;font-weight:bold;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">87%</div>
      <div style="color:#888;font-size:12px;margin-top:4px">Completion Rate</div>
    </div>
    <div style="background:#1a1a2e;border-radius:16px;padding:20px;text-align:center">
      <div style="font-size:36px;font-weight:bold;color:#f59e0b">21</div>
      <div style="color:#888;font-size:12px;margin-top:4px">Best Streak</div>
    </div>
    <div style="background:#1a1a2e;border-radius:16px;padding:20px;text-align:center">
      <div style="font-size:36px;font-weight:bold;color:#22c55e">142</div>
      <div style="color:#888;font-size:12px;margin-top:4px">Total Check-ins</div>
    </div>
    <div style="background:#1a1a2e;border-radius:16px;padding:20px;text-align:center">
      <div style="font-size:36px;font-weight:bold;color:#a855f7">6</div>
      <div style="color:#888;font-size:12px;margin-top:4px">Active Habits</div>
    </div>
  </div>

  <div style="background:#1a1a2e;border-radius:16px;padding:16px;margin-bottom:12px">
    <div style="font-size:14px;font-weight:600;margin-bottom:12px">Habit Performance</div>
    ${[
      { name: 'Meditate', pct: 95, color: '#22c55e' },
      { name: 'Morning Run', pct: 88, color: '#a855f7' },
      { name: 'Read 30 mins', pct: 82, color: '#a855f7' },
      { name: 'Drink 2L Water', pct: 76, color: '#f59e0b' },
      { name: 'No Sugar', pct: 70, color: '#f59e0b' },
      { name: 'Gym Session', pct: 100, color: '#22c55e' },
    ].map(h => `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
          <span>${h.name}</span>
          <span style="color:${h.color}">${h.pct}%</span>
        </div>
        <div style="background:#0a0a0a;border-radius:8px;height:8px;overflow:hidden">
          <div style="background:${h.color};height:100%;width:${h.pct}%;border-radius:8px"></div>
        </div>
      </div>
    `).join('')}
  </div>

  <div style="background:#1a1a2e;border-radius:16px;padding:16px">
    <div style="font-size:14px;font-weight:600;margin-bottom:12px">Weekly Activity</div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;height:100px">
      ${['M','T','W','T','F','S','S'].map((d, i) => {
        const heights = [85, 70, 95, 60, 90, 45, 30];
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="width:28px;background:linear-gradient(to top,#a855f7,#ec4899);border-radius:6px;height:${heights[i]}px"></div>
          <span style="font-size:11px;color:#888">${d}</span>
        </div>`;
      }).join('')}
    </div>
  </div>
</div>
</body></html>`);
await page3.screenshot({ path: 'store-assets/screenshot-3-stats.png' });

// Screenshot 4: Blocks view
const page4 = await browser.newPage();
await page4.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page4.setContent(`
<html><body style="margin:0;padding:0;background:#0a0a0a">
<div style="background:#0a0a0a;min-height:100vh;color:white;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:16px;max-width:375px;margin:0 auto">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <div>
      <h1 style="font-size:28px;font-weight:bold;margin:0;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-style:italic">SOSE</h1>
      <div style="font-size:10px;letter-spacing:3px;color:#888;margin-top:2px">SUM OF SMALL EFFORTS</div>
    </div>
  </div>

  <!-- Active Block -->
  <div style="background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(236,72,153,0.1));border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div>
        <div style="font-size:18px;font-weight:700">30-Day Fitness Challenge</div>
        <div style="font-size:12px;color:#a855f7;margin-top:2px">Day 18 of 30 • 60% complete</div>
      </div>
      <span style="background:#a855f7;color:white;font-size:10px;padding:3px 8px;border-radius:8px;font-weight:600">ACTIVE</span>
    </div>
    <div style="background:rgba(0,0,0,0.3);border-radius:8px;height:6px;overflow:hidden;margin-bottom:14px">
      <div style="background:linear-gradient(90deg,#a855f7,#ec4899);height:100%;width:60%;border-radius:8px"></div>
    </div>
    ${[
      { name: 'Morning Run', streak: '12 days', done: true },
      { name: 'Gym Session', streak: '3 weeks', done: true },
      { name: 'No Sugar', streak: '18 days', done: false },
    ].map(h => `
      <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:15px;font-weight:500">${h.name}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:#a855f7">🔥 ${h.streak}</span>
          <div style="width:32px;height:32px;border-radius:50%;background:${h.done ? '#22c55e' : 'transparent'};border:${h.done ? 'none' : '2px solid #333'};display:flex;align-items:center;justify-content:center;font-size:16px">${h.done ? '✓' : '○'}</div>
        </div>
      </div>
    `).join('')}
  </div>

  <!-- Completed Block -->
  <div style="background:#1a1a2e;border-radius:16px;padding:16px;margin-bottom:16px;opacity:0.7">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div>
        <div style="font-size:18px;font-weight:700">Morning Routine</div>
        <div style="font-size:12px;color:#22c55e;margin-top:2px">Completed • 28 of 30 days</div>
      </div>
      <span style="background:#22c55e;color:white;font-size:10px;padding:3px 8px;border-radius:8px;font-weight:600">DONE</span>
    </div>
    <div style="background:rgba(0,0,0,0.3);border-radius:8px;height:6px;overflow:hidden">
      <div style="background:#22c55e;height:100%;width:93%;border-radius:8px"></div>
    </div>
  </div>

  <!-- New Block Button -->
  <div style="border:2px dashed #333;border-radius:16px;padding:24px;text-align:center;margin-bottom:16px">
    <div style="font-size:28px;margin-bottom:8px">+</div>
    <div style="color:#888;font-size:14px">Start a New Block</div>
    <div style="color:#555;font-size:12px;margin-top:4px">Set a focused period to track specific goals</div>
  </div>
</div>
</body></html>`);
await page4.screenshot({ path: 'store-assets/screenshot-4-blocks.png' });

// Feature graphic (1024x500)
const page5 = await browser.newPage();
await page5.setViewport({ width: 1024, height: 500, deviceScaleFactor: 2 });
await page5.setContent(`
<html><body style="margin:0;padding:0;overflow:hidden">
<div style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 50%,#0a0a0a 100%);width:1024px;height:500px;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;position:relative;overflow:hidden">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 30% 50%,rgba(168,85,247,0.15) 0%,transparent 60%),radial-gradient(ellipse at 70% 50%,rgba(236,72,153,0.1) 0%,transparent 60%)"></div>
  <div style="text-align:center;z-index:1">
    <h1 style="font-size:64px;font-weight:bold;margin:0;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-style:italic">SOSE</h1>
    <p style="color:#888;font-size:16px;letter-spacing:6px;margin-top:8px">SUM OF SMALL EFFORTS</p>
    <p style="color:white;font-size:22px;margin-top:20px;font-weight:300">Build better habits. Track your streaks.</p>
    <div style="display:flex;gap:24px;justify-content:center;margin-top:28px">
      <div style="display:flex;align-items:center;gap:8px;color:#a855f7;font-size:15px">🔥 Streaks</div>
      <div style="display:flex;align-items:center;gap:8px;color:#ec4899;font-size:15px">📦 Blocks</div>
      <div style="display:flex;align-items:center;gap:8px;color:#f59e0b;font-size:15px">😴 Smart Snooze</div>
      <div style="display:flex;align-items:center;gap:8px;color:#22c55e;font-size:15px">📊 Stats</div>
    </div>
  </div>
</div>
</body></html>`);
await page5.screenshot({ path: 'store-assets/feature-graphic-1024x500.png' });

await browser.close();
console.log('All screenshots saved to store-assets/');
