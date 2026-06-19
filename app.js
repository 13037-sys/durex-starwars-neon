/* ==========================================================================
   DUREX X STAR WARS: NEON COLLECTION - APP LOGIC
   ========================================================================== */

import * as THREE from 'https://esm.sh/three@0.156.1';
import { OrbitControls } from 'https://esm.sh/three@0.156.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.156.1/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.156.1/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'https://esm.sh/gsap@3.12.2';
import { ScrollTrigger } from 'https://esm.sh/gsap@3.12.2/ScrollTrigger';

// Registrazione ScrollTrigger per GSAP
gsap.registerPlugin(ScrollTrigger);

// Stato dell'applicazione
const state = {
    audioEnabled: false,
    themeColor: '#00ffff', // Blu di default (Stormtrooper)
    themeName: 'blue',
    discountUnlocked: false,
    lightIsOn: true,
    gameCompleted: false,
    starSpeedMultiplier: 1.0,
    selectedCharacterColor: '#00ffff'
};

// Mappa Colori HSL / HEX per i Personaggi
const characterThemes = {
    stormtrooper: { hex: '#00ffff', hsl: 'hsl(180, 100%, 50%)', rgb: '0, 255, 255' },
    grogu: { hex: '#39ff14', hsl: 'hsl(120, 100%, 54%)', rgb: '57, 255, 20' },
    macewindu: { hex: '#b026ff', hsl: 'hsl(282, 100%, 58%)', rgb: '176, 38, 255' },
    darthvader: { hex: '#ff003c', hsl: 'hsl(346, 100%, 50%)', rgb: '255, 0, 60' }
};

/* ==========================================================================
   INIZIALIZZAZIONE & EVENT LISTENERS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    initAudio();
    initScrollAnimations();
    try { initPackshots(); } catch(e) { console.error('initPackshots error:', e); }
    initCharacterCards();
    initGameSection();
    initCheckoutSection();
    initUiControls();
});

/* ==========================================================================
   CURSORE SPADA LASER
   ========================================================================== */
function initLightsaberCursor() {
    const cursor = document.getElementById('ls-cursor');
    const svg    = document.getElementById('neon-cursor-svg');
    const path   = document.getElementById('neon-cursor-path');
    if (!cursor) return;

    function setNeonColor(hex) {
        if (!svg || !path) return;
        path.setAttribute('stroke', hex);
        svg.style.filter = `drop-shadow(0 0 4px ${hex}) drop-shadow(0 0 10px ${hex}) drop-shadow(0 0 20px ${hex})`;
    }

    // Applica colore iniziale dopo che il tema è stato impostato
    setTimeout(() => setNeonColor(state.themeColor || '#00ffff'), 200);

    // Agganciato da updateThemeColors
    window._neonCursorSetColor = setNeonColor;

    document.addEventListener('mousemove', e => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top  = e.clientY + 'px';
        cursor.style.display = 'block';
    });

    document.addEventListener('mouseleave', () => { cursor.style.display = 'none'; });
    document.addEventListener('mouseenter', () => { cursor.style.display = 'block'; });
}

// Funzione di utilità per aggiornare le variabili CSS del tema
function updateThemeColors(hexColor, name) {
    state.themeColor = hexColor;
    state.themeName = name;
    
    let activeTheme = characterThemes[name] || { hsl: 'hsl(180, 100%, 50%)', hex: '#00ffff' };
    
    document.documentElement.style.setProperty('--theme-neon', activeTheme.hsl);
    document.documentElement.style.setProperty('--theme-neon-dim', activeTheme.hsl.replace(')', ', 0.15)'));

    if (window._neonCursorSetColor) window._neonCursorSetColor(activeTheme.hex);

    
    // Aggiorna lo stato dei bottoni colore nel configuratore
    document.querySelectorAll('.color-btn').forEach(btn => {
        if (btn.getAttribute('data-color') === name) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Se l'audio è attivo, riproduce il suono di attivazione della spada laser
    if (state.audioEnabled) {
        audioEngine.playLightsaberIgnite(hexColor);
    }
}

/* ==========================================================================
   PREZZI E CARRELLO (MULTI-VARIANT)
   ========================================================================== */
const PRICE_UNIT   = 14.99;
const DISCOUNT_AMT = 3.00;

const VALID_COUPONS = {
    'NEONFORCE20': { amount: 3.00, label: 'NEONFORCE20' },
    'STARWARS10':  { amount: 1.50, label: 'STARWARS10'  },
    'DUREX2026':   { amount: 2.00, label: 'DUREX2026'   },
};

// qty per variante: { stormtrooper: 0, grogu: 0, macewindu: 0, darthvader: 0 }
const cartQty = { stormtrooper: 0, grogu: 0, macewindu: 0, darthvader: 0 };

const cartState = {
    discount:    0,
    couponCode:  '',
};

const variantMeta = {
    stormtrooper: { label: 'Stormtrooper · Blu Elettrico', img: 'card_stormtrooper.png', hex: '#0066ff' },
    grogu:        { label: 'Grogu · Verde Fluo',           img: 'card_grogu.png',        hex: '#39ff14' },
    macewindu:    { label: 'Mace Windu · Viola Profondo',  img: 'card_macewindu.png',    hex: '#b026ff' },
    darthvader:   { label: 'Darth Vader · Rosso Sith',     img: 'card_darthvader.png',   hex: '#ff0033' },
};

function fmt(n) { return n.toFixed(2).replace('.', ',') + ' €'; }

function cartTotalQty()    { return Object.values(cartQty).reduce((s, q) => s + q, 0); }
function cartSubtotal()    { return cartTotalQty() * PRICE_UNIT; }
function cartGrand()       { return Math.max(0, cartSubtotal() - cartState.discount); }

/** Ritorna la variante con la quantità più alta (o prima con qty>0) per il 3D viewer */
function cartDominantVariant() {
    let best = 'stormtrooper', bestQty = 0;
    for (const [k, q] of Object.entries(cartQty)) {
        if (q > bestQty) { best = k; bestQty = q; }
    }
    return best;
}

function updateCartTotals() {
    const subtotal  = cartSubtotal();
    const grand     = cartGrand();
    const totalQty  = cartTotalQty();
    const emptyMsg  = document.getElementById('cart-empty-msg');

    document.getElementById('subtotal-val').textContent     = fmt(subtotal);
    document.getElementById('grand-total-val').textContent  = fmt(grand);
    document.getElementById('buy-total-inline').textContent = totalQty > 0 ? fmt(grand) : '—';

    if (emptyMsg) emptyMsg.classList.toggle('hidden', totalQty > 0);

    const discountRow = document.getElementById('discount-row');
    if (cartState.discount > 0 && totalQty > 0) {
        discountRow.classList.remove('hidden');
        document.getElementById('discount-val').textContent   = '− ' + fmt(cartState.discount);
        document.getElementById('discount-label').textContent = 'Sconto ' + cartState.couponCode;
    } else {
        discountRow.classList.add('hidden');
    }

    // Aggiorna viewer 3D al colore dominante
    const dominant = cartDominantVariant();
    if (totalQty > 0) {
        const meta = variantMeta[dominant];
        updateThemeColors(meta.hex, dominant);
        updateCheckoutBoxColor(meta.hex);
    }
}

function setVariantQty(variant, qty) {
    cartQty[variant] = Math.max(0, Math.min(99, qty));
    // Aggiorna UI della riga
    const row = document.querySelector(`.mv-row[data-variant="${variant}"]`);
    if (!row) return;
    row.querySelector('.mv-qty-val').textContent = cartQty[variant];
    row.classList.toggle('has-qty', cartQty[variant] > 0);
    updateCartTotals();
}

function initUiControls() {
    // ── Multi-variant qty controls ──
    document.querySelectorAll('.mv-row').forEach(row => {
        const variant = row.getAttribute('data-variant');
        row.querySelector('.mv-plus').addEventListener('click', () =>
            setVariantQty(variant, cartQty[variant] + 1));
        row.querySelector('.mv-minus').addEventListener('click', () =>
            setVariantQty(variant, cartQty[variant] - 1));
    });

    // ── Metodo pagamento ──
    document.querySelectorAll('.pay-method').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pay-method').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cardFields = document.getElementById('card-fields');
            cardFields.style.display = btn.dataset.method === 'card' ? 'flex' : 'none';
        });
    });

    // ── Formattazione numero carta ──
    const cardNum = document.getElementById('f-card-num');
    if (cardNum) {
        cardNum.addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 16);
            e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
        });
    }

    // ── Formattazione scadenza ──
    const cardExp = document.getElementById('f-card-exp');
    if (cardExp) {
        cardExp.addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 4);
            if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
            e.target.value = v;
        });
    }

    // ── Coupon ──
    const couponInput    = document.getElementById('f-coupon');
    const couponApplyBtn = document.getElementById('apply-coupon-btn');
    const couponFeedback = document.getElementById('coupon-feedback');

    function showCouponFeedback(msg, type) {
        couponFeedback.textContent = msg;
        couponFeedback.className   = 'coupon-feedback ' + type;
        couponFeedback.classList.remove('hidden');
    }

    couponApplyBtn.addEventListener('click', () => {
        const code = couponInput.value.trim().toUpperCase();
        if (!code) { showCouponFeedback('Inserisci un codice sconto.', 'error'); return; }
        const coupon = VALID_COUPONS[code];
        if (coupon) {
            cartState.discount   = coupon.amount;
            cartState.couponCode = coupon.label;
            updateCartTotals();
            showCouponFeedback(`✓ Codice ${coupon.label} applicato! Sconto di ${fmt(coupon.amount)}.`, 'success');
            couponInput.disabled        = true;
            couponApplyBtn.disabled     = true;
            couponApplyBtn.textContent  = '✓';
        } else {
            showCouponFeedback('Codice non valido. Prova NEONFORCE20.', 'error');
            couponInput.classList.add('error');
            setTimeout(() => couponInput.classList.remove('error'), 1500);
        }
    });
    couponInput.addEventListener('keydown', e => { if (e.key === 'Enter') couponApplyBtn.click(); });

    // ── Validazione real-time campi ──
    ['f-nome','f-cognome','f-email','f-indirizzo','f-cap','f-citta'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur',  () => validateField(el, id));
        el.addEventListener('input', () => { if (el.classList.contains('error')) validateField(el, id); });
    });

    // ── Conferma ordine ──
    document.getElementById('buy-btn').addEventListener('click', handleOrder);

    // ── Riscatto coupon dal minigioco ──
    document.getElementById('claim-coupon-btn').addEventListener('click', () => {
        document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('game-success-banner').classList.remove('visible');
        if (couponInput && !couponInput.disabled) couponInput.value = 'NEONFORCE20';
    });

    if (state.discountUnlocked) applyDiscount();
    updateCartTotals();
}

