import sharp from 'sharp';
import path from 'path';

const SRC = 'chatgpt_cat.png';
const OUT = 'apps/mobile/assets';
const COLS = 5;
const ROWS = 2;

const names = [
  // row 0
  ['cat_stand', 'cat_walk1', 'cat_walk2', 'cat_happy', 'cat_wave'],
  // row 1
  ['cat_sit', 'cat_sit2', 'cat_look', 'cat_lay', 'cat_lay2'],
];

const meta = await sharp(SRC).metadata();
const cellW = Math.floor(meta.width / COLS);
const cellH = Math.floor(meta.height / ROWS);

console.log(`Image: ${meta.width}x${meta.height}  Cell: ${cellW}x${cellH}`);

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const name = names[r][c];
    const outPath = path.join(OUT, `${name}.png`);
    await sharp(SRC)
      .extract({ left: c * cellW, top: r * cellH, width: cellW, height: cellH })
      .png()
      .toFile(outPath);
    console.log(`  ✓ ${outPath}`);
  }
}
console.log('Done — 10 sprites saved.');
