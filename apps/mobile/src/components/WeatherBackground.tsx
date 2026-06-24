import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useStore } from '../store/useStore';

const { width: W } = Dimensions.get('window');
export const WEATHER_HEADER_H = 900;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Drop  { x: number; y: number; speed: number; length: number; opacity: number; }
interface Flake { x: number; y: number; vx: number; vy: number; size: number; opacity: number; rotation: number; rotSpeed: number; }
interface Cloud { x: number; y: number; w: number; h: number; speed: number; opacity: number; }

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const rand  = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max));

// ─── Thème par code météo ─────────────────────────────────────────────────────
function getTheme(code: number) {
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
    speed: heavy ? rand(14, 22) : rand(7, 14),
    length: heavy ? rand(22, 35) : rand(12, 22),
    opacity: rand(0.25, heavy ? 0.65 : 0.45),
  }));
}

function makeFlakes(n: number, w: number, h: number): Flake[] {
  return Array.from({ length: n }, () => ({
    x: rand(0, w),
    y: rand(-h, h),
    vx: rand(-0.4, 0.4),
    vy: rand(0.5, 1.8),
    size: rand(1.5, 4.5),
    opacity: rand(0.4, 0.85),
    rotation: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.01, 0.01),
  }));
}

function makeClouds(n: number, w: number, h: number): Cloud[] {
  return Array.from({ length: n }, (_, i) => ({
    x: rand(-200, w + 200),
    y: rand(h * 0.05, h * 0.6),
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

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6;
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
  // Gros nuages blancs réalistes en bas
  const cloudData = [
    { x: w * 0.15, y: h * 0.58, s: 1.2 },
    { x: w * 0.45, y: h * 0.62, s: 1.5 },
    { x: w * 0.75, y: h * 0.55, s: 1.0 },
    { x: w * -0.05, y: h * 0.68, s: 0.9 },
    { x: w * 0.9, y: h * 0.65, s: 1.1 },
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

function drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w * 0.3;
  const cy = h * 0.4;
  const r  = 28;

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
    const len = h * 0.45 + Math.sin(t * 0.002 + i) * 15;
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
    const len = h * 0.2 + Math.sin(t * 0.003 + i * 2) * 10;

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
    const isRain       = code >= 50 && code <= 69;
    const isHeavy      = code >= 63 && code <= 69;
    const isStorm      = code >= 80 && code <= 99;
    const isSnow       = code >= 70 && code <= 79;
    const isSun        = code <= 3;
    const isPartly     = code >= 1 && code <= 3;
    const isFog        = code >= 40 && code <= 49;
    const isCloud      = code >= 4  && code <= 49;

    // Particules
    const drops  = (isRain || isStorm) ? makeDrops(isStorm ? 35 : 22, w, h, isHeavy || isStorm) : [];
    const flakes = isSnow    ? makeFlakes(28, w, h) : [];
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

      // Fond dégradé — nuit = plus sombre/bleu
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

      // Dessin météo — nuit = lune + étoiles, jour = soleil
      if (isSun && night)  drawMoon(ctx, w, h, elapsed);
      if (isSun && !night) drawSun(ctx, w, h, elapsed);
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
      </View>
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

  // Fallback natif : fond coloré simple
  const theme = getTheme(code);
  return (
    <View style={[styles.wrapper, { backgroundColor: theme.bg[0] }]}>
      <WeatherInfo />
    </View>
  );
}

export const WeatherBackground = WeatherBackgroundInner;

export function WeatherScreen({ children }: { children: React.ReactNode }) {
  return (
    <View style={wsStyles.root}>
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
});
