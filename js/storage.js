/**
 * Storage helper: load/save the conversation scenario in localStorage.
 * Single source of truth for the data model.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'wa-simulator:scenario-v1';

  const DEFAULT_SCENARIO = {
    contact: {
      name: 'Anna Bianchi',
      status: 'online',
      avatarDataUrl: null
    },
    messages: [
      { sender: 'them', text: 'Ciao! Come va?' },
      { sender: 'me',   text: 'Ciao Anna! Tutto bene, tu?' },
      { sender: 'them', text: 'Anche io, grazie! Hai un attimo?' },
      { sender: 'me',   text: 'Certo, dimmi pure.' },
      { sender: 'them', text: 'Volevo chiederti se ci vediamo domani sera per un caffè.' },
      { sender: 'me',   text: 'Volentieri! Alle 19 al solito posto?' },
      { sender: 'them', text: 'Perfetto, a domani!' }
    ]
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function isValidScenario(s) {
    if (!s || typeof s !== 'object') return false;
    if (!s.contact || typeof s.contact !== 'object') return false;
    if (typeof s.contact.name !== 'string') return false;
    if (!Array.isArray(s.messages)) return false;
    return s.messages.every((m) => {
      if (!m) return false;
      if (m.sender !== 'me' && m.sender !== 'them') return false;
      if (typeof m.text !== 'string') return false;
      if (m.imageDataUrl != null && typeof m.imageDataUrl !== 'string') return false;
      // Each message must have at least non-empty text OR an image
      if (!m.text.trim() && !m.imageDataUrl) return false;
      return true;
    });
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_SCENARIO);
      const parsed = JSON.parse(raw);
      // Backfill imageDataUrl on each message before validation so older
      // scenarios (without the field) remain valid
      if (parsed && Array.isArray(parsed.messages)) {
        parsed.messages.forEach((m) => {
          if (m && typeof m.imageDataUrl === 'undefined') m.imageDataUrl = null;
        });
      }
      if (!isValidScenario(parsed)) return clone(DEFAULT_SCENARIO);
      if (typeof parsed.contact.status !== 'string') parsed.contact.status = 'online';
      if (typeof parsed.contact.avatarDataUrl === 'undefined') parsed.contact.avatarDataUrl = null;
      return parsed;
    } catch (err) {
      console.warn('Impossibile leggere lo scenario salvato, uso il default.', err);
      return clone(DEFAULT_SCENARIO);
    }
  }

  function save(scenario) {
    if (!isValidScenario(scenario)) {
      throw new Error('Scenario non valido, salvataggio annullato.');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return clone(DEFAULT_SCENARIO);
  }

  /** Write the default scenario only if there is nothing in storage yet. */
  function ensureSeed() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      save(DEFAULT_SCENARIO);
    }
  }

  global.WAStorage = {
    load,
    save,
    reset,
    ensureSeed,
    isValidScenario,
    DEFAULT_SCENARIO: clone(DEFAULT_SCENARIO)
  };
})(window);