function applyDiscount() {
    cartState.discount   = DISCOUNT_AMT;
    cartState.couponCode = 'NEONFORCE20';
    updateCartTotals();
}

function validateField(el, id) {
    const empty    = !el.value.trim();
    const badEmail = id === 'f-email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
    const badCap   = id === 'f-cap'   && el.value && !/^\d{5}$/.test(el.value.trim());
    const invalid  = empty || badEmail || badCap;
    el.classList.toggle('error', invalid);
    return !invalid;
}

function validateForm() {
    // Deve esserci almeno un articolo
    if (cartTotalQty() === 0) {
        const emptyMsg = document.getElementById('cart-empty-msg');
        if (emptyMsg) {
            emptyMsg.style.color = '#ff4466';
            setTimeout(() => { emptyMsg.style.color = ''; }, 2000);
        }
        document.querySelector('.cart-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    const fields = ['f-nome','f-cognome','f-email','f-indirizzo','f-cap','f-citta'];
    let valid = true, firstError = null;
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!validateField(el, id)) { valid = false; if (!firstError) firstError = el; }
    });

    const activeMethod = document.querySelector('.pay-method.active');
    if (activeMethod && activeMethod.dataset.method === 'card') {
        const cn = document.getElementById('f-card-num');
        const ce = document.getElementById('f-card-exp');
        const cv = document.getElementById('f-card-cvv');
        if (cn && cn.value.replace(/\s/g,'').length < 16) { cn.classList.add('error'); valid = false; if (!firstError) firstError = cn; }
        if (ce && ce.value.length < 7)                    { ce.classList.add('error'); valid = false; if (!firstError) firstError = ce; }
        if (cv && cv.value.length < 3)                    { cv.classList.add('error'); valid = false; if (!firstError) firstError = cv; }
    }
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return valid;
}

function handleOrder() {
    if (!validateForm()) return;

    const btn   = document.getElementById('buy-btn');
    const label = document.getElementById('buy-btn-label');
    btn.disabled      = true;
    label.textContent = 'Elaborazione…';
    btn.style.opacity = '0.7';

    setTimeout(() => {
        btn.disabled      = false;
        label.textContent = 'CONFERMA ORDINE';
        btn.style.opacity = '';
        showOrderSuccess();
    }, 1500);
}

/* ==========================================================================
   SCHERMATA SUCCESSO + ESPLOSIONE METEORITI
   ========================================================================== */
function showOrderSuccess() {
    const overlay = document.getElementById('order-success-overlay');

    // Costruisce riepilogo multi-variante
    const selectedVariants = Object.entries(cartQty)
        .filter(([, q]) => q > 0)
        .map(([k, q]) => ({ ...variantMeta[k], qty: q, key: k }));

    const grand = cartGrand();
    const email = document.getElementById('f-email')?.value || '—';

    // Sostituisce il blocco variante/qty con righe per ogni articolo
    const variantEl = document.getElementById('success-variant');
    const qtyEl     = document.getElementById('success-qty');
    const parentRow = variantEl?.closest('.success-row');

    if (parentRow) {
        // Rimuove le due righe standard variante/qty e le sostituisce con righe dinamiche
        const qtyRow = qtyEl?.closest('.success-row');
        parentRow.remove();
        qtyRow?.remove();

        const box = document.querySelector('.success-order-box');
        const totalRow = document.querySelector('.success-row--total');
        selectedVariants.forEach(v => {
            const row = document.createElement('div');
            row.className = 'success-row';
            row.innerHTML = `
                <span class="success-row-label" style="color:${v.hex}">${v.label}</span>
                <span class="success-row-val">× ${v.qty} — ${fmt(v.qty * PRICE_UNIT)}</span>`;
            box.insertBefore(row, totalRow);
        });
    }

    document.getElementById('success-total').textContent = fmt(grand);
    document.getElementById('success-email').textContent = email;

    // Colore dell'overlay dal colore dominante
    const dominant = cartDominantVariant();
    const primaryHex = variantMeta[dominant].hex;
    overlay.style.setProperty('--theme-neon', primaryHex);

    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('visible'));

    startMeteorExplosion(primaryHex);

    document.getElementById('success-close-btn').onclick = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.classList.add('hidden'), 500);
    };
}

function startMeteorExplosion(primaryColor) {
    const canvas = document.getElementById('success-canvas');
    const ctx    = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Palette: colore del personaggio scelto + tutti e 4 i neon
    const palette = ['#0066ff', '#39ff14', '#b026ff', '#ff0033', '#ffffff', primaryColor];

    const particles = [];

    function spawnBurst(x, y, count, speed, sizeRange) {
        for (let i = 0; i < count; i++) {
            const angle  = Math.random() * Math.PI * 2;
            const spd    = speed * (0.4 + Math.random() * 0.9);
            const color  = palette[Math.floor(Math.random() * palette.length)];
            const size   = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
            particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - Math.random() * spd * 0.5,
                ax: 0,
                ay: 0.06 + Math.random() * 0.04,   // gravità leggera
                size,
                color,
                alpha: 1,
                decay: 0.008 + Math.random() * 0.012,
                trail: [],
                isStreamer: Math.random() < 0.3,     // alcune sono lunghe scie
                twinkle: Math.random() < 0.2,
            });
        }
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Prima esplosione centrale grande
    spawnBurst(cx, cy, 180, 14, [2, 7]);

    // Burst secondari ritardati agli angoli
    setTimeout(() => spawnBurst(cx * 0.3, cy * 0.4, 80, 10, [1.5, 5]), 300);
    setTimeout(() => spawnBurst(cx * 1.7, cy * 0.4, 80, 10, [1.5, 5]), 500);
    setTimeout(() => spawnBurst(cx,        cy * 1.6, 60, 9,  [1.5, 4]), 700);
    setTimeout(() => spawnBurst(cx * 0.5, cy * 1.3, 50, 8,  [1, 4]),   900);
    setTimeout(() => spawnBurst(cx * 1.5, cy * 1.3, 50, 8,  [1, 4]),   1100);
    // Onda finale grande
    setTimeout(() => spawnBurst(cx, cy, 120, 18, [1, 5]),               1400);

    let rafId;
    let t = 0;

    function draw() {
        rafId = requestAnimationFrame(draw);
        t++;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            // Aggiorna fisica
            p.vx += p.ax;
            p.vy += p.ay;
            p.x  += p.vx;
            p.y  += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) { particles.splice(i, 1); continue; }

            const a = p.twinkle ? p.alpha * (0.5 + 0.5 * Math.sin(t * 0.3)) : p.alpha;

            ctx.save();
            ctx.globalAlpha = Math.max(0, a);

            if (p.isStreamer) {
                // Scia lunga
                ctx.strokeStyle = p.color;
                ctx.lineWidth   = p.size * 0.5;
                ctx.lineCap     = 'round';
                ctx.shadowColor = p.color;
                ctx.shadowBlur  = 6;
                ctx.beginPath();
                ctx.moveTo(p.x - p.vx * 6, p.y - p.vy * 6);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            } else {
                // Particella con alone
                ctx.shadowColor = p.color;
                ctx.shadowBlur  = p.size * 3;
                ctx.fillStyle   = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Nucleo bianco
                ctx.shadowBlur = 0;
                ctx.fillStyle  = 'rgba(255,255,255,0.6)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Stop quando tutte le particelle sono sparite
        if (t > 300 && particles.length === 0) {
            cancelAnimationFrame(rafId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    draw();
}

/* ==========================================================================
   SISTEMA AUDIO SINTETIZZATO (WEB AUDIO API)
   ========================================================================== */
let audioCtx = null;
const audioEngine = {
    init() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    },
    
    // Sintesi ronzio / accensione Spada Laser
    playLightsaberIgnite(colorHex) {
        this.init();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const now = audioCtx.currentTime;
        
        // Oscillatore principale (onda a dente di sega per suono tagliente)
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        
        // Filtro passa-basso per smorzare i toni eccessivamente aspri
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
        
        // Controllo del volume (Adsr Envelope)
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        // Pitch sweep (da 60Hz a 180Hz)
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.4);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.7);

        // Aggiunge un secondo oscillatore triangolare per dare corpo ai bassi
        const subOsc = audioCtx.createOscillator();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(40, now);
        subOsc.frequency.exponentialRampToValueAtTime(90, now + 0.3);
        
        const subGain = audioCtx.createGain();
        subGain.gain.setValueAtTime(0.001, now);
        subGain.gain.linearRampToValueAtTime(0.3, now + 0.08);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        subOsc.connect(subGain);
        subGain.connect(audioCtx.destination);
        
        subOsc.start(now);
        subOsc.stop(now + 0.6);
    },
    
    // Suono click interruttore
    playSwitchClick() {
        this.init();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const now = audioCtx.currentTime;
        
        // Rumore bianco per il "click" metallico/meccanico
        const bufferSize = audioCtx.sampleRate * 0.04; // 40ms
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1000, now);
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        noise.start(now);
        noise.stop(now + 0.05);

        // Basso impulso sinusoidale per dare la sensazione fisica del click
        const sineOsc = audioCtx.createOscillator();
        sineOsc.type = 'sine';
        sineOsc.frequency.setValueAtTime(120, now);
        sineOsc.frequency.exponentialRampToValueAtTime(30, now + 0.04);
        
        const sineGain = audioCtx.createGain();
        sineGain.gain.setValueAtTime(0.3, now);
        sineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        sineOsc.connect(sineGain);
        sineGain.connect(audioCtx.destination);
        
        sineOsc.start(now);
        sineOsc.stop(now + 0.05);
    },
    
    // Melodia di successo (Pentatonica spaziale con oscillatori combinati)
    playSuccessChime() {
        this.init();
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
        
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.12;
            const osc = audioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
            
            // Filtro passa-basso risonante per un suono morbido e futuristico
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1500, time);
            filter.Q.setValueAtTime(3, time);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(time);
            osc.stop(time + 0.7);
        });
    }
};

