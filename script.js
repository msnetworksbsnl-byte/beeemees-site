/* === BEE EEM EES script.js v2 === */

// ========== LOADER ==========
window.addEventListener('load', () => {
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (l) { l.classList.add('fade-out'); setTimeout(() => l.remove(), 700); }
    initBgCanvas();
    initMap();
    animateStats();
    initAOS();
  }, 2500);
});

// ========== GLOBAL BACKGROUND CANVAS ==========
function initBgCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.8 + .4,
      o: Math.random() * .4 + .05
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,158,11,${p.o})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(245,158,11,${.06 * (1 - d / 130)})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ========== NAVBAR ==========
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  updateActiveNav();
  checkAOS();
});

function updateActiveNav() {
  const ids = ['home', 'services', 'plans', 'reviews', 'book', 'contact'];
  let cur = '';
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) cur = id;
  });
  document.querySelectorAll('.nav-link').forEach(l =>
    l.classList.toggle('active', l.getAttribute('href') === '#' + cur)
  );
}

// ========== HAMBURGER ==========
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('active');
});
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
  navLinks.classList.remove('open');
  hamburger.classList.remove('active');
}));

// ========== STATS COUNTER ==========
function animateStats() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseInt(el.dataset.target);
    let cur = 0;
    const step = Math.ceil(target / 55);
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur.toLocaleString();
      if (cur >= target) clearInterval(t);
    }, 30);
  });
}

// ========== AOS ==========
function initAOS() {
  checkAOS();
}
function checkAOS() {
  document.querySelectorAll('[data-aos]:not(.visible)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight - 60) el.classList.add('visible');
  });
}
// Run once on load
setTimeout(checkAOS, 100);

// ========== PLAN TABS ==========
document.querySelectorAll('.plan-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.plans-grid').forEach(g => g.classList.remove('active'));
    tab.classList.add('active');
    const g = document.getElementById('tab-' + tab.dataset.tab);
    if (g) { g.classList.add('active'); setTimeout(checkAOS, 100); }
  });
});

// Auto-select plan when clicking "Book This Plan"
document.querySelectorAll('.plan-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    const plan = btn.dataset.plan || '';
    const planSel = document.getElementById('bookPlan');
    const svcSel = document.getElementById('bookService');
    if (planSel) {
      Array.from(planSel.options).forEach(o => { if (o.text === plan) o.selected = true; });
    }
    if (svcSel) {
      if (plan.startsWith('BSNL')) svcSel.value = 'BSNL Bharat Fibre';
      else if (plan.startsWith('RailWire') || plan.startsWith('RailTel')) svcSel.value = 'RailWire Broadband';
    }
    document.getElementById('book').scrollIntoView({ behavior: 'smooth' });
  });
});

// ========== PAY SERVICE RADIO (kept for potential future use) ==========

// ========== MAP ==========
let bookingMap, bookingMarker, pinLat = null, pinLng = null;
const TIRUPPUR = [11.11056, 77.36949];

