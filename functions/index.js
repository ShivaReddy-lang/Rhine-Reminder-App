// functions/index.js - Scheduled Cloud Function to send due reminders via FCM
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.sendDueReminders = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const q = db.collection('reminders').where('sent','==',false).where('datetime','<=', now).limit(500);
  const snap = await q.get();
  if (snap.empty) return null;

  const tasks = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const uid = data.uid;
    const text = data.text || 'Reminder';
    const userDoc = await db.collection('users').doc(uid).get();
    const tokens = userDoc.exists ? userDoc.data().fcmTokens || [] : [];
    if (!tokens.length) {
      await doc.ref.update({sent:true});
      continue;
    }
    const payload = {
      notification: { title: 'Reminder', body: text },
      data: { reminderId: doc.id }
    };
    tasks.push(admin.messaging().sendToDevice(tokens, payload).then(async (resp) => {
      // optional: remove invalid tokens here based on resp.results
      await doc.ref.update({sent:true});
    }).catch(async (err) => {
      console.error('send error', err);
      await doc.ref.update({sent:true});
    }));
  }
  await Promise.all(tasks);
  return null;
});