function initAudio() {
    const audioBtn = document.getElementById('audio-toggle');
    const soundOn = audioBtn.querySelector('.icon-sound-on');
    const soundOff = audioBtn.querySelector('.icon-sound-off');
    
    audioBtn.addEventListener('click', () => {
        state.audioEnabled = !state.audioEnabled;
        if (state.audioEnabled) {
            soundOn.classList.remove('hidden');
            soundOff.classList.add('hidden');
            audioEngine.init();
            audioEngine.playLightsaberIgnite('#00ffff');
        } else {
            soundOn.classList.add('hidden');
            soundOff.classList.remove('hidden');
        }
    });
}

/* ==========================================================================
   SFONDO STELLATO BIDIMENSIONALE INTERATTIVO
   ========================================================================== */
let starfieldCanvas = null;
let starfieldCtx = null;
let stars = [];
const numStars = 200;

// Meteoriti (Stelle Cadenti)
let meteorites = [];
const numMeteorites = 4;

function initStarfield() {
    starfieldCanvas = document.getElementById('starfield');
    starfieldCtx = starfieldCanvas.getContext('2d');
    
    resizeStarfield();
    window.addEventListener('resize', resizeStarfield);
    
    // Inizializza le stelle
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * starfieldCanvas.width - starfieldCanvas.width / 2,
            y: Math.random() * starfieldCanvas.height - starfieldCanvas.height / 2,
            z: Math.random() * starfieldCanvas.width,
            size: Math.random() * 1.5 + 0.5
        });
    }

    // Inizializza i meteoriti
    initMeteorites();
    
    // Mouse Interaction (Parallasse leggero)
    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    });
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Sfondo semitrasparente per creare una scia se la velocità è alta (effetto Hyperdrive)
        const isHyper = state.starSpeedMultiplier > 2.0;
        starfieldCtx.fillStyle = isHyper ? 'rgba(5, 5, 10, 0.15)' : '#05050a';
        starfieldCtx.fillRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
        
        starfieldCtx.save();
        starfieldCtx.translate(starfieldCanvas.width / 2 + mouseX, starfieldCanvas.height / 2 + mouseY);
        
        for (let i = 0; i < numStars; i++) {
            let star = stars[i];
            
            // Movimento in direzione Z (verso l'osservatore)
            star.z -= 2 * state.starSpeedMultiplier;
            if (star.z <= 0) {
                star.z = starfieldCanvas.width;
                star.x = Math.random() * starfieldCanvas.width - starfieldCanvas.width / 2;
                star.y = Math.random() * starfieldCanvas.height - starfieldCanvas.height / 2;
            }
            
            // Proiezione 3D su schermo 2D
            let k = 128.0 / star.z;
            let px = star.x * k;
            let py = star.y * k;
            
            if (px < -starfieldCanvas.width / 2 || px > starfieldCanvas.width / 2 ||
                py < -starfieldCanvas.height / 2 || py > starfieldCanvas.height / 2) {
                continue;
            }
            
            // Calcolo dimensione in base alla distanza
            let size = star.size * k * 0.5;
            
            // Disegna stella
            starfieldCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, 1.0 - star.z / starfieldCanvas.width)})`;
            
            if (isHyper) {
                // Disegna scia (Hyperdrive)
                let prevK = 128.0 / (star.z + 15 * state.starSpeedMultiplier);
                let ppx = star.x * prevK;
                let ppy = star.y * prevK;
                
                starfieldCtx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.8, 1.0 - star.z / starfieldCanvas.width)})`;
                starfieldCtx.lineWidth = size * 0.5;
                starfieldCtx.beginPath();
                starfieldCtx.moveTo(ppx, ppy);
                starfieldCtx.lineTo(px, py);
                starfieldCtx.stroke();
            } else {
                // Stella standard (cerchio)
                starfieldCtx.beginPath();
                starfieldCtx.arc(px, py, size, 0, Math.PI * 2);
                starfieldCtx.fill();
            }
        }
        
        starfieldCtx.restore();

        // Disegna e aggiorna i meteoriti sullo sfondo (non traslati per muoversi liberi sullo schermo)
        updateAndDrawMeteorites(mouseX, mouseY);
    }
    
    animate();
}

function initMeteorites() {
    for (let i = 0; i < numMeteorites; i++) {
        resetMeteorite(i);
        // Distribuisce la posizione orizzontale in modo casuale all'avvio
        meteorites[i].x = Math.random() * starfieldCanvas.width;
        meteorites[i].y = Math.random() * (starfieldCanvas.height * 0.6);
    }
}

function resetMeteorite(i) {
    const fromLeft = Math.random() > 0.4;
    meteorites[i] = {
        x: fromLeft ? -100 : Math.random() * (starfieldCanvas.width * 0.8),
        y: -100,
        size: Math.random() * 2 + 1.5, // Dimensione nucleo
        vx: Math.random() * 3 + 3, // Velocità diagonale orizzontale
        vy: Math.random() * 2 + 2, // Velocità diagonale verticale
        length: Math.random() * 80 + 50, // Lunghezza coda
        color: Math.random() > 0.3 ? 'theme' : '#888899', // Tema attivo o grigio standard
        sparks: []
    };
}

function updateAndDrawMeteorites(mouseX, mouseY) {
    for (let i = 0; i < numMeteorites; i++) {
        let met = meteorites[i];
        
        // Velocità influenzata dallo scroll hyperdrive
        const speedMultiplier = state.starSpeedMultiplier > 1.5 ? state.starSpeedMultiplier * 1.5 : 1.0;
        met.x += met.vx * speedMultiplier;
        met.y += met.vy * speedMultiplier;
        
        // Leggero effetto parallasse con il mouse
        const drawX = met.x + mouseX * 0.3;
        const drawY = met.y + mouseY * 0.3;

        // Se esce dallo schermo, resetta
        if (met.x > starfieldCanvas.width + 150 || met.y > starfieldCanvas.height + 150) {
            resetMeteorite(i);
            continue;
        }

        // Genera scintille di coda
        if (Math.random() < 0.25) {
            met.sparks.push({
                x: drawX,
                y: drawY,
                vx: -met.vx * 0.15 + (Math.random() * 1.5 - 0.75),
                vy: -met.vy * 0.15 + (Math.random() * 1.5 - 0.75),
                size: Math.random() * 1.2 + 0.4,
                life: 1.0
            });
        }

        // Recupera colore tema corrente
        const metColor = met.color === 'theme' ? state.themeColor : '#7a7a9a';
        
        // Disegna coda con sfumatura
        const grad = starfieldCtx.createLinearGradient(
            drawX, drawY,
            drawX - (met.vx * (met.length / 10)), drawY - (met.vy * (met.length / 10))
        );
        grad.addColorStop(0, metColor);
        grad.addColorStop(0.4, metColor + '66');
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        starfieldCtx.strokeStyle = grad;
        starfieldCtx.lineWidth = met.size * 0.7;
        starfieldCtx.lineCap = 'round';
        starfieldCtx.beginPath();
        starfieldCtx.moveTo(drawX, drawY);
        starfieldCtx.lineTo(drawX - (met.vx * (met.length / 10)), drawY - (met.vy * (met.length / 10)));
        starfieldCtx.stroke();

        // Disegna il nucleo luminoso del meteorite
        starfieldCtx.fillStyle = '#ffffff';
        starfieldCtx.shadowColor = metColor;
        starfieldCtx.shadowBlur = 8;
        starfieldCtx.beginPath();
        starfieldCtx.arc(drawX, drawY, met.size, 0, Math.PI * 2);
        starfieldCtx.fill();
        starfieldCtx.shadowBlur = 0; // Reset della sfocatura d'ombra

        // Aggiorna e disegna particelle (sparks)
        for (let j = met.sparks.length - 1; j >= 0; j--) {
            let spark = met.sparks[j];
            spark.x += spark.vx * speedMultiplier;
            spark.y += spark.vy * speedMultiplier;
            spark.life -= 0.05;
            
            if (spark.life <= 0) {
                met.sparks.splice(j, 1);
                continue;
            }

            starfieldCtx.fillStyle = metColor;
            starfieldCtx.globalAlpha = spark.life;
            starfieldCtx.beginPath();
            starfieldCtx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
            starfieldCtx.fill();
        }
        starfieldCtx.globalAlpha = 1.0; // Reset opacità globale
    }
}

function resizeStarfield() {
    starfieldCanvas.width = window.innerWidth;
    starfieldCanvas.height = window.innerHeight;
}

/* ==========================================================================
   ANIMAZIONI DI SCROLL (GSAP + SCROLLTRIGGER)
   ========================================================================== */
