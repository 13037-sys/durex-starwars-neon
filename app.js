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
    themeColor: '#00ffff',
    themeName: 'blue',
    discountUnlocked: false,
    lightIsOn: false,
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
    initGameFullscreen();
});

/* ==========================================================================
   FULLSCREEN SCROLL-LOCK PER IL GIOCO
   ========================================================================== */
function initGameFullscreen() {
    const wrapper     = document.querySelector('.game-viewport-wrapper');
    const exitBtn     = document.getElementById('game-exit-fullscreen');
    const playOverlay = document.getElementById('game-play-overlay');
    const playBtn     = document.getElementById('game-play-btn');
    const ctrlBar     = document.getElementById('game-controls-bar');
    const nextSection = document.getElementById('characters');
    if (!wrapper || !exitBtn || !playBtn) return;

    let isFullscreen = false;
    let gameUnlocked = false;

    function enterFullscreen() {
        if (isFullscreen) return;
        isFullscreen = true;
        playOverlay?.classList.add('hidden');
        if (ctrlBar) ctrlBar.style.display = 'flex';
        wrapper.classList.add('game-fullscreen');
        document.body.style.overflow = 'hidden';
        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });
        requestAnimationFrame(() => requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        }));
    }

    function exitFullscreen() {
        if (!isFullscreen) return;
        isFullscreen = false;
        gameUnlocked = true;
        wrapper.classList.remove('game-fullscreen');
        document.body.style.overflow = '';
        window.removeEventListener('wheel', preventScroll);
        window.removeEventListener('touchmove', preventScroll);
        exitBtn.classList.remove('visible');
        if (ctrlBar) ctrlBar.style.display = 'none';
        playOverlay?.classList.remove('hidden');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        }));
    }

    function preventScroll(e) { e.preventDefault(); }

    // Entra in gioco solo al click del pulsante
    playBtn.addEventListener('click', enterFullscreen);

    // Ridimensiona renderer quando il wrapper cambia dimensione
    if (window.ResizeObserver) {
        new ResizeObserver(() => window.dispatchEvent(new Event('resize'))).observe(wrapper);
    }

    // Sblocca al completamento (mostra "Continua")
    const pollCompletion = setInterval(() => {
        if (state.gameCompleted && isFullscreen) {
            clearInterval(pollCompletion);
            exitBtn.classList.add('visible');
        }
    }, 500);

    // Pulsante "Continua ↓"
    exitBtn.addEventListener('click', () => {
        exitFullscreen();
        setTimeout(() => nextSection?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Bottone ESCI
    document.getElementById('game-quit-btn')?.addEventListener('click', exitFullscreen);

    // Bottone RIAVVIA
    document.getElementById('game-restart-btn')?.addEventListener('click', () => {
        exitBtn.classList.remove('visible');
        document.getElementById('replay-game-btn')?.click();
    });

    // Rigioca dal banner vittoria
    document.getElementById('replay-game-btn')?.addEventListener('click', () => {
        exitBtn.classList.remove('visible');
    });
}

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
    'NEONFORCE20': { amount: 3.00,                        label: 'NEONFORCE20' },
    'NEON10':      { amount: Math.round(PRICE_UNIT*0.10*100)/100, label: 'NEON10' },
    'STARWARS10':  { amount: 1.50,                        label: 'STARWARS10'  },
    'DUREX2026':   { amount: 2.00,                        label: 'DUREX2026'   },
};

// qty per variante: { stormtrooper: 0, grogu: 0, macewindu: 0, darthvader: 0 }
const cartQty = { stormtrooper: 0, grogu: 0, macewindu: 0, darthvader: 0 };

const cartState = {
    discount:    0,
    couponCode:  '',
};

const variantMeta = {
    stormtrooper: { label: 'Stormtrooper · Blu Elettrico', img: 'card_stormtrooper.png', hex: '#0066ff' },
    grogu:        { label: 'Baby Yoda · Verde Fluo',           img: 'card_grogu.png',        hex: '#39ff14' },
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

    // Aggiorna viewer al colore e immagine dominante
    const dominant = cartDominantVariant();
    if (totalQty > 0) {
        const meta = variantMeta[dominant];
        updateThemeColors(meta.hex, dominant);
        updateCheckoutBoxColor(meta.hex);
        updateCheckoutPackImg(dominant, meta.hex);
    }
}

function setVariantQty(variant, qty) {
    cartQty[variant] = Math.max(0, Math.min(99, qty));
    const row = document.querySelector(`.mv-row[data-variant="${variant}"]`);
    if (!row) return;
    row.querySelector('.mv-qty-val').textContent = cartQty[variant];
    row.classList.toggle('has-qty', cartQty[variant] > 0);
    updateCartTotals();

    // Aggiorna immagine pack se questa variante è ora quella dominante
    const dominant = cartDominantVariant();
    const meta = variantMeta[dominant];
    updateCheckoutPackImg(dominant, meta.hex);
    updateThemeColors(meta.hex, dominant);
}

function selectVariant(variant) {
    document.querySelectorAll('.mv-row').forEach(r => {
        r.classList.remove('mv-selected');
        r.style.removeProperty('box-shadow');
        r.style.removeProperty('border-color');
        r.style.removeProperty('background');
    });
    const row = document.querySelector(`.mv-row[data-variant="${variant}"]`);
    const meta = variantMeta[variant];
    if (row) {
        row.classList.add('mv-selected');
        const h = meta.hex;
        row.style.borderColor = h;
        row.style.background = hexToRgba(h, 0.08);
        row.style.boxShadow = [
            `0 0 0 1px ${hexToRgba(h, 0.5)}`,
            `0 0 18px ${hexToRgba(h, 0.45)}`,
            `0 0 45px ${hexToRgba(h, 0.2)}`,
            `inset 0 0 20px ${hexToRgba(h, 0.07)}`
        ].join(', ');
    }
    updateCheckoutPackImg(variant, meta.hex);
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function initUiControls() {
    // ── Multi-variant qty controls ──
    document.querySelectorAll('.mv-row').forEach(row => {
        const variant = row.getAttribute('data-variant');
        row.querySelector('.mv-plus').addEventListener('click', (e) => {
            e.stopPropagation();
            setVariantQty(variant, cartQty[variant] + 1);
        });
        row.querySelector('.mv-minus').addEventListener('click', (e) => {
            e.stopPropagation();
            setVariantQty(variant, cartQty[variant] - 1);
        });
        // Click sulla riga → selezione diretta
        row.addEventListener('click', () => selectVariant(variant));
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
        if (couponInput && !couponInput.disabled) {
            couponInput.value = 'NEON10';
            couponApplyBtn.click();
        }
    });

    // ── Rigioca ──
    document.getElementById('replay-game-btn').addEventListener('click', () => {
        _resetGame();
    });

    if (state.discountUnlocked) applyDiscount();
    updateCartTotals();
}

function applyDiscount() {
    const coupon = VALID_COUPONS['NEON10'];
    cartState.discount   = coupon.amount;
    cartState.couponCode = coupon.label;
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
const TOTAL_CONDOMS = 4;

// Un colore per ogni personaggio: Stormtrooper, Grogu, Mace Windu, Darth Vader
const HUNT_COLORS = ['#00ffff', '#39ff14', '#b026ff', '#ff003c'];
let gameContainer, overlayCanvas, overlayCtx;
let gameWidth, gameHeight;
let ambientLight, uvTorchLight;

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
let roomMeshes    = []; // mesh della stanza per collision detection
let validFloorPts = []; // punti XZ con pavimento confermato (popolato al load)

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
    if (keys.a) move.addScaledVector(right,  MOVE_SPEED * dt);
    if (keys.d) move.addScaledVector(right, -MOVE_SPEED * dt);

    // Collision detection per componente (permette lo scivolamento lungo le pareti)
    const WALL_DIST = 0.45;
    const wallRay   = new THREE.Raycaster();
    wallRay.far     = WALL_DIST;

    const tryMove = (delta) => {
        if (delta.lengthSq() < 1e-8) return;
        const dir = delta.clone().normalize();
        wallRay.set(CAM_POS, dir);
        if (roomMeshes.length > 0 && wallRay.intersectObjects(roomMeshes, false).length > 0) return;
        CAM_POS.add(delta);
    };

    // Prova X e Z separatamente per consentire lo slide
    tryMove(new THREE.Vector3(move.x, 0, 0));
    tryMove(new THREE.Vector3(0, 0, move.z));

    // Fallback: clampa ai bounds esterni
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
        preserveDrawingBuffer: true,
    });
    gameRenderer.setSize(gameWidth, gameHeight);
    gameRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    gameRenderer.shadowMap.enabled  = true;
    gameRenderer.shadowMap.type     = THREE.PCFSoftShadowMap;
    gameRenderer.outputColorSpace   = THREE.SRGBColorSpace;
    gameRenderer.toneMapping        = THREE.LinearToneMapping;
    gameRenderer.toneMappingExposure = 2.5;

    // ── Scena ─────────────────────────────────────────────────────────────────
    gameScene = new THREE.Scene();
    gameScene.background = new THREE.Color('#0d1225');

    // ── Camera first-person ───────────────────────────────────────────────────
    gameCamera = new THREE.PerspectiveCamera(70, gameWidth / gameHeight, 0.05, 60);
    _applyCameraLook();

    // ── Luci stanza imperiale ─────────────────────────────────────────────────
    // Ambiente base freddo-blu
    ambientLight = new THREE.AmbientLight('#8899cc', 0.9);
    gameScene.add(ambientLight);

    // Luce soffitto principale (bianca-fredda)
    const ceilingLight = new THREE.DirectionalLight('#aabbff', 1.2);
    ceilingLight.position.set(0, 8, 2);
    ceilingLight.target.position.set(0, 0, 0);
    gameScene.add(ceilingLight);
    gameScene.add(ceilingLight.target);

    // Luce di riempimento da dietro camera (evita zone completamente nere)
    const fillLight = new THREE.DirectionalLight('#334466', 0.5);
    fillLight.position.set(0, 2, 10);
    gameScene.add(fillLight);

    // Luce UV che segue il mouse in 3D
    uvTorchLight = new THREE.PointLight('#9933ff', 0, 8);
    uvTorchLight.position.set(0, 1.5, 0);
    gameScene.add(uvTorchLight);

    // ── Carica stanza dal file originale ──────────────────────────────────────
    const roomLoader = new GLTFLoader();
    roomLoader.load(
        'room_starwars.glb',
        gltf => {
            const room = gltf.scene;
            const box  = new THREE.Box3().setFromObject(room);
            const sz   = box.getSize(new THREE.Vector3());
            const ctr  = box.getCenter(new THREE.Vector3());

            // Scala in base all'altezza (Y) per avere ~3 unità di altezza percorribile
            const scale = 3.0 / Math.max(sz.y, 0.01);
            room.scale.setScalar(scale);
            room.position.set(-ctr.x * scale, 0, -ctr.z * scale);
            const box2 = new THREE.Box3().setFromObject(room);
            room.position.y -= box2.min.y;

            room.traverse(child => {
                if (child.isMesh) {
                    child.castShadow    = true;
                    child.receiveShadow = true;
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => { m.side = THREE.DoubleSide; });
                    } else if (child.material) {
                        child.material.side = THREE.DoubleSide;
                    }
                    roomMeshes.push(child);
                }
            });
            gameScene.add(room);

            const box3  = new THREE.Box3().setFromObject(room);
            const cent3 = box3.getCenter(new THREE.Vector3());

            // Soffitto: piano orizzontale all'altezza max della stanza
            const ceilW = box3.max.x - box3.min.x;
            const ceilD = box3.max.z - box3.min.z;
            const ceilGeo = new THREE.PlaneGeometry(ceilW, ceilD);
            const ceilMat = new THREE.MeshStandardMaterial({
                color: 0x0a0c14,
                roughness: 0.9,
                metalness: 0.1,
                side: THREE.DoubleSide,
            });
            const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.set(cent3.x, box3.max.y, cent3.z);
            ceiling.receiveShadow = true;
            gameScene.add(ceiling);
            roomMeshes.push(ceiling);

            roomBounds.copy(box3);
            roomBounds.min.x += 0.6; roomBounds.min.z += 0.6;
            roomBounds.max.x -= 0.6; roomBounds.max.z -= 0.6;

            // Scansione griglia per trovare tutti i punti con pavimento valido
            {
                const scanRay = new THREE.Raycaster();
                const STEP = 0.6;
                validFloorPts = [];
                for (let sx = roomBounds.min.x + 0.3; sx <= roomBounds.max.x - 0.3; sx += STEP) {
                    for (let sz = roomBounds.min.z + 0.3; sz <= roomBounds.max.z - 0.3; sz += STEP) {
                        scanRay.set(new THREE.Vector3(sx, roomBounds.max.y + 0.5, sz), new THREE.Vector3(0, -1, 0));
                        const hits = scanRay.intersectObjects(roomMeshes, false);
                        for (const h of hits) {
                            if (h.point.y < roomBounds.max.y - 0.1) {
                                validFloorPts.push({ x: sx, z: sz, y: h.point.y });
                                break;
                            }
                        }
                    }
                }
            }

            // Camera: posiziona al primo punto valido vicino all'ingresso (min Z)
            let startZ = cent3.z;
            if (validFloorPts.length > 0) {
                const frontPts = validFloorPts.slice().sort((a, b) => a.z - b.z);
                const ref = frontPts[Math.floor(frontPts.length * 0.15)]; // 15% dal lato min Z
                startZ = ref.z + 0.5;
                CAM_POS.set(cent3.x, ref.y + 1.65, startZ);
            } else {
                CAM_POS.set(cent3.x, 1.65, startZ);
            }
            camLook.yaw   = 0;
            camLook.pitch = -0.08;
            _applyCameraLook();

            _spawnCondoms(cent3, startZ, null);
            _hideLoadingHint();
        },
        undefined,
        err => {
            console.warn('room_starwars.glb load error, fallback procedurale:', err);
            _buildStarWarsRoom();
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

    // ── Cursore torcia UV ──────────────────────────────────────────────────────
    gameContainer.style.cursor = 'none';

    // ── WASD keyboard input ───────────────────────────────────────────────────
    const isGameVisible = () => {
        const rect = gameContainer.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4;
    };
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const inGame = isGameVisible();
        switch (e.code) {
            case 'KeyW': case 'ArrowUp':    keys.w = true; if (inGame) e.preventDefault(); break;
            case 'KeyS': case 'ArrowDown':  keys.s = true; if (inGame) e.preventDefault(); break;
            case 'KeyA': case 'ArrowLeft':  keys.a = true; if (inGame) e.preventDefault(); break;
            case 'KeyD': case 'ArrowRight': keys.d = true; if (inGame) e.preventDefault(); break;
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

    // ── D-pad on-screen ───────────────────────────────────────────────────────
    const keyMap = { ArrowUp: 'w', ArrowDown: 's', ArrowLeft: 'a', ArrowRight: 'd' };
    document.querySelectorAll('.dpad-btn[data-key]').forEach(btn => {
        const k = keyMap[btn.dataset.key];
        if (!k) return;
        const press   = () => { keys[k] = true;  btn.classList.add('pressed'); };
        const release = () => { keys[k] = false; btn.classList.remove('pressed'); };
        btn.addEventListener('mousedown',  press);
        btn.addEventListener('touchstart', press,   { passive: true });
        btn.addEventListener('mouseup',    release);
        btn.addEventListener('mouseleave', release);
        btn.addEventListener('touchend',   release);
        btn.addEventListener('touchcancel',release);
    });

    // ── Render loop ───────────────────────────────────────────────────────────
    (function gameAnimate() {
        requestAnimationFrame(gameAnimate);
        _tickMovement();
        const t = Date.now() * 0.001;
        condomPacks.forEach((p, i) => {
            p.rotation.y += 0.007;
            const pMats = Array.isArray(p.material) ? p.material : [p.material];
            // Illuminazione emissiva proporzionale alla vicinanza della torcia UV
            let glow = 0;
            if (uvTorchLight && uvTorchLight.intensity > 0) {
                const dist = uvTorchLight.position.distanceTo(p.position);
                glow = Math.max(0, 1 - dist / 2.2);  // raggio 2.2 unità
                glow = glow * glow * 0.35;            // curva morbida, max 0.35
            }
            const neonCol = p.userData.neonColor || '#00ffff';
            pMats.forEach(m => {
                if (m.emissive) { m.emissive.set(neonCol); m.emissiveIntensity = glow; }
            });
            if (glowSpheres[i]) glowSpheres[i].material.opacity = 0;
            if (p.userData.ptLight) p.userData.ptLight.intensity = 0;
        });
        gameRenderer.render(gameScene, gameCamera);
        drawFlashlightMask();
    })();

    // ── Resize ────────────────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
        if (!gameContainer) return;
        // Usa il wrapper (che può essere fullscreen) come riferimento dimensioni
        const ref = gameContainer.parentElement || gameContainer;
        gameWidth  = ref.clientWidth  || window.innerWidth;
        gameHeight = ref.clientHeight || window.innerHeight;
        overlayCanvas.width  = gameWidth;
        overlayCanvas.height = gameHeight;
        gameCamera.aspect = gameWidth / gameHeight;
        gameCamera.updateProjectionMatrix();
        gameRenderer.setSize(gameWidth, gameHeight);
        if (!state.lightIsOn) drawFlashlightMask();
    });
}



