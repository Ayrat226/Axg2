// Animated menu background (aurora / constellation / grid). Paused when hidden and disabled by motion settings.
import { useEffect, useRef } from 'react';
import { useApp } from '../../state/store';
import { motionAllowed } from '../theme';

export function Background() {
  const ref = useRef<HTMLCanvasElement>(null);
  const a = useApp((s) => s.settings.appearance);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx || a.background === 'plain') { ctx?.clearRect(0, 0, canvas.width, canvas.height); return; }
    const animate = motionAllowed(a.motion);
    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7c5cff';
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.00012, vy: (Math.random() - 0.5) * 0.00012, r: Math.random() * 1.6 + 0.4 }));
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      if (a.background === 'aurora') {
        const blobs = [
          { c: accent, x: 0.15 + Math.sin(t / 9000) * 0.08, y: 0.1 + Math.cos(t / 11000) * 0.06, r: 0.55 },
          { c: '#22d3ee', x: 0.85 + Math.cos(t / 12000) * 0.07, y: 0.2 + Math.sin(t / 8000) * 0.05, r: 0.45 },
          { c: '#f472b6', x: 0.6 + Math.sin(t / 14000) * 0.1, y: 0.95, r: 0.5 },
        ];
        ctx.globalAlpha = 0.16;
        for (const b of blobs) {
          const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * Math.max(w, h));
          g.addColorStop(0, b.c); g.addColorStop(1, 'transparent');
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        }
        ctx.globalAlpha = 1;
      } else if (a.background === 'constellation') {
        ctx.fillStyle = accent; ctx.strokeStyle = accent;
        for (const s of stars) {
          if (animate) { s.x = (s.x + s.vx + 1) % 1; s.y = (s.y + s.vy + 1) % 1; }
        }
        for (let i = 0; i < stars.length; i++) {
          const p = stars[i];
          ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2); ctx.fill();
          for (let j = i + 1; j < stars.length; j++) {
            const q = stars[j]; const dx = (p.x - q.x) * w, dy = (p.y - q.y) * h; const d = Math.hypot(dx, dy);
            if (d < 130) { ctx.globalAlpha = 0.12 * (1 - d / 130); ctx.beginPath(); ctx.moveTo(p.x * w, p.y * h); ctx.lineTo(q.x * w, q.y * h); ctx.stroke(); }
          }
        }
        ctx.globalAlpha = 1;
      } else if (a.background === 'grid') {
        const off = animate ? (t / 80) % 40 : 0;
        ctx.strokeStyle = accent; ctx.globalAlpha = 0.07;
        for (let x = -40 + off; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = -40 + off; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        const g = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, 0, h);
        g.addColorStop(0, accent); g.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.12; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
      }
      if (animate && !document.hidden) raf = requestAnimationFrame(draw);
    };
    const onVis = () => { if (!document.hidden && animate) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } };
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); };
  }, [a.background, a.motion, a.accent, a.theme]);
  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" style={{ width: '100%', height: '100%' }} />;
}