function initScrollAnimations() {
    const sections = ['hero', 'products', 'characters', 'game', 'checkout'];

    sections.forEach(secId => {
        ScrollTrigger.create({
            trigger: `#${secId}`,
            start: 'top 50%',
            end: 'bottom 50%',
            onEnter: () => updateSideNav(secId),
            onEnterBack: () => updateSideNav(secId)
        });
    });

    function updateSideNav(activeId) {
        document.querySelectorAll('.nav-dot').forEach(dot => {
            dot.classList.toggle('active', dot.getAttribute('data-section') === activeId);
        });
    }

    // Nav dots — scroll fluido verso la sezione
    document.querySelectorAll('.nav-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = dot.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Effetto Hyperdrive — ascolta scroll su window
    window.addEventListener('scroll', () => {
        state.starSpeedMultiplier = 3.5;
        clearTimeout(state.scrollTimeout);
        state.scrollTimeout = setTimeout(() => {
            gsap.to(state, { starSpeedMultiplier: 1.0, duration: 0.5 });
        }, 150);
    });

    // Hero animations
    gsap.from('.glitch-title', { opacity: 0, y: 50, duration: 1.5, ease: 'power4.out' });
    gsap.from('.hero-payoff',  { opacity: 0, y: 30, duration: 1.2, delay: 0.5, ease: 'power3.out' });
    gsap.from('.scroll-indicator', { opacity: 0, duration: 1.0, delay: 1.0 });

    // Packshots — tutti insieme, nessun stagger per evitare disallineamento
    gsap.from('.packshot-item', {
        scrollTrigger: { trigger: '#products', start: 'top 80%', once: true },
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    });

    // Character cards — animazione fade-in uniforme, tutte insieme
    gsap.from('.character-card', {
        scrollTrigger: { trigger: '#characters', start: 'top 80%', once: true },
        y: 0,
        duration: 0.9,
        ease: 'power3.out'
    });
}

/* ==========================================================================
   SEZIONE 2: PACKSHOT PRODOTTI (3D)
   ========================================================================== */
function initPackshots() {
    const loader = new GLTFLoader();
    let cachedGltf = null;

    // Colori vividi per i condom (blu saturo, non ciano)
    const condomColors = {
        stormtrooper: '#0066ff',
        grogu:        '#39ff14',
        macewindu:    '#b026ff',
        darthvader:   '#ff0033',
    };

    const loadModel = (cb) => {
        if (cachedGltf) { cb(cachedGltf); return; }
        loader.load('condom.glb', gltf => { cachedGltf = gltf; cb(gltf); },
            undefined,
            err => console.error('GLB load error:', err));
    };

    document.querySelectorAll('.packshot-item').forEach(item => {
        const charName = item.getAttribute('data-character');
        const config   = characterThemes[charName];
        if (!config) return;

        const canvas  = item.querySelector('.pack-canvas');
        const packBox = item.querySelector('.packshot-box');
        if (!canvas) return;

        const neonColor = new THREE.Color(condomColors[charName] || config.hex);

        const hover    = { progress: 0 };
        let saberLight = null;
        let rimLight   = null;
        let meshes     = [];
        let modelMinY  = -1.2;
        let modelMaxY  =  1.2;
        let initialized = false;

        const initRenderer = () => {
            if (initialized) return;
            const rect = (packBox || item).getBoundingClientRect();
            const W = Math.round(rect.width)  || 240;
            const H = Math.round(rect.height) || 380;
            if (W < 10 || H < 10) return;
            initialized = true;

            canvas.width  = W * window.devicePixelRatio;
            canvas.height = H * window.devicePixelRatio;
            canvas.style.width  = W + 'px';
            canvas.style.height = H + 'px';

            const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(W, H, false);
            renderer.setClearColor(0x0c0c16, 1);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.3;

            const scene  = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
            camera.position.set(0, 0, 4);

            const pmremGen = new THREE.PMREMGenerator(renderer);
            scene.environment = pmremGen.fromScene(new RoomEnvironment()).texture;
            pmremGen.dispose();

            // Luce ambiente molto soffusa — condom spento a riposo
            scene.add(new THREE.AmbientLight(0xffffff, 0.15));
            const key = new THREE.DirectionalLight(0xffffff, 0.4);
            key.position.set(1.5, 3, 3); scene.add(key);
            const fill = new THREE.DirectionalLight(0xffffff, 0.15);
            fill.position.set(-2, 1, -1); scene.add(fill);
            const back = new THREE.DirectionalLight(0xffffff, 0.2);
            back.position.set(0, -1, -3); scene.add(back);

            // Neon dal basso verso l'alto — sale con hover.progress
            saberLight = new THREE.PointLight(neonColor.clone(), 0, 8);
            saberLight.position.set(0, -4, 0.5); scene.add(saberLight);
            // Secondo punto neon per rim laterale
            rimLight = new THREE.PointLight(neonColor.clone(), 0, 5);
            rimLight.position.set(1, 0, -1); scene.add(rimLight);
            // Luce top per completare la salita dal basso
            const topLight = new THREE.PointLight(neonColor.clone(), 0, 5);
            topLight.position.set(0, 3, 0.5); scene.add(topLight);

            // Materiale lattice: molto trasparente, "spento" a riposo
            const makeMat = () => new THREE.MeshStandardMaterial({
                color: neonColor.clone(),
                emissive: neonColor.clone(),
                emissiveIntensity: 0.0,
                roughness: 0.08,
                metalness: 0.0,
                transparent: true,
                opacity: 0.22,
                envMapIntensity: 1.5,
                side: THREE.DoubleSide,
            });

            // Placeholder capsula mentre il GLB carica
            const capGeo  = new THREE.CapsuleGeometry(0.45, 1.6, 16, 32);
            const capMesh = new THREE.Mesh(capGeo, makeMat());
            scene.add(capMesh);
            meshes.push(capMesh);

            // Carica il GLB e sostituisce il placeholder
            loadModel(gltf => {
                const model = gltf.scene.clone(true);
                model.traverse(child => {
                    if (child.isMesh) {
                        child.material = makeMat();
                        meshes.push(child);
                    }
                });
                const b  = new THREE.Box3().setFromObject(model);
                const c  = b.getCenter(new THREE.Vector3());
                const sz = b.getSize(new THREE.Vector3());
                model.position.sub(c);
                model.scale.setScalar(1.6 / Math.max(sz.x, sz.y, sz.z));
                const b2 = new THREE.Box3().setFromObject(model);
                modelMinY = b2.min.y;
                modelMaxY = b2.max.y;
                scene.remove(capMesh);
                meshes = meshes.filter(m => m !== capMesh);
                scene.add(model);
            });

            const animate = () => {
                requestAnimationFrame(animate);
                const p = hover.progress;
                const span = modelMaxY - modelMinY;

                // Luce neon sale dal basso verso l'alto
                const lightY = modelMinY - 0.8 + (span + 1.6) * p;
                if (saberLight) {
                    saberLight.position.y = lightY;
                    saberLight.intensity  = p * 10;
                }
                if (rimLight)  rimLight.intensity  = p * 4;
                topLight.intensity = p * 3;

                // Opacità e emissione crescono con hover: spento → acceso
                meshes.forEach(m => {
                    m.material.opacity           = 0.22 + p * 0.62;   // 0.22 → 0.84
                    m.material.emissiveIntensity = p * 1.2;
                    m.rotation.y += 0.006;
                });
                renderer.render(scene, camera);
            };
            animate();
        };

        setTimeout(initRenderer, 300);
        setTimeout(initRenderer, 800); // secondo tentativo se il layout non era pronto
        new ResizeObserver(initRenderer).observe(packBox || item);

        item.addEventListener('mouseenter', () => {
            updateThemeColors(config.hex, charName);
            gsap.killTweensOf(hover);
            gsap.to(hover, { progress: 1, duration: 0.8, ease: 'power2.inOut' });
        });
        item.addEventListener('mouseleave', () => {
            gsap.killTweensOf(hover);
            gsap.to(hover, { progress: 0, duration: 0.5, ease: 'power2.in' });
        });
        item.addEventListener('click', () => {
            updateThemeColors(config.hex, charName);
            state.selectedCharacterColor = config.hex;
            updateCheckoutBoxColor(config.hex);
            document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function initCharacterCards() {
    const cards = document.querySelectorAll('.character-card');
    
    cards.forEach(card => {
        const charName = card.getAttribute('data-character');
        const config = characterThemes[charName];
        
        // Inietta il colore del tema come proprietà CSS per la card
        card.style.setProperty('--card-color', config.hex);
        card.style.setProperty('--card-color-rgb', config.rgb);
        
        card.addEventListener('mouseenter', () => {
            // Aggiorna il tema globale del sito al colore della card puntata
            updateThemeColors(config.hex, charName);
        });

        card.addEventListener('click', () => {
            // Seleziona il colore e salta alla sezione Checkout configurata
            updateThemeColors(config.hex, charName);
            
            // Cambia anche lo stato del configuratore
            state.selectedCharacterColor = config.hex;
            updateCheckoutBoxColor(config.hex);
            
            const checkoutSection = document.getElementById('checkout');
            checkoutSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

/* ==========================================================================
   PAGINA 3: IL GIOCO DELLA STANZA BUIA (THREE.JS + GLB) — camera 360°
   ========================================================================== */
let gameScene, gameCamera, gameRenderer;
// Treasure hunt – arrays of all hidden condom packs and their glow spheres
const condomPacks  = [];   // THREE.Mesh[]
const glowSpheres  = [];   // THREE.Mesh[]
let   foundCount   = 0;
const TOTAL_CONDOMS = 5;

// Colour themes for each hidden pack (cycles through the 4 characters)
const HUNT_COLORS = ['#00ffff','#39ff14','#b026ff','#ff003c','#00ffff'];
let gameContainer, overlayCanvas, overlayCtx;
let gameWidth, gameHeight;
let ambientLight, sunLight, fillLight, neonAccent;

let mousePos      = { x: 0, y: 0 };
let flashlightPos = { x: -1000, y: -1000 };

// ── Camera look-around (spherical, first-person) ────────────────────────────
const camLook = {
    yaw:   0,
    pitch: -0.15,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    sensitivity: 0.003,
};
// Posizione camera (modificata dal movimento WASD)
const CAM_POS = new THREE.Vector3(0, 1.65, 0.5);

// ── Bounds della stanza (impostati al caricamento del GLB) ───────────────────
let roomBounds = new THREE.Box3(
    new THREE.Vector3(-7, 0, -7),
    new THREE.Vector3( 7, 4,  7)
);

// ── Movimento WASD ────────────────────────────────────────────────────────────
const keys = { w: false, a: false, s: false, d: false };
const MOVE_SPEED = 3.5; // unità al secondo
let lastMoveTime = performance.now();

function _tickMovement() {
    const now = performance.now();
    const dt  = Math.min((now - lastMoveTime) / 1000, 0.05); // capped a 50ms
    lastMoveTime = now;

    const anyKey = keys.w || keys.a || keys.s || keys.d;
    if (!anyKey) return;

    // Direzione "avanti" proiettata sul piano XZ
    const fwd   = new THREE.Vector3( Math.sin(camLook.yaw), 0,  Math.cos(camLook.yaw));
    const right  = new THREE.Vector3( Math.cos(camLook.yaw), 0, -Math.sin(camLook.yaw));

    const move = new THREE.Vector3();
    if (keys.w) move.addScaledVector(fwd,   MOVE_SPEED * dt);
    if (keys.s) move.addScaledVector(fwd,  -MOVE_SPEED * dt);
    if (keys.a) move.addScaledVector(right, -MOVE_SPEED * dt);
    if (keys.d) move.addScaledVector(right,  MOVE_SPEED * dt);

    CAM_POS.add(move);

    // Clampa dentro i bounds della stanza (già ristretto al caricamento GLB)
    CAM_POS.x = Math.max(roomBounds.min.x, Math.min(roomBounds.max.x, CAM_POS.x));
    CAM_POS.z = Math.max(roomBounds.min.z, Math.min(roomBounds.max.z, CAM_POS.z));
    CAM_POS.y = 1.65; // altezza occhi fissa

    _applyCameraLook();
}

// Animazione fluida on/off tramite GSAP
const lightAnim = { t: 1 };

function _applyCameraLook() {
    // Calcola direzione da yaw + pitch
    const dir = new THREE.Vector3(
        Math.sin(camLook.yaw) * Math.cos(camLook.pitch),
        Math.sin(camLook.pitch),
        Math.cos(camLook.yaw) * Math.cos(camLook.pitch)
    );
    gameCamera.position.copy(CAM_POS);
    gameCamera.lookAt(CAM_POS.clone().add(dir));
}

function initGameSection() {
    gameContainer = document.getElementById('game-canvas-container');
    overlayCanvas = document.getElementById('flashlight-overlay');
    overlayCtx    = overlayCanvas.getContext('2d');

    gameWidth  = gameContainer.clientWidth;
    gameHeight = gameContainer.clientHeight;
    overlayCanvas.width  = gameWidth;
    overlayCanvas.height = gameHeight;

    // ── Renderer ──────────────────────────────────────────────────────────────
    gameRenderer = new THREE.WebGLRenderer({
        canvas:    document.getElementById('three-game-canvas'),
        antialias: true,
    });
    gameRenderer.setSize(gameWidth, gameHeight);
    gameRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    gameRenderer.shadowMap.enabled  = true;
    gameRenderer.shadowMap.type     = THREE.PCFSoftShadowMap;
    gameRenderer.outputColorSpace   = THREE.SRGBColorSpace;
    gameRenderer.toneMapping        = THREE.ACESFilmicToneMapping;
    gameRenderer.toneMappingExposure = 1.0;

    // ── Scena ─────────────────────────────────────────────────────────────────
    gameScene = new THREE.Scene();
    gameScene.background = new THREE.Color('#08080f');

    // ── Camera first-person ───────────────────────────────────────────────────
    gameCamera = new THREE.PerspectiveCamera(70, gameWidth / gameHeight, 0.05, 60);
    _applyCameraLook();

    // ── Luci ACCESE ───────────────────────────────────────────────────────────
    ambientLight = new THREE.AmbientLight('#fff5e0', 0.55);
    gameScene.add(ambientLight);

    sunLight = new THREE.PointLight('#ffe8c0', 3.5, 20);
    sunLight.position.set(0, 4.5, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.bias = -0.001;
    gameScene.add(sunLight);

    fillLight = new THREE.PointLight('#ffd090', 1.8, 12);
    fillLight.position.set(-3, 3, -1);
    gameScene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#c0d8ff', 0.3);
    rimLight.position.set(3, 4, 3);
    gameScene.add(rimLight);

    neonAccent = new THREE.PointLight(state.themeColor, 0.3, 6);
    neonAccent.position.set(0.5, 1.2, 0.8);
    gameScene.add(neonAccent);

    // ── Room shell — pareti, pavimento, soffitto ──────────────────────────────
    _buildRoomShell();

    // ── Carica stanza GLB ─────────────────────────────────────────────────────
    const roomLoader = new GLTFLoader();
    roomLoader.load(
        'modern_bedroom.glb',
        gltf => {
            const room = gltf.scene;
            const box  = new THREE.Box3().setFromObject(room);
            const sz   = box.getSize(new THREE.Vector3());
            const ctr  = box.getCenter(new THREE.Vector3());

            // Scala la stanza: vogliamo che la dimensione maggiore sia ~12 unità
            const scale = 10.0 / Math.max(sz.x, sz.y, sz.z);
            room.scale.setScalar(scale);
            // Centra X/Z, poggia sul pavimento
            room.position.set(
                -ctr.x * scale,
                0,
                -ctr.z * scale
            );
            const box2 = new THREE.Box3().setFromObject(room);
            room.position.y -= box2.min.y;

            room.traverse(child => {
                if (child.isMesh) {
                    child.castShadow    = true;
                    child.receiveShadow = true;
                }
            });
            gameScene.add(room);

            // Riposiziona luci nel centro della stanza scalata
            const box3  = new THREE.Box3().setFromObject(room);
            const cent3 = box3.getCenter(new THREE.Vector3());
            sunLight.position.set(cent3.x, box3.max.y * 0.9, cent3.z);
            fillLight.position.set(cent3.x - 2, box3.max.y * 0.7, cent3.z + 1);

            // Salva i bounds della stanza per collisione pareti
            // Usa i bounds XZ del pavimento con margine ampio per stare dentro le mura
            roomBounds.copy(box3);
            // Shrink borders: 0.7 unità dalle pareti (spessore muro + corpo giocatore)
            roomBounds.min.x += 0.7;
            roomBounds.min.z += 0.7;
            roomBounds.max.x -= 0.7;
            roomBounds.max.z -= 0.7;

            // Sposta la camera al centro della stanza a eye-level
            CAM_POS.set(cent3.x, 1.65, cent3.z);
            _applyCameraLook();

            _spawnCondoms(cent3);
            _hideLoadingHint();
        },
        undefined,
        err => {
            console.error('modern_bedroom.glb load error:', err);
            // Fallback pavimento
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(20, 20),
                new THREE.MeshStandardMaterial({ color: '#111118', roughness: 0.8 })
            );
            mesh.rotation.x = -Math.PI / 2;
            mesh.receiveShadow = true;
            gameScene.add(mesh);
            _spawnCondoms(new THREE.Vector3(0, 0, 0));
            _hideLoadingHint();
        }
    );

    // ── Drag-to-look — mouse ──────────────────────────────────────────────────
    gameContainer.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        if (e.target.closest('#light-switch')) return; // non draggare se clicco il toggle
        camLook.isDragging = true;
        camLook.lastX = e.clientX;
        camLook.lastY = e.clientY;
        gameContainer.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', () => {
        camLook.isDragging = false;
        gameContainer.style.cursor = 'crosshair';
    });
    gameContainer.addEventListener('mousemove', onGameMouseMove);

    // ── Drag-to-look — touch ──────────────────────────────────────────────────
    gameContainer.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            camLook.isDragging = true;
            camLook.lastX = e.touches[0].clientX;
            camLook.lastY = e.touches[0].clientY;
        }
    }, { passive: true });
    gameContainer.addEventListener('touchend',   () => { camLook.isDragging = false; }, { passive: true });
    gameContainer.addEventListener('touchmove',  onGameTouchMove, { passive: true });

    // ── Click sui condom — raccogliere (senza pointer lock) ───────────────────
    gameContainer.addEventListener('click', e => {
        // Non propagare se il click è sul light switch
        if (e.target.closest('#light-switch')) return;
        onGameClick(e);
    });

    // ── Interruttore — stopPropagation per non attivare il canvas click ────────
    const lightSwitchBtn = document.getElementById('light-switch');
    lightSwitchBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleRoomLight();
    });

    // ── Stile cursore iniziale ────────────────────────────────────────────────
    gameContainer.style.cursor = 'crosshair';

    // ── Nascondi overlay click-to-play (non serve più senza pointer lock) ──────
    const clickOverlay = document.getElementById('game-click-overlay');
    if (clickOverlay) clickOverlay.classList.add('hidden');

    // ── WASD keyboard input ───────────────────────────────────────────────────
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        switch (e.code) {
            case 'KeyW': case 'ArrowUp':    keys.w = true; e.preventDefault(); break;
            case 'KeyS': case 'ArrowDown':  keys.s = true; e.preventDefault(); break;
            case 'KeyA': case 'ArrowLeft':  keys.a = true; e.preventDefault(); break;
            case 'KeyD': case 'ArrowRight': keys.d = true; e.preventDefault(); break;
            // F o L = toggle luce da tastiera
            case 'KeyF': case 'KeyL':       toggleRoomLight(); break;
        }
    });
    document.addEventListener('keyup', e => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp':    keys.w = false; break;
            case 'KeyS': case 'ArrowDown':  keys.s = false; break;
            case 'KeyA': case 'ArrowLeft':  keys.a = false; break;
            case 'KeyD': case 'ArrowRight': keys.d = false; break;
        }
    });

    // ── Render loop ───────────────────────────────────────────────────────────
    (function gameAnimate() {
        requestAnimationFrame(gameAnimate);
        _tickMovement();
        const t = Date.now() * 0.001;
        condomPacks.forEach((p, i) => {
            p.rotation.y += 0.007;
            if (!state.lightIsOn) {
                const pulse = 0.9 + 0.35 * Math.sin(t * 1.8 + i * 1.3);
                p.material.emissiveIntensity = pulse;
                if (glowSpheres[i]) glowSpheres[i].material.opacity = 0.12 + 0.1 * Math.sin(t * 1.8 + i * 1.3);
                if (p.userData.ptLight) p.userData.ptLight.intensity = 2.5 + 1.0 * Math.sin(t * 1.8 + i * 1.3);
            }
        });
        neonAccent.color.set(state.themeColor);
        gameRenderer.render(gameScene, gameCamera);
        if (!state.lightIsOn) drawFlashlightMask();
    })();

    // ── Resize ────────────────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
        if (!gameContainer) return;
        gameWidth  = gameContainer.clientWidth;
        gameHeight = gameContainer.clientHeight;
        overlayCanvas.width  = gameWidth;
        overlayCanvas.height = gameHeight;
        gameCamera.aspect = gameWidth / gameHeight;
        gameCamera.updateProjectionMatrix();
        gameRenderer.setSize(gameWidth, gameHeight);
        if (!state.lightIsOn) drawFlashlightMask();
    });
}

