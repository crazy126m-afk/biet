/**
 * BIET Davangere - Smart Campus 360 Full Client Application (v2.1)
 * Real-World Satellite Geospatial Map, Live Direction Guidance,
 * Real BIET Faculty Directory & Cabin Status Switcher,
 * Targeted Emergency SOS Dispatch, Lost & Found Hub, and PWA Mobile Shell.
 */

// Global State
let currentView = 'alerts';
let allAlerts = [];
let allFaculty = [];
let allLostFound = [];
let allLocations = [];
let lastSeenNotificationId = null;
let unreadNotifications = [];
let deferredInstallPrompt = null;
let currentUser = null; // { role: 'student'|'faculty'|'admin', ... }

// Audio Context & Synthesizer
let audioCtx = null;
let localSirenOsc = null;
let isLocalSirenPlaying = false;

// Real-World Satellite Map State
let realSatMap = null;
let satRoutePolyline = null;
let userLiveMarker = null;
let userCurrentCoords = { lat: 14.4537, lng: 75.9159 }; // Default Gate 1
let isTrackingGPS = false;
let simulationInterval = null;
let currentTileLayer = null;

// 3D Three.js Scene Variables
let threeScene, threeCamera, threeRenderer, threeControls;
let buildingMeshes = {};
let activeRouteLine = null;
let is3DAutoRotating = false;

// High-Res Professional Fallback Avatars
const FALLBACK_AVATARS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
  'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'
];

// ==========================================
// 1. INITIALIZATION ON DOM LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initServiceWorker();
  initPWAInstallPrompt();
  initUserSession();
  
  // Load core data
  loadAlerts();
  loadLocations();
  loadFaculty();
  loadLostFound();
  loadEmergencyContacts();
  lookupStudentERP('4BD23CS001');

  // Start real-time notifications poller
  startNotificationPolling();

  // Initialize Real-World Satellite Map
  setTimeout(() => {
    initRealSatelliteMap();
    init3DScene();
  }, 250);
});

// ==========================================
// 2. LIVE CLOCK & HELPERS
// ==========================================
function initClock() {
  const clockEl = document.getElementById('live-time');
  function update() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = 'Davangere ' + now.toLocaleTimeString('en-US', { hour12: true });
    }
  }
  update();
  setInterval(update, 1000);
}

// ==========================================
// 3. AUDIO SYNTHESIZER (WEB AUDIO API)
// ==========================================
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playChimeSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    console.warn('Audio chime warning:', e);
  }
}

// Local deterrent siren on the victim's phone only (optional user toggle)
function startLocalSiren() {
  try {
    const ctx = getAudioContext();
    isLocalSirenPlaying = true;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.connect(ctx.destination);

    localSirenOsc = ctx.createOscillator();
    localSirenOsc.type = 'sawtooth';
    localSirenOsc.connect(gain);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 1.8;
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(localSirenOsc.frequency);
    localSirenOsc.frequency.value = 750;

    lfo.start();
    localSirenOsc.start();

    // Visual red strobe
    const overlay = document.getElementById('siren-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.classList.add('siren-active-overlay');
    }
  } catch (e) {
    console.warn(e);
  }
}

function stopLocalSiren() {
  isLocalSirenPlaying = false;
  if (localSirenOsc) {
    try { localSirenOsc.stop(); localSirenOsc.disconnect(); } catch (e) {}
    localSirenOsc = null;
  }
  const overlay = document.getElementById('siren-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.classList.remove('siren-active-overlay');
  }
}

// ==========================================
// 4. REAL-TIME NOTIFICATIONS POP-UP SYSTEM
// ==========================================
function startNotificationPolling() {
  fetchNotifications();
  setInterval(fetchNotifications, 4000);
}

async function fetchNotifications() {
  try {
    const res = await fetch('/api/live-notifications');
    const data = await res.json();
    const list = data.notifications || [];

    if (list.length > 0) {
      const latest = list[list.length - 1];
      if (lastSeenNotificationId && latest.id !== lastSeenNotificationId) {
        // Only pop up public notifications, NOT private/targeted security dispatches!
        if (!latest.target_only) {
          showPopUpNotification(latest);
        }
      }
      lastSeenNotificationId = latest.id;
      unreadNotifications = list.slice().reverse();
      renderNotificationTray();
    }
  } catch (e) {
    console.debug('Polling notification error:', e);
  }
}

function showPopUpNotification(notify) {
  const banner = document.getElementById('notification-banner');
  const title = document.getElementById('notify-title');
  const msg = document.getElementById('notify-msg');
  const iconContainer = document.getElementById('notify-icon-container');
  const actionBtn = document.getElementById('notify-action-btn');

  if (!banner || !title || !msg) return;

  title.textContent = notify.title;
  msg.textContent = notify.message;

  if (notify.type === 'lost_found') {
    iconContainer.className = 'w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 text-lg';
    iconContainer.innerHTML = '<i class="fa-solid fa-box-open"></i>';
    actionBtn.onclick = () => { switchView('lostfound'); dismissNotification(); };
  } else if (notify.type === 'faculty_update') {
    iconContainer.className = 'w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-lg';
    iconContainer.innerHTML = '<i class="fa-solid fa-chalkboard-user"></i>';
    actionBtn.onclick = () => { switchView('faculty'); dismissNotification(); };
  } else {
    iconContainer.className = 'w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 text-lg';
    iconContainer.innerHTML = '<i class="fa-solid fa-bullhorn"></i>';
    actionBtn.onclick = () => { switchView('alerts'); dismissNotification(); };
  }

  playChimeSound();

  banner.classList.remove('hidden');
  banner.classList.add('notification-popup-animate');

  setTimeout(() => {
    dismissNotification();
  }, 6500);
}

function dismissNotification() {
  const banner = document.getElementById('notification-banner');
  if (banner) {
    banner.classList.add('hidden');
    banner.classList.remove('notification-popup-animate');
  }
}

// Graceful non-blocking toast banner replacement for native alert
const _origAlert = window.alert;
window.alert = function(msg) {
  console.log('[BIET Alert Toast]:', msg);
  showPopUpNotification({
    title: 'Campus Notice',
    message: String(msg).replace(/\n/g, ' • '),
    type: 'general'
  });
};

function toggleNotificationDrawer() {
  const drawer = document.getElementById('notification-drawer');
  if (drawer) drawer.classList.toggle('hidden');
}

function renderNotificationTray() {
  const listEl = document.getElementById('notification-tray-list');
  const badgeEl = document.getElementById('unread-badge');
  if (!listEl) return;

  if (badgeEl) {
    badgeEl.textContent = unreadNotifications.length;
    badgeEl.style.display = unreadNotifications.length > 0 ? 'flex' : 'none';
  }

  if (unreadNotifications.length === 0) {
    listEl.innerHTML = '<div class="text-slate-500 text-center py-4">No unread notifications</div>';
    return;
  }

  listEl.innerHTML = unreadNotifications.map(n => `
    <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition">
      <div class="flex items-center justify-between text-[11px] font-bold text-white mb-0.5">
        <span class="truncate">${n.title}</span>
        <span class="text-[9px] text-slate-400 font-mono">${(n.timestamp || '').split(' ')[1] || 'Now'}</span>
      </div>
      <p class="text-[10px] text-slate-300 line-clamp-2">${n.message}</p>
    </div>
  `).join('');
}

function clearNotifications() {
  unreadNotifications = [];
  renderNotificationTray();
  toggleNotificationDrawer();
}