function _buildStarWarsRoom() {
    const W = 10, H = 4, D = 18;

    // ── Texture helper ────────────────────────────────────────────────────────
    function makeTex(draw, size = 512) {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        draw(c.getContext('2d'), size);
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        return t;
    }

    // Parete metallica imperiale: pannelli scuri con giunture
    const wallTex = makeTex((ctx, s) => {
        ctx.fillStyle = '#0d0f14';
        ctx.fillRect(0, 0, s, s);
        // pannelli verticali
        ctx.strokeStyle = '#1e2530';
        ctx.lineWidth = 3;
        for (let x = 0; x < s; x += s / 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke(); }
        for (let y = 0; y < s; y += s / 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke(); }
        // rivet dots
        ctx.fillStyle = '#2a3040';
        for (let x = s/8; x < s; x += s/4) for (let y = s/12; y < s; y += s/6) {
            ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
        }
    });
    wallTex.repeat.set(2, 1);

    // Pavimento grigliato
    const floorTex = makeTex((ctx, s) => {
        ctx.fillStyle = '#080a0d';
        ctx.fillRect(0, 0, s, s);
        ctx.strokeStyle = '#1a2030';
        ctx.lineWidth = 2;
        const g = s / 16;
        for (let i = 0; i <= s; i += g) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
        }
        // effetto griglia metallica: piccoli fori scuri
        ctx.fillStyle = '#04060a';
        for (let x = g/2; x < s; x += g) for (let y = g/2; y < s; y += g) {
            ctx.fillRect(x - g*0.3, y - g*0.3, g*0.6, g*0.6);
        }
    });
    floorTex.repeat.set(4, 6);

    // Soffitto con strisce luce
    const ceilTex = makeTex((ctx, s) => {
        ctx.fillStyle = '#0a0c10';
        ctx.fillRect(0, 0, s, s);
        ctx.fillStyle = '#12182a';
        ctx.fillRect(s*0.1, s*0.4, s*0.8, s*0.08);
        ctx.fillRect(s*0.1, s*0.55, s*0.8, s*0.08);
    });
    ceilTex.repeat.set(1, 3);

    const wallMat  = new THREE.MeshStandardMaterial({ map: wallTex,  roughness: 0.7, metalness: 0.4, side: THREE.BackSide });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.5, metalness: 0.6, side: THREE.BackSide });
    const ceilMat  = new THREE.MeshStandardMaterial({ map: ceilTex,  roughness: 0.8, metalness: 0.3, side: THREE.BackSide });

    const room = new THREE.Mesh(
        new THREE.BoxGeometry(W, H, D),
        [wallMat, wallMat, ceilMat, floorMat, wallMat, wallMat]
    );
    room.position.set(0, H / 2, 0);
    room.receiveShadow = true;
    gameScene.add(room);

    // ── Strisce di luce rossa emergenza (floor level) ─────────────────────────
    const stripMat = new THREE.MeshBasicMaterial({ color: '#3a0505' });
    [[0, 0, -D/2+0.05, 0], [0, 0, D/2-0.05, Math.PI], [-W/2+0.05, 0, 0, Math.PI/2], [W/2-0.05, 0, 0, -Math.PI/2]].forEach(([x,,z, ry]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(ry === 0 || ry === Math.PI ? W : D, 0.06, 0.04), stripMat);
        m.position.set(x, 0.03, z); m.rotation.y = ry; gameScene.add(m);
    });

    // ── Pannello di controllo sul fondo ───────────────────────────────────────
    const panelMat = new THREE.MeshStandardMaterial({ color: '#0e1420', roughness: 0.3, metalness: 0.8 });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 0.12), panelMat);
    panel.position.set(0, 1.4, -D/2 + 0.2);
    gameScene.add(panel);
    // indicatori led sul pannello
    ['#ff003c','#39ff14','#00ffff','#b026ff','#ff6600','#39ff14'].forEach((col, i) => {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02),
            new THREE.MeshBasicMaterial({ color: col }));
        led.position.set(-0.7 + i * 0.28, 1.55, -D/2 + 0.27);
        gameScene.add(led);
        // luce puntuale dal led
        const l = new THREE.PointLight(col, 0.4, 1.5);
        l.position.copy(led.position);
        gameScene.add(l);
    });

    // ── Colonne laterali (piloni imperiali) ───────────────────────────────────
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#111620', roughness: 0.6, metalness: 0.5 });
    [-D/2 + 3, -D/2 + 8, -D/2 + 13].forEach(z => {
        [-W/2 + 0.3, W/2 - 0.3].forEach(x => {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, H, 0.35), pillarMat);
            p.position.set(x, H/2, z);
            gameScene.add(p);
        });
    });

    // ── Luce ambiente debolissima rossa-imperiale ─────────────────────────────
    const redAcc = new THREE.PointLight('#200000', 1.5, 12);
    redAcc.position.set(0, 0.5, 4);
    gameScene.add(redAcc);

    // Aggiorna roomBounds per la stanza
    roomBounds.set(
        new THREE.Vector3(-W/2 + 0.5, 0, -D/2 + 0.5),
        new THREE.Vector3( W/2 - 0.5, H,  D/2 - 0.5)
    );

    // Posiziona camera all'ingresso guardando in fondo
    CAM_POS.set(0, 1.65, D/2 - 1.5);
    _applyCameraLook();
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
// Mappa variante → colore emissivo neon per il glow UV
const VARIANT_KEYS  = ['stormtrooper', 'grogu', 'macewindu', 'darthvader'];
const VARIANT_GLOW  = { stormtrooper: '#00cfff', grogu: '#39ff14', macewindu: '#b026ff', darthvader: '#ff003c' };
const _packTexCache = {};
const _texLoader    = new THREE.TextureLoader();

