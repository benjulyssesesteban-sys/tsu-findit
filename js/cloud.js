/* Shared database layer (Firebase Firestore, free Spark plan).
   Collections: users, posts, messages. One document per record, doc id = record id. */
(function () {
  var cfg = window.FIREBASE_CONFIG, COLS = ['users', 'posts', 'messages'];
  if (!cfg || !window.firebase || !cfg.apiKey || cfg.apiKey.indexOf('PASTE') === 0) { window.Cloud = null; return; }
  if (!firebase.apps.length) firebase.initializeApp(cfg);
  var fs = firebase.firestore(), last = { users: {}, posts: {}, messages: {} }, pending = Promise.resolve();

  function load() {
    return Promise.all(COLS.map(function (c) { return fs.collection(c).get(); })).then(function (snaps) {
      var out = {};
      COLS.forEach(function (c, i) {
        out[c] = []; last[c] = {};
        snaps[i].forEach(function (d) { var r = d.data(); out[c].push(r); last[c][r.id] = JSON.stringify(r); });
        out[c].sort(function (a, b) { return a.id - b.id; });
      });
      return out.users.length ? out : null; // null = empty database, app will seed it
    });
  }

  // Write only the records that changed since the last load/push; delete removed ones.
  function push(db) {
    var batch = fs.batch(), n = 0;
    COLS.forEach(function (c) {
      var seen = {};
      db[c].forEach(function (r) {
        seen[r.id] = 1; var s = JSON.stringify(r);
        if (last[c][r.id] !== s) { batch.set(fs.collection(c).doc(String(r.id)), JSON.parse(s)); last[c][r.id] = s; n++; }
      });
      Object.keys(last[c]).forEach(function (id) {
        if (!seen[id]) { batch.delete(fs.collection(c).doc(String(id))); delete last[c][id]; n++; }
      });
    });
    if (n) pending = pending.then(function () { return batch.commit(); }).catch(function (e) { console.error('Cloud save failed', e); });
  }

  // Wait for in-flight writes (so navigating away does not cancel them).
  function flush() { return pending; }

  window.Cloud = { load: load, push: push, flush: flush };
})();
