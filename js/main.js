(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var modalRoot = document.getElementById('modal-root');
  var lastFocused = null;

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
    });
  }

  function postForm(action) {
    var form = document.createElement('form');
    form.method = 'post';
    form.action = action;
    form.style.display = 'none';
    document.body.appendChild(form);
    if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }

  function icon(name) {
    return '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  }

  function focusableIn(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return el.offsetParent !== null; });
  }

  /* ------------------------------------------------------------------ *
   * Modals (reject-reason modal, claim / delete confirmations)
   * ------------------------------------------------------------------ */
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.is-open')) document.body.classList.remove('modal-open');
    var dynamic = modal.hasAttribute('data-dynamic');
    if (dynamic) modal.remove();
    if (lastFocused && document.contains(lastFocused) && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function openModal(modal, opener) {
    if (!modal) return;
    lastFocused = opener || document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    var focusTarget = modal.querySelector('textarea, button:not(.modal-close)');
    if (focusTarget) setTimeout(function () { focusTarget.focus(); }, 20);
  }

  function createActionModal(kind, postId, postName, opener) {
    var isClaim = kind === 'claim';
    var modal = document.createElement('div');
    modal.className = 'modal is-open';
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('data-dynamic', '');
    modal.innerHTML =
      '<div class="modal-backdrop" data-modal-close></div>' +
      '<div class="modal-dialog" data-action="noop" role="dialog" aria-modal="true" aria-labelledby="action-modal-title" aria-describedby="action-modal-copy">' +
        '<button class="modal-close" type="button" data-modal-close aria-label="Close">×</button>' +
        '<div class="modal-icon ' + (isClaim ? 'is-success' : 'is-danger') + '" aria-hidden="true">' + icon(isClaim ? 'check-circle' : 'trash') + '</div>' +
        '<p class="eyebrow">' + (isClaim ? 'One last check' : 'Permanent action') + '</p>' +
        '<h2 id="action-modal-title">' + (isClaim ? 'Mark this item as claimed?' : 'Delete this rejected post?') + '</h2>' +
        '<p class="modal-copy" id="action-modal-copy">' + (isClaim
          ? 'This tells the community that “' + escapeHtml(postName) + '” has found its way home.'
          : 'This permanently removes “' + escapeHtml(postName) + '”. There is no undo.') + '</p>' +
        '<div class="modal-actions">' +
          '<button class="button button-outline" type="button" data-modal-close>Cancel</button>' +
          '<button class="button ' + (isClaim ? 'button-primary' : 'button-danger') + '" type="button" data-modal-confirm>' + (isClaim ? 'Yes, mark claimed' : 'Yes, delete post') + '</button>' +
        '</div>' +
      '</div>';
    modalRoot.appendChild(modal);
    openModal(modal, opener);
    modal.addEventListener('click', function (event) {
      if (event.target.closest('[data-modal-close]')) closeModal(modal);
      var confirmButton = event.target.closest('[data-modal-confirm]');
      if (confirmButton) {
        confirmButton.classList.add('is-loading');
        postForm(isClaim ? '/posts/' + postId + '/claim' : '/posts/' + postId + '/delete');
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Mobile navigation
   * ------------------------------------------------------------------ */
  var header = document.querySelector('[data-site-header]') || document.querySelector('.site-header');
  var menuButton = document.querySelector('[data-action="toggle-menu"]');
  var siteNav = document.getElementById('site-nav');

  function setMenu(open) {
    if (!menuButton || !siteNav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    siteNav.classList.toggle('is-open', open);
    if (header) header.classList.toggle('menu-open', open);
  }

  /* ------------------------------------------------------------------ *
   * Toasts
   * ------------------------------------------------------------------ */
  function hideToast(toast) {
    toast.classList.add('toast-hide');
    setTimeout(function () { toast.remove(); }, 300);
  }

  document.querySelectorAll('[data-toast]').forEach(function (toast) {
    var remaining = 4800;
    var started = 0;
    var timer = null;
    function start() {
      started = Date.now();
      timer = setTimeout(function () { hideToast(toast); }, remaining);
      toast.classList.remove('is-paused');
    }
    function pause() {
      clearTimeout(timer);
      remaining = Math.max(1200, remaining - (Date.now() - started));
      toast.classList.add('is-paused');
    }
    toast.addEventListener('mouseenter', pause);
    toast.addEventListener('mouseleave', start);
    toast.addEventListener('focusin', pause);
    toast.addEventListener('focusout', start);
    start();
  });

  /* ------------------------------------------------------------------ *
   * Delegated click actions
   * ------------------------------------------------------------------ */
  document.addEventListener('click', function (event) {
    // close the mobile menu when tapping outside the header
    if (siteNav && siteNav.classList.contains('is-open') && !event.target.closest('.site-header')) setMenu(false);

    var actionElement = event.target.closest('[data-action]');
    if (!actionElement) return;
    var action = actionElement.dataset.action;

    if (action === 'toggle-menu') {
      var expanded = actionElement.getAttribute('aria-expanded') === 'true';
      setMenu(!expanded);
    } else if (action === 'close-modal') {
      closeModal(actionElement.closest('.modal'));
    } else if (action === 'open-claim') {
      createActionModal('claim', actionElement.dataset.postId, actionElement.dataset.postName, actionElement);
    } else if (action === 'open-delete') {
      createActionModal('delete', actionElement.dataset.postId, actionElement.dataset.postName, actionElement);
    } else if (action === 'open-reject') {
      var modal = document.getElementById('reject-modal');
      var form = document.getElementById('reject-form');
      form.action = '/posts/' + actionElement.dataset.postId + '/reject';
      var nameSlot = modal.querySelector('[data-reject-name]');
      if (nameSlot) nameSlot.textContent = actionElement.dataset.postName || '';
      var staleError = modal.querySelector('[data-reject-error]');
      if (staleError) staleError.textContent = '';
      openModal(modal, actionElement);
    } else if (action === 'dismiss-toast') {
      hideToast(actionElement.closest('.toast'));
    } else if (action === 'scroll-top') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else if (action === 'toggle-password') {
      var field = actionElement.closest('.field');
      var input = field && field.querySelector('input');
      if (input) {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        actionElement.setAttribute('aria-pressed', String(show));
        actionElement.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        var use = actionElement.querySelector('use');
        if (use) use.setAttribute('href', show ? '#i-eye-off' : '#i-eye');
      }
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var open = document.querySelectorAll('.modal.is-open');
      open.forEach(closeModal);
      if (!open.length && siteNav && siteNav.classList.contains('is-open')) {
        setMenu(false);
        if (menuButton) menuButton.focus();
      }
    }
    // keep keyboard focus inside an open modal
    if (event.key === 'Tab') {
      var modals = document.querySelectorAll('.modal.is-open');
      if (!modals.length) return;
      var dialog = modals[modals.length - 1].querySelector('.modal-dialog');
      var items = dialog ? focusableIn(dialog) : [];
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (!dialog.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  if (window.matchMedia) {
    var desktopQuery = window.matchMedia('(min-width: 961px)');
    var onDesktop = function (e) { if (e.matches) setMenu(false); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onDesktop);
    else if (desktopQuery.addListener) desktopQuery.addListener(onDesktop);
  }

  /* ------------------------------------------------------------------ *
   * Reject-reason modal: server-opened state + client validation
   * ------------------------------------------------------------------ */
  var rejectModal = document.getElementById('reject-modal');
  var rejectForm = document.querySelector('[data-reject-form]');
  if (rejectModal && rejectForm) {
    var openId = rejectModal.dataset.openRejectId;
    if (openId) openModal(rejectModal);
    rejectForm.addEventListener('submit', function (event) {
      var textarea = rejectForm.querySelector('[data-reject-reason]');
      var error = rejectForm.querySelector('[data-reject-error]');
      if (!textarea.value.trim()) {
        event.preventDefault();
        error.textContent = 'Add a reason before rejecting this post.';
        textarea.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Image upload: preview, remove, drag state, size warning
   * ------------------------------------------------------------------ */
  document.querySelectorAll('[data-image-input]').forEach(function (input) {
    var drop = input.closest('.file-drop');
    var label = drop.querySelector('[data-file-label]');
    var preview = document.querySelector('[data-image-preview]');
    var fileError = document.querySelector('[data-file-error]');
    var objectUrl = null;

    function reset() {
      input.value = '';
      label.textContent = 'No file chosen';
      if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
      if (preview) { preview.hidden = true; preview.innerHTML = ''; }
      if (fileError) fileError.textContent = '';
    }

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
      label.textContent = file ? file.name : 'No file chosen';
      if (fileError) {
        fileError.textContent = file && file.size > 5 * 1024 * 1024 ? 'That photo is larger than 5MB, so it will be rejected. Please choose a smaller one.' : '';
      }
      if (file && preview) {
        preview.hidden = false;
        preview.innerHTML = '';
        var image = document.createElement('img');
        image.alt = 'Selected item preview';
        objectUrl = URL.createObjectURL(file);
        image.src = objectUrl;
        preview.appendChild(image);
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'image-preview-remove';
        remove.setAttribute('aria-label', 'Remove selected photo');
        remove.innerHTML = icon('x');
        remove.addEventListener('click', reset);
        preview.appendChild(remove);
      } else if (preview) {
        preview.hidden = true;
        preview.innerHTML = '';
      }
    });

    ['dragenter', 'dragover'].forEach(function (name) {
      drop.addEventListener(name, function () { drop.classList.add('is-dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (name) {
      drop.addEventListener(name, function () { drop.classList.remove('is-dragover'); });
    });
  });

  /* ------------------------------------------------------------------ *
   * Form UX: inline validation, loading state, chip auto-submit, search clear
   * ------------------------------------------------------------------ */
  function friendlyMessage(el) {
    var v = el.validity;
    if (v.valueMissing) return el.type === 'radio' || el.type === 'checkbox' ? 'Please choose an option.' : 'This field is required.';
    if (v.typeMismatch && el.type === 'email') return 'Enter a valid email address, like you@tsu.edu.ph.';
    if (v.tooShort) return 'Use at least ' + el.minLength + ' characters.';
    if (v.patternMismatch) return el.title || 'Please match the requested format.';
    return el.validationMessage || 'Please check this field.';
  }

  function validateField(el, force) {
    var field = el.closest && el.closest('.field');
    if (!field || !el.willValidate) return;
    if (!force && !field.classList.contains('is-touched')) return;
    var valid = el.validity.valid;
    var message = field.querySelector('.field-error');
    if (!message) {
      message = document.createElement('p');
      message.className = 'field-error';
      message.id = 'err-' + (el.id || el.name || Math.random().toString(36).slice(2, 8));
      field.appendChild(message);
      el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '') + ' ' + message.id).trim());
    }
    message.textContent = valid ? '' : friendlyMessage(el);
    field.classList.toggle('is-invalid', !valid);
    field.classList.toggle('is-valid', valid && el.value !== '');
    el.setAttribute('aria-invalid', String(!valid));
  }

  document.addEventListener('focusout', function (event) {
    var el = event.target;
    var field = el.closest && el.closest('.field');
    if (!field) return;
    field.classList.add('is-touched');
    validateField(el, true);
  });
  document.addEventListener('input', function (event) {
    var el = event.target;
    var field = el.closest && el.closest('.field');
    if (field) validateField(el, false);
    var search = el.closest && el.closest('.search-field');
    if (search) search.classList.toggle('has-value', el.value !== '');
  });
  document.addEventListener('invalid', function (event) {
    var field = event.target.closest && event.target.closest('.field');
    if (field) { field.classList.add('is-touched'); validateField(event.target, true); }
  }, true);

  document.addEventListener('submit', function (event) {
    if (event.defaultPrevented) return;
    var button = event.submitter || event.target.querySelector('button[type="submit"]');
    if (button && button.classList) button.classList.add('is-loading');
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      root.classList.remove('is-leaving');
      document.querySelectorAll('.button.is-loading').forEach(function (b) { b.classList.remove('is-loading'); });
    }
  });

  document.querySelectorAll('form[data-autosubmit]').forEach(function (form) {
    form.addEventListener('change', function (event) {
      if (event.target.matches('input[type="radio"], input[type="checkbox"], select')) {
        if (form.requestSubmit) form.requestSubmit(); else form.submit();
      }
    });
  });

  document.querySelectorAll('.search-field').forEach(function (wrap) {
    var input = wrap.querySelector('input');
    if (!input) return;
    wrap.classList.toggle('has-value', input.value !== '');
    var clear = wrap.querySelector('[data-search-clear]');
    if (clear) {
      clear.addEventListener('click', function () {
        var hadServerValue = input.defaultValue !== '';
        input.value = '';
        wrap.classList.remove('has-value');
        input.focus();
        var form = input.form;
        if (hadServerValue && form && form.hasAttribute('data-autosubmit')) {
          if (form.requestSubmit) form.requestSubmit(); else form.submit();
        }
      });
    }
  });

  /* ------------------------------------------------------------------ *
   * Lazy images: fade in when loaded
   * ------------------------------------------------------------------ */
  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    function loaded() { img.classList.add('is-loaded'); }
    function broken() { img.classList.add('is-loaded', 'is-broken'); }
    if (img.complete) { if (img.naturalWidth) loaded(); else broken(); }
    else {
      img.addEventListener('load', loaded, { once: true });
      img.addEventListener('error', broken, { once: true });
    }
  });

  /* ------------------------------------------------------------------ *
   * Conversation: open scrolled to the newest message
   * ------------------------------------------------------------------ */
  document.querySelectorAll('.message-thread').forEach(function (thread) {
    thread.scrollTop = thread.scrollHeight;
  });

  /* ------------------------------------------------------------------ *
   * Scroll-linked polish: header style, back-to-top, hero parallax
   * ------------------------------------------------------------------ */
  var toTop = document.querySelector('[data-to-top]');
  var heroBg = document.querySelector('[data-hero-bg]');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || root.scrollTop || 0;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (toTop) toTop.classList.toggle('is-visible', y > 640);
    if (heroBg && !reduceMotion && y < 1000) heroBg.style.transform = 'translate3d(0,' + Math.round(y * 0.16) + 'px,0)';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------ *
   * Scroll reveal
   * ------------------------------------------------------------------ */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
      revealEls.forEach(function (el) {
        var siblings = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); }) : [el];
        el.style.setProperty('--i', String(Math.min(siblings.indexOf(el), 8)));
        observer.observe(el);
      });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ------------------------------------------------------------------ *
   * Page transitions: fade-out fallback for browsers without
   * native cross-document view transitions (CSS handles the rest)
   * ------------------------------------------------------------------ */
  if (!('onpageswap' in window) && !reduceMotion) {
    document.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest('a[href]');
      if (!link || link.hasAttribute('download') || link.hasAttribute('data-action')) return;
      if (link.target && link.target !== '_self') return;
      var url;
      try { url = new URL(link.href, window.location.href); } catch (e) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      root.classList.add('is-leaving');
      setTimeout(function () { window.location.href = link.href; }, 180);
    });
  }
})();