function _getPackTex(variantKey) {
    if (!_packTexCache[variantKey]) {
        _packTexCache[variantKey] = _texLoader.load(`pack_${variantKey}.png`);
    }
    return _packTexCache[variantKey];
}

// Materiali multi-face per BoxGeometry: +X,-X,+Y,-Y,+Z(front),-Z(back)
function _buildPackMaterials(variantKey) {
    // MeshStandardMaterial: risponde alla torcia UV (PointLight), buio senza luce
    const front = new THREE.MeshStandardMaterial({
        map:       _getPackTex(variantKey),
        roughness: 0.3,
        metalness: 0.5,
        emissiveIntensity: 0,
    });
    const side = new THREE.MeshStandardMaterial({
        color:     0x111118,
        roughness: 0.7,
        metalness: 0.3,
        emissiveIntensity: 0,
    });
    // BoxGeometry face order: right, left, top, bottom, front, back
    return [side, side, side, side, front, side];
}

function _resetGame(center) {
    // Rimuove pack rimasti in scena
    condomPacks.forEach(p => gameScene.remove(p));
    condomPacks.length = 0;
    foundCount = 0;
    state.gameCompleted = false;

    const hudFound = document.getElementById('hud-found');
    if (hudFound) hudFound.textContent = '0';
    const hud = document.getElementById('game-hud');
    if (hud) hud.classList.remove('hidden');
    const banner = document.getElementById('game-success-banner');
    if (banner) { banner.classList.remove('visible'); banner.classList.add('hidden'); }

    _spawnCondoms(null, CAM_POS.z, roomBounds.max.z);
}

