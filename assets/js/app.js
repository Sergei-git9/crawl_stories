class PublicApp {
  constructor() {
    this.stories = [];
    this.categories = {};
    this.currentCategory = 'all';
    this.init();
  }

  initCategories() {
    this.categories = {
      'all': '📚 Все истории',
      'published': '🚀 Опубликовано',
      'scheduled': '⏰ Ожидание', 
      'soon': '🕐 Скоро',
      'fantasy': '🧙 Фэнтези',
      'sci-fi': '🚀 Научная фантастика', 
      'horror': '👻 Хоррор',
      'adventure': '🗺️ Приключения',
      'mystery': '🕵️ Мистика',
      'chat': '💬 Чат-истории'
    };
  }

  renderCategoryFilters() {
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    nav.innerHTML = Object.keys(this.categories).map(category => `
      <button class="nav-btn ${this.currentCategory === category ? 'active' : ''}" 
              data-category="${category}">
        ${this.categories[category]}
      </button>
    `).join('');

    const categoryTitle = document.getElementById('currentCategoryTitle');
    if (categoryTitle) {
      categoryTitle.textContent = this.categories[this.currentCategory];
    }

    nav.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentCategory = e.target.dataset.category;
        this.renderCategoryFilters();
        this.renderContent();
      });
    });
  }

  async init() {
    await this.loadPublicData();
    this.initCategories();
    this.renderCategoryFilters();
    this.setupEventListeners();
    console.log('💬 Публичный сайт запущен');
  }

  async loadPublicData() {
    try {
      const storiesSnapshot = await db.collection('stories').get();
      
      this.stories = storiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(story => {
        if (story.isPublic === false) return false;
        
        if (story.publishDate) {
          const publishDate = story.publishDate?.toDate ? story.publishDate.toDate() : new Date(story.publishDate);
          const now = new Date();
          
          if (publishDate <= now && !story.published) {
            this.autoPublishStory(doc.id);
            story.published = true;
          }
        }
        
        return true;
      });

      console.log('✅ Загружено историй:', this.stories.length);
      this.renderContent();

    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      this.showError('Не удалось загрузить истории');
    }
  }

  async autoPublishStory(storyId) {
    try {
      await db.collection('stories').doc(storyId).update({
        published: true,
        publishDate: null,
        updatedAt: new Date()
      });
      console.log(`✅ История ${storyId} автоматически опубликована`);
    } catch (error) {
      console.error('❌ Ошибка автопубликации:', error);
    }
  }

  renderContent() {
    const container = document.getElementById('storiesList');
    if (!container) return;
    container.innerHTML = this.renderStories();
  }

  renderStories() {
    let filteredStories = this.stories;
    
    if (this.currentCategory === 'published') {
      filteredStories = this.stories.filter(story => story.published === true);
    } else if (this.currentCategory === 'scheduled') {
      filteredStories = this.stories.filter(story => 
        story.publishDate && new Date(story.publishDate) > new Date()
      );
    } else if (this.currentCategory === 'soon') {
      filteredStories = this.stories.filter(story => 
        !story.published && !story.publishDate
      );
    } else if (this.currentCategory === 'chat') {
      filteredStories = this.stories.filter(story => 
        story.format === 'chat' || story.isChat === true
      );
    } else if (this.currentCategory !== 'all') {
      filteredStories = this.stories.filter(story => 
        story.category === this.currentCategory
      );
    }

    this.updateStoriesCount(filteredStories.length);

    if (filteredStories.length === 0) {
      return `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <div style="font-size: 64px; margin-bottom: 20px;">📝</div>
          <h3 style="margin-bottom: 10px; color: var(--text-secondary);">Пока здесь пусто</h3>
          <p>Истории появятся скоро...</p>
        </div>
      `;
    }

    return filteredStories.map(story => {
      const isScheduled = story.publishDate && new Date(story.publishDate) > new Date();
      const isSoon = !story.published && !story.publishDate;
      const isPublished = story.published === true;
      const isChat = story.format === 'chat' || story.isChat === true;
      
      const isBlocked = !isPublished;

      return `
        <div class="story-card ${isScheduled ? 'scheduled' : ''} ${isSoon ? 'soon' : ''} ${isBlocked ? 'blocked' : ''}" 
             data-story-id="${story.id}">
          <div class="story-header">
            <h3 class="story-title">${story.title}</h3>
            <div>
              ${story.episode ? `<span class="story-badge">Эпизод ${story.episode}</span>` : ''}
              ${isChat ? `<span class="story-badge chat">💬 Чат</span>` : ''}
              <span class="story-badge ${isScheduled ? 'scheduled' : ''} ${isSoon ? 'soon' : ''}">
                ${this.getCategoryName(story.category, story.customCategory)}
              </span>
            </div>
          </div>
          <p class="story-desc">${story.description || 'Описание отсутствует'}</p>
          
          <div class="story-meta">
            <div class="story-stats">
              ${story.chaptersCount ? `<div class="stat">📖 ${story.chaptersCount} глав</div>` : ''}
              ${story.messagesCount ? `<div class="stat">💬 ${story.messagesCount} сообщений</div>` : ''}
              ${story.duration ? `<div class="stat">⏱️ ${story.duration} мин</div>` : ''}
            </div>
            <span class="${isScheduled ? 'status-scheduled' : isSoon ? 'status-soon' : 'status-published'}">
              ${isScheduled ? '⏰ Ожидание' : isSoon ? '🕐 Скоро' : '✅ Опубликовано'}
            </span>
          </div>
          
          ${isBlocked ? `
            <div class="blocked-overlay">
              <div class="blocked-message">
                <h4>⏳ Еще не доступно</h4>
                <p>Ожидайте выхода, а пока можете посмотреть другие наши истории</p>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  getCategoryName(category, customCategory) {
    const categories = {
      'fantasy': '🧙 Фэнтези',
      'sci-fi': '🚀 Научная фантастика', 
      'horror': '👻 Хоррор',
      'adventure': '🗺️ Приключения',
      'mystery': '🕵️ Мистика',
      'chat': '💬 Чат-истории'
    };
    return customCategory || categories[category] || category;
  }

  updateStoriesCount(count) {
    const countElement = document.getElementById('storiesCount');
    if (countElement) {
      const word = this.getStoriesWord(count);
      countElement.textContent = `${count} ${word}`;
    }
  }

  getStoriesWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'история';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'истории';
    return 'историй';
  }

  setupEventListeners() {
    document.getElementById('btnAdmin')?.addEventListener('click', () => {
      window.open('admin.html', '_blank');
    });

    document.addEventListener('click', (e) => {
      const storyCard = e.target.closest('.story-card');
      if (storyCard && !storyCard.classList.contains('blocked')) {
        const storyId = storyCard.dataset.storyId;
        if (storyId) {
          this.openStory(storyId);
        }
      } else if (storyCard && storyCard.classList.contains('blocked')) {
        this.showBlockedMessage();
      }
    });
  }

  openStory(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (!story) {
      console.warn('История не найдена:', storyId);
      return;
    }

    if (!story.published) {
      this.showBlockedMessage();
      return;
    }

    window.open(`reader.html?story=${storyId}`, '_blank');
  }

  showBlockedMessage() {
    alert('Ой! Данный эпизод еще не доступен, ожидайте выхода, а пока можете посмотреть другие наши истории и эпизоды.');
  }

  showError(message) {
    const container = document.getElementById('storiesList');
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ff6b6b;">
          <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
          <h3 style="margin-bottom: 10px;">Ошибка загрузки</h3>
          <p>${message}</p>
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new PublicApp();
});