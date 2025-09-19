/**
 * 距離・時間計算ライブラリ
 * デモ用のモック計算を提供
 */

// 主要都市の座標（デモ用）
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // 東京
  '新宿区': { lat: 35.6938, lng: 139.7036 },
  '渋谷区': { lat: 35.6580, lng: 139.7016 },
  '港区': { lat: 35.6581, lng: 139.7514 },
  '世田谷区': { lat: 35.6464, lng: 139.6533 },
  '杉並区': { lat: 35.6993, lng: 139.6363 },
  '練馬区': { lat: 35.7358, lng: 139.6519 },
  '足立区': { lat: 35.7756, lng: 139.8043 },
  '江戸川区': { lat: 35.7068, lng: 139.8683 },
  '品川区': { lat: 35.6092, lng: 139.7301 },
  
  // 神奈川
  '横浜市': { lat: 35.4478, lng: 139.6425 },
  '川崎市': { lat: 35.5308, lng: 139.7029 },
  '相模原市': { lat: 35.5761, lng: 139.3700 },
  '横須賀市': { lat: 35.2806, lng: 139.6675 },
  '藤沢市': { lat: 35.3389, lng: 139.4889 },
  '茅ヶ崎市': { lat: 35.3281, lng: 139.4039 },
  '厚木市': { lat: 35.4436, lng: 139.3619 },
  '小田原市': { lat: 35.2467, lng: 139.1558 },
  
  // 埼玉
  'さいたま市': { lat: 35.8617, lng: 139.6454 },
  '川口市': { lat: 35.8071, lng: 139.7241 },
  '所沢市': { lat: 35.7994, lng: 139.4689 },
  '越谷市': { lat: 35.8906, lng: 139.7906 },
  '草加市': { lat: 35.8256, lng: 139.8056 },
  '春日部市': { lat: 35.9756, lng: 139.7539 },
  '熊谷市': { lat: 36.1475, lng: 139.3889 },
  '川越市': { lat: 35.9253, lng: 139.4850 }
};

/**
 * Haversine公式を使って2点間の距離を計算（km）
 */
function calculateHaversineDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // 地球の半径（km）
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 距離から車での所要時間を推定（分）
 */
function estimateDrivingTime(distanceKm: number): number {
  // 都市部の平均速度を考慮
  let averageSpeed: number;
  
  if (distanceKm <= 5) {
    averageSpeed = 20; // 市内：20km/h
  } else if (distanceKm <= 15) {
    averageSpeed = 30; // 近郊：30km/h
  } else if (distanceKm <= 30) {
    averageSpeed = 40; // 郊外：40km/h
  } else {
    averageSpeed = 50; // 高速道路含む：50km/h
  }
  
  // 時間（分）= 距離（km） / 速度（km/h） * 60
  const timeHours = distanceKm / averageSpeed;
  return Math.round(timeHours * 60);
}

/**
 * ワーカーの位置から求人場所までの距離・時間を計算
 */
export function calculateDistanceAndTime(
  workerLocation: { pref: string; city: string; lat?: number; lng?: number } | null,
  jobLocation: { pref: string; city: string }
): { distance: number; duration: number; isEstimated: boolean } {
  
  // ワーカーの座標を取得
  let workerLat: number;
  let workerLng: number;
  
  if (workerLocation?.lat && workerLocation?.lng) {
    // GPS座標がある場合はそれを使用
    workerLat = workerLocation.lat;
    workerLng = workerLocation.lng;
  } else if (workerLocation?.city && CITY_COORDINATES[workerLocation.city]) {
    // 市区町村から座標を推定
    const coords = CITY_COORDINATES[workerLocation.city];
    workerLat = coords.lat;
    workerLng = coords.lng;
  } else {
    // デフォルト位置（東京駅）
    workerLat = 35.6762;
    workerLng = 139.6503;
  }
  
  // 求人場所の座標を取得
  let jobLat: number;
  let jobLng: number;
  
  if (CITY_COORDINATES[jobLocation.city]) {
    const coords = CITY_COORDINATES[jobLocation.city];
    jobLat = coords.lat;
    jobLng = coords.lng;
  } else {
    // デフォルト位置（東京駅）
    jobLat = 35.6762;
    jobLng = 139.6503;
  }
  
  // 距離計算
  const distance = calculateHaversineDistance(workerLat, workerLng, jobLat, jobLng);
  const duration = estimateDrivingTime(distance);
  
  // GPS座標があるかどうかで推定フラグを設定
  const isEstimated = !workerLocation?.lat || !workerLocation?.lng;
  
  return {
    distance: Math.round(distance * 10) / 10, // 小数点第1位まで
    duration,
    isEstimated
  };
}

/**
 * デモ用：ランダムな距離・時間を生成
 */
export function generateMockDistanceAndTime(): { distance: number; duration: number } {
  const baseDistance = 5 + Math.random() * 25; // 5-30km
  const distance = Math.round(baseDistance * 10) / 10;
  const duration = estimateDrivingTime(distance);
  
  return { distance, duration };
}