/* Crea una texture canvas con pattern sottile (stucco / lino) */
function _makeWallTexture(baseColor, patternColor, size = 256) {
    const cvs = document.createElement('canvas');
    cvs.width = size; cvs.height = size;
    const ctx = cvs.getContext('2d');

    // base
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // rumore fine (grana parete)
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 1.2;
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // sottili linee orizzontali (texture lino/intonaco)
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = patternColor;
    ctx.lineWidth = 0.8;
    for (let y = 0; y < size; y += 6) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.random() * 2);
        ctx.lineTo(size, y + Math.random() * 2);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function _makeFloorTexture(size = 512) {
    const cvs = document.createElement('canvas');
    cvs.width = size; cvs.height = size;
    const ctx = cvs.getContext('2d');

    // parquet a doghe
    const plankW = size / 4;
    const plankH = size / 8;
    const colors = ['#5a3e28', '#6b4c32', '#4e3320', '#7a5840'];

    for (let row = 0; row < size / plankH; row++) {
        const offset = (row % 2) * (plankW / 2);
        for (let col = -1; col < size / plankW + 1; col++) {
            const x = col * plankW - offset;
            const y = row * plankH;
            ctx.fillStyle = colors[(row + col + 4) % colors.length];
            ctx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);

            // venatura
            ctx.globalAlpha = 0.12;
            ctx.strokeStyle = '#2a1a0a';
            ctx.lineWidth = 0.6;
            for (let g = 0; g < 4; g++) {
                const gx = x + Math.random() * plankW;
                ctx.beginPath();
                ctx.moveTo(gx, y);
                ctx.lineTo(gx + (Math.random() - 0.5) * 20, y + plankH);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    }

    // giunzioni tra doghe
    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.35;
    for (let row = 0; row <= size / plankH; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * plankH);
        ctx.lineTo(size, row * plankH);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function _makeCeilingTexture(size = 256) {
    const cvs = document.createElement('canvas');
    cvs.width = size; cvs.height = size;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = '#e8e0d5';
    ctx.fillRect(0, 0, size, size);
    // sottile grana
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#ccc';
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function _buildRoomShell() {
    const W = 16;   // larghezza
    const H = 5.5;  // altezza
    const D = 16;   // profondità

    const wallTex     = _makeWallTexture('#b8a898', '#a09080');
    const accentTex   = _makeWallTexture('#8a7060', '#6a5040'); // parete accent più scura
    const floorTex    = _makeFloorTexture();
    const ceilTex     = _makeCeilingTexture();

    // Ripetizione texture sulle superfici grandi
    wallTex.repeat.set(3, 1.5);
    accentTex.repeat.set(2, 1.5);
    floorTex.repeat.set(5, 5);
    ceilTex.repeat.set(4, 4);

    const wallMat   = new THREE.MeshStandardMaterial({ map: wallTex,   roughness: 0.85, metalness: 0.0, side: THREE.BackSide });
    const accentMat = new THREE.MeshStandardMaterial({ map: accentTex, roughness: 0.90, metalness: 0.0, side: THREE.BackSide });
    const floorMat  = new THREE.MeshStandardMaterial({ map: floorTex,  roughness: 0.80, metalness: 0.0, side: THREE.BackSide });
    const ceilMat   = new THREE.MeshStandardMaterial({ map: ceilTex,   roughness: 0.90, metalness: 0.0, side: THREE.BackSide });

    // BoxGeometry con 6 materiali separati [dx, sx, top, bottom, front, back]
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(W, H, D),
        [
            wallMat,    // destra
            wallMat,    // sinistra
            ceilMat,    // soffitto (top)
            floorMat,   // pavimento (bottom)
            wallMat,    // davanti
            accentMat,  // dietro (parete accent — quella più visibile)
        ]
    );
    box.position.set(0, H / 2, 0);
    box.receiveShadow = true;
    gameScene.add(box);

    // Battiscopa scuro su tutti e 4 i lati (sottile piano posizionato ai piedi)
    const skirtMat = new THREE.MeshStandardMaterial({ color: '#2c1f14', roughness: 0.6 });
    const skirtH   = 0.12;
    const skirts = [
        { pos: [0, skirtH / 2, -D / 2 + 0.01], rot: [0, 0, 0],         geo: [W, skirtH, 0.04] },
        { pos: [0, skirtH / 2,  D / 2 - 0.01], rot: [0, Math.PI, 0],   geo: [W, skirtH, 0.04] },
        { pos: [-W / 2 + 0.01, skirtH / 2, 0], rot: [0, Math.PI / 2, 0], geo: [D, skirtH, 0.04] },
        { pos: [ W / 2 - 0.01, skirtH / 2, 0], rot: [0, -Math.PI / 2, 0], geo: [D, skirtH, 0.04] },
    ];
    skirts.forEach(s => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(...s.geo), skirtMat);
        m.position.set(...s.pos);
        m.rotation.set(...s.rot);
        gameScene.add(m);
    });

    // Cornicione soffitto
    const corniceH   = 0.08;
    const corniceMat = new THREE.MeshStandardMaterial({ color: '#d8d0c5', roughness: 0.7 });
    const cornices = [
        { pos: [0, H - corniceH / 2, -D / 2 + 0.01], rot: [0, 0, 0],              geo: [W, corniceH, 0.06] },
        { pos: [0, H - corniceH / 2,  D / 2 - 0.01], rot: [0, Math.PI, 0],        geo: [W, corniceH, 0.06] },
        { pos: [-W / 2 + 0.01, H - corniceH / 2, 0], rot: [0, Math.PI / 2, 0],    geo: [D, corniceH, 0.06] },
        { pos: [ W / 2 - 0.01, H - corniceH / 2, 0], rot: [0, -Math.PI / 2, 0],   geo: [D, corniceH, 0.06] },
    ];
    cornices.forEach(s => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(...s.geo), corniceMat);
        m.position.set(...s.pos);
        m.rotation.set(...s.rot);
        gameScene.add(m);
    });
}

