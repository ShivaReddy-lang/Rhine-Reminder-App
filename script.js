// script.js - Rhine Reminder App (client side)
// IMPORTANT: paste your Firebase SDK config into firebase-config.js before using
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const messaging = firebase.messaging();

// handle redirect result (Google sign-in)
auth.getRedirectResult().then(result => {
  if (result && result.user) {
    window.location.href = 'dashboard.html';
  }
}).catch(e => console.warn('redirect error', e));

// --- Auth UI wiring ---
if (document.getElementById('googleSignIn')) {
  const googleBtn = document.getElementById('googleSignIn');
  const emailSignUp = document.getElementById('emailSignUp');
  const emailSignIn = document.getElementById('emailSignIn');

  googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithRedirect(provider);
  };

  emailSignUp.onclick = () => {
    const email = document.getElementById('email').value;
    const pw = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email,pw).catch(err=>alert(err.message));
  };

  emailSignIn.onclick = () => {
    const email = document.getElementById('email').value;
    const pw = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email,pw).catch(err=>alert(err.message));
  };
}

// --- auth state monitoring ---
auth.onAuthStateChanged(async user => {
  if (user) {
    // request notifications permission and get FCM token
    try {
      await messaging.requestPermission();
    } catch(e) {
      console.warn('notif permission denied', e);
    }
    try {
      const token = await messaging.getToken();
      if (token) {
        await db.collection('users').doc(user.uid).set({
          fcmTokens: firebase.firestore.FieldValue.arrayUnion(token)
        }, {merge:true});
      }
    } catch(e){ console.warn('get token failed', e) }

    // auto-route to dashboard if currently on login
    if (location.pathname.endsWith('index.html') || location.pathname.endsWith('/')) {
      location.href = 'dashboard.html';
    }
    // if on dashboard, init UI
    if (location.pathname.endsWith('dashboard.html')) {
      initDashboard();
    }
    if (location.pathname.endsWith('reminders.html')) {
      loadAllReminders();
    }
  } else {
    // if not logged in, go to login page (unless already there)
    if (!location.pathname.endsWith('index.html') && !location.pathname.endsWith('/')) {
      location.href = 'index.html';
    }
  }
});

function qs(id){ return document.getElementById(id); }

// --- Dashboard logic ---
function initDashboard(){
  const newBtn = qs('newReminderBtn');
  const addPanel = qs('addPanel');
  const saveBtn = qs('saveRem');
  const cancelBtn = qs('cancelRem');
  const openReminders = qs('openReminders');
  const preview = qs('remindersPreview');

  const fakeDate = qs('fakeDate');
  const realDate = qs('rDate');
  if (fakeDate && realDate) {
    fakeDate.onclick = () => realDate.click();
    realDate.onchange = () => {
      if (realDate.value) {
        const d = new Date(realDate.value);
        fakeDate.textContent = d.toLocaleString();
      }
    };
  }

  newBtn.onclick = () => { addPanel.hidden = false; };
  cancelBtn.onclick = () => { addPanel.hidden = true; };

  saveBtn.onclick = async () => {
    const text = qs('rText').value.trim();
    const datev = qs('rDate').value;
    if (!text || !datev) return alert('Fill both fields');
    const user = auth.currentUser;
    if (!user) return alert('Not signed in');
    const dt = new Date(datev);
    await db.collection('reminders').add({
      uid: user.uid,
      text,
      datetime: firebase.firestore.Timestamp.fromDate(dt),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      sent: false
    });
    qs('rText').value='';
    qs('rDate').value='';
    qs('fakeDate').textContent='Choose date & time';
    addPanel.hidden = true;
  };

  openReminders.onclick = () => location.href = 'reminders.html';

  const user = auth.currentUser;
  if (user) {
    db.collection('reminders').where('uid','==',user.uid).orderBy('datetime').limit(4)
      .onSnapshot(snap => {
        preview.innerHTML = '';
        snap.forEach(doc => {
          const d = doc.data();
          const el = document.createElement('div'); el.className='reminder-card';
          el.innerHTML = `<strong>${escapeHtml(d.text)}</strong><div class="reminder-time">${d.datetime.toDate().toLocaleString()}</div>`;
          preview.appendChild(el);
        });
      });
  }

  qs('logoutBtn').onclick = ()=> auth.signOut().then(()=>location.href='index.html');
  qs('aboutBtn').onclick = ()=> location.href='about.html';
}

// --- Reminders page load all reminders ---
function loadAllReminders(){
  const list = qs('remindersList'), showSent = qs('showSent');
  list.innerHTML = '';
  const user = auth.currentUser;
  if (!user) return;
  const q = db.collection('reminders').where('uid','==',user.uid).orderBy('datetime');
  q.onSnapshot(snap => {
    list.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const el = document.createElement('div'); el.className='reminder-card';
      el.innerHTML = `<h4>${escapeHtml(d.text)}</h4><small class="reminder-time">${d.datetime.toDate().toLocaleString()}</small>
        <div class="reminder-actions"><button onclick="editReminder('${doc.id}')">Edit</button><button onclick="deleteReminder('${doc.id}')">Delete</button></div>`;
      if (d.sent && !showSent.checked) return;
      list.appendChild(el);
    });
  });
  qs('logout2').onclick = ()=> auth.signOut().then(()=>location.href='index.html');
}

window.editReminder = async (id) => {
  const doc = await db.collection('reminders').doc(id).get();
  const d = doc.data();
  const newText = prompt('Edit text', d.text);
  const newDate = prompt('Edit date (YYYY-MM-DDTHH:MM)', new Date(d.datetime.toDate()).toISOString().slice(0,16));
  if (newText) await doc.ref.update({text:newText, datetime: firebase.firestore.Timestamp.fromDate(new Date(newDate)), sent:false});
};
window.deleteReminder = async (id) => {
  if (!confirm('Delete?')) return;
  await db.collection('reminders').doc(id).delete();
};

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"'`=\/]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;','/':'&#47;'}[c])); }

// foreground messaging (when site is open)
messaging.onMessage(payload => {
  try {
    const n = payload.notification || {};
    // show simple in-page notification fallback
    alert((n.title||'Notification') + '\n' + (n.body||''));
  } catch(e) { console.warn(e); }
});
