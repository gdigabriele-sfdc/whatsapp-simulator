# WhatsApp Simulator

Mini-sito statico (HTML + CSS + JS, zero dipendenze) che mostra un iPhone con WhatsApp aperto e una conversazione che avanza a ogni click. Pensato per registrare demo, screencast o presentazioni.

## Funzionalità

- **Schermata di configurazione**: imposti nome contatto, stato, avatar (upload con compressione automatica) e la lista dei messaggi da simulare.
- **Simulatore iPhone**: cornice in stile iPhone moderno con Dynamic Island e UI WhatsApp.
- **Click per avanzare**: ogni tap sulla schermata avanza la conversazione di uno step.
  - Per i **tuoi** messaggi: il primo click fa salire la tastiera iOS e digita il messaggio carattere per carattere (con highlight sui tasti); il secondo click invia la bolla nella chat.
  - Per i messaggi **dell'altro**: il click chiude la tastiera, mostra "sta scrivendo..." nell'header e, dopo una piccola pausa proporzionale alla lunghezza del testo, fa apparire la bolla.
- **Esporta / Importa** uno scenario in JSON per salvarlo o condividerlo.
- **Persistenza locale**: tutto è salvato nel `localStorage` del browser (nessun backend).

## Avvio

Opzione 1 (la più rapida): apri direttamente `index.html` con doppio click nel browser.

Opzione 2 (consigliata, evita eventuali restrizioni CORS sui file locali):

```bash
cd /Users/gdigabriele/code/whatsapp-simulator
python3 -m http.server 8000
```

Poi vai su [http://localhost:8000](http://localhost:8000).

## Struttura

```
.
├── index.html              # Pagina unica: configurazione + simulatore
├── README.md
├── css/
│   ├── styles.css          # Layout pagina + form di configurazione
│   └── whatsapp.css        # iPhone frame + UI WhatsApp + tastiera
├── js/
│   ├── storage.js          # Schema dati + load/save in localStorage
│   ├── config.js           # Form contatto, lista messaggi, import/export
│   └── simulator.js        # Macchina a stati della simulazione
└── assets/
    └── default-avatar.svg  # Avatar di fallback
```

## Come usarlo

1. Apri la pagina: vedi la **schermata di configurazione** con uno scenario di esempio già precaricato.
2. Modifica nome, stato e (opzionalmente) carica un avatar cliccando sul cerchio.
3. Aggiungi / rimuovi / riordina i messaggi (toggle `Io` / `Lui-Lei` per scegliere chi parla).
4. Premi **Avvia simulazione**: si apre l'iPhone.
5. **Clicca sull'iPhone** per far avanzare la conversazione.
6. In alto puoi premere **↻ Riavvia** per ricominciare da capo, o **← Modifica configurazione** per tornare al form.

## Dati salvati

Lo scenario corrente vive nel `localStorage` con chiave `wa-simulator:scenario-v1`:

```jsonc
{
  "contact": {
    "name": "Anna Bianchi",
    "status": "online",
    "avatarDataUrl": null   // oppure stringa "data:image/jpeg;base64,..."
  },
  "messages": [
    { "sender": "them", "text": "Ciao!" },
    { "sender": "me",   "text": "Ciao, come stai?" }
  ]
}
```

Puoi esportarlo come file JSON con il pulsante **Esporta JSON** e re-importarlo con **Importa JSON**. **Ripristina esempio** rimette lo scenario predefinito.

## Compatibilità

Testato sui browser moderni (Chrome, Safari, Firefox, Edge). Niente build step, niente Node, niente npm.
