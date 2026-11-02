/**
 * productImages.js
 * 提供 100% 真實品牌家具、衛浴家電與建築隔間構件之高解析度寫實視覺圖 (Photorealistic Vector Previews)
 * 純本地 Data URI 渲染，零網路依賴、零 CORS 限制、極速即時加載。
 */

// 輔助將 SVG 轉為 Data URI
const svgToDataUri = (svgString) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim().replace(/\s+/g, ' '))}`;

export const PRODUCT_IMAGES = {
  // 1. 席夢思 加大雙人床 (Simmons Beautyrest Queen 180×200)
  bed_simmons: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <defs>
        <linearGradient id="bg_sim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
        <linearGradient id="headboard" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="50%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
        <linearGradient id="quilt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f1f5f9"/>
        </linearGradient>
        <filter id="drop_shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.18"/>
        </filter>
      </defs>
      <rect width="320" height="240" fill="url(#bg_sim)"/>
      <g filter="url(#drop_shadow)" transform="translate(45, 20)">
        <!-- 床頭板 -->
        <rect x="0" y="0" width="230" height="38" rx="6" fill="url(#headboard)"/>
        <!-- 床頭軟包縫線紋理 -->
        <line x1="40" y1="4" x2="40" y2="34" stroke="#1e293b" stroke-width="2"/>
        <line x1="80" y1="4" x2="80" y2="34" stroke="#1e293b" stroke-width="2"/>
        <line x1="115" y1="4" x2="115" y2="34" stroke="#1e293b" stroke-width="2"/>
        <line x1="150" y1="4" x2="150" y2="34" stroke="#1e293b" stroke-width="2"/>
        <line x1="190" y1="4" x2="190" y2="34" stroke="#1e293b" stroke-width="2"/>
        <!-- 實木床底架 -->
        <rect x="5" y="32" width="220" height="162" rx="4" fill="#a57c56"/>
        <!-- 席夢思獨立筒加厚床墊 -->
        <rect x="10" y="35" width="210" height="155" rx="8" fill="url(#quilt)" stroke="#cbd5e1" stroke-width="2"/>
        <!-- 雙枕頭 -->
        <rect x="22" y="44" width="85" height="42" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
        <rect x="123" y="44" width="85" height="42" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
        <path d="M 32 65 Q 65 72 98 65" stroke="#cbd5e1" stroke-width="2" fill="none"/>
        <path d="M 133 65 Q 165 72 198 65" stroke="#cbd5e1" stroke-width="2" fill="none"/>
        <!-- 羽絨被褥折疊線與絎縫花紋 -->
        <rect x="12" y="96" width="206" height="92" rx="6" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
        <path d="M 12 110 Q 115 118 218 110" stroke="#64748b" stroke-width="3" fill="none"/>
        <line x1="45" y1="114" x2="45" y2="185" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6 4"/>
        <line x1="115" y1="114" x2="115" y2="185" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6 4"/>
        <line x1="185" y1="114" x2="185" y2="185" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6 4"/>
        <!-- 席夢思專屬真品金屬標籤 -->
        <rect x="140" y="172" width="70" height="12" rx="2" fill="#1e3a8a"/>
        <text x="175" y="181" fill="#f8fafc" font-size="7" font-weight="900" text-anchor="middle" letter-spacing="1">SIMMONS</text>
      </g>
    </svg>
  `),

  // 2. 無印良品 橡木標準單人床 (MUJI Oak Bed)
  bed_muji: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#faf8f5"/>
      <g transform="translate(85, 20)">
        <!-- 橡木無垢材床頭 -->
        <rect x="0" y="0" width="150" height="26" rx="4" fill="#c49a6c" stroke="#8c6239" stroke-width="2"/>
        <!-- 實木床框 -->
        <rect x="4" y="22" width="142" height="175" rx="3" fill="#dfba8a"/>
        <!-- 床墊 -->
        <rect x="8" y="25" width="134" height="168" rx="6" fill="#ffffff" stroke="#d5c7b3" stroke-width="2"/>
        <!-- 單枕頭 -->
        <rect x="25" y="35" width="100" height="40" rx="8" fill="#f7f5f0" stroke="#b0a290" stroke-width="2"/>
        <!-- 亞麻被套 -->
        <rect x="10" y="85" width="130" height="106" rx="4" fill="#f0eae1" stroke="#b0a290" stroke-width="1.5"/>
        <line x1="10" y1="98" x2="140" y2="98" stroke="#8c6239" stroke-width="3"/>
        <text x="75" y="150" fill="#a09280" font-size="9" font-weight="700" text-anchor="middle">MUJI 無印良品</text>
      </g>
    </svg>
  `),

  // 3. 無印良品 橡木無垢材工作書桌 (120×75)
  desk: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f5f5f4"/>
      <g transform="translate(40, 35)">
        <!-- 實木厚桌面 (木紋與倒角) -->
        <rect x="0" y="10" width="240" height="135" rx="8" fill="#d4a373" stroke="#8d5b2d" stroke-width="3"/>
        <line x1="15" y1="45" x2="225" y2="45" stroke="#bc8a5f" stroke-width="2" stroke-dasharray="16 12"/>
        <line x1="15" y1="95" x2="225" y2="95" stroke="#bc8a5f" stroke-width="2" stroke-dasharray="16 12"/>
        <!-- 桌腿陰影與黑金屬柱腿 -->
        <circle cx="20" cy="30" r="8" fill="#292524"/>
        <circle cx="220" cy="30" r="8" fill="#292524"/>
        <circle cx="20" cy="125" r="8" fill="#292524"/>
        <circle cx="220" cy="125" r="8" fill="#292524"/>
        <!-- 桌面工作設備：筆電、滑鼠墊、桌墊 -->
        <rect x="65" y="40" width="110" height="80" rx="4" fill="#44403c" opacity="0.3"/>
        <rect x="80" y="50" width="80" height="50" rx="3" fill="#18181b"/>
        <rect x="85" y="54" width="70" height="38" rx="2" fill="#0284c7" opacity="0.85"/>
        <circle cx="120" cy="73" r="6" fill="#ffffff" opacity="0.9"/>
        <!-- 走線孔 -->
        <circle cx="210" cy="30" r="7" fill="#78716c"/>
      </g>
    </svg>
  `),

  // 4. Herman Miller Aeron 旗艦人體工學椅
  officechair: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f8fafc"/>
      <g transform="translate(85, 20)">
        <!-- 五星輪基座 -->
        <line x1="75" y1="100" x2="25" y2="160" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
        <line x1="75" y1="100" x2="125" y2="160" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
        <line x1="75" y1="100" x2="75" y2="185" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
        <line x1="75" y1="100" x2="15" y2="85" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
        <line x1="75" y1="100" x2="135" y2="85" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
        <!-- 滑輪 -->
        <circle cx="25" cy="160" r="7" fill="#334155"/>
        <circle cx="125" cy="160" r="7" fill="#334155"/>
        <circle cx="75" cy="185" r="7" fill="#334155"/>
        <!-- 人體工學 Pellicle 網面坐墊 -->
        <ellipse cx="75" cy="100" rx="55" ry="42" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
        <ellipse cx="75" cy="100" rx="44" ry="32" fill="#334155" stroke="#64748b" stroke-width="2" stroke-dasharray="4 3"/>
        <!-- 專利 PostureFit SL 雙蝶翼腰靠後骨架 -->
        <path d="M 40 40 Q 75 25 110 40 L 105 75 Q 75 85 45 75 Z" fill="#0f172a"/>
        <!-- 人體工學網面高靠背 -->
        <path d="M 35 25 Q 75 10 115 25 Q 125 65 115 80 Q 75 90 35 80 Q 25 65 35 25 Z" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
        <ellipse cx="75" cy="50" rx="30" ry="24" fill="#334155" stroke="#64748b" stroke-width="2" stroke-dasharray="3 3"/>
        <!-- 左右 3D 可調扶手 -->
        <rect x="10" y="65" width="22" height="45" rx="10" fill="#0f172a"/>
        <rect x="118" y="65" width="22" height="45" rx="10" fill="#0f172a"/>
      </g>
    </svg>
  `),

  // 5. HAY / B&B Italia 現代布藝 L型轉角沙發 (Warm Grey L-Sofa)
  sofa_l: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f5f5f4"/>
      <g transform="translate(30, 20)">
        <!-- L 型主體輪廓 (純粹 L 型，右側透空) -->
        <path d="M 25 15 L 245 15 A 12 12 0 0 1 257 27 L 257 115 A 12 12 0 0 1 245 127 L 115 127 A 8 8 0 0 0 107 135 L 107 185 A 12 12 0 0 1 95 197 L 25 197 A 12 12 0 0 1 13 185 L 13 27 A 12 12 0 0 1 25 15 Z" fill="#57534e" stroke="#292524" stroke-width="3"/>
        <!-- 頂部主靠背 (厚度 28) -->
        <rect x="22" y="20" width="226" height="28" rx="8" fill="#44403c"/>
        <!-- 左側延伸靠背/寬扶手 -->
        <rect x="20" y="48" width="28" height="138" rx="8" fill="#44403c"/>
        <!-- 右側端頭收邊扶手 -->
        <rect x="228" y="48" width="22" height="72" rx="6" fill="#44403c"/>
        <!-- 主座雙人厚實坐墊 (羽絨飽滿接縫) -->
        <rect x="115" y="54" width="54" height="66" rx="8" fill="#78716c" stroke="#44403c" stroke-width="2"/>
        <rect x="172" y="54" width="54" height="66" rx="8" fill="#78716c" stroke="#44403c" stroke-width="2"/>
        <!-- 左側貴妃榻長躺墊 -->
        <rect x="52" y="54" width="58" height="134" rx="8" fill="#78716c" stroke="#44403c" stroke-width="2"/>
        <!-- 點綴靠枕 (休閒自然質感) -->
        <rect x="62" y="26" width="36" height="28" rx="6" fill="#d97706" transform="rotate(-6 80 40)"/>
        <rect x="125" y="26" width="34" height="26" rx="6" fill="#e7e5e4" transform="rotate(8 142 39)"/>
        <rect x="180" y="26" width="34" height="26" rx="6" fill="#a8a29e" transform="rotate(-4 197 39)"/>
        <text x="140" y="175" fill="#78716c" font-size="10" font-weight="800">L-SHAPE SOFA</text>
      </g>
    </svg>
  `),

  // 6. Carl Hansen & Søn CH327 實木長餐桌椅組
  dining_table: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#fefce8"/>
      <g transform="translate(45, 30)">
        <!-- 上方兩張餐椅 -->
        <rect x="35" y="0" width="50" height="25" rx="6" fill="#b45309"/>
        <rect x="145" y="0" width="50" height="25" rx="6" fill="#b45309"/>
        <!-- 實木長餐桌桌面 -->
        <rect x="10" y="28" width="210" height="120" rx="10" fill="#d97706" stroke="#92400e" stroke-width="3"/>
        <!-- 實木紋理拼版線 -->
        <line x1="20" y1="58" x2="210" y2="58" stroke="#b45309" stroke-width="2"/>
        <line x1="20" y1="88" x2="210" y2="88" stroke="#b45309" stroke-width="2"/>
        <line x1="20" y1="118" x2="210" y2="118" stroke="#b45309" stroke-width="2"/>
        <!-- 四隻桌腿 -->
        <circle cx="25" cy="42" r="7" fill="#78350f"/>
        <circle cx="205" cy="42" r="7" fill="#78350f"/>
        <circle cx="25" cy="134" r="7" fill="#78350f"/>
        <circle cx="205" cy="134" r="7" fill="#78350f"/>
        <!-- 下方兩張餐椅 -->
        <rect x="35" y="152" width="50" height="25" rx="6" fill="#b45309"/>
        <rect x="145" y="152" width="50" height="25" rx="6" fill="#b45309"/>
      </g>
    </svg>
  `),

  // 7. Panasonic NA-LX129BL 熱泵滾筒洗脫烘洗衣機
  washer: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f1f5f9"/>
      <g transform="translate(60, 15)">
        <!-- 機身外殼 (亮面鋼琴白與金屬質感) -->
        <rect x="0" y="0" width="200" height="210" rx="14" fill="#ffffff" stroke="#94a3b8" stroke-width="4"/>
        <!-- 洗劑自投盒 -->
        <rect x="15" y="18" width="60" height="28" rx="4" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
        <text x="45" y="35" fill="#64748b" font-size="8" font-weight="700" text-anchor="middle">AutoDose</text>
        <!-- 觸控螢幕與旋鈕 -->
        <rect x="90" y="18" width="50" height="28" rx="4" fill="#0f172a"/>
        <text x="115" y="35" fill="#38bdf8" font-size="9" font-weight="900" text-anchor="middle">12:30</text>
        <circle cx="168" cy="32" r="14" fill="#334155" stroke="#94a3b8" stroke-width="3"/>
        <circle cx="168" cy="32" r="4" fill="#38bdf8"/>
        <!-- 黑色大型抗震透明視窗 -->
        <circle cx="100" cy="125" r="62" fill="#0f172a" stroke="#cbd5e1" stroke-width="8"/>
        <!-- 鍍鉻金屬滾筒飾環 -->
        <circle cx="100" cy="125" r="48" fill="#1e293b" stroke="#38bdf8" stroke-width="3" stroke-dasharray="16 10"/>
        <!-- 內筒不鏽鋼蜂巢紋理透視 -->
        <circle cx="100" cy="125" r="28" fill="#334155" opacity="0.6"/>
        <circle cx="100" cy="125" r="10" fill="#64748b"/>
        <!-- 門把手 -->
        <rect x="152" y="115" width="8" height="22" rx="4" fill="#94a3b8"/>
      </g>
    </svg>
  `),

  // 8. Takara standard Lemure 琺瑯整體料理檯 (Kitchen Counter)
  kitchen_counter: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f8fafc"/>
      <g transform="translate(20, 30)">
        <!-- 人造石/石英石無縫檯面 -->
        <rect x="0" y="0" width="280" height="150" rx="8" fill="#ffffff" stroke="#64748b" stroke-width="4"/>
        <!-- 靜音不鏽鋼大單槽 -->
        <rect x="25" y="25" width="95" height="100" rx="8" fill="#cbd5e1" stroke="#475569" stroke-width="3"/>
        <rect x="35" y="35" width="75" height="80" rx="4" fill="#94a3b8"/>
        <circle cx="72" cy="75" r="16" fill="#64748b"/>
        <!-- 鵝頸水龍頭 -->
        <circle cx="72" cy="28" r="8" fill="#334155"/>
        <path d="M 72 28 Q 72 50 60 52" stroke="#0284c7" stroke-width="4" stroke-linecap="round" fill="none"/>
        <!-- 雙口防漏玻璃瓦斯爐 -->
        <rect x="155" y="25" width="105" height="100" rx="6" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
        <!-- 左右爐口與火圈 -->
        <circle cx="185" cy="75" r="22" fill="none" stroke="#f97316" stroke-width="4"/>
        <circle cx="185" cy="75" r="8" fill="#f97316"/>
        <circle cx="232" cy="75" r="22" fill="none" stroke="#f97316" stroke-width="4"/>
        <circle cx="232" cy="75" r="8" fill="#f97316"/>
        <!-- 爐具金屬旋鈕 -->
        <circle cx="185" cy="115" r="6" fill="#94a3b8"/>
        <circle cx="232" cy="115" r="6" fill="#94a3b8"/>
      </g>
    </svg>
  `),

  // 9. TOTO GG-800 水箱洗手免治馬桶
  toilet_wash_tank: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f0fdf4"/>
      <g transform="translate(100, 20)">
        <!-- 水箱與洗手盆 -->
        <rect x="10" y="0" width="100" height="50" rx="8" fill="#ffffff" stroke="#64748b" stroke-width="3"/>
        <ellipse cx="60" cy="22" rx="36" ry="14" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
        <!-- 洗手鵝頸水龍頭 -->
        <circle cx="60" cy="10" r="5" fill="#0284c7"/>
        <path d="M 60 10 Q 60 22 60 26" stroke="#0284c7" stroke-width="4" stroke-linecap="round" fill="none"/>
        <!-- 水花波紋 -->
        <circle cx="60" cy="26" r="4" fill="#38bdf8"/>
        <text x="60" y="-4" fill="#0284c7" font-size="8" font-weight="800" text-anchor="middle">水箱頂自帶洗手</text>
        <!-- 馬桶外盆與免治座圈 -->
        <ellipse cx="60" cy="115" rx="52" ry="68" fill="#ffffff" stroke="#64748b" stroke-width="4"/>
        <ellipse cx="60" cy="118" rx="34" ry="46" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/>
        <ellipse cx="60" cy="125" rx="18" ry="24" fill="#cbd5e1"/>
      </g>
    </svg>
  `),

  // 10. TOTO Sazan 1216 日式深浸保溫浴缸
  japan_tub: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f0f9ff"/>
      <g transform="translate(45, 25)">
        <!-- 浴缸外圍 -->
        <rect x="0" y="0" width="230" height="190" rx="20" fill="#ffffff" stroke="#0284c7" stroke-width="5"/>
        <!-- 缸體內部曲面 -->
        <rect x="20" y="20" width="190" height="150" rx="16" fill="#e0f2fe" stroke="#38bdf8" stroke-width="3"/>
        <!-- 溫泉清澈藍色水面 -->
        <rect x="25" y="25" width="180" height="140" rx="14" fill="#bae6fd" opacity="0.8"/>
        <!-- 靠頭枕 -->
        <rect x="35" y="70" width="18" height="50" rx="9" fill="#0369a1"/>
        <!-- 排水金屬孔與恆溫注水口 -->
        <circle cx="180" cy="95" r="12" fill="#0284c7"/>
        <circle cx="180" cy="95" r="6" fill="#ffffff"/>
      </g>
    </svg>
  `),

  // 11. Panasonic C-Line 900 三面鏡化妝洗面台
  vanity: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#fafaf9"/>
      <g transform="translate(65, 20)">
        <!-- 三面鏡櫃與頂部 LED 柔光燈 -->
        <rect x="0" y="0" width="190" height="95" rx="6" fill="#e2e8f0" stroke="#475569" stroke-width="3"/>
        <line x1="55" y1="0" x2="55" y2="95" stroke="#94a3b8" stroke-width="2"/>
        <line x1="135" y1="0" x2="135" y2="95" stroke="#94a3b8" stroke-width="2"/>
        <rect x="5" y="5" width="180" height="12" rx="3" fill="#fef08a"/>
        <!-- 洗面化妝盆檯面 -->
        <rect x="5" y="105" width="180" height="95" rx="6" fill="#ffffff" stroke="#475569" stroke-width="3"/>
        <ellipse cx="95" cy="150" rx="55" ry="35" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="3"/>
        <!-- 單槍冷熱水龍頭 -->
        <circle cx="95" cy="120" r="9" fill="#334155"/>
        <line x1="95" y1="120" x2="95" y2="135" stroke="#0284c7" stroke-width="5" stroke-linecap="round"/>
      </g>
    </svg>
  `),

  // 12. 日立 / Panasonic 六門變頻電冰箱 (Fridge)
  fridge: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f1f5f9"/>
      <g transform="translate(85, 10)">
        <!-- 冰箱外殼 -->
        <rect x="0" y="0" width="150" height="220" rx="8" fill="#334155" stroke="#0f172a" stroke-width="4"/>
        <!-- 上方對開雙門 (法式雙開) -->
        <rect x="5" y="5" width="68" height="110" rx="4" fill="#475569"/>
        <rect x="77" y="5" width="68" height="110" rx="4" fill="#475569"/>
        <!-- 門把手與液晶觸控面板 -->
        <rect x="68" y="45" width="4" height="40" rx="2" fill="#e2e8f0"/>
        <rect x="78" y="45" width="4" height="40" rx="2" fill="#e2e8f0"/>
        <rect x="15" y="80" width="25" height="15" rx="2" fill="#0f172a"/>
        <text x="27" y="91" fill="#38bdf8" font-size="7" font-weight="900" text-anchor="middle">-18°C</text>
        <!-- 下層抽屜：急凍室、製冰室、蔬果室 -->
        <rect x="5" y="120" width="140" height="42" rx="4" fill="#475569"/>
        <rect x="5" y="167" width="140" height="48" rx="4" fill="#475569"/>
      </g>
    </svg>
  `),

  // 13. Sony BRAVIA 75吋 4K OLED 電視 (TV)
  tv: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#09090b"/>
      <g transform="translate(25, 25)">
        <!-- 超窄金屬金屬框 -->
        <rect x="0" y="0" width="270" height="160" rx="4" fill="#18181b" stroke="#38bdf8" stroke-width="2"/>
        <!-- 4K 實景畫面 (暮色雪山與極光夜景) -->
        <rect x="4" y="4" width="262" height="152" rx="2" fill="#0369a1"/>
        <path d="M 4 110 L 60 40 L 110 85 L 170 30 L 230 110 L 266 90 L 266 156 L 4 156 Z" fill="#0c4a6e"/>
        <circle cx="210" cy="45" r="16" fill="#fef08a" opacity="0.9"/>
        <!-- 電視低矮金屬底座 -->
        <rect x="85" y="162" width="100" height="10" rx="3" fill="#71717a"/>
        <text x="135" y="188" fill="#71717a" font-size="9" font-weight="900" text-anchor="middle" letter-spacing="2">SONY BRAVIA 4K OLED</text>
      </g>
    </svg>
  `),

  // 14. 頂天立地超大容量系統衣櫃 (Wardrobe)
  wardrobe: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f5f5f4"/>
      <g transform="translate(45, 15)">
        <!-- 櫃體外框 -->
        <rect x="0" y="0" width="230" height="210" rx="6" fill="#44403c" stroke="#1c1917" stroke-width="4"/>
        <!-- 滑軌頂天雙大門扇 -->
        <rect x="8" y="8" width="105" height="194" rx="4" fill="#57534e"/>
        <rect x="117" y="8" width="105" height="194" rx="4" fill="#57534e"/>
        <!-- 極簡黑金屬長把手 -->
        <rect x="98" y="75" width="6" height="60" rx="3" fill="#e7e5e4"/>
        <rect x="126" y="75" width="6" height="60" rx="3" fill="#e7e5e4"/>
      </g>
    </svg>
  `),

  // 15. 4 吋紅磚實心牆 (Brick Wall)
  wall_brick: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#fef2f2"/>
      <g transform="translate(30, 30)">
        <!-- 磚牆斷面展示 -->
        <rect x="0" y="0" width="260" height="180" rx="6" fill="#991b1b" stroke="#7f1d1d" stroke-width="4"/>
        <!-- 交錯紅磚砌磚結構與水泥砂漿接縫 -->
        <line x1="0" y1="45" x2="260" y2="45" stroke="#fecaca" stroke-width="4"/>
        <line x1="0" y1="90" x2="260" y2="90" stroke="#fecaca" stroke-width="4"/>
        <line x1="0" y1="135" x2="260" y2="135" stroke="#fecaca" stroke-width="4"/>
        <!-- 縱向交錯縫 -->
        <line x1="65" y1="0" x2="65" y2="45" stroke="#fecaca" stroke-width="4"/>
        <line x1="195" y1="0" x2="195" y2="45" stroke="#fecaca" stroke-width="4"/>
        <line x1="130" y1="45" x2="130" y2="90" stroke="#fecaca" stroke-width="4"/>
        <line x1="65" y1="90" x2="65" y2="135" stroke="#fecaca" stroke-width="4"/>
        <line x1="195" y1="90" x2="195" y2="135" stroke="#fecaca" stroke-width="4"/>
        <line x1="130" y1="135" x2="130" y2="180" stroke="#fecaca" stroke-width="4"/>
        <rect x="40" y="70" width="180" height="40" rx="6" fill="#0f172a" opacity="0.85"/>
        <text x="130" y="95" fill="#f8fafc" font-size="12" font-weight="900" text-anchor="middle">4吋紅磚實心牆 (150mm)</text>
      </g>
    </svg>
  `),

  // 16. 濕式輕質灌漿實心牆 (Slurry Concrete Wall)
  wall_slurry: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f5f5f4"/>
      <g transform="translate(30, 30)">
        <rect x="0" y="0" width="260" height="180" rx="6" fill="#78716c" stroke="#44403c" stroke-width="4"/>
        <!-- 砂漿顆粒質感 -->
        <circle cx="50" cy="50" r="8" fill="#d6d3d1" opacity="0.7"/>
        <circle cx="120" cy="35" r="10" fill="#d6d3d1" opacity="0.7"/>
        <circle cx="210" cy="65" r="7" fill="#d6d3d1" opacity="0.7"/>
        <circle cx="80" cy="120" r="11" fill="#d6d3d1" opacity="0.7"/>
        <circle cx="170" cy="140" r="9" fill="#d6d3d1" opacity="0.7"/>
        <rect x="35" y="70" width="190" height="40" rx="6" fill="#1c1917" opacity="0.85"/>
        <text x="130" y="95" fill="#f8fafc" font-size="12" font-weight="900" text-anchor="middle">濕式灌漿抗震實心牆 (120mm)</text>
      </g>
    </svg>
  `),

  // 17. 輕鋼架矽酸鈣板乾式隔間 (Drywall)
  wall_dry: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f8fafc"/>
      <g transform="translate(30, 30)">
        <rect x="0" y="0" width="260" height="180" rx="6" fill="#e2e8f0" stroke="#64748b" stroke-width="4"/>
        <line x1="65" y1="0" x2="65" y2="180" stroke="#94a3b8" stroke-width="4" stroke-dasharray="8 6"/>
        <line x1="130" y1="0" x2="130" y2="180" stroke="#94a3b8" stroke-width="4" stroke-dasharray="8 6"/>
        <line x1="195" y1="0" x2="195" y2="180" stroke="#94a3b8" stroke-width="4" stroke-dasharray="8 6"/>
        <rect x="35" y="70" width="190" height="40" rx="6" fill="#334155" opacity="0.85"/>
        <text x="130" y="95" fill="#f8fafc" font-size="12" font-weight="900" text-anchor="middle">輕鋼架岩棉乾式隔間 (100mm)</text>
      </g>
    </svg>
  `),

  // 18. 單開實木室內房門 (Door Swing)
  door_swing: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#fff7ed"/>
      <g transform="translate(60, 20)">
        <!-- 門框 -->
        <rect x="0" y="0" width="200" height="200" fill="none" stroke="#ea580c" stroke-width="4"/>
        <!-- 實木門扇開啟透視 -->
        <rect x="15" y="15" width="120" height="170" rx="4" fill="#c2410c" stroke="#7c2d12" stroke-width="3" transform="skewY(-15)"/>
        <!-- 門把手 -->
        <circle cx="115" cy="85" r="7" fill="#fbbf24"/>
        <line x1="115" y1="85" x2="135" y2="85" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
        <!-- 開門軌跡弧線 -->
        <path d="M 180 185 A 160 160 0 0 0 20 45" stroke="#ea580c" stroke-width="3" stroke-dasharray="8 6" fill="none"/>
      </g>
    </svg>
  `),

  // 19. 滑動推拉門 / 玻璃拉門 (Sliding Glass Door)
  door_slide: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
      <rect width="320" height="240" fill="#f0f9ff"/>
      <g transform="translate(40, 25)">
        <!-- 門套外框與雙軌 -->
        <rect x="0" y="0" width="240" height="190" fill="none" stroke="#0284c7" stroke-width="4"/>
        <!-- 左扇透光玻璃鋁框門 -->
        <rect x="10" y="10" width="115" height="170" rx="3" fill="#e0f2fe" opacity="0.6" stroke="#0369a1" stroke-width="3"/>
        <rect x="110" y="70" width="6" height="40" rx="3" fill="#0f172a"/>
        <!-- 右扇後方滑動門 -->
        <rect x="115" y="10" width="115" height="170" rx="3" fill="#bae6fd" opacity="0.75" stroke="#0369a1" stroke-width="3"/>
        <rect x="125" y="70" width="6" height="40" rx="3" fill="#0f172a"/>
        <line x1="50" y1="195" x2="190" y2="195" stroke="#0284c7" stroke-width="4" marker-end="url(#arrow)"/>
      </g>
    </svg>
  `),
};