function _spawnCondoms(center, camStartZ, roomMaxZ) {
    const b = roomBounds;

    // Centro e margine sicuro dai muri (0.4 unità di padding)
    const PAD = 0.4;
    const minX = b.min.x + PAD, maxX = b.max.x - PAD;
    const minZ = b.min.z + PAD, maxZ = b.max.z - PAD;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const hw = (maxX - minX) / 2;
    const hz = (maxZ - minZ) / 2;
    const clampX = x => Math.max(minX, Math.min(maxX, x));
    const clampZ = z => Math.max(minZ, Math.min(maxZ, z));
    const rnd = (a, b) => a + Math.random() * (b - a);

    // Raycast verso il basso → altezza pavimento reale
    const floorRay = new THREE.Raycaster();
    const _floorY = (x, z) => {
        floorRay.set(new THREE.Vector3(x, roomBounds.max.y + 0.5, z), new THREE.Vector3(0, -1, 0));
        const hits = floorRay.intersectObjects(roomMeshes, false);
        for (const h of hits) {
            if (h.point.y < roomBounds.max.y - 0.1) return h.point.y;
        }
        return null; // nessun pavimento trovato → posizione non valida
    };

    // Spawn davanti alla camera in range Z confermato con pavimento
    // Usa i punti floor validi scansionati al caricamento
    const camZ = camStartZ ?? (cz - hz * 0.3);
    let pool = validFloorPts.filter(p => p.z >= camZ - 0.5);
    if (pool.length < TOTAL_CONDOMS) pool = validFloorPts.length >= TOTAL_CONDOMS ? validFloorPts : pool;

    pool.sort((a, b) => a.z - b.z);
    const zMin2 = pool[0]?.z ?? cz - hz;
    const zMax2 = pool[pool.length - 1]?.z ?? cz + hz;

    // Dividi in 4 zone, piazza ogni pack nel 20% centrale della propria zona
    // così ogni pack è lontano dagli altri almeno (zRange/4 * 0.6) unità
    const candidates = [];
    const MIN_DIST = 2.5; // distanza minima tra pack (XZ)
    for (let zone = 0; zone < TOTAL_CONDOMS; zone++) {
        const zLo = zMin2 + (zMax2 - zMin2) * (zone / TOTAL_CONDOMS);
        const zHi = zMin2 + (zMax2 - zMin2) * ((zone + 1) / TOTAL_CONDOMS);
        // Usa solo il 60% centrale della zona per massimizzare la separazione tra zone
        const zLoInner = zLo + (zHi - zLo) * 0.2;
        const zHiInner = zLo + (zHi - zLo) * 0.8;
        const inZone = pool.filter(p => p.z >= zLoInner && p.z < zHiInner);
        const fallback = pool.filter(p => p.z >= zLo && p.z < zHi);
        const bucket = inZone.length > 0 ? inZone : (fallback.length > 0 ? fallback : pool);

        // Prova fino a 20 candidati e scegli quello più lontano dai già scelti
        let best = null, bestDist = -1;
        const tries = Math.min(20, bucket.length);
        const shuffled = bucket.slice().sort(() => Math.random() - 0.5);
        for (let t = 0; t < tries; t++) {
            const pt = shuffled[t];
            let minD = Infinity;
            for (const prev of candidates) {
                const dx = pt.x - prev.x, dz = pt.z - prev.z;
                minD = Math.min(minD, Math.sqrt(dx*dx + dz*dz));
            }
            if (minD > bestDist) { bestDist = minD; best = pt; }
        }
        if (!best) best = bucket[Math.floor(Math.random() * bucket.length)];
        candidates.push({ x: best.x, z: best.z, y: best.y, ry: rnd(0, Math.PI * 2) });
    }

    const spots = candidates;

    // Shuffle varianti per assegnarne una diversa per ogni partita
    const shuffledVariants = [...VARIANT_KEYS].sort(() => Math.random() - 0.5);

    spots.forEach((spot, i) => {
        const variantKey = shuffledVariants[i % shuffledVariants.length];
        const glowColor  = VARIANT_GLOW[variantKey];
        const geo  = new THREE.BoxGeometry(0.22, 0.28, 0.06);
        const mats = _buildPackMaterials(variantKey);
        const pack = new THREE.Mesh(geo, mats);
        // Posa il pacco esattamente sul pavimento rilevato + metà altezza del box
        pack.position.set(spot.x, spot.y + 0.14, spot.z);
        pack.rotation.y = spot.ry;
        pack.castShadow = true;
        pack.userData.neonColor  = glowColor;
        pack.userData.variantKey = variantKey;
        gameScene.add(pack);
        condomPacks.push(pack);

        const glowMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(glowColor), transparent: true,
            opacity: 0, blending: THREE.AdditiveBlending, side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), glowMat);
        glow.position.copy(pack.position);
        gameScene.add(glow);
        glowSpheres.push(glow);

        const ptLight = new THREE.PointLight(glowColor, 0, 3.5);
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
            const ms = Array.isArray(p.material) ? p.material : [p.material];
            ms.forEach(m => { if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 0; });
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
        condomPacks.forEach(p => {
            const mats = Array.isArray(p.material) ? p.material : [p.material];
            mats.forEach(m => { if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 0; });
            if (p.userData.ptLight) p.userData.ptLight.intensity = 0;
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

    // Muovi la luce UV 3D: ray vs piano orizzontale a Y=1.2
    if (uvTorchLight) {
        const nx = (mousePos.x / gameWidth) * 2 - 1;
        const ny = -(mousePos.y / gameHeight) * 2 + 1;
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(nx, ny), gameCamera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.2);
        const target = new THREE.Vector3();
        ray.ray.intersectPlane(plane, target);
        if (target) uvTorchLight.position.copy(target);
        uvTorchLight.intensity = 3.5;
    }

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

    if (uvTorchLight) {
        const nx = (mousePos.x / gameWidth) * 2 - 1;
        const ny = -(mousePos.y / gameHeight) * 2 + 1;
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(nx, ny), gameCamera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.2);
        const target = new THREE.Vector3();
        ray.ray.intersectPlane(plane, target);
        if (target) uvTorchLight.position.copy(target);
        uvTorchLight.intensity = 3.5;
    }

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
    overlayCtx.clearRect(0, 0, gameWidth, gameHeight);

    if (flashlightPos.x < 0) return; // mouse non ancora entrato

    const radius = 190;

    // ── Tinta UV viola sul cono ───────────────────────────────────────────────
    overlayCtx.globalCompositeOperation = 'source-over';
    const uvTint = overlayCtx.createRadialGradient(
        flashlightPos.x, flashlightPos.y, 0,
        flashlightPos.x, flashlightPos.y, radius
    );
    uvTint.addColorStop(0,   'rgba(120, 0, 220, 0.22)');
    uvTint.addColorStop(0.5, 'rgba(80, 0, 160, 0.10)');
    uvTint.addColorStop(1,   'rgba(40, 0, 90, 0)');
    overlayCtx.fillStyle = uvTint;
    overlayCtx.beginPath();
    overlayCtx.arc(flashlightPos.x, flashlightPos.y, radius, 0, Math.PI * 2);
    overlayCtx.fill();

    // ── Cerchio torcia UV (bordo viola) ───────────────────────────────────────
    overlayCtx.strokeStyle = 'rgba(160, 0, 255, 0.45)';
    overlayCtx.lineWidth = 1.5;
    overlayCtx.beginPath();
    overlayCtx.arc(flashlightPos.x, flashlightPos.y, radius * 0.9, 0, Math.PI * 2);
    overlayCtx.stroke();

    // ── Punto centrale (mirino torcia) ────────────────────────────────────────
    overlayCtx.fillStyle = 'rgba(200, 100, 255, 0.7)';
    overlayCtx.beginPath();
    overlayCtx.arc(flashlightPos.x, flashlightPos.y, 3, 0, Math.PI * 2);
    overlayCtx.fill();

    // ── Griglia UV sottile ────────────────────────────────────────────────────
    overlayCtx.strokeStyle = 'rgba(100, 0, 200, 0.02)';
    overlayCtx.lineWidth = 1;
    for (let x = 0; x < gameWidth; x += 32) {
        overlayCtx.beginPath(); overlayCtx.moveTo(x, 0); overlayCtx.lineTo(x, gameHeight); overlayCtx.stroke();
    }
    for (let y = 0; y < gameHeight; y += 32) {
        overlayCtx.beginPath(); overlayCtx.moveTo(0, y); overlayCtx.lineTo(gameWidth, y); overlayCtx.stroke();
    }
}

