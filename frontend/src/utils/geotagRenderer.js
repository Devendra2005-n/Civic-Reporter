/**
 * Geotag Renderer Utility
 * Provides map snapshot generation, reverse geocoding, weather fetching,
 * and high-fidelity geotag overlay rendering onto canvas matching standard geotag camera stamps.
 */

export const formatDateTimeGMT = (date = new Date()) => {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${minutes}${ampm}`;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStr = days[date.getDay()];

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absOffset / 60).toString().padStart(2, '0');
  const offsetMins = (absOffset % 60).toString().padStart(2, '0');
  const gmtStr = `GMT${sign}${offsetHours}:${offsetMins}`;

  return `${timeStr} ${dayStr}  ${gmtStr}`;
};

export const formatCoordinates = (lat, lng, decimals = 4) => {
  if (lat == null || lng == null) return 'Lat /Lng --.--° | --.--°';
  const latStr = Number(lat).toFixed(decimals);
  const lngStr = Number(lng).toFixed(decimals);
  return `Lat /Lng ${latStr}° | ${lngStr}°`;
};

export const fetchWeather = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();
    const current = data.current_weather;
    if (!current) return { temp: 24, icon: '⛅', text: '⛅ 24°C' };

    const temp = Math.round(current.temperature);
    const code = current.weathercode;
    let icon = '⛅';
    if (code === 0) icon = current.is_day ? '☀️' : '🌙';
    else if (code <= 3) icon = '⛅';
    else if (code <= 48) icon = '🌫️';
    else if (code <= 67) icon = '🌧️';
    else if (code <= 77) icon = '❄️';
    else icon = '⛈️';

    return { temp, icon, text: `${icon} ${temp}°C` };
  } catch (err) {
    console.warn('Weather fetch fallback:', err.message);
    return { temp: 24, icon: '⛅', text: '⛅ 24°C' };
  }
};

export const reverseGeocodeDetails = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`,
      { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'CivicReporterApp/1.0' } }
    );
    if (!res.ok) throw new Error('Nominatim error');
    const data = await res.json();
    const addr = data.address || {};

    const city = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || 'City';
    const country = addr.country || '';
    const placeName = [city, country].filter(Boolean).join(' ') || 'Tokyo Japan';

    const road = addr.road || addr.street || addr.neighbourhood || '';
    const locality = addr.suburb || addr.city_district || addr.county || '';
    let street = [road, locality].filter(Boolean).join(', ');
    if (!street) {
      street = data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    return {
      placeName,
      street,
      city,
      country,
      state: addr.state || '',
      district: addr.state_district || addr.district || '',
      fullAddress: data.display_name || `${placeName}, ${street}`,
    };
  } catch (err) {
    console.warn('Geocoding fallback:', err.message);
    return {
      placeName: 'Civic Location',
      street: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: 'Local Area',
      country: '',
      state: '',
      district: '',
      fullAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
  }
};

export const fetchIPLocation = async () => {
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) });
    const data = await res.json();
    if (data && data.success && data.latitude && data.longitude) {
      return {
        lat: data.latitude,
        lng: data.longitude,
        city: data.city || '',
        region: data.region || '',
        country: data.country || '',
        postal: data.postal || '',
      };
    }
  } catch (err) {
    console.warn('ipwho.is fallback:', err.message);
  }

  try {
    const res2 = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(3500) });
    const d2 = await res2.json();
    if (d2 && d2.latitude && d2.longitude) {
      return {
        lat: d2.latitude,
        lng: d2.longitude,
        city: d2.cityName || '',
        region: d2.regionName || '',
        country: d2.countryName || '',
      };
    }
  } catch (err2) {
    console.warn('freeipapi fallback:', err2.message);
  }

  return {
    lat: 19.0760,
    lng: 72.8777,
    city: 'Mumbai',
    region: 'Maharashtra',
    country: 'India',
  };
};

/**
 * Converts Lat/Lng to Web Mercator tile coordinates
 */
