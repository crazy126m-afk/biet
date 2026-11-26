function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
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

// High-Res Professional Fallback Avatars Generator (Official Institutional Styling)
function getFacultyFallbackAvatar(name) {
  const cleanName = (name || 'Faculty').replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0a1733&color=cba23e&size=200&bold=true&font-size=0.4`;
}

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
  autoSilentSyncAlerts();
  setInterval(autoSilentSyncAlerts, 120000);
  window.addEventListener('focus', autoSilentSyncAlerts);
  loadLocations();
  loadFaculty();
  loadLostFound();
  loadEmergencyContacts();
  loadQuestionBanks();
  if (currentUser && currentUser.role === 'student' && currentUser.usn) {
    lookupStudentERP(currentUser.usn);
  } else {
    lookupStudentERP('');
  }

  // Start real-time notifications poller
  startNotificationPolling();

  // Dismiss Branded Splash Screen smoothly after initial assets initialize
  setTimeout(() => {
    const splash = document.getElementById('app-splash-screen');
    if (splash) {
      splash.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => splash.remove(), 750);
    }
  }, 700);

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
  if (viewName === 'portal') {
    window.open('https://shareu.rovelabs.com/login', '_blank');
    return;
  }
  currentView = viewName;
  const views = ['alerts', 'map', 'lostfound', 'faculty', 'emergency', 'questionbank', 'placements', 'gpa', 'cheatsheets'];
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

  // Sync desktop navigation bar state
  document.querySelectorAll('[id^="desktop-nav-"]').forEach(btn => {
    btn.classList.remove('bg-white/15', 'text-white', 'font-bold');
    btn.classList.add('text-slate-300');
  });
  const activeDesktopBtn = document.getElementById(`desktop-nav-${viewName}`);
  if (activeDesktopBtn) {
    activeDesktopBtn.classList.add('bg-white/15', 'text-white', 'font-bold');
    activeDesktopBtn.classList.remove('text-slate-300');
  }

  if (viewName === 'map') {
    setTimeout(() => {
      if (realSatMap) realSatMap.invalidateSize();
      onThreeWindowResize();
    }, 150);
  }

  

  if (viewName === 'placements') loadPlacementDrives();
    if (viewName === 'gpa') autoLoadGPACourses();
  if (viewName === 'cheatsheets') loadCheatSheets();
  if (viewName === 'questionbank' && (!allQuestionBanks || allQuestionBanks.length === 0)) loadQuestionBanks();

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

// Initialize Real-World Satellite Aerial Map (Esri World Imagery + Reference Places Overlay)
let referenceLabelsLayer = null;

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
    attribution: 'Satellite &copy; Esri, Maxar | BIET Davangere',
    maxZoom: 19
  }).addTo(realSatMap);

  // Esri World Boundaries & Roads Reference Layer (Superimposes crisp campus roads, labels & landmarks)
  referenceLabelsLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Labels &copy; Esri',
    maxZoom: 19,
    pane: 'overlayPane'
  }).addTo(realSatMap);

  // Add Campus Perimeter Polygon Overlay
  const bietBounds = [
    [14.4549, 75.9158],
    [14.4552, 75.9192],
    [14.4517, 75.9196],
    [14.4515, 75.9162]
  ];
  L.polygon(bietBounds, {
    color: '#cba23e',
    weight: 2,
    dashArray: '6, 6',
    fillColor: '#cba23e',
    fillOpacity: 0.08
  }).addTo(realSatMap).bindTooltip("🏛️ BIET Davangere 63-Acre Campus Perimeter", { sticky: true });
}

function populateBuildingPinsOnSatellite(locs) {
  if (!realSatMap) return;

  const deptColors = {
    'Administration': '#cba23e',
    'Academic': '#a78bfa',
    'Library': '#38bdf8',
    'Hostel': '#34d399',
    'Sports': '#10b981',
    'Cafeteria': '#f59e0b',
    'Medical': '#f43f5e'
  };

  locs.forEach(l => {
    const color = deptColors[l.category] || '#38bdf8';
    // Custom Glassmorphic Marker Icon with Department Accent Color
    const customIcon = L.divIcon({
      className: 'custom-sat-pin',
      html: `
        <div style="background: rgba(5, 13, 31, 0.95); border: 2px solid ${color}; color: #fff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.7); display: flex; align-items: center; gap: 5px; cursor: pointer;">
          <span style="color: ${color}; font-size: 12px;">📍</span> <span>${l.name.split(' ')[0]}</span>
        </div>
      `,
      iconSize: [96, 28],
      iconAnchor: [48, 14]
    });

    const marker = L.marker([l.lat, l.lng], { icon: customIcon }).addTo(realSatMap);
    const imgHtml = l.image_url ? `<img src="${l.image_url}" class="w-full h-24 object-cover rounded-xl mb-2 border border-white/10" onerror="this.remove()">` : '';
    const gmapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}&travelmode=walking`;
    const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${l.lat},${l.lng}`;
    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4; max-width: 270px; padding: 2px;">
        ${imgHtml}
        <strong style="color: ${color}; font-size: 13px; display: block; margin-bottom: 2px;">${l.name}</strong>
        <span style="color: #cba23e; font-weight: 700; font-size: 11px;">${l.code} • ${l.floor_info}</span>
        <p style="margin-top: 5px; color: #cbd5e1; font-size: 11px; line-height: 1.35;">${l.facilities}</p>
        <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 5px;">
          <button onclick="setDestinationAndRoute('${l.code}')" style="width: 100%; padding: 6px; background: linear-gradient(135deg, #1f4178, #345798); color: #fff; border: 1px solid rgba(203, 162, 62, 0.4); border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px;">
            <span>🚶 Campus Walk Route</span>
          </button>
          <div style="display: flex; gap: 5px;">
            <a href="${gmapsNavUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-decoration: none; padding: 5px 6px; background: #0f172a; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; font-weight: 600; text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 10px;">
              <i class="fa-solid fa-diamond-turn-right" style="color: #38bdf8;"></i>
              <span>Google Maps</span>
            </a>
            <a href="${streetViewUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-decoration: none; padding: 5px 6px; background: #0f172a; color: #cba23e; border: 1px solid rgba(203, 162, 62, 0.3); border-radius: 8px; font-weight: 600; text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 10px;">
              <i class="fa-solid fa-street-view" style="color: #cba23e;"></i>
              <span>Street View 360°</span>
            </a>
          </div>
        </div>
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
    stepText.innerHTML = `
      <span>Walk along the highlighted satellite pathway past the central quadrangle to arrive at <strong>${endLoc.name}</strong>.</span>
      <div class="mt-2.5 flex items-center gap-2 flex-wrap">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${endLoc.lat},${endLoc.lng}&travelmode=walking" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-cyan-600/30">
          <i class="fa-solid fa-diamond-turn-right"></i> Start Google Maps Navigation ↗
        </a>
        <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${endLoc.lat},${endLoc.lng}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#cba23e] border border-[#cba23e]/40 font-bold text-xs inline-flex items-center gap-1.5">
          <i class="fa-solid fa-street-view"></i> Street View 360° ↗
        </a>
      </div>
    `;
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

    const fallbackImg = getFacultyFallbackAvatar(f.name);

    return `
      <div class="glass-panel p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-md bg-black/40">
              <img src="${f.avatar || fallbackImg}" onerror="this.onerror=null;this.src='${fallbackImg}'" alt="${f.name}" class="w-full h-full object-cover">
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


// SOS Real-Time Faculty / Mentor Search Autocomplete
function handleSOSTeacherSearch(val) {
  const q = (val || '').toLowerCase().trim();
  const dropdown = document.getElementById('sos-teacher-dropdown');
  if (!dropdown) return;

  if (!q) {
    renderFacultyDropdownItems(allFaculty.slice(0, 10), dropdown, 'sos');
    return;
  }

  const filtered = allFaculty.filter(f => 
    (f.name && f.name.toLowerCase().includes(q)) ||
    (f.department && f.department.toLowerCase().includes(q)) ||
    (f.designation && f.designation.toLowerCase().includes(q)) ||
    (f.cabin && f.cabin.toLowerCase().includes(q))
  );
  renderFacultyDropdownItems(filtered.slice(0, 15), dropdown, 'sos');
}

function selectSOSTeacher(profId) {
  const f = allFaculty.find(p => p.id === profId);
  if (!f) return;

  const idInput = document.getElementById('sos-specific-teacher');
  const searchBox = document.getElementById('sos-teacher-search-box');
  const card = document.getElementById('sos-teacher-selected-card');
  const dropdown = document.getElementById('sos-teacher-dropdown');

  if (idInput) idInput.value = `${f.name} [${f.department} - Cabin: ${f.cabin || 'Dept'}]`;
  if (dropdown) dropdown.classList.add('hidden');
  if (searchBox) searchBox.classList.add('hidden');

  if (card) {
    document.getElementById('sos-teacher-selected-name').textContent = f.name;
    document.getElementById('sos-teacher-selected-cabin').textContent = f.cabin || 'Dept';
    document.getElementById('sos-teacher-selected-dept').textContent = f.department;
    document.getElementById('sos-teacher-selected-desig').textContent = f.designation || 'Faculty';
    document.getElementById('sos-teacher-selected-img').src = f.avatar || '/biet-logo.png';
    card.classList.remove('hidden');
  }
}

function clearSOSTeacherSelection() {
  const idInput = document.getElementById('sos-specific-teacher');
  const searchBox = document.getElementById('sos-teacher-search-box');
  const card = document.getElementById('sos-teacher-selected-card');
  const searchInput = document.getElementById('sos-teacher-search');

  if (idInput) idInput.value = '';
  if (card) card.classList.add('hidden');
  if (searchBox) searchBox.classList.remove('hidden');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
}

function populateFacultySelect(faculty) {
  const sosTeacherSel = document.getElementById('sos-specific-teacher');
  if (sosTeacherSel) {
    sosTeacherSel.innerHTML = '<option value="">-- None (Only general responders selected above) --</option>' +
      faculty.map(f => `<option value="${f.name} [${f.department}]">${f.name} — ${f.department} (${f.cabin})</option>`).join('');
  }

  // Pre-select first professor if not already selected
  if (faculty && faculty.length > 0) {
    if (!document.getElementById('auth-faculty-id').value) selectAuthFaculty(faculty[0].id);
    if (document.getElementById('faculty-switch-prof-id') && !document.getElementById('faculty-switch-prof-id').value) selectFacultySwitch(faculty[0].id);
    if (document.getElementById('set-pin-faculty-id') && !document.getElementById('set-pin-faculty-id').value) selectSetPinFaculty(faculty[0].id);
  }
}

// ==========================================
// SEARCHABLE FACULTY AUTOCOMPLETE LOGIC
// ==========================================
function renderFacultyDropdownItems(list, dropdownEl, context) {
  if (!dropdownEl) return;
  if (!list || list.length === 0) {
    dropdownEl.innerHTML = '<div class="p-3 text-center text-slate-400 text-xs">No matching professor found</div>';
    dropdownEl.classList.remove('hidden');
    return;
  }

  dropdownEl.innerHTML = list.map(f => {
    const avatar = f.avatar || '/biet-logo.png';
    const clickHandler = context === 'auth' 
      ? `selectAuthFaculty(${f.id})` 
      : (context === 'switch' ? `selectFacultySwitch(${f.id})` : (context === 'sos' ? `selectSOSTeacher(${f.id})` : `selectSetPinFaculty(${f.id})`));
    
    return `
      <div onclick="${clickHandler}" class="p-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition border border-transparent hover:border-[#cba23e]/40 group">
        <img src="${avatar}" class="w-8 h-8 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0" onerror="this.src='/biet-logo.png'">
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white text-xs truncate group-hover:text-[#cba23e]">${f.name}</span>
            <span class="text-[10px] text-slate-400 font-mono shrink-0 ml-1">${f.cabin || ''}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[10px] text-slate-300">
            <span class="text-[#cba23e] truncate">${f.department}</span>
            <span>•</span>
            <span class="text-slate-400 truncate">${f.designation || 'Faculty'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  dropdownEl.classList.remove('hidden');
}

function handleFacultyAuthSearch(val) {
  const q = (val || '').toLowerCase().trim();
  const dropdown = document.getElementById('auth-faculty-dropdown');
  if (!dropdown) return;

  if (!q) {
    renderFacultyDropdownItems(allFaculty.slice(0, 10), dropdown, 'auth');
    return;
  }

  const filtered = allFaculty.filter(f => 
    (f.name && f.name.toLowerCase().includes(q)) ||
    (f.department && f.department.toLowerCase().includes(q)) ||
    (f.designation && f.designation.toLowerCase().includes(q)) ||
    (f.cabin && f.cabin.toLowerCase().includes(q))
  );
  renderFacultyDropdownItems(filtered.slice(0, 15), dropdown, 'auth');
}

function selectAuthFaculty(profId) {
  const f = allFaculty.find(p => p.id === profId);
  if (!f) return;

  const idInput = document.getElementById('auth-faculty-id');
  const searchBox = document.getElementById('auth-faculty-search-box');
  const card = document.getElementById('auth-faculty-selected-card');
  const dropdown = document.getElementById('auth-faculty-dropdown');
  const passInput = document.getElementById('auth-faculty-pass');

  if (idInput) idInput.value = f.id;
  if (dropdown) dropdown.classList.add('hidden');
  if (searchBox) searchBox.classList.add('hidden');

  if (card) {
    document.getElementById('auth-faculty-selected-name').textContent = f.name;
    document.getElementById('auth-faculty-selected-cabin').textContent = f.cabin || 'Cabin';
    document.getElementById('auth-faculty-selected-dept').textContent = f.department;
    document.getElementById('auth-faculty-selected-desig').textContent = f.designation || 'Faculty';
    document.getElementById('auth-faculty-selected-img').src = f.avatar || '/biet-logo.png';
    card.classList.remove('hidden');
  }

  if (passInput) {
    passInput.focus();
  }
}

function clearFacultyAuthSelection() {
  const idInput = document.getElementById('auth-faculty-id');
  const searchBox = document.getElementById('auth-faculty-search-box');
  const card = document.getElementById('auth-faculty-selected-card');
  const searchInput = document.getElementById('auth-faculty-search');

  if (idInput) idInput.value = '';
  if (card) card.classList.add('hidden');
  if (searchBox) searchBox.classList.remove('hidden');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
    handleFacultyAuthSearch('');
  }
}

function handleFacultySwitchSearch(val) {
  const q = (val || '').toLowerCase().trim();
  const dropdown = document.getElementById('faculty-switch-dropdown');
  if (!dropdown) return;
  if (!q) {
    renderFacultyDropdownItems(allFaculty.slice(0, 10), dropdown, 'switch');
    return;
  }
  const filtered = allFaculty.filter(f => 
    (f.name && f.name.toLowerCase().includes(q)) ||
    (f.department && f.department.toLowerCase().includes(q)) ||
    (f.cabin && f.cabin.toLowerCase().includes(q))
  );
  renderFacultyDropdownItems(filtered.slice(0, 15), dropdown, 'switch');
}

function selectFacultySwitch(profId) {
  const f = allFaculty.find(p => p.id === profId);
  if (!f) return;
  const idInput = document.getElementById('faculty-switch-prof-id');
  const searchBox = document.getElementById('faculty-switch-search-box');
  const card = document.getElementById('faculty-switch-selected-card');
  const dropdown = document.getElementById('faculty-switch-dropdown');
  const pinInput = document.getElementById('faculty-switch-pin');

  if (idInput) idInput.value = f.id;
  if (dropdown) dropdown.classList.add('hidden');
  if (searchBox) searchBox.classList.add('hidden');

  if (card) {
    document.getElementById('faculty-switch-selected-name').textContent = f.name;
    document.getElementById('faculty-switch-selected-dept').textContent = `${f.department} (${f.cabin || ''})`;
    document.getElementById('faculty-switch-selected-img').src = f.avatar || '/biet-logo.png';
    card.classList.remove('hidden');
  }
  if (pinInput) pinInput.focus();
}

function clearFacultySwitchSelection() {
  const idInput = document.getElementById('faculty-switch-prof-id');
  const searchBox = document.getElementById('faculty-switch-search-box');
  const card = document.getElementById('faculty-switch-selected-card');
  const searchInput = document.getElementById('faculty-switch-search');

  if (idInput) idInput.value = '';
  if (card) card.classList.add('hidden');
  if (searchBox) searchBox.classList.remove('hidden');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
    handleFacultySwitchSearch('');
  }
}

function handleSetPinSearch(val) {
  const q = (val || '').toLowerCase().trim();
  const dropdown = document.getElementById('set-pin-dropdown');
  if (!dropdown) return;
  if (!q) {
    renderFacultyDropdownItems(allFaculty.slice(0, 10), dropdown, 'set-pin');
    return;
  }
  const filtered = allFaculty.filter(f => 
    (f.name && f.name.toLowerCase().includes(q)) ||
    (f.department && f.department.toLowerCase().includes(q)) ||
    (f.cabin && f.cabin.toLowerCase().includes(q))
  );
  renderFacultyDropdownItems(filtered.slice(0, 15), dropdown, 'set-pin');
}

function selectSetPinFaculty(profId) {
  const f = allFaculty.find(p => p.id === profId);
  if (!f) return;
  const idInput = document.getElementById('set-pin-faculty-id');
  const searchBox = document.getElementById('set-pin-search-box');
  const card = document.getElementById('set-pin-selected-card');
  const dropdown = document.getElementById('set-pin-dropdown');
  const pinInput = document.getElementById('set-pin-new');

  if (idInput) idInput.value = f.id;
  if (dropdown) dropdown.classList.add('hidden');
  if (searchBox) searchBox.classList.add('hidden');

  if (card) {
    document.getElementById('set-pin-selected-name').textContent = f.name;
    document.getElementById('set-pin-selected-dept').textContent = `${f.department} (${f.cabin || ''})`;
    document.getElementById('set-pin-selected-img').src = f.avatar || '/biet-logo.png';
    card.classList.remove('hidden');
  }
  if (pinInput) pinInput.focus();
}

function clearSetPinSelection() {
  const idInput = document.getElementById('set-pin-faculty-id');
  const searchBox = document.getElementById('set-pin-search-box');
  const card = document.getElementById('set-pin-selected-card');
  const searchInput = document.getElementById('set-pin-search');

  if (idInput) idInput.value = '';
  if (card) card.classList.add('hidden');
  if (searchBox) searchBox.classList.remove('hidden');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
    handleSetPinSearch('');
  }
}

// Global outside-click listener for professor search dropdowns
document.addEventListener('click', (e) => {
  ['auth', 'switch', 'set-pin'].forEach(ctx => {
    const box = document.getElementById(ctx === 'auth' ? 'auth-faculty-search-box' : (ctx === 'switch' ? 'faculty-switch-search-box' : 'set-pin-search-box'));
    const dd = document.getElementById(ctx === 'auth' ? 'auth-faculty-dropdown' : (ctx === 'switch' ? 'faculty-switch-dropdown' : 'set-pin-dropdown'));
    if (dd && box && !box.contains(e.target)) {
      dd.classList.add('hidden');
    }
  });
});

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
  if (!prof_id) {
    alert('Please search and select a professor first.');
    return;
  }
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
    filterAlerts(currentAlertFilter || 'all');
  } catch (e) {
    console.error(e);
  }
}

async function autoSilentSyncAlerts() {
  try {
    const res = await fetch('/api/alerts/sync', { method: 'POST' });
    const data = await res.json();
    if (data && data.success) {
      const alertsRes = await fetch('/api/alerts');
      const alertsData = await alertsRes.json();
      allAlerts = alertsData.alerts || [];
      filterAlerts(currentAlertFilter || 'all');
    }
  } catch (e) {
    // Silent background sync
  }
}

let currentAlertFilter = 'all';

function filterAlerts(category) {
  currentAlertFilter = (category || 'all').toLowerCase();

  // Update active pill styling
  document.querySelectorAll('.alert-pill').forEach(btn => {
    btn.classList.remove('bg-purple-600', 'text-white');
    btn.classList.add('bg-white/5', 'text-slate-300');
  });

  const activeBtn = Array.from(document.querySelectorAll('.alert-pill')).find(btn => {
    const txt = btn.textContent.toLowerCase();
    if (currentAlertFilter === 'all') return txt.trim() === 'all';
    return txt.includes(currentAlertFilter);
  });
  if (activeBtn) {
    activeBtn.classList.add('bg-purple-600', 'text-white');
    activeBtn.classList.remove('bg-white/5', 'text-slate-300');
  }

  if (currentAlertFilter === 'all') {
    renderAlerts(allAlerts);
  } else {
    const filtered = allAlerts.filter(a => {
      const cat = (a.category || '').toLowerCase();
      const prio = (a.priority || '').toLowerCase();
      const title = (a.title || '').toLowerCase();
      const msg = (a.message || '').toLowerCase();
      if (currentAlertFilter === 'urgent') {
        return cat.includes('urgent') || cat.includes('emergency') || prio.includes('critical') || prio.includes('high') || title.includes('urgent') || title.includes('notice') || title.includes('exam');
      }
      if (currentAlertFilter === 'placement') {
        return cat.includes('placement') || title.includes('placement') || title.includes('recruitment') || title.includes('tcs') || title.includes('internship') || msg.includes('placement');
      }
      if (currentAlertFilter === 'academic') {
        return cat.includes('academic') || title.includes('exam') || title.includes('vtu') || title.includes('admit') || title.includes('library') || msg.includes('academic') || msg.includes('semester');
      }
      if (currentAlertFilter === 'event') {
        return cat.includes('event') || title.includes('event') || title.includes('symposium') || title.includes('invento') || title.includes('hackathon') || msg.includes('event');
      }
      return cat.includes(currentAlertFilter) || prio.includes(currentAlertFilter) || title.includes(currentAlertFilter);
    });
    renderAlerts(filtered);
  }
}

function renderAlerts(alerts) {
  const container = document.getElementById('alerts-grid');
  if (!container) return;

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center text-slate-400 text-xs">
        <i class="fa-solid fa-bullhorn text-lg mb-1 block text-slate-500"></i>
        No announcements in this category right now.
      </div>
    `;
    return;
  }

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

let currentLfFilter = 'all';

function filterLostFound(filter) {
  currentLfFilter = filter.toLowerCase();
  document.querySelectorAll('.lf-pill').forEach(btn => {
    btn.classList.remove('bg-purple-600', 'text-white');
    btn.classList.add('bg-white/5', 'text-slate-300');
  });
  const activeBtn = document.getElementById(`lf-pill-${filter.toLowerCase()}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-purple-600', 'text-white');
    activeBtn.classList.remove('bg-white/5', 'text-slate-300');
  }
  applyLostFoundFilters();
}

function searchLostFound() {
  applyLostFoundFilters();
}

function applyLostFoundFilters() {
  const query = (document.getElementById('lf-search-input')?.value || '').toLowerCase().trim();
  let list = allLostFound;

  if (currentLfFilter === 'lost') {
    list = list.filter(i => i.type === 'lost');
  } else if (currentLfFilter === 'found') {
    list = list.filter(i => i.type === 'found');
  } else if (currentLfFilter !== 'all') {
    list = list.filter(i => (i.category || '').toLowerCase().includes(currentLfFilter));
  }

  if (query) {
    list = list.filter(i => 
      (i.title && i.title.toLowerCase().includes(query)) ||
      (i.description && i.description.toLowerCase().includes(query)) ||
      (i.location_name && i.location_name.toLowerCase().includes(query)) ||
      (i.category && i.category.toLowerCase().includes(query))
    );
  }

  renderLostFound(list);
}

function renderLostFound(items) {
  const container = document.getElementById('lostfound-grid');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 space-y-3 glass-panel rounded-3xl border border-white/10 p-8 card-appear">
        <div class="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <h4 class="text-sm font-bold text-white">Lost & Found Depository Clean</h4>
        <p class="text-xs text-slate-300 max-w-md mx-auto">There are no reported lost or found belongings currently active on campus. All previous items were returned or claimed.</p>
        <div class="flex items-center justify-center gap-2 pt-2">
          <button onclick="openPostLostFoundModal('found')" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition flex items-center gap-1.5">
            <i class="fa-solid fa-hand-holding-hand"></i> Report Found Item
          </button>
          <button onclick="openPostLostFoundModal('lost')" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:scale-105 active:scale-95 transition flex items-center gap-1.5">
            <i class="fa-solid fa-magnifying-glass-location"></i> Report Lost Item
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const isFound = item.type === 'found';
    const waNumber = item.whatsapp_number || item.contact_phone.replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`Hi ${item.contact_name}, regarding your ${item.type.toUpperCase()} post for "${item.title}" on BIET Smart Campus App.`);
    const isVerifiedDept = item.contact_name && (item.contact_name.includes('BIET') || item.contact_name.includes('Library') || item.contact_name.includes('Department') || item.contact_name.includes('Section'));

    return `
      <div class="glass-panel p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between card-appear hover:border-[#cba23e]/40 transition">
        <div>
          <div class="flex items-center justify-between gap-1 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isFound ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}">
              ${isFound ? '🟢 FOUND' : '🔴 LOST'}
            </span>
            <span class="text-[10px] text-purple-300 font-mono px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-500/20">
              ${item.category || 'Belonging'}
            </span>
          </div>

          <div class="h-32 rounded-xl overflow-hidden my-2.5 bg-black/50 border border-white/10 relative">
            <img src="${item.image_url}" alt="${item.title}" class="w-full h-full object-cover" onerror="this.src='/biet-logo.png'; this.classList.add('p-6', 'object-contain');">
            ${isVerifiedDept ? '<span class="absolute bottom-1 right-1 px-2 py-0.5 rounded-md bg-[#0a1733]/90 text-[#e6c66d] border border-[#cba23e]/50 text-[9px] font-bold flex items-center gap-1 shadow"><i class="fa-solid fa-circle-check text-emerald-400"></i> Official Custody</span>' : ''}
          </div>

          <h4 class="text-xs font-black text-white leading-snug">${item.title}</h4>
          <p class="text-[11px] text-cyan-400 mt-1 flex items-center gap-1"><i class="fa-solid fa-location-dot"></i> ${item.location_name}</p>
          <p class="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">${item.description}</p>
          <p class="text-[10px] text-slate-400 mt-1 font-mono">Posted by: <strong class="text-slate-200">${item.contact_name}</strong> • ${item.date_time || 'Recent'}</p>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/10">
          <a href="tel:${item.contact_phone}" class="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold text-center border border-white/10 flex items-center justify-center gap-1.5 active:scale-95 transition">
            <i class="fa-solid fa-phone text-xs text-cyan-400"></i>
            <span>Call</span>
          </a>
          <a href="https://wa.me/${waNumber}?text=${waText}" target="_blank" rel="noopener noreferrer" class="py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm">
            <i class="fa-brands fa-whatsapp text-sm"></i>
            <span>WhatsApp</span>
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
  cont.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs flex items-center justify-center gap-2"><i class="fa-solid fa-spinner fa-spin text-purple-400"></i> Loading research papers...</div>';
  openModal('modal-faculty-papers');

  try {
    const res = await fetch(`/api/professors/${profId}/papers`);
    const data = await res.json();
    const papers = data.papers || [];

    if (papers.length === 0) {
      cont.innerHTML = '<div class="p-6 text-center text-slate-400 text-xs">No publications listed yet for this faculty member.</div>';
      return;
    }

    cont.innerHTML = `
      <div class="flex items-center justify-between pb-1 text-xs text-slate-400 border-b border-white/5">
        <span class="font-mono text-[11px]">${papers.length} Peer-Reviewed Articles</span>
        <span class="text-[10px] text-emerald-400 font-mono">Scopus / IEEE / Web of Science</span>
      </div>
      ${papers.map(p => `
        <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs hover:border-purple-500/40 hover:bg-white/[0.07] transition">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">Year: ${p.year}</span>
            <span class="text-purple-300 font-mono text-[11px] font-semibold"><i class="fa-solid fa-quote-right mr-1 text-[9px]"></i>${p.citations} Citations</span>
          </div>
          <h4 class="font-bold text-white text-xs leading-snug">${p.title}</h4>
          <p class="text-slate-300 italic text-[11px] flex items-center gap-1.5">
            <i class="fa-solid fa-book-bookmark text-emerald-400 text-[10px]"></i>
            <span>${p.journal}</span>
          </p>
          <div class="pt-1 flex items-center justify-between">
            <span class="text-[10px] text-slate-400 font-mono">Official Publication</span>
            <a href="${p.doi_url}" target="_blank" class="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white text-[10px] font-mono transition flex items-center gap-1 border border-purple-500/30">
              <span>View DOI</span> <i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
            </a>
          </div>
        </div>
      `).join('')}
    `;
  } catch (e) {
    cont.innerHTML = '<div class="text-rose-400 text-center py-4">Failed to load publications.</div>';
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


async function handleDirectERPLogin(overrideUsn, overridePass) {
  if (window.event && window.event.preventDefault) window.event.preventDefault();
  const usnInput = document.getElementById('erp-direct-login-usn');
  const passInput = document.getElementById('erp-direct-login-pass');
  const btn = document.getElementById('btn-erp-direct-login');

  const usn = (overrideUsn || (usnInput ? usnInput.value : '')).trim().toUpperCase();
  const password = (overridePass || (passInput ? passInput.value : '')).trim();

  if (!usn) {
    alert('Please enter your 10-character VTU USN (e.g. 4BD23CS001)');
    if (usnInput) usnInput.focus();
    return;
  }

  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Authenticating & Syncing...</span>`;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'student', identifier: usn, password: password || '79754577@Aa' })
    });
    const data = await res.json();

    if (data.success && data.user) {
      currentUser = data.user;
      currentUser.pin = pin;
      localStorage.setItem('biet_user_session', JSON.stringify(currentUser));
      updateAuthUI();
      updateErpAuthStatus();
      playChimeSound();

      // Sync ERP Dashboard records
      await lookupStudentERP(currentUser.usn);

      // Sync Timetable and GPA preferences
      syncAcademicPreferences(currentUser);

      showPopUpNotification({
        title: `🎓 Welcome, ${currentUser.name}!`,
        message: `Academic dossier synced with BIET Autonomous Portal. USN: ${currentUser.usn}`,
        type: 'general'
      });
    } else {
      alert(`⚠️ Login Failed: ${data.error || 'Please verify your USN and password.'}`);
    }
  } catch (err) {
    console.error("Direct ERP login error:", err);
    alert("Connection error while communicating with BIET Academic Portal.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

function setSampleUsn(sampleUsn) {
  const usnInput = document.getElementById('erp-direct-login-usn');
  if (usnInput) {
    usnInput.value = sampleUsn;
  }
  const mainUsnInput = document.getElementById('erp-usn-input');
  if (mainUsnInput) {
    mainUsnInput.value = sampleUsn;
  }
}

function toggleErpPasswordVisibility() {
  const passInput = document.getElementById('erp-direct-login-pass');
  const eye = document.getElementById('erp-pass-eye');
  if (!passInput) return;
  if (passInput.type === 'password') {
    passInput.type = 'text';
    if (eye) eye.className = 'fa-solid fa-eye-slash';
  } else {
    passInput.type = 'password';
    if (eye) eye.className = 'fa-solid fa-eye';
  }
}

async function syncStudentERPNow() {
  const usn = (currentUser && currentUser.role === 'student' && currentUser.usn) ||
              (document.getElementById('erp-usn-input')?.value.trim().toUpperCase()) ||
              '4BD23CS001';
  playChimeSound();
  await lookupStudentERP(usn);
  showPopUpNotification({
    title: '🔄 Dossier Synchronized',
    message: `Academic records for ${usn} refreshed from live database.`,
    type: 'general'
  });
}

function syncAcademicPreferences(student) {
  if (!student) return;
  const ttDept = document.getElementById('tt-dept-select');
  const ttSem = document.getElementById('tt-sem-select');
  if (ttDept && student.branch) {
    for (let opt of ttDept.options) {
      if (student.branch.includes(opt.value) || opt.value.includes(student.branch)) {
        ttDept.value = opt.value;
        break;
      }
    }
  }
  if (ttSem && student.semester) {
    for (let opt of ttSem.options) {
      if (student.semester.includes(opt.value) || opt.value.includes(student.semester)) {
        ttSem.value = opt.value;
        break;
      }
    }
  }

  const gpaDept = document.getElementById('gpa-dept-select');
  const gpaSem = document.getElementById('gpa-sem-select');
  if (gpaDept && student.branch) {
    for (let opt of gpaDept.options) {
      if (student.branch.includes(opt.value) || opt.value.includes(student.branch)) {
        gpaDept.value = opt.value;
        break;
      }
    }
  }
  if (gpaSem && student.semester) {
    for (let opt of gpaSem.options) {
      if (student.semester.includes(opt.value) || opt.value.includes(student.semester)) {
        gpaSem.value = opt.value;
        break;
      }
    }
  }
}

function updateErpAuthStatus() {
  const gateway = document.getElementById('erp-auth-gateway-card');
  const activeBar = document.getElementById('erp-active-session-bar');
  const sessionName = document.getElementById('erp-session-user-name');
  const sessionUsn = document.getElementById('erp-session-user-usn');
  const mainUsnInput = document.getElementById('erp-usn-input');

  if (currentUser && currentUser.role === 'student') {
    if (gateway) gateway.classList.add('hidden');
    if (activeBar) activeBar.classList.remove('hidden');
    if (sessionName) sessionName.textContent = currentUser.name || `Student (${currentUser.usn})`;
    if (sessionUsn) sessionUsn.textContent = currentUser.usn;
    if (mainUsnInput && !mainUsnInput.value) mainUsnInput.value = currentUser.usn;
  } else {
    if (gateway) gateway.classList.remove('hidden');
    if (activeBar) activeBar.classList.add('hidden');
  }
}

let currentLoadedStudent = null;

async function lookupStudentERP(defaultUSN) {
  const usnInput = document.getElementById('erp-usn-input');
  const usn = (defaultUSN || (usnInput ? usnInput.value : '') || (currentUser && currentUser.role === 'student' ? currentUser.usn : '')).trim().toUpperCase();
  const cont = document.getElementById('erp-student-card');
  const banner = document.getElementById('erp-student-identity-banner');
  const tableBody = document.getElementById('erp-subjects-body');
  const receiptEl = document.getElementById('erp-receipt-no');
  if (!cont) return;

  if (!usn) {
    if (banner) {
      banner.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-extrabold text-lg">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-white">Enter VTU USN to View Official Records</h3>
            <p class="text-xs text-slate-300 mt-0.5">Real-time sync with BIET Academic Portal. Enter your 10-character USN above.</p>
          </div>
        </div>
      `;
    }
    return;
  }

  try {
    const res = await fetch(`/api/erp/student/${usn}`);
    const data = await res.json();
    const s = data.student;
    currentLoadedStudent = s;
    const subjects = data.subjects || [];
    const isSafe = (s.overall_attendance || s.attendance_percentage) >= 75.0;

    // Render Student Identity Banner
    if (banner) {
      banner.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
            ${(s.student_name || 'S').charAt(0)}
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-extrabold text-white">${s.student_name || 'BIET Student'}</h3>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">${s.usn}</span>
              <span class="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px]">Sec ${s.section || 'A'}</span>
            </div>
            <p class="text-xs text-slate-300 mt-0.5">
              <span class="text-purple-300 font-medium">${s.branch}</span> • <span class="text-cyan-300">${s.semester}</span>
            </p>
            <p class="text-[11px] text-slate-400 mt-0.5">
              <i class="fa-solid fa-user-tie text-[10px] mr-1 text-emerald-400"></i> Proctor / Mentor: <strong class="text-slate-200">${s.mentor_name || 'Dr. Nirmala C. R.'}</strong>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-center">
          <button onclick="openEditStudentProfileModal()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5">
            <i class="fa-solid fa-user-pen text-emerald-400 text-xs"></i>
            <span>Edit My Details</span>
          </button>
        </div>
      `;
    }

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

async function openEditStudentProfileModal() {
  const usnInput = document.getElementById('erp-usn-input');
  const usn = ((usnInput && usnInput.value) || (currentUser && currentUser.usn) || '').trim().toUpperCase();
  if (!usn) {
    showPopUpNotification({
      title: 'USN Required',
      message: 'Please enter your VTU USN in the search box first.',
      type: 'general'
    });
    return;
  }

  try {
    const res = await fetch(`/api/erp/student/${usn}`);
    const data = await res.json();
    if (data && data.student) {
      const s = data.student;
      if (document.getElementById('edit-student-name')) document.getElementById('edit-student-name').value = s.student_name || '';
      if (document.getElementById('edit-student-usn')) document.getElementById('edit-student-usn').value = s.usn || usn;
      if (document.getElementById('edit-student-sem')) document.getElementById('edit-student-sem').value = s.semester || '5th Sem';
      if (document.getElementById('edit-student-branch')) document.getElementById('edit-student-branch').value = s.branch || 'Computer Science & Engineering';
      if (document.getElementById('edit-student-section')) document.getElementById('edit-student-section').value = s.section || 'A';
      if (document.getElementById('edit-student-mentor')) document.getElementById('edit-student-mentor').value = s.mentor_name || '';
      if (document.getElementById('edit-student-attendance')) document.getElementById('edit-student-attendance').value = s.overall_attendance || 85.0;
      if (document.getElementById('edit-student-cie')) document.getElementById('edit-student-cie').value = s.cie_average || 42.0;
      if (document.getElementById('edit-student-receipt')) document.getElementById('edit-student-receipt').value = s.fee_receipt_no || `BEA-BIET-2026-${usn.slice(-4)}`;
    }
  } catch (e) {
    console.error("Error pre-populating profile modal:", e);
    if (document.getElementById('edit-student-usn')) document.getElementById('edit-student-usn').value = usn;
  }
  openModal('modal-edit-student-profile');
}

async function handleSaveStudentProfile(e) {
  if (e && e.preventDefault) e.preventDefault();
  const usn = document.getElementById('edit-student-usn').value.trim().toUpperCase();
  const studentName = document.getElementById('edit-student-name').value.trim();
  const semester = document.getElementById('edit-student-sem').value;
  const branch = document.getElementById('edit-student-branch').value;
  const section = document.getElementById('edit-student-section').value.trim().toUpperCase();
  const mentorName = document.getElementById('edit-student-mentor').value.trim();
  const attendance = parseFloat(document.getElementById('edit-student-attendance').value);
  const cie = parseFloat(document.getElementById('edit-student-cie').value);
  const receipt = document.getElementById('edit-student-receipt').value.trim();

  try {
    const res = await fetch('/api/erp/student/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usn: usn,
        student_name: studentName,
        semester: semester,
        branch: branch,
        section: section,
        mentor_name: mentorName,
        overall_attendance: attendance,
        cie_average: cie,
        fee_receipt_no: receipt
      })
    });
    const result = await res.json();
    if (result.success) {
      closeModal('modal-edit-student-profile');
      playChimeSound();
      if (currentUser && currentUser.role === 'student' && currentUser.usn === usn) {
        currentUser.name = studentName;
        currentUser.branch = branch;
        currentUser.semester = semester;
        currentUser.section = section;
        currentUser.attendance_percentage = attendance;
        currentUser.cie_average = cie;
        localStorage.setItem('biet_user_session', JSON.stringify(currentUser));
        updateAuthUI();
        updateErpAuthStatus();
        syncAcademicPreferences(currentUser);
      }
      if (document.getElementById('erp-usn-input')) {
        document.getElementById('erp-usn-input').value = usn;
      }
      await lookupStudentERP(usn);
      alert(`✅ Profile updated! Displaying real college record for ${studentName} (${usn}).`);
    } else {
      alert(`⚠️ ${result.error || 'Failed to update student profile.'}`);
    }
  } catch (err) {
    console.error("Error saving student profile:", err);
    alert("Network error updating profile.");
  }
}

function switchErpTab(tab) {
  const inappView = document.getElementById('erp-tab-inapp-view');
  if (inappView) inappView.classList.remove('hidden');
}

// Campus Hub Bottom Sheet Toggle
function toggleCampusHubMenu() {
  const sheet = document.getElementById('campus-hub-sheet');
  if (!sheet) return;
  sheet.classList.toggle('hidden');
}

// Live Alerts Sync Engine (24/7 Updates)
async function syncLatestAlerts() {
  const btn = document.getElementById('btn-sync-alerts');
  const icon = document.getElementById('sync-alerts-icon');
  const ts = document.getElementById('alerts-sync-timestamp');
  if (icon) icon.classList.add('animate-spin');

  try {
    const res = await fetch('/api/alerts/sync', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      if (ts) ts.textContent = `Synced: ${new Date().toLocaleTimeString('en-US', { hour12: true })}`;
      playChimeSound();
      await loadAlerts();
      showPopUpNotification({
        title: '📢 Official Announcements Synced',
        message: data.message || `Connected with BIET administration (${data.new_count || 0} updates checked).`,
        type: 'general'
      });
    }
  } catch (err) {
    console.error('Alerts sync error:', err);
    await loadAlerts();
  } finally {
    if (icon) icon.classList.remove('animate-spin');
  }
}

async function syncBietUpdates() {
  await syncLatestAlerts();
}

// Emergency Panic Siren Synthesizer (Web Audio API)
let panicAudioCtx = null;
let panicOsc = null;
let panicInterval = null;
let isPanicSirenActive = false;

function togglePanicSiren() {
  isPanicSirenActive = !isPanicSirenActive;
  const btn = document.getElementById('btn-panic-siren');
  const label = document.getElementById('panic-siren-label');
  const overlay = document.getElementById('siren-overlay');

  if (isPanicSirenActive) {
    if (btn) {
      btn.classList.add('distress-strobe');
      btn.classList.remove('bg-gradient-to-r', 'from-rose-600', 'to-red-700');
    }
    if (label) label.textContent = 'Mute Panic Siren 🔊';
    if (overlay) overlay.classList.remove('hidden');

    try {
      panicAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      panicOsc = panicAudioCtx.createOscillator();
      const gain = panicAudioCtx.createGain();
      gain.gain.setValueAtTime(0.4, panicAudioCtx.currentTime);
      panicOsc.type = 'sawtooth';
      panicOsc.frequency.setValueAtTime(850, panicAudioCtx.currentTime);
      
      let toggle = false;
      panicInterval = setInterval(() => {
        if (!panicAudioCtx || !panicOsc) return;
        panicOsc.frequency.setValueAtTime(toggle ? 850 : 1300, panicAudioCtx.currentTime);
        toggle = !toggle;
      }, 350);

      panicOsc.connect(gain);
      gain.connect(panicAudioCtx.destination);
      panicOsc.start();
    } catch (e) {
      console.warn("Panic siren Web Audio API init error:", e);
    }

    // Auto-locate GPS in emergency
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
        showPopUpNotification({
          title: '🚨 Emergency GPS Coordinates Locked',
          message: `Live Location Pin: ${coords}. Security dispatched.`,
          type: 'emergency'
        });
      }, () => {}, { enableHighAccuracy: true, timeout: 5000 });
    }
  } else {
    if (btn) {
      btn.classList.remove('distress-strobe');
      btn.classList.add('bg-gradient-to-r', 'from-rose-600', 'to-red-700');
    }
    if (label) label.textContent = 'Sound Panic Siren';
    if (overlay) overlay.classList.add('hidden');

    if (panicInterval) {
      clearInterval(panicInterval);
      panicInterval = null;
    }
    if (panicOsc) {
      try { panicOsc.stop(); } catch(e){}
      panicOsc = null;
    }
    if (panicAudioCtx) {
      try { panicAudioCtx.close(); } catch(e){}
      panicAudioCtx = null;
    }
  }
}

function downloadHallTicket() {
  const studentName = (currentLoadedStudent && currentLoadedStudent.student_name) || (currentUser && currentUser.name) || 'BIET Student';
  const studentUsn = (currentLoadedStudent && currentLoadedStudent.usn) || (currentUser && currentUser.usn) || '';
  if (!studentUsn) {
    alert('Please enter your VTU USN first to download your official Hall Ticket.');
    return;
  }
  const branch = (currentLoadedStudent && currentLoadedStudent.branch) || 'Computer Science & Engineering';
  const semester = (currentLoadedStudent && currentLoadedStudent.semester) || '5th Sem B.E.';
  const feeReceipt = (currentLoadedStudent && currentLoadedStudent.fee_receipt_no) || (document.getElementById('erp-receipt-no') ? document.getElementById('erp-receipt-no').textContent : `BEA-BIET-2026-${studentUsn.slice(-4)}`);

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
          <p><strong>Branch & Semester:</strong> ${branch} (${semester})</p>
          <p><strong>Examination Center:</strong> BIET Davangere (College Code: 4BD)</p>
          <p><strong>Fee Status:</strong> Paid in Full (Receipt: ${feeReceipt})</p>
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

function downloadHallTicketMock() {
  return downloadHallTicket();
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

// Admin Command Hub & Privileged Controls
let adminFacultyList = [];

function openAdminModal() {
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('admin-auth-box')?.classList.add('hidden');
    document.getElementById('admin-panel-body')?.classList.remove('hidden');
    loadAdminDashboardData();
  } else {
    document.getElementById('admin-auth-box')?.classList.remove('hidden');
    document.getElementById('admin-panel-body')?.classList.add('hidden');
    if (document.getElementById('admin-pin-input')) {
      document.getElementById('admin-pin-input').value = '';
    }
  }
  openModal('modal-admin');
}

async function verifyAdminPIN() {
  const pin = (document.getElementById('admin-pin-input')?.value || '').trim();
  if (!pin) {
    alert('Please enter the Admin Master Password.');
    return;
  }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin', pin: pin })
    });
    const data = await res.json();
    if (data.success && data.user && data.user.role === 'admin') {
      currentUser = data.user;
      currentUser.pin = pin;
      localStorage.setItem('biet_user_session', JSON.stringify(currentUser));
      updateAuthUI();
      document.getElementById('admin-auth-box')?.classList.add('hidden');
      document.getElementById('admin-panel-body')?.classList.remove('hidden');
      loadAdminDashboardData();
      playChimeSound();
    } else {
      alert('Wrong password! Access restricted to authorized BIET personnel.');
      if (document.getElementById('admin-pin-input')) {
        document.getElementById('admin-pin-input').value = '';
        document.getElementById('admin-pin-input').focus();
      }
    }
  } catch (err) {
    console.error(err);
    alert('Network error validating Admin credentials.');
  }
}

function switchAdminHubTab(tabName) {
  const tabs = ['broadcast', 'faculty', 'sos', 'lf'];
  tabs.forEach(t => {
    const btn = document.getElementById(`adm-tab-${t}`);
    const sec = document.getElementById(`adm-section-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.className = 'py-1.5 px-2 rounded-xl bg-purple-600 text-white font-bold transition flex items-center justify-center gap-1.5';
      } else {
        btn.className = 'py-1.5 px-2 rounded-xl text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5';
      }
    }
    if (sec) {
      if (t === tabName) {
        sec.classList.remove('hidden');
      } else {
        sec.classList.add('hidden');
      }
    }
  });

  if (tabName === 'faculty' && (!adminFacultyList || adminFacultyList.length === 0)) {
    loadFaculty().then(() => {
      adminFacultyList = allFaculty || [];
      renderAdminFacultyList(adminFacultyList);
    });
  }
}

async function loadAdminDashboardData() {
  try {
    const res = await fetch('/api/admin/overview');
    const data = await res.json();
    if (data.success) {
      renderAdminSOSList(data.sos_dispatches || []);
      renderAdminLFList(data.lost_found || []);
    }
  } catch (e) {
    console.error('Error loading admin overview:', e);
  }

  if (allFaculty && allFaculty.length > 0) {
    adminFacultyList = allFaculty;
    renderAdminFacultyList(adminFacultyList);
  } else {
    try {
      const fres = await fetch('/api/faculty');
      const fdata = await fres.json();
      adminFacultyList = fdata.professors || [];
      renderAdminFacultyList(adminFacultyList);
    } catch (e) {
      console.error(e);
    }
  }
}

function refreshAdminDashboard() {
  loadAdminDashboardData();
}

function renderAdminFacultyList(list) {
  const container = document.getElementById('admin-faculty-list');
  if (!container) return;
  if (!list || list.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">No professors match your search.</div>';
    return;
  }
  container.innerHTML = list.slice(0, 60).map(p => `
    <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="font-bold text-white text-xs truncate">${p.name}</div>
        <div class="text-[10px] text-slate-400 truncate">${p.department} • Cabin: ${p.cabin || 'Dept'}</div>
      </div>
      <button onclick="adminResetFacultyPin(${p.id})" class="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[10px] font-bold transition flex items-center gap-1">
        <i class="fa-solid fa-key"></i> Reset PIN
      </button>
    </div>
  `).join('');
}

function filterAdminFaculty(q) {
  const query = (q || '').toLowerCase().trim();
  if (!query) {
    renderAdminFacultyList(adminFacultyList);
    return;
  }
  const filtered = adminFacultyList.filter(p =>
    (p.name || '').toLowerCase().includes(query) ||
    (p.department || '').toLowerCase().includes(query)
  );
  renderAdminFacultyList(filtered);
}

async function adminResetFacultyPin(profId, profName) {
  const prof = (adminFacultyList && adminFacultyList.find(p => p.id === profId)) || (allFaculty && allFaculty.find(p => p.id === profId));
  const name = profName || (prof ? prof.name : `Professor #${profId}`);
  if (!confirm(`Reset login password for ${name} back to default (biet@1234)?`)) return;
  const adminPin = (currentUser && currentUser.pin) || (document.getElementById('admin-pin-input')?.value.trim()) || '79754577@Aa';
  try {
    const res = await fetch('/api/admin/reset-faculty-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_pin: adminPin, professor_id: profId })
    });
    const d = await res.json();
    if (d.success) {
      alert(d.message || `Password for ${profName} reset to biet@1234`);
    } else {
      alert(d.error || 'Failed to reset faculty password');
    }
  } catch (e) {
    console.error(e);
    alert('Network error resetting PIN');
  }
}

function renderAdminSOSList(dispatches) {
  const container = document.getElementById('admin-sos-list');
  if (!container) return;
  if (!dispatches || dispatches.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">No emergency dispatches recorded.</div>';
    return;
  }
  container.innerHTML = dispatches.map(s => {
    const isResolved = s.status === 'Resolved';
    return `
      <div class="p-2.5 rounded-xl bg-white/5 border ${isResolved ? 'border-emerald-500/20' : 'border-rose-500/30'} flex items-center justify-between gap-2">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${isResolved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">${s.status || 'Active'}</span>
            <span class="font-bold text-white text-xs truncate">${s.distress_type || 'Emergency SOS'}</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">${s.location || 'Campus'} • ${s.contact || 'User'} • ${s.timestamp || ''}</div>
        </div>
        ${!isResolved ? `
          <button onclick="adminResolveSOS(${s.id})" class="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-[10px] font-bold transition flex items-center gap-1">
            <i class="fa-solid fa-check"></i> Mark Resolved
          </button>
        ` : '<span class="text-emerald-400 text-[10px] font-mono shrink-0">✓ Resolved</span>'}
      </div>
    `;
  }).join('');
}

async function adminResolveSOS(sosId) {
  const adminPin = (currentUser && currentUser.pin) || (document.getElementById('admin-pin-input')?.value.trim()) || '79754577@Aa';
  try {
    const res = await fetch('/api/admin/sos-resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_pin: adminPin, sos_id: sosId })
    });
    const d = await res.json();
    if (d.success) {
      loadAdminDashboardData();
    } else {
      alert(d.error || 'Failed to update SOS status');
    }
  } catch (e) {
    console.error(e);
  }
}