// Controlla se la torcia illumina il profilattico
const raycaster = new THREE.Raycaster();
const mouseNormalized = new THREE.Vector2();

const TORCH_RADIUS = 80;

function checkRaycastTarget(clientX, clientY, rect) {
    if (state.gameCompleted || condomPacks.length === 0) return;

    mouseNormalized.x = ((clientX - rect.left) / gameWidth) * 2 - 1;
    mouseNormalized.y = -((clientY - rect.top) / gameHeight) * 2 + 1;

    // ── Raycaster: puntamento diretto → colleziona pack ──────────────────────
    raycaster.setFromCamera(mouseNormalized, gameCamera);
    const intersects = raycaster.intersectObjects(condomPacks);
    const crosshair = document.getElementById('game-crosshair');

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (condomPacks.indexOf(hit) !== -1) {
            if (crosshair) crosshair.classList.add('on-target');
        }
    } else {
        if (crosshair) crosshair.classList.remove('on-target');
    }
}

function _collectCondom(pack, idx) {
    // Flash the pack before removing
    const _cm = Array.isArray(pack.material) ? pack.material : [pack.material];
    _cm.forEach(m => { if (m.emissive) { m.emissive.set('#ffffff'); m.emissiveIntensity = 2.0; } });
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
            if (banner) {
                banner.classList.remove('hidden');
                banner.classList.add('visible');
            }

            state.discountUnlocked = true;
            document.body.classList.add('discount-unlocked');
            applyDiscount(); // applica 10% al carrello automaticamente
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
    if (state.gameCompleted || condomPacks.length === 0) return;

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
    // Se il canvas 3D non esiste (sostituito da img), mostra subito il pack di default
    if (!document.getElementById('three-checkout-canvas')) {
        updateCheckoutPackImg('stormtrooper', variantMeta.stormtrooper.hex);
        return;
    }

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
const _packV = Date.now();
const packImgMap = {
    stormtrooper: `pack_stormtrooper.png?v=${_packV}`,
    grogu:        `pack_grogu.png?v=${_packV}`,
    macewindu:    `pack_macewindu.png?v=${_packV}`,
    darthvader:   `pack_darthvader.png?v=${_packV}`,
};

function updateCheckoutPackImg(variant, hexColor) {
    const img = document.getElementById('checkout-pack-img');
    if (!img) return;
    const src = packImgMap[variant];
    if (!src || img.src.endsWith(src)) return;
    img.classList.add('switching');
    setTimeout(() => {
        img.src = src;
        img.style.removeProperty('filter');
        img.closest('.checkout-img-viewer')?.style.setProperty('--theme-neon', hexColor);
        img.classList.remove('switching');
    }, 300);
}

function updateCheckoutBoxColor(hexColor) {
    if (!checkoutPointLight) return;
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
