// ============================================
// CRAWL.STORIES - ПОЛНАЯ СИСТЕМА СЕЗОННЫХ ТЕМ
// ============================================

class ThemesSystem {
  constructor() {
    this.themes = {
      // Праздничные темы (высший приоритет)
      newyear: {
        name: '❄️ Новый год',
        emoji: ['🎄', '🎁', '❄️', '⛄', '✨'],
        startMonth: 12, startDay: 20,
        endMonth: 1, endDay: 10,
        accentColor: '#aee0ff',
        animation: 'snowfall',
        priority: 100,
        category: 'holiday'
      },
      christmas: {
        name: '⭐ Рождество',
        emoji: ['⭐', '🌟', '🎄', '❄️'],
        startMonth: 1, startDay: 5,
        endMonth: 1, endDay: 8,
        accentColor: '#ffd700',
        animation: 'snowfallLarge',
        priority: 95,
        category: 'holiday'
      },
      halloween: {
        name: '🎃 Хэллоуин',
        emoji: ['🎃', '👻', '🕸️', '🕷️', '🦇'],
        startMonth: 10, startDay: 27,
        endMonth: 11, endDay: 2,
        accentColor: '#ff8c00',
        animation: 'bats',
        priority: 90,
        category: 'holiday'
      },
      
      // Сезонные темы
      winter: {
        name: '🧊 Зима',
        emoji: ['❄️', '🧊', '🌨️'],
        startMonth: 12, startDay: 1,
        endMonth: 2, endDay: 28,
        accentColor: '#b8e2f2',
        animation: 'lightSnow',
        priority: 30,
        category: 'seasonal'
      },
      spring: {
        name: '🌸 Весна',
        emoji: ['🌸', '🐦', '🍃', '🌷'],
        startMonth: 3, startDay: 1,
        endMonth: 5, endDay: 31,
        accentColor: '#a8e6cf',
        animation: 'petals',
        priority: 30,
        category: 'seasonal'
      },
      summer: {
        name: '☀️ Лето',
        emoji: ['☀️', '🌴', '🏖️', '🌊'],
        startMonth: 6, startDay: 1,
        endMonth: 8, endDay: 31,
        accentColor: '#87ceeb',
        animation: 'sunbeams',
        priority: 30,
        category: 'seasonal'
      },
      autumn: {
        name: '🍁 Осень',
        emoji: ['🍁', '🍂', '🌰'],
        startMonth: 9, startDay: 1,
        endMonth: 11, endDay: 30,
        accentColor: '#ffb366',
        animation: 'leaves',
        priority: 30,
        category: 'seasonal'
      },
      
      // Специальные темы (включаются только вручную)
      birthday: {
        name: '🎉 День рождения',
        emoji: ['🎂', '🎈', '🎊', '🎁'],
        startMonth: 0, startDay: 0, // Только ручное включение
        endMonth: 0, endDay: 0,
        accentColor: '#ff6bc9',
        animation: 'confetti',
        priority: 0,
        category: 'special'
      },
      neon: {
        name: '✨ Неоновая',
        emoji: ['✨', '🔮', '💫'],
        startMonth: 0, startDay: 0,
        endMonth: 0, endDay: 0,
        accentColor: '#9d4edd',
        animation: 'neonParticles',
        priority: 0,
        category: 'special'
      },
      anime: {
        name: '💗 Аниме',
        emoji: ['💗', '🌸', '✨', '⭐'],
        startMonth: 0, startDay: 0,
        endMonth: 0, endDay: 0,
        accentColor: '#ff9bb3',
        animation: 'hearts',
        priority: 0,
        category: 'special'
      }
    };
    
    this.currentTheme = null;
    this.manualMode = false;
    this.manualExpiry = null;
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.fpsLimit = 30; // Ограничение FPS для производительности
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.detectAndApplyTheme();
    this.injectStyles();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  isDateInPeriod(month, day, startM, startD, endM, endD) {
    // Для специальных тем (только ручное включение)
    if (startM === 0 && startD === 0 && endM === 0 && endD === 0) {
      return false;
    }
    
    if (startM === endM) {
      return month === startM && day >= startD && day <= endD;
    }
    if (startM < endM) {
      if (month === startM) return day >= startD;
      if (month === endM) return day <= endD;
      return month > startM && month < endM;
    }
    // Переход через год (например, дек - янв)
    if (month === startM) return day >= startD;
    if (month === endM) return day <= endD;
    return month > startM || month < endM;
  }

  detectThemeByDate() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    let availableThemes = [];
    
    // Собираем все подходящие по дате темы
    for (const [key, theme] of Object.entries(this.themes)) {
      if (this.isDateInPeriod(month, day, theme.startMonth, theme.startDay, theme.endMonth, theme.endDay)) {
        availableThemes.push({ key, ...theme });
      }
    }
    
    // Сортируем по приоритету (высший приоритет первый)
    availableThemes.sort((a, b) => b.priority - a.priority);
    
    return availableThemes.length > 0 ? availableThemes[0].key : null;
  }

