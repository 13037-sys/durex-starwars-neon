/* ==========================================================================
   QUIZ PERSONALITÀ — DUREX x STAR WARS: NEON COLLECTION
   ========================================================================== */

// ─────────────────────────────────────────────────
// DATI: PERSONAGGI
// Personalizza qui i profili. Ogni tratto è 0-100.
// ─────────────────────────────────────────────────
const CHARACTERS = [
  {
    id: 'stormtrooper',
    nome: 'STORMTROOPER',
    sottotitolo: 'Neon Blu · Blu Elettrico',
    descrizione: 'Concentrato sull\'azione pura e sulla resistenza fisica. Per chi punta dritto all\'obiettivo, garantendo la massima protezione della galassia. Che la prestazione sia con te.',
    immagine: 'char_stormtrooper.png',
    colore: 'hsl(180, 100%, 50%)',
    coloreHsl: '180, 100%, 50%',
    tratti: {
      'Potenza':     85,
      'Precisione':  90,
      'Resistenza':  75,
      'Simpatia':    40,
      'Follia':      30,
    }
  },
  {
    id: 'grogu',
    nome: 'GROGU',
    sottotitolo: 'Neon Verde · Verde Fluo',
    descrizione: 'Sembra innocuo e tenero, ma la sua Forza è immensa. Perfetto per chi vuole esplorare l\'intimità con dolcezza, ma con sorprese che lasceranno a bocca aperta. Questa è la via.',
    immagine: 'char_grogu.png',
    colore: 'hsl(120, 100%, 54%)',
    coloreHsl: '120, 100%, 54%',
    tratti: {
      'Potenza':     55,
      'Precisione':  60,
      'Resistenza':  50,
      'Simpatia':    95,
      'Follia':      70,
    }
  },
  {
    id: 'macewindu',
    nome: 'MACE WINDU',
    sottotitolo: 'Neon Viola · Viola Profondo',
    descrizione: 'Unisce la dolcezza del Lato Chiaro all\'audacia del Lato Oscuro. Dedicato a chi non vuole scegliere tra romanticismo e trasgressione. Equilibrio, audacia, eleganza.',
    immagine: 'char_macewindu.png',
    colore: 'hsl(282, 100%, 58%)',
    coloreHsl: '282, 100%, 58%',
    tratti: {
      'Potenza':     80,
      'Precisione':  85,
      'Resistenza':  70,
      'Simpatia':    65,
      'Follia':      55,
    }
  },
  {
    id: 'darthvader',
    nome: 'DARTH VADER',
    sottotitolo: 'Neon Rosso · Rosso Sith',
    descrizione: 'Passione travolgente e impulsi dominanti. Non accetta un no come risposta e piega l\'atmosfera al proprio volere. Dedicato a chi vuole una serata decisamente più... dark.',
    immagine: 'char_darthvader.png',
    colore: 'hsl(346, 100%, 50%)',
    coloreHsl: '346, 100%, 50%',
    tratti: {
      'Potenza':     100,
      'Precisione':  70,
      'Resistenza':  90,
      'Simpatia':    20,
      'Follia':      95,
    }
  },
];

