// auth-system.js — 100% РАБОЧАЯ ВЕРСИЯ БЕЗ import И module

// Загружаем Firebase напрямую
const firebaseScript = document.createElement('script');
firebaseScript.src = 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js';
document.head.appendChild(firebaseScript);

const authScript = document.createElement('script');
authScript.src = 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js';
document.head.appendChild(authScript);

const firestoreScript = document.createElement('script');
firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js';
document.head.appendChild(firestoreScript);

// Ждём, пока всё загрузится
firestoreScript.onload = () => {
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
  initAuthHeader();
};

function initAuthHeader() {
  const header = document.querySelector('header');
  if (!header) return;

  header.innerHTML = `
    <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff;">
      <div style="width:48px;height:48px;background:#1a1a1a;border:2px solid #333;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;">CS</div>
      <div style="font-size:24px;font-weight:900;color:#FFE81F;">CRAWL.STORIES</div>
    </a>
    <div style="display:flex;gap:16px;align-items:center;">
      <button id="authBtn" style="background:rgba(255,232,31,0.15);color:#FFE81F;border:1px solid #FFE81F;padding:10px 18px;border-radius:8px;font-family:'Courier New',monospace;font-weight:bold;cursor:pointer;">Войти</button>
      <a href="admin.html" id="adminLink" style="display:none;background:rgba(255,232,31,0.15);color:#FFE81F;border:1px solid #FFE81F;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Админка</a>
    </div>
  `;

  const authBtn = document.getElementById('authBtn');
  const adminLink = document.getElementById('adminLink');

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const name = user.displayName || user.email.split('@')[0];
      authBtn.innerHTML = name + ' Выйти';
      authBtn.onclick = () => confirm('Выйти?') && auth.signOut();

      try {
        const doc = await db.collection('admins').doc(user.uid).get();
        adminLink.style.display = doc.exists ? 'inline-block' : 'none';
      } catch (e) {
        console.error(e);
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
            .then(() => alert('Зарегистрирован!'))
            .catch(e => alert(e.message));
        }
      };
      adminLink.style.display = 'none';
    }
  });
}
