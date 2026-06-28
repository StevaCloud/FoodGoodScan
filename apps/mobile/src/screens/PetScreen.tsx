import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { useStore } from '../store/useStore';

const { width: SW } = Dimensions.get('window');
const CW = Math.min(SW, 500);
const CH = 380;
const FLOOR_Y = CH * 0.74;

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const dk = (h: string, a = 0.32) => { const n = parseInt(h.replace('#',''), 16); return `rgb(${Math.max(0,((n>>16)&255)*(1-a)|0)},${Math.max(0,((n>>8)&255)*(1-a)|0)},${Math.max(0,(n&255)*(1-a)|0)})`; };
const lt = (h: string, a = 0.28) => { const n = parseInt(h.replace('#',''), 16); return `rgb(${Math.min(255,((n>>16)&255)+255*a|0)},${Math.min(255,((n>>8)&255)+255*a|0)},${Math.min(255,(n&255)+255*a|0)})`; };
const vl = (h: string) => lt(h, 0.55);

// ─── Décors ───────────────────────────────────────────────────────────────────
export const DECORS = [
  { id:'home',   emoji:'🏠', label:'Maison'  },
  { id:'garden', emoji:'🌿', label:'Jardin'  },
  { id:'beach',  emoji:'🏖️', label:'Plage'   },
  { id:'night',  emoji:'🌃', label:'Nuit'    },
  { id:'winter', emoji:'❄️', label:'Hiver'   },
  { id:'space',  emoji:'🚀', label:'Espace'  },
];

