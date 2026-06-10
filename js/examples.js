/**
 * Industry-specific example conversations.
 *
 * Each example is a full scenario (same shape as the one in storage.js)
 * that can be loaded from the configuration dropdown to overwrite the
 * current draft.
 *
 * Contact names and avatars come from the Industry Demo Brand Library on
 * Figma (fake brands). Avatars are inlined as data URLs by brand-logos.js,
 * which must be loaded before this file.
 *
 * Exposes: window.WAExamples.LIST (array of { id, label, scenario })
 *          window.WAExamples.get(id) -> scenario | null
 */
(function (global) {
  'use strict';

  const LOGOS = (global.WABrandLogos) || {};

  function s(name, status, clock, messages, avatarKey) {
    return {
      contact: {
        name,
        status,
        avatarDataUrl: avatarKey ? (LOGOS[avatarKey] || null) : null
      },
      clock: clock || '',
      messages: messages
    };
  }

  const LIST = [
    {
      id: 'generic',
      label: 'Generico (amici)',
      scenario: s('Anna Bianchi', 'online', '', [
        { sender: 'them', text: 'Ciao! Come va?' },
        { sender: 'me',   text: 'Ciao Anna! Tutto bene, tu?' },
        { sender: 'them', text: 'Anche io, grazie! Hai un attimo?' },
        { sender: 'me',   text: 'Certo, dimmi pure.' },
        { sender: 'them', text: 'Volevo chiederti se ci vediamo domani sera per un caffè ☕' },
        { sender: 'me',   text: 'Volentieri! Alle 19 al solito posto?' },
        { sender: 'them', text: 'Perfetto, a domani!' }
      ])
    },

    {
      id: 'financial_services',
      label: 'Financial Services (Banking, Insurance)',
      scenario: s('Cumulus Bank · Laura', 'online', '10:23', [
        { sender: 'them', text: 'Buongiorno Sig. Rossi! Sono Laura di Cumulus Bank, come posso aiutarla?' },
        { sender: 'me',   text: 'Salve, vorrei informazioni sul nuovo conto Zero Spese' },
        { sender: 'them', text: 'Certamente. Il conto ha canone 0€ e include una carta di debito Cumulus gratuita 💳' },
        { sender: 'me',   text: 'Posso aprirlo online o devo venire in filiale?' },
        { sender: 'them', text: 'Tutto online in 10 minuti: le serve solo SPID e un selfie con documento' },
        { sender: 'me',   text: 'Perfetto, lo apro stasera 😊' },
        { sender: 'them', text: 'Le invio il link via email tra poco. Buona giornata!' }
      ], 'cumulus')
    },

    {
      id: 'health_life_sciences',
      label: 'Health & Life Sciences (Healthcare, Pharma, MedTech)',
      scenario: s('Makana Health · Dr. Bianchi', 'online', '15:45', [
        { sender: 'me',   text: 'Buongiorno Dottoressa, le scrivo per fissare un controllo' },
        { sender: 'them', text: 'Salve! Tramite l\'app Makana Health può prenotare anche da solo, comunque ho disponibilità lunedì alle 17 o mercoledì alle 9' },
        { sender: 'me',   text: 'Mercoledì alle 9 mi va benissimo' },
        { sender: 'them', text: 'Perfetto, le mando il promemoria. Ricordi di portare le ultime analisi 📋' },
        { sender: 'me',   text: 'Le ho qui, le porto. Devo essere a digiuno?' },
        { sender: 'them', text: 'Sì, almeno 8 ore. Solo acqua' },
        { sender: 'me',   text: 'Ok grazie, a mercoledì!' }
      ], 'makana')
    },

    {
      id: 'retail_consumer_goods',
      label: 'Retail & Consumer Goods',
      scenario: s('Northern Trail Outfitters', 'online', '11:10', [
        { sender: 'me',   text: 'Buongiorno, ho un problema con l\'ordine #NTO-45872931' },
        { sender: 'them', text: 'Buongiorno! Mi dispiace, mi racconti pure cosa è successo' },
        { sender: 'me',   text: 'Gli scarponi arrivati sono della taglia sbagliata: ho ordinato il 42 ed è arrivato il 40' },
        { sender: 'them', text: 'Capisco. Le organizzo subito il reso gratuito e la spedizione del 42 corretto' },
        { sender: 'me',   text: 'Grazie mille! Quanto ci vuole?' },
        { sender: 'them', text: 'Il nuovo paio le arriverà entro 3-4 giorni lavorativi 📦' },
        { sender: 'me',   text: 'Perfetto, gentilissimi' }
      ], 'nto')
    },

    {
      id: 'manufacturing',
      label: 'Manufacturing',
      scenario: s('Badger · Ufficio Vendite', 'online', '09:30', [
        { sender: 'them', text: 'Buongiorno Ing. Conti, le invio il preventivo Badger per i cuscinetti serie K' },
        { sender: 'me',   text: 'Grazie! Per quando potete consegnare 200 unità?' },
        { sender: 'them', text: 'Con il listino standard, 6 settimane. Con priorità, 3 settimane (+15%)' },
        { sender: 'me',   text: 'Mi serve la priorità, abbiamo una linea ferma' },
        { sender: 'them', text: 'Ok, le confermo entro stasera lo slot di produzione' },
        { sender: 'me',   text: 'Grazie, attendo conferma scritta via email' },
        { sender: 'them', text: 'Certamente, le invio anche scheda tecnica aggiornata' }
      ], 'badger')
    },

    {
      id: 'communications_media',
      label: 'Communications & Media',
      scenario: s('Quadstar · Customer Care', 'online', '16:50', [
        { sender: 'me',   text: 'Buongiorno, vorrei capire perché la mia bolletta Quadstar è raddoppiata questo mese' },
        { sender: 'them', text: 'Buongiorno! Verifico subito il suo account, un attimo per favore' },
        { sender: 'them', text: 'Vedo che sono stati addebitati €40 per servizi premium non richiesti' },
        { sender: 'me',   text: 'Esatto, non li ho mai attivati io' },
        { sender: 'them', text: 'Glieli stornerò entro 48 ore e blocco da subito i servizi a pagamento' },
        { sender: 'me',   text: 'Grazie, gentilissimo' },
        { sender: 'them', text: 'Le invio il riepilogo via SMS. Buona giornata!' }
      ], 'quadstar')
    },

    {
      id: 'technology_software',
      label: 'Technology & Software',
      scenario: s('Welo · Giulia (CS)', 'online', '14:15', [
        { sender: 'them', text: 'Ciao Marco! Tutto ok con la nuova integrazione Welo API? 🙌' },
        { sender: 'me',   text: 'Ciao Giulia! Funziona, ma ho un dubbio sui webhook' },
        { sender: 'them', text: 'Dimmi pure, di cosa hai bisogno?' },
        { sender: 'me',   text: 'Ricevo l\'evento "invoice.paid" due volte, è normale?' },
        { sender: 'them', text: 'No, è un bug noto che abbiamo fixato nella v3.2 del Welo SDK' },
        { sender: 'them', text: 'Aggiorna alla 3.2 e dovrebbe sparire. Se vuoi fissiamo una call?' },
        { sender: 'me',   text: 'Provo subito, ti aggiorno 👍' }
      ], 'welo')
    },

    {
      id: 'automotive',
      label: 'Automotive',
      scenario: s('Electra Milano · Marco', 'online', '17:20', [
        { sender: 'me',   text: 'Buongiorno, vorrei prenotare un test drive della nuova Electra E5' },
        { sender: 'them', text: 'Ottimo! Le va bene sabato mattina alle 10?' },
        { sender: 'me',   text: 'Perfetto. Dove vi trovate esattamente?' },
        { sender: 'them', text: 'Viale Certosa 240, ci sono parcheggi davanti' },
        { sender: 'me',   text: 'Ok ci sarò' },
        { sender: 'them', text: 'Le serve qualcosa in particolare? Posso preparare anche un preventivo personalizzato' },
        { sender: 'me',   text: 'Sì grazie, sono interessato anche al leasing aziendale' }
      ], 'electra')
    },

    {
      id: 'energy_utilities',
      label: 'Energy & Utilities',
      scenario: s('Kenton Energy', 'online', '12:00', [
        { sender: 'me',   text: 'Buongiorno, vorrei passare alla tariffa monoraria fissa Kenton' },
        { sender: 'them', text: 'Ciao Sig.ra Rossi! Posso confermarle il passaggio entro fine mese' },
        { sender: 'them', text: 'Le costerà €68/mese fissi per 24 mesi, IVA inclusa' },
        { sender: 'me',   text: 'Mi sembra ottimo. Devo fare qualcosa?' },
        { sender: 'them', text: 'No, basta che mi confermi qui in chat e me ne occupo io' },
        { sender: 'me',   text: 'Confermo, procediamo' },
        { sender: 'them', text: 'Perfetto, le invio contratto via PEC entro oggi' }
      ], 'kenton')
    },

    {
      id: 'travel_hospitality',
      label: 'Travel, Transportation & Hospitality',
      scenario: s('Palonia Resort & Spa', 'online', '18:30', [
        { sender: 'me',   text: 'Buonasera, volevo confermare la prenotazione per il weekend al Palonia' },
        { sender: 'them', text: 'Buonasera Sig. Verdi! Confermo: Deluxe vista lago, check-in venerdì dalle 15' },
        { sender: 'me',   text: 'Avete la piscina riscaldata aperta?' },
        { sender: 'them', text: 'Sì, aperta tutto l\'anno 🏊 anche la SPA è disponibile' },
        { sender: 'me',   text: 'Fantastico! Si può prenotare un massaggio per sabato?' },
        { sender: 'them', text: 'Certo, le passo direttamente la SPA Palonia: 0341 234567' },
        { sender: 'me',   text: 'Grazie mille, a venerdì!' }
      ], 'palonia')
    },

    {
      id: 'education',
      label: 'Education',
      scenario: s('Connected University · Segreteria', 'online', '10:00', [
        { sender: 'me',   text: 'Buongiorno, vorrei iscrivermi al test di ammissione per la magistrale' },
        { sender: 'them', text: 'Buongiorno! Le iscrizioni Connected University sono aperte fino al 15 luglio sul portale studenti' },
        { sender: 'me',   text: 'Quanto costa la tassa di iscrizione al test?' },
        { sender: 'them', text: '€100 da pagare online dopo aver compilato il modulo' },
        { sender: 'me',   text: 'C\'è qualche borsa di studio disponibile?' },
        { sender: 'them', text: 'Sì, entro il 30/06 può chiedere la valutazione ISEE per ridurre la quota 🎓' },
        { sender: 'me',   text: 'Perfetto, grazie per le info!' }
      ], 'connecteduni')
    },

    {
      id: 'nonprofit',
      label: 'Nonprofit & Philanthropy',
      scenario: s('Steps Foundation · Sara', 'online', '13:30', [
        { sender: 'them', text: 'Ciao Anna! Grazie per il tuo interesse a diventare volontaria con Steps 💛' },
        { sender: 'me',   text: 'Ciao! Vorrei capire come funziona il programma di tutoraggio' },
        { sender: 'them', text: 'Dedichi 2 ore a settimana a un bambino con difficoltà scolastiche' },
        { sender: 'me',   text: 'Si fa in presenza o online?' },
        { sender: 'them', text: 'Entrambe! Anche online va benissimo, soprattutto se sei fuori Milano' },
        { sender: 'me',   text: 'Ok, come posso candidarmi?' },
        { sender: 'them', text: 'Ti invio link al modulo + breve call conoscitiva la settimana prossima' }
      ], 'steps')
    },

    {
      id: 'government_public',
      label: 'Government & Public Sector (incl. Federal)',
      scenario: s('Government of the Future · URP', 'online', '08:45', [
        { sender: 'me',   text: 'Buongiorno, devo richiedere un certificato di residenza' },
        { sender: 'them', text: 'Buongiorno! Lo può scaricare gratuitamente dal portale unico con identità digitale' },
        { sender: 'me',   text: 'Vale come quello cartaceo?' },
        { sender: 'them', text: 'Sì, è ufficiale e include firma digitale e timbro elettronico' },
        { sender: 'me',   text: 'Perfetto, grazie!' },
        { sender: 'them', text: 'Da quella stessa area può richiedere anche stato di famiglia ed estratti civili' },
        { sender: 'me',   text: 'Ottimo, semplifica molto. Buona giornata!' }
      ], 'government')
    },

    {
      id: 'real_estate',
      label: 'Real Estate',
      scenario: s('Pacifica Real Estate', 'online', '16:00', [
        { sender: 'them', text: 'Buongiorno! Le scrivo da Pacifica per l\'appartamento di Via Verdi 18 che ha visto online' },
        { sender: 'me',   text: 'Sì, è ancora disponibile?' },
        { sender: 'them', text: 'Sì, è libero. Vuole organizzare una visita?' },
        { sender: 'me',   text: 'Ci sarei oggi pomeriggio se possibile' },
        { sender: 'them', text: 'Ho disponibilità alle 17:30, le va bene?' },
        { sender: 'me',   text: 'Perfetto, ci vediamo lì' },
        { sender: 'them', text: 'Ottimo, le mando la posizione su WhatsApp 📍' }
      ], 'pacifica')
    }
  ];

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function get(id) {
    const ex = LIST.find((e) => e.id === id);
    return ex ? clone(ex.scenario) : null;
  }

  global.WAExamples = { LIST, get };
})(window);