function initMap() {
  const mapEl = document.getElementById('bookingMap');
  if (!mapEl || !window.L) return;

  bookingMap = L.map('bookingMap', {
    center: TIRUPPUR, zoom: 14,
    zoomControl: true, tap: true
  });

  // Satellite tile layer (Esri World Imagery) — shows real buildings and addresses
  const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri, Maxar, Earthstar Geographics', maxZoom: 19
  });

  // Street tile layer (OpenStreetMap)
  const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 19
  });

  // Hybrid: satellite + labels overlay
  const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, pane: 'overlayPane'
  });

  // Default to satellite view
  satellite.addTo(bookingMap);
  labels.addTo(bookingMap);

  // Layer switcher control
  const baseLayers = { '🛰️ Satellite': satellite, '🗺️ Street': street };
  const overlays = { '🏷️ Labels': labels };
  L.control.layers(baseLayers, overlays, { position: 'topright' }).addTo(bookingMap);

  // Company marker
  const compIcon = L.divIcon({
    html: `<div style="background:linear-gradient(135deg,#f59e0b,#ef4444);width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(245,158,11,.5);border:3px solid white">
             <span style="transform:rotate(45deg);font-size:1.1rem">🏢</span>
           </div>`,
    className: '', iconSize: [44, 44], iconAnchor: [22, 44]
  });

  L.marker(TIRUPPUR, { icon: compIcon })
    .addTo(bookingMap)
    .bindPopup('<strong style="color:#f59e0b">BEE EEM EES Cables</strong><br/>229 Sugmar Nagar, Kangayam Road<br/>Tiruppur-7 📞 9787910221')
    .openPopup();

  // Coverage circle
  L.circle(TIRUPPUR, {
    color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: .05,
    radius: 3500, weight: 1, dashArray: '6 4'
  }).addTo(bookingMap);

  // Click to pin
  bookingMap.on('click', e => {
    dropPin(e.latlng.lat, e.latlng.lng, 'Map click');
  });

  // GPS
  const locBtn = document.getElementById('locateMe');
  if (locBtn) {
    locBtn.addEventListener('click', () => {
      locBtn.disabled = true;
      locBtn.innerHTML = `<svg style="width:14px;height:14px;animation:spin 1s linear infinite" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg> Locating…`;

      if (!navigator.geolocation) {
        showToast('GPS not available. Please click on the map to pin your location.', 'error');
        restoreLocBtn();
        return;
      }
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        bookingMap.setView([lat, lng], 17);
        dropPin(lat, lng, 'GPS');
        showToast('📍 GPS location found! You can drag the pin to fine-tune.', 'success');
        restoreLocBtn();
      }, err => {
        showToast('Could not access GPS. Tap on the map to pin your location.', 'error');
        restoreLocBtn();
      }, { timeout: 10000, enableHighAccuracy: true });
    });
  }

  // Clear pin
  const clearBtn = document.getElementById('clearPin');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (bookingMarker) { bookingMap.removeLayer(bookingMarker); bookingMarker = null; }
      pinLat = null; pinLng = null;
      updatePinStatus(false);
      clearBtn.style.display = 'none';
    });
  }
}

function dropPin(lat, lng, source) {
  pinLat = lat; pinLng = lng;

  const pinIcon = L.divIcon({
    html: `<div style="position:relative">
      <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(59,130,246,.6);border:3px solid white">
        <span style="transform:rotate(45deg);font-size:.95rem">📍</span>
      </div>
      <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:12px;height:12px;background:rgba(59,130,246,.25);border-radius:50%"></div>
    </div>`,
    className: '', iconSize: [36, 44], iconAnchor: [18, 44]
  });

  if (bookingMarker) bookingMap.removeLayer(bookingMarker);
  bookingMarker = L.marker([lat, lng], { icon: pinIcon, draggable: true })
    .addTo(bookingMap)
    .bindPopup('<strong style="color:#3b82f6">📍 Your Installation Location</strong><br/><small style="color:#94a3b8">Drag this pin to adjust</small>');

  bookingMarker.on('dragend', () => {
    const pos = bookingMarker.getLatLng();
    pinLat = pos.lat; pinLng = pos.lng;
    updatePinStatus(true, pos.lat, pos.lng);
    showToast('Pin moved to new location!', 'success');
  });

  updatePinStatus(true, lat, lng);
  const clearBtn = document.getElementById('clearPin');
  if (clearBtn) clearBtn.style.display = '';
}

function updatePinStatus(pinned, lat, lng) {
  const badge = document.getElementById('pinStatus');
  const icon = document.getElementById('pinStatusIcon');
  const text = document.getElementById('pinStatusText');
  const card = document.getElementById('pinnedLocationCard');
  const coords = document.getElementById('pinnedCoords');

  if (pinned) {
    badge.className = 'pin-status-badge pinned';
    icon.textContent = '✅';
    text.textContent = 'Location pinned!';
    card.classList.remove('hidden');
    if (coords) coords.textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  } else {
    badge.className = 'pin-status-badge unpinned';
    icon.textContent = '📌';
    text.textContent = 'No location pinned yet';
    card.classList.add('hidden');
  }
}

