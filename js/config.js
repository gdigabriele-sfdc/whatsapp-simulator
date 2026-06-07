/**
 * Configuration view: form for contact + reorderable messages list,
 * avatar upload, JSON import/export, and "Avvia simulazione" button.
 *
 * Exposes: window.WAConfig.init()
 */
(function (global) {
  'use strict';

  const MAX_AVATAR_DIMENSION = 256;
  const MAX_AVATAR_BYTES = 600 * 1024;
  const MAX_MESSAGE_IMAGE_DIMENSION = 1200;
  const MAX_MESSAGE_IMAGE_BYTES = 1.5 * 1024 * 1024;

  const EMOJI_CATEGORIES = [
    {
      id: 'faces',
      icon: '😀',
      label: 'Faccine ed emozioni',
      emojis: '😀 😃 😄 😁 😆 😅 😂 🤣 😊 🙂 🙃 😉 😇 🥰 😍 🤩 😘 😗 ☺️ 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬'.split(' ')
    },
    {
      id: 'gestures',
      icon: '👍',
      label: 'Gesti e persone',
      emojis: '👍 👎 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👋 🤚 🖐️ ✋ 🖖 👏 🙌 👐 🤲 🤝 🙏 ✊ 👊 🤛 🤜 💪 🦾 🦵 🦶 👂 🦻 👃 🧠 👀 👁️ 👅 👄 💋'.split(' ')
    },
    {
      id: 'hearts',
      icon: '❤️',
      label: 'Cuori e simboli',
      emojis: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 💌 💤 💢 💣 💥 💦 💨 💫 💬 💭 🗯️ ♥️ ♦️ ♠️ ♣️ ⚪ ⚫ 🔴 🟠 🟡 🟢 🔵 🟣 🟤'.split(' ')
    },
    {
      id: 'objects',
      icon: '🎉',
      label: 'Oggetti e altro',
      emojis: '🎉 🎊 🎁 🎈 🎂 🎀 🎄 🎃 🧨 ✨ 🎆 🎇 🌟 ⭐ 💫 ⚡ 🔥 💯 ✅ ❌ ❓ ❗ ‼️ ⁉️ 💡 🔔 🔕 📌 📍 ☀️ 🌤️ ⛅ ☁️ 🌧️ ⛈️ ❄️ ☃️ ⛄ 🌙 🌈 🌹 🌷 🌸 🌺 🌻 🌼 🌱 🌳 🍀 ☕ 🍵 🍺 🍷 🥂 🍾 🍕 🍔 🍟 🌮 🍜 🍣 🍦 🍩 🍪 🍫 🍰 ⚽ 🏀 🎾 🎮 🎵 🎶 📱 💻 ⌚ 📷 🎬 📚 ✈️ 🚗 🏠 💰 💳 💎 🔑 🎯 🏆 🥇 🥈 🥉'.split(' ')
    }
  ];

  let scenario = null;

  let nameInput, statusInput, avatarInput, avatarImg, avatarResetBtn;
  let phoneClockInput;
  let messagesList, addMessageBtn;
  let startBtn, exportBtn, importBtn, importInput, resetAllBtn;
  let configStatus;
  let backToConfigBtn;
  let simIntroModal, simIntroStartBtn, simIntroCancelBtn;

  let emojiPickerEl = null;
  let emojiPickerGridEl = null;
  let emojiPickerTabsEl = null;
  let emojiTargetTextarea = null;
  let emojiActiveCategoryId = 'faces';
  let emojiGlobalListenersBound = false;

  function init() {
    cacheDom();
    scenario = global.WAStorage.load();
    renderAll();
    bindEvents();
  }

  function cacheDom() {
    nameInput      = document.getElementById('contactName');
    statusInput    = document.getElementById('contactStatus');
    avatarInput    = document.getElementById('avatarInput');
    avatarImg      = document.getElementById('avatarImg');
    avatarResetBtn = document.getElementById('avatarResetBtn');
    phoneClockInput = document.getElementById('phoneClock');
    messagesList   = document.getElementById('messagesList');
    addMessageBtn  = document.getElementById('addMessageBtn');
    startBtn       = document.getElementById('startBtn');
    exportBtn      = document.getElementById('exportBtn');
    importBtn      = document.getElementById('importBtn');
    importInput    = document.getElementById('importInput');
    resetAllBtn    = document.getElementById('resetAllBtn');
    configStatus   = document.getElementById('configStatus');
    backToConfigBtn = document.getElementById('backToConfigBtn');
    simIntroModal     = document.getElementById('simIntroModal');
    simIntroStartBtn  = document.getElementById('simIntroStart');
    simIntroCancelBtn = document.getElementById('simIntroCancel');
  }

  function bindEvents() {
    nameInput.addEventListener('input', () => {
      scenario.contact.name = nameInput.value;
      persist();
    });

    statusInput.addEventListener('input', () => {
      scenario.contact.status = statusInput.value;
      persist();
    });

    if (phoneClockInput) {
      phoneClockInput.addEventListener('input', () => {
        scenario.clock = phoneClockInput.value;
        persist();
      });
    }

    avatarInput.addEventListener('change', onAvatarFileSelected);
    avatarResetBtn.addEventListener('click', () => {
      scenario.contact.avatarDataUrl = null;
      avatarImg.src = 'assets/default-avatar.svg';
      persist();
      flash('Avatar rimosso.');
    });

    addMessageBtn.addEventListener('click', () => {
      const lastSender = scenario.messages.length
        ? scenario.messages[scenario.messages.length - 1].sender
        : 'them';
      const nextSender = lastSender === 'me' ? 'them' : 'me';
      scenario.messages.push({ sender: nextSender, text: '' });
      persist();
      renderMessages();
      // Focus the new textarea
      const rows = messagesList.querySelectorAll('.msg-row');
      const last = rows[rows.length - 1];
      if (last) last.querySelector('textarea').focus();
    });

    startBtn.addEventListener('click', () => {
      if (!scenario.messages.length) {
        flash('Aggiungi almeno un messaggio prima di avviare.', true);
        return;
      }
      // A message is "empty" if it has no caption AND no image
      const hasEmpty = scenario.messages.some((m) => !m.text.trim() && !m.imageDataUrl);
      if (hasEmpty) {
        flash('Ci sono messaggi vuoti (senza testo né immagine). Compilali o rimuovili prima di avviare.', true);
        return;
      }
      openSimIntroModal();
    });

    backToConfigBtn.addEventListener('click', exitSimulator);

    simIntroStartBtn.addEventListener('click', () => {
      closeSimIntroModal();
      persist();
      document.body.classList.add('view-simulator');
      document.getElementById('simulatorView').setAttribute('aria-hidden', 'false');
      document.getElementById('configView').setAttribute('aria-hidden', 'true');
      // Reset scroll so the iPhone is centered in the viewport regardless of
      // where the user clicked the start button from in the config page.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (global.WASimulator) global.WASimulator.start(scenario);
    });

    simIntroCancelBtn.addEventListener('click', closeSimIntroModal);
    simIntroModal.addEventListener('click', (e) => {
      // Click on the dimmed backdrop (outside the modal box) closes the modal
      if (e.target === simIntroModal) closeSimIntroModal();
    });
    document.addEventListener('keydown', (e) => {
      if (simIntroModal.classList.contains('is-open') && e.key === 'Escape') {
        e.preventDefault();
        closeSimIntroModal();
      }
    });

    exportBtn.addEventListener('click', exportJson);
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', importJson);

    resetAllBtn.addEventListener('click', () => {
      if (!confirm('Ripristinare lo scenario di esempio? Tutte le modifiche andranno perse.')) return;
      scenario = global.WAStorage.reset();
      global.WAStorage.save(scenario);
      renderAll();
      flash('Scenario di esempio ripristinato.');
    });
  }

  function renderAll() {
    nameInput.value   = scenario.contact.name || '';
    statusInput.value = scenario.contact.status || '';
    avatarImg.src = scenario.contact.avatarDataUrl || 'assets/default-avatar.svg';
    if (phoneClockInput) phoneClockInput.value = scenario.clock || '';
    renderMessages();
  }

  function renderMessages() {
    closeEmojiPicker();
    messagesList.innerHTML = '';
    scenario.messages.forEach((msg, idx) => {
      const li = document.createElement('li');
      li.className = 'msg-row';
      li.dataset.sender = msg.sender;
      li.dataset.index = String(idx);

      const toggle = document.createElement('div');
      toggle.className = 'sender-toggle';
      toggle.innerHTML = `
        <button type="button" data-set-sender="me"   class="${msg.sender === 'me'   ? 'active' : ''}">Io</button>
        <button type="button" data-set-sender="them" class="${msg.sender === 'them' ? 'active' : ''}">Lui/Lei</button>
      `;
      toggle.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-set-sender]');
        if (!btn) return;
        const newSender = btn.dataset.setSender;
        if (newSender === msg.sender) return;
        scenario.messages[idx].sender = newSender;
        persist();
        renderMessages();
      });

      // Content cell: optional image preview at top + textarea below
      const content = document.createElement('div');
      content.className = 'msg-content';

      const imagePreview = document.createElement('div');
      imagePreview.className = 'msg-image-preview' + (msg.imageDataUrl ? '' : ' is-empty');
      if (msg.imageDataUrl) {
        const thumb = document.createElement('img');
        thumb.src = msg.imageDataUrl;
        thumb.alt = 'Anteprima immagine';
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'msg-image-remove';
        removeBtn.title = 'Rimuovi immagine';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
          scenario.messages[idx].imageDataUrl = null;
          persist();
          renderMessages();
        });
        imagePreview.append(thumb, removeBtn);
      }

      const textarea = document.createElement('textarea');
      textarea.value = msg.text;
      textarea.rows = 2;
      if (msg.imageDataUrl) {
        textarea.placeholder = 'Didascalia (opzionale)...';
      } else {
        textarea.placeholder = msg.sender === 'me' ? 'Quello che scrivi tu...' : 'Quello che ti scrivono...';
      }
      textarea.addEventListener('input', () => {
        scenario.messages[idx].text = textarea.value;
        persist();
      });

      if (msg.imageDataUrl) content.appendChild(imagePreview);
      content.appendChild(textarea);

      const actions = document.createElement('div');
      actions.className = 'msg-actions';

      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'icon-btn';
      upBtn.title = 'Sposta su';
      upBtn.textContent = '↑';
      upBtn.disabled = idx === 0;
      upBtn.addEventListener('click', () => moveMessage(idx, -1));

      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'icon-btn';
      downBtn.title = 'Sposta giù';
      downBtn.textContent = '↓';
      downBtn.disabled = idx === scenario.messages.length - 1;
      downBtn.addEventListener('click', () => moveMessage(idx, 1));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'icon-btn danger';
      delBtn.title = 'Elimina';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        scenario.messages.splice(idx, 1);
        persist();
        renderMessages();
      });

      const emojiBtn = document.createElement('button');
      emojiBtn.type = 'button';
      emojiBtn.className = 'icon-btn emoji-btn';
      emojiBtn.title = 'Inserisci emoji';
      emojiBtn.textContent = '😀';
      emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (emojiPickerEl && emojiPickerEl.classList.contains('is-open') && emojiTargetTextarea === textarea) {
          closeEmojiPicker();
        } else {
          openEmojiPicker(textarea, emojiBtn);
        }
      });

      // Image picker (per-row hidden input + button)
      const imageBtn = document.createElement('button');
      imageBtn.type = 'button';
      imageBtn.className = 'icon-btn image-btn';
      imageBtn.title = msg.imageDataUrl ? 'Cambia immagine' : 'Aggiungi immagine';
      imageBtn.textContent = '📷';
      const imageFileInput = document.createElement('input');
      imageFileInput.type = 'file';
      imageFileInput.accept = 'image/*';
      imageFileInput.hidden = true;
      imageBtn.addEventListener('click', () => imageFileInput.click());
      imageFileInput.addEventListener('change', (e) => onMessageImageSelected(e, idx));

      actions.append(emojiBtn, imageBtn, upBtn, downBtn, delBtn);
      li.append(toggle, content, actions, imageFileInput);
      messagesList.appendChild(li);
    });

    if (!scenario.messages.length) {
      const empty = document.createElement('li');
      empty.className = 'msg-empty';
      empty.textContent = 'Nessun messaggio. Clicca "+ Aggiungi messaggio" per iniziare.';
      messagesList.appendChild(empty);
    }
  }

  function moveMessage(idx, delta) {
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= scenario.messages.length) return;
    const [item] = scenario.messages.splice(idx, 1);
    scenario.messages.splice(newIdx, 0, item);
    persist();
    renderMessages();
  }

  function onAvatarFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      flash('Il file selezionato non è un\'immagine.', true);
      avatarInput.value = '';
      return;
    }
    resizeImageToDataUrl(file, MAX_AVATAR_DIMENSION)
      .then((dataUrl) => {
        if (dataUrl.length > MAX_AVATAR_BYTES * 1.4) {
          flash('Immagine troppo grande dopo la compressione. Scegline una più piccola.', true);
          return;
        }
        scenario.contact.avatarDataUrl = dataUrl;
        avatarImg.src = dataUrl;
        persist();
        flash('Avatar aggiornato.');
      })
      .catch((err) => {
        console.error(err);
        flash('Impossibile leggere l\'immagine.', true);
      })
      .finally(() => { avatarInput.value = ''; });
  }

  function resizeImageToDataUrl(file, maxSize) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const out = canvas.toDataURL('image/jpeg', 0.85);
          resolve(out);
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function exportJson() {
    persist();
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-scenario.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    flash('Scenario esportato.');
  }

  function importJson(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!global.WAStorage.isValidScenario(parsed)) {
          flash('Il file non è uno scenario valido.', true);
          return;
        }
        scenario = parsed;
        global.WAStorage.save(scenario);
        renderAll();
        flash('Scenario importato correttamente.');
      } catch (err) {
        console.error(err);
        flash('Errore nella lettura del file JSON.', true);
      } finally {
        importInput.value = '';
      }
    };
    reader.readAsText(file);
  }

  function persist() {
    try {
      global.WAStorage.save(scenario);
    } catch (err) {
      flash(err.message || 'Errore nel salvataggio.', true);
    }
  }

  let flashTimer = null;
  function flash(message, isError) {
    if (!configStatus) return;
    configStatus.textContent = message;
    configStatus.classList.toggle('error', !!isError);
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      configStatus.textContent = '';
      configStatus.classList.remove('error');
    }, 3500);
  }

  /* ---------- Emoji picker ---------- */

  function ensureEmojiPicker() {
    if (emojiPickerEl) return;

    emojiPickerEl = document.createElement('div');
    emojiPickerEl.className = 'emoji-picker';
    emojiPickerEl.setAttribute('role', 'dialog');
    emojiPickerEl.setAttribute('aria-label', 'Selettore emoji');

    emojiPickerTabsEl = document.createElement('div');
    emojiPickerTabsEl.className = 'emoji-picker-tabs';
    EMOJI_CATEGORIES.forEach((cat) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'emoji-picker-tab' + (cat.id === emojiActiveCategoryId ? ' active' : '');
      tab.dataset.cat = cat.id;
      tab.title = cat.label;
      tab.textContent = cat.icon;
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        if (emojiActiveCategoryId === cat.id) return;
        emojiActiveCategoryId = cat.id;
        Array.from(emojiPickerTabsEl.children).forEach((t) => {
          t.classList.toggle('active', t.dataset.cat === cat.id);
        });
        renderEmojiGrid();
      });
      emojiPickerTabsEl.appendChild(tab);
    });

    emojiPickerGridEl = document.createElement('div');
    emojiPickerGridEl.className = 'emoji-picker-grid';

    emojiPickerEl.append(emojiPickerTabsEl, emojiPickerGridEl);
    document.body.appendChild(emojiPickerEl);

    // Prevent clicks inside the picker from bubbling to the document close handler
    emojiPickerEl.addEventListener('click', (e) => e.stopPropagation());

    renderEmojiGrid();

    if (!emojiGlobalListenersBound) {
      document.addEventListener('click', (e) => {
        if (!emojiPickerEl || !emojiPickerEl.classList.contains('is-open')) return;
        if (emojiPickerEl.contains(e.target)) return;
        if (e.target.closest && e.target.closest('.emoji-btn')) return;
        closeEmojiPicker();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeEmojiPicker();
      });
      window.addEventListener('resize', closeEmojiPicker);
      window.addEventListener('scroll', closeEmojiPicker, true);
      emojiGlobalListenersBound = true;
    }
  }

  function renderEmojiGrid() {
    if (!emojiPickerGridEl) return;
    emojiPickerGridEl.innerHTML = '';
    const cat = EMOJI_CATEGORIES.find((c) => c.id === emojiActiveCategoryId);
    if (!cat) return;
    cat.emojis.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-item';
      btn.textContent = emoji;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        insertEmojiAtCursor(emojiTargetTextarea, emoji);
      });
      emojiPickerGridEl.appendChild(btn);
    });
  }

  function openEmojiPicker(textarea, anchorEl) {
    ensureEmojiPicker();
    emojiTargetTextarea = textarea;

    // Position the picker near the anchor button, keeping it inside the viewport
    const rect = anchorEl.getBoundingClientRect();
    const PICKER_W = 296;
    const PICKER_H = 320;
    const margin = 6;

    let top = rect.bottom + margin;
    if (top + PICKER_H > window.innerHeight - 8) {
      top = Math.max(8, rect.top - PICKER_H - margin);
    }
    let left = rect.right - PICKER_W;
    left = Math.max(8, Math.min(left, window.innerWidth - PICKER_W - 8));

    emojiPickerEl.style.top = top + 'px';
    emojiPickerEl.style.left = left + 'px';
    emojiPickerEl.classList.add('is-open');
  }

  function closeEmojiPicker() {
    if (emojiPickerEl) emojiPickerEl.classList.remove('is-open');
    emojiTargetTextarea = null;
  }

  function insertEmojiAtCursor(textarea, emoji) {
    if (!textarea || !textarea.isConnected) {
      closeEmojiPicker();
      return;
    }
    const start = textarea.selectionStart != null ? textarea.selectionStart : textarea.value.length;
    const end   = textarea.selectionEnd   != null ? textarea.selectionEnd   : textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after  = textarea.value.slice(end);
    textarea.value = before + emoji + after;
    const caret = start + emoji.length;
    textarea.focus();
    try { textarea.setSelectionRange(caret, caret); } catch (_) { /* ignore */ }
    // Trigger the existing 'input' listener so the scenario gets updated and persisted
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* ---------- Message-image upload ---------- */

  function onMessageImageSelected(e, idx) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      flash('Il file selezionato non è un\'immagine.', true);
      e.target.value = '';
      return;
    }
    resizeImageToDataUrl(file, MAX_MESSAGE_IMAGE_DIMENSION)
      .then((dataUrl) => {
        if (dataUrl.length > MAX_MESSAGE_IMAGE_BYTES * 1.4) {
          flash('Immagine troppo grande anche dopo la compressione. Scegline una più leggera.', true);
          return;
        }
        scenario.messages[idx].imageDataUrl = dataUrl;
        try {
          persist();
        } catch (err) {
          // Likely exceeded localStorage quota
          scenario.messages[idx].imageDataUrl = null;
          flash('Spazio insufficiente: rimuovi qualche immagine prima di aggiungerne altre.', true);
          renderMessages();
          return;
        }
        renderMessages();
        flash('Immagine aggiunta al messaggio.');
      })
      .catch((err) => {
        console.error(err);
        flash('Impossibile leggere l\'immagine.', true);
      })
      .finally(() => { e.target.value = ''; });
  }

  /* ---------- Pre-simulation intro modal ---------- */

  function openSimIntroModal() {
    if (!simIntroModal) return;
    simIntroModal.classList.add('is-open');
    simIntroModal.setAttribute('aria-hidden', 'false');
    // Focus the primary action so Enter starts the simulation
    setTimeout(() => simIntroStartBtn && simIntroStartBtn.focus(), 30);
  }

  function closeSimIntroModal() {
    if (!simIntroModal) return;
    simIntroModal.classList.remove('is-open');
    simIntroModal.setAttribute('aria-hidden', 'true');
  }

  /* ---------- Exit from simulator back to config (called by Esc key too) ---------- */

  function exitSimulator() {
    if (global.WASimulator) global.WASimulator.stop();
    document.body.classList.remove('view-simulator');
    document.getElementById('simulatorView').setAttribute('aria-hidden', 'true');
    document.getElementById('configView').setAttribute('aria-hidden', 'false');
    scenario = global.WAStorage.load();
    renderAll();
    // Land at the top of the config page rather than wherever the user was
    // scrolled within the simulator view.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  global.WAConfig = { init, exitSimulator };
})(window);
