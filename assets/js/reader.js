class ChatReader {
  constructor() {
    this.story = null;
    this.chapters = [];
    this.messages = [];
    this.characters = [];
    this.currentChapterIndex = 0;
    this.currentMessageIndex = 0;
    this.isPlaying = false;
    this.playSpeed = 1;
    this.autoPlayDelay = 2000;
    this.currentTimeout = null;
    this.init();
  }

  async init() {
    await this.loadStoryData();
    this.setupEventListeners();
    this.startAutoPlay();
  }

  async loadStoryData() {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('story');
    if (!storyId) { this.showError('История не найдена'); return; }

    try {
      const storyDoc = await db.collection('stories').doc(storyId).get();
      if (!storyDoc.exists) { this.showError('История не найдена'); return; }

      this.story = { id: storyDoc.id, ...storyDoc.data() };
      document.getElementById('chatTitle').textContent = this.story.title;
      document.getElementById('chatStatus').textContent = 'Глава доступна';

      const chaptersSnapshot = await db.collection('story_chapters')
        .where('storyId', '==', storyId)
        .orderBy('chapterNumber')
        .get();
      this.chapters = chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const charactersSnapshot = await db.collection('story_characters')
        .where('storyId', '==', storyId)
        .get();
      this.characters = charactersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (this.chapters.length > 0) {
        await this.loadChapterMessages(this.chapters[0].id);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      this.showError('Ошибка загрузки истории');
    }
  }

  async loadChapterMessages(chapterId) {
    try {
      const messagesSnapshot = await db.collection('chat_messages')
        .where('chapterId', '==', chapterId)
        .orderBy('order')
        .get();
      this.messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.currentMessageIndex = 0;
      this.renderMessages();
    } catch (error) { console.error('Ошибка загрузки сообщений:', error); }
  }

  startAutoPlay() {
    this.isPlaying = true;
    document.getElementById('btnPlayPause').textContent = '⏸️';
    this.playNextMessage();
  }

  playNextMessage() {
    if (!this.isPlaying || this.currentMessageIndex >= this.messages.length) {
      this.isPlaying = false;
      document.getElementById('btnPlayPause').textContent = '▶️';
      return;
    }
    const message = this.messages[this.currentMessageIndex];
    this.displayMessage(message);
    this.currentMessageIndex++;
    this.updateProgress();
    const delay = (message.delay || this.autoPlayDelay) / this.playSpeed;
    this.currentTimeout = setTimeout(() => this.playNextMessage(), delay);
  }

  displayMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageElement = this.createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  createMessageElement(message) {
    const messageDiv = document.createElement('div');
    let messageType = 'other';
    let messageClass = 'message other';
    let avatar = null;

    if (message.type === 'system') { messageType = 'system'; messageClass = 'message system'; }
    else if (message.type === 'thought') { messageType = 'thought'; messageClass = 'message thought'; }
    else if (message.characterId) {
      const character = this.characters.find(c => c.id === message.characterId);
      if (character) { avatar = character.name.charAt(0).toUpperCase(); messageClass = 'message other'; }
    }
    if (message.isUser) { messageType = 'user'; messageClass = 'message user'; avatar = 'Т'; }

    messageDiv.className = messageClass;

    let messageHTML = '';
    if (avatar && messageType !== 'system') {
      messageHTML = `
        <div class="message-with-avatar">
          <div class="message-avatar">${avatar}</div>
          <div class="message-bubble">
            <div class="message-content">${this.formatMessageContent(message.content)}</div>
            <div class="message-time">${this.getCurrentTime()}</div>
          </div>
        </div>`;
    } else {
      messageHTML = `
        <div class="message-bubble">
          <div class="message-content">${this.formatMessageContent(message.content)}</div>
          ${messageType !== 'system' ? `<div class="message-time">${this.getCurrentTime()}</div>` : ''}
        </div>`;
    }
    messageDiv.innerHTML = messageHTML;
    return messageDiv;
  }

  formatMessageContent(content) { return content.replace(/\n/g, '<br>'); }
  getCurrentTime() { const now = new Date(); return now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0'); }

  renderMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    for (let i = 0; i < this.currentMessageIndex; i++) {
      const message = this.messages[i];
      messagesContainer.appendChild(this.createMessageElement(message));
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  updateProgress() {
    const progress = (this.currentMessageIndex / this.messages.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = Math.round(progress) + '%';
  }

  setupEventListeners() {
    document.getElementById('btnBack').addEventListener('click', () => history.back());
    document.getElementById('btnPlayPause').addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) this.startAutoPlay();
      else { clearTimeout(this.currentTimeout); document.getElementById('btnPlayPause').textContent = '▶️'; }
    });
  }

  showError(text) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = `<div class="loading-state">${text}</div>`;
    document.getElementById('chatStatus').textContent = 'Ошибка';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.chatReader = new ChatReader();
});