function restoreLocBtn() {
  const b = document.getElementById('locateMe');
  if (b) {
    b.disabled = false;
    b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg> 📡 Use My GPS Location`;
  }
}

// ========== BOOKING FORM ==========
document.getElementById('bookingForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var name = document.getElementById('bookName').value.trim();
  var phone = document.getElementById('bookPhone').value.trim();
  var email = document.getElementById('bookEmail').value.trim();
  var service = document.getElementById('bookService').value;
  var plan = document.getElementById('bookPlan').value;
  var address = document.getElementById('bookAddress').value.trim();
  var notes = document.getElementById('bookNotes').value.trim();
  var btn = document.getElementById('bookSubmitBtn');
  if (!name) { showToast('Please enter your full name', 'error'); return; }
  if (!/^\+?[\d\s\-]{10,}$/.test(phone)) { showToast('Please enter a valid mobile number', 'error'); return; }
  if (!service) { showToast('Please select a service type', 'error'); return; }
  if (!address) { showToast('Please enter your address', 'error'); return; }
  if (!pinLat) { showToast('Please pin your location on the map!', 'error'); return; }
  btn.disabled = true;
  btn.textContent = 'Submitting...';
  var locationText = (pinLat && pinLng) ? 'https://maps.google.com/?q=' + pinLat.toFixed(5) + ',' + pinLng.toFixed(5) : 'Not pinned';
  var submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  fetch('https://ntfy.sh/beeemees-bookings', {
    method: 'POST',
    headers: {
      'Title': 'New Booking: ' + name + ' - ' + service,
      'Priority': '4',
      'Tags': 'electric_plug,phone'
    },
    body: "🔌 *New Booking Request*\n\n" +
      "👤 *Name:* " + name + "\n" +
      "📞 *Phone:* " + phone + "\n" +
      (email ? "📧 *Email:* " + email + "\n" : "") +
      "🌐 *Service:* " + service + "\n" +
      (plan ? "📋 *Plan:* " + plan + "\n" : "") +
      "🏠 *Address:* " + address + "\n" +
      (notes ? "📝 *Notes:* " + notes + "\n" : "") +
      "📍 *Location:* " + locationText + "\n" +
      "⏰ *Submitted:* " + submittedAt
  }).then(function () {
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Submit Booking Request';
    document.getElementById('successTitle').textContent = 'Booking Submitted Successfully!';
    document.getElementById('successMessage').innerHTML = '<div style="text-align:left;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:1.25rem;margin-top:0.75rem;"><p style="margin-bottom:.5rem;color:#10b981;font-weight:700;">Your Booking Details:</p><p style="margin:.3rem 0;">Name: ' + name + '</p><p style="margin:.3rem 0;">Mobile: ' + phone + '</p>' + (email ? '<p style="margin:.3rem 0;">Email: ' + email + '</p>' : '') + '<p style="margin:.3rem 0;">Service: ' + service + '</p>' + (plan ? '<p style="margin:.3rem 0;">Plan: ' + plan + '</p>' : '') + '<p style="margin:.3rem 0;">Address: ' + address + '</p><p style="margin:.3rem 0;">Location: <a href="' + locationText + '" target="_blank" style="color:#3b82f6;">View on Map</a></p><p style="margin:.3rem 0;">Submitted: ' + submittedAt + '</p></div><p style="margin-top:1rem;color:#94a3b8;font-size:.85rem;">Thank you, <strong style="color:#fff;">' + name + '</strong>! We will contact you at <strong style="color:#f59e0b;">' + phone + '</strong> within 24 hours!</p>';
    document.getElementById('successModal').classList.remove('hidden');
    showToast('Booking submitted! Notification sent to our team.', 'success');
    document.getElementById('bookingForm').reset();
    updatePinStatus(false);
    if (bookingMarker && bookingMap) { bookingMap.removeLayer(bookingMarker); bookingMarker = null; }
    pinLat = null; pinLng = null;
    var cb = document.getElementById('clearPin'); if (cb) cb.style.display = 'none';
  }).catch(function (err) {
    console.error('Booking error:', err);
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Submit Booking Request';
    showToast('Failed to submit booking. Please try again.', 'error');
  });
});

// ========== QUERY FORM ==========
document.getElementById('queryForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = `<svg style="width:17px;height:17px;animation:spin 1s linear infinite" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg> Sending…`;

  const name = document.getElementById('qName').value.trim();
  const phone = document.getElementById('qPhone').value.trim();
  const subject = document.getElementById('qSubject').value;
  const userMessage = document.getElementById('qMessage').value.trim();
  const submitted_at = new Date().toLocaleString();

  fetch('https://ntfy.sh/beeemees-bookings', {
    method: 'POST',
    headers: {
      'Title': 'New Query: ' + subject,
      'Priority': '4',
      'Tags': 'question,phone'
    },
    body: "❓ *New Customer Query*\n\n" +
      "👤 *Name:* " + name + "\n" +
      "📞 *Phone:* " + phone + "\n" +
      "🏷️ *Subject:* " + subject + "\n" +
      "💬 *Message:* " + userMessage + "\n" +
      "⏰ *Submitted:* " + submitted_at
  }).then(function () {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Query`;
    showToast('📨 Query sent successfully! We\'ll reply within 24 hours.', 'success');
    e.target.reset();
  }).catch(err => {
    console.error('Query error:', err);
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Query`;
    showToast('❌ Network error. Please try again.', 'error');
  });
});

// ========== TOAST ==========
function showToast(msg, type = 'success') {
  document.querySelectorAll('.toast-notice').forEach(t => t.remove());
  const n = document.createElement('div');
  n.className = `toast-notice toast-${type}`;
  n.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${msg}</span>`;
  document.body.appendChild(n);
  setTimeout(() => { n.style.opacity = '0'; n.style.transform = 'translateX(30px)'; n.style.transition = '.3s'; setTimeout(() => n.remove(), 350); }, 4500);
}

// ========== CHAT WIDGET (Premium Version) ==========
const chatWidget = document.getElementById('chatWidget');
const chatPanel = document.getElementById('chatPanel');
const chatToggleBtn = document.getElementById('chatToggle');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
let isChatOpen = false;

function toggleChat() {
  isChatOpen = !isChatOpen;

  if (isChatOpen) {
    chatPanel.classList.add('active');
    document.querySelector('.chat-open').style.opacity = '0';
    document.querySelector('.chat-open').style.transform = 'scale(0) rotate(-45deg)';
    document.querySelector('.chat-close').style.opacity = '1';
    document.querySelector('.chat-close').style.transform = 'scale(1) rotate(0)';
    setTimeout(() => {
      chatInput.focus();
      scrollChat();
    }, 300);
  } else {
    chatPanel.classList.remove('active');
    document.querySelector('.chat-open').style.opacity = '1';
    document.querySelector('.chat-open').style.transform = 'scale(1) rotate(0)';
    document.querySelector('.chat-close').style.opacity = '0';
    document.querySelector('.chat-close').style.transform = 'scale(0) rotate(45deg)';
  }
}

if (chatToggleBtn) {
  chatToggleBtn.addEventListener('click', toggleChat);
}

function handleChatKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendChatMessage();
  }
}

