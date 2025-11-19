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

  initDragAndDrop() {
    const messageList = document.getElementById('messageList');
    const dropZone = document.getElementById('dropZone');

    messageList.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('active');
    });

    messageList.addEventListener('dragleave', () => {
      dropZone.classList.remove('active');
    });

    messageList.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('active');
      
      if (this.draggedMessage) {
        this.reorderMessage(this.draggedMessage);
      }
    });
  }

  setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    document.getElementById('btnAddCharacter').addEventListener('click', () => this.showCharacterForm());
    document.getElementById('btnAddMessage').addEventListener('click', () => this.showMessageForm());
    document.getElementById('btnSaveMessage').addEventListener('click', () => this.saveMessage());
    document.getElementById('btnCancelMessage').addEventListener('click', () => this.hideMessageForm());
    document.getElementById('btnDeleteMessage').addEventListener('click', () => this.deleteMessage());
  }

  async loadConstructorData(storyId) {
    if (!storyId) return;

    try {
      const charactersSnapshot = await db.collection('story_characters')
        .where('storyId', '==', storyId)
        .get();
      this.characters = charactersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const messagesSnapshot = await db.collection('chat_messages')
        .where('storyId', '==', storyId)
        .orderBy('order')
        .get();
      this.messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.renderCharacters();
      this.renderMessages();
      this.updatePreview();

    } catch (error) {
      console.error('Ошибка загрузки конструктора:', error);
    }
  }

  renderCharacters() {
    const container = document.getElementById('characterList');
    const select = document.getElementById('messageCharacter');
    
    container.innerHTML = '';
    select.innerHTML = '<option value="">Выберите персонажа</option>';

    this.characters.forEach(character => {
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

      const option = document.createElement('option');
      option.value = character.id;
      option.textContent = character.name;
      select.appendChild(option);
    });
  }

  renderMessages() {
    const container = document.getElementById('messageList');
    container.innerHTML = '';

    this.messages.sort((a, b) => a.order - b.order).forEach(message => {
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
        </div>
      `;

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

    container.innerHTML += `
      <div class="drop-zone" id="dropZone">
        Перетащите сообщения сюда для изменения порядка
      </div>
    `;
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
    container.innerHTML = '';

    this.messages.sort((a, b) => a.order - b.order).forEach(message => {
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

    container.scrollTop = container.scrollHeight;
  }

  showMessageForm(messageId = null) {
    this.currentEditingMessage = messageId;
    const form = document.getElementById('messageForm');
    const deleteBtn = document.getElementById('btnDeleteMessage');

    if (messageId) {
      const message = this.messages.find(m => m.id === messageId);
      if (message) {
        document.getElementById('messageType').value = message.type;
        document.getElementById('messageCharacter').value = message.characterId || '';
        document.getElementById('messageContent').value = message.content;
        document.getElementById('messageDelay').value = message.delay || 2000;
        document.getElementById('messageOrder').value = message.order || 1;
        deleteBtn.style.display = 'block';
      }
    } else {
      document.getElementById('messageForm').reset();
      document.getElementById('messageOrder').value = this.messages.length + 1;
      deleteBtn.style.display = 'none';
    }

    form.style.display = 'block';
  }

  hideMessageForm() {
    document.getElementById('messageForm').style.display = 'none';
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

    try {
      if (this.currentEditingMessage) {
        await db.collection('chat_messages').doc(this.currentEditingMessage).update(formData);
      } else {
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

  async reorderMessage(messageId) {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      const updates = this.messages.map((msg, index) => ({
        ...msg,
        order: index + 1
      }));

      const batch = db.batch();
      updates.forEach(msg => {
        const ref = db.collection('chat_messages').doc(msg.id);
        batch.update(ref, { order: msg.order });
      });

      await batch.commit();
      await this.loadConstructorData(this.currentStory?.id);
    }
  }

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

  switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');

    if (tabName === 'constructor' && this.currentStory) {
      this.loadConstructorData(this.currentStory.id);
    }
  }

  showAdminInterface() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminInterface').style.display = 'block';
  }

  showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminInterface').style.display = 'none';
  }
}

window.adminPanel = new AdminPanel();