export const latLngToTile = (lat, lng, zoom) => {
  const safeLat = (lat != null && !isNaN(lat)) ? lat : 19.0760;
  const safeLng = (lng != null && !isNaN(lng)) ? lng : 72.8777;
  const n = Math.pow(2, zoom);
  const x = ((safeLng + 180) / 360) * n;
  const latRad = (safeLat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
};

/**
 * Generates an offscreen Canvas containing a Google-Maps-styled mini map with pin
 */
export const createMiniMapCanvas = async (lat, lng, width = 160, height = 150, zoom = 16) => {
  const safeLat = (lat != null && !isNaN(lat)) ? lat : 19.0760;
  const safeLng = (lng != null && !isNaN(lng)) ? lng : 72.8777;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background fallback
  ctx.fillStyle = '#E5E7EB';
  ctx.fillRect(0, 0, width, height);

  // Calculate center in global pixel coordinates at this zoom
  const center = latLngToTile(safeLat, safeLng, zoom);
  const cx = center.x * 256;
  const cy = center.y * 256;

  const minX = cx - width / 2;
  const minY = cy - height / 2;

  const startTileX = Math.floor(minX / 256);
  const endTileX = Math.floor((minX + width) / 256);
  const startTileY = Math.floor(minY / 256);
  const endTileY = Math.floor((minY + height) / 256);

  const tilesToLoad = [];
  for (let tx = startTileX; tx <= endTileX; tx++) {
    for (let ty = startTileY; ty <= endTileY; ty++) {
      tilesToLoad.push({
        tx,
        ty,
        url: `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}.png`,
        fallbackUrl: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
        destX: tx * 256 - minX,
        destY: ty * 256 - minY,
      });
    }
  }

  // Load tile images with CORS
  const loadTile = (tile) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve({ img, tile, success: true });
      img.onerror = () => {
        // Try fallback
        const fbImg = new Image();
        fbImg.crossOrigin = 'anonymous';
        fbImg.onload = () => resolve({ img: fbImg, tile, success: true });
        fbImg.onerror = () => resolve({ img: null, tile, success: false });
        fbImg.src = tile.fallbackUrl;
      };
      img.src = tile.url;
    });
  };

  const results = await Promise.all(tilesToLoad.map(loadTile));
  let tilesDrawn = 0;
  results.forEach(({ img, tile, success }) => {
    if (success && img) {
      ctx.drawImage(img, tile.destX, tile.destY, 256, 256);
      tilesDrawn++;
    }
  });

  // If no tiles could load (offline/blocked), draw a simulated map grid
  if (tilesDrawn === 0) {
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(0, 0, width, height);
    // Draw green park
    ctx.fillStyle = '#DCFCE7';
    ctx.beginPath();
    ctx.roundRect(10, 10, width * 0.4, height * 0.5, 6);
    ctx.fill();
    // Draw roads
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.4);
    ctx.lineTo(width, height * 0.4);
    ctx.moveTo(width * 0.6, 0);
    ctx.lineTo(width * 0.6, height);
    ctx.stroke();

    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.4);
    ctx.lineTo(width, height * 0.4);
    ctx.moveTo(width * 0.6, 0);
    ctx.lineTo(width * 0.6, height);
    ctx.stroke();
  }

  // Draw Google Map Red Pin in the exact center
  const pinX = width / 2;
  const pinY = height / 2;
  const pinRadius = Math.max(9, Math.round(width * 0.055));

  // Pin shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(pinX, pinY + 2, pinRadius * 0.75, pinRadius * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red teardrop pin
  ctx.fillStyle = '#EA4335';
  ctx.beginPath();
  ctx.arc(pinX, pinY - pinRadius * 1.35, pinRadius, Math.PI * 0.8, Math.PI * 2.2);
  ctx.lineTo(pinX, pinY);
  ctx.closePath();
  ctx.fill();

  // Pin highlight ring / border
  ctx.strokeStyle = '#C5221F';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Inner dark red circle
  ctx.fillStyle = '#900C09';
  ctx.beginPath();
  ctx.arc(pinX, pinY - pinRadius * 1.35, pinRadius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Google Logo at bottom left
  const logoX = 6;
  const logoY = height - 12;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.roundRect(logoX - 3, logoY - 10, 48, 16, 3);
  ctx.fill();

  const googleLetters = [
    { char: 'G', color: '#4285F4' },
    { char: 'o', color: '#EA4335' },
    { char: 'o', color: '#FBBC05' },
    { char: 'g', color: '#4285F4' },
    { char: 'l', color: '#34A853' },
    { char: 'e', color: '#EA4335' },
  ];

  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  let curX = logoX;
  googleLetters.forEach(({ char, color }) => {
    ctx.fillStyle = color;
    ctx.fillText(char, curX, logoY - 2);
    curX += ctx.measureText(char).width;
  });

  return canvas;
};