  async applyTheme(themeName) {
    document.documentElement.removeAttribute('data-theme');
    this.currentTheme = null;
    
    if (!themeName || !this.themes[themeName]) {
      this.clearSeasonalElements();
      return;
    }

    document.documentElement.setAttribute('data-theme', themeName);
    this.currentTheme = themeName;
    
    const theme = this.themes[themeName];
    document.documentElement.style.setProperty('--accent-primary', theme.accentColor);
    
    // ПОДГРУЖАЕМ CSS ФАЙЛ ТЕМЫ
    await this.loadThemeCSS(themeName);
    
    this.createSeasonalElements(themeName);
    
    // Добавляем баннер если это праздничная тема
    this.createThemeBanner(themeName);
    
    // Обновляем UI переключателя тем если он есть
    this.updateThemeSelector();
  }

  async loadThemeCSS(themeName) {
    // Удаляем старую CSS тему если была
    const oldLink = document.getElementById('theme-css');
    if (oldLink) {
      oldLink.remove();
    }
    
    // Загружаем новую CSS тему
    const link = document.createElement('link');
    link.id = 'theme-css';
    link.rel = 'stylesheet';
    link.href = `theme-${themeName}.css`;
    link.onload = () => console.log(`✅ Тема CSS загружена: ${themeName}`);
    link.onerror = () => console.warn(`⚠️ CSS тема не найдена: theme-${themeName}.css`);
    document.head.appendChild(link);
  }

