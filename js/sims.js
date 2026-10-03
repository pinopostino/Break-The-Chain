/* Esempi concreti mostrati nelle simulazioni: finte finestre (terminale, posta, elenchi) che si riempiono riga per riga.
   Per ogni tecnica due finestre, una per passaggio dell'attacco; per ogni difesa una finestra che la mostra al lavoro.
   Nomi, domini e indirizzi sono inventati: i domini finiscono in .example e gli IP sono quelli riservati alla documentazione.

   Tipi di riga: cmd (comando battuto), out (testo), bad (rosso), good (blu), kv ("Etichetta|valore"), p (paragrafo),
   file (allegato), btn (pulsante che viene premuto), swap (testo che si trasforma nel terzo valore), warn (indizio), stop (esito della difesa). */
window.SLC = window.SLC || {};
(function (G) {
  const T = (app, side, rows) => ({ app, kind: 't', side, rows });   // finestra tipo terminale
  const A = (app, side, rows) => ({ app, kind: 'a', side, rows });   // finestra tipo applicazione

  const tech = {
    scan: [
      T("Terminale dell'attaccante", 'atk', [
        ['cmd', 'nmap -sV 203.0.113.0/28'],
        ['out', 'Scansione di 16 indirizzi…'],
        ['out', '203.0.113.10   80/tcp    aperta   http'],
        ['out', '203.0.113.10   443/tcp   aperta   https'],
        ['out', '203.0.113.12   3389/tcp  aperta   desktop remoto'],
      ]),
      T("Terminale dell'attaccante", 'atk', [
        ['out', '203.0.113.10   443/tcp   Apache Struts 2.3.31'],
        ['bad', '→ versione con una vulnerabilità nota'],
        ['out', '203.0.113.12   3389/tcp  accesso con sola password'],
        ['bad', '→ buono per provare password rubate'],
      ]),
    ],
    osint: [
      A('Browser · rete professionale', 'atk', [
        ['kv', 'Cerca|dipendenti «Acquedotto di Valdoria»'],
        ['out', 'Marta Ferri · Contabilità fornitori'],
        ['out', 'Luca Brandi · Tecnico sistemi di controllo'],
        ['out', 'Paolo Sarti · Direttore generale'],
        ['bad', 'Dal profilo di Luca: «gestisco l\'accesso remoto alle pompe»'],
      ]),
      T("Appunti dell'attaccante", 'atk', [
        ['out', 'Formato email: iniziale.cognome@acquedotto-valdoria.example'],
        ['out', 'm.ferri   paga le fatture   → finta fattura'],
        ['out', 'l.brandi  ha accesso remoto → rubargli le credenziali'],
        ['bad', 'Tutto raccolto senza toccare la rete del bersaglio.'],
      ]),
    ],
    infophish: [
      A('Posta in arrivo · Marta Ferri', 'org', [
        ['kv', 'Da|Luca Brandi <l.brandi@acquedotto-valdorla.example>'],
        ['kv', 'Oggetto|Mi serve una mano veloce'],
        ['p', 'Ciao Marta, sono fuori sede e non trovo l\'interno del fornitore delle pompe. Mi scrivi anche chi approva i pagamenti? Grazie!'],
      ]),
      A('Posta in arrivo · Marta Ferri', 'org', [
        ['btn', 'Rispondi'],
        ['p', '«Certo! Il fornitore è Idrotec, interno 214. I pagamenti li approva Paolo Sarti.»'],
        ['bad', 'Marta ha confermato fornitore, interno e chi firma.'],
        ['bad', 'Il mittente non era Luca: nel dominio c\'è una «l» al posto della «i».'],
      ]),
    ],
    maldev: [
      T("Laboratorio dell'attaccante", 'atk', [
        ['out', 'Bersaglio: postazioni di controllo pompe, Windows 10'],
        ['cmd', 'compila --bersaglio valdoria --offusca'],
        ['out', 'Creato: aggiornamento_pompe.exe'],
        ['bad', 'File unico, mai visto prima da nessun antivirus.'],
      ]),
      T("Laboratorio dell'attaccante", 'atk', [
        ['cmd', 'prova-antivirus aggiornamento_pompe.exe'],
        ['out', 'Antivirus A …… non rilevato'],
        ['out', 'Antivirus B …… RILEVATO → modifico e riprovo'],
        ['out', 'Antivirus B …… non rilevato'],
        ['bad', 'Pronto: le firme note non lo riconoscono.'],
      ]),
    ],
    domain: [
      A('Registrazione domini', 'atk', [
        ['kv', 'Vero|acquedotto-valdoria.example'],
        ['kv', 'Libero|acquedotto-valdorla.example'],
        ['btn', 'Registra · 9 €'],
        ['bad', 'Una «l» al posto della «i»: a colpo d\'occhio sono uguali.'],
      ]),
      A('Browser', 'org', [
        ['kv', 'Indirizzo|https://posta.acquedotto-valdorla.example/accedi'],
        ['p', 'Accedi alla posta aziendale'],
        ['out', '[ nome utente ]   [ password ]'],
        ['bad', 'Pagina copiata dall\'originale, con tanto di lucchetto HTTPS.'],
      ]),
    ],
    tool: [
      A('Mercato nero', 'atk', [
        ['out', 'Kit di phishing completo …………… 80 €'],
        ['out', 'Ransomware in affitto ………… 30% del riscatto'],
        ['out', 'Accessi VPN aziendali ………… da 200 €'],
        ['btn', 'Aggiungi al carrello'],
      ]),
      T("Terminale dell'attaccante", 'atk', [
        ['out', 'Scaricato: kit con manuale e assistenza clienti'],
        ['cmd', 'avvia-campagna --bersagli elenco.txt'],
        ['bad', 'Non serve saper scrivere malware: basta comprarlo.'],
      ]),
    ],
    phish: [
      A('Posta in arrivo · Marta Ferri', 'org', [
        ['kv', 'Da|Idrotec Fatture <fatture@idrotec-pagamenti.example>'],
        ['kv', 'Oggetto|Sollecito: fattura 2291 scaduta'],
        ['p', 'Gentile Marta, in allegato la fattura non saldata. La preghiamo di verificare entro oggi per evitare la sospensione del servizio.'],
        ['file', 'Fattura_2291.xlsm'],
      ]),
      A('Posta in arrivo · Marta Ferri', 'org', [
        ['btn', 'Apri allegato'],
        ['out', 'Excel sta aprendo Fattura_2291.xlsm…'],
        ['bad', 'Il file contatta 198.51.100.77 e scarica un programma.'],
        ['bad', 'L\'attaccante ora ha un piede nel computer di Marta.'],
      ]),
    ],
    usb: [
      A('Parcheggio dei dipendenti', 'org', [
        ['p', 'Vicino all\'ingresso c\'è una chiavetta con un\'etichetta scritta a mano:'],
        ['file', 'STIPENDI 2026 · RISERVATO'],
        ['p', 'Luca la raccoglie e la collega al computer per capire di chi è.'],
      ]),
      A('Esplora file · unità USB', 'org', [
        ['out', 'Stipendi_2026.pdf.exe'],
        ['btn', 'Apri'],
        ['bad', 'Sembrava un PDF: era un programma.'],
        ['bad', 'È partito dentro la rete, senza passare da firewall né filtri email.'],
      ]),
    ],
    remote: [
      T("Terminale dell'attaccante", 'atk', [
        ['cmd', 'cerca-servizi desktop-remoto valdoria'],
        ['out', '203.0.113.12:3389 — desktop remoto esposto su Internet'],
        ['bad', 'Nessun secondo fattore richiesto.'],
      ]),
      A('Desktop remoto · accesso', 'org', [
        ['kv', 'Utente|l.brandi'],
        ['kv', 'Password|••••••••••'],
        ['btn', 'Accedi'],
        ['bad', 'Accesso riuscito: l\'attaccante vede il desktop di Luca.'],
      ]),
    ],
    supply: [
      T('Server del fornitore Idrotec', 'atk', [
        ['out', 'Accesso al server che pubblica gli aggiornamenti'],
        ['cmd', 'inserisci backdoor in ControlloPompe_4.2.msi'],
        ['out', 'Il pacchetto resta firmato da Idrotec.'],
        ['bad', 'Per chi lo scarica è un aggiornamento autentico.'],
      ]),
      A('Aggiornamento software', 'org', [
        ['p', 'È disponibile ControlloPompe 4.2'],
        ['kv', 'Editore|Idrotec S.r.l. (firma valida)'],
        ['btn', 'Installa'],
        ['bad', 'Insieme all\'aggiornamento è entrata la backdoor.'],
      ]),
    ],
    pubexp: [
      T("Terminale dell'attaccante", 'atk', [
        ['out', 'Bersaglio: portale clienti, Apache Struts 2.3.31'],
        ['out', 'CVE-2017-5638: correzione pubblicata, qui mai installata'],
        ['cmd', 'invia richiesta con intestazione manipolata'],
      ]),
      T('Registro del server web', 'org', [
        ['out', '10:42:07  GET  /portale/accedi   200'],
        ['bad', '10:42:09  POST /portale/carica   intestazione anomala (2,1 KB)'],
        ['bad', '10:42:09  il server esegue un comando ricevuto da fuori'],
        ['bad', 'L\'attaccante ora dà ordini al server.'],
      ]),
    ],
    macro: [
      A('Excel · Fattura_2291.xlsm', 'org', [
        ['warn', 'AVVISO DI SICUREZZA · Le macro sono state disattivate.'],
        ['p', '«Per visualizzare la fattura clicca su Abilita contenuto»'],
        ['btn', 'Abilita contenuto'],
      ]),
      A('Excel · Fattura_2291.xlsm', 'org', [
        ['out', 'Macro in esecuzione…'],
        ['bad', 'Scarica https://cdn-update.example/a.bin'],
        ['bad', 'Avvia il programma scaricato'],
        ['p', 'Sullo schermo intanto compare una fattura qualsiasi: Marta non nota nulla.'],
      ]),
    ],
    valid: [
      A('Mercato nero', 'atk', [
        ['out', 'Fuga di dati «Forum Idraulica 2024» · 40.000 account'],
        ['out', 'l.brandi@acquedotto-valdoria.example : Pompe2019!'],
        ['bad', 'Luca usava la stessa password anche al lavoro.'],
      ]),
      A('VPN aziendale', 'org', [
        ['kv', 'Utente|l.brandi'],
        ['kv', 'Password|Pompe2019!'],
        ['btn', 'Connetti'],
        ['out', 'Accesso consentito · ore 02:14 · da un paese mai visto'],
        ['bad', 'Credenziali giuste: nessun allarme.'],
      ]),
    ],
    autorun: [
      T('Malware sul computer di Marta', 'atk', [
        ['cmd', 'aggiungi voce di avvio «AggiornamentoGrafica»'],
        ['out', 'Registro …\\CurrentVersion\\Run → AppData\\gfxupd.exe'],
        ['bad', 'Il nome è scelto per sembrare innocuo.'],
      ]),
      A('Programmi all\'avvio di Windows', 'org', [
        ['out', 'Antivirus'],
        ['out', 'Driver della stampante'],
        ['bad', 'AggiornamentoGrafica'],
        ['bad', 'A ogni accensione il malware riparte e richiama l\'attaccante.'],
      ]),
    ],
    acct: [
      T("Terminale dell'attaccante, sul server", 'atk', [
        ['cmd', 'crea utente svc_backup2 --gruppo Amministratori'],
        ['out', 'Utente creato.'],
        ['bad', 'Sembra un account di servizio come tanti.'],
      ]),
      A('Utenti del server', 'org', [
        ['out', 'Administrator'],
        ['out', 'svc_backup'],
        ['bad', 'svc_backup2 · creato stanotte alle 03:12'],
        ['out', 'l.brandi'],
        ['bad', 'Anche tolto il malware, l\'attaccante rientra con questo account.'],
      ]),
    ],
    service: [
      T("Terminale dell'attaccante, sul server", 'atk', [
        ['cmd', 'installa servizio «Windows Telemetry Helper» --avvio automatico'],
        ['out', 'Servizio installato. Esegue come: SYSTEM'],
        ['bad', 'SYSTEM è il livello di privilegio più alto.'],
      ]),
      A('Servizi di Windows', 'org', [
        ['out', 'Windows Update …………… in esecuzione'],
        ['out', 'Spooler di stampa ………… in esecuzione'],
        ['bad', 'Windows Telemetry Helper … in esecuzione'],
        ['bad', 'Uno tra duecento: chi lo nota?'],
      ]),
    ],
    c2web: [
      T('Traffico in uscita dal computer di Marta', 'org', [
        ['out', '09:00:12  HTTPS → posta.acquedotto-valdoria.example'],
        ['out', '09:00:40  HTTPS → notizie.example'],
        ['bad', '09:01:00  HTTPS → cdn-update.example'],
        ['bad', '09:02:00  HTTPS → cdn-update.example'],
        ['bad', '09:03:00  HTTPS → cdn-update.example'],
      ]),
      T("Pannello di comando dell'attaccante", 'atk', [
        ['out', 'PC-FERRI collegato · ultimo contatto 4 secondi fa'],
        ['cmd', 'esegui: elenca cartelle condivise'],
        ['out', '\\\\server\\contabilita   \\\\server\\impianti'],
        ['bad', 'Ogni 60 secondi il computer chiede ordini, nascosto nel traffico web.'],
      ]),
    ],
    c2dns: [
      T('Richieste DNS dal computer di Marta', 'org', [
        ['out', 'posta.acquedotto-valdoria.example'],
        ['out', 'notizie.example'],
        ['bad', '4d5a9000a1.t.cdn-update.example'],
        ['bad', 'ff03be117c.t.cdn-update.example'],
        ['bad', '0c88e2d4f0.t.cdn-update.example'],
      ]),
      T("Pannello di comando dell'attaccante", 'atk', [
        ['cmd', 'decodifica 4d5a9000a1 ff03be117c 0c88e2d4f0'],
        ['out', '→ «PC-FERRI pronto, attendo ordini»'],
        ['out', 'Gli ordini tornano indietro dentro le risposte DNS.'],
        ['bad', 'Il DNS serve a tutto: quasi nessuno lo blocca o lo guarda.'],
      ]),
    ],
    rat: [
      A('Programmi installati sul computer di Marta', 'org', [
        ['out', 'Suite per ufficio'],
        ['out', 'Lettore PDF'],
        ['bad', 'AssistenzaRemota Pro · installato ieri alle 23:50'],
        ['p', 'È un programma commerciale vero, lo stesso che usano i tecnici.'],
      ]),
      A('AssistenzaRemota Pro · sessione attiva', 'atk', [
        ['out', 'Collegato a PC-FERRI · controllo completo'],
        ['out', 'Il puntatore si muove da solo, le finestre si aprono.'],
        ['bad', 'L\'antivirus non protesta: il programma è legittimo.'],
      ]),
    ],
    ransom: [
      A('Cartella condivisa · Contabilità', 'org', [
        ['swap', 'Bilancio_2025.xlsx', 'Bilancio_2025.xlsx.locked'],
        ['swap', 'Fatture_marzo.pdf', 'Fatture_marzo.pdf.locked'],
        ['swap', 'Turni_impianto.docx', 'Turni_impianto.docx.locked'],
        ['swap', 'Planimetrie_rete.dwg', 'Planimetrie_rete.dwg.locked'],
        ['swap', 'Stipendi_aprile.xlsx', 'Stipendi_aprile.xlsx.locked'],
      ]),
      T('LEGGIMI.txt', 'atk', [
        ['bad', 'I TUOI FILE SONO CIFRATI.'],
        ['out', 'Per riaverli: 40 bitcoin entro 72 ore.'],
        ['out', 'Dopo, il prezzo raddoppia.'],
        ['out', 'Non spegnere i computer. Non chiamare nessuno.'],
      ]),
    ],
    exfil: [
      T("Terminale dell'attaccante, sul server", 'atk', [
        ['cmd', 'comprimi \\\\server\\contabilita → dati.7z'],
        ['out', '12.480 file · 3,1 GB'],
        ['cmd', 'dividi dati.7z in blocchi da 20 MB'],
      ]),
      T('Traffico in uscita dal server', 'org', [
        ['bad', '02:10  HTTPS → cdn-update.example   20 MB'],
        ['bad', '02:25  HTTPS → cdn-update.example   20 MB'],
        ['bad', '02:40  HTTPS → cdn-update.example   20 MB'],
        ['out', 'Di notte, a piccoli pezzi, per non farsi notare.'],
      ]),
    ],
    wipe: [
      T('Server degli impianti', 'org', [
        ['swap', 'Disco D:  dati degli impianti', 'Disco D:  SOVRASCRITTO'],
        ['swap', 'Disco E:  archivio storico', 'Disco E:  SOVRASCRITTO'],
        ['swap', 'Settore di avvio', 'Settore di avvio: DISTRUTTO'],
      ]),
      T('Schermo del server', 'atk', [
        ['bad', 'Sistema operativo non trovato.'],
        ['out', 'Nessuna richiesta di riscatto.'],
        ['out', 'Nessuna chiave da comprare.'],
        ['bad', 'Si riparte solo se esiste una copia dei dati altrove.'],
      ]),
    ],
  };

  const def = {
    hard: T('Firewall perimetrale · regole', 'def', [
      ['out', '80/tcp     chiusa   (non serve)'],
      ['out', '3389/tcp   chiusa   (desktop remoto solo attraverso la VPN)'],
      ['out', '443/tcp    aperta   portale clienti'],
      ['stop', 'La scansione trova una sola porta, e il desktop remoto non è più raggiungibile da fuori.'],
    ]),
    social: A('Regole per i profili pubblici', 'def', [
      ['out', 'Sì: nome e ruolo generico'],
      ['bad', 'No: sistemi che gestisci, fornitori, organigramma'],
      ['out', 'Prima: «gestisco l\'accesso remoto alle pompe»'],
      ['good', 'Dopo: «tecnico presso l\'Acquedotto di Valdoria»'],
      ['stop', 'L\'attaccante non capisce più chi vale la pena colpire.'],
    ]),
    ti: A('Threat intelligence · bollettino', 'def', [
      ['out', 'Gruppo attivo contro acquedotti e servizi pubblici'],
      ['out', 'Compra sul mercato nero il kit «PortaAperta» v3'],
      ['out', 'Server di comando del kit: cdn-update.example'],
      ['good', 'Indicatori del kit caricati su antivirus e firewall'],
      ['stop', 'Uno strumento già noto viene riconosciuto al primo tentativo.'],
    ]),
    mailf: T('Filtro email · analisi del messaggio', 'def', [
      ['out', 'Da: fatture@idrotec-pagamenti.example'],
      ['bad', 'Dominio registrato 2 giorni fa'],
      ['bad', 'Mittente mai visto prima'],
      ['bad', 'Allegato .xlsm con macro'],
      ['stop', 'Messaggio in quarantena: non arriva nella casella di Marta.'],
    ]),
    usbb: A('Criterio sui dispositivi', 'def', [
      ['out', 'Rilevata una memoria USB sconosciuta'],
      ['out', 'Regola: solo chiavette aziendali registrate'],
      ['stop', 'Dispositivo bloccato. Segnalazione inviata al reparto IT.'],
    ]),
    train: A('Marta, dopo la formazione', 'def', [
      ['warn', 'Indizio 1 · il dominio non è quello del fornitore'],
      ['warn', 'Indizio 2 · mette fretta: «entro oggi»'],
      ['warn', 'Indizio 3 · allegato inatteso'],
      ['btn', 'Segnala come phishing'],
      ['stop', 'Marta non apre e avvisa l\'IT, che blocca il mittente per tutti.'],
    ]),
    patch: T('Gestione delle patch', 'def', [
      ['out', 'Apache Struts 2.3.31 → vulnerabile (CVE-2017-5638)'],
      ['cmd', 'installa aggiornamento 2.3.32'],
      ['good', 'Aggiornato a 3 giorni dalla pubblicazione della correzione'],
      ['stop', 'La richiesta manipolata viene respinta: la falla non c\'è più.'],
    ]),
    nomacro: A('Criterio di Office', 'def', [
      ['out', 'Macro nei file arrivati da Internet: bloccate'],
      ['out', 'Pulsante «Abilita contenuto»: non mostrato'],
      ['stop', 'La macro non può partire, nemmeno se Marta volesse.'],
    ]),
    edr: T('EDR · avviso sul computer di Marta', 'def', [
      ['bad', 'excel.exe ha avviato un programma appena scaricato'],
      ['bad', 'Il programma si aggiunge all\'avvio automatico'],
      ['bad', 'Poi modifica 300 file al minuto'],
      ['good', 'Processo terminato · computer isolato dalla rete'],
      ['stop', 'Il file era sconosciuto, ma il comportamento no.'],
    ]),
    audit: T('Audit degli account · rapporto settimanale', 'def', [
      ['out', 'Account attivi: 214'],
      ['out', 'Con richiesta approvata: 213'],
      ['bad', 'Senza richiesta: svc_backup2 (creato alle 03:12, amministratore)'],
      ['stop', 'Account disattivato e indagine aperta.'],
    ]),
    proxy: T('Proxy · ispezione del traffico', 'def', [
      ['out', 'posta.acquedotto-valdoria.example   consentito'],
      ['bad', 'cdn-update.example   categoria sconosciuta'],
      ['bad', 'Contatti a intervalli regolari di 60 secondi'],
      ['stop', 'Connessione bloccata: il malware resta senza ordini e i dati non escono.'],
    ]),
    dnsmon: T('Monitoraggio DNS', 'def', [
      ['out', 'PC-FERRI: 40 richieste all\'ora (normale)'],
      ['bad', 'PC-FERRI: 2.900 richieste all\'ora verso *.t.cdn-update.example'],
      ['bad', 'Nomi lunghi e casuali: non sono siti veri'],
      ['stop', 'Dominio bloccato e computer segnalato.'],
    ]),
    backup: T('Backup offline', 'def', [
      ['out', 'Copia di ieri notte: completa'],
      ['out', 'Supporto scollegato dalla rete dopo la copia'],
      ['cmd', 'ripristina \\\\server\\contabilita dalla copia di ieri'],
      ['good', '12.480 file ripristinati'],
      ['stop', 'Niente riscatto: si perde un giorno di lavoro, non l\'archivio.'],
    ]),
    dlp: T('DLP · avviso', 'def', [
      ['bad', 'Il server sta inviando 20 MB verso un sito esterno'],
      ['bad', 'Contenuto: 4.000 codici fiscali, 1.200 IBAN'],
      ['out', 'Regola: i dati personali non escono senza autorizzazione'],
      ['stop', 'Trasferimento bloccato.'],
    ]),
    mfa: A('Accesso con secondo fattore', 'def', [
      ['kv', 'Utente|l.brandi'],
      ['kv', 'Password|Pompe2019! (corretta)'],
      ['out', 'Inserisci il codice dell\'app sul telefono: ______'],
      ['bad', 'L\'attaccante ha la password, ma non il telefono di Luca.'],
      ['stop', 'Accesso negato. Luca riceve una notifica che non ha chiesto e avvisa l\'IT.'],
    ]),
    domwatch: A('Sorveglianza domini · avviso', 'def', [
      ['out', 'Nuovo dominio registrato oggi:'],
      ['bad', 'acquedotto-valdorla.example'],
      ['out', 'Somiglianza con il tuo: 96%'],
      ['good', 'Bloccato su posta e proxy · richiesta di chiusura inviata'],
      ['stop', 'La trappola è nota prima che parta la prima email.'],
    ]),
    vendor: T('Verifica fornitori · prova dell\'aggiornamento', 'def', [
      ['out', 'ControlloPompe_4.2.msi · firma valida'],
      ['cmd', 'installa in ambiente di prova e osserva'],
      ['bad', 'Il programma contatta cdn-update.example'],
      ['bad', 'Comportamento non previsto dalle note di rilascio'],
      ['stop', 'Aggiornamento respinto. Idrotec viene avvisata.'],
    ]),
    least: A('Privilegi minimi', 'def', [
      ['out', 'Utente: m.ferri · gruppo: utenti standard'],
      ['out', 'Richiesta: installare un servizio di sistema'],
      ['bad', 'Serve un amministratore.'],
      ['stop', 'Operazione negata: il malware resta senza i permessi per mettere radici.'],
    ]),
    allow: A('Lista delle applicazioni', 'def', [
      ['out', 'Programmi approvati: 46'],
      ['out', 'Richiesta di avvio: AssistenzaRemota Pro'],
      ['bad', 'Non è nella lista.'],
      ['stop', 'Esecuzione bloccata, anche se il programma in sé è pulito.'],
    ]),
    segm: T('Segmentazione di rete · regole tra le zone', 'def', [
      ['out', 'Uffici <-> server: solo posta e stampa'],
      ['out', 'Uffici <-> impianti: nessun collegamento'],
      ['bad', 'PC-FERRI tenta di raggiungere i server degli impianti'],
      ['stop', 'Connessione rifiutata: il danno resta nella zona uffici.'],
    ]),
  };

  G.SIMWIN = { tech, def };
})(window.SLC);
