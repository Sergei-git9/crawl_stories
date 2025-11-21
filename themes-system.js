// ============================================
// CRAWL.STORIES - ПОЛНАЯ СИСТЕМА СЕЗОННЫХ ТЕМ
// ============================================

class ThemesSystem {
  constructor() {
    this.themes = {
      newyear: {
        name: '❄️ Новый год',
        emoji: ['🎄', '🎁', '❄️', '⛄', '✨'],
        startMonth: 12, startDay: 15,
        endMonth: 1, endDay: 15,
        accentColor: '#aee0ff',
        animation: 'snowfall'
      },
      halloween: {
        name: '🎃 Хэллоуин',
        emoji: ['🎃', '👻', '🕸️', '🕷️', '🦇'],
        startMonth: 10, startDay: 20,
        endMonth: 11, endDay: 2,
        accentColor: '#ff8c00',
        animation: 'float'
      },
      valentine: {
        name: '❤️ День Валентина',
        emoji: ['❤️', '💌', '🌹'],
        startMonth: 2, startDay: 7,
        endMonth: 2, endDay: 15,
        accentColor: '#ff9bb3',
        animation: 'floatUp'
      },
      spring: {
        name: '🌸 Весна',
        emoji: ['🌸', '🐦', '🍃'],
        startMonth: 3, startDay: 1,
        endMonth: 5, endDay: 31,
        accentColor: '#a8e6cf',
        animation: 'petals'
      },
      summer: {
        name: '☀️ Лето',
        emoji: ['☀️', '🌴', '🏖️'],
        startMonth: 6, startDay: 1,
        endMonth: 8, endDay: 31,
        accentColor: '#ffd89b',
        animation: 'waves'
      },
      autumn: {
        name: '🍁 Осень',
        emoji: ['🍁', '🍂'],
        startMonth: 9, startDay: 1,
        endMonth: 11, endDay: 30,
        accentColor: '#ffb366',
        animation: 'leaves'
      }
    };
    
    this.currentTheme = null;
    this.manualMode = false;
    this.init();
  }

  init() {
    this.loadSettings();
    this.detectAndApplyTheme();
    this.injectStyles();
    this.setupEventListeners();
  }

  isDateInPeriod(month, day, startM, startD, endM, endD) {
    if (startM === endM) {
      return month === startM && day >= startD && day <= endD;
    }
    if (startM < endM) {
      if (month === startM) return day >= startD;
      if (month === endM) return day <= endD;
      return month > startM && month < endM;
    }
    // Переход через год (например, 15 дек - 15 янв)
    if (month === startM) return day >= startD;
    if (month === endM) return day <= endD;
    return month > startM || month < endM;
  }