function _hideLoadingHint() {
    const hint = document.getElementById('game-drag-hint');
    if (hint) {
        setTimeout(() => {
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 600);
        }, 2500);
    }
}

// ── Treasure-hunt spawn ───────────────────────────────────────────────────────
function _buildPackTexture(neonColor) {
    const cvs = document.createElement('canvas');
    cvs.width = 128; cvs.height = 128;
    const c = cvs.getContext('2d');
    c.fillStyle = '#06060f'; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = neonColor + '88'; c.lineWidth = 3; c.strokeRect(6, 6, 116, 116);
    c.fillStyle = '#fff'; c.font = 'bold 20px sans-serif'; c.textAlign = 'center';
    c.fillText('DUREX', 64, 50);
    c.fillStyle = neonColor; c.font = 'bold 13px sans-serif';
    c.fillText('NEON COLLECTION', 64, 76);
    // tiny star-wars symbol
    c.fillStyle = neonColor + 'cc'; c.font = '18px sans-serif';
    c.fillText('★', 64, 104);
    return new THREE.CanvasTexture(cvs);
}

function _spawnCondoms(center) {
    const b = roomBounds;

    // Centro e margine sicuro dai muri (0.4 unità di padding)
    const PAD = 0.4;
    const minX = b.min.x + PAD, maxX = b.max.x - PAD;
    const minZ = b.min.z + PAD, maxZ = b.max.z - PAD;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const hw = (maxX - minX) / 2;   // mezzo raggio X usabile
    const hz = (maxZ - minZ) / 2;   // mezzo raggio Z usabile

    // Clamp helper
    const clampX = x => Math.max(minX, Math.min(maxX, x));
    const clampZ = z => Math.max(minZ, Math.min(maxZ, z));

    const spots = [
        { x: clampX(cx + hw * 0.75), y: 0.12, z: clampZ(cz + hz * 0.70), ry: 0.3  },  // angolo dx-avanti
        { x: clampX(cx - hw * 0.75), y: 0.12, z: clampZ(cz - hz * 0.70), ry: 0.3  },  // angolo sx-fondo
        { x: clampX(cx + hw * 0.50), y: 0.78, z: clampZ(cz - hz * 0.40), ry: 0.3  },  // piano comodino
        { x: clampX(cx - hw * 0.40), y: 1.42, z: clampZ(cz + hz * 0.55), ry: 0.3  },  // mensola
        { x: clampX(cx + hw * 0.10), y: 0.12, z: clampZ(cz - hz * 0.75), ry: 0.3  },  // parete fondo centro
    ];

    spots.forEach((spot, i) => {
        const color = HUNT_COLORS[i % HUNT_COLORS.length];
        const geo = new THREE.BoxGeometry(0.22, 0.28, 0.06);
        const mat = new THREE.MeshStandardMaterial({
            map: _buildPackTexture(color),
            roughness: 0.2, metalness: 0.6,
            emissive: new THREE.Color('#000000'),
            emissiveIntensity: 0,
        });
        const pack = new THREE.Mesh(geo, mat);
        pack.position.set(spot.x, spot.y + 0.14, spot.z);
        pack.rotation.y = spot.ry;
        pack.castShadow = true;
        pack.userData.neonColor = color;
        gameScene.add(pack);
        condomPacks.push(pack);

        const glowMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color), transparent: true,
            opacity: 0, blending: THREE.AdditiveBlending, side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), glowMat);
        glow.position.copy(pack.position);
        gameScene.add(glow);
        glowSpheres.push(glow);

        // Luce puntuale: illumina la scena attorno al condom nel buio
        const ptLight = new THREE.PointLight(color, 0, 4.0);
        ptLight.position.copy(pack.position);
        ptLight.position.y += 0.15;
        gameScene.add(ptLight);
        pack.userData.ptLight = ptLight;
    });

    // Init HUD total
    const hudTotal = document.getElementById('hud-total');
    if (hudTotal) hudTotal.textContent = TOTAL_CONDOMS;
}

