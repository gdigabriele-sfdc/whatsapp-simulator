/**
 * Simulator engine: drives the iPhone/WhatsApp UI by responding to taps
 * on the screen overlay. Each tap advances the conversation through a
 * small state machine.
 *
 * Exposes: window.WASimulator.{ init, start, stop }
 */
(function (global) {
  'use strict';

  /* ---------- Config ---------- */

  const KB_TRANSITION_MS = 320;          // matches CSS transition
  const TYPE_BASE_DELAY  = 75;           // ms per char
  const TYPE_JITTER      = 60;           // extra random ms per char
  const TYPE_PAUSE_SPACE = 60;           // extra pause after a space
  const THEM_BASE_DELAY  = 650;          // "sta scrivendo..." minimum
  const THEM_PER_CHAR    = 28;           // delay scales with text length
  const THEM_MAX_DELAY   = 2500;
  const BUBBLE_ANIM_MS   = 240;

  /* ---------- State ---------- */

  let messages = [];
  let i = 0;
  let pendingClickAction = null;
  let busy = false;
  let abort = false;                     // set when stop() is called mid-animation
  let timeouts = [];
  let kbVisible = false;
  let defaultStatus = 'online';
  let customClock = null;

  /* ---------- DOM refs ---------- */

  let waAvatar, waName, waStatus, waMessages, waChat;
  let waInputField, waInputText, waInputCaret, waInputPlaceholder, waSendBtn;
  let keyboard, kbKeys;
  let overlay, restartBtn, iosTime;

  /* ---------- Init / lifecycle ---------- */

  function init() {
    waAvatar           = document.getElementById('waAvatar');
    waName             = document.getElementById('waName');
    waStatus           = document.getElementById('waStatus');
    waMessages         = document.getElementById('waMessages');
    waChat             = document.getElementById('waChat');
    waInputField       = document.querySelector('.wa-input-field');
    waInputText        = document.getElementById('waInputText');
    waInputCaret       = document.getElementById('waInputCaret');
    waInputPlaceholder = document.getElementById('waInputPlaceholder');
    waSendBtn          = document.getElementById('waSendBtn');
    keyboard           = document.getElementById('iosKeyboard');
    kbKeys             = Array.from(keyboard.querySelectorAll('.kb-key[data-key]'));
    overlay            = document.getElementById('simTapOverlay');
    restartBtn         = document.getElementById('restartBtn');
    iosTime            = document.getElementById('iosTime');

    overlay.addEventListener('click', onTap);
    restartBtn.addEventListener('click', () => {
      if (!messages.length) return;
      stop();
      start({ contact: currentContact(), messages });
    });

    document.addEventListener('keydown', onKeyNav);

    updateClock();
    setInterval(updateClock, 30 * 1000);
  }

  /* ---------- Keyboard navigation (← / →) ---------- */

  function onKeyNav(e) {
    if (!document.body.classList.contains('view-simulator')) return;
    // Don't hijack keys if user is focused in an input/textarea/contenteditable
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onTap();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepBack();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (global.WAConfig && typeof global.WAConfig.exitSimulator === 'function') {
        global.WAConfig.exitSimulator();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      if (!messages.length) return;
      stop();
      start({ contact: currentContact(), messages });
    }
  }

  function currentContact() {
    return {
      name: waName.textContent,
      status: defaultStatus,
      avatarDataUrl: waAvatar.getAttribute('src') === 'assets/default-avatar.svg'
        ? null
        : waAvatar.getAttribute('src')
    };
  }

  function start(scenario) {
    stop(); // clear any prior state
    abort = false;
    messages = scenario.messages.slice();
    // Apply custom clock if the scenario provides one (empty string -> auto)
    if (typeof scenario.clock === 'string') {
      const t = scenario.clock.trim();
      customClock = t ? t : null;
    }
    applyContact(scenario.contact);
    resetChat();
    i = 0;
    prepareNext();
    updateClock();
  }

  function stop() {
    abort = true;
    timeouts.forEach(clearTimeout);
    timeouts = [];
    pendingClickAction = null;
    busy = false;
    kbVisible = false;
    keyboard.classList.remove('visible');
    waSendBtn.classList.remove('sendable');
    waInputField.classList.remove('has-text');
    waInputText.textContent = '';
    waStatus.classList.remove('typing');
  }

  /**
   * Soft cancel: clear all in-flight async work (timers, typing animation,
   * typing-bubble, keyboard, input field) without setting the global `abort`
   * flag, so the simulator can continue from a fresh state.
   * Any async function still awaiting on a now-cancelled `waitMs` will leak
   * harmlessly: clearTimeout removes the callback so it never resolves, and
   * `busy` is reset here.
   */
  function softReset() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    pendingClickAction = null;
    busy = false;
    kbVisible = false;
    keyboard.classList.remove('visible');
    keyboard.setAttribute('aria-hidden', 'true');
    waSendBtn.classList.remove('sendable');
    waInputField.classList.remove('has-text');
    waInputText.textContent = '';
    waStatus.textContent = defaultStatus;
    waStatus.classList.remove('typing');
    const typingBubble = waMessages.querySelector('.wa-bubble.typing');
    if (typingBubble) typingBubble.remove();
  }

  /**
   * Rewind one step: cancel in-flight action if any, otherwise remove the
   * last displayed bubble and prepare to replay it on the next tap.
   */
  function stepBack() {
    if (!messages.length) return;

    const bubbles = Array.from(waMessages.querySelectorAll('.wa-bubble:not(.typing)'));
    const displayedCount = bubbles.length;
    const isMidAction = busy || waInputText.textContent.length > 0;

    let target;
    if (isMidAction) {
      // Cancel current in-progress action, keep displayed bubbles untouched
      target = displayedCount;
    } else {
      if (displayedCount === 0) return; // already at the start
      target = displayedCount - 1;
    }

    softReset();

    // Remove bubbles beyond the target count (last-in first-out)
    for (let k = bubbles.length - 1; k >= target; k--) {
      bubbles[k].remove();
    }

    i = target;
    prepareNext();
  }

  /* ---------- UI helpers ---------- */

  function applyContact(contact) {
    waName.textContent   = contact.name || 'Contatto';
    defaultStatus        = contact.status || 'online';
    waStatus.textContent = defaultStatus;
    waAvatar.src         = contact.avatarDataUrl || 'assets/default-avatar.svg';
  }

  function resetChat() {
    waMessages.innerHTML = '';
    waInputText.textContent = '';
    waInputField.classList.remove('has-text');
    waSendBtn.classList.remove('sendable');
    waStatus.textContent = defaultStatus;
    waStatus.classList.remove('typing');
  }

  function addBubble(sender, msg) {
    const bubble = document.createElement('div');
    bubble.className = `wa-bubble ${sender}`;

    const meta = document.createElement('span');
    meta.className = 'wa-meta';
    meta.textContent = nowTimeShort();
    let ticks = null;
    if (sender === 'me') {
      ticks = document.createElement('span');
      ticks.className = 'wa-ticks';
      ticks.innerHTML = tickSvg(false);
      meta.appendChild(ticks);
    }

    if (msg.imageDataUrl) {
      bubble.classList.add('has-image');
      const imgWrap = document.createElement('div');
      imgWrap.className = 'wa-bubble-image';
      const img = document.createElement('img');
      img.src = msg.imageDataUrl;
      img.alt = '';
      imgWrap.appendChild(img);
      bubble.appendChild(imgWrap);

      if (msg.text && msg.text.length > 0) {
        // Image + caption: caption holds the text and the meta at its end
        const caption = document.createElement('div');
        caption.className = 'wa-bubble-caption';
        caption.appendChild(document.createTextNode(msg.text));
        caption.appendChild(meta);
        bubble.appendChild(caption);
      } else {
        // Image only: meta overlaid in bottom-right with dark backdrop
        bubble.classList.add('image-only');
        bubble.appendChild(meta);
      }
    } else {
      // Plain text bubble (existing behavior)
      bubble.appendChild(document.createTextNode(msg.text));
      bubble.appendChild(meta);
    }

    if (ticks) {
      // Realistic 3-stage progression: sent (✓) → delivered (✓✓ gray) → read (✓✓ blue)
      scheduleTick(() => { ticks.innerHTML = tickSvg(true); }, 350);
      scheduleTick(() => { ticks.classList.add('read'); }, 1100);
    }

    waMessages.appendChild(bubble);
    scrollChatToEnd();
    return bubble;
  }

  function addTypingBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'wa-bubble them typing';
    bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    waMessages.appendChild(bubble);
    scrollChatToEnd();
    return bubble;
  }

  function scrollChatToEnd() {
    requestAnimationFrame(() => {
      waChat.scrollTop = waChat.scrollHeight;
    });
  }

  function showKeyboard() {
    return new Promise((resolve) => {
      if (kbVisible) { resolve(); return; }
      kbVisible = true;
      keyboard.classList.add('visible');
      keyboard.setAttribute('aria-hidden', 'false');
      waitMs(KB_TRANSITION_MS).then(resolve);
    });
  }

  function hideKeyboard() {
    return new Promise((resolve) => {
      if (!kbVisible) { resolve(); return; }
      kbVisible = false;
      keyboard.classList.remove('visible');
      keyboard.setAttribute('aria-hidden', 'true');
      waitMs(KB_TRANSITION_MS).then(resolve);
    });
  }

  function setSendable(yes) {
    waSendBtn.classList.toggle('sendable', !!yes);
  }

  function clearInputField() {
    waInputText.textContent = '';
    waInputField.classList.remove('has-text');
  }

  function setInputText(s) {
    waInputText.textContent = s;
    waInputField.classList.toggle('has-text', s.length > 0);
  }

  function highlightKey(ch) {
    const key = kbKeys.find((k) => k.dataset.key === ch);
    if (!key) return;
    key.classList.add('active');
    waitMs(85).then(() => key.classList.remove('active'));
  }

  function setHeaderTyping(on) {
    if (on) {
      waStatus.textContent = 'sta scrivendo...';
      waStatus.classList.add('typing');
    } else {
      waStatus.textContent = defaultStatus;
      waStatus.classList.remove('typing');
    }
  }

  /* ---------- Time helpers ---------- */

  function updateClock() {
    if (customClock) {
      iosTime.textContent = customClock;
      return;
    }
    const d = new Date();
    const hh = d.getHours();
    const mm = d.getMinutes().toString().padStart(2, '0');
    iosTime.textContent = `${hh}:${mm}`;
  }

  function nowTimeShort() {
    const d = new Date();
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // WhatsApp-style ticks. Two check marks horizontally offset so the second one
  // overlaps the right half of the first, matching iOS WhatsApp visuals.
  function tickSvg(isDouble) {
    if (isDouble) {
      return '<svg viewBox="0 0 16 11" width="16" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        + '<path d="M1 6 L4.3 9.2 L9.6 2.4" />'
        + '<path d="M6.2 6 L9.5 9.2 L14.8 2.4" />'
        + '</svg>';
    }
    return '<svg viewBox="0 0 11 11" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M1 6 L4.3 9.2 L9.8 2.4" />'
      + '</svg>';
  }

  /* ---------- Async helpers (abortable) ---------- */

  function waitMs(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(() => {
        timeouts = timeouts.filter((x) => x !== id);
        if (!abort) resolve();
      }, ms);
      timeouts.push(id);
    });
  }

  // Fire-and-forget scheduled callback that respects abort and is auto-cleaned by stop()
  function scheduleTick(fn, ms) {
    const id = setTimeout(() => {
      timeouts = timeouts.filter((x) => x !== id);
      if (!abort) fn();
    }, ms);
    timeouts.push(id);
  }

  /* ---------- Core state machine ---------- */

  function onTap() {
    if (busy) return;
    if (!pendingClickAction) return;
    const action = pendingClickAction;
    pendingClickAction = null;
    action();
  }

  function prepareNext() {
    if (abort) return;
    if (i >= messages.length) {
      // Conversation ended
      setSendable(false);
      hideKeyboard();
      return;
    }
    const msg = messages[i];
    if (msg.sender === 'me') {
      pendingClickAction = () => runMe(msg);
    } else {
      pendingClickAction = () => runThem(msg);
    }
  }

  async function runMe(msg) {
    busy = true;
    if (msg.text && msg.text.length > 0) {
      // Text or image+caption: animate the keyboard typing of the caption, then wait for the send tap
      await showKeyboard();
      if (abort) { busy = false; return; }
      await typeOut(msg.text);
      if (abort) { busy = false; return; }
      setSendable(true);
      busy = false;
      pendingClickAction = () => sendMe(msg);
    } else {
      // Image-only outgoing message: one tap = send immediately (no keyboard, no caption)
      await hideKeyboard();
      if (abort) { busy = false; return; }
      addBubble('me', msg);
      await waitMs(BUBBLE_ANIM_MS);
      if (abort) { busy = false; return; }
      i++;
      busy = false;
      prepareNext();
    }
  }

  async function sendMe(msg) {
    busy = true;
    addBubble('me', msg);
    clearInputField();
    setSendable(false);
    await waitMs(BUBBLE_ANIM_MS);
    if (abort) { busy = false; return; }
    i++;
    busy = false;
    prepareNext();
  }

  async function runThem(msg) {
    busy = true;
    await hideKeyboard();
    if (abort) { busy = false; return; }
    setHeaderTyping(true);
    const typingBubble = addTypingBubble();
    // For images add a fixed "uploading" delay on top of the text-based one
    const imageDelay = msg.imageDataUrl ? 900 : 0;
    const textDelay  = (msg.text || '').length * THEM_PER_CHAR;
    const delay = Math.min(THEM_MAX_DELAY, THEM_BASE_DELAY + imageDelay + textDelay);
    await waitMs(delay);
    if (abort) { busy = false; return; }
    typingBubble.remove();
    addBubble('them', msg);
    setHeaderTyping(false);
    await waitMs(BUBBLE_ANIM_MS);
    if (abort) { busy = false; return; }
    i++;
    busy = false;
    prepareNext();
  }

  async function typeOut(text) {
    let acc = '';
    for (let k = 0; k < text.length; k++) {
      if (abort) return;
      const ch = text[k];
      acc += ch;
      setInputText(acc);
      const lower = ch.toLowerCase();
      if (/[a-z]/.test(lower)) highlightKey(lower);
      else if (ch === ' ') highlightKey('space');
      let delay = TYPE_BASE_DELAY + Math.random() * TYPE_JITTER;
      if (ch === ' ') delay += TYPE_PAUSE_SPACE;
      if (/[.,!?]/.test(ch)) delay += 120;
      await waitMs(delay);
    }
  }

  global.WASimulator = { init, start, stop };
})(window);