function renderAdminLFList(posts) {
  const container = document.getElementById('admin-lf-list');
  if (!container) return;
  if (!posts || posts.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">No lost & found posts recorded.</div>';
    return;
  }
  container.innerHTML = posts.map(item => `
    <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${item.type === 'lost' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}">${(item.type || 'item').toUpperCase()}</span>
          <span class="font-bold text-white text-xs truncate">${item.title}</span>
        </div>
        <div class="text-[10px] text-slate-400 mt-0.5">${item.location || 'Campus'} • By: ${item.reported_by || 'Anonymous'}</div>
      </div>
      <button onclick="adminDeleteLF(${item.id})" class="shrink-0 px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-bold transition flex items-center gap-1">
        <i class="fa-solid fa-trash"></i> Delete
      </button>
    </div>
  `).join('');
}

async function adminDeleteLF(id) {
  if (!confirm("Remove this Lost & Found post from campus feeds?")) return;
  try {
    const res = await fetch(`/api/lost-found/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) {
      loadAdminDashboardData();
      if (typeof loadLostAndFound === 'function') loadLostAndFound();
    }
  } catch (e) {
    console.error(e);
  }
}

async function submitAdminBroadcast() {
  const title = (document.getElementById('admin-broadcast-title')?.value || '').trim();
  const message = (document.getElementById('admin-broadcast-msg')?.value || '').trim();
  const category = document.getElementById('admin-broadcast-category')?.value || 'Urgent';
  const type = document.getElementById('admin-broadcast-type')?.value || 'announcement';

  if (!title || !message) {
    alert('Please enter both circular title and message.');
    return;
  }

  const adminPin = (currentUser && currentUser.pin) || (document.getElementById('admin-pin-input')?.value.trim()) || '79754577@Aa';
  try {
    const res = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_pin: adminPin,
        title,
        message,
        category,
        type
      })
    });
    const d = await res.json();
    if (d.success) {
      alert(d.message || 'Broadcast circular posted and pushed to all devices!');
      document.getElementById('admin-broadcast-title').value = '';
      document.getElementById('admin-broadcast-msg').value = '';
      closeModal('modal-admin');
      loadAlerts();
    } else {
      alert(d.error || 'Failed to post broadcast.');
    }
  } catch (e) {
    console.error(e);
    alert('Network error pushing broadcast.');
  }
}

// PWA
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js?v=6.0').then(reg => {
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
      if (currentUser && currentUser.role === 'student') {
        currentUser = null;
        localStorage.removeItem('biet_user_session');
      }
      updateAuthUI();
      updateErpAuthStatus();
    } catch (e) {
      currentUser = null;
    }
  } else {
    currentUser = null;
    updateAuthUI();
    updateErpAuthStatus();
  }
}

function switchAuthTab(role) {
  document.getElementById('auth-role').value = role;

  const tabFaculty = document.getElementById('auth-tab-faculty');
  const tabAdmin = document.getElementById('auth-tab-admin');

  const fieldsFaculty = document.getElementById('auth-faculty-fields');
  const fieldsAdmin = document.getElementById('auth-admin-fields');

  [tabFaculty, tabAdmin].forEach(t => {
    if (t) t.className = 'py-2 rounded-xl text-slate-300 hover:text-white transition flex items-center justify-center gap-1';
  });
  [fieldsFaculty, fieldsAdmin].forEach(f => {
    if (f) f.classList.add('hidden');
  });

  if (role === 'faculty') {
    if (tabFaculty) tabFaculty.className = 'py-2 rounded-xl bg-purple-600 text-white font-bold transition flex items-center justify-center gap-1';
    if (fieldsFaculty) fieldsFaculty.classList.remove('hidden');
    if (!document.getElementById('auth-faculty-id').value && allFaculty.length > 0) {
      selectAuthFaculty(allFaculty[0].id);
    }
  } else if (role === 'admin') {
    if (tabAdmin) tabAdmin.className = 'py-2 rounded-xl bg-purple-600 text-white font-bold transition flex items-center justify-center gap-1';
    if (fieldsAdmin) fieldsAdmin.classList.remove('hidden');
  }
}

async function handleUnifiedAuthLogin(e) {
  e.preventDefault();
  const errBox = document.getElementById('auth-login-error');
  if (errBox) errBox.classList.add('hidden');

  const role = document.getElementById('auth-role').value;
  let identifier = '';
  let password = '';

  if (role === 'faculty') {
    identifier = document.getElementById('auth-faculty-id').value;
    if (!identifier) {
      alert("Please search and select a professor first.");
      clearFacultyAuthSelection();
      return;
    }
    password = (document.getElementById('auth-faculty-pass')?.value || '').trim();
    if (!password) {
      alert("Please enter your password.");
      document.getElementById('auth-faculty-pass')?.focus();
      return;
    }
  } else if (role === 'admin') {
    identifier = 'admin@bietdvg.edu';
    password = (document.getElementById('auth-admin-pass')?.value || '').trim();
    if (!password) {
      alert("Please enter the administrator password.");
      document.getElementById('auth-admin-pass')?.focus();
      return;
    }
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
      currentUser.pin = pin;
      localStorage.setItem('biet_user_session', JSON.stringify(currentUser));
      updateAuthUI();
      closeModal('modal-auth-login');
      playChimeSound();

      if (role === 'faculty') {
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
      const errMsg = data.error || 'Wrong password! Please check your credentials and try again.';
      alert(errMsg);
      if (errBox) {
        errBox.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-400"></i> <span>${errMsg}</span>`;
        errBox.classList.remove('hidden');
      }
      if (role === 'faculty' && document.getElementById('auth-faculty-pass')) {
        document.getElementById('auth-faculty-pass').value = '';
        document.getElementById('auth-faculty-pass').focus();
      } else if (role === 'admin' && document.getElementById('auth-admin-pass')) {
        document.getElementById('auth-admin-pass').value = '';
        document.getElementById('auth-admin-pass').focus();
      }
    }
  } catch (err) {
    console.error(err);
    alert('Network error connecting to authentication service. Please try again.');
  }
}

