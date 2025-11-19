class AdminPanel {
  constructor() {
    this.stories = [];
    this.currentStory = null;
    this.characters = [];
    this.messages = [];
    this.currentEditingMessage = null;
    this.currentEditingCharacter = null;
    this.draggedMessage = null;
    
    this.adminPassword = "1111";
    this.currentFilter = 'all';
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.showLoginScreen();
    this.initDragAndDrop();
  }

  // 🔥 ДОБАВЛЯЕМ ВСЕ НЕОБХОДИМЫЕ МЕТОДЫ

  async loadData() {
    try {
      console.log('🔄 Загрузка данных админки...');
      const storiesSnapshot = await db.collection('stories').orderBy('createdAt', 'desc').get();
      this.stories = storiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Загружено историй:', this.stories.length);
      this.renderStories();
      
    } catch (error) {
      console.error('❌ Ошибка загрузки:', error);
      alert('❌ Ошибка загрузки данных');
    }
  }

  renderStories() {
    const container = document.getElementById('storiesList');
    if (!container) return;

    if (this.stories.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">
          <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
          <h3 style="color: var(--text-secondary); margin-bottom: 10px;">Историй пока нет</h3>
          <p>Создайте первую историю через конструктор</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.stories.map(story => {
      const isScheduled = story.publishDate && new Date(story.publishDate) > new Date() && !story.published;
      const isSoon = !story.published && !story.publishDate;
      const isPublished = story.published === true;
      const isHidden = story.isPublic === false;

      return `
        <div class="story-card ${isScheduled ? 'scheduled' : ''} ${isSoon ? 'soon' : ''}">
          <div class="story-header">
            <h3 class="story-title">${story.title || 'Без названия'}</h3>
            <div class="story-meta">
              <span class="badge category">${this.getCategoryName(story.category, story.customCategory)}</span>
              ${story.episode ? `<span class="badge episode">Эпизод ${story.episode}</span>` : ''}
              <span class="badge status-${this.getStatusType(story)}">${this.getStatusText(story)}</span>
              ${isHidden ? `<span class="badge status-hidden">👻 Скрыто</span>` : ''}
            </div>
          </div>
          <p class="story-desc">${story.description || 'Описание отсутствует'}</p>
          ${story.publishDate ? `
            <div class="story-date">
              🗓️ ${this.getStoryDate(story.publishDate).toLocaleString()}
            </div>
          ` : ''}
          <div class="story-actions">
            <button class="btn btn-secondary btn-small" onclick="adminPanel.editStory('${story.id}')">✏️ Редактировать</button>
            <button class="btn btn-danger btn-small" onclick="adminPanel.deleteStoryPrompt('${story.id}')">🗑️ Удалить</button>
            ${!story.published && !story.publishDate ? 
              `<button class="btn btn-small" onclick="adminPanel.publishNow('${story.id}')">🚀 Опубликовать</button>` : ''}
            ${story.publishDate && new Date(story.publishDate) > new Date() ? 
              `<button class="btn btn-warning btn-small" onclick="adminPanel.publishNow('${story.id}')">🚀 Опубликовать сейчас</button>` : ''}
            ${isHidden ? 
              `<button class="btn btn-success btn-small" onclick="adminPanel.toggleVisibility('${story.id}', true)">👁️ Показать</button>` :
              `<button class="btn btn-secondary btn-small" onclick="adminPanel.toggleVisibility('${story.id}', false)">👻 Скрыть</button>`
            }
            <button class="btn btn-info btn-small" onclick="adminPanel.openConstructor('${story.id}')">🛠️ Конструктор</button>
          </div>
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

  getStatusType(story) {
    if (story.published) return 'published';
    if (story.publishDate && new Date(story.publishDate) > new Date()) return 'scheduled';
    return 'soon';
  }

  getStatusText(story) {
    if (story.published) return '✅ Опубликовано';
    if (story.publishDate && new Date(story.publishDate) > new Date()) {
      const date = this.getStoryDate(story.publishDate);
      return `⏰ ${date.toLocaleDateString()}`;
    }
    return '🕐 Скоро';
  }

  getStoryDate(date) {
    return date?.toDate ? date.toDate() : new Date(date);
  }

  // 🔥 УПРАВЛЕНИЕ ИСТОРИЯМИ

  editStory(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (story) {
      alert(`Редактирование истории: ${story.title}\n\nЭта функция в разработке. Используйте конструктор для редактирования контента.`);
    }
  }

  deleteStoryPrompt(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (!story) return;

    if (confirm(`Удалить историю "${story.title}"? Это действие нельзя отменить.`)) {
      this.deleteStory(storyId);
    }
  }

  async deleteStory(storyId) {
    try {
      await db.collection('stories').doc(storyId).delete();
      
      // Также удаляем связанные данные
      await this.deleteStoryData(storyId);
      
      await this.loadData();
      alert('🗑️ История удалена');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('❌ Ошибка удаления истории');
    }
  }

  async deleteStoryData(storyId) {
    try {
      // Удаляем персонажей
      const charactersSnapshot = await db.collection('story_characters')
        .where('storyId', '==', storyId)
        .get();
      
      const characterDeletes = charactersSnapshot.docs.map(doc => 
        db.collection('story_characters').doc(doc.id).delete()
      );

      // Удаляем главы
      const chaptersSnapshot = await db.collection('story_chapters')
        .where('storyId', '==', storyId)
        .get();
      
      const chapterDeletes = chaptersSnapshot.docs.map(doc => 
        db.collection('story_chapters').doc(doc.id).delete()
      );

      // Удаляем сообщения
      const messagesSnapshot = await db.collection('chat_messages')
        .where('storyId', '==', storyId)
        .get();
      
      const messageDeletes = messagesSnapshot.docs.map(doc => 
        db.collection('chat_messages').doc(doc.id).delete()
      );

      // Выполняем все удаления
      await Promise.all([...characterDeletes, ...chapterDeletes, ...messageDeletes]);
      
    } catch (error) {
      console.error('Ошибка удаления связанных данных:', error);
    }
  }

  async publishNow(storyId) {
    try {
      await db.collection('stories').doc(storyId).update({
        published: true,
        publishDate: null,
        updatedAt: new Date()
      });
      await this.loadData();
      alert('✅ История опубликована!');
    } catch (error) {
      alert('❌ Ошибка публикации');
    }
  }

  async toggleVisibility(storyId, isPublic) {
    try {
      await db.collection('stories').doc(storyId).update({
        isPublic: isPublic,
        updatedAt: new Date()
      });
      await this.loadData();
      alert(`✅ История ${isPublic ? 'опубликована' : 'скрыта'}!`);
    } catch (error) {
      alert('❌ Ошибка изменения видимости');
    }
  }

  // 🔥 КОНСТРУКТОР ИСТОРИЙ

  openConstructor(storyId) {
    this.currentStory = this.stories.find(s => s.id === storyId);
    if (this.currentStory) {
      this.switchTab('constructor');
      this.loadConstructorData(storyId);
    }
  }

  async loadConstructorData(storyId) {
    if (!storyId) return;

    try {
      console.log('🔄 Загрузка данных конструктора...');

      // Загружаем персонажей
      const charactersSnapshot = await db.collection('story_characters')
        .where('storyId', '==', storyId)
        .get();
      this.characters = charactersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Загружаем сообщения
      const messagesSnapshot = await db.collection('chat_messages')
        .where('storyId', '==', storyId)
        .orderBy('order')
        .get();
      this.messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('✅ Персонажей:', this.characters.length);
      console.log('✅ Сообщений:', this.messages.length);

      this.renderCharacters();
      this.renderMessages();
      this.updatePreview();

    } catch (error) {
      console.error('Ошибка загрузки конструктора:', error);
      alert('❌ Ошибка загрузки данных конструктора');
    }
  }

  renderCharacters() {
    const container = document.getElementById('characterList');
    const select = document.getElementById('messageCharacter');
    
    if (!container) return;

    container.innerHTML = '';
    if (select) select.innerHTML = '<option value="">Выберите персонажа</option>';

    this.characters.forEach(character => {
      // Список персонажей
      if (container) {
        const characterElement = document.createElement('div');
        characterElement.className = 'character-item';
        characterElement.innerHTML = `
          <div class="character-header">
            <div class="character-avatar" style="background: ${character.color || '#6366f1'}">
              ${character.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="character-name">${character.name}</div>
              <div class="character-role">${character.bio || 'Персонаж'}</div>
            </div>
          </div>
        `;
        characterElement.addEventListener('click', () => this.editCharacter(character.id));
        container.appendChild(characterElement);
      }

      // Опции для выбора
      if (select) {
        const option = document.createElement('option');
        option.value = character.id;
        option.textContent = character.name;
        select.appendChild(option);
      }
    });

    // Если персонажей нет, показываем сообщение
    if (this.characters.length === 0 && container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          <div>👥</div>
          <p>Персонажей пока нет</p>
        </div>
      `;
    }
  }

  renderMessages() {
    const container = document.getElementById('messageList');
    if (!container) return;

    container.innerHTML = '';

    // Сортируем сообщения по порядку
    const sortedMessages = this.messages.sort((a, b) => (a.order || 0) - (b.order || 0));

    sortedMessages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message-editor-item';
      messageElement.draggable = true;
      messageElement.dataset.messageId = message.id;

      const character = this.characters.find(c => c.id === message.characterId);
      const typeBadge = this.getMessageTypeBadge(message.type);

      messageElement.innerHTML = `
        <div class="message-header">
          <span class="message-type-badge ${typeBadge.class}">${typeBadge.text}</span>
          <div class="message-actions">
            <button class="btn-small" onclick="adminPanel.editMessage('${message.id}')">✏️</button>
            <button class="btn-small btn-danger" onclick="adminPanel.deleteMessage('${message.id}')">🗑️</button>
          </div>
        </div>
        <div class="message-content-preview">${message.content}</div>
        <div class="message-meta">
          <span>${character ? character.name : 'Система'}</span>
          <span>Задержка: ${message.delay || 2000}мс</span>
          <span>Порядок: ${message.order || 1}</span>
        </div>
      `;

      // Drag events
      messageElement.addEventListener('dragstart', (e) => {
        this.draggedMessage = message.id;
        messageElement.classList.add('dragging');
      });

      messageElement.addEventListener('dragend', () => {
        messageElement.classList.remove('dragging');
        this.draggedMessage = null;
      });

      container.appendChild(messageElement);
    });

    // Добавляем drop zone
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.id = 'dropZone';
    dropZone.innerHTML = 'Перетащите сообщения сюда для изменения порядка';
    container.appendChild(dropZone);

    // Если сообщений нет, показываем сообщение
    if (this.messages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          <div>💭</div>
          <p>Сообщений пока нет</p>
          <p>Добавьте первое сообщение</p>
        </div>
      `;
    }
  }

  getMessageTypeBadge(type) {
    const types = {
      'text': { class: 'badge-text', text: '💬 Текст' },
      'thought': { class: 'badge-thought', text: '🤔 Мысль' },
      'system': { class: 'badge-system', text: '⚙️ Система' }
    };
    return types[type] || types.text;
  }

  updatePreview() {
    const container = document.getElementById('previewMessages');
    if (!container) return;

    container.innerHTML = '';

    // Сортируем сообщения по порядку
    const sortedMessages = this.messages.sort((a, b) => (a.order || 0) - (b.order || 0));

    sortedMessages.forEach(message => {
      const messageElement = document.createElement('div');
      const character = this.characters.find(c => c.id === message.characterId);
      
      let messageClass = 'message-preview other';
      if (message.type === 'system') messageClass = 'message-preview system';
      else if (message.type === 'thought') messageClass = 'message-preview thought';

      messageElement.className = messageClass;
      messageElement.innerHTML = `
        <div class="message-bubble-preview">${message.content}</div>
      `;

      container.appendChild(messageElement);
    });

    // Прокрутка к последнему сообщению
    container.scrollTop = container.scrollHeight;

    // Если сообщений нет, показываем заглушку
    if (this.messages.length === 0) {
      container.innerHTML = `
        <div class="message-preview system">
          <div class="message-bubble-preview">Добавьте сообщения чтобы увидеть предпросмотр</div>
        </div>
      `;
    }
  }

  // 🔥 DRAG & DROP

  initDragAndDrop() {
    const messageList = document.getElementById('messageList');
    if (!messageList) return;

    messageList.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dropZone = document.getElementById('dropZone');
      if (dropZone) dropZone.classList.add('active');
    });

    messageList.addEventListener('dragleave', () => {
      const dropZone = document.getElementById('dropZone');
      if (dropZone) dropZone.classList.remove('active');
    });

    messageList.addEventListener('drop', (e) => {
      e.preventDefault();
      const dropZone = document.getElementById('dropZone');
      if (dropZone) dropZone.classList.remove('active');
      
      if (this.draggedMessage) {
        this.reorderMessage(this.draggedMessage);
      }
    });
  }

  async reorderMessage(messageId) {
    try {
      const message = this.messages.find(m => m.id === messageId);
      if (!message) return;

      // Обновляем порядок всех сообщений
      const updates = this.messages.map((msg, index) => ({
        ...msg,
        order: index + 1
      }));

      // Сохраняем изменения в Firebase
      const batch = db.batch();
      updates.forEach(msg => {
        const ref = db.collection('chat_messages').doc(msg.id);
        batch.update(ref, { order: msg.order });
      });

      await batch.commit();
      await this.loadConstructorData(this.currentStory?.id);
      
    } catch (error) {
      console.error('Ошибка изменения порядка:', error);
      alert('❌ Ошибка изменения порядка сообщений');
    }
  }

  // 🔥 ФОРМЫ РЕДАКТИРОВАНИЯ

  showCharacterForm(characterId = null) {
    this.currentEditingCharacter = characterId;
    
    if (characterId) {
      const character = this.characters.find(c => c.id === characterId);
      alert(`Редактирование персонажа: ${character?.name}\n\nЭта функция в разработке.`);
    } else {
      alert('Создание нового персонажа\n\nЭта функция в разработке.');
    }
  }

  showMessageForm(messageId = null) {
    this.currentEditingMessage = messageId;
    const form = document.getElementById('messageForm');
    const deleteBtn = document.getElementById('btnDeleteMessage');

    if (!form) return;

    if (messageId) {
      const message = this.messages.find(m => m.id === messageId);
      if (message) {
        document.getElementById('messageType').value = message.type || 'text';
        document.getElementById('messageCharacter').value = message.characterId || '';
        document.getElementById('messageContent').value = message.content || '';
        document.getElementById('messageDelay').value = message.delay || 2000;
        document.getElementById('messageOrder').value = message.order || 1;
        if (deleteBtn) deleteBtn.style.display = 'block';
      }
    } else {
      // Новая форма
      document.getElementById('messageType').value = 'text';
      document.getElementById('messageCharacter').value = '';
      document.getElementById('messageContent').value = '';
      document.getElementById('messageDelay').value = 2000;
      document.getElementById('messageOrder').value = this.messages.length + 1;
      if (deleteBtn) deleteBtn.style.display = 'none';
    }

    form.style.display = 'block';
  }

  hideMessageForm() {
    const form = document.getElementById('messageForm');
    if (form) form.style.display = 'none';
    this.currentEditingMessage = null;
  }

  async saveMessage() {
    const formData = {
      type: document.getElementById('messageType').value,
      characterId: document.getElementById('messageCharacter').value || null,
      content: document.getElementById('messageContent').value.trim(),
      delay: parseInt(document.getElementById('messageDelay').value) || 2000,
      order: parseInt(document.getElementById('messageOrder').value) || 1,
      storyId: this.currentStory?.id,
      updatedAt: new Date()
    };

    if (!formData.content) {
      alert('Введите текст сообщения');
      return;
    }

    if (!formData.storyId) {
      alert('Сначала выберите историю');
      return;
    }

    try {
      if (this.currentEditingMessage) {
        // Редактирование существующего сообщения
        await db.collection('chat_messages').doc(this.currentEditingMessage).update(formData);
      } else {
        // Создание нового сообщения
        formData.createdAt = new Date();
        await db.collection('chat_messages').add(formData);
      }

      await this.loadConstructorData(this.currentStory?.id);
      this.hideMessageForm();
      alert('✅ Сообщение сохранено!');

    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('❌ Ошибка сохранения сообщения');
    }
  }

  async deleteMessage(messageId) {
    if (!confirm('Удалить это сообщение?')) return;

    try {
      await db.collection('chat_messages').doc(messageId).delete();
      await this.loadConstructorData(this.currentStory?.id);
      alert('🗑️ Сообщение удалено');
    } catch (error) {
      alert('❌ Ошибка удаления');
    }
  }

  // 🔥 АУТЕНТИФИКАЦИЯ И НАВИГАЦИЯ

  handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    
    if (password === this.adminPassword) {
      this.showAdminInterface();
      this.loadData();
    } else {
      alert('❌ Неверный пароль');
    }
  }

  handleLogout() {
    this.showLoginScreen();
  }

  showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminInterface').style.display = 'none';
  }

  showAdminInterface() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminInterface').style.display = 'block';
  }

  switchTab(tabName) {
    // Обновляем активные табы
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}Tab`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');

    // Загружаем данные для конструктора если переключились на него
    if (tabName === 'constructor' && this.currentStory) {
      this.loadConstructorData(this.currentStory.id);
    }
  }

  // 🔥 EVENT LISTENERS

  setupEventListeners() {
    // Логин
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Навигация по табам
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // Конструктор
    const addCharacterBtn = document.getElementById('btnAddCharacter');
    if (addCharacterBtn) {
      addCharacterBtn.addEventListener('click', () => this.showCharacterForm());
    }

    const addMessageBtn = document.getElementById('btnAddMessage');
    if (addMessageBtn) {
      addMessageBtn.addEventListener('click', () => this.showMessageForm());
    }

    const saveMessageBtn = document.getElementById('btnSaveMessage');
    if (saveMessageBtn) {
      saveMessageBtn.addEventListener('click', () => this.saveMessage());
    }

    const cancelMessageBtn = document.getElementById('btnCancelMessage');
    if (cancelMessageBtn) {
      cancelMessageBtn.addEventListener('click', () => this.hideMessageForm());
    }

    const deleteMessageBtn = document.getElementById('btnDeleteMessage');
    if (deleteMessageBtn) {
      deleteMessageBtn.addEventListener('click', () => {
        if (this.currentEditingMessage) {
          this.deleteMessage(this.currentEditingMessage);
        }
      });
    }

    // Кнопки управления
    const refreshBtn = document.getElementById('btnRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadData());
    }

    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    const backToSiteBtn = document.getElementById('btnBackToSite');
    if (backToSiteBtn) {
      backToSiteBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
  }

  // 🔥 ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ КНОПОК

  editMessage(messageId) {
    this.showMessageForm(messageId);
  }

  editCharacter(characterId) {
    this.showCharacterForm(characterId);
  }
}

// 🔥 ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
document.addEventListener('DOMContentLoaded', () => {
  window.adminPanel = new AdminPanel();
});