function sendQuickReply(text) {
  addUserMessage(text);
  botProcessReply(text);
}

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  addUserMessage(text);
  botProcessReply(text);
}

function addUserMessage(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-msg user-msg';
  msgDiv.innerHTML = `<div class="msg-bubble"><p>${esc(text)}</p></div>`;
  chatMessages.appendChild(msgDiv);
  scrollChat();
}

function addBotMessage(html) {
  // Remove typings
  const existingTyping = chatMessages.querySelector('.typing-indicator');
  if (existingTyping) existingTyping.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-msg bot-msg';
  msgDiv.innerHTML = `
    <div class="msg-avatar"><img src="https://api.dicebear.com/7.x/bottts/svg?seed=bee&backgroundColor=f59e0b" alt="Bot"></div>
    <div class="msg-bubble">${html}</div>
  `;
  chatMessages.appendChild(msgDiv);
  scrollChat();
}

function showTypingIndicator() {
  const existingTyping = chatMessages.querySelector('.typing-indicator');
  if (existingTyping) existingTyping.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-msg bot-msg typing-indicator';
  msgDiv.innerHTML = `
    <div class="msg-avatar"><img src="https://api.dicebear.com/7.x/bottts/svg?seed=bee&backgroundColor=f59e0b" alt="Bot"></div>
    <div class="msg-bubble typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  chatMessages.appendChild(msgDiv);
  scrollChat();
}

function scrollChat() {
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

const KB = [
  { k: ['hello', 'hi', 'hey', 'hai', 'namaste', 'good morning', 'good evening'], r: '<p>👋 Welcome to <strong>BEE EEM EES</strong>! I am your AI assistant. How can I speed up your day?</p><div class="quick-replies"><button class="qr-btn" onclick="sendQuickReply(\'Show internet plans\')">📡 Internet Plans</button><button class="qr-btn" onclick="sendQuickReply(\'New connection\')">🔌 Book Connection</button></div>' },
  { k: ['plan', 'plans', 'package', 'price', 'rate', 'tariff', 'offer'], r: '<p>📋 <strong>Our Plans:</strong></p><p>🚂 <strong>RailWire:</strong> ₹499 · ₹599 · ₹699/mo</p><p>📡 <strong>BSNL:</strong> ₹449 · ₹499 · ₹599/mo</p><p>🎁 Free installation on 6-month payments!</p><div class="quick-replies"><button class="qr-btn" onclick="document.getElementById(\'plans\').scrollIntoView({behavior:\'smooth\'});toggleChat();">🔍 View All Plans</button></div>' },
  { k: ['bsnl', 'bharat sanchar', 'fiber', 'fibre'], r: '<p>📡 <strong>BSNL Bharat Fibre:</strong><br/>• Basic Neo ₹449 – 30 Mbps<br/>• Basic+ ₹599 – 60 Mbps<br/>• Premium Plus ₹999 – 150 Mbps</p><a href="tel:9787910221" class="bot-link">📞 Call to Book</a>' },
  { k: ['railtel', 'railwire', 'rail tel', 'railway'], r: '<p>🚂 <strong>RailWire Broadband:</strong><br/>• Entry ₹499 – 50 Mbps<br/>• Home 60 ₹599 – 60 Mbps<br/>• Ultra 150 ₹999 – 150 Mbps</p><a href="tel:9787910221" class="bot-link">📞 Call to Book</a>' },
  { k: ['book', 'connect', 'new', 'install', 'apply', 'register'], r: '<p>🔌 <strong>Ready to get connected?</strong><br/>Fill out our quick form and pin your location! We handle the rest.</p><div class="quick-replies"><button class="qr-btn" onclick="document.getElementById(\'book\').scrollIntoView({behavior:\'smooth\'});toggleChat();">📝 Open Booking Form</button></div>' },
  { k: ['contact', 'address', 'phone', 'call', 'office', 'email', 'reach'], r: '<p>🏢 <strong>Contact Us:</strong><br/>📞 <a href="tel:9787910221">9787910221</a><br/>✉️ madesh32r@gmail.com<br/>📍 229 Sugmar Nagar, Kangayam Road, Tiruppur-7</p>' },
  { k: ['speed', 'mbps', 'fast', 'slow'], r: '<p>⚡ Both BSNL and RailWire offer ultra-fast speeds up to 200 Mbps! Lag-free streaming & gaming.</p>' },
  { k: ['complaint', 'problem', 'issue', 'not working', 'down', 'disconnect'], r: '<p>🔧 <strong>Facing issues?</strong><br/>Try restarting your router. If it\'s still down, call us immediately at <a href="tel:9787910221">9787910221</a>. We offer 24/7 technical support.</p>' },
  { k: ['area', 'coverage', 'tiruppur', 'location', 'serve', 'zone'], r: '<p>📍 <strong>Service Area:</strong><br/>We proudly connect Tiruppur, Kangayam Road, Sugmar Nagar, and surrounding zones.</p>' },
  { k: ['review', 'rating', 'feedback', 'testimonial', 'customer review'], r: '<p>⭐ We have over 300+ happy customers and a 4.9★ rating. <button class="qr-btn" style="margin-top:8px" onclick="document.getElementById(\'reviews\').scrollIntoView({behavior:\'smooth\'});toggleChat();">See Reviews</button></p>' },
];

function botProcessReply(text) {
  showTypingIndicator();
  const lower = text.toLowerCase();

  let replied = false;
  let responseHtml = `<p>🤖 I didn't quite catch that. Could you try asking something else?</p><div class="quick-replies"><button class="qr-btn" onclick="sendQuickReply('Show internet plans')">📡 Plans</button><button class="qr-btn" onclick="sendQuickReply('New connection')">🔌 Book</button></div>`;

  // simple matching
  for (const item of KB) {
    if (item.k.some(kw => lower.includes(kw))) {
      responseHtml = item.r;
      replied = true;
      break;
    }
  }

  // add artificial delay based on length
  const delay = Math.min(Math.max(800, responseHtml.length * 10), 2000);

  setTimeout(() => {
    addBotMessage(responseHtml);
  }, delay);
}

// ========== MODAL HELPERS ==========
function closeModal(event) {
  // Close modal only when clicking on the overlay (backdrop), not the inner box
  if (event.target === event.currentTarget) {
    event.target.classList.add('hidden');
  }
}

function simulatePaymentSuccess() {
  const payModal = document.getElementById('paymentModal');
  if (payModal) payModal.classList.add('hidden');

  // Show the success modal
  document.getElementById('successTitle').textContent = '🎉 Payment Successful!';
  document.getElementById('successMessage').innerHTML = '<p>Your payment has been processed successfully. Thank you!</p>';
  document.getElementById('successModal').classList.remove('hidden');
  showToast('✅ Payment completed successfully!', 'success');
}

// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ========== SPIN ANIMATION CSS ==========
const style = document.createElement('style');
style.textContent = `@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`;
document.head.appendChild(style);