// ── Interruttore ─────────────────────────────────────────────────────────────
function toggleRoomLight() {
    state.lightIsOn = !state.lightIsOn;
    const btn     = document.getElementById('light-switch');
    const wrapper = document.getElementById('game-canvas-container').parentElement;
    if (state.audioEnabled) audioEngine.playSwitchClick();

    if (state.lightIsOn) {
        btn.classList.add('on');
        wrapper.classList.remove('dark-mode');
        gsap.to(lightAnim, {
            t: 1, duration: 0.8, ease: 'power2.out',
            onUpdate() {
                const v = lightAnim.t;
                ambientLight.intensity = 0.55 * v;
                sunLight.intensity     = 3.5  * v;
                fillLight.intensity    = 1.8  * v;
                neonAccent.intensity   = 0.3  * v;
            },
        });
        // Hide all pack glows + spegni luci puntuali quando la luce torna
        condomPacks.forEach(p => {
            p.material.emissive.set('#000000');
            p.material.emissiveIntensity = 0;
            if (p.userData.ptLight) p.userData.ptLight.intensity = 0;
        });
        glowSpheres.forEach(g => { g.material.opacity = 0; });
        overlayCtx.clearRect(0, 0, gameWidth, gameHeight);
        // Hide HUD
        const hud = document.getElementById('game-hud');
        if (hud) hud.classList.add('hidden');
    } else {
        btn.classList.remove('on');
        wrapper.classList.add('dark-mode');
        gsap.to(lightAnim, {
            t: 0, duration: 0.5, ease: 'power2.in',
            onUpdate() {
                const v = lightAnim.t;
                ambientLight.intensity = 0.55 * v;
                sunLight.intensity     = 3.5  * v;
                fillLight.intensity    = 1.8  * v;
                neonAccent.intensity   = 0.3  * v;
            },
        });
        drawFlashlightMask();
        // Accendi emissione base + luci puntuali su tutti i pack (neon glow nel buio)
        condomPacks.forEach((p, i) => {
            const c = new THREE.Color(p.userData.neonColor || '#00ffff');
            p.material.emissive.copy(c);
            p.material.emissiveIntensity = 1.2;
            glowSpheres[i].material.color.copy(c);
            glowSpheres[i].material.opacity = 0.18;
            if (p.userData.ptLight) p.userData.ptLight.intensity = 2.5;
        });
        // Show HUD (only if game not yet fully completed)
        if (!state.gameCompleted) {
            const hud = document.getElementById('game-hud');
            if (hud) hud.classList.remove('hidden');
        }
    }
}

// ── Mouse / touch move ────────────────────────────────────────────────────────
function onGameMouseMove(e) {
    const rect = gameContainer.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
    flashlightPos.x = mousePos.x;
    flashlightPos.y = mousePos.y;

    // Drag-to-look
    if (camLook.isDragging) {
        const dx = e.clientX - camLook.lastX;
        const dy = e.clientY - camLook.lastY;
        camLook.lastX = e.clientX;
        camLook.lastY = e.clientY;
        camLook.yaw   -= dx * camLook.sensitivity;
        camLook.pitch  = Math.max(-1.1, Math.min(1.1, camLook.pitch + dy * camLook.sensitivity));
        _applyCameraLook();
    }

    if (!camLook.isDragging) checkRaycastTarget(e.clientX, e.clientY, rect);
}

function onGameTouchMove(e) {
    if (e.touches.length === 0) return;
    const t    = e.touches[0];
    const rect = gameContainer.getBoundingClientRect();
    mousePos.x = t.clientX - rect.left;
    mousePos.y = t.clientY - rect.top;
    flashlightPos.x = mousePos.x;
    flashlightPos.y = mousePos.y;

    if (camLook.isDragging) {
        const dx = t.clientX - camLook.lastX;
        const dy = t.clientY - camLook.lastY;
        camLook.lastX = t.clientX;
        camLook.lastY = t.clientY;
        camLook.yaw   -= dx * camLook.sensitivity;
        camLook.pitch  = Math.max(-1.1, Math.min(1.1, camLook.pitch + dy * camLook.sensitivity));
        _applyCameraLook();
    }

    checkRaycastTarget(t.clientX, t.clientY, rect);
}

// Disegna la maschera nera con cutout circolare
// Proietta un punto 3D in coordinate 2D del canvas
function _projectToScreen(pos3d) {
    const v = pos3d.clone().project(gameCamera);
    return {
        x: (v.x *  0.5 + 0.5) * gameWidth,
        y: (v.y * -0.5 + 0.5) * gameHeight,
        behind: v.z > 1, // fuori dalla vista
    };
}

function drawFlashlightMask() {
    if (state.lightIsOn) return;

    overlayCtx.clearRect(0, 0, gameWidth, gameHeight);

    // Sfondo nero coprente
    overlayCtx.fillStyle = 'rgba(2, 2, 4, 0.97)';
    overlayCtx.fillRect(0, 0, gameWidth, gameHeight);

    overlayCtx.globalCompositeOperation = 'destination-out';

    // ── Torcia (flashlight) seguita dal mouse ─────────────────────────────────
    const radius = 200;
    const grad = overlayCtx.createRadialGradient(
        flashlightPos.x, flashlightPos.y, 0,
        flashlightPos.x, flashlightPos.y, radius
    );
    grad.addColorStop(0,    'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(1,    'rgba(255, 255, 255, 0)');
    overlayCtx.fillStyle = grad;
    overlayCtx.beginPath();
    overlayCtx.arc(flashlightPos.x, flashlightPos.y, radius, 0, Math.PI * 2);
    overlayCtx.fill();

    // ── Aloni neon per ogni condom (visibili nel buio) ────────────────────────
    condomPacks.forEach((p, i) => {
        const sp = _projectToScreen(p.position);
        if (sp.behind) return; // dietro la camera, non visibile
        // Fuori dall'area visibile del canvas
        if (sp.x < -80 || sp.x > gameWidth + 80 || sp.y < -80 || sp.y > gameHeight + 80) return;

        const pulse = p.material.emissiveIntensity; // usa il valore pulsante già calcolato
        const haloR = 80 + pulse * 35;
        const col = p.userData.neonColor || '#00ffff';

        // Foro nell'overlay: abbastanza grande da mostrare il pack e il suo alone colorato
        const halo = overlayCtx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, haloR);
        halo.addColorStop(0,    `rgba(255,255,255,${0.82 + pulse * 0.15})`);
        halo.addColorStop(0.4,  `rgba(255,255,255,${0.55 + pulse * 0.1})`);
        halo.addColorStop(0.75, `rgba(255,255,255,${0.20})`);
        halo.addColorStop(1,    'rgba(255,255,255,0)');
        overlayCtx.fillStyle = halo;
        overlayCtx.beginPath();
        overlayCtx.arc(sp.x, sp.y, haloR, 0, Math.PI * 2);
        overlayCtx.fill();
    });

    overlayCtx.globalCompositeOperation = 'source-over';

    // Griglia olografica sottile
    overlayCtx.strokeStyle = 'rgba(0, 255, 255, 0.025)';
    overlayCtx.lineWidth = 1;
    for (let x = 0; x < gameWidth; x += 30) {
        overlayCtx.beginPath(); overlayCtx.moveTo(x, 0); overlayCtx.lineTo(x, gameHeight); overlayCtx.stroke();
    }
    for (let y = 0; y < gameHeight; y += 30) {
        overlayCtx.beginPath(); overlayCtx.moveTo(0, y); overlayCtx.lineTo(gameWidth, y); overlayCtx.stroke();
    }
}

// Controlla se la torcia illumina il profilattico
const raycaster = new THREE.Raycaster();
const mouseNormalized = new THREE.Vector2();

function checkRaycastTarget(clientX, clientY, rect) {
    if (state.lightIsOn || state.gameCompleted || condomPacks.length === 0) return;

    mouseNormalized.x = ((clientX - rect.left) / gameWidth) * 2 - 1;
    mouseNormalized.y = -((clientY - rect.top) / gameHeight) * 2 + 1;

    raycaster.setFromCamera(mouseNormalized, gameCamera);
    const intersects = raycaster.intersectObjects(condomPacks);

    // Reset tutti i pack all'intensità base (neon di fondo nel buio)
    condomPacks.forEach((p, i) => {
        const c = new THREE.Color(p.userData.neonColor || '#00ffff');
        p.material.emissive.copy(c);
        p.material.emissiveIntensity = 1.2;
        glowSpheres[i].material.color.copy(c);
        glowSpheres[i].material.opacity = 0.18;
    });

    const crosshair = document.getElementById('game-crosshair');
    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const idx = condomPacks.indexOf(hit);
        if (idx !== -1) {
            const packColor = new THREE.Color(hit.userData.neonColor || state.themeColor);
            hit.material.emissive.copy(packColor);
            hit.material.emissiveIntensity = 2.5;
            glowSpheres[idx].material.color.copy(packColor);
            glowSpheres[idx].material.opacity = 0.3 + Math.sin(Date.now() * 0.008) * 0.12;
            if (crosshair) crosshair.classList.add('on-target');
            if (state.audioEnabled && !state.humPlaying) {
                state.humPlaying = true;
                audioEngine.playLightsaberIgnite(state.themeColor);
            }
        }
    } else {
        if (crosshair) crosshair.classList.remove('on-target');
        state.humPlaying = false;
    }
}

