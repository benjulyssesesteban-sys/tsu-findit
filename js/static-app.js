/* TSU FindIt: builds the pages from EJS templates in the browser, so the site
   can be hosted on GitHub Pages. Data is kept in Firebase Firestore (js/cloud.js). */
(window.Cloud ? window.Cloud.load().catch(function (e) { console.error('Cloud load failed', e); window.__cloudFail = true; return null; }) : Promise.resolve(null)).then(function (remote) {
  if (window.__cloudFail) { document.body.innerHTML = '<div style="font-family:sans-serif;max-width:520px;margin:4rem auto;padding:0 1rem"><h1>Cannot reach the shared database</h1><p>Check <code>js/firebase-config.js</code> and that the Firestore rules are published, then reload. Details are in the browser console (F12).</p></div>'; return; }
  var K = 'fi_db_v3', SK = 'fi_user_v1', DOM = 'tsu.edu.ph';
  var RD = { student: 'student.tsu.edu.ph', faculty: 'professor.tsu.edu.ph', staff: 'staff.tsu.edu.ph', admin: 'admin.tsu.edu.ph' };
  var LS = (function () { try { var x = '__t'; window.localStorage.setItem(x, x); window.localStorage.removeItem(x); return window.localStorage; } catch (e) { var m = {}; return { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } }; } })();
  if (/[?&]reset=1/.test(location.search)) { LS.removeItem(SK); location.replace(location.pathname + '?success=' + encodeURIComponent('Local session cleared.')); return; }
  function hash(id, pw) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode('fi1:' + id + ':' + pw)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
  var ts = function () { return new Date().toISOString().slice(0, 19).replace('T', ' '); };
  function seed() {
    var t = ts(), u = function (i, n, e, r, w) { return { id: i, full_name: n, email: e, password: w, role: r, created_at: t }; };
    var p = function (i, uid, ty, n, d, l, dt, tm, st, rv) { return { id: i, user_id: uid, type: ty, item_name: n, description: d, image_path: null, location_text: l, event_date: dt, event_time: tm, status: st, rejection_reason: null, reviewed_by: rv, reviewed_at: rv ? t : null, created_at: t }; };
    var m = function (i, p, s, r, b) { return { id: i, post_id: p, sender_id: s, recipient_id: r, body: b, created_at: t }; };
    return { users: [u(1, 'Romarei Mimura', 'romareimimura@student.tsu.edu.ph', 'student', '41eebae621278f50b63147131098d25fe5f87a5d3380bf5577c36d97fdf95e21'), u(2, 'Ace Tobias', 'acetobias@professor.tsu.edu.ph', 'faculty', '4d7a1d75f22075cbd54d854b9649d3689b36c7ba1d0477582ff26bf617e152a2'), u(3, 'JB Oniate', 'jboniate@staff.tsu.edu.ph', 'staff', '01116fc699d2d57d8da048516b60e471f9dd5db966175a873db84b457e5516bd'), u(4, 'Benj Ulysses Esteban', 'benjesteban@admin.tsu.edu.ph', 'admin', 'ec198af67ac682bb4dd7c9e456fabe6c860b20f6d5fa0a87807f71f3bf1dfb3c')],
      posts: [],
      messages: [] };
  }
  var db = remote; if (!db && !window.Cloud) { try { db = JSON.parse(LS.getItem(K)); } catch (e) {} } if (!db) { db = seed(); save(); }
  function save() { if (window.Cloud) { window.Cloud.push(db); return true; } try { LS.setItem(K, JSON.stringify(db)); return true; } catch (e) { return false; } }
  var U = null; try { U = JSON.parse(LS.getItem(SK)); } catch (e) {}
  if (U && !db.users.some(function (x) { return x.id === U.id && x.email === U.email; })) { U = null; LS.removeItem(SK); }
  var Q = {}; new URLSearchParams(location.search).forEach(function (v, k) { Q[k] = v; });
  var by = function (a, id) { return a.filter(function (x) { return x.id === Number(id); })[0]; };
  var nextId = function (a) { return window.Cloud ? Date.now() * 1000 + Math.floor(Math.random() * 1000) : a.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1; };
  var join = function (p) { var o = by(db.users, p.user_id) || {}; return Object.assign({}, p, { full_name: o.full_name, email: o.email, role: o.role }); };
  var newest = function (a, k) { return a.slice().sort(function (x, y) { return (y[k || 'created_at'] > x[k || 'created_at'] ? 1 : y[k || 'created_at'] < x[k || 'created_at'] ? -1 : y.id - x.id); }); };
  var label = { ACTIVE: 'Active', CLAIMED: 'Claimed', PENDING: 'Pending review', REJECTED: 'Not approved' };
  var msg = function () { return { success: Q.success || null, error: Q.error || null }; };
  var C = { '/': 'index', '/items': 'item' };
  var PATHS = { index: '/', browse: '/browse', item: '/items/x', login: '/login', register: '/register', report: '/report', 'my-posts': '/my-posts', admin: '/admin', messages: '/messages', conversation: '/messages/x', profile: '/profile', 404: '/404' };

  function href(u) {
    if (u === '/') return 'index.html';
    var m;
    if ((m = u.match(/^\/items\/(\d+)$/))) return 'item.html?id=' + m[1];
    if ((m = u.match(/^\/messages\/(\d+)\/(\d+)$/))) return 'conversation.html?p=' + m[1] + '&u=' + m[2];
    if (/^\/(css|images|js)\//.test(u)) return u.slice(1) + (/^\/(css|js)\//.test(u) ? '?v=5' : '');
    return u.slice(1).replace(/^([^?]+)/, '$1.html');
  }
  function go(page, type, text) { var u = page + (type ? (page.indexOf('?') > -1 ? '&' : '?') + type + '=' + encodeURIComponent(text) : ''); (window.Cloud ? window.Cloud.flush() : Promise.resolve()).then(function () { location.href = u; }); }
  var DESC = {index: "TSU FindIt is a moderated lost and found board for Tarlac State University. Search lost items, report found ones, and message the poster.", browse: "Browse approved lost and found items at Tarlac State University. Search by keyword and filter by lost, found, or claimed items.", item: "View the details of a lost or found item on TSU FindIt, including where and when it was reported, and message the person who posted it.", login: "Log in to TSU FindIt with your TSU email to report items, check your posts, and send messages.", register: "Create a TSU FindIt account with your student, faculty, or staff TSU email to report and search lost and found items.", profile: "Update your TSU FindIt display name, TSU email, and password.", report: "Report a lost or found item on TSU FindIt with its details, location, date, and an optional photo. Every post is reviewed before it goes live.", "my-posts": "See your lost and found reports on TSU FindIt and check whether each one is pending, active, claimed, or not approved.", messages: "Read your TSU FindIt conversations with other users about lost and found items.", conversation: "Private conversation on TSU FindIt between two users about a lost or found item.", admin: "Admin review queue for TSU FindIt: approve or reject pending lost and found reports.", "404": "This page was not found on TSU FindIt. Go back to the home page or browse the lost and found items."};
  function clip(x) { x = String(x); return x.length > 158 ? x.slice(0, 155).replace(/\s+\S*$/, '') + '...' : x; }
  function show(view, l) {
    var loc = Object.assign({ user: U, currentPath: PATHS[window.PAGE] || '', config: { TSU_EMAIL_DOMAIN: DOM }, success: null, error: null, description: DESC[window.PAGE] }, l);
    var html = ejs.render(T[view], loc, { includer: function (o) { return { template: T[o] || T['partials/' + o] }; } })
      .replace(/(href|src)="(\/[^"]*)"/g, function (a, at, u) { return at + '="' + href(u) + '"'; })
      .replace(/<form([^>]*?)data-act="\/browse"/g, function (a, pre) { return '<form' + pre + 'data-act="/browse" action="browse.html"'; });
    var ld = document.getElementById('ld'); if (ld && ld.parentNode) ld.parentNode.removeChild(ld);
    document.open(); document.write(html); document.close();
    document.addEventListener('submit', onSubmit);
    try { var cu = new URL(location.href); if (cu.searchParams.has('success') || cu.searchParams.has('error')) { cu.searchParams.delete('success'); cu.searchParams.delete('error'); history.replaceState(null, '', cu.pathname + cu.search + cu.hash); } } catch (e) {}
  }
  function err404(t, m) { show('error', { title: t, message: m, description: DESC['404'] }); }
  function needLogin() { if (!U) { go('login.html', 'error', 'Please log in to continue.'); return true; } }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function future(p) { return !!(p && p.event_date && String(p.event_date) > today()); }
  function visible(p) { return p && (((p.status === 'ACTIVE' || p.status === 'CLAIMED') && !future(p)) || (U && (U.id === p.user_id || U.role === 'admin'))); }

  function route() {
    var pg = window.PAGE, ps = db.posts, posts, p;
    if (pg === 'index') { posts = newest(ps.filter(function (x) { return (x.status === 'ACTIVE' || x.status === 'CLAIMED') && !future(x); })).slice(0, 6).map(join); return show('landing', Object.assign({ title: 'Find what matters', posts: posts }, msg())); }
    if (pg === 'browse') {
      var claimed = Q.status === 'claimed' || Q.status === 'all', q = (Q.q || '').trim().toLowerCase();
      posts = newest(ps.filter(function (x) {
        if (future(x)) return false;
        if (!(claimed ? x.status === 'ACTIVE' || x.status === 'CLAIMED' : x.status === 'ACTIVE')) return false;
        if ((Q.type === 'lost' || Q.type === 'found') && x.type !== Q.type) return false;
        return !q || [x.item_name, x.description, x.location_text].join('\n').toLowerCase().indexOf(q) > -1;
      })).map(join);
      return show('browse', Object.assign({ title: 'Browse items', posts: posts, filters: { q: Q.q || '', type: Q.type || '', showClaimed: claimed } }, msg()));
    }
    if (pg === 'item') { p = by(ps, Q.id); if (!visible(p)) return err404('Post not found', 'That item is not available on the public board.'); return show('item-detail', Object.assign({ title: p.item_name, description: clip((p.type === 'found' ? 'Found' : 'Lost') + ' item: ' + p.item_name + ' at ' + p.location_text + ' on ' + p.event_date + '. Message the poster on TSU FindIt.'), post: join(p), statusLabel: label[p.status] || p.status }, msg())); }
    if (pg === 'login') return show('login', { title: 'Log in', error: Q.error || null, values: { email: '' } });
    if (pg === 'register') return show('register', { title: 'Create an account', error: null, values: { full_name: '', email: '', role: 'student' } });
    if (pg === 'report') { if (needLogin()) return; return show('report-form', { title: 'Report an item', error: null, values: { type: 'lost', item_name: '', description: '', location_text: '', event_date: '', event_time: '' } }); }
    if (pg === 'my-posts') { if (needLogin()) return; return show('my-posts', Object.assign({ title: 'My posts', posts: newest(ps.filter(function (x) { return x.user_id === U.id; })) }, msg())); }
    if (pg === 'admin') {
      if (needLogin()) return; if (U.role !== 'admin') return go('browse.html', 'error', 'Admin access is limited to the seeded admin account.');
      return show('admin-queue', { title: 'Admin review queue', pending: ps.filter(function (x) { return x.status === 'PENDING'; }).sort(function (a, b) { return a.id - b.id; }).map(join).map(function (x) { x.future = future(x); return x; }),
        reviewed: newest(ps.filter(function (x) { return (x.status === 'ACTIVE' || x.status === 'REJECTED') && x.reviewed_at; }), 'reviewed_at').slice(0, 6).map(join), error: Q.error || null, success: Q.success || null, openRejectId: Q.reject_id || null, rejectReason: Q.reason || '' });
    }
    if (pg === 'messages') {
      if (needLogin()) return; var seen = {}, conv = [];
      newest(db.messages, 'id').forEach(function (m) {
        if (m.sender_id !== U.id && m.recipient_id !== U.id) return;
        var o = m.sender_id === U.id ? m.recipient_id : m.sender_id, k = m.post_id + '-' + o; if (seen[k]) return; seen[k] = 1;
        var po = by(ps, m.post_id), ou = by(db.users, o); if (!po || !ou) return;
        conv.push({ post_id: po.id, item_name: po.item_name, image_path: po.image_path, status: po.status, other_user_id: ou.id, other_user_name: ou.full_name, latest_body: m.body, latest_at: m.created_at });
      });
      return show('messages-inbox', Object.assign({ title: 'Messages', conversations: conv }, msg()));
    }
    if (pg === 'conversation') {
      if (needLogin()) return; p = by(ps, Q.p); var o = by(db.users, Q.u);
      if (!p) return err404('Post not found', 'That post does not exist or is no longer available.');
      if (!o || p.status === 'PENDING' || p.status === 'REJECTED' || U.id === o.id || !(p.user_id === U.id || o.id === p.user_id)) return err404('Conversation not found', 'That private conversation is not available.');
      var ms = db.messages.filter(function (m) { return m.post_id === p.id && ((m.sender_id === U.id && m.recipient_id === o.id) || (m.sender_id === o.id && m.recipient_id === U.id)); }).map(function (m) { return Object.assign({ sender_name: by(db.users, m.sender_id).full_name }, m); });
      return show('conversation', Object.assign({ title: 'Conversation about ' + p.item_name, description: clip('Private conversation on TSU FindIt about the ' + (p.type === 'found' ? 'found' : 'lost') + ' item: ' + p.item_name + '.'), post: p, otherUser: o, messages: ms }, msg()));
    }
    if (pg === 'profile') { if (needLogin()) return; var me = by(db.users, U.id); return show('profile', Object.assign({ title: 'Your profile', user: { id: me.id, full_name: me.full_name, email: me.email, role: me.role } }, { error: null, success: Q.success || null })); }
    err404('Page not found', 'We could not find the page you requested.');
  }

  function photo(f) {
    return new Promise(function (ok, no) {
      if (!f || !f.size) return ok(null);
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return no('Only JPEG, PNG, and WebP images are allowed.');
      if (f.size > 5242880) return no('That photo is too large. Please choose an image under 5MB.');
      var r = new FileReader(); r.onload = function () { var i = new Image(); i.onload = function () { var s = Math.min(1, 640 / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(i.width * s)); c.height = Math.max(1, Math.round(i.height * s)); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', 0.7)); }; i.onerror = function () { no('That image could not be read. Please try another photo.'); }; i.src = r.result; }; r.onerror = function () { no('That image could not be read. Please try another photo.'); }; r.readAsDataURL(f);
    });
  }
  var sess = function (u) { U = { id: u.id, full_name: u.full_name, email: u.email, role: u.role }; LS.setItem(SK, JSON.stringify(U)); };

  function onSubmit(e) {
    var f = e.target; if (e.defaultPrevented || (f.method || '').toLowerCase() !== 'post') return;
    var act = f.dataset.act || f.getAttribute('action') || ''; e.preventDefault();
    var d = new FormData(f), g = function (k) { return (d.get(k) || '').toString().trim(); }, m;
    if (act === '/logout') { U = null; LS.removeItem(SK); return go('index.html', 'success', 'You have been logged out.'); }
    if (act === '/login') {
      var em = g('email').toLowerCase(), pw = (d.get('password') || '').toString();
      if (!em || !pw) return show('login', { title: 'Log in', error: 'Enter both your email and password.', values: { email: em } });
      var us = db.users.filter(function (x) { return x.email === em; })[0];
      var bad = function () { show('login', { title: 'Log in', error: 'That email and password combination was not found.', values: { email: em } }); };
      if (!us) return bad();
      return hash(us.id, pw).then(function (h) { if (h !== us.password) return bad(); sess(us); go('index.html', 'success', 'You are now logged in.'); });
    }
    if (act === '/register') {
      var v = { full_name: g('full_name'), email: g('email').toLowerCase(), role: g('role') || 'student' }, pw2 = (d.get('password') || '').toString(), er = null;
      if (!v.full_name || !v.email || !pw2) er = 'Please complete every required field.';
      else if (!RD[v.role] || v.role === 'admin') er = 'Please choose a valid TSU community role.';
      else if (v.email.slice(-('@' + RD[v.role]).length) !== '@' + RD[v.role]) er = 'Accounts for this role must use an email ending in @' + RD[v.role] + '.';
      else if (pw2.length < 8) er = 'Password must be at least 8 characters.';
      else if (db.users.some(function (x) { return x.email === v.email; })) er = 'An account with that email already exists.';
      if (er) return show('register', { title: 'Create an account', error: er, values: v });
      var nid = nextId(db.users);
      return hash(nid, pw2).then(function (h) { var nu = { id: nid, full_name: v.full_name, email: v.email, password: h, role: v.role, created_at: ts() }; db.users.push(nu); save(); sess(nu); go('index.html', 'success', 'Welcome to TSU FindIt, your account is ready.'); });
    }
    if (!U) return go('login.html', 'error', 'Please log in to continue.');
    if (act === '/report') {
      var rv = { type: g('type') || 'lost', item_name: g('item_name'), description: g('description'), location_text: g('location_text'), event_date: g('event_date'), event_time: g('event_time') };
      var bad = function (t) { show('report-form', { title: 'Report an item', error: t, values: rv }); };
      if (!rv.item_name || !rv.description || !rv.location_text || !rv.event_date) return bad('Please complete the item name, description, location, and date.');
      if (rv.event_date > (function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})(new Date())) return bad('The date cannot be in the future. Please choose today or an earlier date.');
      return photo(d.get('photo')).then(function (img) {
        db.posts.push({ id: nextId(db.posts), user_id: U.id, type: rv.type === 'found' ? 'found' : 'lost', item_name: rv.item_name, description: rv.description, image_path: img, location_text: rv.location_text, event_date: rv.event_date, event_time: rv.event_time || null, status: 'PENDING', rejection_reason: null, reviewed_by: null, reviewed_at: null, created_at: ts() });
        if (!save()) { db.posts.pop(); return bad('Browser storage is full. Try a smaller photo or none.'); }
        go('my-posts.html', 'success', 'Post submitted for admin review.');
      }, bad);
    }
    if ((m = act.match(/^\/posts\/(\d+)\/(claim|delete|approve|reject)$/))) {
      var p = by(db.posts, m[1]), a = m[2];
      if (!p) return err404('Post not found', 'That post no longer exists.');
      if (a === 'approve' || a === 'reject') {
        if (U.role !== 'admin') return go('browse.html', 'error', 'Admin access is limited to the seeded admin account.');
        if (p.status !== 'PENDING') return go('admin.html', 'error', 'That post has already been reviewed.');
        if (a === 'approve' && future(p)) return go('admin.html', 'error', 'This post has a future date (' + p.event_date + ') and cannot be approved. Reject it instead.');
        var rs = g('reason'); if (a === 'reject' && !rs) return go('admin.html?reject_id=' + p.id, 'error', 'Add a reason before rejecting this post.');
        p.status = a === 'approve' ? 'ACTIVE' : 'REJECTED'; if (a === 'reject') p.rejection_reason = rs; p.reviewed_by = U.id; p.reviewed_at = ts(); save();
        return go('admin.html', 'success', a === 'approve' ? 'Post approved.' : 'Post rejected.');
      }
      if (p.user_id !== U.id) return go('my-posts.html', 'error', 'You can only manage your own posts.');
      if (a === 'claim') { if (p.status !== 'ACTIVE') return go('my-posts.html', 'error', 'Only an active post can be marked as claimed.'); p.status = 'CLAIMED'; save(); return go('my-posts.html', 'success', 'Post marked as claimed.'); }
      if (p.status !== 'REJECTED') return go('my-posts.html', 'error', 'Only rejected posts can be deleted.');
      db.posts = db.posts.filter(function (x) { return x.id !== p.id; }); save(); return go('my-posts.html', 'success', 'Post deleted.');
    }
    if ((m = act.match(/^\/messages\/(\d+)\/(\d+)$/))) {
      var back = 'conversation.html?p=' + m[1] + '&u=' + m[2], body = g('body');
      if (!body) return go(back, 'error', 'Write a message before sending.');
      db.messages.push({ id: nextId(db.messages), post_id: Number(m[1]), sender_id: U.id, recipient_id: Number(m[2]), body: body, created_at: ts() }); save(); return go(back, 'success', 'Message sent.');
    }
    if (act === '/profile') {
      var me = by(db.users, U.id), pv = { id: me.id, full_name: g('full_name'), email: g('email').toLowerCase(), role: me.role }, np = (d.get('new_password') || '').toString(), pe = null, dom = '@' + RD[me.role];
      if (!pv.full_name || !pv.email) pe = 'Name and email are required.';
      else if (pv.email.slice(-dom.length) !== dom) pe = 'Please use an email ending in ' + dom + '.';
      else if (np && np.length < 8) pe = 'A new password must be at least 8 characters.';
      else if (db.users.some(function (x) { return x.email === pv.email && x.id !== me.id; })) pe = 'That email is already in use.';
      if (pe) return show('profile', { title: 'Your profile', user: pv, error: pe, success: null });
      var fin = function (h) { me.full_name = pv.full_name; me.email = pv.email; if (h) me.password = h; save(); sess(me); go('profile.html', 'success', 'Profile updated.'); };
      return np ? hash(me.id, np).then(fin) : fin();
    }
  }
  try { route(); } catch (e) { document.body.innerHTML = '<div style="font-family:sans-serif;max-width:480px;margin:4rem auto;padding:0 1rem"><h1>Something went wrong</h1><p>Please <a href="index.html">go to the home page</a> or <a href="index.html?reset=1">reset the demo data</a>.</p></div>'; }
});