/**
 * Truncates text if it exceeds maxWidth on a canvas context
 */
const truncateText = (ctx, text, maxWidth) => {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(`${truncated}...`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}...`;
};

/**
 * Draws the high-fidelity geotag overlay banner directly onto the photo canvas
 */
export const drawGeotagBanner = ({
  ctx,
  width,
  height,
  lat,
  lng,
  placeName = 'Tokyo Japan',
  street = '45 mountain range, South',
  weatherText = '⛅ 24°C',
  timestamp = null,
  mapCanvas = null,
}) => {
  const currentTimestamp = timestamp || formatDateTimeGMT(new Date());

  // Proportional scale factor based on standard photo width 800px
  const scale = Math.max(0.65, Math.min(2.8, width / 750));
  const overlayHeight = Math.round(145 * scale);
  const mapWidth = Math.round(overlayHeight * 1.15);
  const overlayY = height - overlayHeight;

  // 1. Draw Left Map Section
  if (mapCanvas) {
    ctx.drawImage(mapCanvas, 0, overlayY, mapWidth, overlayHeight);
  } else {
    // Fallback if mapCanvas not yet ready
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, overlayY, mapWidth, overlayHeight);
  }

  // Thin separator border between map and info panel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mapWidth, overlayY);
  ctx.lineTo(mapWidth, height);
  ctx.stroke();

  // 2. Draw Right Info Panel (Translucent Dark Background)
  const infoX = mapWidth;
  const infoW = width - mapWidth;
  ctx.fillStyle = 'rgba(10, 15, 25, 0.76)';
  ctx.fillRect(infoX, overlayY, infoW, overlayHeight);

  // Content horizontal margins
  const padLeft = Math.round(16 * scale);
  const padRight = Math.round(16 * scale);
  const textLeft = infoX + padLeft;
  const availWidth = infoW - padLeft - padRight;

  // Baseline positioning for 4 clean, evenly spaced rows
  const row1Y = overlayY + Math.round(32 * scale);
  const row2Y = overlayY + Math.round(64 * scale);
  const row3Y = overlayY + Math.round(94 * scale);
  const row4Y = overlayY + Math.round(124 * scale);

  ctx.textBaseline = 'alphabetic';

  // --- ROW 1: City Country (Left) + Weather & Temp (Right) ---
  // Right: Weather text
  ctx.font = `bold ${Math.round(20 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  const weatherWidth = ctx.measureText(weatherText).width;
  ctx.fillText(weatherText, infoX + infoW - padRight - weatherWidth, row1Y);

  // Left: Place Name (Bold, large white text)
  ctx.font = `bold ${Math.round(24 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  const maxPlaceWidth = availWidth - weatherWidth - Math.round(12 * scale);
  const safePlaceName = truncateText(ctx, placeName, maxPlaceWidth);
  ctx.fillText(safePlaceName, textLeft, row1Y);

  // --- ROW 2: Street / Locality Address ---
  ctx.font = `600 ${Math.round(16 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  const safeStreet = truncateText(ctx, street, availWidth);
  ctx.fillText(safeStreet, textLeft, row2Y);

  // --- ROW 3: Latitude & Longitude ---
  ctx.font = `bold ${Math.round(16 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  const coordText = formatCoordinates(lat, lng, 4);
  ctx.fillText(coordText, textLeft, row3Y);

  // --- ROW 4: Date, Time & GMT Offset ---
  ctx.font = `bold ${Math.round(15 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(currentTimestamp, textLeft, row4Y);
};