// ─────────────────────────────────────────────────
// DATI: DOMANDE
// punti: { id_personaggio: peso } — valori consigliati 0-3
// ─────────────────────────────────────────────────
const QUESTIONS = [
  {
    testo: 'Come preferisci iniziare una serata speciale?',
    opzioni: [
      {
        testo: 'Con un piano preciso, tutto sotto controllo.',
        immagine: null,
        punti: { stormtrooper: 3, macewindu: 1 }
      },
      {
        testo: 'Lasciando che le cose accadano dolcemente.',
        immagine: null,
        punti: { grogu: 3, macewindu: 1 }
      },
      {
        testo: 'Creando un\'atmosfera intensa e magnetica.',
        immagine: null,
        punti: { darthvader: 3, macewindu: 1 }
      },
      {
        testo: 'Con una sorpresa inaspettata e divertente.',
        immagine: null,
        punti: { grogu: 2, stormtrooper: 1 }
      }
    ]
  },
  {
    testo: 'Qual è il tuo approccio alla vita sentimentale?',
    opzioni: [
      {
        testo: 'Missione completata. Obiettivi chiari.',
        immagine: null,
        punti: { stormtrooper: 3 }
      },
      {
        testo: 'Amore tenero e sincero, senza filtri.',
        immagine: null,
        punti: { grogu: 3 }
      },
      {
        testo: 'Equilibrio tra cuore e passione.',
        immagine: null,
        punti: { macewindu: 3, grogu: 1 }
      },
      {
        testo: 'Dominare o essere dominati. Nient\'altro.',
        immagine: null,
        punti: { darthvader: 3 }
      }
    ]
  },
  {
    testo: 'Scegli la tua arma preferita (metaforicamente):',
    opzioni: [
      {
        testo: '🔫 Un blaster — rapido ed efficace.',
        immagine: null,
        punti: { stormtrooper: 3, darthvader: 1 }
      },
      {
        testo: '🌿 La natura — delicata ma potente.',
        immagine: null,
        punti: { grogu: 3 }
      },
      {
        testo: '💜 Una spada laser viola — unica nel suo genere.',
        immagine: null,
        punti: { macewindu: 3 }
      },
      {
        testo: '🔴 La Forza oscura — travolgente e inarrestabile.',
        immagine: null,
        punti: { darthvader: 3, macewindu: 1 }
      }
    ]
  },
  {
    testo: 'Cosa cercano le persone in te?',
    opzioni: [
      {
        testo: 'Affidabilità. Sono sempre lì quando serve.',
        immagine: null,
        punti: { stormtrooper: 3, macewindu: 1 }
      },
      {
        testo: 'Dolcezza. Sanno che li curo con tutto il cuore.',
        immagine: null,
        punti: { grogu: 3 }
      },
      {
        testo: 'Saggezza. Porto sempre il punto di vista giusto.',
        immagine: null,
        punti: { macewindu: 3, grogu: 1 }
      },
      {
        testo: 'Intensità. Con me ogni momento è indimenticabile.',
        immagine: null,
        punti: { darthvader: 3, stormtrooper: 1 }
      }
    ]
  },
  {
    testo: 'Qual è il tuo lato oscuro segreto?',
    opzioni: [
      {
        testo: 'Sono troppo rigido. Seguo sempre le regole.',
        immagine: null,
        punti: { stormtrooper: 3 }
      },
      {
        testo: 'Mangio troppo. Il cibo è la mia debolezza.',
        immagine: null,
        punti: { grogu: 3 }
      },
      {
        testo: 'Sono indeciso. Vedo troppi lati della stessa medaglia.',
        immagine: null,
        punti: { macewindu: 3 }
      },
      {
        testo: 'Voglio tutto il potere. Subito.',
        immagine: null,
        punti: { darthvader: 3 }
      }
    ]
  },
  {
    testo: 'Come ti comporti sotto pressione?',
    opzioni: [
      {
        testo: 'Eseguo il protocollo. Nessun margine d\'errore.',
        immagine: null,
        punti: { stormtrooper: 3, macewindu: 1 }
      },
      {
        testo: 'Resto calmo e uso la Forza (o i nervi).',
        immagine: null,
        punti: { grogu: 2, macewindu: 2 }
      },
      {
        testo: 'Analizzo ogni variabile e scelgo con saggezza.',
        immagine: null,
        punti: { macewindu: 3 }
      },
      {
        testo: 'La pressione mi carica. È il mio habitat naturale.',
        immagine: null,
        punti: { darthvader: 3, stormtrooper: 1 }
      }
    ]
  },
];

// ─────────────────────────────────────────────────
// STATO DEL QUIZ
// ─────────────────────────────────────────────────
const state = {
  currentQuestion: 0,
  scores: {},       // { id_personaggio: punteggio_totale }
  result: null,     // personaggio vincitore
  isTransitioning: false,
};

function initState() {
  state.currentQuestion = 0;
  state.result = null;
  state.isTransitioning = false;
  state.scores = {};
  CHARACTERS.forEach(c => { state.scores[c.id] = 0; });
}

// ─────────────────────────────────────────────────
// CALCOLO RISULTATO
// ─────────────────────────────────────────────────
function calcResult() {
  let maxScore = -1;
  let winner = null;
  CHARACTERS.forEach(c => {
    if (state.scores[c.id] > maxScore) {
      maxScore = state.scores[c.id];
      winner = c;
    }
  });
  return winner;
}

// ─────────────────────────────────────────────────
// RENDER DOMANDA
// ─────────────────────────────────────────────────
function renderQuestion(index) {
  const q = QUESTIONS[index];
  const total = QUESTIONS.length;
  const progress = ((index) / total) * 100;

  const container = document.getElementById('quiz-content');
  container.innerHTML = `
    <div class="quiz-question-block" id="question-block">
      <div class="quiz-progress-wrap">
        <span class="quiz-progress-label">Domanda ${index + 1} di ${total}</span>
        <div class="quiz-progress-bar-track">
          <div class="quiz-progress-bar-fill" id="quiz-progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>

      <h3 class="quiz-question-text">${q.testo}</h3>

      <div class="quiz-options-grid">
        ${q.opzioni.map((opt, i) => `
          <button class="quiz-option-btn" data-option-index="${i}" aria-label="${opt.testo}">
            ${opt.immagine ? `<div class="quiz-option-img-box"><img src="${opt.immagine}" alt=""></div>` : ''}
            <span class="quiz-option-text">${opt.testo}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Anima progress bar dopo il render
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const fill = document.getElementById('quiz-progress-fill');
      if (fill) fill.style.width = `${((index + 1) / total) * 100}%`;
    });
  });

  // Anima ingresso domanda
  const block = document.getElementById('question-block');
  block.classList.add('quiz-fade-in');

  // Bind click opzioni
  container.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.isTransitioning) return;
      onOptionSelect(btn, parseInt(btn.dataset.optionIndex));
    });
  });
}