// ==========================================
// 5. VIEW SWITCHER
// ==========================================
function switchView(viewName) {
  currentView = viewName;
  const views = ['alerts', 'map', 'lostfound', 'faculty', 'erp', 'emergency'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');

  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`nav-${viewName}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (viewName === 'map') {
    setTimeout(() => {
      if (realSatMap) realSatMap.invalidateSize();
      onThreeWindowResize();
    }, 150);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 6. REAL-WORLD SATELLITE MAP & DIRECTION ENGINE
// ==========================================
async function loadLocations() {
  try {
    const res = await fetch('/api/locations');
    const data = await res.json();
    allLocations = data.locations || [];
    renderLandmarks(allLocations);
    populateRouteDropdowns(allLocations);
    populateBuildingPinsOnSatellite(allLocations);
  } catch (e) {
    console.error('Error loading locations:', e);
  }
}

function renderLandmarks(locs) {
  const grid = document.getElementById('landmarks-grid');
  if (!grid) return;

  grid.innerHTML = locs.map(l => `
    <div onclick="focusBuildingOnSatellite(${l.lat}, ${l.lng}, '${l.name}')" class="glass-panel-interactive p-3.5 rounded-2xl cursor-pointer space-y-2 border border-white/10">
      <div class="h-28 w-full rounded-xl overflow-hidden relative">
        <img src="${l.image_url}" alt="${l.name}" class="w-full h-full object-cover">
        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 font-bold">
          ${l.code}
        </span>
      </div>
      <div>
        <h4 class="text-xs font-bold text-white truncate">${l.name}</h4>
        <span class="text-[10px] text-cyan-400 font-medium block">${l.category} • ${l.floor_info}</span>
        <p class="text-[11px] text-slate-300 line-clamp-2 mt-1">${l.facilities}</p>
      </div>
      <div class="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5">
        <span class="text-cyan-400 flex items-center gap-1 font-semibold">
          <i class="fa-solid fa-location-dot"></i> View on Satellite
        </span>
        <button onclick="event.stopPropagation(); setDestinationAndRoute('${l.code}')" class="px-2 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 text-[10px] transition">
          Direction Here
        </button>
      </div>
    </div>
  `).join('');
}

function populateRouteDropdowns(locs) {
  const startSelect = document.getElementById('route-start');
  const endSelect = document.getElementById('route-end');
  if (!startSelect || !endSelect) return;

  const startOpts = `
    <option value="GPS_CURRENT">📍 My Live GPS Location</option>
    ${locs.map(l => `<option value="${l.code}">${l.name} (${l.code})</option>`).join('')}
  `;
  const endOpts = locs.map(l => `<option value="${l.code}">${l.name} (${l.code})</option>`).join('');

  startSelect.innerHTML = startOpts;
  endSelect.innerHTML = endOpts;

  startSelect.value = 'GATE-01';
  endSelect.value = 'TECH-CS';
}

function setDestinationAndRoute(code) {
  const endSelect = document.getElementById('route-end');
  if (endSelect) endSelect.value = code;
  calculateSatelliteRoute();
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

// Initialize Real-World Satellite Aerial Map (Esri World Imagery)
function initRealSatelliteMap() {
  const mapContainer = document.getElementById('real-satellite-map');
  if (!mapContainer || realSatMap) return;

  // BIET Campus Davangere: 14.4533° N, 75.9177° E
  realSatMap = L.map('real-satellite-map', {
    center: [14.4533, 75.9177],
    zoom: 17,
    maxZoom: 19,
    minZoom: 15
  });

  // Default Layer: Esri High-Resolution World Satellite Imagery
  currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics | BIET Davangere',
    maxZoom: 19
  }).addTo(realSatMap);

  // Add Campus Perimeter Polygon Overlay
  const bietBounds = [
    [14.4549, 75.9158],
    [14.4552, 75.9192],
    [14.4517, 75.9196],
    [14.4515, 75.9162]
  ];
  L.polygon(bietBounds, {
    color: '#8B5CF6',
    weight: 2,
    dashArray: '6, 6',
    fillColor: '#8B5CF6',
    fillOpacity: 0.08
  }).addTo(realSatMap).bindTooltip("🏛️ BIET Davangere 63-Acre Campus Perimeter", { sticky: true });
}

function populateBuildingPinsOnSatellite(locs) {
  if (!realSatMap) return;

  locs.forEach(l => {
    // Custom Glassmorphic Marker Icon
    const customIcon = L.divIcon({
      className: 'custom-sat-pin',
      html: `
        <div style="background: rgba(18, 22, 37, 0.9); border: 2px solid #06B6D4; color: #fff; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; items-center; gap: 4px;">
          <span style="color: #06B6D4;">📍</span> ${l.name.split(' ')[0]}
        </div>
      `,
      iconSize: [80, 24],
      iconAnchor: [40, 12]
    });

    const marker = L.marker([l.lat, l.lng], { icon: customIcon }).addTo(realSatMap);
    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4; max-width: 240px;">
        <strong style="color: #06B6D4; font-size: 13px;">${l.name}</strong><br>
        <span style="color: #A78BFA; font-weight: 600;">${l.code} • ${l.floor_info}</span><br>
        <p style="margin-top: 4px; color: #E2E8F0; font-size: 11px;">${l.facilities}</p>
        <button onclick="setDestinationAndRoute('${l.code}')" style="margin-top: 8px; width: 100%; padding: 4px; background: #06B6D4; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
          Walk Here
        </button>
      </div>
    `);
  });
}

function switchMapLayer(layer) {
  const satBtn = document.getElementById('btn-layer-sat');
  const topoBtn = document.getElementById('btn-layer-topo');
  const d3Btn = document.getElementById('btn-layer-3d');
  const satContainer = document.getElementById('real-satellite-map');
  const threeContainer = document.getElementById('three-canvas-container');

  if (layer === '3d') {
    satContainer.classList.add('hidden');
    threeContainer.classList.remove('hidden');
    d3Btn.className = 'px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition';
    satBtn.className = 'px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition';
    topoBtn.className = 'px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition';
    onThreeWindowResize();
    return;
  }

  satContainer.classList.remove('hidden');
  threeContainer.classList.add('hidden');
  d3Btn.className = 'px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition';

  if (layer === 'satellite') {
    if (currentTileLayer) realSatMap.removeLayer(currentTileLayer);
    currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri | BIET Davangere',
      maxZoom: 19
    }).addTo(realSatMap);
    satBtn.className = 'px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition';
    topoBtn.className = 'px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition';
  } else if (layer === 'topo') {
    if (currentTileLayer) realSatMap.removeLayer(currentTileLayer);
    currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | BIET Davangere',
      maxZoom: 19
    }).addTo(realSatMap);
    topoBtn.className = 'px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition';
    satBtn.className = 'px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition';
  }
}

// Live GPS Location Tracking
function startLiveGPSTracking() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported on this device.');
    return;
  }

  isTrackingGPS = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userCurrentCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      updateUserMarkerOnMap(userCurrentCoords);
      realSatMap.setView([userCurrentCoords.lat, userCurrentCoords.lng], 18);
      playChimeSound();
      alert(`📍 GPS Position Locked: [${userCurrentCoords.lat.toFixed(5)}, ${userCurrentCoords.lng.toFixed(5)}]`);
    },
    (err) => {
      console.warn('GPS Error, using BIET Gate 1 default:', err);
      // Fallback to Main Gate 1
      userCurrentCoords = { lat: 14.4537, lng: 75.9159 };
      updateUserMarkerOnMap(userCurrentCoords);
      realSatMap.setView([userCurrentCoords.lat, userCurrentCoords.lng], 18);
      alert('Using BIET Main Gate as your current location.');
    },
    { enableHighAccuracy: true }
  );
}

