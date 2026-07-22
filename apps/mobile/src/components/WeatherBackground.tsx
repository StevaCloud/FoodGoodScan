import React, { useEffect, useRef, memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { useStore } from '../store/useStore';

const { width: W, height: NATIVE_H } = Dimensions.get('window');
export const WEATHER_HEADER_H = 900;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Drop  { x: number; y: number; speed: number; length: number; opacity: number; }
interface Flake { x: number; y: number; vx: number; vy: number; size: number; opacity: number; rotation: number; rotSpeed: number; }
interface Cloud { x: number; y: number; w: number; h: number; speed: number; opacity: number; }

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const rand  = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max));

// ─── Détection heure ─────────────────────────────────────────────────────────
function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 21 || hour < 6;
}

function isSunsetTime(): boolean {
  const d = new Date();
  const total = d.getHours() * 60 + d.getMinutes();
  return total >= 18 * 60 + 30 && total < 21 * 60;
}

// ─── Thème par code météo ─────────────────────────────────────────────────────
function getTheme(code: number) {
  if (code <= 3 && isSunsetTime()) return { bg: ['#0a0a2e', '#6b1f5a', '#f39c12'], accent: '#f39c12', type: 'sunset' };
  if (code === 0)        return { bg: ['#3b95ed', '#3b95ed', '#3b95ed'], accent: '#fbbf24', type: 'sun'     };
  if (code <= 3)         return { bg: ['#3b95ed', '#3b95ed', '#3b95ed'], accent: '#fbbf24', type: 'partly'  };
  if (code <= 49)        return { bg: ['#111520', '#1a1f2e', '#111520'], accent: '#94a3b8', type: 'fog'   };
  if (code <= 69)        return { bg: ['#060d1c', '#0d1a30', '#060d1c'], accent: '#60a5fa', type: 'rain'  };
  if (code <= 79)        return { bg: ['#080f1e', '#101929', '#080f1e'], accent: '#dde6f0', type: 'snow'  };
  return                        { bg: ['#04060f', '#080d1f', '#04060f'], accent: '#818cf8', type: 'storm' };
}

// ─── Initialiseurs de particules ──────────────────────────────────────────────
function makeDrops(n: number, w: number, h: number, heavy: boolean): Drop[] {
  return Array.from({ length: n }, () => ({
    x: rand(0, w),
    y: rand(-h, h),
    speed: heavy ? rand(18, 28) : rand(7, 14),
    length: heavy ? rand(28, 45) : rand(12, 22),
    opacity: rand(0.3, heavy ? 0.75 : 0.45),
  }));
}

function makeFlakes(n: number, w: number, h: number): Flake[] {
  const heavy = n > 50;
  return Array.from({ length: n }, () => ({
    x: rand(0, w),
    y: rand(-h, h),
    vx: rand(heavy ? -0.8 : -0.4, heavy ? 0.8 : 0.4),
    vy: rand(heavy ? 1.2 : 0.5, heavy ? 3.0 : 1.8),
    size: rand(heavy ? 2.5 : 1.5, heavy ? 6.0 : 4.5),
    opacity: rand(0.5, heavy ? 0.95 : 0.85),
    rotation: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.02, 0.02),
  }));
}

function makeClouds(n: number, w: number, h: number): Cloud[] {
  return Array.from({ length: n }, (_, i) => ({
    x: rand(-200, w + 200),
    y: rand(h * 0.02, h * 0.12),
    w: rand(120, 280),
    h: rand(50, 110),
    speed: rand(0.15, 0.55),
    opacity: rand(0.08, 0.18),
  }));
}

// ─── Fonctions de dessin ──────────────────────────────────────────────────────
function drawRain(ctx: CanvasRenderingContext2D, drops: Drop[], w: number, h: number, heavy: boolean) {
  const windX = heavy ? -3 : -1.5;
  drops.forEach(d => {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + windX * (d.length / 15), d.y + d.length);
    ctx.strokeStyle = `rgba(147,197,253,${d.opacity})`;
    ctx.lineWidth = heavy ? 1.8 : 1.2;
    ctx.stroke();
    d.y += d.speed;
    d.x += windX;
    if (d.y > h + 30) { d.y = -d.length; d.x = rand(0, w); }
    if (d.x < -20)    { d.x = w + rand(0, 50); }
  });
}