  detectThemeByDate() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    for (const [key, theme] of Object.entries(this.themes)) {
      if (this.isDateInPeriod(month, day, theme.startMonth, theme.startDay, theme.endMonth, theme.endDay)) {
        return key;
      }
    }
    return null;
  }

  applyTheme(themeName) {
    document.documentElement.removeAttribute('data-theme');
    this.currentTheme = null;
    
    if (!themeName || !this.themes[themeName]) return;

    document.documentElement.setAttribute('data-theme', themeName);
    this.currentTheme = themeName;
    
    const theme = this.themes[themeName];
    document.documentElement.style.setProperty('--accent-primary', theme.accentColor);
    
    this.createSeasonalElements(themeName);
  }

  createSeasonalElements(themeName) {
    const container = document.getElementById('seasonal-effects') || document.createElement('div');
    if (!container.id) {
      container.id = 'seasonal-effects';
      document.body.appendChild(container);
    }
    container.innerHTML = '';

    const theme = this.themes[themeName];
    const count = Math.random() > 0.5 ? 8 : 12;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = `seasonal-element ${theme.animation}`;
      el.textContent = theme.emoji[Math.floor(Math.random() * theme.emoji.length)];
      el.style.left = Math.random() * 100 + '%';
      el.style.animationDelay = (Math.random() * 5) + 's';
      el.style.animationDuration = (5 + Math.random() * 5) + 's';
      container.appendChild(el);
    }
  }

  detectAndApplyTheme() {
    const stored = localStorage.getItem('siteThemeSettings');
    
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        if (settings.manualMode && settings.selectedTheme) {
          this.manualMode = true;
          this.applyTheme(settings.selectedTheme);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse theme settings');
      }
    }

    const autoTheme = this.detectThemeByDate();
    if (autoTheme) {
      this.applyTheme(autoTheme);
    }
  }

  setManualTheme(themeName) {
    this.manualMode = true;
    this.applyTheme(themeName);
    this.saveSettings();
  }

  disableManualMode() {
    this.manualMode = false;
    this.currentTheme = null;
    this.saveSettings();
    this.detectAndApplyTheme();
  }

  saveSettings() {
    const settings = {
      manualMode: this.manualMode,
      selectedTheme: this.currentTheme,
      timestamp: Date.now()
    };
    localStorage.setItem('siteThemeSettings', JSON.stringify(settings));
  }

  loadSettings() {
    const stored = localStorage.getItem('siteThemeSettings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        this.manualMode = settings.manualMode || false;
      } catch (e) {
        console.warn('Failed to load theme settings');
      }
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
/* Theme Variables */
:root[data-theme="newyear"] {
  --accent-primary: #aee0ff;
}
:root[data-theme="halloween"] {
  --accent-primary: #ff8c00;
}
:root[data-theme="valentine"] {
  --accent-primary: #ff9bb3;
}
:root[data-theme="spring"] {
  --accent-primary: #a8e6cf;
}
:root[data-theme="summer"] {
  --accent-primary: #ffd89b;
}
:root[data-theme="autumn"] {
  --accent-primary: #ffb366;
}

/* Seasonal Effects Container */
#seasonal-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.seasonal-element {
  position: absolute;
  user-select: none;
  font-size: 24px;
  opacity: 0.8;
}

/* Snowfall Animation */
.seasonal-element.snowfall {
  animation: snowfall linear infinite;
  top: -50px;
}

@keyframes snowfall {
  to {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

/* Bat Float Animation */
.seasonal-element.float {
  animation: batfloat 8s ease-in-out infinite;
  font-size: 28px;
}

@keyframes batfloat {
  0%, 100% { transform: translateY(0) translateX(0); }
  25% { transform: translateY(-30px) translateX(20px); }
  50% { transform: translateY(-60px) translateX(0); }
  75% { transform: translateY(-30px) translateX(-20px); }
}

/* Hearts Float Up */
.seasonal-element.floatUp {
  animation: heartsup 6s ease-in infinite;
  font-size: 20px;
  bottom: -50px;
}

@keyframes heartsup {
  to {
    transform: translateY(-120vh) rotate(-360deg);
    opacity: 0;
  }
}

/* Petals Fall */
.seasonal-element.petals {
  animation: petalsfall 8s ease-in infinite;
  font-size: 22px;
}

@keyframes petalsfall {
  0% {
    opacity: 0;
    transform: translateY(-50px) translateX(0) rotate(0deg);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) translateX(50px) rotate(360deg);
  }
}

/* Summer Waves */
.seasonal-element.waves {
  animation: waves 6s ease-in-out infinite;
  font-size: 26px;
}

@keyframes waves {
  0%, 100% { transform: translateY(0) translateX(0) scale(1); }
  50% { transform: translateY(-20px) translateX(10px) scale(1.1); }
}

/* Autumn Leaves */
.seasonal-element.leaves {
  animation: leaffall 10s ease-in infinite;
  font-size: 24px;
}

@keyframes leaffall {
  0% {
    opacity: 0;
    transform: translateY(-50px) translateX(0) rotate(0deg);
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) translateX(100px) rotate(720deg);
  }
}
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Listen for theme changes in localStorage (from other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'siteThemeSettings') {
        this.loadSettings();
        this.detectAndApplyTheme();
      }
    });
  }
}

// Инициализация при загрузке документа
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themesSystem = new ThemesSystem();
  });
} else {
  window.themesSystem = new ThemesSystem();
}