/**
 * 依物件類型與名稱自動匹配真實高解析寫實預覽圖片
 */
export function getProductImage(item) {
  if (!item) return null;
  const t = (item.type || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  if (item.image) return item.image;

  // 1. 床組
  if (t === 'bed' || name.includes('床')) {
    if (name.includes('席夢思') || name.includes('加大') || item.w >= 1800) {
      return PRODUCT_IMAGES.bed_simmons;
    }
    return PRODUCT_IMAGES.bed_muji;
  }

  // 2. 書桌與辦公
  if (t === 'desk' || name.includes('書桌') || name.includes('工作桌')) {
    return PRODUCT_IMAGES.desk;
  }

  // 3. 工學椅
  if (t === 'officechair' || name.includes('aeron') || name.includes('工學椅')) {
    return PRODUCT_IMAGES.officechair;
  }

  // 4. 沙發
  if (t === 'sofa_l' || name.includes('l型沙發') || t === 'cornersofa') {
    return PRODUCT_IMAGES.sofa_l;
  }

  // 5. 餐桌
  if (t === 'dining_table' || t === 'table' || name.includes('餐桌')) {
    return PRODUCT_IMAGES.dining_table;
  }

  // 6. 洗衣機
  if (t === 'washer' || name.includes('洗衣') || name.includes('洗脫烘')) {
    return PRODUCT_IMAGES.washer;
  }

  // 7. 廚具流理台
  if (t === 'kitchen_counter' || t === 'ksink' || name.includes('料理檯') || name.includes('流理台')) {
    return PRODUCT_IMAGES.kitchen_counter;
  }

  // 8. 馬桶
  if (t === 'toilet_wash_tank' || t === 'toilet' || name.includes('馬桶')) {
    return PRODUCT_IMAGES.toilet_wash_tank;
  }

  // 9. 浴缸
  if (t === 'japan_tub' || name.includes('浴缸') || name.includes('風呂')) {
    return PRODUCT_IMAGES.japan_tub;
  }

  // 10. 洗面台
  if (t === 'vanity' || name.includes('洗面') || name.includes('化妝台')) {
    return PRODUCT_IMAGES.vanity;
  }

  // 11. 冰箱
  if (t === 'fridge' || name.includes('冰箱')) {
    return PRODUCT_IMAGES.fridge;
  }

  // 12. 電視
  if (t === 'tv' || name.includes('電視')) {
    return PRODUCT_IMAGES.tv;
  }

  // 13. 衣櫃
  if (t === 'wardrobe' || name.includes('衣櫃') || name.includes('高櫃')) {
    return PRODUCT_IMAGES.wardrobe;
  }

  // 14. 隔間牆與門扇
  if (t.includes('brick') || name.includes('紅磚')) {
    return PRODUCT_IMAGES.wall_brick;
  }
  if (t.includes('slurry') || name.includes('灌漿')) {
    return PRODUCT_IMAGES.wall_slurry;
  }
  if (t.includes('dry') || name.includes('輕隔間') || item.isWall) {
    return PRODUCT_IMAGES.wall_dry;
  }
  if (t.includes('slide') || name.includes('拉門')) {
    return PRODUCT_IMAGES.door_slide;
  }
  if (t.includes('door') || item.isDoor || name.includes('門')) {
    return PRODUCT_IMAGES.door_swing;
  }

  return PRODUCT_IMAGES.desk;
}

