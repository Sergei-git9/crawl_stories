<script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js"></script>

<script>
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

function initAuthHeader() {
  const header = document.querySelector('header') || document.body;
  header.innerHTML = `
    <div style="position:sticky;top:0;z-index:1000;background:rgba(2,2,5,0.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,0.1);padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;">
      <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff;">
        <div style="width:48px;height:48px;background:#1a1a1a;border:2px solid #333;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;">CS</div>
        <div style="font-size:24px;font-weight:900;color:#FFE81F;">CRAWL.STORIES</div>
      </a>
      <div id="authControls" style="display:flex;align-items:center;gap:16px;">
        <button id="authBtn" style="background:rgba(255,232,31,0.15);color:#FFE81F;border:1px solid #FFE81F;padding:10px 18px;border-radius:8px;font-family:'Courier New',monospace;font-weight:bold;cursor:pointer;">Войти / Регистрация</button>
        <a href="admin.html" id="adminLink" style="display:none;background:rgba(255,232,31,0.15);color:#FFE81F;border:1px solid #FFE81F;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Админка</a>
      </div>
    </div>
  `;

  const authBtn = document.getElementById('authBtn');
  const adminLink = document.getElementById('adminLink');

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const name = user.displayName || user.email.split('@')[0];
      authBtn.innerHTML = name + ' Выйти';
      authBtn.onclick = () => confirm('Выйти?') && auth.signOut();

      const adminDoc = await db.collection('admins').doc(user.uid).get();
      adminLink.style.display = adminDoc.exists ? 'inline-block' : 'none';
    } else {
      authBtn.textContent = 'Войти / Регистрация';
      authBtn.onclick = () => {
        const isLogin = confirm('Уже есть аккаунт? → ОК = Войти, Отмена = Регистрация');
        const email = prompt('Email:');
        if (!email) return;
        const pass = prompt('Пароль:');
        if (!pass) return;

        if (isLogin) {
          auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
        } else {
          auth.createUserWithEmailAndPassword(email, pass)
            .then(() => alert('Успешно зарегистрирован!'))
            .catch(e => alert(e.message));
        }
      };
      adminLink.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', initAuthHeader);
</script>
