// auth.js — 100% РАБОЧИЙ НА GitHub Pages, Replit, Vercel

// Загружаем Firebase
var script = document.createElement('script');
script.src = 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js';
document.head.appendChild(script);

script = document.createElement('script');
script.src = 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js';
document.head.appendChild(script);

script = document.createElement('script');
script.src = 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js';
document.head.appendChild(script);

script.onload = function() {
  const firebaseConfig = {
    apiKey: "AIzaSyANC4K0-xI-9SvrpoiOp4v-N2XLvCQCALg",
    authDomain: "crawl-stories.firebaseapp.com",
    projectId: "crawl-stories",
    storageBucket: "crawl-stories.firebasestorage.app",
    messagingSenderId: "886479757650",
    appId: "1:886479757650:web:194ad1dd2d02c959bdda8b"
  };

  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  window.auth = firebase.auth();

  // Запускаем авторизацию
  initAuth();
};

function initAuth() {
  const header = document.querySelector('header');
  if (!header) return;

  header.innerHTML = `
    <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff;">
      <div style="width:48px;height:48px;background:#1a1a1a;border:2px solid #333;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;">CS</div>
      <div style="font-size:24px;font-weight:900;color:#FFE81F;">CRAWL.STORIES</div>
    </a>
    <div style="display:flex;gap:16px;align-items:center;">
      <button id="loginBtn" style="background:rgba(255,232,31,0.15);color:#FFE81F;border:1px solid #FFE81F;padding:10px 18px;border-radius:8px;font-family:'Courier New',monospace;font-weight:bold;cursor:pointer;">Войти</button>
      <a href="admin.html" id="adminBtn" style="display:none;background:rgba(255,232,31,0.15);color:#FFE81F;border:1px solid #FFE81F;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Админка</a>
    </div>
  `;

  const loginBtn = document.getElementById('loginBtn');
  const adminBtn = document.getElementById('adminBtn');

  auth.onAuthStateChanged(user => {
    if (user) {
      const name = user.email.split('@')[0];
      loginBtn.innerHTML = name + ' Выйти';
      loginBtn.onclick = () => confirm('Выйти?') && auth.signOut();

      db.collection('admins').doc(user.uid).get().then(doc => {
        if (doc.exists) adminBtn.style.display = 'inline-block';
      });
    } else {
      loginBtn.textContent = 'Войти / Регистрация';
      loginBtn.onclick = () => {
        const login = confirm('ОК — Войти, Отмена — Регистрация');
        const email = prompt('Email:');
        if (!email) return;
        const pass = prompt('Пароль:');
        if (!pass) return;

        if (login) {
          auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
        } else {
          auth.createUserWithEmailAndPassword(email, pass)
            .then(() => alert('Зарегистрирован!'))
            .catch(e => alert(e.message));
        }
      };
      adminBtn.style.display = 'none';
    }
  });
}