  createThemeBanner(themeName) {
    // Удаляем старый баннер если был
    const oldBanner = document.getElementById('theme-banner');
    if (oldBanner) {
      oldBanner.remove();
    }
    
    // Праздничные темы показывают баннер
    const holidayThemes = ['newyear', 'halloween', 'spring', 'summer', 'autumn', 'christmas'];
    
    if (!holidayThemes.includes(themeName)) {
      return;
    }
    
    const banner = document.createElement('div');
    banner.id = 'theme-banner';
    banner.className = 'theme-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      animation: slideDown 0.5s ease;
    `;
    document.body.insertBefore(banner, document.body.firstChild);
  }

  createSeasonalElements(themeName) {
    const container = document.getElementById('seasonal-effects') || document.createElement('div');
    if (!container.id) {
      container.id = 'seasonal-effects';
      document.body.appendChild(container);
    }
    
    const theme = this.themes[themeName];
    const count = this.getParticleCount(themeName);
    
    // Очищаем только если меняется тема
    if (container.dataset.currentTheme !== themeName) {
      container.innerHTML = '';
      container.dataset.currentTheme = themeName;
    }

    // Добавляем частицы если нужно больше
    const currentCount = container.children.length;
    if (currentCount < count) {
      for (let i = currentCount; i < count; i++) {
        const el = document.createElement('div');
        el.className = `seasonal-element ${theme.animation}`;
        el.textContent = theme.emoji[Math.floor(Math.random() * theme.emoji.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.animationDelay = (Math.random() * 10) + 's';
        el.style.animationDuration = (8 + Math.random() * 8) + 's';
        el.style.fontSize = this.getParticleSize(themeName) + 'px';
        container.appendChild(el);
      }
    }
  }

  clearSeasonalElements() {
    const container = document.getElementById('seasonal-effects');
    if (container) {
      container.innerHTML = '';
      container.removeAttribute('data-current-theme');
    }
  }

  getParticleCount(themeName) {
    const counts = {
      snowfall: 15,
      snowfallLarge: 8,
      bats: 6,
      lightSnow: 10,
      petals: 12,
      sunbeams: 8,
      leaves: 10,
      confetti: 20,
      neonParticles: 15,
      hearts: 12
    };
    return counts[this.themes[themeName].animation] || 10;
  }

  getParticleSize(themeName) {
    const sizes = {
      snowfallLarge: 32,
      bats: 28,
      confetti: 20,
      neonParticles: 18,
      hearts: 22
    };
    return sizes[this.themes[themeName].animation] || 24;
  }

  async detectAndApplyTheme() {
    // Проверяем ручной режим с истечением срока
    if (this.manualExpiry && new Date() > new Date(this.manualExpiry)) {
      this.manualMode = false;
      this.manualExpiry = null;
      await this.saveSettings();
    }

    if (this.manualMode && this.currentTheme) {
      await this.applyTheme(this.currentTheme);
      return;
    }

    const autoTheme = this.detectThemeByDate();
    if (autoTheme) {
      await this.applyTheme(autoTheme);
    } else {
      this.applyTheme(null); // Сбрасываем тему
    }
  }

  async setManualTheme(themeName, durationDays = null) {
    this.manualMode = true;
    this.currentTheme = themeName;
    
    if (durationDays && durationDays > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + durationDays);
      this.manualExpiry = expiry.toISOString();
    } else {
      this.manualExpiry = null;
    }
    
    await this.applyTheme(themeName);
    await this.saveSettings();
  }

  async disableManualMode() {
    this.manualMode = false;
    this.currentTheme = null;
    this.manualExpiry = null;
    await this.saveSettings();
    await this.detectAndApplyTheme();
  }

  async saveSettings() {
    const settings = {
      manualMode: this.manualMode,
      selectedTheme: this.currentTheme,
      manualExpiry: this.manualExpiry,
      timestamp: Date.now()
    };
    
    localStorage.setItem('siteThemeSettings', JSON.stringify(settings));
    
    // Сохраняем в Firestore если доступно
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      try {
        await firebase.firestore().collection('siteSettings').doc('themes').set(settings);
      } catch (error) {
        console.warn('Failed to save theme settings to Firestore:', error);
      }
    }
  }

  async loadSettings() {
    // Пробуем загрузить из Firestore
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      try {
        const doc = await firebase.firestore().collection('siteSettings').doc('themes').get();
        if (doc.exists) {
          const settings = doc.data();
          this.manualMode = settings.manualMode || false;
          this.currentTheme = settings.selectedTheme || null;
          this.manualExpiry = settings.manualExpiry || null;
          return;
        }
      } catch (error) {
        console.warn('Failed to load theme settings from Firestore:', error);
      }
    }
    
    // Fallback на localStorage
    const stored = localStorage.getItem('siteThemeSettings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        this.manualMode = settings.manualMode || false;
        this.currentTheme = settings.selectedTheme || null;
        this.manualExpiry = settings.manualExpiry || null;
      } catch (e) {
        console.warn('Failed to parse theme settings');
      }
    }
  }

  updateThemeSelector() {
    // Обновляем селектор тем в админке если он есть
    const selector = document.getElementById('theme-selector');
    if (selector) {
      selector.value = this.currentTheme || 'auto';
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
/* Theme Variables */
:root[data-theme="newyear"] {
  --accent-primary: #aee0ff;
}
:root[data-theme="christmas"] {
  --accent-primary: #ffd700;
}
:root[data-theme="halloween"] {
  --accent-primary: #ff8c00;
}
:root[data-theme="winter"] {
  --accent-primary: #b8e2f2;
}
:root[data-theme="spring"] {
  --accent-primary: #a8e6cf;
}
:root[data-theme="summer"] {
  --accent-primary: #87ceeb;
}
:root[data-theme="autumn"] {
  --accent-primary: #ffb366;
}
:root[data-theme="birthday"] {
  --accent-primary: #ff6bc9;
}
:root[data-theme="neon"] {
  --accent-primary: #9d4edd;
}
:root[data-theme="anime"] {
  --accent-primary: #ff9bb3;
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
  opacity: 0.7;
  top: -50px;
}

/* Snowfall Animations */
.seasonal-element.snowfall {
  animation: snowfall linear infinite;
}

.seasonal-element.snowfallLarge {
  animation: snowfallLarge linear infinite;
}

.seasonal-element.lightSnow {
  animation: lightSnow linear infinite;
  opacity: 0.5;
}

@keyframes snowfall {
  to {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes snowfallLarge {
  to {
    transform: translateY(100vh) rotate(180deg);
    opacity: 0;
  }
}

@keyframes lightSnow {
  to {
    transform: translateY(100vh) rotate(90deg);
    opacity: 0;
  }
}

/* Bat Animation */
.seasonal-element.bats {
  animation: batfloat 8s ease-in-out infinite;
}

@keyframes batfloat {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  25% { transform: translateY(-30px) translateX(20px) rotate(10deg); }
  50% { transform: translateY(-60px) translateX(0) rotate(0deg); }
  75% { transform: translateY(-30px) translateX(-20px) rotate(-10deg); }
}

/* Petals Fall */
.seasonal-element.petals {
  animation: petalsfall 8s ease-in infinite;
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

/* Sunbeams */
.seasonal-element.sunbeams {
  animation: sunbeams 6s ease-in-out infinite;
}

@keyframes sunbeams {
  0%, 100% { 
    transform: translateY(0) translateX(0) scale(1); 
    opacity: 0.6;
  }
  50% { 
    transform: translateY(-40px) translateX(20px) scale(1.2); 
    opacity: 0.8;
  }
}

/* Autumn Leaves */
.seasonal-element.leaves {
  animation: leaffall 12s ease-in infinite;
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

/* Confetti */
.seasonal-element.confetti {
  animation: confettiFall 5s ease-in infinite;
}

@keyframes confettiFall {
  0% {
    opacity: 0;
    transform: translateY(-50px) rotate(0deg) scale(0.5);
  }
  10% {
    opacity: 1;
    transform: translateY(0) rotate(180deg) scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) rotate(360deg) scale(0.5);
  }
}

/* Neon Particles */
.seasonal-element.neonParticles {
  animation: neonFloat 8s ease-in-out infinite;
  text-shadow: 0 0 10px currentColor;
}

@keyframes neonFloat {
  0%, 100% { 
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 0.3;
  }
  25% { 
    transform: translateY(-60px) translateX(40px) rotate(90deg);
    opacity: 0.8;
  }
  50% { 
    transform: translateY(-120px) translateX(0) rotate(180deg);
    opacity: 0.5;
  }
  75% { 
    transform: translateY(-60px) translateX(-40px) rotate(270deg);
    opacity: 0.8;
  }
}

/* Hearts */
.seasonal-element.hearts {
  animation: heartsFloat 6s ease-in infinite;
}

@keyframes heartsFloat {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translateY(-20px) scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-100vh) scale(0.5);
  }
}

/* FPS Limit Helper */
.seasonal-element {
  will-change: transform, opacity;
}
    `;
    document.head.appendChild(style);
  }