function drawDecor(ctx: CanvasRenderingContext2D, w: number, h: number, id: string, t: number) {
  const fl = FLOOR_Y;

  if (id === 'home') {
    // Mur brique
    const wallG = ctx.createLinearGradient(0, 0, 0, fl);
    wallG.addColorStop(0, '#1e1018'); wallG.addColorStop(1, '#170c12');
    ctx.fillStyle = wallG; ctx.fillRect(0, 0, w, fl);
    // Lambris bas
    ctx.fillStyle = '#2a1510'; ctx.fillRect(0, fl - 40, w, 40);
    ctx.strokeStyle = '#3a2015'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, fl - 40); ctx.lineTo(w, fl - 40); ctx.stroke();
    // Plancher
    ctx.fillStyle = '#3a2010'; ctx.fillRect(0, fl, w, h - fl);
    for (let i = 0; i < w; i += 48) {
      ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(i, fl); ctx.lineTo(i, h); ctx.stroke();
    }
    // Tapis
    ctx.fillStyle = '#5a1a4a';
    ctx.beginPath(); ctx.ellipse(w/2, fl+30, w*0.33, 22, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#8a2a7a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(w/2, fl+30, w*0.28, 17, 0, 0, Math.PI*2); ctx.stroke();
    // Fenêtre
    ctx.fillStyle = '#1a3050'; ctx.fillRect(w*0.06, 30, 80, 60);
    ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 5;
    ctx.strokeRect(w*0.06 - 5, 25, 90, 70);
    const winG = ctx.createLinearGradient(w*0.06, 30, w*0.06+80, 90);
    winG.addColorStop(0, 'rgba(100,180,255,0.3)'); winG.addColorStop(1, 'rgba(60,120,200,0.1)');
    ctx.fillStyle = winG; ctx.fillRect(w*0.06, 30, 80, 60);
    // Rideau
    ctx.fillStyle = '#8a2a20';
    ctx.beginPath(); ctx.moveTo(w*0.06-8, 25); ctx.quadraticCurveTo(w*0.06+5, 65, w*0.06, 95); ctx.lineTo(w*0.06-8, 95); ctx.closePath(); ctx.fill();
    // Lampe
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(w*0.82, fl-90, 8, 90);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.moveTo(w*0.82-20, fl-90); ctx.lineTo(w*0.82+28, fl-90); ctx.lineTo(w*0.82+20, fl-115); ctx.lineTo(w*0.82-12, fl-115); ctx.closePath(); ctx.fill();
    const lampG = ctx.createRadialGradient(w*0.82+4, fl-80, 5, w*0.82+4, fl-40, 80);
    lampG.addColorStop(0,'rgba(251,191,36,0.25)'); lampG.addColorStop(1,'rgba(251,191,36,0)');
    ctx.fillStyle = lampG; ctx.beginPath(); ctx.ellipse(w*0.82+4, fl-60, 80, 60, 0, 0, Math.PI*2); ctx.fill();
    // Gamelles
    ctx.fillStyle = '#4a2000';
    ctx.beginPath(); ctx.ellipse(w*0.12, fl+22, 20, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.ellipse(w*0.12, fl+19, 16, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#083060';
    ctx.beginPath(); ctx.ellipse(w*0.88, fl+22, 20, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.ellipse(w*0.88, fl+19, 16, 5, 0, 0, Math.PI*2); ctx.fill();
  }

  else if (id === 'garden') {
    // Ciel
    const sky = ctx.createLinearGradient(0, 0, 0, fl);
    sky.addColorStop(0,'#87ceeb'); sky.addColorStop(1,'#c8e8f8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, fl);
    // Soleil
    const sunX = w*0.85, sunY = 55;
    const sunG = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 45);
    sunG.addColorStop(0,'#fffde0'); sunG.addColorStop(0.4,'#fbbf24'); sunG.addColorStop(1,'rgba(251,191,36,0)');
    ctx.fillStyle = sunG; ctx.beginPath(); ctx.arc(sunX, sunY, 45, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI*2); ctx.fill();
    // Nuages
    [[w*0.15, 55, 1.0], [w*0.5, 35, 0.8], [w*0.68, 70, 0.6]].forEach(([cx2, cy2, op]) => {
      const off = ((t * 0.015 * (op as number)) % (w + 200)) - 100;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#fff';
      [[-30,8,40,18],[0,0,55,22],[35,5,40,18]].forEach(([dx,dy,rx,ry]) => {
        ctx.beginPath(); ctx.ellipse((cx2 as number)+off+dx, (cy2 as number)+dy, rx, ry, 0, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    });
    // Herbe
    const grass = ctx.createLinearGradient(0, fl, 0, h);
    grass.addColorStop(0,'#2d7a1f'); grass.addColorStop(1,'#1a5010');
    ctx.fillStyle = grass; ctx.fillRect(0, fl, w, h-fl);
    // Touffes d'herbe
    ctx.strokeStyle = '#3a9a28'; ctx.lineWidth = 2.5;
    for (let i = 20; i < w; i += 30) {
      ctx.beginPath(); ctx.moveTo(i, fl); ctx.quadraticCurveTo(i-4, fl-12, i-2, fl-18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i+8, fl); ctx.quadraticCurveTo(i+12, fl-10, i+10, fl-16); ctx.stroke();
    }
    // Fleurs
    [[w*0.1,fl-5],[w*0.3,fl-3],[w*0.7,fl-4],[w*0.9,fl-6]].forEach(([fx,fy]) => {
      ['#ef4444','#f59e0b','#ec4899','#8b5cf6'][Math.floor((fx as number)/w*4) % 4];
      const fc = ['#ef4444','#f59e0b','#ec4899','#8b5cf6'][Math.floor((fx as number)/100)%4];
      ctx.fillStyle = '#2a8a10'; ctx.fillRect((fx as number)-1, (fy as number)-14, 2, 14);
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(fx as number, (fy as number)-18, 5, 0, Math.PI*2); ctx.fill();
      for (let p=0; p<5; p++) {
        const pa = (p/5)*Math.PI*2;
        ctx.fillStyle = fc;
        ctx.beginPath(); ctx.ellipse((fx as number)+Math.cos(pa)*8, (fy as number)-18+Math.sin(pa)*8, 5, 3, pa, 0, Math.PI*2); ctx.fill();
      }
    });
    // Arbre
    ctx.fillStyle = '#5a3010'; ctx.fillRect(w*0.06-8, fl-100, 16, 100);
    ctx.fillStyle = '#1a6010';
    ctx.beginPath(); ctx.arc(w*0.06, fl-110, 45, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#22840a';
    ctx.beginPath(); ctx.arc(w*0.06-15, fl-95, 30, 0, Math.PI*2); ctx.fill();
  }

  else if (id === 'beach') {
    // Ciel
    const sky = ctx.createLinearGradient(0,0,0,fl*0.6);
    sky.addColorStop(0,'#0ea5e9'); sky.addColorStop(1,'#7dd3fc');
    ctx.fillStyle = sky; ctx.fillRect(0,0,w,fl*0.6);
    // Soleil
    ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(w*0.82, 45, 28, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
    for (let r=0; r<8; r++) { const a=(r/8)*Math.PI*2; ctx.beginPath(); ctx.moveTo(w*0.82+Math.cos(a)*32, 45+Math.sin(a)*32); ctx.lineTo(w*0.82+Math.cos(a)*44, 45+Math.sin(a)*44); ctx.stroke(); }
    // Océan
    const ocean = ctx.createLinearGradient(0,fl*0.6,0,fl);
    ocean.addColorStop(0,'#0369a1'); ocean.addColorStop(1,'#0284c7');
    ctx.fillStyle = ocean; ctx.fillRect(0,fl*0.6,w,fl*0.4);
    // Vagues
    for (let wave=0; wave<3; wave++) {
      const woff = ((t*0.02 + wave*40) % (w+100)) - 50;
      ctx.strokeStyle = `rgba(255,255,255,${0.4-wave*0.1})`; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let xi=0; xi<w+10; xi+=10) {
        const yi = fl*0.6 + wave*15 + Math.sin((xi+woff)*0.04)*6;
        xi === 0 ? ctx.moveTo(xi, yi) : ctx.lineTo(xi, yi);
      }
      ctx.stroke();
    }
    // Sable
    const sand = ctx.createLinearGradient(0,fl,0,h);
    sand.addColorStop(0,'#d4a853'); sand.addColorStop(1,'#b8863c');
    ctx.fillStyle = sand; ctx.fillRect(0,fl,w,h-fl);
    // Palmier
    ctx.fillStyle = '#5c3010'; ctx.save(); ctx.translate(w*0.88, fl); ctx.rotate(-0.1);
    ctx.fillRect(-7,0,14,-120);
    ctx.restore();
    [[w*0.88-5,fl-118,-0.4,'#2d7a1f'],[w*0.88+5,fl-112,-0.1,'#1a5a10'],[w*0.88-10,fl-108,0.3,'#3a9a20']].forEach(([px,py,pr,pc]) => {
      ctx.save(); ctx.translate(px as number, py as number); ctx.rotate(pr as number);
      ctx.fillStyle = pc as string;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(30,-15,50,5); ctx.quadraticCurveTo(30,5,0,0); ctx.fill();
      ctx.restore();
    });
    // Coquillages
    ctx.fillStyle = '#e8c090'; [[w*0.2,fl+18],[w*0.6,fl+14],[w*0.75,fl+22]].forEach(([sx,sy]) => {
      ctx.beginPath(); ctx.ellipse(sx as number, sy as number, 8, 5, 0.3, 0, Math.PI*2); ctx.fill();
    });
    // Mouettes
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    [[w*0.3,40],[w*0.5,25],[w*0.65,50]].forEach(([mx,my]) => {
      const off = Math.sin(t*0.002+(mx as number))*8;
      ctx.beginPath(); ctx.moveTo((mx as number)-12+off, my as number); ctx.quadraticCurveTo((mx as number)+off, (my as number)-8, (mx as number)+12+off, my as number); ctx.stroke();
    });
  }

  else if (id === 'night') {
    // Ciel nuit
    const sky = ctx.createLinearGradient(0,0,0,fl);
    sky.addColorStop(0,'#020824'); sky.addColorStop(1,'#050d30');
    ctx.fillStyle = sky; ctx.fillRect(0,0,w,fl);
    // Étoiles scintillantes
    const starSeed = [0.13,0.27,0.44,0.62,0.71,0.83,0.19,0.55,0.38,0.91,0.08,0.76,0.33,0.68,0.47,0.22,0.89,0.51];
    starSeed.forEach((s,i) => {
      const sx = s*w, sy = (starSeed[(i+3)%18])*fl*0.9;
      const twinkle = (Math.sin(t*0.003+i*1.7)+1)/2;
      ctx.fillStyle = `rgba(255,255,255,${0.4+twinkle*0.6})`;
      const sr = 1.5+twinkle*1;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
    });
    // Lune
    ctx.fillStyle = '#fef9e0'; ctx.beginPath(); ctx.arc(w*0.15, 55, 32, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e8d870';
    ctx.beginPath(); ctx.arc(w*0.15, 55, 30, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#020824'; ctx.beginPath(); ctx.arc(w*0.15+12, 48, 26, 0, Math.PI*2); ctx.fill();
    // Silhouette ville
    ctx.fillStyle = '#0a0a20';
    [[0,fl-55,50],[50,fl-80,60],[110,fl-45,45],[155,fl-70,55],[210,fl-40,50],[260,fl-60,40],[300,fl-85,50],[350,fl-50,60],[w-80,fl-65,80]].forEach(([bx,by,bw]) => {
      ctx.fillRect(bx as number, by as number, bw as number, fl-(by as number));
      // Fenêtres illuminées
      for (let wy=0; wy<3; wy++) for (let wx2=0; wx2<3; wx2++) {
        if (Math.random() < 0.6) {
          ctx.fillStyle = Math.random()>0.5 ? '#fef08a' : '#fbbf24';
          ctx.fillRect((bx as number)+wx2*12+6, (by as number)+wy*15+8, 6, 8);
        }
      }
      ctx.fillStyle = '#0a0a20';
    });
    // Sol
    const nightFloor = ctx.createLinearGradient(0,fl,0,h);
    nightFloor.addColorStop(0,'#0f0f1f'); nightFloor.addColorStop(1,'#080810');
    ctx.fillStyle = nightFloor; ctx.fillRect(0,fl,w,h-fl);
    // Lampadaire
    ctx.fillStyle = '#2a2a3a'; ctx.fillRect(w*0.85-3, fl-150, 6, 150);
    ctx.fillStyle = '#3a3a4a'; ctx.beginPath(); ctx.arc(w*0.85, fl-148, 8, Math.PI, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(w*0.85, fl-148, 5, 0, Math.PI*2); ctx.fill();
    const lampGlow = ctx.createRadialGradient(w*0.85, fl-140, 2, w*0.85, fl-100, 80);
    lampGlow.addColorStop(0,'rgba(254,240,138,0.18)'); lampGlow.addColorStop(1,'rgba(254,240,138,0)');
    ctx.fillStyle = lampGlow; ctx.beginPath(); ctx.ellipse(w*0.85, fl-80, 80, 90, 0, 0, Math.PI*2); ctx.fill();
    // Lucioles
    for (let f=0; f<5; f++) {
      const fAlpha = (Math.sin(t*0.004+f*2)+1)/2;
      const fX = w*(0.2+f*0.14) + Math.sin(t*0.002+f)*20;
      const fY = fl*0.5 + Math.cos(t*0.003+f*1.5)*30;
      ctx.fillStyle = `rgba(180,255,100,${fAlpha*0.8})`;
      ctx.beginPath(); ctx.arc(fX, fY, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(180,255,100,${fAlpha*0.2})`;
      ctx.beginPath(); ctx.arc(fX, fY, 8, 0, Math.PI*2); ctx.fill();
    }
  }

  else if (id === 'winter') {
    // Ciel hivernal
    const sky = ctx.createLinearGradient(0,0,0,fl);
    sky.addColorStop(0,'#8ba8c8'); sky.addColorStop(1,'#b8cce0');
    ctx.fillStyle = sky; ctx.fillRect(0,0,w,fl);
    // Sapins enneigés
    [[w*0.08,fl],[w*0.88,fl],[w*0.7,fl]].forEach(([tx,ty],ti) => {
      const th = 120-ti*15;
      ctx.fillStyle = '#c8d8e8';
      ctx.beginPath(); ctx.moveTo(tx as number, (ty as number)-th); ctx.lineTo((tx as number)-35, ty as number); ctx.lineTo((tx as number)+35, ty as number); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a5010';
      ctx.beginPath(); ctx.moveTo(tx as number, (ty as number)-th+10); ctx.lineTo((tx as number)-28, ty as number); ctx.lineTo((tx as number)+28, ty as number); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8d8e8';
      ctx.beginPath(); ctx.moveTo(tx as number, (ty as number)-th+5); ctx.lineTo((tx as number)-32, (ty as number)-th*0.35); ctx.lineTo((tx as number)+32, (ty as number)-th*0.35); ctx.closePath(); ctx.fill();
    });
    // Bonhomme de neige
    ctx.fillStyle = '#e8f0ff';
    ctx.beginPath(); ctx.arc(w*0.2, fl-30, 25, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.2, fl-72, 18, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.2, fl-96, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(w*0.2, fl-95, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.2+4, fl-95, 2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w*0.2, fl-88); ctx.lineTo(w*0.2+5, fl-86); ctx.lineTo(w*0.2+3, fl-86); ctx.stroke();
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(w*0.2, fl-94); ctx.lineTo(w*0.2+8, fl-95); ctx.lineTo(w*0.2, fl-96); ctx.closePath(); ctx.fill();
    // Sol enneigé
    const snow = ctx.createLinearGradient(0,fl,0,h);
    snow.addColorStop(0,'#dce8f8'); snow.addColorStop(1,'#c8d8ec');
    ctx.fillStyle = snow; ctx.fillRect(0,fl,w,h-fl);
    // Flocons tombants
    const flakeSeeds = [0.1,0.25,0.4,0.55,0.7,0.85,0.18,0.33,0.62,0.78,0.05,0.48,0.91];
    flakeSeeds.forEach((s,i) => {
      const fX = (s*w + t*0.03*(i%3===0?1:-1)) % w;
      const fY = (i*28 + t*0.04*(1+(i%4)*0.3)) % fl;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(fX, fY, 2.5+i%2, 0, Math.PI*2); ctx.fill();
    });
  }

  else if (id === 'space') {
    // Fond espace
    ctx.fillStyle = '#000008'; ctx.fillRect(0,0,w,h);
    // Nébuleuse
    const neb = ctx.createRadialGradient(w*0.6,CH*0.3,10,w*0.6,CH*0.3,180);
    neb.addColorStop(0,'rgba(139,92,246,0.18)'); neb.addColorStop(0.5,'rgba(59,130,246,0.1)'); neb.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = neb; ctx.fillRect(0,0,w,h);
    const neb2 = ctx.createRadialGradient(w*0.2,CH*0.6,5,w*0.2,CH*0.6,120);
    neb2.addColorStop(0,'rgba(236,72,153,0.14)'); neb2.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = neb2; ctx.fillRect(0,0,w,h);
    // Étoiles
    const ss = [0.05,0.12,0.19,0.28,0.37,0.45,0.54,0.63,0.71,0.79,0.86,0.93,0.08,0.23,0.41,0.58,0.74,0.88,0.02,0.16,0.31];
    ss.forEach((s,i) => {
      const sx=s*w, sy=ss[(i+7)%21]*h;
      const tw=(Math.sin(t*0.004+i*0.9)+1)/2;
      ctx.fillStyle=`rgba(255,255,255,${0.5+tw*0.5})`;
      ctx.beginPath(); ctx.arc(sx,sy,1+tw,0,Math.PI*2); ctx.fill();
    });
    // Planète
    const planet = ctx.createRadialGradient(w*0.8-10,55,5,w*0.8,65,55);
    planet.addColorStop(0,'#7c3aed'); planet.addColorStop(0.6,'#4c1d95'); planet.addColorStop(1,'#1e0850');
    ctx.fillStyle = planet; ctx.beginPath(); ctx.arc(w*0.8, 65, 50, 0, Math.PI*2); ctx.fill();
    // Anneau
    ctx.strokeStyle = 'rgba(167,139,250,0.5)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(w*0.8, 65, 75, 20, -0.3, 0, Math.PI*2); ctx.stroke();
    // Étoile filante
    const cometPhase = (t*0.0003) % 1;
    if (cometPhase < 0.4) {
      const cx2 = cometPhase*2.5*w, cy2 = cometPhase*fl*0.8;
      const cGrad = ctx.createLinearGradient(cx2-60,cy2-30,cx2,cy2);
      cGrad.addColorStop(0,'rgba(255,255,255,0)'); cGrad.addColorStop(1,'rgba(255,255,255,0.8)');
      ctx.strokeStyle = cGrad; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx2-60,cy2-30); ctx.lineTo(cx2,cy2); ctx.stroke();
    }
    // Sol lunaire
    const moonSurf = ctx.createLinearGradient(0,fl,0,h);
    moonSurf.addColorStop(0,'#2a2a3a'); moonSurf.addColorStop(1,'#1a1a28');
    ctx.fillStyle = moonSurf; ctx.fillRect(0,fl,w,h-fl);
    // Cratères
    [[w*0.15,fl+15,18],[w*0.5,fl+25,12],[w*0.8,fl+12,22]].forEach(([crx,cry,crr]) => {
      ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(crx as number, cry as number, crr as number, (crr as number)*0.4, 0, 0, Math.PI*2); ctx.stroke();
    });
  }

  // ── SALON ──
  else if (id === 'salon') {
    const wallG = ctx.createLinearGradient(0, 0, 0, fl);
    wallG.addColorStop(0, '#1a1520'); wallG.addColorStop(1, '#120e18');
    ctx.fillStyle = wallG; ctx.fillRect(0, 0, w, fl);
    // Plancher bois
    ctx.fillStyle = '#3a2815'; ctx.fillRect(0, fl, w, h - fl);
    for (let i = 0; i < w; i += 50) { ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(i, fl); ctx.lineTo(i, h); ctx.stroke(); }
    // Tapis
    ctx.fillStyle = '#4a1a3a'; ctx.beginPath(); ctx.ellipse(w/2, fl+25, w*0.35, 18, 0, 0, Math.PI*2); ctx.fill();
    // Canapé
    ctx.fillStyle = '#3a2050'; ctx.fillRect(w*0.65, fl-80, 120, 60); ctx.fillRect(w*0.65-10, fl-80, 10, 80); ctx.fillRect(w*0.65+120, fl-80, 10, 80);
    ctx.fillStyle = '#4a2860'; ctx.fillRect(w*0.67, fl-75, 116, 20);
    // TV
    ctx.fillStyle = '#111'; ctx.fillRect(w*0.05, fl*0.2, 80, 50);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.strokeRect(w*0.05, fl*0.2, 80, 50);
    const tvG = ctx.createLinearGradient(w*0.05, fl*0.2, w*0.05+80, fl*0.2+50);
    tvG.addColorStop(0, `rgba(100,150,255,${0.15+Math.sin(t*0.003)*0.1})`); tvG.addColorStop(1, `rgba(50,100,200,${0.1+Math.sin(t*0.004)*0.08})`);
    ctx.fillStyle = tvG; ctx.fillRect(w*0.05+3, fl*0.2+3, 74, 44);
    // Lampe
    ctx.fillStyle = '#5a4020'; ctx.fillRect(w*0.9, fl-70, 6, 70);
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(w*0.9+3, fl-72, 12, Math.PI, 0); ctx.fill();
    const lampG = ctx.createRadialGradient(w*0.9+3, fl-60, 2, w*0.9+3, fl-30, 60);
    lampG.addColorStop(0,'rgba(251,191,36,0.2)'); lampG.addColorStop(1,'rgba(251,191,36,0)');
    ctx.fillStyle = lampG; ctx.beginPath(); ctx.ellipse(w*0.9+3, fl-30, 60, 50, 0, 0, Math.PI*2); ctx.fill();
  }

  // ── CUISINE ──
  else if (id === 'cuisine') {
    const wallG = ctx.createLinearGradient(0, 0, 0, fl);
    wallG.addColorStop(0, '#1a1a10'); wallG.addColorStop(1, '#14120a');
    ctx.fillStyle = wallG; ctx.fillRect(0, 0, w, fl);
    // Carrelage
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, fl, w, h - fl);
    for (let x2 = 0; x2 < w; x2 += 30) for (let y2 = fl; y2 < h; y2 += 30) {
      ctx.strokeStyle = '#d0c8b8'; ctx.lineWidth = 0.5; ctx.strokeRect(x2, y2, 30, 30);
    }
    // Comptoir
    ctx.fillStyle = '#5a4530'; ctx.fillRect(0, fl-50, w*0.4, 50);
    ctx.fillStyle = '#7a6040'; ctx.fillRect(0, fl-55, w*0.4, 8);
    // Frigo
    ctx.fillStyle = '#c0c8d0'; ctx.fillRect(w*0.78, fl-140, 60, 140);
    ctx.strokeStyle = '#a0a8b0'; ctx.lineWidth = 1.5; ctx.strokeRect(w*0.78, fl-140, 60, 80); ctx.strokeRect(w*0.78, fl-60, 60, 60);
    ctx.fillStyle = '#888'; ctx.fillRect(w*0.78+50, fl-100, 4, 20); ctx.fillRect(w*0.78+50, fl-40, 4, 15);
    // Gamelles
    ctx.fillStyle = '#e05050'; ctx.beginPath(); ctx.ellipse(w*0.25, fl+10, 22, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.ellipse(w*0.25, fl+7, 18, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.ellipse(w*0.4, fl+10, 22, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.ellipse(w*0.4, fl+7, 18, 6, 0, 0, Math.PI*2); ctx.fill();
    // Fenêtre
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(w*0.45, fl*0.15, 70, 55);
    ctx.strokeStyle = '#f0e8d0'; ctx.lineWidth = 4; ctx.strokeRect(w*0.45, fl*0.15, 70, 55);
    ctx.strokeStyle = '#f0e8d0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w*0.45+35, fl*0.15); ctx.lineTo(w*0.45+35, fl*0.15+55); ctx.moveTo(w*0.45, fl*0.15+27); ctx.lineTo(w*0.45+70, fl*0.15+27); ctx.stroke();
  }

  // ── SALLE DE BAIN ──
  else if (id === 'salleDeBain') {
    const wallG = ctx.createLinearGradient(0, 0, 0, fl);
    wallG.addColorStop(0, '#e8f0f8'); wallG.addColorStop(1, '#d0dce8');
    ctx.fillStyle = wallG; ctx.fillRect(0, 0, w, fl);
    // Carreaux bleus
    for (let x2 = 0; x2 < w; x2 += 25) for (let y2 = 0; y2 < fl; y2 += 25) {
      ctx.strokeStyle = 'rgba(100,160,220,0.15)'; ctx.lineWidth = 0.5; ctx.strokeRect(x2, y2, 25, 25);
    }
    // Sol carrelage blanc
    ctx.fillStyle = '#f0ece4'; ctx.fillRect(0, fl, w, h - fl);
    for (let x2 = 0; x2 < w; x2 += 35) for (let y2 = fl; y2 < h; y2 += 35) {
      ctx.strokeStyle = '#d8d0c8'; ctx.lineWidth = 0.5; ctx.strokeRect(x2, y2, 35, 35);
    }
    // Baignoire
    ctx.fillStyle = '#e8e4e0'; ctx.fillRect(w*0.6, fl-60, 100, 60);
    ctx.fillStyle = '#d0e8f8'; ctx.fillRect(w*0.62, fl-55, 96, 40);
    // Robinet
    ctx.fillStyle = '#b0b8c0'; ctx.fillRect(w*0.65, fl-80, 6, 25); ctx.beginPath(); ctx.arc(w*0.65+3, fl-80, 6, 0, Math.PI*2); ctx.fill();
    // Miroir
    ctx.fillStyle = 'rgba(180,210,240,0.4)'; ctx.fillRect(w*0.1, fl*0.15, 50, 65);
    ctx.strokeStyle = '#c0a870'; ctx.lineWidth = 3; ctx.strokeRect(w*0.1, fl*0.15, 50, 65);
    // Bulles
    for (let b = 0; b < 6; b++) {
      const bx = w*0.65 + Math.sin(t*0.002+b*1.3)*40 + b*12;
      const by = fl - 60 - Math.abs(Math.sin(t*0.0015+b*0.8))*30 - b*5;
      const br = 3 + Math.sin(t*0.003+b)*1.5;
      ctx.fillStyle = `rgba(200,230,255,${0.3+Math.sin(t*0.004+b)*0.15})`;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.fill();
    }
  }

  // ── CHAMBRE ──
  else if (id === 'chambre') {
    const wallG = ctx.createLinearGradient(0, 0, 0, fl);
    wallG.addColorStop(0, '#0a0818'); wallG.addColorStop(1, '#0e0c1a');
    ctx.fillStyle = wallG; ctx.fillRect(0, 0, w, fl);
    // Plancher
    ctx.fillStyle = '#2a2018'; ctx.fillRect(0, fl, w, h - fl);
    // Lit
    ctx.fillStyle = '#4a3020'; ctx.fillRect(w*0.55, fl-30, 130, 30);
    ctx.fillStyle = '#6a4530'; ctx.fillRect(w*0.55, fl-35, 130, 8);
    ctx.fillStyle = '#3050a0'; ctx.fillRect(w*0.57, fl-28, 126, 20);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(w*0.58, fl-26, 30, 16); ctx.fillRect(w*0.66, fl-26, 30, 16);
    // Étoiles par la fenêtre
    ctx.fillStyle = '#0a0828'; ctx.fillRect(w*0.08, fl*0.2, 65, 55);
    ctx.strokeStyle = '#3a3050'; ctx.lineWidth = 3; ctx.strokeRect(w*0.08, fl*0.2, 65, 55);
    for (let s2 = 0; s2 < 8; s2++) {
      const sx2 = w*0.08+5 + (s2%4)*15, sy2 = fl*0.2+5 + Math.floor(s2/4)*25;
      const tw = (Math.sin(t*0.003+s2*1.2)+1)/2;
      ctx.fillStyle = `rgba(255,255,255,${0.3+tw*0.5})`;
      ctx.beginPath(); ctx.arc(sx2, sy2, 1+tw, 0, Math.PI*2); ctx.fill();
    }
    // Lune dans la fenêtre
    ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.arc(w*0.08+50, fl*0.2+18, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0a0828'; ctx.beginPath(); ctx.arc(w*0.08+55, fl*0.2+15, 9, 0, Math.PI*2); ctx.fill();
    // Veilleuse
    const vG = ctx.createRadialGradient(w*0.9, fl-20, 2, w*0.9, fl-10, 40);
    vG.addColorStop(0, 'rgba(255,200,100,0.25)'); vG.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = vG; ctx.beginPath(); ctx.ellipse(w*0.9, fl-10, 40, 35, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(w*0.9, fl-20, 5, 0, Math.PI*2); ctx.fill();
    // Zzz
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#aaa'; ctx.font = '16px sans-serif';
    const zp = (t*0.0006)%1;
    ctx.fillText('z', w*0.45+zp*20, fl*0.3-zp*15);
    ctx.font = '12px sans-serif'; ctx.fillText('z', w*0.48+zp*15, fl*0.25-zp*12);
    ctx.globalAlpha = 1;
  }
}

// ─── Balle ─────────────────────────────────────────────────────────────────────
function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, decor: string) {
  const ballColor = decor === 'space' ? '#a855f7' : decor === 'winter' ? '#3b82f6' : '#ef4444';
  const ballG = ctx.createRadialGradient(x-r*0.3, y-r*0.3, r*0.1, x, y, r);
  ballG.addColorStop(0, '#fff');
  ballG.addColorStop(0.3, ballColor);
  ballG.addColorStop(1, dk(ballColor));
  ctx.fillStyle = ballG;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  // Reflet
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.ellipse(x-r*0.25, y-r*0.25, r*0.3, r*0.2, -0.5, 0, Math.PI*2); ctx.fill();
}

// ─── Dessin chien — style 3D réaliste sans contours ──────────────────────────
function drawDog(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, t: number,
  happy: boolean, hungry: boolean, thirsty: boolean, walkCycle: number, isWalking: boolean, headTilt: number, carrying: boolean) {

  const VL2 = vl(color);
  ctx.lineCap = 'round';

  const sph = (x: number, yy: number, r: number, col: string) => {
    const g = ctx.createRadialGradient(x - r*0.35, yy - r*0.35, r*0.05, x, yy, r);
    g.addColorStop(0, vl(col)); g.addColorStop(0.25, lt(col, 0.2));
    g.addColorStop(0.6, col); g.addColorStop(1, dk(col, 0.55)); return g;
  };
  const se = (col = color) => { ctx.strokeStyle = dk(col, 0.55); ctx.lineWidth = 1.2; ctx.stroke(); };
  const shadow = (x: number, yy: number, rx: number, ry: number) => {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(x+1.5, yy+2.5, rx+1, ry+1, 0, 0, Math.PI*2); ctx.fill();
  };
  const highlight = (x: number, yy: number, rx: number, ry: number) => {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath(); ctx.ellipse(x-rx*0.28, yy-ry*0.3, rx*0.45, ry*0.32, -0.35, 0, Math.PI*2); ctx.fill();
  };

  const swing = isWalking ? Math.sin(walkCycle * Math.PI * 2) : 0;
  const bob = isWalking ? Math.abs(Math.sin(walkCycle * Math.PI * 2)) * -5 : Math.sin(t * 0.002) * 2.5;
  const y = cy + bob;
  const tailSwing = Math.sin(t * (happy ? 0.013 : 0.004)) * (happy ? 2.2 : 0.7);

  // QUEUE
  ctx.save(); ctx.translate(cx - 22, y + 36);
  const txTip = -30 + Math.cos(tailSwing)*28, tyTip = -56 + Math.sin(tailSwing)*32;
  ctx.strokeStyle = dk(color, 0.5); ctx.lineWidth = 20;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-18+Math.cos(tailSwing)*16, -28+Math.sin(tailSwing)*18, txTip, tyTip); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 16;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-18+Math.cos(tailSwing)*16, -28+Math.sin(tailSwing)*18, txTip, tyTip); ctx.stroke();
  ctx.strokeStyle = lt(color, 0.35); ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-18+Math.cos(tailSwing)*16, -28+Math.sin(tailSwing)*18, txTip, tyTip); ctx.stroke();
  ctx.strokeStyle = vl(color); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(txTip*0.4, tyTip*0.4); ctx.lineTo(txTip, tyTip); ctx.stroke();
  ctx.restore();

  // JAMBES
  [[-15, -swing*0.35], [15, swing*0.35]].forEach(([ox, rot]) => {
    ctx.save(); ctx.translate(cx + ox, y + 22); ctx.rotate(rot);
    shadow(0, 18, 15, 26);
    ctx.fillStyle = sph(0, 18, 16, color);
    ctx.beginPath(); ctx.ellipse(0, 18, 15, 26, 0, 0, Math.PI*2); ctx.fill(); se();
    highlight(0, 18, 15, 26);
    shadow(2, 62, 18, 11);
    const fg = ctx.createRadialGradient(-3, 57, 2, 2, 62, 18);
    fg.addColorStop(0, vl(color)); fg.addColorStop(1, dk(color, 0.35));
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.ellipse(2, 62, 18, 11, 0.15, 0, Math.PI*2); ctx.fill(); se();
    for (let oi=0; oi<3; oi++) { ctx.fillStyle=sph(2+(oi-1)*6,69,5.5,color); ctx.beginPath(); ctx.ellipse(2+(oi-1)*6, 69, 5.5, 4.5, 0, 0, Math.PI*2); ctx.fill(); se(); }
    ctx.restore();
  });

  // BRAS GAUCHE (derrière)
  ctx.save(); ctx.translate(cx - 36, y - 28); ctx.rotate(swing * 0.48 + 0.18);
  shadow(0, 14, 14, 28);
  ctx.fillStyle = sph(0, 14, 16, color);
  ctx.beginPath(); ctx.ellipse(0, 14, 14, 28, 0.2, 0, Math.PI*2); ctx.fill(); se();
  highlight(0, 14, 14, 28);
  shadow(2, 40, 14, 10);
  const pg1 = ctx.createRadialGradient(-2, 36, 2, 2, 40, 14);
  pg1.addColorStop(0, vl(color)); pg1.addColorStop(1, dk(color, 0.35));
  ctx.fillStyle = pg1; ctx.beginPath(); ctx.ellipse(2, 40, 14, 10, 0.1, 0, Math.PI*2); ctx.fill(); se();
  ctx.restore();

  // CORPS
  shadow(cx, y - 5, 40, 50);
  const bodyG = ctx.createRadialGradient(cx - 14, y - 26, 8, cx, y - 5, 52);
  bodyG.addColorStop(0, lt(color, 0.55)); bodyG.addColorStop(0.28, lt(color, 0.2));
  bodyG.addColorStop(0.6, color); bodyG.addColorStop(1, dk(color, 0.55));
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.ellipse(cx, y - 5, 40, 50, 0, 0, Math.PI*2); ctx.fill(); se();
  const bellyG = ctx.createRadialGradient(cx, y + 8, 2, cx, y + 8, 32);
  bellyG.addColorStop(0, VL2); bellyG.addColorStop(0.55, lt(color, 0.25)); bellyG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bellyG; ctx.beginPath(); ctx.ellipse(cx, y + 8, 26, 34, 0, 0, Math.PI*2); ctx.fill();
  highlight(cx, y - 5, 40, 50);
  // Rim light
  const rimB = ctx.createRadialGradient(cx + 40, y - 8, 32, cx, y - 5, 42);
  rimB.addColorStop(0, 'rgba(255,255,255,0)'); rimB.addColorStop(0.84, 'rgba(255,255,255,0)'); rimB.addColorStop(1, 'rgba(255,255,255,0.18)');
  ctx.fillStyle = rimB; ctx.beginPath(); ctx.ellipse(cx, y - 5, 40, 50, 0, 0, Math.PI*2); ctx.fill();

  if (carrying) {
    const bg2 = ctx.createRadialGradient(cx+30, y-18, 2, cx+30, y-18, 12);
    bg2.addColorStop(0,'#fff'); bg2.addColorStop(0.4,'#ef4444'); bg2.addColorStop(1,'#991b1b');
    ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(cx+30, y-18, 12, 0, Math.PI*2); ctx.fill(); se();
  }

  // BRAS DROIT (devant)
  ctx.save(); ctx.translate(cx + 36, y - 28); ctx.rotate(-swing * 0.48 - 0.18);
  shadow(0, 14, 14, 28);
  ctx.fillStyle = sph(0, 14, 16, color);
  ctx.beginPath(); ctx.ellipse(0, 14, 14, 28, -0.2, 0, Math.PI*2); ctx.fill(); se();
  highlight(0, 14, 14, 28);
  shadow(-2, 40, 14, 10);
  const pg2 = ctx.createRadialGradient(2, 36, 2, -2, 40, 14);
  pg2.addColorStop(0, vl(color)); pg2.addColorStop(1, dk(color, 0.35));
  ctx.fillStyle = pg2; ctx.beginPath(); ctx.ellipse(-2, 40, 14, 10, -0.1, 0, Math.PI*2); ctx.fill(); se();
  ctx.restore();

  // ── TÊTE
  ctx.save(); ctx.translate(cx, y - 100); ctx.rotate(headTilt);

  // OREILLES TOMBANTES
  [-1, 1].forEach(sx => {
    const earG = ctx.createRadialGradient(sx*16, 6, 3, sx*18, 28, 42);
    earG.addColorStop(0, lt(dk(color), 0.28)); earG.addColorStop(0.45, dk(color)); earG.addColorStop(1, dk(dk(color), 0.45));
    ctx.fillStyle = earG;
    ctx.beginPath();
    ctx.moveTo(sx*20, -14); ctx.bezierCurveTo(sx*28, 14, sx*26, 52, sx*16, 64);
    ctx.bezierCurveTo(sx*8, 70, sx*-2, 70, sx*-6, 64);
    ctx.bezierCurveTo(sx*-18, 52, sx*-18, 14, sx*-8, -14);
    ctx.closePath(); ctx.fill(); se(dk(color));
    // Intérieur rosé
    const earInG = ctx.createLinearGradient(sx*8, -5, sx*10, 50);
    earInG.addColorStop(0, 'rgba(220,155,155,0.42)'); earInG.addColorStop(0.5, 'rgba(210,130,130,0.48)'); earInG.addColorStop(1, 'rgba(190,110,110,0.28)');
    ctx.fillStyle = earInG;
    ctx.beginPath();
    ctx.moveTo(sx*12, -8); ctx.bezierCurveTo(sx*18, 14, sx*16, 44, sx*9, 52);
    ctx.bezierCurveTo(sx*5, 58, sx*-1, 58, sx*-3, 52);
    ctx.bezierCurveTo(sx*-11, 44, sx*-11, 14, sx*-4, -8);
    ctx.closePath(); ctx.fill();
  });

  // TÊTE
  shadow(0, 0, 64, 64);
  const headG = ctx.createRadialGradient(-24, -28, 6, 0, 0, 66);
  headG.addColorStop(0, lt(color, 0.58)); headG.addColorStop(0.22, lt(color, 0.22));
  headG.addColorStop(0.58, color); headG.addColorStop(1, dk(color, 0.55));
  ctx.fillStyle = headG; ctx.beginPath(); ctx.arc(0, 0, 64, 0, Math.PI*2); ctx.fill(); se();
  highlight(0, 0, 64, 64);
  const rimH = ctx.createRadialGradient(40, 16, 48, 0, 0, 66);
  rimH.addColorStop(0, 'rgba(255,255,255,0)'); rimH.addColorStop(0.84, 'rgba(255,255,255,0)'); rimH.addColorStop(1, 'rgba(255,255,255,0.2)');
  ctx.fillStyle = rimH; ctx.beginPath(); ctx.arc(0, 0, 64, 0, Math.PI*2); ctx.fill();

  // MUSEAU
  shadow(0, 26, 35, 26);
  const muzzG = ctx.createRadialGradient(-10, 16, 5, 0, 26, 36);
  muzzG.addColorStop(0, VL2); muzzG.addColorStop(0.42, lt(color, 0.32)); muzzG.addColorStop(1, color);
  ctx.fillStyle = muzzG; ctx.beginPath(); ctx.ellipse(0, 26, 35, 26, 0, 0, Math.PI*2); ctx.fill(); se();
  highlight(0, 26, 35, 26);

  // TRUFFE glossy
  shadow(0, 14, 17, 12);
  const noseG = ctx.createRadialGradient(-7, 9, 3, 0, 14, 19);
  noseG.addColorStop(0, '#5a4640'); noseG.addColorStop(0.3, '#2a1010'); noseG.addColorStop(0.65, '#1a0808'); noseG.addColorStop(1, '#060202');
  ctx.fillStyle = noseG; ctx.beginPath(); ctx.ellipse(0, 14, 17, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#030101'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.beginPath(); ctx.ellipse(-8, 7, 8, 5.5, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.beginPath(); ctx.ellipse(7, 14, 4, 3, 0.3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(-2, 19, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.beginPath(); ctx.ellipse(-5, 18, 4.5, 3, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5, 18, 4.5, 3, 0.3, 0, Math.PI*2); ctx.fill();

  // YEUX
  const blink = Math.sin(t*0.0019) > 0.97 ? 0.08 : 1;
  [[-24, -15], [24, -15]].forEach(([ex, ey]) => {
    shadow(ex, ey, 22, 22*blink);
    const ewG = ctx.createRadialGradient(ex-7, ey-7, 1, ex, ey, 23);
    ewG.addColorStop(0, '#ffffff'); ewG.addColorStop(0.55, '#f8f4ea'); ewG.addColorStop(1, '#ddd4c0');
    ctx.fillStyle = ewG; ctx.beginPath(); ctx.ellipse(ex, ey, 22, 22*blink, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = dk(color, 0.5); ctx.lineWidth = 1; ctx.stroke();
    // Ombre paupière
    const eyeSh = ctx.createLinearGradient(ex, ey-23, ex, ey-8);
    eyeSh.addColorStop(0, 'rgba(0,0,0,0.18)'); eyeSh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eyeSh; ctx.beginPath(); ctx.ellipse(ex, ey, 22, 22*blink, 0, 0, Math.PI*2); ctx.fill();
    // Iris
    const iG = ctx.createRadialGradient(ex-4, ey-4, 1, ex, ey, 16);
    iG.addColorStop(0, '#F8C870'); iG.addColorStop(0.25, '#E09040'); iG.addColorStop(0.5, '#8B4513'); iG.addColorStop(0.78, '#5C2808'); iG.addColorStop(1, '#280E00');
    ctx.fillStyle = iG; ctx.beginPath(); ctx.ellipse(ex, ey, 15, 15*blink, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#1a0800'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.ellipse(ex, ey, happy ? 7 : 4.5, 10*blink, 0, 0, Math.PI*2); ctx.fill();
    if (blink > 0.5) {
      ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.beginPath(); ctx.ellipse(ex-7, ey-7, 7.5, 5.5, -0.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(ex+8, ey+7, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.arc(ex-2, ey+10, 2, 0, Math.PI*2); ctx.fill();
    }
    // Paupière supérieure
    ctx.strokeStyle = dk(color, 0.45); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ex, ey, 22, Math.PI*1.05, Math.PI*1.95); ctx.stroke();
  });

  // Sourcils
  ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.strokeStyle = dk(color, 0.6);
  if (hungry && !happy) {
    ctx.beginPath(); ctx.moveTo(-37,-34); ctx.quadraticCurveTo(-24,-30,-12,-36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(37,-34); ctx.quadraticCurveTo(24,-30,12,-36); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-38,-38); ctx.quadraticCurveTo(-24,-46,-11,-38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(38,-38); ctx.quadraticCurveTo(24,-46,11,-38); ctx.stroke();
  }

  // Bouche
  if (hungry && !happy) {
    ctx.strokeStyle = dk(color, 0.6); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 36, 13, Math.PI*0.2, Math.PI*0.8, true); ctx.stroke();
  } else {
    ctx.fillStyle = '#2a0505';
    ctx.beginPath(); ctx.arc(-8, 33, 12, 0, Math.PI); ctx.arc(8, 33, 12, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = dk(color, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-8, 33, 12, 0, Math.PI); ctx.moveTo(8, 33); ctx.arc(8, 33, 12, 0, Math.PI); ctx.stroke();
  }

  // Langue
  if (!carrying && (thirsty || (happy && Math.sin(t*0.003) > 0.4))) {
    const tongueG = ctx.createRadialGradient(-2, 46, 3, 0, 50, 16);
    tongueG.addColorStop(0, '#FFB8CC'); tongueG.addColorStop(0.5, '#f87171'); tongueG.addColorStop(1, '#C84060');
    ctx.fillStyle = tongueG; ctx.beginPath(); ctx.ellipse(0, 48, 11, 16, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#A03050'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = '#B03050'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 36); ctx.lineTo(0, 60); ctx.stroke();
  }

  ctx.restore();
}

// ─── Dessin chat — style 3D réaliste type Talking Tom sans contours ──────────
function drawCat(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, t: number,
  happy: boolean, hungry: boolean, thirsty: boolean, walkCycle: number, isWalking: boolean, headTilt: number, carrying: boolean) {

  const FUR = color;
  const BELLY = vl(color);
  ctx.lineCap = 'round';

  const sph = (x: number, yy: number, r: number, col: string) => {
    const g = ctx.createRadialGradient(x - r*0.35, yy - r*0.35, r*0.05, x, yy, r);
    g.addColorStop(0, vl(col)); g.addColorStop(0.25, lt(col, 0.2));
    g.addColorStop(0.6, col); g.addColorStop(1, dk(col, 0.55)); return g;
  };
  const se = (col = FUR) => { ctx.strokeStyle = dk(col, 0.5); ctx.lineWidth = 1.2; ctx.stroke(); };
  const shadow = (x: number, yy: number, rx: number, ry: number) => {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(x+1.5, yy+2.5, rx+1, ry+1, 0, 0, Math.PI*2); ctx.fill();
  };
  const highlight = (x: number, yy: number, rx: number, ry: number) => {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath(); ctx.ellipse(x-rx*0.28, yy-ry*0.3, rx*0.45, ry*0.32, -0.35, 0, Math.PI*2); ctx.fill();
  };

  const swing = isWalking ? Math.sin(walkCycle * Math.PI * 2) : 0;
  const bob = isWalking ? Math.abs(Math.sin(walkCycle * Math.PI * 2)) * -9 : Math.sin(t * 0.0018) * 2.5;
  const breathe = isWalking ? 0 : Math.sin(t * 0.0016) * 2;
  const y = cy + bob;
  const tc = Math.sin(t * 0.0025 + (isWalking ? walkCycle * Math.PI : 0));

  // QUEUE
  const qSwing = Math.sin(t * (happy ? 0.01 : 0.004)) * (happy ? 1.5 : 0.7);
  const qTipX = cx - 50 + tc*22 + Math.sin(qSwing)*12;
  const qTipY = y - 72 + Math.cos(qSwing)*10;
  ctx.strokeStyle = dk(FUR, 0.5); ctx.lineWidth = 20;
  ctx.beginPath(); ctx.moveTo(cx - 20, y + 22);
  ctx.bezierCurveTo(cx - 60 + tc*12, y + 4, cx - 68 + tc*18, y - 38, qTipX, qTipY); ctx.stroke();
  ctx.strokeStyle = FUR; ctx.lineWidth = 15;
  ctx.beginPath(); ctx.moveTo(cx - 20, y + 22);
  ctx.bezierCurveTo(cx - 60 + tc*12, y + 4, cx - 68 + tc*18, y - 38, qTipX, qTipY); ctx.stroke();
  ctx.strokeStyle = lt(FUR, 0.32); ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(cx - 20, y + 22);
  ctx.bezierCurveTo(cx - 60 + tc*12, y + 4, cx - 68 + tc*18, y - 38, qTipX, qTipY); ctx.stroke();
  ctx.strokeStyle = vl(FUR); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 62 + tc*16, y - 52); ctx.lineTo(qTipX, qTipY); ctx.stroke();

  // JAMBES
  [[-13, -swing*0.3], [13, swing*0.3]].forEach(([ox, rot]) => {
    ctx.save(); ctx.translate(cx + ox, y + 20); ctx.rotate(rot);
    shadow(0, 10, 13, 18);
    ctx.fillStyle = sph(0, 10, 16, FUR);
    ctx.beginPath(); ctx.ellipse(0, 10, 13, 18, 0, 0, Math.PI*2); ctx.fill(); se();
    highlight(0, 10, 13, 18);
    shadow(2, 32, 17, 11);
    const fg = ctx.createRadialGradient(-2, 28, 2, 2, 32, 16);
    fg.addColorStop(0, vl(FUR)); fg.addColorStop(1, dk(FUR, 0.32));
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.ellipse(2, 32, 17, 11, 0.15, 0, Math.PI*2); ctx.fill(); se();
    for (let oi=0; oi<3; oi++) { ctx.fillStyle=sph(2+(oi-1)*6, 40, 5.5, FUR); ctx.beginPath(); ctx.ellipse(2+(oi-1)*6, 40, 5.5, 4.5, 0, 0, Math.PI*2); ctx.fill(); se(); }
    ctx.restore();
  });

  // BRAS GAUCHE (derrière)
  ctx.save(); ctx.translate(cx - 32, y - 20); ctx.rotate(swing * 0.5 + 0.1);
  shadow(0, 14, 12, 28);
  ctx.fillStyle = sph(0, 14, 16, FUR);
  ctx.beginPath(); ctx.ellipse(0, 14, 12, 28, 0.15, 0, Math.PI*2); ctx.fill(); se();
  highlight(0, 14, 12, 28);
  shadow(1, 44, 12, 11);
  const pawLG = ctx.createRadialGradient(-1, 40, 2, 1, 44, 12);
  pawLG.addColorStop(0, vl(FUR)); pawLG.addColorStop(1, dk(FUR, 0.32));
  ctx.fillStyle = pawLG;
  ctx.beginPath(); ctx.ellipse(1, 44, 12, 11, 0, 0, Math.PI*2); ctx.fill(); se();
  ctx.restore();

  // CORPS
  const bW = 28 + breathe * 0.4; const bH = 34 + breathe * 0.6;
  shadow(cx, y - 5, bW, bH);
  const bodyG = ctx.createRadialGradient(cx - 12, y - 20, 6, cx, y - 5, 48);
  bodyG.addColorStop(0, lt(FUR, 0.52)); bodyG.addColorStop(0.28, lt(FUR, 0.2));
  bodyG.addColorStop(0.6, FUR); bodyG.addColorStop(1, dk(FUR, 0.55));
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.ellipse(cx, y - 5, bW, bH, 0, 0, Math.PI*2); ctx.fill(); se();
  const bellyG = ctx.createRadialGradient(cx, y + 6, 2, cx, y + 6, 28);
  bellyG.addColorStop(0, vl(FUR)); bellyG.addColorStop(0.5, lt(FUR, 0.22)); bellyG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bellyG;
  ctx.beginPath(); ctx.ellipse(cx, y + 6, bW - 6, bH - 4, 0, 0, Math.PI*2); ctx.fill();
  highlight(cx, y - 5, bW, bH);
  const rimB = ctx.createRadialGradient(cx + bW*0.6, y - bH*0.15, bW*0.5, cx, y - 5, bW);
  rimB.addColorStop(0, 'rgba(255,255,255,0)'); rimB.addColorStop(0.84, 'rgba(255,255,255,0)'); rimB.addColorStop(1, 'rgba(255,255,255,0.18)');
  ctx.fillStyle = rimB; ctx.beginPath(); ctx.ellipse(cx, y - 5, bW, bH, 0, 0, Math.PI*2); ctx.fill();

  if (carrying) {
    const bg2 = ctx.createRadialGradient(cx+28, y-18, 2, cx+28, y-18, 10);
    bg2.addColorStop(0,'#fff'); bg2.addColorStop(0.4,'#ef4444'); bg2.addColorStop(1,'#991b1b');
    ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(cx+28, y-18, 10, 0, Math.PI*2); ctx.fill(); se();
  }

  // BRAS DROIT (devant)
  ctx.save(); ctx.translate(cx + 32, y - 20); ctx.rotate(-swing * 0.5 - 0.1);
  shadow(0, 14, 12, 28);
  ctx.fillStyle = sph(0, 14, 16, FUR);
  ctx.beginPath(); ctx.ellipse(0, 14, 12, 28, -0.15, 0, Math.PI*2); ctx.fill(); se();
  highlight(0, 14, 12, 28);
  shadow(-1, 44, 12, 11);
  const pawRG = ctx.createRadialGradient(1, 40, 2, -1, 44, 12);
  pawRG.addColorStop(0, vl(FUR)); pawRG.addColorStop(1, dk(FUR, 0.32));
  ctx.fillStyle = pawRG;
  ctx.beginPath(); ctx.ellipse(-1, 44, 12, 11, 0, 0, Math.PI*2); ctx.fill(); se();
  ctx.restore();

  // ── TÊTE (radius 74 — très grosse)
  ctx.save(); ctx.translate(cx, y - 88); ctx.rotate(headTilt);

  // OREILLES
  [-1, 1].forEach(sx => {
    const earG = ctx.createRadialGradient(sx*28, -48, 4, sx*38, -38, 50);
    earG.addColorStop(0, lt(FUR, 0.38)); earG.addColorStop(0.45, FUR); earG.addColorStop(1, dk(FUR, 0.48));
    ctx.fillStyle = earG;
    ctx.beginPath();
    ctx.moveTo(sx * 22, -24);
    ctx.quadraticCurveTo(sx * 56, -96, sx * 72, -26);
    ctx.closePath(); ctx.fill(); se();
    const earInG = ctx.createLinearGradient(sx*30, -84, sx*52, -28);
    earInG.addColorStop(0, '#F0A8A8'); earInG.addColorStop(0.5, '#E87878'); earInG.addColorStop(1, '#D06060');
    ctx.fillStyle = earInG;
    ctx.beginPath();
    ctx.moveTo(sx * 30, -30);
    ctx.quadraticCurveTo(sx * 52, -80, sx * 66, -32);
    ctx.closePath(); ctx.fill();
    // Lumière
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(sx * 24, -26);
    ctx.quadraticCurveTo(sx * 40, -88, sx * 50, -40);
    ctx.closePath(); ctx.fill();
  });

  // TÊTE
  shadow(0, 0, 74, 74);
  const headG = ctx.createRadialGradient(-26, -28, 6, 0, 0, 76);
  headG.addColorStop(0, lt(FUR, 0.58)); headG.addColorStop(0.22, lt(FUR, 0.22));
  headG.addColorStop(0.58, FUR); headG.addColorStop(1, dk(FUR, 0.55));
  ctx.fillStyle = headG; ctx.beginPath(); ctx.arc(0, 0, 74, 0, Math.PI*2); ctx.fill(); se();
  highlight(0, 0, 74, 74);
  const rimH = ctx.createRadialGradient(44, 18, 54, 0, 0, 76);
  rimH.addColorStop(0, 'rgba(255,255,255,0)'); rimH.addColorStop(0.84, 'rgba(255,255,255,0)'); rimH.addColorStop(1, 'rgba(255,255,255,0.22)');
  ctx.fillStyle = rimH; ctx.beginPath(); ctx.arc(0, 0, 74, 0, Math.PI*2); ctx.fill();

  // MUSEAU
  shadow(0, 34, 48, 35);
  const muzzG = ctx.createRadialGradient(-14, 22, 5, 0, 34, 48);
  muzzG.addColorStop(0, vl(FUR)); muzzG.addColorStop(0.35, lt(FUR, 0.38)); muzzG.addColorStop(1, FUR);
  ctx.fillStyle = muzzG;
  ctx.beginPath(); ctx.ellipse(0, 34, 48, 35, 0, 0, Math.PI*2); ctx.fill(); se();
  highlight(0, 34, 48, 35);

  // Joues Talking Tom — rondes, claires, simples
  [-1, 1].forEach(sx => {
    const cheekG = ctx.createRadialGradient(sx*44, 20, 5, sx*50, 26, 30);
    cheekG.addColorStop(0, vl(FUR)); cheekG.addColorStop(0.6, lt(FUR, 0.3)); cheekG.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = cheekG;
    ctx.beginPath(); ctx.ellipse(sx * 50, 26, 30, 24, 0, 0, Math.PI*2); ctx.fill();
    // Blush subtil
    ctx.fillStyle = 'rgba(255,120,120,0.18)';
    ctx.beginPath(); ctx.ellipse(sx * 52, 30, 16, 12, 0, 0, Math.PI*2); ctx.fill();
  });

  // YEUX
  const blink = Math.sin(t * 0.0017) > 0.97 ? 0.07 : 1;
  [[-29, -17], [29, -17]].forEach(([ex, ey]) => {
    shadow(ex, ey, 27, 27*blink);
    const eyeWG = ctx.createRadialGradient(ex-8, ey-8, 1, ex, ey, 28);
    eyeWG.addColorStop(0, '#ffffff'); eyeWG.addColorStop(0.55, '#f8f6f0'); eyeWG.addColorStop(1, '#e0dcd2');
    ctx.fillStyle = eyeWG;
    ctx.beginPath(); ctx.ellipse(ex, ey, 27, 27 * blink, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = dk(FUR, 0.45); ctx.lineWidth = 1; ctx.stroke();
    // Ombre paupière
    const eyeSh = ctx.createLinearGradient(ex, ey-28, ex, ey-10);
    eyeSh.addColorStop(0, 'rgba(0,0,0,0.2)'); eyeSh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eyeSh; ctx.beginPath(); ctx.ellipse(ex, ey, 27, 27*blink, 0, 0, Math.PI*2); ctx.fill();
    // Iris vert détaillé
    const iG = ctx.createRadialGradient(ex-5, ey-5, 1, ex, ey, 20);
    iG.addColorStop(0,'#C0FFD8'); iG.addColorStop(0.2,'#50F080'); iG.addColorStop(0.45,'#1AAD48'); iG.addColorStop(0.72,'#0A7030'); iG.addColorStop(1,'#042810');
    ctx.fillStyle = iG;
    ctx.beginPath(); ctx.ellipse(ex, ey, 20, 20 * blink, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#032010'; ctx.lineWidth = 1.2; ctx.stroke();
    // Pupille
    ctx.fillStyle = '#050505';
    ctx.beginPath(); ctx.ellipse(ex, ey, happy ? 8 : 5, 16 * blink, 0, 0, Math.PI*2); ctx.fill();
    if (blink > 0.5) {
      ctx.fillStyle = 'rgba(255,255,255,0.97)';
      ctx.beginPath(); ctx.ellipse(ex-10, ey-10, 10, 7.5, -0.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.beginPath(); ctx.arc(ex+11, ey+9, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(ex-3, ey+13, 2.5, 0, Math.PI*2); ctx.fill();
    }
    // Paupière supérieure
    ctx.strokeStyle = dk(FUR, 0.45); ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(ex, ey, 27, Math.PI*1.02, Math.PI*1.98); ctx.stroke();
  });

  // Sourcils
  ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  ctx.strokeStyle = dk(FUR, 0.55);
  [[-29, -48], [29, -48]].forEach(([bx, by]) => {
    const tilt = bx < 0 ? (hungry ? 0.6 : -0.25) : (hungry ? -0.6 : 0.25);
    ctx.save(); ctx.translate(bx, by); ctx.rotate(tilt);
    ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(0, -12, 18, 0); ctx.stroke();
    ctx.restore();
  });

  // NEZ glossy
  shadow(0, 20, 20, 16);
  const noseG = ctx.createRadialGradient(-7, 14, 3, 0, 20, 22);
  noseG.addColorStop(0, happy ? '#FF8080' : '#F06060');
  noseG.addColorStop(0.35, happy ? '#E05555' : '#CC3838');
  noseG.addColorStop(1, '#701818');
  ctx.fillStyle = noseG;
  ctx.beginPath(); ctx.ellipse(0, 20, 20, 16, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#500c0c'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.beginPath(); ctx.ellipse(-9, 12, 10, 7, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.ellipse(7, 17, 5, 3.5, 0.3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(-3, 26, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(-7, 26, 5, 3.5, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7, 26, 5, 3.5, 0.3, 0, Math.PI*2); ctx.fill();

  // Moustaches
  const wAnim = Math.sin(t * 0.002) * 0.06;
  [-1, 1].forEach(side => {
    ctx.lineCap = 'round';
    [-0.2 + wAnim, 0.06, 0.32 - wAnim].forEach((angle, i) => {
      ctx.strokeStyle = color === '#3a3a3a' ? `rgba(220,220,220,${0.7-i*0.12})` : `rgba(70,50,30,${0.6-i*0.12})`;
      ctx.lineWidth = 2.5 - i*0.5;
      ctx.save(); ctx.translate(side * 24, 34); ctx.rotate(angle + (side < 0 ? Math.PI : 0));
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(68, 0); ctx.stroke(); ctx.restore();
    });
  });

  // BOUCHE simple
  ctx.lineCap = 'round';
  ctx.strokeStyle = dk(FUR, 0.4); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(0, 44); ctx.stroke();
  if (hungry && !happy) {
    ctx.strokeStyle = dk(FUR, 0.45); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-14, 52, 12, 0, Math.PI, true); ctx.stroke();
    ctx.beginPath(); ctx.arc(14, 52, 12, 0, Math.PI, true); ctx.stroke();
  } else {
    // Sourire — 2 arcs
    ctx.strokeStyle = dk(FUR, 0.45); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(-12, 44, 12, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(12, 44, 12, 0, Math.PI); ctx.stroke();
  }

  // Langue
  if (!carrying && (thirsty || (happy && Math.sin(t * 0.003) > 0.4))) {
    const tongueG = ctx.createRadialGradient(-2, 72, 3, 0, 76, 18);
    tongueG.addColorStop(0, '#FFB8CC'); tongueG.addColorStop(0.5, '#f87171'); tongueG.addColorStop(1, '#C84060');
    ctx.fillStyle = tongueG;
    ctx.beginPath(); ctx.ellipse(0, 76, 14, 20, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#A03050'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = '#B03050'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(0, 90); ctx.stroke();
  }

  ctx.restore();
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
function PetCanvas({ type, color, hunger, thirst, decor, stage }: { type:'dog'|'cat'; color:string; hunger:number; thirst:number; decor:string; stage?:string; }) {
  const containerRef = useRef<any>(null);
  const earnCoins = useStore(s => s.earnCoins);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const container = containerRef.current; if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = CW; canvas.height = CH;
    Object.assign(canvas.style, { width:'100%', height:'100%', cursor:'crosshair' });
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    // Charger sprites PNG (chat = sprites multiples, chien = fallback canvas)
    const catSprites: Record<string, any> = {};
    let spritesLoaded = 0;
    const totalSprites = type === 'cat' ? 20 : 0;
    const imgLoaded = () => spritesLoaded >= totalSprites && totalSprites > 0;

    if (type === 'cat') {
      const spriteMap: Record<string, any> = {
        stand: require('../../assets/cat_stand.png'),
        walk1: require('../../assets/cat_walk1.png'),
        walk2: require('../../assets/cat_walk2.png'),
        happy: require('../../assets/cat_happy.png'),
        sit: require('../../assets/cat_sit.png'),
        look: require('../../assets/cat_look.png'),
        lay: require('../../assets/cat_lay.png'),
        wave: require('../../assets/cat_wave.png'),
        run1: require('../../assets/cat_run1.png'),
        run2: require('../../assets/cat_run2.png'),
        excited: require('../../assets/cat_excited.png'),
        curious: require('../../assets/cat_curious.png'),
        bye: require('../../assets/cat_bye.png'),
        shout: require('../../assets/cat_shout.png'),
        angry: require('../../assets/cat_angry.png'),
        surprised: require('../../assets/cat_surprised.png'),
        love: require('../../assets/cat_love.png'),
        think: require('../../assets/cat_think.png'),
        roar: require('../../assets/cat_roar.png'),
        dizzy: require('../../assets/cat_dizzy.png'),
      };
      Object.entries(spriteMap).forEach(([key, asset]) => {
        const img = new (window as any).Image();
        img.crossOrigin = 'anonymous';
        img.src = typeof asset === 'string' ? asset : (asset && asset.uri ? asset.uri : String(asset));
        img.onload = () => { spritesLoaded++; };
        catSprites[key] = img;
      });
    }

    const happy = (hunger+thirst)/2 > 65;
    const isHungry = hunger < 30;
    const isThirsty = thirst < 30;

    // — État —
    const petX = CW/2;
    const petY = FLOOR_Y - 50;
    let walkCycle = 0;
    let headTilt = 0, headTiltDir = 1;
    let heartPhase = 0;

    // Changement automatique de pose
    type Pose = 'stand' | 'wave' | 'happy' | 'excited' | 'love' | 'surprised' | 'bye' | 'curious' | 'think' | 'roar' | 'sit' | 'look';
    let currentPose: Pose = 'stand';
    let poseStart = 0;
    let nextPoseTime = 3000 + Math.random() * 4000;

    const idlePoses: Pose[] = ['stand', 'curious', 'think', 'sit', 'look', 'stand', 'stand'];
    const happyPoses: Pose[] = ['happy', 'excited', 'love', 'wave', 'bye', 'stand', 'happy'];

    canvas.addEventListener('click', () => {
      const allPoses: Pose[] = ['wave', 'happy', 'excited', 'love', 'surprised', 'roar'];
      currentPose = allPoses[Math.floor(Math.random() * allPoses.length)];
      poseStart = performance.now();
      nextPoseTime = poseStart + 2500 + Math.random() * 2000;
    });

    let raf: number;
    const start = performance.now();

    const frame = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0,0,CW,CH);

      // Changement autonome de pose
      if (now > nextPoseTime) {
        const poses = happy ? happyPoses : (isHungry || isThirsty) ? ['shout', 'look', 'lay', 'look'] as Pose[] : idlePoses;
        currentPose = poses[Math.floor(Math.random() * poses.length)];
        poseStart = now;
        nextPoseTime = now + 3000 + Math.random() * 4000;
      }

      // — Décor —
      drawDecor(ctx, CW, CH, decor, elapsed);

      // — Ombre —
      const shG = ctx.createRadialGradient(petX, FLOOR_Y+2, 4, petX, FLOOR_Y+2, 58);
      shG.addColorStop(0,'rgba(0,0,0,0.28)'); shG.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=shG; ctx.beginPath(); ctx.ellipse(petX, FLOOR_Y+4, 56, 14, 0, 0, Math.PI*2); ctx.fill();

      // — Animal —
      ctx.save();
      const isMoving = false;
      const stageScale = stage === 'baby' ? 0.6 : stage === 'child' ? 0.75 : stage === 'teen' ? 0.9 : 1.0;

      if (imgLoaded()) {
        // Choisir le sprite selon l'état
        let spriteKey: string = currentPose;
        if (isHungry && isThirsty && hunger < 10 && thirst < 10) {
          spriteKey = 'dizzy';
        }
        const petImg = catSprites[spriteKey] || catSprites['stand'];
        if (!petImg || !petImg.complete) { /* skip frame */ }
        else {
        // Taille image proportionnelle
        const imgH = FLOOR_Y * 1.05;
        const imgW = imgH * (petImg.naturalWidth / petImg.naturalHeight);

        // Pivot au pied + scale par stade
        ctx.translate(petX, FLOOR_Y);
        ctx.scale(stageScale, stageScale);

        // Respiration douce
        const sx = 1 + Math.sin(elapsed * 0.002) * 0.012;
        const sy = 1 - Math.sin(elapsed * 0.002) * 0.01;
        // Tremblement faim/soif
        const shake = (isHungry || isThirsty) ? Math.sin(elapsed * 0.03) * 2.5 : 0;
        // Petit rebond lors du changement de pose
        const timeSincePose = now - poseStart;
        const reactJump = timeSincePose < 400 ? -Math.sin((timeSincePose / 400) * Math.PI) * 10 : 0;
        // Tilt doux
        const tilt = Math.sin(elapsed * 0.0015) * 0.03;

        ctx.rotate(tilt);
        ctx.scale(sx, sy);
        ctx.translate(shake, reactJump);

        // Dessiner l'image — le bas = sol
        ctx.drawImage(petImg, -imgW / 2, -imgH, imgW, imgH);
        ctx.restore();

        // — Effets visuels —
        ctx.save();
        const px = petX;
        const py = FLOOR_Y - imgH * 0.7;

        // Gouttes si faim/soif
        if (isHungry || isThirsty) {
          const drop = (elapsed * 0.003) % 1;
          ctx.fillStyle = isThirsty ? 'rgba(56,189,248,0.8)' : 'rgba(251,191,36,0.8)';
          ctx.beginPath(); ctx.arc(px + imgW*0.35, py + drop * 40, 4 * (1 - drop), 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px - imgW*0.3, py + 10 + ((drop + 0.5) % 1) * 35, 3 * (1 - (drop+0.5)%1), 0, Math.PI * 2); ctx.fill();
        }

        // Étoiles quand content
        if (happy) {
          for (let i = 0; i < 4; i++) {
            const a = (elapsed * 0.0018 + i * 1.6) % (Math.PI * 2);
            const r = 50 + Math.sin(elapsed * 0.003 + i) * 15;
            const sparkle = (Math.sin(elapsed * 0.007 + i * 1.3) + 1) / 2;
            ctx.globalAlpha = sparkle * 0.8;
            ctx.fillStyle = ['#FFD700', '#FF69B4', '#00FFAA', '#87CEEB'][i];
            ctx.font = `${8 + sparkle * 8}px sans-serif`;
            ctx.fillText('✦', px + Math.cos(a) * r, py - 10 + Math.sin(a) * r * 0.5);
          }
          ctx.globalAlpha = 1;
        }

        // Zzz pas content
        if (!happy) {
          const z = (elapsed * 0.0008) % 1;
          ctx.globalAlpha = 0.5 * (1 - z);
          ctx.fillStyle = '#aaa';
          ctx.font = `${11 + z * 6}px sans-serif`;
          ctx.fillText('z', px + 35 + z * 15, py - 20 - z * 30);
          ctx.font = `${9 + z * 4}px sans-serif`;
          ctx.fillText('z', px + 45 + z * 10, py - 35 - z * 25);
          ctx.globalAlpha = 1;
        }

        ctx.restore();
        } // end else petImg.complete
      } else {
        // Fallback dessin Canvas (chien ou si sprites pas chargés)
        ctx.translate(petX, petY);
        ctx.scale(stageScale, stageScale);
        ctx.translate(-petX, -petY);
        type === 'dog' ? drawDog(ctx, petX, petY, color, elapsed, happy, isHungry, isThirsty, 0, false, 0, false)
                       : drawCat(ctx, petX, petY, color, elapsed, happy, isHungry, isThirsty, 0, false, 0, false);
        ctx.restore();
      }

      // — Cœurs —
      if (happy) {
        heartPhase=(heartPhase+0.013)%(Math.PI*2);
        const hA=(Math.sin(heartPhase)*0.5+0.4);
        ctx.fillStyle=`rgba(244,114,182,${hA})`;
        ctx.font='bold 17px sans-serif';
        ctx.fillText('♥',petX+50+Math.sin(heartPhase*2)*8, petY-80-(heartPhase/(Math.PI*2))*35);
      }

      // — Alerte —
      if (isHungry||isThirsty) {
        const aA=(Math.sin(elapsed*0.006)+1)/2*0.7+0.2;
        ctx.fillStyle=`rgba(239,68,68,${aA})`;
        ctx.font='bold 22px sans-serif';
        ctx.fillText(isHungry?'🍗?':'💧?', petX-12, petY-105);
      }


      raf=requestAnimationFrame(frame);
    };

    raf=requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); if(container.contains(canvas))container.removeChild(canvas); };
  }, [type, color, hunger, thirst, decor]);

  return <div ref={containerRef} style={{ width:CW, height:CH, overflow:'hidden', backgroundColor:'#000' } as any} />;
}

// ─── Barre stat ───────────────────────────────────────────────────────────────
function StatBar({ icon, label, value, barColor }: { icon:string; label:string; value:number; barColor:string }) {
  return (
    <View style={sb.row}>
      <Text style={sb.icon}>{icon}</Text>
      <View style={{flex:1}}>
        <View style={sb.top}><Text style={sb.label}>{label}</Text><Text style={[sb.pct,{color:barColor}]}>{Math.round(value)}%</Text></View>
        <View style={sb.track}><View style={[sb.fill,{width:`${Math.round(value)}%` as any,backgroundColor:barColor}]}/></View>
      </View>
    </View>
  );
}
const sb = StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14},
  icon:{fontSize:24,width:30},
  top:{flexDirection:'row',justifyContent:'space-between',marginBottom:5},
  label:{color:'#ccc',fontSize:14},
  pct:{fontSize:14,fontWeight:'bold'},
  track:{height:12,backgroundColor:'#252525',borderRadius:6,overflow:'hidden'},
  fill:{height:12,borderRadius:6},
});

// ─── Écran ────────────────────────────────────────────────────────────────────
type Room = 'salon' | 'cuisine' | 'salleDeBain' | 'chambre';
const ROOMS: { id: Room; emoji: string; label: string }[] = [
  { id: 'salon',       emoji: '🛋️', label: 'Salon' },
  { id: 'cuisine',     emoji: '🍳', label: 'Cuisine' },
  { id: 'salleDeBain', emoji: '🚿', label: 'Salle de bain' },
  { id: 'chambre',     emoji: '🛏️', label: 'Chambre' },
];

export function PetScreen() {
  const pet       = useStore(s => s.pet);
  const feedPet   = useStore(s => s.feedPet);
  const waterPet  = useStore(s => s.waterPet);
  const earnCoins = useStore(s => s.earnCoins);
  const earnXP    = useStore(s => s.earnXP);
  const [room, setRoom] = React.useState<Room>('salon');

  if (!pet) return <View style={st.empty}><Text style={st.emptyTxt}>Aucun animal 🐾</Text></View>;

  const happiness = (pet.hunger+pet.thirst)/2;
  const mood = happiness>75?{l:'Très content ! 😄',c:'#22c55e'}:happiness>50?{l:'Content 🙂',c:'#86efac'}:happiness>30?{l:'Un peu triste 😟',c:'#f59e0b'}:{l:'Souffre 😢',c:'#ef4444'};
  const fmt = (ms:number) => { const m=Math.round(ms/60000); return m<60?`${m} min`:`${Math.round(m/60)}h`; };
  const xp = pet.xp || 0;
  const stage = pet.stage || 'baby';
  const stageLabel = stage === 'baby' ? '🍼 Bébé' : stage === 'child' ? '🧒 Enfant' : stage === 'teen' ? '🧑 Ado' : '🌟 Adulte';
  const nextXP = stage === 'baby' ? 50 : stage === 'child' ? 150 : stage === 'teen' ? 300 : 300;
  const prevXP = stage === 'baby' ? 0 : stage === 'child' ? 50 : stage === 'teen' ? 150 : 300;
  const stageProgress = stage === 'adult' ? 100 : Math.min(100, ((xp - prevXP) / (nextXP - prevXP)) * 100);

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* Nom + humeur */}
      <View style={st.header}>
        <Text style={st.name}>{pet.type==='dog'?'🐶':'🐱'}  {pet.name}</Text>
        <View style={st.moodRow}>
          <Text style={[st.mood,{color:mood.c}]}>{mood.l}</Text>
          <Text style={st.coins}>🪙 {pet.coins}</Text>
        </View>
      </View>

      {/* Canvas */}
      <View style={{borderRadius:16, overflow:'hidden', width:CW, marginBottom:14}}>
        {Platform.OS==='web'
          ? <PetCanvas type={pet.type} color={pet.color} hunger={pet.hunger} thirst={pet.thirst} decor={room} stage={stage} />
          : <View style={st.nativePet}><Text style={{fontSize:110}}>{pet.type==='dog'?'🐶':'🐱'}</Text></View>}
      </View>


      {/* Stade évolution */}
      <View style={st.statsCard}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <Text style={{color:'#fff',fontSize:15,fontWeight:'bold'}}>{stageLabel}</Text>
          <Text style={{color:'#888',fontSize:12}}>⭐ {xp} XP</Text>
        </View>
        <View style={sb.track}>
          <View style={[sb.fill,{width:`${Math.round(stageProgress)}%` as any,backgroundColor:'#a855f7'}]}/>
        </View>
        {stage !== 'adult' && <Text style={{color:'#666',fontSize:11,marginTop:4,textAlign:'right'}}>Prochain stade : {nextXP} XP</Text>}
      </View>

      {/* Stats */}
      <View style={st.statsCard}>
        <StatBar icon="🍗" label="Faim"  value={pet.hunger} barColor={pet.hunger>50?'#22c55e':pet.hunger>25?'#f59e0b':'#ef4444'} />
        <StatBar icon="💧" label="Soif"  value={pet.thirst} barColor={pet.thirst>50?'#38bdf8':pet.thirst>25?'#f59e0b':'#ef4444'} />
        <View style={st.lastRow}>
          <Text style={st.lastTxt}>Repas : {fmt(Date.now()-new Date(pet.lastFed).getTime())}</Text>
          <Text style={st.lastTxt}>Eau : {fmt(Date.now()-new Date(pet.lastWatered).getTime())}</Text>
        </View>
      </View>

      {/* Sélecteur de salles */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:14}}>
        <View style={{flexDirection:'row',gap:8,paddingHorizontal:16}}>
          {ROOMS.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[st.roomBtn, room===r.id && st.roomBtnActive]}
              onPress={() => setRoom(r.id)}
            >
              <Text style={st.roomEmoji}>{r.emoji}</Text>
              <Text style={[st.roomLabel, room===r.id && {color:'#fff'}]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Actions selon la salle */}
      {room === 'cuisine' && (
        <View style={st.btns}>
          <TouchableOpacity style={[st.btn,{backgroundColor:'#14532d'}]} onPress={feedPet}>
            <Text style={st.bIcon}>🍗</Text><Text style={st.bLabel}>Nourrir</Text><Text style={st.bSub}>+40 faim</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.btn,{backgroundColor:'#0c2a4a'}]} onPress={waterPet}>
            <Text style={st.bIcon}>💧</Text><Text style={st.bLabel}>Eau</Text><Text style={st.bSub}>+40 soif</Text>
          </TouchableOpacity>
        </View>
      )}

      {room === 'salon' && (
        <View style={st.btns}>
          <TouchableOpacity style={[st.btn,{backgroundColor:'#2a1a0a'}]} onPress={() => { earnCoins(1); earnXP(2); }}>
            <Text style={st.bIcon}>🎾</Text><Text style={st.bLabel}>Jouer</Text><Text style={st.bSub}>+1 🪙 +2 XP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.btn,{backgroundColor:'#1a1a2a'}]} onPress={() => earnXP(1)}>
            <Text style={st.bIcon}>🤗</Text><Text style={st.bLabel}>Câlin</Text><Text style={st.bSub}>+1 XP</Text>
          </TouchableOpacity>
        </View>
      )}

      {room === 'salleDeBain' && (
        <View style={st.btns}>
          <TouchableOpacity style={[st.btn,{backgroundColor:'#0a2a2a'}]} onPress={() => earnXP(3)}>
            <Text style={st.bIcon}>🧼</Text><Text style={st.bLabel}>Laver</Text><Text style={st.bSub}>+3 XP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.btn,{backgroundColor:'#1a2a1a'}]} onPress={() => earnXP(2)}>
            <Text style={st.bIcon}>🪥</Text><Text style={st.bLabel}>Brosser</Text><Text style={st.bSub}>+2 XP</Text>
          </TouchableOpacity>
        </View>
      )}

      {room === 'chambre' && (
        <View style={st.btns}>
          <TouchableOpacity style={[st.btn,{backgroundColor:'#1a0a2a'}]} onPress={() => { feedPet(); waterPet(); earnXP(5); }}>
            <Text style={st.bIcon}>😴</Text><Text style={st.bLabel}>Dormir</Text><Text style={st.bSub}>Restaure tout +5 XP</Text>
          </TouchableOpacity>
        </View>
      )}

      {pet.hunger<20 && <View style={st.alert}><Text style={st.alertTxt}>⚠️ {pet.name} a très faim ! Va à la cuisine 🍳</Text></View>}
      {pet.thirst<20 && <View style={[st.alert,{borderColor:'#38bdf8'}]}><Text style={[st.alertTxt,{color:'#38bdf8'}]}>⚠️ {pet.name} a très soif ! Va à la cuisine 🍳</Text></View>}
      <View style={{height:40}}/>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container:{flex:1,backgroundColor:'#111'},
  content:{alignItems:'center',paddingTop:10,paddingHorizontal:0},
  empty:{flex:1,backgroundColor:'#111',justifyContent:'center',alignItems:'center'},
  emptyTxt:{color:'#aaa',fontSize:18},
  header:{alignItems:'center',marginBottom:12,paddingHorizontal:20},
  name:{color:'#fff',fontSize:26,fontWeight:'bold'},
  moodRow:{flexDirection:'row',alignItems:'center',gap:16,marginTop:5},
  mood:{fontSize:15},
  coins:{color:'#fbbf24',fontSize:14,fontWeight:'bold'},
  nativePet:{width:CW,height:CH,backgroundColor:'#1a0a24',justifyContent:'center',alignItems:'center'},
  decorSection:{width:'100%',marginBottom:14,paddingLeft:16},
  decorTitle:{color:'#aaa',fontSize:13,fontWeight:'600',marginBottom:8},
  decorRow:{flexDirection:'row',gap:8,paddingRight:16},
  decorBtn:{alignItems:'center',backgroundColor:'#1a1a1a',borderRadius:12,paddingVertical:10,paddingHorizontal:14,borderWidth:1.5,borderColor:'#2a2a2a',minWidth:70},
  decorBtnActive:{borderColor:'#22c55e',backgroundColor:'#0f2d1f'},
  decorEmoji:{fontSize:22,marginBottom:3},
  decorLabel:{color:'#666',fontSize:11,fontWeight:'600'},
  statsCard:{backgroundColor:'#1a1a1a',borderRadius:16,padding:18,width:'100%',marginBottom:14,paddingHorizontal:20},
  lastRow:{flexDirection:'row',justifyContent:'space-between',marginTop:2},
  lastTxt:{color:'#444',fontSize:11},
  btns:{flexDirection:'row',gap:12,width:'100%',marginBottom:14,paddingHorizontal:16},
  btn:{flex:1,borderRadius:16,padding:16,alignItems:'center',gap:4},
  bIcon:{fontSize:30},
  bLabel:{color:'#fff',fontSize:14,fontWeight:'bold'},
  bSub:{color:'rgba(255,255,255,0.4)',fontSize:11},
  alert:{backgroundColor:'#2a0a0a',borderRadius:12,padding:14,width:'100%',marginBottom:10,borderWidth:1,borderColor:'#ef4444',marginHorizontal:16},
  alertTxt:{color:'#ef4444',fontSize:13,textAlign:'center',fontWeight:'600'},
  roomBtn:{alignItems:'center',backgroundColor:'#1a1a1a',borderRadius:14,paddingVertical:12,paddingHorizontal:16,borderWidth:1.5,borderColor:'#2a2a2a',minWidth:80},
  roomBtnActive:{borderColor:'#22c55e',backgroundColor:'#0f2d1f'},
  roomEmoji:{fontSize:24,marginBottom:4},
  roomLabel:{color:'#666',fontSize:11,fontWeight:'600'},
});