function updateUserMarkerOnMap(coords) {
  if (!realSatMap) return;

  if (userLiveMarker) {
    userLiveMarker.setLatLng([coords.lat, coords.lng]);
  } else {
    const userIcon = L.divIcon({
      className: 'user-live-pin',
      html: `
        <div style="position: relative; width: 24px; height: 24px; background: #06B6D4; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 15px rgba(6,182,212,0.8);">
          <div style="position: absolute; inset: -8px; border: 2px solid #06B6D4; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    userLiveMarker = L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(realSatMap);
    userLiveMarker.bindPopup("<strong>You Are Here</strong> (Live Position)");
  }
}

// Calculate Real-World Walking Direction from Current Position
function calculateSatelliteRoute() {
  const startCode = document.getElementById('route-start').value;
  const endCode = document.getElementById('route-end').value;

  let startCoords = userCurrentCoords;
  if (startCode !== 'GPS_CURRENT') {
    const startLoc = allLocations.find(l => l.code === startCode);
    if (startLoc) startCoords = { lat: startLoc.lat, lng: startLoc.lng };
  }

  const endLoc = allLocations.find(l => l.code === endCode);
  if (!endLoc || !realSatMap) return;

  // Clear existing polyline
  if (satRoutePolyline) {
    realSatMap.removeLayer(satRoutePolyline);
  }

  // Calculate distance in meters using Haversine formula
  const dLat = (endLoc.lat - startCoords.lat) * Math.PI / 180;
  const dLng = (endLoc.lng - startCoords.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(startCoords.lat * Math.PI / 180) * Math.cos(endLoc.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const meters = Math.round(6371000 * c);
  const minutes = (meters / 75).toFixed(1); // 75m per min walk

  // Calculate compass bearing angle
  const y = Math.sin(dLng) * Math.cos(endLoc.lat * Math.PI / 180);
  const x = Math.cos(startCoords.lat * Math.PI / 180) * Math.sin(endLoc.lat * Math.PI / 180) -
            Math.sin(startCoords.lat * Math.PI / 180) * Math.cos(endLoc.lat * Math.PI / 180) * Math.cos(dLng);
  let bearing = Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
  let compassDirection = bearing >= 315 || bearing < 45 ? 'North' :
                         bearing >= 45 && bearing < 135 ? 'East' :
                         bearing >= 135 && bearing < 225 ? 'South' : 'West';

  // Realistic path route via campus quadrangle spine
  const midLat = (startCoords.lat + endLoc.lat) / 2;
  const midLng = (startCoords.lng + endLoc.lng) / 2;
  const latlngs = [
    [startCoords.lat, startCoords.lng],
    [startCoords.lat, midLng],
    [midLat, midLng],
    [endLoc.lat, midLng],
    [endLoc.lat, endLoc.lng]
  ];

  satRoutePolyline = L.polyline(latlngs, {
    color: '#06B6D4',
    weight: 5,
    opacity: 0.95,
    dashArray: '8, 8',
    className: 'animated-route-line'
  }).addTo(realSatMap);

  realSatMap.fitBounds(satRoutePolyline.getBounds(), { padding: [50, 50] });
  updateUserMarkerOnMap(startCoords);
  playChimeSound();

  // Update Result HUD Box
  const resultBox = document.getElementById('route-result-box');
  const distText = document.getElementById('route-distance-text');
  const timeText = document.getElementById('route-time-text');
  const bearingText = document.getElementById('route-direction-bearing');
  const stepText = document.getElementById('route-step-text');

  if (resultBox) {
    resultBox.classList.remove('hidden');
    distText.innerHTML = `<i class="fa-solid fa-arrows-left-right"></i> Distance: ${meters} Meters`;
    timeText.innerHTML = `<i class="fa-regular fa-clock"></i> ~${minutes} Mins Walk`;
    bearingText.innerHTML = `<i class="fa-solid fa-location-arrow"></i> Direction: Head ${compassDirection} (${bearing}°) towards ${endLoc.name}`;
    stepText.textContent = `Walk along the highlighted satellite pathway past the central quadrangle to arrive at ${endLoc.name}.`;
  }
}

// Live Simulated Walk along the route
function simulateWalk() {
  if (simulationInterval) clearInterval(simulationInterval);
  const endCode = document.getElementById('route-end').value;
  const endLoc = allLocations.find(l => l.code === endCode);
  if (!endLoc) return;

  calculateSatelliteRoute();

  let step = 0;
  const totalSteps = 20;
  const startLat = userCurrentCoords.lat;
  const startLng = userCurrentCoords.lng;

  simulationInterval = setInterval(() => {
    step++;
    const currentLat = startLat + (endLoc.lat - startLat) * (step / totalSteps);
    const currentLng = startLng + (endLoc.lng - startLng) * (step / totalSteps);
    userCurrentCoords = { lat: currentLat, lng: currentLng };
    updateUserMarkerOnMap(userCurrentCoords);

    if (step >= totalSteps) {
      clearInterval(simulationInterval);
      playChimeSound();
      alert(`🎯 Arrived at ${endLoc.name}!`);
    }
  }, 350);
}

function centerOnBIET() {
  if (realSatMap) {
    realSatMap.setView([14.4533, 75.9177], 17);
    playChimeSound();
  }
}

function focusBuildingOnSatellite(lat, lng, name) {
  if (realSatMap) {
    switchMapLayer('satellite');
    realSatMap.setView([lat, lng], 18);
    playChimeSound();
  }
}

// ==========================================
// 7. FACULTY DIRECTORY & CABIN STATUS SWITCHER
// ==========================================
async function loadFaculty() {
  try {
    const res = await fetch('/api/professors');
    const data = await res.json();
    allFaculty = data.professors || [];
    renderFaculty(allFaculty);
    populateFacultySelect(allFaculty);
  } catch (e) {
    console.error('Error loading faculty:', e);
  }
}

function renderFaculty(faculty) {
  const container = document.getElementById('faculty-grid');
  if (!container) return;

  const countBadge = document.getElementById('faculty-count-badge');
  if (countBadge) {
    countBadge.innerText = `${faculty.length} Faculty Members`;
  }

  if (faculty.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500 text-xs">No faculty records found matching your search.</div>';
    return;
  }

  container.innerHTML = faculty.map((f, idx) => {
    const isAvail = f.status === 'Available';
    const isLecture = f.status === 'In Lecture';
    const statusBg = isAvail ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                     isLecture ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                     'bg-purple-500/20 text-purple-300 border-purple-500/40';

    const fallbackImg = FALLBACK_AVATARS[idx % FALLBACK_AVATARS.length];

    return `
      <div class="glass-panel p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-md bg-black/40">
              <img src="${f.avatar}" onerror="this.src='${fallbackImg}'" alt="${f.name}" class="w-full h-full object-cover">
              <span class="absolute bottom-1 right-1 w-3 h-3 rounded-full ${isAvail ? 'bg-emerald-500 pulse-green' : 'bg-amber-500'} border-2 border-[#0a0c14]"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <span class="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${statusBg}">
                  ${f.status}
                </span>
                <span class="text-[10px] text-purple-400 font-mono">${f.papers_count || 3} Papers</span>
              </div>
              <h3 class="text-sm font-bold text-white truncate mt-1">${f.name}</h3>
              <p class="text-[11px] text-slate-400 truncate">${f.title}</p>
            </div>
          </div>

          <!-- Cabin Live Note -->
          <div class="p-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200">
            <i class="fa-solid fa-comment-dots text-purple-400 mr-1"></i>
            <span>${f.cabin_note || 'Available in cabin'}</span>
          </div>

          <div class="text-[11px] text-slate-300 space-y-1 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <p><i class="fa-solid fa-door-open text-purple-400 w-4"></i> Cabin: <strong class="text-slate-100">${f.cabin}</strong></p>
            <p><i class="fa-solid fa-clock text-purple-400 w-4"></i> Office: ${f.office_hours}</p>
            <p><i class="fa-solid fa-graduation-cap text-purple-400 w-4"></i> ${f.qualification}</p>
            <p class="truncate"><i class="fa-solid fa-flask text-purple-400 w-4"></i> ${f.research_areas}</p>
          </div>
        </div>

        <div class="pt-2 border-t border-white/10 space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openBookingModal(${f.id}, '${f.name.replace(/'/g, "\\'")}')" class="py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition">
              <i class="fa-regular fa-calendar-check text-xs"></i>
              <span>Book Slot</span>
            </button>
            <button onclick="viewFacultyPapers(${f.id}, '${f.name.replace(/'/g, "\\'")}', '${f.department}')" class="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition border border-white/10">
              <i class="fa-solid fa-book-open text-xs text-cyan-400"></i>
              <span>Papers (${f.papers_count || 3})</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function populateFacultySelect(faculty) {
  const sel = document.getElementById('faculty-switch-prof-id');
  if (sel) {
    sel.innerHTML = faculty.map(f => `<option value="${f.id}">${f.name} (${f.department})</option>`).join('');
  }

  const authSel = document.getElementById('auth-faculty-id');
  if (authSel) {
    authSel.innerHTML = faculty.map(f => `<option value="${f.id}">${f.name} — ${f.department} (${f.designation})</option>`).join('');
  }

  const sosTeacherSel = document.getElementById('sos-specific-teacher');
  if (sosTeacherSel) {
    sosTeacherSel.innerHTML = '<option value="">-- None (Only general responders selected above) --</option>' +
      faculty.map(f => `<option value="${f.name} [${f.department}]">${f.name} — ${f.department} (${f.cabin})</option>`).join('');
  }
}

function selectProfStatus(status) {
  document.getElementById('faculty-selected-status').value = status;
  const btns = document.querySelectorAll('.prof-status-btn');
  btns.forEach(b => {
    b.className = 'prof-status-btn p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-white/10';
  });
  event.currentTarget.className = 'prof-status-btn p-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition';
}

async function handleFacultyStatusUpdate(e) {
  e.preventDefault();
  const prof_id = document.getElementById('faculty-switch-prof-id').value;
  const pin = document.getElementById('faculty-switch-pin').value;
  const status = document.getElementById('faculty-selected-status').value;
  const cabin_note = document.getElementById('faculty-switch-note').value;

  try {
    const res = await fetch('/api/faculty/quick-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professor_id: prof_id, pin, status, cabin_note })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ ${data.message}`);
      closeModal('modal-faculty-login');
      playChimeSound();
      loadFaculty();
    } else {
      alert(data.error || 'Failed to update status.');
    }
  } catch (err) {
    console.error(err);
    alert('Network error updating status.');
  }
}

function filterFaculty(dept) {
  const pills = document.querySelectorAll('.fac-pill');
  pills.forEach(p => {
    p.classList.remove('bg-purple-600', 'text-white');
    p.classList.add('bg-white/5', 'text-slate-300');
  });
  if (window.event && window.event.target) {
    window.event.target.classList.add('bg-purple-600', 'text-white');
    window.event.target.classList.remove('bg-white/5', 'text-slate-300');
  }

  // Clear search input on department switch
  const searchInput = document.getElementById('faculty-search-input');
  if (searchInput) searchInput.value = '';

  if (dept === 'All') {
    renderFaculty(allFaculty);
  } else {
    renderFaculty(allFaculty.filter(f => 
      (f.department && f.department.toLowerCase().includes(dept.toLowerCase())) || 
      (f.title && f.title.toLowerCase().includes(dept.toLowerCase()))
    ));
  }
}

function searchFaculty(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    renderFaculty(allFaculty);
    return;
  }
  const filtered = allFaculty.filter(f => 
    (f.name && f.name.toLowerCase().includes(q)) ||
    (f.department && f.department.toLowerCase().includes(q)) ||
    (f.designation && f.designation.toLowerCase().includes(q)) ||
    (f.cabin && f.cabin.toLowerCase().includes(q)) ||
    (f.research_areas && f.research_areas.toLowerCase().includes(q)) ||
    (f.qualification && f.qualification.toLowerCase().includes(q))
  );
  renderFaculty(filtered);
}

// ==========================================
// 8. TARGETED EMERGENCY SOS DISPATCH
// ==========================================
async function handleTargetedSOS(e) {
  e.preventDefault();

  const selectedCategory = document.querySelector('input[name="sos_category"]:checked').value;
  const recipients = [];
  if (document.getElementById('rcpt-security')?.checked) recipients.push("Campus Security Gate 1");
  if (document.getElementById('rcpt-medical')?.checked) recipients.push("Bapuji Emergency Ambulance & Clinic");
  if (document.getElementById('rcpt-women')?.checked) recipients.push("Women Safety Cell");
  if (document.getElementById('rcpt-antiragging')?.checked) recipients.push("Anti-Ragging Flying Squad");
  if (document.getElementById('rcpt-faculty-hod')?.checked) recipients.push("Department HOD");
  if (document.getElementById('rcpt-faculty-mentor')?.checked) recipients.push("Faculty Proctor / Mentor");
  if (document.getElementById('rcpt-hostel-warden')?.checked) recipients.push("Chief Hostel Warden");
  if (document.getElementById('rcpt-principal-desk')?.checked) recipients.push("Principal Office Rapid Response");

  const specificTeacher = document.getElementById('sos-specific-teacher')?.value;
  if (specificTeacher) {
    recipients.push(`Direct Teacher: ${specificTeacher}`);
  }

  if (recipients.length === 0) {
    alert('Please select at least one emergency unit or faculty member to alert.');
    return;
  }

  const sender_name = document.getElementById('sos-name').value;
  const sender_phone = document.getElementById('sos-phone').value;
  const location_landmark = document.getElementById('sos-location').value;
  const note = document.getElementById('sos-note').value;
  const soundLocalSiren = document.getElementById('sos-sound-local-siren').checked;

  try {
    const res = await fetch('/api/sos/targeted-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emergency_category: selectedCategory,
        target_recipients: recipients,
        sender_name, sender_phone,
        location_landmark,
        gps_lat: userCurrentCoords.lat,
        gps_lng: userCurrentCoords.lng,
        note
      })
    });
    const data = await res.json();
    if (data.success) {
      // Show Response Card
      const respCard = document.getElementById('sos-response-card');
      const respCode = document.getElementById('sos-response-code');
      const respTime = document.getElementById('sos-response-time');
      const respMsg = document.getElementById('sos-response-msg');
      const callActions = document.getElementById('sos-immediate-call-actions');

      respCard.classList.remove('hidden');
      respCode.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> ${data.dispatch_code} Dispatched!`;
      respTime.textContent = data.dispatched_at;
      respMsg.textContent = `Your emergency distress alert was targeted directly to ${recipients.join(', ')}. Emergency responders have received your campus GPS pin: [${data.coordinates.lat.toFixed(4)}, ${data.coordinates.lng.toFixed(4)}].`;

      callActions.innerHTML = `
        <a href="tel:08192223460" class="py-2 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1">
          <i class="fa-solid fa-phone"></i> Call Security Post
        </a>
        <a href="tel:108" class="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
          <i class="fa-solid fa-truck-medical"></i> Call Ambulance (108)
        </a>
      `;

      if (soundLocalSiren) {
        startLocalSiren();
        setTimeout(stopLocalSiren, 10000); // 10 secs siren
      } else {
        playChimeSound();
      }

      alert(`🚨 TARGETED SOS SENT!\nDispatch Code: ${data.dispatch_code}\nResponders: ${recipients.join(', ')}`);
    }
  } catch (err) {
    console.error(err);
    alert('Error dispatching SOS.');
  }
}

function sharePersonalWhatsAppSOS() {
  const coords = `${userCurrentCoords.lat},${userCurrentCoords.lng}`;
  const locationName = document.getElementById('sos-location').value;
  const note = document.getElementById('sos-note').value;
  const text = encodeURIComponent(`🚨 EMERGENCY DISTRESS ALERT: I need urgent assistance at BIET Campus, Davangere!\nLocation: ${locationName}\nLive GPS Map: https://maps.google.com/?q=${coords}\nNote: ${note || 'Immediate help needed'}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

// ==========================================
// 9. LOST & FOUND, APPOINTMENTS, COPILOT & PWA
// ==========================================
async function loadAlerts() {
  try {
    const res = await fetch('/api/alerts');
    const data = await res.json();
    allAlerts = data.alerts || [];
    renderAlerts(allAlerts);
  } catch (e) {
    console.error(e);
  }
}

function renderAlerts(alerts) {
  const container = document.getElementById('alerts-grid');
  if (!container) return;

  container.innerHTML = alerts.map(a => `
    <div class="glass-panel p-4 rounded-2xl border border-white/10 space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">${a.category}</span>
        <span class="text-slate-400 font-mono">${a.timestamp}</span>
      </div>
      <h3 class="text-sm font-bold text-white">${a.title}</h3>
      <p class="text-xs text-slate-300">${a.message}</p>
    </div>
  `).join('');
}

async function loadLostFound() {
  try {
    const res = await fetch('/api/lost-found');
    const data = await res.json();
    allLostFound = data.items || [];
    renderLostFound(allLostFound);
  } catch (e) {
    console.error(e);
  }
}

function renderLostFound(items) {
  const container = document.getElementById('lostfound-grid');
  if (!container) return;

  container.innerHTML = items.map(item => {
    const isFound = item.type === 'found';
    const waNumber = item.whatsapp_number || item.contact_phone.replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`Hi ${item.contact_name}, regarding your ${item.type.toUpperCase()} post for "${item.title}" on BIET App.`);

    return `
      <div class="glass-panel p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
        <div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isFound ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
            ${isFound ? '🟢 FOUND' : '🔴 LOST'}
          </span>
          <div class="h-32 rounded-xl overflow-hidden my-2 bg-black/40">
            <img src="${item.image_url}" alt="${item.title}" class="w-full h-full object-cover">
          </div>
          <h4 class="text-xs font-bold text-white">${item.title}</h4>
          <p class="text-[11px] text-cyan-400"><i class="fa-solid fa-location-dot"></i> ${item.location_name}</p>
          <p class="text-xs text-slate-300 mt-1 line-clamp-2">${item.description}</p>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <a href="tel:${item.contact_phone}" class="py-1.5 px-2 rounded-xl bg-white/5 text-white text-xs font-semibold text-center border border-white/10">
            <i class="fa-solid fa-phone text-xs"></i> Call
          </a>
          <a href="https://wa.me/${waNumber}?text=${waText}" target="_blank" class="py-1.5 px-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold text-center">
            <i class="fa-brands fa-whatsapp text-xs"></i> WhatsApp
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function openPostLostFoundModal(type) {
  document.getElementById('form-lf-type').value = type;
  document.getElementById('modal-lf-title').textContent = type === 'found' ? 'Report Found Belonging' : 'Report Lost Belonging';
  openModal('modal-post-lostfound');
}

async function submitLostFoundItem(e) {
  e.preventDefault();
  const type = document.getElementById('form-lf-type').value;
  const title = document.getElementById('form-lf-title').value;
  const category = document.getElementById('form-lf-category').value;
  const location_name = document.getElementById('form-lf-location').value;
  const description = document.getElementById('form-lf-desc').value;
  const contact_name = document.getElementById('form-lf-name').value;
  const contact_phone = document.getElementById('form-lf-phone').value;
  let image_url = document.getElementById('form-lf-image').value.trim() || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500';

  try {
    const res = await fetch('/api/lost-found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, category, location_name, description, contact_name, contact_phone, image_url })
    });
    const data = await res.json();
    if (data.success) {
      closeModal('modal-post-lostfound');
      playChimeSound();
      loadLostFound();
      alert('Report posted & broadcast notification sent!');
    }
  } catch (err) {
    console.error(err);
  }
}

async function viewFacultyPapers(profId, profName, profDept) {
  document.getElementById('papers-prof-name').textContent = `${profName} — Research Publications`;
  document.getElementById('papers-prof-dept').textContent = profDept;
  const cont = document.getElementById('papers-list-container');
  cont.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">Loading...</div>';
  openModal('modal-faculty-papers');

  try {
    const res = await fetch(`/api/professors/${profId}/papers`);
    const data = await res.json();
    cont.innerHTML = (data.papers || []).map(p => `
      <div class="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
        <span class="text-cyan-400 font-mono font-bold">${p.year} • ${p.citations} Citations</span>
        <h4 class="font-bold text-white">${p.title}</h4>
        <p class="text-slate-300 italic text-[11px]">${p.journal}</p>
        <a href="${p.doi_url}" target="_blank" class="text-purple-400 hover:underline block text-[11px]">View DOI Link</a>
      </div>
    `).join('');
  } catch (e) {
    cont.innerHTML = '<div class="text-rose-400 text-center py-4">Failed to load papers.</div>';
  }
}

function openBookingModal(profId, profName) {
  document.getElementById('book-prof-id').value = profId;
  document.getElementById('book-slot-title').textContent = `Book Slot with ${profName}`;
  const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
  document.getElementById('book-date').value = tmr.toISOString().split('T')[0];
  openModal('modal-book-slot');
}

async function submitAppointment(e) {
  e.preventDefault();
  const prof_id = document.getElementById('book-prof-id').value;
  const student_name = document.getElementById('book-student-name').value;
  const student_usn = document.getElementById('book-student-usn').value;
  const student_email = document.getElementById('book-student-email').value;
  const date = document.getElementById('book-date').value;
  const time_slot = document.getElementById('book-time-slot').value;
  const reason = document.getElementById('book-reason').value;

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professor_id: prof_id, student_name, student_usn, student_email, date, time_slot, reason })
    });
    const data = await res.json();
    if (data.success) {
      closeModal('modal-book-slot');
      playChimeSound();
      alert(`Booking confirmed! ID: ${data.appointment_id}`);
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadEmergencyContacts() {
  try {
    const res = await fetch('/api/emergency');
    const data = await res.json();
    const grid = document.getElementById('emergency-contacts-grid');
    if (!grid) return;
    grid.innerHTML = (data.emergency_contacts || []).map(c => `
      <div class="glass-panel p-3.5 rounded-2xl flex items-center justify-between text-xs">
        <div>
          <span class="text-rose-400 text-[10px] font-bold">${c.available}</span>
          <h4 class="font-bold text-white">${c.unit_name}</h4>
          <p class="text-slate-400 text-[11px]">${c.role}</p>
          <span class="font-mono text-slate-200 block">${c.phone}</span>
        </div>
        <a href="tel:${c.phone}" class="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-sm shrink-0">
          <i class="fa-solid fa-phone"></i>
        </a>
      </div>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

async function lookupStudentERP(defaultUSN) {
  const usnInput = document.getElementById('erp-usn-input');
  const usn = (defaultUSN || (usnInput ? usnInput.value : '4BD23CS001')).trim().toUpperCase();
  const cont = document.getElementById('erp-student-card');
  const tableBody = document.getElementById('erp-subjects-body');
  const receiptEl = document.getElementById('erp-receipt-no');
  if (!cont) return;

  try {
    const res = await fetch(`/api/erp/student/${usn}`);
    const data = await res.json();
    const s = data.student;
    const subjects = data.subjects || [];
    const isSafe = (s.overall_attendance || s.attendance_percentage) >= 75.0;

    cont.innerHTML = `
      <div class="glass-panel p-4 rounded-2xl text-center border ${isSafe ? 'border-emerald-500/30' : 'border-rose-500/40'}">
        <span class="text-[10px] text-slate-400 block uppercase font-mono">Overall Attendance</span>
        <span class="text-3xl font-black ${isSafe ? 'text-emerald-400' : 'text-rose-400'}">${s.overall_attendance || s.attendance_percentage}%</span>
        <span class="text-[10px] ${isSafe ? 'text-emerald-300' : 'text-rose-300'} block">${isSafe ? '✓ Safe from VTU Detention' : '⚠️ Shortage Warning (<75%)'}</span>
      </div>
      <div class="glass-panel p-4 rounded-2xl text-center border border-white/10">
        <span class="text-[10px] text-slate-400 block uppercase font-mono">CIE Internal Marks Avg</span>
        <span class="text-3xl font-black text-purple-400">${s.cie_average} / 50</span>
        <span class="text-[10px] text-slate-400 block">Tests + Assignments</span>
      </div>
      <div class="glass-panel p-4 rounded-2xl text-center border border-white/10">
        <span class="text-[10px] text-slate-400 block uppercase font-mono">VTU Credits & CGPA</span>
        <span class="text-3xl font-black text-cyan-400">${s.cgpa_overall || 8.72}</span>
        <span class="text-[10px] text-slate-400 block">${s.credits_earned || 84} Credits Earned</span>
      </div>
      <div class="glass-panel p-4 rounded-2xl text-center border border-white/10">
        <span class="text-[10px] text-slate-400 block uppercase font-mono">VTU Examination Status</span>
        <span class="text-xs font-bold text-white block mt-2">${s.hall_ticket_status}</span>
        <span class="text-[10px] text-emerald-400 block">Center: BIET (4BD)</span>
      </div>
    `;

    if (receiptEl && s.fee_receipt_no) {
      receiptEl.textContent = s.fee_receipt_no;
    }

    // Render Subject-Wise Table
    if (tableBody && subjects.length > 0) {
      tableBody.innerHTML = subjects.map(sub => {
        const subSafe = sub.attendance_pct >= 75.0;
        return `
          <tr class="hover:bg-white/5 transition">
            <td class="py-2.5 px-3">
              <strong class="text-white block font-mono text-[11px]">${sub.subject_code}</strong>
              <span class="text-slate-300 text-[11px]">${sub.subject_name}</span>
            </td>
            <td class="py-2.5 px-3 text-slate-300">${sub.faculty_name}</td>
            <td class="py-2.5 px-3 text-center font-mono font-bold">${sub.attended_classes} / ${sub.total_classes}</td>
            <td class="py-2.5 px-3 text-center">
              <span class="px-2 py-0.5 rounded-full font-bold font-mono text-[10px] ${subSafe ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">
                ${sub.attendance_pct}%
              </span>
            </td>
            <td class="py-2.5 px-3 text-center font-mono">${sub.cie_test1}</td>
            <td class="py-2.5 px-3 text-center font-mono">${sub.cie_test2}</td>
            <td class="py-2.5 px-3 text-center font-mono font-bold text-purple-400">${sub.total_cie}</td>
            <td class="py-2.5 px-3 text-center">
              <span class="px-2 py-0.5 rounded text-[10px] ${subSafe ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
                ${subSafe ? 'Eligible' : 'Detained'}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

function switchErpTab(tab) {
  const inappView = document.getElementById('erp-tab-inapp-view');
  const frameView = document.getElementById('erp-tab-frame-view');
  const btnInapp = document.getElementById('btn-erp-inapp');
  const btnFrame = document.getElementById('btn-erp-frame');

  if (tab === 'inapp') {
    if (inappView) inappView.classList.remove('hidden');
    if (frameView) frameView.classList.add('hidden');
    if (btnInapp) btnInapp.className = 'px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold transition shadow-sm';
    if (btnFrame) btnFrame.className = 'px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold transition';
  } else {
    if (inappView) inappView.classList.add('hidden');
    if (frameView) frameView.classList.remove('hidden');
    if (btnFrame) btnFrame.className = 'px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold transition shadow-sm';
    if (btnInapp) btnInapp.className = 'px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold transition';
  }
}

async function syncBietUpdates() {
  try {
    const res = await fetch('/api/alerts/sync-biet', { method: 'POST' });
    const data = await res.json();
    playChimeSound();
    alert(`🔄 ${data.message}`);
    loadAlerts();
  } catch (err) {
    console.error(err);
  }
}

function downloadHallTicketMock() {
  const studentName = (currentUser && currentUser.name) ? currentUser.name : 'Aakash V. Patil';
  const studentUsn = (currentUser && currentUser.usn) ? currentUser.usn : '4BD23CS001';

  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>VTU Official Hall Ticket - ${studentUsn}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 25px; line-height: 1.5; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
          .box { border: 1px solid #666; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #888; padding: 8px 12px; font-size: 13px; text-align: left; }
          th { background: #eee; }
          .stamp { float: right; border: 2px solid green; color: green; font-weight: bold; padding: 6px 12px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>VISVESVARAYA TECHNOLOGICAL UNIVERSITY, BELAGAVI</h2>
          <h3>BAPUJI INSTITUTE OF ENGINEERING AND TECHNOLOGY (BIET), DAVANGERE</h3>
          <p><strong>OFFICIAL EXAMINATION HALL TICKET — ODD SEMESTER 2026-27</strong></p>
        </div>
        <div class="box">
          <div class="stamp">ELIGIBLE FOR EXAM</div>
          <p><strong>Student Name:</strong> ${studentName}</p>
          <p><strong>USN:</strong> ${studentUsn}</p>
          <p><strong>Branch:</strong> Computer Science & Engineering (B.E. 5th Sem)</p>
          <p><strong>Examination Center:</strong> BIET Davangere (College Code: 4BD)</p>
          <p><strong>Fee Status:</strong> Paid in Full (Receipt: BEA-BIET-2026-8891)</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Course Code</th>
              <th>Subject Title</th>
              <th>Timing</th>
              <th>Candidate Signature</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Dec 15, 2026</td><td>21CS51</td><td>Automata Theory & Computability</td><td>02:00 PM - 05:00 PM</td><td></td></tr>
            <tr><td>Dec 18, 2026</td><td>21CS52</td><td>Computer Networks</td><td>02:00 PM - 05:00 PM</td><td></td></tr>
            <tr><td>Dec 22, 2026</td><td>21CS53</td><td>Database Management Systems</td><td>02:00 PM - 05:00 PM</td><td></td></tr>
            <tr><td>Dec 26, 2026</td><td>21CS54</td><td>Artificial Intelligence & Principles</td><td>02:00 PM - 05:00 PM</td><td></td></tr>
          </tbody>
        </table>
        <br><br>
        <p style="margin-top: 40px; font-size: 12px;">Controller of Examinations (COE), BIET Davangere</p>
        <script>window.print();</script>
      </body>
    </html>
  `);
}

// 3D Isometric View Backup
function init3DScene() {
  const container = document.getElementById('three-canvas-container');
  const canvas = document.getElementById('three-canvas');
  if (!container || !canvas) return;

  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x0a0c14);

  threeCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000);
  threeCamera.position.set(0, 180, 260);

  threeRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  threeRenderer.setSize(container.clientWidth, container.clientHeight);

  threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.enableDamping = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  threeScene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(100, 200, 100);
  threeScene.add(dir);

  function animate() {
    requestAnimationFrame(animate);
    threeControls.update();
    threeRenderer.render(threeScene, threeCamera);
  }
  animate();
}

function onThreeWindowResize() {
  const container = document.getElementById('three-canvas-container');
  if (!container || !threeCamera || !threeRenderer) return;
  threeCamera.aspect = container.clientWidth / container.clientHeight;
  threeCamera.updateProjectionMatrix();
  threeRenderer.setSize(container.clientWidth, container.clientHeight);
}

// AI Copilot
let copilotMode = 'genz';
function toggleCopilot() { document.getElementById('copilot-drawer').classList.toggle('hidden'); }
function setCopilotMode(m) {
  copilotMode = m;
  document.getElementById('btn-copilot-genz').className = m === 'genz' ? 'px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold' : 'px-2 py-0.5 rounded-lg text-slate-400';
  document.getElementById('btn-copilot-pro').className = m === 'pro' ? 'px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold' : 'px-2 py-0.5 rounded-lg text-slate-400';
}

function askCopilot(q) {
  document.getElementById('copilot-input').value = q;
  handleCopilotSubmit(new Event('submit'));
}

async function handleCopilotSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('copilot-input');
  const box = document.getElementById('copilot-messages');
  const msg = input.value.trim();
  if (!msg) return;

  box.innerHTML += `<div class="text-right"><span class="p-2 rounded-2xl bg-purple-600 text-white text-xs inline-block">${msg}</span></div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;

  try {
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, mode: copilotMode })
    });
    const d = await res.json();
    box.innerHTML += `<div class="text-left"><span class="p-2 rounded-2xl bg-white/5 text-slate-200 text-xs inline-block">${d.reply}</span></div>`;
    box.scrollTop = box.scrollHeight;
    playChimeSound();
  } catch (err) {
    console.error(err);
  }
}

// Admin
function openAdminModal() { openModal('modal-admin'); }
function verifyAdminPIN() {
  const pin = document.getElementById('admin-pin-input').value;
  if (pin === 'biet@admin2026' || pin === '2026') {
    document.getElementById('admin-auth-box').classList.add('hidden');
    document.getElementById('admin-panel-body').classList.remove('hidden');
  } else {
    alert('Invalid PIN');
  }
}

async function submitAdminBroadcast() {
  const title = document.getElementById('admin-broadcast-title').value;
  const message = document.getElementById('admin-broadcast-msg').value;
  await fetch('/api/admin/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_pin: 'biet@admin2026', title, message, type: 'announcement' })
  });
  alert('Broadcast sent!');
  closeModal('modal-admin');
}

// PWA
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js?v=3.1').then(reg => {
      reg.update().catch(() => {});
    }).catch(() => {});
  }
}
function initPWAInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstallPrompt = e; });
}
function triggerPWAInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt = null;
  } else {
    alert('Tap browser menu (3 dots) -> Add to Home screen to install as APK app!');
  }
}

// ==========================================
// 10. UNIFIED ROLE-BASED AUTHENTICATION
// ==========================================
function initUserSession() {
  const saved = localStorage.getItem('biet_user_session');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateAuthUI();
    } catch (e) {
      currentUser = null;
    }
  } else {
    // If not logged in, prompt user with role selection gateway after a short delay!
    setTimeout(() => {
      openModal('modal-auth-login');
    }, 600);
  }
}

function switchAuthTab(role) {
  document.getElementById('auth-role').value = role;

  const tabStudent = document.getElementById('auth-tab-student');
  const tabFaculty = document.getElementById('auth-tab-faculty');
  const tabAdmin = document.getElementById('auth-tab-admin');

  const fieldsStudent = document.getElementById('auth-student-fields');
  const fieldsFaculty = document.getElementById('auth-faculty-fields');
  const fieldsAdmin = document.getElementById('auth-admin-fields');

  [tabStudent, tabFaculty, tabAdmin].forEach(t => {
    if (t) t.className = 'py-2 rounded-xl text-slate-300 hover:text-white transition flex items-center justify-center gap-1';
  });
  [fieldsStudent, fieldsFaculty, fieldsAdmin].forEach(f => {
    if (f) f.classList.add('hidden');
  });

  if (role === 'student') {
    if (tabStudent) tabStudent.className = 'py-2 rounded-xl bg-purple-600 text-white font-bold transition flex items-center justify-center gap-1';
    if (fieldsStudent) fieldsStudent.classList.remove('hidden');
  } else if (role === 'faculty') {
    if (tabFaculty) tabFaculty.className = 'py-2 rounded-xl bg-purple-600 text-white font-bold transition flex items-center justify-center gap-1';
    if (fieldsFaculty) fieldsFaculty.classList.remove('hidden');
    populateFacultyAuthDropdown();
  } else if (role === 'admin') {
    if (tabAdmin) tabAdmin.className = 'py-2 rounded-xl bg-purple-600 text-white font-bold transition flex items-center justify-center gap-1';
    if (fieldsAdmin) fieldsAdmin.classList.remove('hidden');
  }
}

function populateFacultyAuthDropdown() {
  const sel = document.getElementById('auth-faculty-id');
  if (!sel || allFaculty.length === 0) return;
  sel.innerHTML = allFaculty.map(f => `<option value="${f.id}">${f.name} — ${f.department} (${f.designation})</option>`).join('');
}

async function handleUnifiedAuthLogin(e) {
  e.preventDefault();
  const role = document.getElementById('auth-role').value;
  let identifier = '';
  let password = '';

  if (role === 'student') {
    identifier = document.getElementById('auth-student-usn').value.trim();
    password = document.getElementById('auth-student-pass').value.trim();
  } else if (role === 'faculty') {
    identifier = document.getElementById('auth-faculty-id').value;
    password = document.getElementById('auth-faculty-pass').value.trim();
  } else if (role === 'admin') {
    identifier = 'admin@bietdvg.edu';
    password = document.getElementById('auth-admin-pass').value.trim();
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, identifier, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('biet_user_session', JSON.stringify(currentUser));
      updateAuthUI();
      closeModal('modal-auth-login');
      playChimeSound();

      if (role === 'student') {
        showPopUpNotification({
          title: `🎓 Welcome, ${currentUser.name}!`,
          message: `Logged in as Student (${currentUser.usn}). Academic dossier synced.`,
          type: 'general'
        });
        lookupStudentERP(currentUser.usn);
      } else if (role === 'faculty') {
        showPopUpNotification({
          title: `👨‍🏫 Welcome, ${currentUser.name}!`,
          message: `Faculty Control Bar active. Cabin: ${currentUser.cabin}`,
          type: 'faculty_update'
        });
        loadFacultyAppointments();
      } else if (role === 'admin') {
        showPopUpNotification({
          title: `🛡️ Administrator Authenticated`,
          message: `Campus broadcast and emergency logs unlocked.`,
          type: 'general'
        });
      }
    } else {
      showPopUpNotification({
        title: 'Authentication Failed',
        message: data.error || 'Invalid credentials provided.',
        type: 'general'
      });
    }
  } catch (err) {
    console.error(err);
    showPopUpNotification({
      title: 'Network Error',
      message: 'Could not connect to authentication service.',
      type: 'general'
    });
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('biet_user_session');
  updateAuthUI();
  playChimeSound();
  showPopUpNotification({
    title: 'Logged Out',
    message: 'You have been switched to Guest browsing mode.',
    type: 'general'
  });
}

function updateAuthUI() {
  const pill = document.getElementById('user-auth-pill');
  const roleBanner = document.getElementById('role-control-banner');
  const bannerTitle = document.getElementById('role-banner-title');

  if (!currentUser) {
    if (pill) {
      pill.innerHTML = `
        <button onclick="openModal('modal-auth-login')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition">
          <i class="fa-solid fa-right-to-bracket text-xs"></i>
          <span>Sign In / Role</span>
        </button>
      `;
    }
    if (roleBanner) roleBanner.classList.add('hidden');
    return;
  }

  if (currentUser.role === 'student') {
    if (pill) {
      pill.innerHTML = `
        <div class="flex items-center gap-1.5 bg-white/5 border border-purple-500/30 rounded-xl px-2.5 py-1">
          <i class="fa-solid fa-user-graduate text-purple-400 text-xs"></i>
          <span class="text-xs font-bold text-white truncate max-w-[120px]">${currentUser.name.split(' ')[0]}</span>
          <span class="text-[10px] text-slate-400 font-mono">(${currentUser.usn})</span>
          <button onclick="logoutUser()" title="Logout" class="text-slate-400 hover:text-rose-400 ml-1">
            <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
          </button>
        </div>
      `;
    }
    if (roleBanner) roleBanner.classList.add('hidden');

    const bookName = document.getElementById('book-student-name');
    const bookUsn = document.getElementById('book-student-usn');
    if (bookName) bookName.value = currentUser.name;
    if (bookUsn) bookUsn.value = currentUser.usn;

    const lfName = document.getElementById('form-lf-name');
    if (lfName) lfName.value = currentUser.name;

  } else if (currentUser.role === 'faculty') {
    if (pill) {
      pill.innerHTML = `
        <div class="flex items-center gap-1.5 bg-purple-950/40 border border-purple-500/40 rounded-xl px-2.5 py-1">
          <i class="fa-solid fa-chalkboard-user text-purple-400 text-xs"></i>
          <span class="text-xs font-bold text-white truncate max-w-[140px]">${currentUser.name}</span>
          <button onclick="logoutUser()" title="Logout" class="text-slate-400 hover:text-rose-400 ml-1">
            <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
          </button>
        </div>
      `;
    }

    if (roleBanner) {
      roleBanner.classList.remove('hidden');
      if (bannerTitle) {
        bannerTitle.innerHTML = `<span class="text-purple-300">${currentUser.name}</span> • Cabin: <strong class="text-white">${currentUser.cabin}</strong>`;
      }
      loadFacultyAppointments();
    }

  } else if (currentUser.role === 'admin') {
    if (pill) {
      pill.innerHTML = `
        <div class="flex items-center gap-1.5 bg-rose-950/40 border border-rose-500/40 rounded-xl px-2.5 py-1">
          <i class="fa-solid fa-shield-halved text-rose-400 text-xs"></i>
          <span class="text-xs font-bold text-white">Admin Control</span>
          <button onclick="logoutUser()" title="Logout" class="text-slate-400 hover:text-rose-400 ml-1">
            <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
          </button>
        </div>
      `;
    }
    if (roleBanner) roleBanner.classList.add('hidden');
  }
}

async function quickSetFacultyStatus(status) {
  if (!currentUser || currentUser.role !== 'faculty') {
    alert('Please log in with your professor account first.');
    openModal('modal-auth-login');
    return;
  }

  const note = prompt(`Enter live note for students while you are '${status}':`, `Present in ${currentUser.cabin}`);
  if (note === null) return;

  try {
    const res = await fetch('/api/faculty/quick-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        professor_id: currentUser.id,
        pin: 'prof123',
        status,
        cabin_note: note
      })
    });
    const data = await res.json();
    if (data.success) {
      currentUser.status = status;
      currentUser.cabin_note = note;
      localStorage.setItem('biet_user_session', JSON.stringify(currentUser));
      playChimeSound();
      loadFaculty();
      alert(`✅ Status updated to '${status.toUpperCase()}'. Students will see: "${note}"`);
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadFacultyAppointments() {
  if (!currentUser || currentUser.role !== 'faculty') return;
  const countEl = document.getElementById('faculty-app-count');
  const listEl = document.getElementById('faculty-appointments-list');
  if (!listEl) return;

  try {
    const res = await fetch(`/api/faculty/${currentUser.id}/appointments`);
    const data = await res.json();
    const apps = data.appointments || [];

    if (countEl) countEl.textContent = apps.length;

    if (apps.length === 0) {
      listEl.innerHTML = '<div class="text-slate-500 text-center py-6 text-xs">No student appointments scheduled yet.</div>';
      return;
    }

    listEl.innerHTML = apps.map(a => `
      <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
        <div class="flex items-center justify-between font-bold">
          <span class="text-white">${a.student_name} (${a.student_usn})</span>
          <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">${a.status}</span>
        </div>
        <div class="text-slate-300 text-[11px] flex items-center gap-3">
          <span><i class="fa-regular fa-calendar text-purple-400"></i> ${a.date}</span>
          <span><i class="fa-regular fa-clock text-cyan-400"></i> ${a.time_slot}</span>
        </div>
        <p class="text-slate-200 mt-1">Reason: "${a.reason}"</p>
        <div class="pt-2 flex items-center justify-between text-[11px] border-t border-white/5">
          <span class="text-slate-400">Email: ${a.student_email}</span>
          <a href="tel:${a.student_phone}" class="text-purple-400 hover:underline">
            <i class="fa-solid fa-phone"></i> Call Student
          </a>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function openResetPinModal() {
  const sel = document.getElementById('set-pin-faculty-id');
  if (sel && allFaculty.length > 0) {
    sel.innerHTML = allFaculty.map(f => `<option value="${f.id}">${f.name} — ${f.department} (${f.cabin})</option>`).join('');
    const curSelected = document.getElementById('auth-faculty-id')?.value;
    if (curSelected) sel.value = curSelected;
  }
  openModal('modal-faculty-set-pin');
}

async function handleSetFacultyPinSubmit(e) {
  e.preventDefault();
  const profId = document.getElementById('set-pin-faculty-id').value;
  const newPin = document.getElementById('set-pin-new').value.trim();
  const confirmPin = document.getElementById('set-pin-confirm').value.trim();

  if (newPin !== confirmPin) {
    showPopUpNotification({
      title: 'PIN Mismatch',
      message: 'New PIN and Confirm PIN do not match.',
      type: 'general'
    });
    return;
  }

  try {
    const res = await fetch('/api/faculty/set-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professor_id: profId, new_pin: newPin })
    });
    const data = await res.json();
    if (data.success) {
      showPopUpNotification({
        title: '🔑 Private PIN Activated!',
        message: data.message,
        type: 'faculty_update'
      });
      closeModal('modal-faculty-set-pin');
      const passInput = document.getElementById('auth-faculty-pass');
      if (passInput) passInput.value = newPin;
      const authFacultySel = document.getElementById('auth-faculty-id');
      if (authFacultySel) authFacultySel.value = profId;
    } else {
      showPopUpNotification({
        title: 'Error Setting PIN',
        message: data.error || 'Failed to update PIN',
        type: 'general'
      });
    }
  } catch (err) {
    console.error(err);
    showPopUpNotification({
      title: 'Network Error',
      message: 'Could not connect to server.',
      type: 'general'
    });
  }
}