  startAnimationLoop() {
    const animate = (currentTime) => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      // Ограничение FPS
      const delta = currentTime - this.lastFrameTime;
      if (delta < 1000 / this.fpsLimit) return;
      
      this.lastFrameTime = currentTime;
      
      // Обновляем анимации если нужно
      this.updateAnimations();
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  updateAnimations() {
    // Дополнительная логика обновления анимаций если нужно
  }

  stopAnimationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  setupEventListeners() {
    // Слушаем изменения в localStorage (другие вкладки)
    window.addEventListener('storage', (e) => {
      if (e.key === 'siteThemeSettings') {
        this.loadSettings();
        this.detectAndApplyTheme();
      }
    });

    // Слушаем сообщения от других фреймов/вкладок
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'THEME_CHANGE') {
        this.loadSettings();
        this.detectAndApplyTheme();
      }
    });

    // Обработка селектора тем в админке
    document.addEventListener('change', (e) => {
      if (e.target.id === 'theme-selector') {
        const theme = e.target.value;
        if (theme === 'auto') {
          this.disableManualMode();
        } else {
          this.setManualTheme(theme);
        }
      }
    });
  }

  // Публичные методы для использования в админке
  getAvailableThemes() {
    return this.themes;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  isManualMode() {
    return this.manualMode;
  }

  getManualExpiry() {
    return this.manualExpiry;
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

// Экспорт для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemesSystem;
}