function logoutUser() {
  currentUser = null;
  currentLoadedStudent = null;
  localStorage.removeItem('biet_user_session');
  updateAuthUI();
  updateErpAuthStatus();
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
  const adminBroadcastBtn = document.getElementById('btn-admin-broadcast-hub');

  if (adminBroadcastBtn) {
    if (currentUser && currentUser.role === 'admin') {
      adminBroadcastBtn.classList.remove('hidden');
    } else {
      adminBroadcastBtn.classList.add('hidden');
    }
  }

  if (!currentUser) {
    if (pill) {
      pill.innerHTML = `
        <button onclick="openModal('modal-auth-login')" class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1f4178] to-[#0f2148] hover:from-[#345798] text-white text-xs font-bold border border-[#cba23e]/40 shadow-sm flex items-center gap-1 transition">
          <i class="fa-solid fa-chalkboard-user text-xs text-[#cba23e]"></i>
          <span class="hidden sm:inline">Faculty Login</span>
          <span class="sm:hidden text-[11px]">Faculty</span>
        </button>
      `;
    }
    if (roleBanner) roleBanner.classList.add('hidden');
    return;
  }

  if (currentUser.role === 'faculty') {
    if (pill) {
      pill.innerHTML = `
        <div class="flex items-center gap-1 bg-purple-950/40 border border-purple-500/40 rounded-xl px-2 py-1 max-w-[120px] sm:max-w-none">
          <i class="fa-solid fa-chalkboard-user text-purple-400 text-xs"></i>
          <span class="text-xs font-bold text-white truncate max-w-[75px] sm:max-w-[140px]">${currentUser.name}</span>
          <button onclick="logoutUser()" title="Logout" class="text-slate-400 hover:text-rose-400 ml-0.5">
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
        <div class="flex items-center gap-1 bg-rose-950/40 border border-rose-500/40 rounded-xl px-2 py-1">
          <i class="fa-solid fa-shield-halved text-rose-400 text-xs"></i>
          <span class="text-xs font-bold text-white">Admin</span>
          <button onclick="openChangePasswordModal('admin')" title="Change Admin PIN" class="text-[9px] bg-rose-600/30 hover:bg-rose-600 text-rose-200 px-1.5 py-0.5 rounded border border-rose-500/40 ml-1 transition">
            PIN
          </button>
          <button onclick="logoutUser()" title="Logout" class="text-slate-400 hover:text-rose-400 ml-0.5">
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

    listEl.innerHTML = apps.map(a => {
      const isCancelled = (a.status || '').toLowerCase() === 'cancelled';
      const statusBadge = isCancelled
        ? '<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">Cancelled</span>'
        : `<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">${a.status}</span>`;

      const actionBtn = isCancelled
        ? `<button onclick="deleteAppointment(${a.id})" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1 transition"><i class="fa-solid fa-trash text-[10px]"></i> Remove</button>`
        : `<button onclick="cancelAppointment(${a.id})" class="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition"><i class="fa-solid fa-ban text-[10px]"></i> Cancel Slot</button>`;

      return `
      <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs ${isCancelled ? 'opacity-65' : ''}">
        <div class="flex items-center justify-between font-bold">
          <span class="text-white">${a.student_name} (${a.student_usn})</span>
          ${statusBadge}
        </div>
        <div class="text-slate-300 text-[11px] flex items-center gap-3">
          <span><i class="fa-regular fa-calendar text-purple-400"></i> ${a.date}</span>
          <span><i class="fa-regular fa-clock text-cyan-400"></i> ${a.time_slot}</span>
        </div>
        <p class="text-slate-200 mt-1">Reason: "${a.reason}"</p>
        <div class="pt-2 flex items-center justify-between text-[11px] border-t border-white/5">
          <span class="text-slate-400">Email: ${a.student_email}</span>
          <div class="flex items-center gap-2">
            ${a.student_phone ? `<a href="tel:${a.student_phone}" class="text-purple-400 hover:underline"><i class="fa-solid fa-phone"></i> Call</a>` : ''}
            ${actionBtn}
          </div>
        </div>
      </div>
      `;
    }).join('');
  } catch (e) {
    console.error(e);
  }
}

