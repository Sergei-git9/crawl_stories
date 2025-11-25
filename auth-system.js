// auth-system.js — ЧИСТЫЙ JAVASCRIPT, БЕЗ HTML-ТЕГОВ!

// Подключаем Firebase
import "https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js";
import "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js";

// Конфиг
const firebaseConfig = {
  apiKey: "AIzaSyANC4K0-xI-9SvrpoiOp4v-N2XLvCQCALg",
  authDomain: "crawl-stories.firebaseapp.com",
  projectId: "crawl-stories",
  storageBucket: "crawl-stories.firebasestorage.app",
  messagingSenderId: "886479757650",
  appId: "1:886479757650:web:194ad1dd2d02c959bdda8b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Основная функция — запускается на всех страницах
function initAuthSystem() {
  const header = document.querySelector('header');
  if (!header) return;

  header.innerHTML = `
    <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff;">
      <div style="width:48px;height:48px;background:#1a1a1a;border:2px solid #333;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;">CS</div>
      <div style="font-size:24px;font-weight:900;color:#FFE81F;">CRAWL.STORIES</div>
    </a>
    <div id="authControls" style="display:flex;gap:16px;align-items:center;">
      <button id="authBtn" style="background:rgba(255,232,31,0.15);color:#FFE81F;border:1px solid #FFE81F;padding:10px 18px;border-radius:8px;font-family:'Courier New',monospace;font-weight:bold;cursor:pointer;">Войти</button>
      <a href="admin.html" id="adminLink" style="display:none;background:rgba(255,232,31,0.15);color:#FFE81F;border:1px solid #FFE81F;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Админка</a>
    </div>
  `;

  const authBtn = document.getElementById('authBtn');
  const adminLink = document.getElementById('adminLink');

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const name = user.displayName || user.email.split('@')[0];
      authBtn.innerHTML = `${name} Выйти`;
      authBtn.onclick = () => confirm('Выйти?') && auth.signOut();

      try {
        const adminDoc = await db.collection('admins').doc(user.uid).get();
        adminLink.style.display = adminDoc.exists ? 'inline-block' : 'none';
      } catch (e) {
        console.error("Ошибка проверки админа:", e);
      }
    } else {
      authBtn.textContent = 'Войти / Регистрация';
      authBtn.onclick = () => {
        const isLogin = confirm('ОК — Войти, Отмена — Регистрация');
        const email = prompt('Email:');
        if (!email) return;
        const pass = prompt('Пароль:');
        if (!pass) return;

        if (isLogin) {
          auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
        } else {
          auth.createUserWithEmailAndPassword(email, pass)
            .then(() => alert('Зарегистрирован! Теперь войди.'))
            .catch(e => alert(e.message));
        }
      };
      adminLink.style.display = 'none';
    }
  });
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', initAuthSystem);

// Делаем db доступным для других скриптов (важно!)
window.db = db;
window.auth = auth;