// ─────────────────────────────────────────────────
// SELEZIONE OPZIONE
// ─────────────────────────────────────────────────
function onOptionSelect(btn, optionIndex) {
  state.isTransitioning = true;
  const opt = QUESTIONS[state.currentQuestion].opzioni[optionIndex];

  // Accumula punteggi
  Object.entries(opt.punti).forEach(([id, pts]) => {
    state.scores[id] = (state.scores[id] || 0) + pts;
  });

  // Highlight risposta selezionata
  document.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.add('disabled'));
  btn.classList.add('selected');

  setTimeout(() => {
    const block = document.getElementById('question-block');
    block.classList.add('quiz-fade-out');

    setTimeout(() => {
      state.currentQuestion++;
      if (state.currentQuestion < QUESTIONS.length) {
        renderQuestion(state.currentQuestion);
        state.isTransitioning = false;
      } else {
        showLoading();
      }
    }, 350);
  }, 500);
}

// ─────────────────────────────────────────────────
// SCHERMATA DI CARICAMENTO (HYPE)
// ─────────────────────────────────────────────────
function showLoading() {
  const container = document.getElementById('quiz-content');
  container.innerHTML = `
    <div class="quiz-loading" id="quiz-loading">
      <div class="quiz-loading-orb"></div>
      <p class="quiz-loading-text">Analisi del profilo in corso...</p>
      <div class="quiz-loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  document.getElementById('quiz-loading').classList.add('quiz-fade-in');

  setTimeout(() => {
    state.result = calcResult();
    showResult();
  }, 2200);
}

// ─────────────────────────────────────────────────
// SCHERMATA RISULTATO
// ─────────────────────────────────────────────────
function showResult() {
  const c = state.result;
  const container = document.getElementById('quiz-content');

  // Aggiorna il colore neon globale della sezione
  const section = document.getElementById('quiz');
  if (section) section.style.setProperty('--quiz-neon', c.colore);

  const traitsBars = Object.entries(c.tratti).map(([nome, val]) => `
    <div class="quiz-stat-row">
      <span class="quiz-stat-label">${nome}</span>
      <div class="quiz-stat-track">
        <div class="quiz-stat-fill" data-value="${val}" style="width: 0%; background: ${c.colore};"></div>
      </div>
      <span class="quiz-stat-value">${val}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="quiz-result-card" id="quiz-result-card"
         style="--char-color: ${c.colore}; --char-color-dim: hsla(${c.coloreHsl}, 0.12);">
      <div class="quiz-result-header">
        <span class="quiz-result-eyebrow">Il tuo lato della Forza è</span>
        <h3 class="quiz-result-name" style="color: ${c.colore}; text-shadow: 0 0 20px ${c.colore};">${c.nome}</h3>
        <span class="quiz-result-sub">${c.sottotitolo}</span>
      </div>

      <div class="quiz-result-body">
        <div class="quiz-result-img-wrap">
          <img src="${c.immagine}" alt="${c.nome}" class="quiz-result-img">
          <div class="quiz-result-img-glow" style="background: radial-gradient(ellipse at center, hsla(${c.coloreHsl}, 0.35) 0%, transparent 70%);"></div>
        </div>

        <div class="quiz-result-info">
          <p class="quiz-result-desc">${c.descrizione}</p>

          <div class="quiz-stats">
            <span class="quiz-stats-title">Profilo energetico</span>
            ${traitsBars}
          </div>
        </div>
      </div>

      <button class="quiz-retry-btn" id="quiz-retry-btn">
        <span>↺ Riprova</span>
      </button>
    </div>
  `;

  const card = document.getElementById('quiz-result-card');
  card.classList.add('quiz-fade-in');

  // Anima le barre statistiche con piccolo delay
  setTimeout(() => {
    document.querySelectorAll('.quiz-stat-fill').forEach(bar => {
      bar.style.width = bar.dataset.value + '%';
    });
  }, 300);

  document.getElementById('quiz-retry-btn').addEventListener('click', restartQuiz);
}

// ─────────────────────────────────────────────────
// RESTART
// ─────────────────────────────────────────────────
function restartQuiz() {
  const container = document.getElementById('quiz-content');
  container.classList.add('quiz-fade-out');
  setTimeout(() => {
    container.classList.remove('quiz-fade-out');
    initState();
    renderQuestion(0);
  }, 350);
}

// ─────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────
function initQuiz() {
  initState();
  renderQuestion(0);
}

// Avvia quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initQuiz);
