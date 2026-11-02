/**
 * 格局與幾何聯動同步引擎 (Dynamic Layout & Space Geometry Synchronization Engine)
 * 當隔間牆發生任意 2D 位移、長度調整或厚度變更時，
 * 自動聯動 T 字交會牆體、房間地坪多邊形、房間標籤中心、即時面積 (m²) 與門扇。
 */

// 多邊形面積計算器 (Shoelace formula，單位轉為平方公尺 m²)
export function calculatePolygonAreaM2(pts) {
  if (!pts || pts.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i][0] * pts[j][1];
    area -= pts[j][0] * pts[i][1];
  }
  return Math.abs(area) / 2 / 1000000;
}

// 矩形產生 helper
function R(x0, y0, x1, y1) {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
}

// 門扇幾何與開啟軌跡計算
export function calculateDoorGeometry(x0, y0, len = 900, thick = 120, isH = true, flipH = false, flipV = false) {
  const x1 = isH ? x0 + len : x0 + thick;
  const y1 = isH ? y0 + thick : y0 + len;
  let leaf = null;
  let arc = null;

  if (isH) {
    if (!flipV) {
      if (!flipH) {
        leaf = [x0, y0, x0, y0 - len];
        arc = `M ${x1} ${y0} A ${len} ${len} 0 0 0 ${x0} ${y0 - len}`;
      } else {
        leaf = [x1, y0, x1, y0 - len];
        arc = `M ${x0} ${y0} A ${len} ${len} 0 0 1 ${x1} ${y0 - len}`;
      }
    } else {
      if (!flipH) {
        leaf = [x0, y1, x0, y1 + len];
        arc = `M ${x1} ${y1} A ${len} ${len} 0 0 1 ${x0} ${y1 + len}`;
      } else {
        leaf = [x1, y1, x1, y1 + len];
        arc = `M ${x0} ${y1} A ${len} ${len} 0 0 0 ${x1} ${y1 + len}`;
      }
    }
  } else {
    if (!flipH) {
      if (!flipV) {
        leaf = [x0, y0, x0 - len, y0];
        arc = `M ${x0} ${y1} A ${len} ${len} 0 0 1 ${x0 - len} ${y0}`;
      } else {
        leaf = [x0, y1, x0 - len, y1];
        arc = `M ${x0} ${y0} A ${len} ${len} 0 0 0 ${x0 - len} ${y1}`;
      }
    } else {
      if (!flipV) {
        leaf = [x1, y0, x1 + len, y0];
        arc = `M ${x1} ${y1} A ${len} ${len} 0 0 0 ${x1 + len} ${y0}`;
      } else {
        leaf = [x1, y1, x1 + len, y1];
        arc = `M ${x1} ${y0} A ${len} ${len} 0 0 1 ${x1 + len} ${y1}`;
      }
    }
  }

  return {
    rect: [x0, y0, x1, y1],
    leaf,
    arc,
  };
}

