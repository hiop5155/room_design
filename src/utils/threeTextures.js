import * as THREE from 'three';

/**
 * 記憶體動態程序化材質紋理生成器 (不依賴外部圖檔與外網，完全避免破圖與 CORS)
 */

// 1. 溫潤橡木超耐磨木地板紋理 (含直鋪板縫與細膩木質肌理)
export function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 底色：溫潤橡木
  ctx.fillStyle = '#dfcaa7';
  ctx.fillRect(0, 0, 512, 512);

  // 繪製細膩木紋纖維
  for (let i = 0; i < 500; i++) {
    const y = Math.random() * 512;
    const alpha = Math.random() * 0.08 + 0.02;
    ctx.strokeStyle = Math.random() > 0.5 ? `rgba(160, 110, 60, ${alpha})` : `rgba(255, 240, 210, ${alpha})`;
    ctx.lineWidth = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + (Math.random() - 0.5) * 8, 340, y + (Math.random() - 0.5) * 8, 512, y);
    ctx.stroke();
  }

  // 繪製直鋪木地板板條分縫 (每 64px 一道橫縫，交錯縱縫)
  ctx.strokeStyle = 'rgba(100, 70, 40, 0.35)';
  ctx.lineWidth = 1.5;
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // 縱向板端交錯斷接縫
    const offset = (y / 64) % 2 === 0 ? 0 : 128;
    for (let x = offset; x <= 512; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 64);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// 2. 義大利卡拉拉白大理石紋理 (雪白基底 + 灰色流雲細紋)
export function createMarbleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f7f6f2';
  ctx.fillRect(0, 0, 512, 512);

  // 灰褐色流動墨韻
  for (let i = 0; i < 16; i++) {
    ctx.strokeStyle = `rgba(180, 175, 168, ${Math.random() * 0.25 + 0.1})`;
    ctx.lineWidth = Math.random() * 4 + 1;
    ctx.beginPath();
    let sx = Math.random() * 512;
    let sy = 0;
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(
      sx + (Math.random() - 0.5) * 200, 170,
      sx + (Math.random() - 0.5) * 200, 340,
      sx + (Math.random() - 0.5) * 300, 512
    );
    ctx.stroke();
  }

  // 600×600 大理石地磚微縫
  ctx.strokeStyle = 'rgba(210, 205, 198, 0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// 3. 衛浴/廚房防滑磁磚紋理 (灰色 300×300 止滑微粒方格)
export function createTileTexture(tileSize = 64, bgColor = '#d8dbd9', lineColor = '#b0b5b2') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 256);

  // 網格勾縫
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  for (let i = 0; i <= 256; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // 防滑小微粒細點
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  for (let k = 0; k < 400; k++) {
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 4. 4吋紅磚實心隔間紋理 (經典交錯紅磚 + 水泥勾縫)
export function createBrickTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // 水泥勾縫底色
  ctx.fillStyle = '#b5aba1';
  ctx.fillRect(0, 0, 256, 256);

  const brickH = 32;
  const brickW = 64;

  for (let row = 0; row < 256 / brickH; row++) {
    const y = row * brickH;
    const isOdd = row % 2 === 1;
    const startX = isOdd ? -brickW / 2 : 0;

    for (let x = startX; x < 256 + brickW; x += brickW) {
      // 磚塊自然色差變化
      const r = 180 + Math.floor(Math.random() * 30 - 15);
      const g = 65 + Math.floor(Math.random() * 20 - 10);
      const b = 50 + Math.floor(Math.random() * 16 - 8);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  return texture;
}

// 5. Sony Bravia 75" OLED 4K 實景播放畫面 (夕陽極光阿爾卑斯壯麗實景)
export function createTVScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d');

  // 暮光漸層天空
  const grad = ctx.createLinearGradient(0, 0, 0, 576);
  grad.addColorStop(0, '#0c1445');
  grad.addColorStop(0.4, '#2d336b');
  grad.addColorStop(0.65, '#bd5338');
  grad.addColorStop(0.78, '#f59e0b');
  grad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 576);

  // 遠方山巒剪影
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.lineTo(160, 280);
  ctx.lineTo(280, 360);
  ctx.lineTo(480, 220);
  ctx.lineTo(650, 340);
  ctx.lineTo(820, 250);
  ctx.lineTo(1024, 380);
  ctx.lineTo(1024, 576);
  ctx.lineTo(0, 576);
  ctx.closePath();
  ctx.fill();

  // 雪峰金黃日照反光
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.moveTo(480, 220);
  ctx.lineTo(460, 250);
  ctx.lineTo(510, 260);
  ctx.closePath();
  ctx.fill();

  // 湖面倒影微波
  ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(Math.random() * 800 + 100, 460 + Math.random() * 100, Math.random() * 80 + 40, 2);
  }

  // 頂部 HDR 狀態指示器
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('SONY BRAVIA 4K HDR · Living Space', 40, 50);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '16px sans-serif';
  ctx.fillText('● 3840×2160 · 120Hz Dolby Vision', 40, 78);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