async function cancelAppointment(appId) {
  if (!confirm("Are you sure you want to cancel this consultation slot?")) return;
  try {
    const res = await fetch(`/api/appointments/${appId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: "Cancelled by faculty" })
    });
    const data = await res.json();
    if (data.success) {
      playChimeSound();
      showPopUpNotification({
        title: "Appointment Cancelled",
        message: data.message || `Consultation slot #${appId} cancelled.`,
        type: 'general'
      });
      loadFacultyAppointments();
    } else {
      alert(data.error || "Failed to cancel appointment");
    }
  } catch (err) {
    console.error(err);
    alert("Network error cancelling appointment");
  }
}

async function deleteAppointment(appId) {
  if (!confirm("Permanently delete this appointment record?")) return;
  try {
    const res = await fetch(`/api/appointments/${appId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadFacultyAppointments();
    }
  } catch (err) {
    console.error(err);
  }
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  if (id === 'modal-auth-login') {
    if (document.getElementById('auth-faculty-pass')) document.getElementById('auth-faculty-pass').value = '';
    if (document.getElementById('auth-admin-pass')) document.getElementById('auth-admin-pass').value = '';
    const errBox = document.getElementById('auth-login-error');
    if (errBox) errBox.classList.add('hidden');
  }
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function openChangePasswordModal(role = 'faculty') {
  switchChangePassTab(role);
  if (role === 'faculty') {
    if (currentUser && currentUser.role === 'faculty') {
      selectSetPinFaculty(currentUser.id);
    } else {
      const curSelected = document.getElementById('auth-faculty-id')?.value;
      if (curSelected) {
        selectSetPinFaculty(parseInt(curSelected));
      } else if (allFaculty && allFaculty.length > 0) {
        selectSetPinFaculty(allFaculty[0].id);
      }
    }
  }
  openModal('modal-faculty-set-pin');
}

function openResetPinModal() {
  openChangePasswordModal('faculty');
}

function switchChangePassTab(role) {
  const roleInput = document.getElementById('change-pass-role');
  if (roleInput) roleInput.value = role;

  const tabFaculty = document.getElementById('chpass-tab-faculty');
  const tabAdmin = document.getElementById('chpass-tab-admin');
  const facultyPicker = document.getElementById('chpass-faculty-picker-section');
  const currentLabel = document.getElementById('chpass-current-label');
  const securityHint = document.getElementById('chpass-security-hint');

  if (role === 'faculty') {
    if (tabFaculty) tabFaculty.className = 'py-2 rounded-xl bg-purple-600 text-white font-bold transition flex items-center justify-center gap-1.5';
    if (tabAdmin) tabAdmin.className = 'py-2 rounded-xl text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5';
    if (facultyPicker) facultyPicker.classList.remove('hidden');
    if (currentLabel) currentLabel.textContent = 'Current Password / PIN *';
    if (securityHint) securityHint.innerHTML = '';
  } else if (role === 'admin') {
    if (tabAdmin) tabAdmin.className = 'py-2 rounded-xl bg-rose-600 text-white font-bold transition flex items-center justify-center gap-1.5';
    if (tabFaculty) tabFaculty.className = 'py-2 rounded-xl text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5';
    if (facultyPicker) facultyPicker.classList.add('hidden');
    if (currentLabel) currentLabel.textContent = 'Current Administrator PIN *';
    if (securityHint) securityHint.innerHTML = '';
  }
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const role = document.getElementById('change-pass-role')?.value || 'faculty';
  const currentPin = (document.getElementById('set-pin-current')?.value || '').trim();
  const newPin = (document.getElementById('set-pin-new')?.value || '').trim();
  const confirmPin = (document.getElementById('set-pin-confirm')?.value || '').trim();

  if (!currentPin) {
    showPopUpNotification({
      title: 'Current PIN Required',
      message: role === 'admin' ? 'Please enter current Admin PIN.' : 'Please enter current Faculty Password / PIN.',
      type: 'general'
    });
    return;
  }

  if (newPin.length < 6) {
    showPopUpNotification({
      title: 'PIN Too Short',
      message: 'New password must be at least 6 characters long.',
      type: 'general'
    });
    return;
  }

  if (newPin !== confirmPin) {
    showPopUpNotification({
      title: 'Password Mismatch',
      message: 'New Password and Confirm Password do not match.',
      type: 'general'
    });
    return;
  }

  const payload = {
    role,
    current_password: currentPin,
    new_password: newPin
  };

  let profId = null;
  if (role === 'faculty') {
    profId = document.getElementById('set-pin-faculty-id')?.value;
    if (!profId) {
      alert("Please select a professor first.");
      return;
    }
    payload.professor_id = profId;
  }

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      playChimeSound();
      showPopUpNotification({
        title: '🔑 Password Updated!',
        message: data.message,
        type: 'general'
      });
      closeModal('modal-faculty-set-pin');

      if (role === 'faculty') {
        const passInput = document.getElementById('auth-faculty-pass');
        if (passInput) passInput.value = '';
      } else if (role === 'admin') {
        const adminPassInput = document.getElementById('auth-admin-pass');
        if (adminPassInput) adminPassInput.value = '';
        if (currentUser && currentUser.role === 'admin') {
          currentUser.pin = newPin;
          localStorage.setItem('biet_user_session', JSON.stringify(currentUser));
        }
      }
      alert(data.message || 'Password updated successfully! Please login with your new password.');
    } else {
      showPopUpNotification({
        title: 'Verification Failed',
        message: data.error || 'Failed to update password',
        type: 'general'
      });
    }
  } catch (err) {
    console.error(err);
    showPopUpNotification({
      title: 'Network Error',
      message: 'Could not connect to security service.',
      type: 'general'
    });
  }
}

function handleSetFacultyPinSubmit(e) {
  return handleChangePasswordSubmit(e);
}

// ==========================================
// 14. VTU & BIET QUESTION BANKS & PYQ LOGIC
// ==========================================
let allQuestionBanks = [];
let currentMCQList = [];
let currentMCQIndex = 0;
let currentMCQSelectedOpt = null;
let currentMCQScore = 0;
let activeQBDept = 'All';

async function loadQuestionBanks() {
  const container = document.getElementById('qb-cards-grid');
  if (!container) return;
  try {
    const res = await fetch('/api/academics/question-banks');
    const data = await res.json();
    if (data.success && data.items) {
      allQuestionBanks = data.items;
      renderQuestionBanks(allQuestionBanks);
    }
  } catch (err) {
    console.error('Error loading question banks:', err);
  }
}

function renderQuestionBanks(items) {
  const container = document.getElementById('qb-cards-grid');
  const countEl = document.getElementById('qb-count-indicator');
  if (!container) return;

  if (countEl) {
    countEl.textContent = `Showing ${items.length} verified academic papers & banks`;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-500"></i>
        <p class="text-sm font-semibold">No question papers or banks found matching your filter.</p>
        <button onclick="setQBDeptFilter('All')" class="mt-2 text-xs text-[#cba23e] hover:underline font-semibold">Reset all filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const isPYQ = item.type === 'PYQ';
    const isModel = item.type === 'Model Paper';
    const badgeColor = isPYQ ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                       isModel ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    
    return `
      <div class="glass-panel p-5 rounded-3xl border border-white/10 hover:border-[#cba23e]/50 transition flex flex-col justify-between gap-3 shadow-lg group">
        <div class="space-y-2.5">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="px-2.5 py-1 rounded-xl bg-[#1f4178]/60 text-[#cba23e] font-mono text-xs font-extrabold border border-[#cba23e]/40 shadow-sm">${item.subject_code}</span>
            <span class="px-2 py-0.5 rounded-full ${badgeColor} text-[10px] font-bold border">${item.type}</span>
          </div>

          <div>
            <h4 class="font-extrabold text-white text-sm group-hover:text-[#cba23e] transition leading-snug">${item.subject_name}</h4>
            <p class="text-[11px] text-slate-300 mt-0.5 line-clamp-1">${item.title}</p>
          </div>

          <div class="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <span class="text-[#cba23e]"><i class="fa-solid fa-graduation-cap mr-1"></i>${item.semester}</span>
            <span>•</span>
            <span>${item.exam_session}</span>
            <span>•</span>
            <span class="text-purple-300 font-mono">${item.downloads_count} downloads</span>
          </div>

          <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-300 line-clamp-2">
            <i class="fa-solid fa-list-check text-purple-400 mr-1"></i> ${item.module_summary || 'Modules 1 to 5 university questions syllabus covered.'}
          </div>
        </div>

        <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
          <button onclick="openModuleQuestionsModal(${item.id})" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5">
            <i class="fa-solid fa-layer-group text-purple-400 text-xs"></i>
            <span>Modules</span>
          </button>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button onclick="openMCQPracticeModal('${item.subject_code}')" class="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition flex items-center gap-1">
              <i class="fa-solid fa-brain text-[11px]"></i>
              <span>MCQs</span>
            </button>
            <a href="${(item.file_url && item.file_url.startsWith('/papers/')) ? item.file_url : '/papers/' + (item.file_url ? item.file_url.split('/').pop() : item.subject_code + '.pdf')}" target="_blank" class="px-3 py-1.5 rounded-xl bg-[#1f4178] hover:bg-[#345798] border border-[#cba23e]/50 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm" title="View & Download Official Examination PDF">
              <i class="fa-solid fa-file-pdf text-rose-400 text-[11px]"></i>
              <span>PDF ↗</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handleQuestionBankFilter() {
  const query = (document.getElementById('qb-search-input')?.value || '').trim().toLowerCase();
  const semester = document.getElementById('qb-semester-filter')?.value || 'All';
  const type = document.getElementById('qb-type-filter')?.value || 'All';

  let filtered = allQuestionBanks.filter(item => {
    // Dept
    if (activeQBDept !== 'All') {
      const dMatch = item.department.toLowerCase().includes(activeQBDept.toLowerCase()) || item.department === 'All Departments';
      if (!dMatch) return false;
    }
    // Semester
    if (semester !== 'All' && !item.semester.includes(semester)) {
      return false;
    }
    // Type
    if (type !== 'All' && item.type !== type) {
      return false;
    }
    // Search query
    if (query) {
      const matchCode = item.subject_code.toLowerCase().includes(query);
      const matchName = item.subject_name.toLowerCase().includes(query);
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchMod = (item.module_summary || '').toLowerCase().includes(query);
      if (!matchCode && !matchName && !matchTitle && !matchMod) return false;
    }
    return true;
  });

  renderQuestionBanks(filtered);
}

function setQBDeptFilter(dept) {
  activeQBDept = dept;
  const pills = document.querySelectorAll('.qb-dept-pill');
  pills.forEach(p => {
    if (p.textContent.includes(dept) || (dept === 'All' && p.textContent.includes('All'))) {
      p.className = 'qb-dept-pill active px-3 py-1.5 rounded-xl bg-[#1f4178] border border-[#cba23e]/50 text-white whitespace-nowrap';
    } else {
      p.className = 'qb-dept-pill px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white whitespace-nowrap';
    }
  });
  handleQuestionBankFilter();
}

function openModuleQuestionsModal(id) {
  const item = allQuestionBanks.find(p => p.id === id);
  if (!item) return;

  document.getElementById('mq-modal-subcode').textContent = item.subject_code;
  document.getElementById('mq-modal-session').textContent = `${item.semester} • ${item.exam_session}`;
  document.getElementById('mq-modal-title').textContent = `${item.subject_name} (${item.title})`;

  const modules = (item.module_summary || '').split('|');
  const body = document.getElementById('mq-modal-body');

  body.innerHTML = modules.map((modStr, idx) => {
    const parts = modStr.split(':');
    const modTitle = parts[0] ? parts[0].trim() : `Module ${idx + 1}`;
    const topics = parts[1] ? parts[1].trim() : modStr.trim();
    
    return `
      <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-extrabold text-white text-xs text-[#cba23e] flex items-center gap-1.5">
            <i class="fa-solid fa-bookmark text-xs"></i> ${modTitle}
          </span>
          <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">10 Marks + 10 Marks (OR Choice)</span>
        </div>
        <p class="text-slate-300 text-[11px] leading-relaxed"><strong class="text-slate-200">Key Syllabus:</strong> ${topics}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
          <div class="p-2 rounded-xl bg-white/5 text-slate-300">
            <span class="text-cyan-300 font-bold block mb-0.5">Question A (10 M):</span>
            Analytical derivation, architecture, or core concept with formal proof.
          </div>
          <div class="p-2 rounded-xl bg-white/5 text-slate-300">
            <span class="text-cyan-300 font-bold block mb-0.5">Question B (10 M):</span>
            Step-by-step numerical problem or design implementation.
          </div>
        </div>
      </div>
    `;
  }).join('');

  openModal('modal-module-questions');
}

// Interactive MCQ Mode Logic
async function openMCQPracticeModal(subjectCode) {
  try {
    const url = subjectCode && subjectCode !== 'ALL' ? `/api/academics/mcqs?subject_code=${subjectCode}` : '/api/academics/mcqs';
    const res = await fetch(url);
    const data = await res.json();
    if (data.success && data.mcqs && data.mcqs.length > 0) {
      currentMCQList = data.mcqs;
      currentMCQIndex = 0;
      currentMCQScore = 0;
      currentMCQSelectedOpt = null;
      renderCurrentMCQ();
      openModal('modal-mcq-practice');
    } else {
      showPopUpNotification({
        title: 'MCQ Bank Updating',
        message: 'MCQs for this specific subject are being compiled from latest VTU tests.',
        type: 'general'
      });
    }
  } catch (err) {
    console.error('Error loading MCQs:', err);
  }
}

function renderCurrentMCQ() {
  const container = document.getElementById('mcq-quiz-container');
  if (!container) return;

  if (currentMCQIndex >= currentMCQList.length) {
    // Quiz finished
    const pct = Math.round((currentMCQScore / currentMCQList.length) * 100);
    container.innerHTML = `
      <div class="p-6 rounded-3xl bg-white/5 border border-white/10 text-center space-y-4">
        <div class="w-16 h-16 rounded-3xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 text-3xl mx-auto shadow-lg">
          <i class="fa-solid fa-trophy text-[#cba23e]"></i>
        </div>
        <div>
          <h3 class="text-lg font-extrabold text-white">Practice Test Completed!</h3>
          <p class="text-xs text-slate-300 mt-1">Visvesvaraya Technological University (VTU) Continuous Assessment</p>
        </div>
        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xs mx-auto">
          <div class="text-3xl font-extrabold text-[#cba23e] font-mono">${currentMCQScore} / ${currentMCQList.length}</div>
          <div class="text-xs text-slate-400 mt-1">${pct}% Proficiency Score</div>
        </div>
        <div class="pt-2 flex items-center justify-center gap-3">
          <button onclick="openMCQPracticeModal('ALL')" class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition">
            <i class="fa-solid fa-rotate-right mr-1"></i> Retry Test
          </button>
          <button onclick="closeModal('modal-mcq-practice')" class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition">
            Close
          </button>
        </div>
      </div>
    `;
    return;
  }

  const q = currentMCQList[currentMCQIndex];
  currentMCQSelectedOpt = null;

  document.getElementById('mcq-badge-subject').textContent = `${q.subject_code} • Mod ${q.module_number}`;
  document.getElementById('mcq-progress-counter').textContent = `Question ${currentMCQIndex + 1} of ${currentMCQList.length}`;
  document.getElementById('mcq-question-text').textContent = q.question_text;
  document.getElementById('mcq-score-tally').textContent = `Score: ${currentMCQScore} / ${currentMCQIndex}`;

  const optContainer = document.getElementById('mcq-options-container');
  const opts = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d }
  ];

  optContainer.innerHTML = opts.map(o => `
    <button type="button" onclick="selectMCQOption('${o.key}')" id="mcq-opt-${o.key}" class="mcq-opt-btn w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-start gap-3 transition">
      <span class="w-6 h-6 rounded-lg bg-white/10 font-bold font-mono text-xs flex items-center justify-center shrink-0 text-slate-300">${o.key}</span>
      <span class="text-slate-200 text-xs leading-relaxed">${o.text}</span>
    </button>
  `).join('');

  document.getElementById('mcq-explanation-card').classList.add('hidden');
  document.getElementById('btn-submit-mcq').classList.remove('hidden');
  document.getElementById('btn-next-mcq').classList.add('hidden');
}

function selectMCQOption(optKey) {
  currentMCQSelectedOpt = optKey;
  document.querySelectorAll('.mcq-opt-btn').forEach(b => {
    b.className = 'mcq-opt-btn w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-start gap-3 transition';
  });
  const selBtn = document.getElementById(`mcq-opt-${optKey}`);
  if (selBtn) {
    selBtn.className = 'mcq-opt-btn w-full p-3 rounded-xl bg-purple-950/60 border border-purple-500 text-left flex items-start gap-3 transition shadow-md';
  }
}

function submitCurrentMCQ() {
  if (!currentMCQSelectedOpt) {
    alert('Please select an option before checking answer.');
    return;
  }
  const q = currentMCQList[currentMCQIndex];
  const isCorrect = currentMCQSelectedOpt === q.correct_option;
  if (isCorrect) currentMCQScore++;

  document.querySelectorAll('.mcq-opt-btn').forEach(b => b.onclick = null);

  const selBtn = document.getElementById(`mcq-opt-${currentMCQSelectedOpt}`);
  const correctBtn = document.getElementById(`mcq-opt-${q.correct_option}`);

  if (correctBtn) {
    correctBtn.className = 'mcq-opt-btn w-full p-3 rounded-xl bg-emerald-950/70 border border-emerald-500 text-left flex items-start gap-3 transition';
  }
  if (!isCorrect && selBtn) {
    selBtn.className = 'mcq-opt-btn w-full p-3 rounded-xl bg-rose-950/70 border border-rose-500 text-left flex items-start gap-3 transition';
  }

  const expCard = document.getElementById('mcq-explanation-card');
  const verdictTitle = document.getElementById('mcq-verdict-title');
  const expText = document.getElementById('mcq-explanation-text');

  expCard.classList.remove('hidden');
  if (isCorrect) {
    expCard.className = 'p-3.5 rounded-2xl border text-xs bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
    verdictTitle.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400"></i> <span class="text-white">Correct Answer!</span>';
  } else {
    expCard.className = 'p-3.5 rounded-2xl border text-xs bg-rose-950/40 border-rose-500/30 text-rose-300';
    verdictTitle.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-400"></i> <span class="text-white">Incorrect (Correct: Option ${q.correct_option})</span>`;
  }
  expText.textContent = q.explanation || 'Refer to VTU syllabus reference textbook for detailed derivation.';

  document.getElementById('mcq-score-tally').textContent = `Score: ${currentMCQScore} / ${currentMCQIndex + 1}`;
  document.getElementById('btn-submit-mcq').classList.add('hidden');
  document.getElementById('btn-next-mcq').classList.remove('hidden');
}

function nextMCQ() {
  currentMCQIndex++;
  renderCurrentMCQ();
}


/* =========================================================
   FEATURE 1: CAMPUS RECRUITMENT & PLACEMENT DRIVES (T&P)
========================================================= */
let allPlacementDrives = [];
let currentPlacementStatus = 'All';

async function loadPlacementDrives() {
  const container = document.getElementById('placement-cards-grid');
  if (!container) return;
  try {
    const res = await fetch('/api/placements/drives');
    const data = await res.json();
    if (data.success && data.drives) {
      allPlacementDrives = data.drives;
      renderPlacementDrives(allPlacementDrives);
    }
  } catch (err) {
    console.error('Error loading placement drives:', err);
  }
}

function renderPlacementDrives(drives) {
  const container = document.getElementById('placement-cards-grid');
  if (!container) return;

  if (drives.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <i class="fa-solid fa-briefcase text-3xl mb-2 text-slate-500"></i>
        <p class="text-sm font-semibold">No placement drives found matching filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = drives.map(d => {
    const rounds = (d.selection_rounds || '').split('|').map(r => r.trim());
    return `
      <div class="glass-panel p-5 rounded-3xl border border-white/10 hover:border-amber-500/40 transition flex flex-col justify-between gap-4 shadow-lg group">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-[#0a1733] border border-amber-500/40 overflow-hidden p-1 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-building text-amber-400 text-xl"></i>
              </div>
              <div>
                <h4 class="font-black text-white text-sm group-hover:text-amber-400 transition leading-snug">${d.company_name}</h4>
                <span class="text-[10px] text-slate-400 block"><i class="fa-solid fa-location-dot mr-1"></i>${d.job_location}</span>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 font-mono text-xs font-black border border-amber-500/40 shrink-0">
              ${d.ctc_package}
            </span>
          </div>

          <div class="p-2.5 rounded-2xl bg-white/5 border border-white/5">
            <span class="text-[10px] text-slate-400 block font-semibold">Role / Designation</span>
            <span class="text-xs font-bold text-white block">${d.role_title}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div class="p-2 rounded-xl bg-black/40 border border-white/5">
              <span class="text-[10px] text-slate-400 block">Min CGPA</span>
              <span class="font-bold text-emerald-400">${d.min_cgpa} &amp; Above</span>
            </div>
            <div class="p-2 rounded-xl bg-black/40 border border-white/5">
              <span class="text-[10px] text-slate-400 block">Max Backlogs</span>
              <span class="font-bold ${d.max_backlogs === 0 ? 'text-amber-400' : 'text-slate-300'}">${d.max_backlogs === 0 ? '0 Backlogs (Strict)' : d.max_backlogs + ' Allowed'}</span>
            </div>
          </div>

          <div class="text-[11px] text-slate-300">
            <span class="text-[10px] text-slate-400 block">Eligible Engineering Branches:</span>
            <span class="font-mono text-purple-300 font-semibold">${d.eligible_branches}</span>
          </div>

          <div class="space-y-1">
            <span class="text-[10px] text-slate-400 block">Selection Procedure:</span>
            <div class="space-y-1 text-[10px]">
              ${rounds.map((rnd, idx) => `
                <div class="flex items-center gap-1.5 text-slate-300">
                  <span class="w-3.5 h-3.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[8px] font-bold font-mono">${idx+1}</span>
                  <span class="truncate">${rnd}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
          <div class="text-[10px] text-slate-400">
            <span class="block">Drive Date: <strong class="text-white">${d.drive_date}</strong></span>
            <span class="text-amber-300">Deadline: ${d.registration_deadline}</span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" onclick="openPlacementRegisterModal(${d.id})" class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1 cursor-pointer">
              <i class="fa-solid fa-file-signature text-[11px]"></i>
              <span>Register</span>
            </button>
            <a href="${d.apply_link || 'https://www.bietdvg.edu'}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1" title="Open Official Corporate Portal">
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-amber-400"></i>
              <span class="hidden sm:inline">Portal</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handlePlacementFilter() {
  const q = (document.getElementById('placement-search-input')?.value || '').trim().toLowerCase();
  let filtered = allPlacementDrives;

  if (currentPlacementStatus !== 'All') {
    filtered = filtered.filter(d => d.status.toLowerCase() === currentPlacementStatus.toLowerCase());
  }
  if (q) {
    filtered = filtered.filter(d => 
      d.company_name.toLowerCase().includes(q) ||
      d.role_title.toLowerCase().includes(q) ||
      d.eligible_branches.toLowerCase().includes(q)
    );
  }
  renderPlacementDrives(filtered);
}

function setPlacementStatusFilter(status) {
  currentPlacementStatus = status;
  document.querySelectorAll('.placement-pill').forEach(btn => {
    btn.classList.remove('bg-amber-500', 'text-black');
    btn.classList.add('bg-white/5', 'text-slate-300');
    if (btn.textContent.trim().toLowerCase().includes(status.toLowerCase())) {
      btn.classList.add('bg-amber-500', 'text-black');
      btn.classList.remove('bg-white/5', 'text-slate-300');
    }
  });
  handlePlacementFilter();
}


/* =========================================================
   FEATURE 2: CLASSROOM & LAB TIMETABLE
========================================================= */
let allTimetableSlots = [];
let currentTimetableDay = 'All';

async function loadTimetableSchedule() {
  const container = document.getElementById('timetable-cards-grid');
  if (!container) return;

  const dept = document.getElementById('tt-dept-select')?.value || 'Computer Science & Engineering';
  const sem = document.getElementById('tt-sem-select')?.value || '5th Sem';

  try {
    const res = await fetch(`/api/academics/timetable?department=${encodeURIComponent(dept)}&semester=${encodeURIComponent(sem)}`);
    const data = await res.json();
    if (data.success && data.schedule) {
      allTimetableSlots = data.schedule;

      const clockEl = document.getElementById('timetable-live-clock');
      if (clockEl) clockEl.textContent = `Current IST: ${data.current_time_ist || 'Live'}`;

      const activeTitle = document.getElementById('tt-active-title');
      if (activeTitle) {
        if (data.active_slot) {
          activeTitle.innerHTML = `<span class="text-[#cba23e] font-mono mr-1">[${data.active_slot.subject_code}]</span> ${data.active_slot.subject_name} • <span class="text-cyan-300">${data.active_slot.room_no}</span> (${data.active_slot.faculty_name})`;
        } else {
          activeTitle.textContent = `No active classroom session right now (${data.current_day || 'Break / Recess'}).`;
        }
      }

      const nextTitle = document.getElementById('tt-next-title');
      if (nextTitle) {
        if (data.next_slot) {
          nextTitle.innerHTML = `${data.next_slot.time_slot}: <span class="text-white">${data.next_slot.subject_name}</span> (${data.next_slot.room_no})`;
        } else {
          nextTitle.textContent = 'Day schedule completed / Next slot tomorrow at 09:00 AM.';
        }
      }

      renderTimetable(allTimetableSlots);
    }
  } catch (err) {
    console.error('Error loading timetable:', err);
  }
}

function renderTimetable(slots) {
  const container = document.getElementById('timetable-cards-grid');
  if (!container) return;

  let displaySlots = slots;
  if (currentTimetableDay !== 'All') {
    displaySlots = displaySlots.filter(s => s.day_of_week.toLowerCase() === currentTimetableDay.toLowerCase());
  }

  if (displaySlots.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 glass-panel rounded-2xl">
        <i class="fa-solid fa-calendar-xmark text-3xl mb-2 text-slate-500"></i>
        <p class="text-sm font-semibold">No scheduled lectures or labs for this day.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = displaySlots.map(s => {
    const isLab = s.is_lab === 1;
    const badgeColor = isLab ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    return `
      <div class="glass-panel p-4 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div class="flex items-start sm:items-center gap-3">
          <div class="w-11 h-11 rounded-xl ${isLab ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'} flex items-center justify-center shrink-0 text-base border border-white/10">
            <i class="fa-solid ${isLab ? 'fa-flask-vial' : 'fa-chalkboard'}"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-black text-[#cba23e] font-mono">${s.subject_code}</span>
              <span class="text-xs font-extrabold text-white">${s.subject_name}</span>
              <span class="px-2 py-0.5 rounded-full ${badgeColor} text-[9px] font-bold border">${isLab ? 'Practical Lab' : 'Theory'}</span>
            </div>
            <div class="flex items-center gap-3 text-[11px] text-slate-300 mt-1 flex-wrap">
              <span><i class="fa-solid fa-user-tie text-slate-400 mr-1"></i>${s.faculty_name}</span>
              <span>•</span>
              <span class="text-[#e6c66d]"><i class="fa-solid fa-door-open mr-1"></i>${s.room_no}</span>
            </div>
          </div>
        </div>

        <div class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 gap-1">
          <span class="text-[10px] text-slate-400 font-bold uppercase">${s.day_of_week}</span>
          <span class="text-xs font-extrabold text-cyan-300 font-mono bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-lg">${s.time_slot}</span>
        </div>
      </div>
    `;
  }).join('');
}

function setTimetableDay(day) {
  currentTimetableDay = day;
  document.querySelectorAll('.tt-day-pill').forEach(btn => {
    btn.classList.remove('bg-cyan-500', 'text-black');
    btn.classList.add('bg-white/5', 'text-slate-300');
    if (btn.textContent.trim().toLowerCase().includes(day.toLowerCase())) {
      btn.classList.add('bg-cyan-500', 'text-black');
      btn.classList.remove('bg-white/5', 'text-slate-300');
    }
  });
  renderTimetable(allTimetableSlots);
}


/* =========================================================
   FEATURE 3: VTU AUTONOMOUS CGPA & SGPA CALCULATOR
========================================================= */
let currentGPASubjects = [];

async function autoLoadGPACourses() {
  const dept = document.getElementById('gpa-dept-select')?.value || 'Computer Science & Engineering';
  const sem = document.getElementById('gpa-sem-select')?.value || '5th Sem';

  try {
    const res = await fetch(`/api/academics/curriculum-credits?department=${encodeURIComponent(dept)}&semester=${encodeURIComponent(sem)}`);
    const data = await res.json();
    if (data.success && data.subjects && data.subjects.length > 0) {
      currentGPASubjects = data.subjects.map(s => ({
        code: s.subject_code,
        name: s.subject_name,
        credits: s.credits,
        grade: 'O'
      }));
    } else {
      currentGPASubjects = [
        { code: '21CS51', name: 'Automata Theory & Computability', credits: 3.0, grade: 'A+' },
        { code: '21CS52', name: 'Computer Networks', credits: 4.0, grade: 'A+' },
        { code: '21CS53', name: 'Database Management Systems', credits: 4.0, grade: 'O' },
        { code: '21CS54', name: 'Artificial Intelligence & Principles', credits: 3.0, grade: 'A' },
        { code: '21CSL55', name: 'Database Systems Lab', credits: 1.5, grade: 'O' },
        { code: '21CS58', name: 'Mini Project', credits: 2.0, grade: 'O' }
      ];
    }
    renderGPASubjects();
    calculateSGPA();
  } catch (err) {
    console.error('Error auto-loading GPA subjects:', err);
  }
}

function renderGPASubjects() {
  const container = document.getElementById('gpa-subject-rows-container');
  if (!container) return;

  container.innerHTML = currentGPASubjects.map((sub, idx) => `
    <div class="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2 flex-grow">
        <span class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">${idx+1}</span>
        <div class="w-full">
          <input type="text" value="${sub.code} - ${sub.name}" oninput="currentGPASubjects[${idx}].name = this.value" class="w-full bg-transparent font-bold text-white text-xs focus:outline-none focus:border-b border-emerald-400">
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] text-slate-400">Credits:</span>
          <input type="number" step="0.5" min="0.5" max="6" value="${sub.credits}" oninput="currentGPASubjects[${idx}].credits = parseFloat(this.value) || 0; calculateSGPA();" class="w-14 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-center font-bold text-xs">
        </div>

        <div class="flex items-center gap-1.5">
          <span class="text-[10px] text-slate-400">Grade:</span>
          <select onchange="currentGPASubjects[${idx}].grade = this.value; calculateSGPA();" class="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-emerald-300 font-bold text-xs">
            <option value="O" ${sub.grade === 'O' ? 'selected' : ''}>O (10)</option>
            <option value="A+" ${sub.grade === 'A+' ? 'selected' : ''}>A+ (9)</option>
            <option value="A" ${sub.grade === 'A' ? 'selected' : ''}>A (8)</option>
            <option value="B+" ${sub.grade === 'B+' ? 'selected' : ''}>B+ (7)</option>
            <option value="B" ${sub.grade === 'B' ? 'selected' : ''}>B (6)</option>
            <option value="C" ${sub.grade === 'C' ? 'selected' : ''}>C (5)</option>
            <option value="P" ${sub.grade === 'P' ? 'selected' : ''}>P (4)</option>
            <option value="F" ${sub.grade === 'F' ? 'selected' : ''}>F (0)</option>
          </select>
        </div>

        <button onclick="removeGPASubject(${idx})" class="text-slate-400 hover:text-rose-400 p-1 transition" title="Delete Course">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function addCustomGPASubject() {
  currentGPASubjects.push({
    code: `ELEC${currentGPASubjects.length + 1}`,
    name: 'Elective Course / Open Elective',
    credits: 3.0,
    grade: 'A+'
  });
  renderGPASubjects();
  calculateSGPA();
}

function removeGPASubject(idx) {
  currentGPASubjects.splice(idx, 1);
  renderGPASubjects();
  calculateSGPA();
}

function calculateSGPA() {
  const gradeMap = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 };
  let totalCredits = 0;
  let totalPoints = 0;

  currentGPASubjects.forEach(s => {
    const pts = gradeMap[s.grade] !== undefined ? gradeMap[s.grade] : 0;
    const cred = s.credits || 0;
    totalCredits += cred;
    totalPoints += pts * cred;
  });

  const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

  const disp = document.getElementById('gpa-result-display');
  if (disp) disp.textContent = sgpa;

  const totalCredEl = document.getElementById('gpa-total-credits');
  if (totalCredEl) totalCredEl.textContent = totalCredits.toFixed(1);

  const totalPtsEl = document.getElementById('gpa-total-points');
  if (totalPtsEl) totalPtsEl.textContent = totalPoints.toFixed(1);

  const verdictEl = document.getElementById('gpa-class-verdict');
  if (verdictEl) {
    const val = parseFloat(sgpa);
    if (val >= 7.75) {
      verdictEl.innerHTML = `<span class="text-emerald-400 font-bold">First Class with Distinction (FCD) 🌟</span>`;
    } else if (val >= 6.75) {
      verdictEl.innerHTML = `<span class="text-cyan-300 font-bold">First Class (FC) 🎯</span>`;
    } else if (val >= 5.75) {
      verdictEl.innerHTML = `<span class="text-blue-300 font-bold">Second Class (SC)</span>`;
    } else if (val >= 4.00) {
      verdictEl.innerHTML = `<span class="text-amber-400 font-bold">Pass Class (P)</span>`;
    } else {
      verdictEl.innerHTML = `<span class="text-rose-400 font-bold">Backlogs / Re-appear</span>`;
    }
  }
}

function calculateTargetCGPA() {
  const currCGPA = parseFloat(document.getElementById('target-curr-cgpa')?.value || '8.5');
  const doneSems = parseInt(document.getElementById('target-done-sems')?.value || '4');
  const goalCGPA = parseFloat(document.getElementById('target-goal-cgpa')?.value || '9.0');
  const totalSems = 8;
  const remainingSems = totalSems - doneSems;

  const resText = document.getElementById('target-result-text');
  if (!resText) return;

  if (remainingSems <= 0) {
    resText.textContent = 'All 8 semesters completed.';
    resText.classList.remove('hidden');
    return;
  }

  const requiredSGPA = ((goalCGPA * totalSems) - (currCGPA * doneSems)) / remainingSems;

  resText.classList.remove('hidden');
  if (requiredSGPA > 10.0) {
    resText.innerHTML = `<strong class="text-rose-400">Not Mathematically Attainable:</strong> You would need an average SGPA of <strong>${requiredSGPA.toFixed(2)}</strong> across the remaining ${remainingSems} semesters (Max possible is 10.00). Try adjusting target CGPA to ${( ((10.0 * remainingSems) + (currCGPA * doneSems)) / totalSems ).toFixed(2)}.`;
  } else if (requiredSGPA <= 4.0) {
    resText.innerHTML = `<strong class="text-emerald-400">Easily Achievable:</strong> Maintaining a minimum pass SGPA of <strong>4.00</strong> will fulfill your target.`;
  } else {
    resText.innerHTML = `To graduate with <strong>${goalCGPA.toFixed(2)} CGPA</strong>, you must score an average of <strong class="text-emerald-300 font-mono font-bold text-xs">${requiredSGPA.toFixed(2)} SGPA</strong> in each of the remaining <strong>${remainingSems} semesters</strong>.`;
  }
}

function resetGPACalculator() {
  autoLoadGPACourses();
}


/* =========================================================
   FEATURE 4: GATE & EXAM CHEAT SHEETS
========================================================= */
let allCheatSheets = [];
let currentCheatSheetCategory = 'All';

async function loadCheatSheets() {
  const container = document.getElementById('cheatsheets-grid');
  if (!container) return;

  try {
    const res = await fetch('/api/academics/cheat-sheets');
    const data = await res.json();
    if (data.success && data.sheets) {
      allCheatSheets = data.sheets;
      renderCheatSheets(allCheatSheets);
    }
  } catch (err) {
    console.error('Error loading cheat sheets:', err);
  }
}

function renderCheatSheets(sheets) {
  const container = document.getElementById('cheatsheets-grid');
  if (!container) return;

  let displaySheets = sheets;
  if (currentCheatSheetCategory !== 'All') {
    displaySheets = displaySheets.filter(s => s.category.toLowerCase() === currentCheatSheetCategory.toLowerCase());
  }

  container.innerHTML = displaySheets.map(s => `
    <div class="glass-panel p-5 rounded-3xl border border-white/10 hover:border-pink-500/40 transition flex flex-col justify-between gap-3 shadow-lg">
      <div class="space-y-2.5">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="px-2.5 py-1 rounded-xl bg-[#1f4178] text-[#cba23e] font-mono text-xs font-bold border border-[#cba23e]/40">${s.subject_code}</span>
          <span class="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">${s.category}</span>
        </div>
        <h4 class="font-extrabold text-white text-sm leading-snug">${s.title}</h4>
        <span class="text-[10px] text-slate-400 block">${s.subject_name} • ${s.department}</span>

        <div class="p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-slate-200 font-mono leading-relaxed max-h-56 overflow-y-auto space-y-1">
          ${s.summary_content}
        </div>
      </div>

      <div class="pt-3 border-t border-white/10 flex items-center justify-between">
        <span class="text-[10px] text-slate-400 font-mono">${s.downloads_count} students saved</span>
        <button onclick="copyCheatSheetSummary(${s.id})" class="px-3 py-1.5 rounded-xl bg-pink-600/30 hover:bg-pink-600 border border-pink-500/40 text-pink-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5">
          <i class="fa-solid fa-copy"></i>
          <span>Copy Sheet</span>
        </button>
      </div>
    </div>
  `).join('');
}

function filterCheatSheets(cat) {
  currentCheatSheetCategory = cat;
  document.querySelectorAll('.cs-pill').forEach(btn => {
    btn.classList.remove('bg-pink-600', 'text-white');
    btn.classList.add('bg-white/5', 'text-slate-300');
    if (btn.textContent.trim().toLowerCase().includes(cat.toLowerCase())) {
      btn.classList.add('bg-pink-600', 'text-white');
      btn.classList.remove('bg-white/5', 'text-slate-300');
    }
  });
  renderCheatSheets(allCheatSheets);
}

function copyCheatSheetSummary(id) {
  const sheet = allCheatSheets.find(s => s.id === id);
  if (!sheet) return;
  const cleanText = sheet.summary_content.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]+>/g, '');
  navigator.clipboard.writeText(`${sheet.subject_code} - ${sheet.title}\n\n${cleanText}`);
  showPopUpNotification({
    title: 'Cheat Sheet Copied',
    message: `Formula summary for ${sheet.subject_code} copied to clipboard!`,
    type: 'general'
  });
}





// Placement Drive Registration Modal Handlers
function openPlacementRegisterModal(driveId) {
  const drive = allPlacementDrives.find(d => d.id === driveId);
  if (!drive) return;

  document.getElementById('pl-reg-drive-id').value = drive.id;
  document.getElementById('pl-reg-company-name').value = drive.company_name;
  document.getElementById('pl-reg-corp-link').value = drive.apply_link || 'https://www.bietdvg.edu';

  document.getElementById('pl-reg-modal-title').textContent = drive.role_title;
  document.getElementById('pl-reg-modal-company').textContent = drive.company_name;
  document.getElementById('pl-reg-summary-ctc').textContent = drive.ctc_package;
  document.getElementById('pl-reg-summary-cgpa').textContent = `${drive.min_cgpa} & Above`;
  document.getElementById('pl-reg-summary-date').textContent = drive.drive_date;

  const corpBtn = document.getElementById('pl-reg-official-corp-btn');
  if (corpBtn) corpBtn.href = drive.apply_link || 'https://www.bietdvg.edu';

  // Auto-fill student info if logged in or available in local state
  if (currentUser && currentUser.role === 'student') {
    if (document.getElementById('pl-reg-student-name')) document.getElementById('pl-reg-student-name').value = currentUser.name || '';
    if (document.getElementById('pl-reg-usn')) document.getElementById('pl-reg-usn').value = currentUser.usn || '';
  }

  // Reset success box vs form visibility
  document.getElementById('form-placement-register').classList.remove('hidden');
  document.getElementById('pl-reg-success-box').classList.add('hidden');

  openModal('modal-placement-register');
}

async function handlePlacementRegisterSubmit(e) {
  e.preventDefault();
  const driveId = document.getElementById('pl-reg-drive-id').value;
  const companyName = document.getElementById('pl-reg-company-name').value;
  const corpLink = document.getElementById('pl-reg-corp-link').value;
  const studentName = document.getElementById('pl-reg-student-name').value.trim();
  const usn = document.getElementById('pl-reg-usn').value.trim().toUpperCase();
  const branch = document.getElementById('pl-reg-branch').value;
  const cgpa = document.getElementById('pl-reg-cgpa').value.trim();
  const backlogs = document.getElementById('pl-reg-backlogs').value.trim();
  const phone = document.getElementById('pl-reg-phone').value.trim();
  const email = document.getElementById('pl-reg-email').value.trim();

  try {
    const res = await fetch('/api/placements/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drive_id: driveId,
        company_name: companyName,
        student_name: studentName,
        usn: usn,
        branch: branch,
        cgpa: cgpa,
        backlogs: backlogs,
        phone: phone,
        email: email
      })
    });
    const data = await res.json();
    if (data.success) {
      playChimeSound();
      document.getElementById('form-placement-register').classList.add('hidden');
      const sBox = document.getElementById('pl-reg-success-box');
      sBox.classList.remove('hidden');
      document.getElementById('pl-reg-success-msg').textContent = `Registration successfully confirmed for ${companyName}. Your credentials have been forwarded to the Training & Placement Cell.`;
      document.getElementById('pl-reg-success-token').textContent = `REGISTRATION TOKEN: ${data.reg_code}`;
      const sCorpBtn = document.getElementById('pl-reg-success-corp-btn');
      if (sCorpBtn) sCorpBtn.href = corpLink || 'https://www.bietdvg.edu';

      showPopUpNotification({
        title: '🎉 Placement Registered!',
        message: `${studentName} registered for ${companyName}. Token: ${data.reg_code}`,
        type: 'placement'
      });
    } else {
      alert(data.error || 'Failed to submit registration.');
    }
  } catch (err) {
    console.error(err);
    alert('Network error submitting placement registration.');
  }
}