export function synchronizeLayout(
  walls,
  prevRooms = [],
  prevDoors = [],
  spaceLength = 5300,
  spaceWidth = 19830
) {
  const L = spaceLength || 5300;
  const W = spaceWidth || 19830;

  // 1. 建立當前所有牆體索引地圖 (以 ID 或自訂 ID 為索引)
  const wallMap = {};
  (walls || []).forEach((w, idx) => {
    const id = w[5] || (w[4] === 'n' ? `wall_n_${idx}` : `wall_${w[4]}_${idx}`);
    const minX = Math.min(w[0], w[2]);
    const maxX = Math.max(w[0], w[2]);
    const minY = Math.min(w[1], w[3]);
    const maxY = Math.max(w[1], w[3]);
    const isH = (maxX - minX) >= (maxY - minY);
    wallMap[id] = { id, minX, maxX, minY, maxY, isH, raw: w };
  });

  // 取得最新 5.3m × 19.83m 戶型的隔間牆位置
  const wLivingS = wallMap['w_living_south'] || { minX: 0, maxX: 2650, minY: 3900, maxY: 4020 };
  const wStorageE = wallMap['w_storage_east'] || { minX: 1750, maxX: 1870, minY: 4020, maxY: 6000 };
  const wMasterN = wallMap['w_master_north'] || { minX: 0, maxX: 1600, minY: 6000, maxY: 6120 };
  const wMasterChamfer = wallMap['w_master_chamfer'] || { minX: 1600, maxX: 2650, minY: 6000, maxY: 7500 };
  const wMasterE = wallMap['w_master_east'] || { minX: 2650, maxX: 2770, minY: 7500, maxY: 11710 };
  const wTvWall = wallMap['w_tv_wall'] || { minX: 0, maxX: 2650, minY: 11710, maxY: 11830 };
  const wStorage58W = wallMap['w_storage58_west'] || { minX: 3800, maxX: 3920, minY: 6120, maxY: 11830 };
  const wBathN = wallMap['w_bath_north'] || { minX: 0, maxX: 2530, minY: 15900, maxY: 16020 };
  const wKitchenN = wallMap['w_kitchen_north'] || { minX: 2650, maxX: 5300, minY: 15900, maxY: 16020 };
  const wKitchenW = wallMap['w_kitchen_west'] || { minX: 2530, maxX: 2650, minY: 16020, maxY: 19830 };
  const wToiletE = wallMap['w_toilet_east'] || { minX: 1150, maxX: 1270, minY: 16020, maxY: 17150 };
  const wToiletS = wallMap['w_toilet_south'] || { minX: 0, maxX: 1150, minY: 17050, maxY: 17150 };
  const wBathE = wallMap['w_bath_east'] || { minX: 1400, maxX: 1500, minY: 17150, maxY: 18550 };
  const wBathLaundryH = wallMap['w_bath_laundry_h'] || { minX: 0, maxX: 2530, minY: 18550, maxY: 18670 };

  // 2. T 字交會牆體自動緊密貼齊
  const syncedWalls = (walls || []).map((w, idx) => {
    const id = w[5] || (w[4] === 'n' ? `wall_n_${idx}` : `wall_${w[4]}_${idx}`);

    // 當客房南牆 w_living_south 被上下拉動時，儲藏室東牆 w_storage_east 的頂端自動貼齊其下表面！
    if (id === 'w_storage_east') {
      const topY = wLivingS.maxY;
      const bottomY = Math.max(topY + 500, w[3]);
      return [w[0], topY, w[2], bottomY, w[4], id, w[6], w[7]];
    }

    // 電視牆 w_tv_wall 貼齊大主臥東牆
    if (id === 'w_tv_wall') {
      const rightX = Math.max(1000, wMasterE.minX);
      return [w[0], w[1], rightX, w[3], w[4], id, w[6], w[7]];
    }

    // 衛浴北牆 w_bath_north 右端貼齊垂直牆西側面
    if (id === 'w_bath_north') {
      const rightX = Math.max(1000, wKitchenW.minX);
      return [w[0], w[1], rightX, w[3], w[4], id, w[6], w[7]];
    }

    // 廚房北牆 w_kitchen_north 左端貼齊垂直牆東側面
    if (id === 'w_kitchen_north') {
      const leftX = Math.min(4500, wKitchenW.maxX);
      return [leftX, w[1], w[2], w[3], w[4], id, w[6], w[7]];
    }

    // 衛浴與洗衣曬衣分界牆 w_bath_laundry_h 右端貼齊垂直牆西側面
    if (id === 'w_bath_laundry_h') {
      const rightX = Math.max(1000, wKitchenW.minX);
      return [w[0], w[1], rightX, w[3], w[4], id, w[6], w[7]];
    }

    // 便所南隔間牆右端貼齊便所東隔間牆
    if (id === 'w_toilet_south') {
      const rightX = Math.max(600, wToiletE.minX);
      return [w[0], w[1], rightX, w[3], w[4], id, w[6], w[7]];
    }

    // 風呂浴室東隔間牆底端貼齊洗衣分界牆
    if (id === 'w_bath_east') {
      const bottomY = Math.max(wToiletS.maxY + 500, wBathLaundryH.minY);
      return [w[0], w[1], w[2], bottomY, w[4], id, w[6], w[7]];
    }

    return w;
  });

  // 3. 動態重算房間地坪幾何、多邊形、顏色與大小 (拉動隔間牆時 100% 即時跟隨更新！)
  const syncedRooms = (prevRooms || []).map((rm) => {
    let newPoly = rm.poly;
    let newAt = rm.at;
    let baseName = rm.name.replace(/\s*\d+(\.\d+)?m²/, '').trim();

    if (rm.id === 'living_room_upper' || rm.id === 'guest_room' || rm.name.includes('客房')) {
      // 1. 客房：由北外牆 (y=0) 至 客房南隔間牆 (w_living_south.minY)
      const bottomY = Math.max(1200, wLivingS.minY);
      newPoly = R(0, 0, 2650, bottomY);
      newAt = [1325, bottomY / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'living_room_upper',
        name: `客房 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'storage_upper' || rm.name.includes('儲藏 3.')) {
      // 2. 儲藏室：受客房南牆下表面與儲藏室東牆聯動
      const topY = wLivingS.maxY;
      const bottomY = Math.max(topY + 800, wMasterN.minY);
      const rightX = Math.max(800, Math.min(2500, wStorageE.minX));
      newPoly = R(0, topY, rightX, bottomY);
      newAt = [rightX / 2, (topY + bottomY) / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'storage_upper',
        name: `儲藏 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'vestibule_09' || rm.name === '0.9') {
      // 3. 過道 0.9m：受客房南牆下表面與儲藏室東牆右表面聯動
      const topY = wLivingS.maxY;
      const leftX = wStorageE.maxX;
      const bottomY = Math.max(topY + 800, wMasterN.minY);
      newPoly = R(leftX, topY, 2650, bottomY);
      newAt = [(leftX + 2650) / 2, (topY + bottomY) / 2];
      return {
        ...rm,
        id: 'vestibule_09',
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'master_bedroom' || rm.name.includes('大主臥')) {
      // 4. 大主臥：受電視牆與東側走道隔間牆聯動
      const southY = Math.max(7800, wTvWall.minY);
      const eastX = Math.max(2000, wMasterE.minX);
      newPoly = [
        [0, 6120],
        [1600, 6120],
        [eastX, 7500],
        [eastX, southY],
        [0, southY],
      ];
      newAt = [1325, (7500 + southY) / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'master_bedroom',
        name: `大主臥 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'living_dining' || rm.name.includes('客餐廳')) {
      // 5. 客餐廳：受電視牆下表面與衛浴北隔間牆上表面聯動
      const northY = wTvWall.maxY;
      const southY = Math.max(northY + 1500, wBathN.minY);
      newPoly = R(0, northY, 5300, southY);
      newAt = [2650, (northY + southY) / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'living_dining',
        name: `客餐廳 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'storage_walkin' || rm.name.includes('收納 5.')) {
      // 6. 收納間：受西隔間牆聯動
      const westX = Math.max(3000, wStorage58W.maxX);
      const southY = Math.max(7000, wTvWall.minY);
      newPoly = R(westX, 6120, 5300, southY);
      newAt = [(westX + 5300) / 2, (6120 + southY) / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'storage_walkin',
        name: `收納 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'corridor_mid' || rm.name === '走道') {
      const eastMasterX = wMasterE.maxX;
      const westStorageX = wStorage58W.minX;
      const southY = wTvWall.minY;
      newPoly = [
        [eastMasterX, 7500],
        [westStorageX, 6120],
        [westStorageX, southY],
        [eastMasterX, southY],
      ];
      newAt = [(eastMasterX + westStorageX) / 2, (7500 + southY) / 2];
      return {
        ...rm,
        id: 'corridor_mid',
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'kitchen' || rm.name.includes('廚房')) {
      const northY = wKitchenN.maxY;
      const westX = wKitchenW.maxX;
      newPoly = R(westX, northY, 5300, 19830);
      newAt = [(westX + 5300) / 2, (northY + 19830) / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'kitchen',
        name: `廚房 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'toilet' || rm.name.includes('馬桶') || rm.name.includes('便所')) {
      // 日本三分離①：獨立便所
      const northY = wBathN.maxY;
      const southY = Math.max(northY + 800, wToiletS.minY);
      const eastX = Math.max(800, wToiletE.minX);
      newPoly = R(0, northY, eastX, southY);
      newAt = [eastX / 2, (northY + southY) / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'toilet',
        name: `馬桶 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'wash' || rm.name.includes('洗面') || rm.name.includes('脫衣')) {
      // 日本三分離②：洗面脫衣更衣中樞
      const northY = wBathN.maxY;
      const southY = Math.max(northY + 1200, wBathLaundryH.minY);
      const eastX = Math.max(1500, wKitchenW.minX);
      const westTopX = wToiletE.maxX;
      const midY = wToiletS.maxY;
      const westBottomX = wBathE.maxX;
      newPoly = [
        [westTopX, northY],
        [eastX, northY],
        [eastX, southY],
        [westBottomX, southY],
        [westBottomX, midY],
        [westTopX, midY],
      ];
      newAt = [(westTopX + eastX) / 2, (northY + southY) / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'wash',
        name: `洗面脫衣 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'bath' || rm.name.includes('浴室') || rm.name.includes('風呂')) {
      // 日本三分離③：獨立風呂浴室
      const northY = wToiletS.maxY;
      const southY = Math.max(northY + 1000, wBathLaundryH.minY);
      const eastX = Math.max(1000, wBathE.minX);
      newPoly = R(0, northY, eastX, southY);
      newAt = [eastX / 2, (northY + southY) / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'bath',
        name: `浴室 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    if (rm.id === 'laundry' || rm.name.includes('洗衣') || rm.name.includes('陽台')) {
      // 獨立家政洗衣曬衣間
      const northY = wBathLaundryH.maxY;
      const southY = W;
      const eastX = Math.max(1200, wKitchenW.minX);
      newPoly = R(0, northY, eastX, southY);
      newAt = [eastX / 2, (northY + southY) / 2];
      const area = calculatePolygonAreaM2(newPoly);
      return {
        ...rm,
        id: 'laundry',
        name: `洗衣曬衣 ${area.toFixed(1)}m²`,
        poly: newPoly,
        at: newAt,
      };
    }

    return rm;
  });

  // 4. 門扇位置即時吸附貼齊相關隔間牆
  const syncedDoors = (prevDoors || []).map((d) => {
    // 若是客房門 d_living，且客房南隔間牆被拖動時，門洞自動貼齊客房南牆！
    if (d.id === 'd_living') {
      const doorY = wLivingS.minY;
      const doorLen = d.len || 900;
      const dX = d.cx !== undefined ? d.cx : 2100;
      return {
        ...d,
        cx: dX,
        cy: doorY + 60,
        rect: [dX - doorLen / 2, doorY, dX + doorLen / 2, doorY + 120],
      };
    }

    // 若是電視牆後方大主臥房門 d_master
    if (d.id === 'd_master') {
      const doorX = wMasterE.minX;
      const dY = d.cy !== undefined ? d.cy : 8200;
      const doorLen = d.len || 800;
      return {
        ...d,
        cx: doorX + 60,
        cy: dY,
        rect: [doorX, dY - doorLen / 2, doorX + 120, dY + doorLen / 2],
      };
    }

    // 衛浴洗面室入口門 d_wash_entry：貼齊廚房與衛浴垂直隔間牆 w_kitchen_west
    if (d.id === 'd_wash_entry' || d.id === 'd_bath') {
      const doorX = wKitchenW.minX;
      const dY = d.cy !== undefined ? d.cy : 16700;
      const doorLen = d.len || 800;
      const geom = calculateDoorGeometry(doorX, dY - doorLen / 2, doorLen, 120, false, false, false);
      return {
        ...d,
        id: 'd_wash_entry',
        name: '衛浴入口門',
        cx: doorX + 60,
        cy: dY,
        rect: [doorX, dY - doorLen / 2, doorX + 120, dY + doorLen / 2],
        leaf: geom.leaf,
        arc: geom.arc,
      };
    }

    // 獨立便所門 d_toilet：貼齊獨立便所東隔間牆 w_toilet_east
    if (d.id === 'd_toilet') {
      const doorX = wToiletE.minX;
      const dY = d.cy !== undefined ? d.cy : 16700;
      const doorLen = d.len || 700;
      const geom = calculateDoorGeometry(doorX, dY - doorLen / 2, doorLen, 120, false, false, false);
      return {
        ...d,
        cx: doorX + 60,
        cy: dY,
        rect: [doorX, dY - doorLen / 2, doorX + 120, dY + doorLen / 2],
        leaf: geom.leaf,
        arc: geom.arc,
      };
    }

    // 獨立風呂浴室拉門 d_bath_door：貼齊浴室東隔間牆 w_bath_east
    if (d.id === 'd_bath_door') {
      const doorX = wBathE.minX;
      const dY = d.cy !== undefined ? d.cy : 17750;
      const doorLen = d.len || 800;
      return {
        ...d,
        cx: doorX + 50,
        cy: dY,
        rect: [doorX, dY - doorLen / 2, doorX + 100, dY + doorLen / 2],
      };
    }

    // 洗衣曬衣門 d_laundry：貼齊廚房與洗衣曬衣垂直隔間牆 w_kitchen_west
    if (d.id === 'd_laundry') {
      const doorX = wKitchenW.minX;
      const dY = d.cy !== undefined ? d.cy : 19200;
      const doorLen = d.len || 800;
      const geom = calculateDoorGeometry(doorX, dY - doorLen / 2, doorLen, 120, false, false, false);
      return {
        ...d,
        cx: doorX + 60,
        cy: dY,
        rect: [doorX, dY - doorLen / 2, doorX + 120, dY + doorLen / 2],
        leaf: geom.leaf,
        arc: geom.arc,
      };
    }

    // 廚房玻璃推拉門 d_kitchen_slide：貼齊廚房北隔間牆 w_kitchen_north
    if (d.id === 'd_kitchen_slide') {
      const doorY = wKitchenN.minY;
      const dX = d.cx !== undefined ? d.cx : 3950;
      const doorLen = d.len || 1800;
      return {
        ...d,
        cx: dX,
        cy: doorY + 60,
        rect: [dX - doorLen / 2, doorY, dX + doorLen / 2, doorY + 120],
      };
    }

    return d;
  });

  return {
    walls: syncedWalls,
    rooms: syncedRooms,
    doors: syncedDoors,
  };
}