function _collectCondom(pack, idx) {
    // Flash the pack before removing
    pack.material.emissiveIntensity = 8.0;
    glowSpheres[idx].material.opacity = 0.9;

    if (state.audioEnabled) audioEngine.playSuccessChime();

    setTimeout(() => {
        if (pack.userData.ptLight) gameScene.remove(pack.userData.ptLight);
        gameScene.remove(pack);
        gameScene.remove(glowSpheres[idx]);
        condomPacks.splice(idx, 1);
        glowSpheres.splice(idx, 1);
    }, 320);

    foundCount++;
    const hudFound = document.getElementById('hud-found');
    if (hudFound) {
        hudFound.textContent = foundCount;
        // Pulse animation
        const hud = document.getElementById('game-hud');
        hud.classList.add('found-flash');
        setTimeout(() => hud.classList.remove('found-flash'), 350);
    }

    if (foundCount >= TOTAL_CONDOMS) {
        // All found! 🎉
        state.gameCompleted = true;
        setTimeout(() => {
            // Re-light the room with neon burst
            gsap.to(lightAnim, {
                t: 0.4, duration: 1.0, ease: 'power2.out',
                onUpdate() {
                    const v = lightAnim.t;
                    ambientLight.intensity = 0.55 * v;
                    sunLight.intensity     = 3.5  * v;
                    fillLight.intensity    = 1.8  * v;
                },
            });
            overlayCtx.clearRect(0, 0, gameWidth, gameHeight);

            const hud = document.getElementById('game-hud');
            if (hud) hud.classList.add('hidden');

            const banner = document.getElementById('game-success-banner');
            if (banner) banner.classList.add('visible');

            state.discountUnlocked = true;
            document.body.classList.add('discount-unlocked');
            applyDiscount();

            // Regalo: aggiungi 1 pacco gratis al carrello
            _addFreePackToCart();
        }, 500);
    }
}

function _addFreePackToCart() {
    // Usa il tema corrente come variante da regalare, fallback a stormtrooper
    const variantKey = state.themeName || 'stormtrooper';
    const safeKey = variantMeta[variantKey] ? variantKey : 'stormtrooper';

    setVariantQty(safeKey, cartQty[safeKey] + 1);
    renderCart();

    // Toast notifica regalo
    const toast = document.createElement('div');
    toast.id = 'free-pack-toast';
    const meta = variantMeta[safeKey];
    toast.innerHTML = `🎁 <strong>1 ${meta.label.split('·')[0].trim()}</strong> aggiunto gratis al carrello!`;
    toast.style.cssText = `
        position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
        background:#0a0a10; border:1px solid ${meta.hex};
        color:#fff; padding:14px 24px; border-radius:8px; z-index:99999;
        font-size:14px; letter-spacing:.04em; text-align:center;
        box-shadow: 0 0 18px ${meta.hex}88;
        animation: toastIn .4s ease;
    `;
    document.body.appendChild(toast);

    // Aggiungi keyframe se non esiste
    if (!document.getElementById('toast-style')) {
        const s = document.createElement('style');
        s.id = 'toast-style';
        s.textContent = `@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`;
        document.head.appendChild(s);
    }

    setTimeout(() => toast.remove(), 4000);
}

function onGameClick(e) {
    if (state.lightIsOn || state.gameCompleted || condomPacks.length === 0) return;

    const rect = gameContainer.getBoundingClientRect();
    mouseNormalized.x = ((e.clientX - rect.left) / gameWidth) * 2 - 1;
    mouseNormalized.y = -((e.clientY - rect.top) / gameHeight) * 2 + 1;

    raycaster.setFromCamera(mouseNormalized, gameCamera);
    const intersects = raycaster.intersectObjects(condomPacks);

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const idx = condomPacks.indexOf(hit);
        if (idx !== -1) _collectCondom(hit, idx);
    }
}

/* ==========================================================================
   PAGINA 4: CONFIGURATORE PRODOTTO 3D (THREE.JS)
   ========================================================================== */
let checkoutScene, checkoutCamera, checkoutRenderer;
let productBox, checkoutAmbientLight, checkoutPointLight;
let checkoutContainerWidth, checkoutContainerHeight;
let ledLines = [];

function initCheckoutSection() {
    const checkoutContainer = document.getElementById('checkout-canvas-container');
    checkoutContainerWidth = checkoutContainer.clientWidth;
    checkoutContainerHeight = checkoutContainer.clientHeight;

    // 1. Setup Scena
    checkoutScene = new THREE.Scene();
    
    // Camera
    checkoutCamera = new THREE.PerspectiveCamera(35, checkoutContainerWidth / checkoutContainerHeight, 0.1, 100);
    checkoutCamera.position.set(0, 0, 4.5);
    
    // Renderer
    checkoutRenderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-checkout-canvas'), antialias: true, alpha: true });
    checkoutRenderer.setSize(checkoutContainerWidth, checkoutContainerHeight);
    checkoutRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Luci
    checkoutAmbientLight = new THREE.AmbientLight('#222233', 0.8);
    checkoutScene.add(checkoutAmbientLight);
    
    checkoutPointLight = new THREE.PointLight(state.themeColor, 4.0, 10);
    checkoutPointLight.position.set(2, 2, 2);
    checkoutScene.add(checkoutPointLight);
    
    const fillLight = new THREE.PointLight('#ffffff', 0.5, 10);
    fillLight.position.set(-2, -1, 1);
    checkoutScene.add(fillLight);

    // 3. Creazione Scatola Durex Neon
    createProductBoxMesh();

    // 4. Orbit Controls (per permettere all'utente di ruotare la scatola)
    const controls = new OrbitControls(checkoutCamera, checkoutRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    // Evita che OrbitControls blocchi lo scroll della pagina
    checkoutRenderer.domElement.addEventListener('wheel', (e) => {
        e.stopImmediatePropagation();
    }, { capture: true, passive: true });

    // 5. Animazione loop
    function checkoutAnimate() {
        requestAnimationFrame(checkoutAnimate);
        
        // Auto rotazione leggera se l'utente non la sta trascinando
        if (!controls.state === -1) {
            productBox.rotation.y += 0.003;
            productBox.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
        } else {
            controls.update();
        }
        
        // Pulsazione linee led neon esterne
        const glowVal = 1.2 + Math.sin(Date.now() * 0.006) * 0.3;
        ledLines.forEach(line => {
            line.material.emissiveIntensity = glowVal;
        });

        checkoutRenderer.render(checkoutScene, checkoutCamera);
    }
    
    checkoutAnimate();

    // Event listeners per selettore di colori configuratore
    const colorButtons = document.querySelectorAll('.color-btn');
    colorButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const hex = btn.getAttribute('data-hex');
            const colorName = btn.getAttribute('data-color');
            updateThemeColors(hex, colorName);
            updateCheckoutBoxColor(hex);
        });
    });

    // Resize
    window.addEventListener('resize', () => {
        if (!checkoutContainer) return;
        checkoutContainerWidth = checkoutContainer.clientWidth;
        checkoutContainerHeight = checkoutContainer.clientHeight;
        
        checkoutCamera.aspect = checkoutContainerWidth / checkoutContainerHeight;
        checkoutCamera.updateProjectionMatrix();
        checkoutRenderer.setSize(checkoutContainerWidth, checkoutContainerHeight);
    });
}

function createProductBoxMesh() {
    productBox = new THREE.Group();
    
    // Corpo della scatola
    const boxGeo = new THREE.BoxGeometry(1.4, 1.4, 0.4);
    
    // Texture procedurale per la scatola in altissima definizione
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Sfondo futuristico scuro
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, 512, 512);
    
    // Texture di sfondo hi-tech
    ctx.strokeStyle = '#0f0f1d';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, 512);
        ctx.moveTo(0, i); ctx.lineTo(512, i);
        ctx.stroke();
    }
    
    // Cornice olografica interna
    ctx.strokeStyle = '#1e1e38';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 452, 452);
    
    // Brand
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px Orbitron';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText('DUREX', 256, 160);
    
    ctx.fillStyle = '#ffe81f'; // Oro Star Wars
    ctx.font = 'bold 22px Orbitron';
    ctx.fillText('✕  STAR WARS  ✕', 256, 220);
    
    // Nome Prodotto
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Orbitron';
    ctx.fillText('NEON PACK', 256, 320);
    
    // Dettagli tecnici
    ctx.fillStyle = '#7a7a9a';
    ctx.font = '500 18px Space Grotesk';
    ctx.fillText('12 CONDOMS  •  Glow In The Dark', 256, 380);
    
    // Logo sci-fi cerchio olografico centrale
    ctx.strokeStyle = '#2d2d54';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 260, 10, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    
    // Materiali per la scatola (lato frontale con logo, lati scuri)
    const sideMaterial = new THREE.MeshStandardMaterial({
        color: '#090912',
        roughness: 0.3,
        metalness: 0.8
    });
    
    const faceMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.25,
        metalness: 0.75
    });
    
    // Array di materiali per le 6 facce del box [destra, sinistra, sopra, sotto, davanti, dietro]
    const materials = [
        sideMaterial, // destra
        sideMaterial, // sinistra
        sideMaterial, // sopra
        sideMaterial, // sotto
        faceMaterial, // davanti
        faceMaterial  // dietro
    ];
    
    const boxMesh = new THREE.Mesh(boxGeo, materials);
    boxMesh.castShadow = true;
    productBox.add(boxMesh);
    
    // Aggiungiamo tubi Led Neon sui lati sinistro e destro della scatola (per simulare spade laser neon)
    const lineGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.35, 8);
    const neonMaterial = new THREE.MeshStandardMaterial({
        color: state.themeColor,
        emissive: new THREE.Color(state.themeColor),
        emissiveIntensity: 1.5,
        roughness: 0.1
    });
    
    const leftLed = new THREE.Mesh(lineGeo, neonMaterial);
    leftLed.position.set(-0.72, 0, 0.21);
    productBox.add(leftLed);
    ledLines.push(leftLed);
    
    const rightLed = leftLed.clone();
    rightLed.position.set(0.72, 0, 0.21);
    productBox.add(rightLed);
    ledLines.push(rightLed);

    checkoutScene.add(productBox);
}

// Aggiorna il colore neon della scatola in 3D
function updateCheckoutBoxColor(hexColor) {
    const newColor = new THREE.Color(hexColor);
    
    // Aggiorna luce pointlight che illumina la confezione
    checkoutPointLight.color.copy(newColor);
    
    // Aggiorna il colore emissivo dei Led
    ledLines.forEach(line => {
        line.material.color.copy(newColor);
        line.material.emissive.copy(newColor);
    });
    
    // Aggiorna il bagliore dello sfondo
    const ambientGlow = document.querySelector('.viewer-ambient-glow');
    if (ambientGlow) {
        ambientGlow.style.backgroundColor = hexColor;
    }
}