function drawSnow(ctx: CanvasRenderingContext2D, flakes: Flake[], w: number, h: number, t: number) {
  flakes.forEach(f => {
    f.x  += f.vx + Math.sin(t * 0.001 + f.y * 0.01) * 0.3;
    f.y  += f.vy;
    f.rotation += f.rotSpeed;
    if (f.y > h + 10) { f.y = -10; f.x = rand(0, w); }
    if (f.x < -10)    f.x = w + 5;
    if (f.x > w + 10) f.x = -5;

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);
    ctx.globalAlpha = f.opacity;

    // Flocon cristallin : 6 bras
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -f.size * 3);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Petites branches
      ctx.beginPath();
      ctx.moveTo(0, -f.size * 1.5);
      ctx.lineTo(f.size * 0.8, -f.size * 2.3);
      ctx.moveTo(0, -f.size * 1.5);
      ctx.lineTo(-f.size * 0.8, -f.size * 2.3);
      ctx.strokeStyle = 'rgba(226,232,240,0.6)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.restore();
    }
    // Centre
    ctx.beginPath();
    ctx.arc(0, 0, f.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  });
}

function drawMoon(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w * 0.78;
  const cy = h * 0.32;
  const r = 30;

  // Halo lunaire
  const pulse = 1 + Math.sin(t * 0.0015) * 0.06;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 3 * pulse);
  halo.addColorStop(0, 'rgba(200,220,255,0.12)');
  halo.addColorStop(1, 'rgba(200,220,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 3 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  // Disque lunaire
  const moonGrad = ctx.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, r);
  moonGrad.addColorStop(0, '#f0f0e8');
  moonGrad.addColorStop(0.5, '#e0ddd0');
  moonGrad.addColorStop(1, '#c8c4b8');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = moonGrad;
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(200,220,255,0.5)';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ombre croissant (phase)
  ctx.beginPath();
  ctx.arc(cx + 10, cy - 4, r * 0.85, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,15,30,0.7)';
  ctx.fill();

  // Cratères subtils
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.arc(cx - 8, cy - 6, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 14, cy + 8, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 4, cy + 12, 4, 0, Math.PI * 2); ctx.fill();

  // Étoiles
  const stars = [
    [0.08, 0.15], [0.2, 0.08], [0.35, 0.22], [0.5, 0.1], [0.62, 0.28],
    [0.15, 0.55], [0.4, 0.5], [0.55, 0.45], [0.88, 0.18], [0.92, 0.5],
    [0.25, 0.38], [0.7, 0.12], [0.05, 0.4], [0.45, 0.65], [0.72, 0.55],
  ];
  stars.forEach(([sx, sy], i) => {
    const twinkle = (Math.sin(t * 0.003 + i * 1.7) + 1) / 2;
    const size = 1.2 + twinkle * 1.5;
    ctx.globalAlpha = 0.4 + twinkle * 0.5;
    ctx.fillStyle = '#fff';
    // Croix étoile
    ctx.fillRect(sx * w - size / 2, sy * h - 0.4, size, 0.8);
    ctx.fillRect(sx * w - 0.4, sy * h - size / 2, 0.8, size);
    // Point central
    ctx.beginPath();
    ctx.arc(sx * w, sy * h, 0.8 + twinkle * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawSunClouds(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Nuages en haut de l'écran uniquement (ne pas gêner le contenu)
  const cloudData = [
    { x: w * 0.10, y: h * 0.04, s: 1.2 },
    { x: w * 0.45, y: h * 0.08, s: 1.5 },
    { x: w * 0.75, y: h * 0.03, s: 1.0 },
    { x: w * -0.05, y: h * 0.10, s: 0.9 },
    { x: w * 0.9, y: h * 0.06, s: 1.1 },
  ];
  cloudData.forEach((c) => {
    const drift = Math.sin(t * 0.0003 + c.x) * 8;
    const cx2 = c.x + drift;
    ctx.globalAlpha = 0.9;
    // Ombre
    ctx.fillStyle = 'rgba(180,200,220,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx2 + 3, c.y + 8, 70 * c.s, 25 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nuage blanc
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx2, c.y, 60 * c.s, 22 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx2 - 40 * c.s, c.y + 5, 45 * c.s, 20 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx2 + 45 * c.s, c.y + 3, 50 * c.s, 18 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx2 + 10 * c.s, c.y - 15 * c.s, 40 * c.s, 22 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx2 - 20 * c.s, c.y - 10 * c.s, 35 * c.s, 18 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawSunset(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Ciel dégradé coucher de soleil
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0,    '#0a0820');
  sky.addColorStop(0.25, '#1a0d3e');
  sky.addColorStop(0.48, '#7b1f5a');
  sky.addColorStop(0.65, '#c0392b');
  sky.addColorStop(0.8,  '#e67e22');
  sky.addColorStop(1,    '#f5a623');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * 0.5;
  const sunY = h * 0.80;
  const sunR = 70;

  // Grand halo orange
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.5, sunX, sunY, sunR * 8);
  halo.addColorStop(0,   'rgba(255,180,40,0.35)');
  halo.addColorStop(0.25,'rgba(255,80,10,0.18)');
  halo.addColorStop(0.6, 'rgba(200,50,0,0.06)');
  halo.addColorStop(1,   'rgba(200,50,0,0)');
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 8, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  // Rayon horizontal (reflet sur horizon)
  const ray = ctx.createLinearGradient(0, sunY - 4, 0, sunY + 4);
  ray.addColorStop(0, 'rgba(255,180,40,0)');
  ray.addColorStop(0.5, 'rgba(255,180,40,0.25)');
  ray.addColorStop(1, 'rgba(255,180,40,0)');
  ctx.fillStyle = ray;
  ctx.fillRect(0, sunY - 4, w, 8);

  // Disque solaire bas (partiellement caché par l'horizon)
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
  sunGrad.addColorStop(0, '#fffde0');
  sunGrad.addColorStop(0.35, '#ffcc00');
  sunGrad.addColorStop(0.7, '#ff8000');
  sunGrad.addColorStop(1, '#e03000');
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fillStyle = sunGrad;
  ctx.shadowBlur = 60;
  ctx.shadowColor = 'rgba(255,100,0,0.9)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Nuages roses/oranges en silhouette
  const sunsetClouds = [
    { x: w * 0.08, y: h * 0.10, s: 1.1, tint: 'rgba(255,120,60,0.55)' },
    { x: w * 0.38, y: h * 0.06, s: 1.4, tint: 'rgba(255,80,40,0.45)'  },
    { x: w * 0.68, y: h * 0.08, s: 1.0, tint: 'rgba(255,140,80,0.5)'  },
    { x: w * 0.82, y: h * 0.12, s: 0.9, tint: 'rgba(220,80,60,0.4)'   },
  ];
  sunsetClouds.forEach((c, i) => {
    const drift = Math.sin(t * 0.0002 + i * 1.3) * 10;
    const cx2 = c.x + drift;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = c.tint;
    ctx.beginPath();
    ctx.ellipse(cx2,              c.y,           65 * c.s, 22 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx2 - 45 * c.s,  c.y + 5,       48 * c.s, 19 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx2 + 50 * c.s,  c.y + 3,       52 * c.s, 17 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx2 + 12 * c.s,  c.y - 16 * c.s,42 * c.s, 22 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Quelques étoiles naissantes en haut
  const stars = [[0.08,0.05],[0.22,0.10],[0.55,0.07],[0.80,0.04],[0.93,0.12]];
  stars.forEach(([sx, sy], i) => {
    const fade = (Math.sin(t * 0.0015 + i * 1.9) + 1) / 2 * 0.55;
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#ffe';
    ctx.beginPath();
    ctx.arc(sx * w, sy * h, 1, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w * 0.3;
  const cy = h * 0.4;
  const r  = 50;

  const pulse = 1 + Math.sin(t * 0.002) * 0.05;

  // Glow doux autour du soleil
  const glow = ctx.createRadialGradient(cx, cy, r, cx, cy, r * 5 * pulse);
  glow.addColorStop(0, 'rgba(255,255,255,0.3)');
  glow.addColorStop(0.2, 'rgba(255,250,200,0.15)');
  glow.addColorStop(0.5, 'rgba(255,240,150,0.05)');
  glow.addColorStop(1, 'rgba(255,240,150,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 5 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Rayons en étoile pointus (comme la photo)
  const starPoints = 8;
  const rotAngle = t * 0.0002;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotAngle);

  // Grands rayons pointus
  for (let i = 0; i < starPoints; i++) {
    const angle = (i / starPoints) * Math.PI * 2;
    const len = 1200 + Math.sin(t * 0.002 + i) * 80 + (i % 2 === 0 ? 200 : 0);
    const tipWidth = 0.008;

    ctx.beginPath();
    ctx.moveTo(Math.cos(angle - tipWidth) * r * 0.8, Math.sin(angle - tipWidth) * r * 0.8);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.lineTo(Math.cos(angle + tipWidth) * r * 0.8, Math.sin(angle + tipWidth) * r * 0.8);
    ctx.closePath();

    const rayGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, len);
    rayGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
    rayGrad.addColorStop(0.2, 'rgba(255,250,200,0.3)');
    rayGrad.addColorStop(0.5, 'rgba(255,240,150,0.1)');
    rayGrad.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = rayGrad;
    ctx.fill();
  }

  // Petits rayons entre les grands
  for (let i = 0; i < starPoints; i++) {
    const angle = ((i + 0.5) / starPoints) * Math.PI * 2;
    const len = 700 + Math.sin(t * 0.003 + i * 2) * 50;

    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.9, Math.sin(angle) * r * 0.9);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  // Disque solaire blanc
  const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.6, '#fffde8');
  sunGrad.addColorStop(1, '#fef3c7');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = sunGrad;
  ctx.shadowBlur = 40;
  ctx.shadowColor = 'rgba(255,255,255,0.8)';
  ctx.fill();
  ctx.shadowBlur = 0;

}

function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud, w: number, partly = false) {
  // Nuages partiellement nuageux : plus blancs, plus opaques, avec liseré doré (éclairage soleil)
  const op = partly ? Math.min(1, cloud.opacity * 5) : cloud.opacity;
  const fill = partly ? '#f0f4ff' : '#e2e8f0';
  ctx.globalAlpha = op;
  const { x, y, w: cw, h: ch } = cloud;

  // Ombre portée douce
  ctx.shadowBlur = partly ? 18 : 0;
  ctx.shadowColor = partly ? 'rgba(251,191,36,0.25)' : 'transparent';

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x + cw * 0.5,  y + ch * 0.7,  cw * 0.5,  ch * 0.4, 0, 0, Math.PI * 2);
  ctx.ellipse(x + cw * 0.25, y + ch * 0.55, cw * 0.3,  ch * 0.45, 0, 0, Math.PI * 2);
  ctx.ellipse(x + cw * 0.72, y + ch * 0.6,  cw * 0.28, ch * 0.4, 0, 0, Math.PI * 2);
  ctx.ellipse(x + cw * 0.5,  y + ch * 0.38, cw * 0.35, ch * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Liseré lumineux côté soleil (haut-droite) pour les nuages partiels
  if (partly) {
    ctx.globalAlpha = op * 0.4;
    ctx.strokeStyle = 'rgba(255,236,153,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x + cw * 0.5, y + ch * 0.38, cw * 0.35, ch * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  cloud.x += cloud.speed;
  if (cloud.x > w + cloud.w + 20) cloud.x = -cloud.w - 20;
  ctx.globalAlpha = 1;
}

function drawFog(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const layers = [
    { y: h * 0.2, speed: 0.18, op: 0.10, height: 60 },
    { y: h * 0.5, speed: 0.28, op: 0.14, height: 50 },
    { y: h * 0.75,speed: 0.12, op: 0.08, height: 70 },
  ];
  layers.forEach(l => {
    const offset = ((t * l.speed) % (w + 400)) - 200;
    const grad = ctx.createLinearGradient(offset, 0, offset + w + 400, 0);
    grad.addColorStop(0, `rgba(148,163,184,0)`);
    grad.addColorStop(0.2, `rgba(148,163,184,${l.op})`);
    grad.addColorStop(0.8, `rgba(148,163,184,${l.op})`);
    grad.addColorStop(1, `rgba(148,163,184,0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(offset + (w + 400) / 2, l.y, (w + 400) / 2, l.height, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ─── Composant Canvas (web) ───────────────────────────────────────────────────
function WeatherCanvas({ code }: { code: number }) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    const w = container.offsetWidth  || W;
    const h = container.offsetHeight || WEATHER_HEADER_H;
    canvas.width  = w;
    canvas.height = h;
    // Fade-in au lieu d'apparition brutale
    Object.assign(canvas.style, {
      position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%', pointerEvents: 'none',
      opacity: '0', transition: 'opacity 1.4s ease',
    });
    container.appendChild(canvas);
    // Déclenche le fondu après un frame
    requestAnimationFrame(() => { canvas.style.opacity = '1'; });

    const ctx = canvas.getContext('2d')!;
    const theme        = getTheme(code);
    const night        = isNightTime();
    const sunset       = isSunsetTime();
    const isRain       = code >= 50 && code <= 69;
    const isHeavy      = code >= 63 && code <= 69;
    const isStorm      = code >= 80 && code <= 99;
    const isSnow       = code >= 70 && code <= 79;
    const isSun        = code <= 3;
    const isPartly     = code >= 1 && code <= 3;
    const isFog        = code >= 40 && code <= 49;
    const isCloud      = code >= 4  && code <= 49;

    // Particules
    const drops  = (isRain || isStorm) ? makeDrops(isStorm ? 60 : isHeavy ? 80 : 25, w, h, isHeavy || isStorm) : [];
    const isHeavySnow = code >= 75 && code <= 79;
    const flakes = isSnow ? makeFlakes(isHeavySnow ? 80 : 30, w, h) : [];
    // Partiellement nuageux : 2-3 nuages légers; couvert : 5 nuages denses
    const visibleH = h;
    const clouds = (code === 0) ? makeClouds(4, w, visibleH)
                 : isPartly  ? makeClouds(3, w, visibleH)
                 : (isCloud || isStorm) ? makeClouds(5, w, visibleH)
                 : [];

    // Lightning state
    let lightningOp = 0;
    let nextLightning = 3000 + Math.random() * 5000;
    let elapsed = 0;

    let raf: number;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      elapsed += dt;

      // Fond dégradé — coucher de soleil gère son propre fond dans drawSunset
      if (!( isSun && sunset )) {
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        if (night && isSun) {
          bg.addColorStop(0, '#020818');
          bg.addColorStop(1, '#050d28');
        } else if (code <= 3) {
          bg.addColorStop(0, '#3b95ed');
          bg.addColorStop(1, '#3b95ed');
        } else {
          const [c1, c2] = [theme.bg[0], theme.bg[1]];
          bg.addColorStop(0, c2);
          bg.addColorStop(1, c1);
        }
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
      }

      // Dessin météo — coucher de soleil, nuit, ou jour
      if (isSun && sunset) drawSunset(ctx, w, h, elapsed);
      else if (isSun && night)  drawMoon(ctx, w, h, elapsed);
      else if (isSun && !night) drawSun(ctx, w, h, elapsed);
      if (isRain || isStorm) drawRain(ctx, drops, w, h, isHeavy || isStorm);
      if (isSnow)  drawSnow(ctx, flakes, w, h, elapsed);
      if (code === 0 || isPartly || isCloud || isStorm) clouds.forEach(c => drawCloud(ctx, c, w, code === 0 || isPartly));
      if (isFog)   drawFog(ctx, w, h, elapsed);

      // Lightning
      if (isStorm) {
        if (elapsed > nextLightning) {
          lightningOp = 0.85;
          nextLightning = elapsed + 3000 + Math.random() * 6000;

          // Dessine un éclair
          const bx = rand(w * 0.2, w * 0.8);
          ctx.save();
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#c7d2fe';
          ctx.strokeStyle = `rgba(200,220,255,0.9)`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(bx, 0);
          ctx.lineTo(bx - 15, h * 0.35);
          ctx.lineTo(bx + 10, h * 0.35);
          ctx.lineTo(bx - 20, h * 0.8);
          ctx.stroke();
          ctx.restore();
        }
        if (lightningOp > 0) {
          ctx.fillStyle = `rgba(180,210,255,${lightningOp})`;
          ctx.fillRect(0, 0, w, h);
          lightningOp = Math.max(0, lightningOp - 0.06);
        }
      }

      // Pas de fondu — le ciel continue jusqu'en bas

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      // Fondu de sortie avant de retirer
      canvas.style.opacity = '0';
      setTimeout(() => {
        if (container.contains(canvas)) container.removeChild(canvas);
      }, 1400);
    };
  }, [code]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: WEATHER_HEADER_H,
        overflow: 'hidden',
      } as any}
    />
  );
}

// ─── Overlay infos météo ──────────────────────────────────────────────────────
function WeatherInfo() {
  const weatherData = useStore((s) => s.weatherData);
  if (!weatherData) return null;
  const theme = getTheme(weatherData.weatherCode);
  return (
    <View style={styles.infoOverlay} pointerEvents="none">
      <Text style={styles.infoIcon}>{weatherData.icon}</Text>
      <View>
        <Text style={[styles.infoTemp, { color: theme.accent }]}>{weatherData.temperature}°C</Text>
        <Text style={styles.infoDesc}>{weatherData.description}</Text>
        {!!weatherData.city && (
          <Text style={styles.infoCity}>📍 {weatherData.city}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Native Weather Animation ─────────────────────────────────────────────────
function NativeRainDrop({ x, delay, duration, length, opacity, heavy }: {
  x: number; delay: number; duration: number; length: number; opacity: number; heavy: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.loop(Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true })),
    ]).start();
    return () => anim.stopAnimation();
  }, []);
  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [-length, NATIVE_H + length] });
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [0, heavy ? -18 : -7] });
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', left: x, top: 0,
      width: heavy ? 1.8 : 1.2, height: length,
      backgroundColor: `rgba(147,197,253,${opacity})`,
      borderRadius: 1,
      transform: [{ translateY: ty }, { translateX: tx }],
    }} />
  );
}

function NativeSnowFlake({ x, delay, duration, size, opacity }: {
  x: number; delay: number; duration: number; size: number; opacity: number;
}) {
  const fall = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.loop(Animated.timing(fall, { toValue: 1, duration, useNativeDriver: true })),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(sway, { toValue: -1, duration: 1800, useNativeDriver: true }),
    ])).start();
    return () => { fall.stopAnimation(); sway.stopAnimation(); };
  }, []);
  const ty = fall.interpolate({ inputRange: [0, 1], outputRange: [-size * 3, NATIVE_H + size * 3] });
  const tx = sway.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', left: x, top: 0,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `rgba(226,232,240,${opacity})`,
      transform: [{ translateY: ty }, { translateX: tx }],
    }} />
  );
}

function NativeCloud({ initialX, y, w, h, speed, opacity, tinted }: {
  initialX: number; y: number; w: number; h: number; speed: number; opacity: number; tinted?: boolean;
}) {
  const x = useRef(new Animated.Value(initialX)).current;
  useEffect(() => {
    const totalDist = W + w * 2;
    const firstDist = W + w - initialX;
    const firstDur = Math.max(800, speed * firstDist / totalDist);
    Animated.timing(x, { toValue: W + w, duration: firstDur, useNativeDriver: true }).start(() => {
      x.setValue(-w);
      Animated.loop(Animated.timing(x, { toValue: W + w, duration: speed, useNativeDriver: true })).start();
    });
    return () => x.stopAnimation();
  }, []);
  const col = tinted ? `rgba(255,150,80,${opacity})` : `rgba(240,244,255,${opacity})`;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: y, width: w, height: h, transform: [{ translateX: x }] }}>
      <View style={{ position: 'absolute', left: w*0.15, top: h*0.42, width: w*0.70, height: h*0.55, backgroundColor: col, borderRadius: h*0.28 }} />
      <View style={{ position: 'absolute', left: 0,      top: h*0.55, width: w*0.48, height: h*0.40, backgroundColor: col, borderRadius: h*0.22 }} />
      <View style={{ position: 'absolute', left: w*0.47, top: h*0.50, width: w*0.52, height: h*0.45, backgroundColor: col, borderRadius: h*0.24 }} />
      <View style={{ position: 'absolute', left: w*0.28, top: h*0.08, width: w*0.44, height: h*0.52, backgroundColor: col, borderRadius: h*0.30 }} />
    </Animated.View>
  );
}

function NativeSun() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ])).start();
    return () => pulse.stopAnimation();
  }, []);
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1.4, 2.0] });
  const glowOp    = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.22] });
  const discScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const cx = W * 0.3;
  const cy = NATIVE_H * 0.14;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: cx - 40, top: cy - 40, width: 80, height: 80 }}>
      <Animated.View style={{
        position: 'absolute', left: -30, top: -30, width: 140, height: 140,
        borderRadius: 70, backgroundColor: 'rgba(255,255,180,1)',
        opacity: glowOp, transform: [{ scale: glowScale }],
      }} />
      <Animated.View style={{
        position: 'absolute', left: 10, top: 10, width: 60, height: 60,
        borderRadius: 30, backgroundColor: '#fffde8',
        shadowColor: '#fef3c7', shadowRadius: 20, shadowOpacity: 0.9,
        transform: [{ scale: discScale }],
      }} />
    </View>
  );
}

function NativeMoon() {
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 3000, useNativeDriver: true }),
    ])).start();
    return () => glow.stopAnimation();
  }, []);
  const op = glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] });
  const cx = W * 0.78;
  const cy = NATIVE_H * 0.13;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: cx - 40, top: cy - 40, width: 80, height: 80 }}>
      <Animated.View style={{ position: 'absolute', left: -15, top: -15, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(200,220,255,0.1)', opacity: op }} />
      <View style={{ position: 'absolute', left: 10, top: 10, width: 60, height: 60, borderRadius: 30, backgroundColor: '#e0ddd0' }} />
      <View style={{ position: 'absolute', left: 22, top: 6, width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(8,12,28,0.65)' }} />
    </View>
  );
}

function NativeStar({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.loop(Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])),
    ]).start();
    return () => op.stopAnimation();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: '#fff', opacity: op,
    }} />
  );
}

function NativeLightning() {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(4200),
      Animated.timing(op, { toValue: 0.65, duration: 80,  useNativeDriver: true }),
      Animated.timing(op, { toValue: 0,    duration: 250, useNativeDriver: true }),
      Animated.delay(180),
      Animated.timing(op, { toValue: 0.35, duration: 60,  useNativeDriver: true }),
      Animated.timing(op, { toValue: 0,    duration: 180, useNativeDriver: true }),
    ])).start();
    return () => op.stopAnimation();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(180,210,255,1)', opacity: op }]} />
  );
}

function NativeWeatherCanvas({ code }: { code: number }) {
  const night   = isNightTime();
  const sunset  = isSunsetTime();
  const isRain  = code >= 50 && code <= 69;
  const isHeavy = code >= 63 && code <= 69;
  const isStorm = code >= 80;
  const isSnow  = code >= 70 && code <= 79;
  const isSun   = code <= 3;
  const isPartly = code >= 1 && code <= 3;
  const isFog   = code >= 4 && code <= 49;

  const rainDrops = useMemo(() => {
    if (!isRain && !isStorm) return [];
    const n = isStorm ? 38 : isHeavy ? 45 : 20;
    return Array.from({ length: n }, (_, i) => ({
      i, x: Math.random() * (W + 40),
      delay: Math.random() * 1200,
      dur: (isHeavy || isStorm) ? 350 + Math.random() * 250 : 700 + Math.random() * 500,
      len: (isHeavy || isStorm) ? 28 + Math.random() * 18 : 14 + Math.random() * 10,
      op: 0.3 + Math.random() * ((isHeavy || isStorm) ? 0.45 : 0.2),
    }));
  }, [code]);

  const snowFlakes = useMemo(() => {
    if (!isSnow) return [];
    const heavy = code >= 75;
    return Array.from({ length: heavy ? 50 : 22 }, (_, i) => ({
      i, x: Math.random() * W,
      delay: Math.random() * 2000,
      dur: heavy ? 1400 + Math.random() * 900 : 2400 + Math.random() * 1800,
      size: heavy ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
      op: 0.5 + Math.random() * 0.4,
    }));
  }, [code]);

  const cloudConf = useMemo(() => {
    const t = sunset && isSun;
    const baseOp = (isFog || isRain || isStorm) ? 0.13 : 0.88;
    const sunList = [
      { ix: W * 0.1,  y: NATIVE_H * 0.04, w: 175, h: 65,  sp: 22000 },
      { ix: W * 0.55, y: NATIVE_H * 0.08, w: 210, h: 80,  sp: 30000 },
      { ix: -120,      y: NATIVE_H * 0.02, w: 150, h: 55,  sp: 25000 },
      { ix: W * 0.75, y: NATIVE_H * 0.06, w: 138, h: 50,  sp: 18000 },
    ];
    const partlyList = [
      { ix: W * 0.2,  y: NATIVE_H * 0.05, w: 185, h: 70,  sp: 24000 },
      { ix: W * 0.62, y: NATIVE_H * 0.09, w: 230, h: 86,  sp: 32000 },
      { ix: -145,      y: NATIVE_H * 0.03, w: 162, h: 60,  sp: 27000 },
    ];
    const stormList = [
      { ix: -200,      y: NATIVE_H * 0.02, w: 280, h: 105, sp: 48000 },
      { ix: W * 0.35, y: NATIVE_H * 0.07, w: 320, h: 122, sp: 55000 },
      { ix: W * 0.68, y: NATIVE_H * 0.04, w: 245, h: 92,  sp: 42000 },
    ];
    const list = (code === 0 && !night) ? sunList : isPartly ? partlyList : (isRain || isStorm || isFog) ? stormList : [];
    return list.map((c, k) => ({ key: k, ...c, op: baseOp, tinted: t }));
  }, [code, night, sunset]);

  const starConf = useMemo(() => {
    if (!night || !isSun) return [];
    return [
      [0.08,0.08],[0.20,0.05],[0.35,0.13],[0.50,0.06],[0.62,0.17],
      [0.15,0.32],[0.40,0.28],[0.55,0.26],[0.88,0.10],[0.92,0.30],
      [0.25,0.22],[0.70,0.07],[0.05,0.24],[0.45,0.38],[0.72,0.33],
    ].map(([sx, sy], i) => ({
      key: i, x: sx! * W, y: sy! * NATIVE_H * 0.5,
      delay: i * 190, size: 1.5 + Math.random() * 1.8,
    }));
  }, [code, night]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {isSun && !sunset && !night && <NativeSun />}
      {isSun && night && <NativeMoon />}
      {starConf.map(s => <NativeStar key={s.key} x={s.x} y={s.y} delay={s.delay} size={s.size} />)}
      {cloudConf.map(c => (
        <NativeCloud key={c.key} initialX={c.ix} y={c.y} w={c.w} h={c.h} speed={c.sp} opacity={c.op} tinted={c.tinted} />
      ))}
      {rainDrops.map(d => (
        <NativeRainDrop key={d.i} x={d.x} delay={d.delay} duration={d.dur} length={d.len} opacity={d.op} heavy={isHeavy || isStorm} />
      ))}
      {snowFlakes.map(f => (
        <NativeSnowFlake key={f.i} x={f.x} delay={f.delay} duration={f.dur} size={f.size} opacity={f.op} />
      ))}
      {isStorm && <NativeLightning />}
    </View>
  );
}

// ─── Composant final ──────────────────────────────────────────────────────────
function WeatherBackgroundInner() {
  const weatherData = useStore((s) => s.weatherData);
  const code = weatherData?.weatherCode ?? 0;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <WeatherCanvas code={code} />
        <WeatherInfo />
      </View>
    );
  }

  const theme  = getTheme(code);
  const night  = isNightTime();
  const sunset = isSunsetTime();
  const bg = night && code <= 3 ? '#020818' : code <= 3 && sunset ? '#7b1f5a' : theme.bg[0];
  return (
    <View style={[styles.wrapper, { backgroundColor: bg }]}>
      <NativeWeatherCanvas code={code} />
      <WeatherInfo />
    </View>
  );
}

export const WeatherBackground = WeatherBackgroundInner;

export function WeatherScreen({ children }: { children: React.ReactNode }) {
  const weatherData = useStore((s) => s.weatherData);
  const code = weatherData?.weatherCode ?? 0;
  const sunset = isSunsetTime();
  const fallbackBg = (code <= 3 && sunset) ? '#7b1f5a' : code <= 3 ? '#3b95ed' : code <= 49 ? '#1a1f2e' : code <= 69 ? '#0d1a30' : code <= 79 ? '#101929' : '#080d1f';
  return (
    <View style={[wsStyles.root, { backgroundColor: fallbackBg }]}>
      <View style={wsStyles.bg}>
        <WeatherBackgroundInner />
      </View>
      {children}
    </View>
  );
}

const wsStyles = StyleSheet.create({
  root: { flex: 1 },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  infoOverlay: {
    position: 'absolute',
    top: 16,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  infoIcon: { fontSize: 38 },
  infoTemp: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  infoDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 1 },
  infoCity: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
});
