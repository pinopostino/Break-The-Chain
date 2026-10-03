/* Dati di gioco: fasi, tecniche dell'attaccante, difese, joker, missioni della campagna, icone.
   Per aggiungere contenuti basta modificare questo file: la logica sta in game.js. */
window.SLC = window.SLC || {};
(function (G) {
  G.PHASES = ['Ricognizione', 'Armamento', 'Consegna', 'Exploit', 'Installazione', 'Comando (C2)', 'Obiettivo'];

  // Un attacco si risolve in tre turni: ogni turno copre alcune fasi della kill chain.
  G.TURNS = [
    { n: 'Preparazione', ph: [0, 1, 2] },
    { n: 'Intrusione', ph: [3, 4] },
    { n: 'Impatto', ph: [5, 6] },
  ];

  // Tecniche possibili per ogni fase. k = chiave interna, id = codice MITRE ATT&CK, i = icona.
  G.TECH = [
    [ { k: 'scan', id: 'T1595', i: 'cross', n: 'Scansione attiva', d: 'Sonda la rete dall\'esterno per trovare porte e servizi esposti.' },
      { k: 'osint', id: 'T1589', i: 'eye', n: 'Raccolta identità', d: 'Raccoglie nomi, ruoli ed email dei dipendenti da fonti pubbliche.' },
      { k: 'infophish', id: 'T1598', i: 'mail', n: 'Phishing esplorativo', d: 'Scrive ai dipendenti fingendosi un collega per farsi dare informazioni.' } ],
    [ { k: 'maldev', id: 'T1587.001', i: 'bug', n: 'Malware su misura', d: 'Sviluppa un malware costruito apposta per questo bersaglio.' },
      { k: 'domain', id: 'T1583.001', i: 'globe', n: 'Dominio sosia', d: 'Registra un dominio quasi identico a quello dell\'organizzazione.' },
      { k: 'tool', id: 'T1588.002', i: 'crate', n: 'Strumenti comprati', d: 'Compra sul mercato nero strumenti d\'attacco già pronti.' } ],
    [ { k: 'phish', id: 'T1566.001', i: 'hook', n: 'Spear phishing', d: 'Invia una email mirata con un allegato malevolo.' },
      { k: 'usb', id: 'T1091', i: 'usb', n: 'Chiavetta infetta', d: 'Lascia un supporto USB dove un dipendente lo troverà.' },
      { k: 'remote', id: 'T1133', i: 'door', n: 'Accesso remoto esposto', d: 'Entra da una VPN o da un desktop remoto raggiungibile da Internet.' },
      { k: 'supply', id: 'T1195.002', i: 'boxin', n: 'Aggiornamento avvelenato', d: 'Infetta l\'aggiornamento di un software di cui l\'organizzazione si fida.' } ],
    [ { k: 'pubexp', id: 'T1190', i: 'bolt', n: 'Exploit web', d: 'Sfrutta una vulnerabilità nota di un servizio raggiungibile da Internet.' },
      { k: 'macro', id: 'T1204.002', i: 'file', n: 'Macro malevola', d: 'L\'utente apre il file e ne esegue il codice.' },
      { k: 'valid', id: 'T1078', i: 'idcard', n: 'Credenziali rubate', d: 'Usa nome utente e password veri, comprati o rubati altrove.' } ],
    [ { k: 'autorun', id: 'T1547', i: 'power', n: 'Avvio automatico', d: 'Il malware si registra per ripartire a ogni accensione.' },
      { k: 'acct', id: 'T1136', i: 'ghost', n: 'Account fantasma', d: 'Crea un nuovo account per rientrare quando vuole.' },
      { k: 'service', id: 'T1543.003', i: 'gear', n: 'Servizio di sistema', d: 'Si installa come servizio di Windows, con i privilegi più alti.' } ],
    [ { k: 'c2web', id: 'T1071.001', i: 'antenna', n: 'C2 su HTTPS', d: 'Riceve ordini nascosto nel normale traffico web.' },
      { k: 'c2dns', id: 'T1071.004', i: 'arrows', n: 'Tunnel DNS', d: 'Riceve ordini nascosto nelle richieste DNS.' },
      { k: 'rat', id: 'T1219', i: 'screen', n: 'Assistenza remota', d: 'Usa un normale programma di assistenza remota per comandare la macchina.' } ],
    [ { k: 'ransom', id: 'T1486', i: 'dollar', n: 'Ransomware', d: 'Cifra i dati e chiede un riscatto.' },
      { k: 'exfil', id: 'T1041', i: 'boxout', n: 'Esfiltrazione', d: 'Copia i dati fuori dalla rete attraverso il canale di comando.' },
      { k: 'wipe', id: 'T1485', i: 'flame', n: 'Distruzione dati', d: 'Cancella o sovrascrive i dati per fermare l\'organizzazione.' } ],
  ];

  // c = costo in crediti, p = punti Copertura, x = tecniche che la carta ferma.
  // start: true = fa parte della collezione iniziale; le altre si comprano durante la campagna.
  G.DEFS = [
    { k: 'hard', start: true, n: 'Hardening perimetro', c: 2, p: 30, i: 'shield', x: ['scan', 'remote'], d: 'Chiude porte e servizi inutili: da fuori si vede e si raggiunge poco.' },
    { k: 'social', start: true, n: 'Igiene social', c: 1, p: 20, i: 'bubble', x: ['osint'], d: 'Regole su cosa si pubblica online: meno informazioni da raccogliere.' },
    { k: 'ti', start: true, n: 'Threat intelligence', c: 2, p: 30, i: 'lens', x: ['tool'], d: 'Conosci in anticipo gli strumenti già usati dall\'avversario e sai riconoscerli.' },
    { k: 'mailf', start: true, n: 'Filtro email', c: 2, p: 40, i: 'mail', x: ['phish', 'infophish'], d: 'Blocca i messaggi malevoli prima che arrivino nella casella.' },
    { k: 'usbb', start: true, n: 'Blocco porte USB', c: 1, p: 25, i: 'usb', x: ['usb'], d: 'I computer aziendali rifiutano i supporti non autorizzati.' },
    { k: 'train', start: true, n: 'Formazione', c: 2, p: 30, i: 'person', x: ['phish', 'infophish', 'usb'], d: 'I dipendenti riconoscono l\'inganno e non ci cascano.' },
    { k: 'patch', start: true, n: 'Patch management', c: 2, p: 40, i: 'plus', x: ['pubexp'], d: 'Le vulnerabilità note vengono corrette prima che qualcuno le sfrutti.' },
    { k: 'nomacro', start: true, n: 'Macro disattivate', c: 1, p: 25, i: 'doc', x: ['macro'], d: 'I documenti non possono eseguire codice.' },
    { k: 'edr', start: true, n: 'EDR', c: 3, p: 45, i: 'radar', x: ['maldev', 'autorun', 'service', 'ransom'], d: 'Endpoint Detection and Response: sorveglia i computer e ferma i comportamenti anomali, anche quelli di un malware mai visto.' },
    { k: 'audit', start: true, n: 'Audit account', c: 1, p: 25, i: 'key', x: ['acct'], d: 'Controlli periodici trovano gli account che nessuno ha richiesto.' },
    { k: 'proxy', start: true, n: 'Proxy con ispezione', c: 2, p: 35, i: 'lock', x: ['c2web', 'exfil'], d: 'Apre e controlla il traffico web cifrato in uscita.' },
    { k: 'dnsmon', start: true, n: 'Monitoraggio DNS', c: 2, p: 30, i: 'antenna', x: ['c2dns'], d: 'Nota le richieste DNS anomale per volume e forma.' },
    { k: 'backup', start: true, n: 'Backup offline', c: 2, p: 40, i: 'disk', x: ['ransom', 'wipe'], d: 'Una copia dei dati che l\'attaccante non può raggiungere.' },
    { k: 'dlp', start: true, n: 'DLP', c: 1, p: 35, i: 'wall', x: ['exfil'], d: 'Data Loss Prevention: impedisce ai dati riservati di lasciare la rete.' },
    { k: 'mfa', n: 'MFA', c: 2, p: 40, i: 'phone', x: ['remote', 'valid'], d: 'Per entrare serve un secondo fattore: una password rubata non basta più.' },
    { k: 'domwatch', n: 'Sorveglianza domini', c: 1, p: 25, i: 'flag', x: ['domain'], d: 'Ti avvisa quando qualcuno registra un dominio simile al tuo.' },
    { k: 'vendor', n: 'Verifica fornitori', c: 2, p: 35, i: 'check', x: ['supply'], d: 'Controlli di sicurezza su chi ti fornisce software e servizi, e sui loro aggiornamenti.' },
    { k: 'least', n: 'Privilegi minimi', c: 2, p: 35, i: 'steps', x: ['service', 'acct'], d: 'Ogni utente ha solo i permessi che gli servono: senza diritti di amministratore non si installa nulla.' },
    { k: 'allow', n: 'Lista applicazioni', c: 2, p: 35, i: 'list', x: ['rat', 'macro'], d: 'Sui computer girano solo i programmi approvati.' },
    { k: 'segm', n: 'Segmentazione di rete', c: 2, p: 45, i: 'grid', x: ['wipe', 'ransom'], d: 'La rete è divisa in zone: un danno in una zona non raggiunge le altre.' },
  ];

  G.EDITIONS = {
    foil: { n: 'Foil', e: '+20 Copertura' },
    holo: { n: 'Olografica', e: '+1 Molt quando blocca' },
    cert: { n: 'Certificata', e: 'costa 1 credito in meno' },
  };

  // e = effetto nel gioco, l = cosa significa nella realtà. Gli effetti sono implementati in game.js.
  // debt: true = un debito tecnico. Non si compra: si accetta in cambio di fondi (gain) e si estingue pagando price.
  G.JOKERS = [
    { k: 'honey', n: 'Honeypot', price: 4, e: 'Quando una fase passa, l\'attaccante si tradisce: la prossima carta coperta dei turni successivi viene scoperta.', l: 'Un honeypot è un sistema esca: l\'attaccante ci perde tempo e si fa notare.' },
    { k: 'depth', n: 'Difesa in profondità', price: 6, e: 'Se blocchi almeno 3 fasi con due difese schierate, a fine attacco il Molt raddoppia.', l: 'Nessuna difesa è perfetta: più strati indipendenti rendono improbabile che cedano tutti.' },
    { k: 'shadow', n: 'Shadow IT', debt: true, gain: 4, price: 6, e: 'Debito: in ogni attacco una fase a caso tra la 1 e la 6 non può ricevere difese.', l: 'Lo shadow IT sono i sistemi usati senza che il reparto IT lo sappia: comodi, ma nessuno li protegge.' },
    { k: 'intern', n: 'Stagista', price: 4, e: 'A ogni turno una carta in mano costa 0, ma un\'altra viene scartata.', l: 'Chi non è formato può aiutare molto o fare danni: l\'errore umano è tra le cause più frequenti di incidente.' },
    { k: 'bounty', n: 'Bug bounty', price: 5, e: 'Rivela la fase 4 (Exploit) a inizio attacco. Costa 1 fondo per attacco, solo se la fase non era già nota.', l: 'Un programma di bug bounty paga ricercatori esterni perché segnalino le tue falle prima che le sfruttino i criminali.' },
    { k: 'legacy', n: 'Sistema legacy', debt: true, gain: 4, price: 6, e: 'Debito: ricevi 1 credito in meno a ogni turno.', l: 'I sistemi vecchi fanno ancora lavoro prezioso, ma mantenerli sicuri costa sempre di più.' },
    { k: 'purple', n: 'Purple team', price: 6, e: 'Quando blocchi anche il ripiego dell\'attaccante: +3 Molt.', l: 'Nel purple teaming chi simula l\'attacco e chi difende lavorano insieme, così la difesa conosce in anticipo le mosse.' },
    { k: 'zerotrust', n: 'Zero Trust', price: 6, e: 'Ogni blocco nelle fasi 4-7 dà +1 Molt in più.', l: 'Zero Trust: non fidarsi di nessuno solo perché è già dentro la rete, e verificare ogni accesso.' },
    { k: 'insurance', n: 'Polizza cyber', price: 4, e: 'Se perdi un attacco non perdi Resilienza, ma questo joker si distrugge. Non vale nell\'ultima missione.', l: 'Un\'assicurazione copre i danni economici, ma non impedisce l\'incidente.' },
    { k: 'soc247', n: 'SOC 24/7', price: 5, e: 'Nel primo turno di ogni attacco tutte le analisi del SOC sono gratis.', l: 'Un Security Operations Center sorveglia la rete a ogni ora: prima vedi, prima reagisci.' },
    { k: 'tabletop', n: 'Esercitazione', price: 5, e: '+1 carta in mano.', l: 'Nelle esercitazioni tabletop si simula un incidente a tavolino per arrivare preparati a quello vero.' },
  ];

  // Premessa della campagna, mostrata nella schermata iniziale e in quella finale.
  G.STORY = {
    intro: [
      ["Calvera è un paese piccolo e molto connesso.","Acqua, ospedali, energia, banche: tutto passa dalla rete.","E tutto ciò che passa dalla rete può essere raggiunto da fuori."],
      ["A Rocca Ardenza, la capitale, si vota tra sei settimane.","In città nessuno ha notato l'ombra che ha cominciato a mordere la luna."],
      ["Da oggi guidi Scudo, la squadra nazionale di risposta agli incidenti.","Poche persone, una sala operativa, un telefono che squilla quasi sempre di notte.","Quando un'infrastruttura viene attaccata, chiamano voi."],
      ["Nelle prossime settimane sei città verranno colpite, una dopo l'altra.","Sembrano attacchi senza legame.","Non lo sono."],
    ],
    win: 'All\'alba i risultati delle elezioni sono pubblicati e i sistemi di Calvera hanno retto. Eclissi non è sconfitta per sempre, ma stanotte la catena si è spezzata.',
    lose: 'Scudo non ha più le risorse per reggere un altro incidente e il governo scioglie la squadra. Ogni resoconto mostra dove la catena è passata: la prossima volta parti da lì.',
  };

  // Missioni della campagna, in ordine.
  // scene = scena della cutscene (vedi scenes.js); cut = le righe di testo delle tre inquadrature
  // (dove siamo, cosa c'è in gioco, chi attacca). L'emblema dell'avversario sta in EMBLEMS, con la stessa chiave k.
  // pool = tecniche possibili per fase: quella usata davvero viene estratta a ogni attacco.
  // hide = fasi su cui il briefing non dà informazioni. intel = carte già scoperte a inizio attacco.
  // reserves = quante volte l'attaccante può cambiare tecnica. wants = carte che il negozio propone prima di questa missione.
  // real = l'incidente vero a cui la missione si ispira.
  G.FOES = [
    { k: 'nottola', scene: 'valdoria',
      cut: [
        ["Valdoria, nell'entroterra del nord.","Trentamila abitanti e un acquedotto antico che porta l'acqua a tutta la valle."],
        ["Oggi pompe e valvole si comandano da un portale web.","Il comune ha appena alzato le tariffe, e in città c'è chi non l'ha presa bene.","Stanotte qualcuno sta bussando a tutte le porte di quel portale."],
        ["Il Collettivo Nottola. Hacktivisti.","Hanno promesso di «aprire i rubinetti dei dati».","Sono rumorosi e impazienti: cercano un servizio esposto ed entrano da lì."],
      ],
      city: 'Valdoria', site: 'Acquedotto municipale', n: 'Collettivo Nottola', tag: 'Hacktivisti', goal: 350, reserves: 0, intel: 3, hide: [],
      pool: [['scan', 'osint'], ['tool', 'maldev'], ['phish'], ['pubexp'], ['acct', 'autorun'], ['c2web'], ['exfil']],
      brief: 'L\'acquedotto di Valdoria ha alzato le tariffe e il Collettivo Nottola ha promesso di «aprire i rubinetti dei dati». Sono rumorosi e poco pazienti: cercano un servizio esposto, entrano e pubblicano quello che trovano.',
      after: 'Tra i file che i Nottola volevano pubblicare c\'è uno strumento che non hanno scritto loro. Nel codice qualcuno ha lasciato una firma: un piccolo cerchio nero.',
      real: { t: 'Equifax, 2017', d: 'Una vulnerabilità nota di Apache Struts, su un portale web, rimase senza patch per circa due mesi dopo la pubblicazione della correzione. Gli attaccanti rubarono i dati di circa 147 milioni di persone.', l: 'Una patch disponibile e non installata è una porta aperta con il cartello sopra.' } },
    { k: 'ryvex', scene: 'sanbrivio',
      cut: [
        ["San Brivio, la città universitaria.","Il suo ospedale civile è il più grande di Calvera."],
        ["Cartelle cliniche, sale operatorie, farmacia: ogni reparto dipende dai computer.","Da qualche giorno arrivano email con finti referti in allegato.","Basta che una persona, una sola, apra quello sbagliato."],
        ["La Banda Ryvex. Estorsori.","Entrano sempre dalle persone, cifrano tutto e chiedono un riscatto.","In corsia nessuno può permettersi uno schermo nero."],
      ],
      city: 'San Brivio', site: 'Ospedale civile', n: 'Banda Ryvex', tag: 'Ransomware', goal: 300, reserves: 1, intel: 2, hide: [5], wants: ['allow'],
      pool: [['osint', 'infophish'], ['maldev', 'tool'], ['phish', 'usb'], ['macro'], ['autorun', 'service'], ['c2web', 'c2dns'], ['ransom']],
      hint: 'All\'ospedale di San Brivio girano email con finti referti in allegato.',
      brief: 'All\'ospedale di San Brivio arrivano email con finti referti. La Banda Ryvex entra sempre dalle persone, cifra tutto e chiede un riscatto. In corsia nessuno può permettersi uno schermo nero.',
      after: 'Il malware della Ryvex è troppo raffinato per una banda di estorsori. Dentro c\'è lo stesso cerchio nero di Valdoria: qualcuno li sta rifornendo.',
      real: { t: 'Servizio sanitario irlandese, 2021', d: 'Un dipendente aprì un file Excel malevolo arrivato via email. Circa otto settimane dopo il ransomware Conti fermò i sistemi informatici del servizio sanitario nazionale.', l: 'Tra il primo clic e il danno passano settimane: è tempo in cui l\'attacco si può ancora fermare.' } },
    { k: 'vorago', scene: 'altamare',
      cut: [
        ["Altamare, sulla costa orientale.","Dal suo terminal passa il carburante di mezza Calvera."],
        ["I tecnici controllano serbatoi e pompe da casa.","Usano accessi remoti aperti anni fa e mai più ricontrollati.","Qualcuno ha appena comprato le chiavi di uno di quegli accessi."],
        ["Il Sindacato Vorago. Crimine organizzato.","Non scrivono malware: comprano password rubate e strumenti pronti.","Entrano, colpiscono in fretta e spariscono."],
      ],
      city: 'Altamare', site: 'Terminal petrolifero', n: 'Sindacato Vorago', tag: 'Crimine organizzato', goal: 450, reserves: 2, intel: 1, hide: [4], wants: ['mfa', 'least'],
      pool: [['scan', 'osint'], ['tool'], ['remote'], ['valid', 'pubexp'], ['acct', 'service'], ['rat', 'c2web'], ['ransom', 'exfil']],
      hint: 'Ad Altamare si parla di accessi remoti lasciati aperti e di password riutilizzate.',
      brief: 'Il terminal di Altamare rifornisce di carburante mezza Calvera. Il Sindacato Vorago non scrive malware: compra password rubate e strumenti pronti, entra dagli accessi remoti e colpisce in fretta.',
      after: 'Le password usate dal Vorago venivano tutte dallo stesso venditore, pagato in anticipo da un committente anonimo. Qualcuno sta finanziando questi attacchi.',
      real: { t: 'Colonial Pipeline, 2021', d: 'Gli attaccanti entrarono da un account VPN non più in uso, protetto solo da una password già finita in una fuga di dati e senza autenticazione a più fattori. L\'oleodotto, che riforniva buona parte della costa est degli Stati Uniti, restò fermo per giorni.', l: 'Un solo account dimenticato e senza secondo fattore basta a fermare un\'infrastruttura.' } },
    { k: 'terza', scene: 'lumera',
      cut: [
        ["Lumera, la capitale finanziaria.","Sotto la pioggia, la sede della Banca di Lumera."],
        ["La banca ha difese solide.","I suoi fornitori molto meno: manutentori, software house, ditte con un accesso di cui nessuno si ricorda.","Una catena è forte quanto il suo anello più debole."],
        ["Il Consorzio Mano Terza.","Non attaccano mai di fronte.","Entrano da chi lavora per te."],
      ],
      city: 'Lumera', site: 'Banca di Lumera', n: 'Consorzio Mano Terza', tag: 'Attacco alla filiera', goal: 450, reserves: 1, intel: 2, hide: [1, 5], wants: ['vendor', 'domwatch'],
      pool: [['osint', 'infophish'], ['domain', 'tool'], ['supply', 'remote'], ['valid'], ['service', 'acct'], ['c2dns', 'rat'], ['exfil']],
      hint: 'A Lumera nessuno attacca la banca di fronte: i sospetti cadono su fornitori e manutentori.',
      brief: 'La Banca di Lumera ha difese solide, e infatti nessuno la attacca di fronte. La Mano Terza passa dai fornitori: chi fa manutenzione, chi vende software, chi ha un accesso di cui nessuno si ricorda.',
      after: 'La Mano Terza non voleva soldi: ha cercato l\'elenco dei fornitori dello Stato. Qualcuno sta studiando come si entra nei ministeri.',
      real: { t: 'Target, 2013', d: 'Gli attaccanti rubarono le credenziali di un fornitore di impianti di climatizzazione e da lì raggiunsero la rete dei negozi. Furono sottratti i dati di circa 40 milioni di carte di pagamento.', l: 'La tua sicurezza vale quanto quella del fornitore più debole che ha accesso alla tua rete.' } },
    { k: 'gru', scene: 'monteluce',
      cut: [
        ["Monteluce, tra le montagne dell'ovest.","La sua centrale alimenta la capitale."],
        ["Da mesi qualcuno è dentro la rete della centrale.","Non ha toccato nulla: sta guardando e imparando.","Aspetta soltanto il momento in cui spegnere fa più male."],
        ["La Gru Cenerina. Un gruppo al servizio di uno Stato.","Non vuole rubare: vuole spegnere.","E sa come nascondersi al tuo SOC."],
      ],
      city: 'Monteluce', site: 'Centrale elettrica', n: 'Gru Cenerina', tag: 'Boss · gruppo statale', goal: 550, reserves: 2, intel: 1, hide: [2, 3, 5], wants: ['segm'],
      pool: [['osint', 'infophish'], ['maldev'], ['phish', 'supply'], ['macro', 'valid'], ['service', 'autorun'], ['c2dns', 'c2web'], ['wipe']],
      hint: 'A Monteluce qualcuno è nella rete della centrale da mesi, senza toccare nulla.',
      brief: 'La centrale di Monteluce alimenta la capitale. La Gru Cenerina lavora per uno Stato: è paziente, silenziosa, capace di restare mesi in una rete prima di muoversi. Non vuole rubare: vuole spegnere.',
      after: 'Nei sistemi della Gru Cenerina trovi un calendario. Una sola data è cerchiata in nero: la notte delle elezioni. L\'operazione ha un nome: Eclissi.',
      boss: { k: 'silent', n: 'Silenzioso', e: 'Niente analisi gratuita: ogni analisi del SOC costa 1 credito.' },
      real: { t: 'Rete elettrica ucraina, 2015', d: 'Email di phishing portarono il malware BlackEnergy nelle società elettriche. Mesi dopo gli attaccanti aprirono a distanza gli interruttori: circa 225.000 utenze rimasero senza corrente per ore.', l: 'Chi punta a un\'infrastruttura non ha fretta: va cercato quando è ancora silenzioso.' } },
    { k: 'eclissi', scene: 'rocca',
      cut: [
        ["Rocca Ardenza, la capitale.","È la notte delle elezioni."],
        ["Nei palazzi dello Stato si contano i voti.","Gli uffici sono vuoti: è venerdì sera, e il SOC lavora a ranghi ridotti.","Sopra la città, la luna è sparita."],
        ["Operazione Eclissi.","Gli attacchi delle scorse settimane erano prove generali.","Ora usa tutto quello che ha imparato su Calvera."],
      ],
      city: 'Rocca Ardenza', site: 'Notte delle elezioni', n: 'Operazione Eclissi', tag: 'Boss finale', goal: 250, reserves: 3, intel: 1, hide: [0, 2, 3, 4, 5],
      pool: [['scan', 'osint', 'infophish'], ['maldev', 'domain'], ['supply', 'phish', 'remote'], ['valid', 'pubexp', 'macro'], ['autorun', 'acct', 'service'], ['c2web', 'c2dns', 'rat'], ['wipe', 'ransom']],
      hint: 'A Rocca Ardenza è la notte delle elezioni. Eclissi sa già tutto di Calvera.',
      brief: 'È la notte delle elezioni e a Rocca Ardenza i sistemi dello Stato contano i voti. Gli attacchi delle settimane scorse erano prove generali. Eclissi usa tutto quello che ha imparato su Calvera e colpisce di venerdì sera, a uffici vuoti.',
      after: 'I sistemi hanno retto fino all\'ultimo voto.',
      boss: { k: 'friday', n: 'Venerdì sera', e: 'Peschi una carta in meno e ricevi 1 credito in meno a ogni turno.' },
      real: { t: 'NotPetya, 2017', d: 'Il malware si diffuse attraverso l\'aggiornamento di un software di contabilità molto usato in Ucraina. Sembrava un ransomware, ma i dati non erano recuperabili. I danni nel mondo sono stimati intorno ai 10 miliardi di dollari.', l: 'Anche il software di cui ti fidi può diventare il veicolo dell\'attacco: backup e reti separate limitano il danno.' } },
  ];

  // Icone 8x8: '#' è un pixel pieno.
  G.ICONS = {
    shield:  ['.######.', '########', '########', '########', '.######.', '.######.', '..####..', '...##...'],
    bubble:  ['.######.', '########', '########', '########', '.######.', '..##....', '.##.....', '........'],
    eye:     ['........', '..####..', '.#....#.', '#..##..#', '#..##..#', '.#....#.', '..####..', '........'],
    mail:    ['........', '########', '##....##', '#.#..#.#', '#..##..#', '#......#', '########', '........'],
    usb:     ['..####..', '..#..#..', '..####..', '.######.', '.######.', '.######.', '.######.', '..####..'],
    person:  ['...##...', '..####..', '..####..', '...##...', '.######.', '########', '########', '########'],
    plus:    ['...##...', '...##...', '...##...', '########', '########', '...##...', '...##...', '...##...'],
    doc:     ['#####...', '#....#..', '#.#.#.#.', '#..#..#.', '#.#.#.#.', '#.....#.', '#######.', '........'],
    radar:   ['...##...', '..#..#..', '.#.##.#.', '#.####.#', '#.####.#', '.#.##.#.', '..#..#..', '...##...'],
    key:     ['........', '.###....', '#...#...', '#...####', '#...#.#.', '.###..#.', '........', '........'],
    lock:    ['..####..', '.#....#.', '.#....#.', '########', '###..###', '###..###', '########', '########'],
    lens:    ['.####...', '#....#..', '#....#..', '#....#..', '.####...', '....##..', '.....##.', '......##'],
    disk:    ['.######.', '#......#', '########', '#......#', '########', '#......#', '########', '.######.'],
    wall:    ['########', '#..#..#.', '########', '.#..#..#', '########', '#..#..#.', '########', '........'],
    skull:   ['.######.', '########', '#..##..#', '#..##..#', '########', '.##..##.', '.######.', '.#.##.#.'],
    cross:   ['...##...', '...##...', '..#..#..', '##....##', '##....##', '..#..#..', '...##...', '...##...'],
    idcard:  ['########', '#......#', '#.##...#', '#.##.###', '#......#', '#.####.#', '#......#', '########'],
    bug:     ['.#....#.', '..#..#..', '.######.', '########', '.######.', '########', '.######.', '#......#'],
    globe:   ['..####..', '.#.##.#.', '#..##..#', '########', '########', '#..##..#', '.#.##.#.', '..####..'],
    hook:    ['....##..', '....##..', '....##..', '....##..', '.#..##..', '.#..##..', '.##.##..', '..###...'],
    bolt:    ['....###.', '...###..', '..###...', '.######.', '...###..', '..###...', '.###....', '.#......'],
    file:    ['#####...', '#....#..', '#..#..#.', '#..#..#.', '#.....#.', '#..#..#.', '#.....#.', '#######.'],
    power:   ['...##...', '.#.##.#.', '#..##..#', '#..##..#', '#......#', '#......#', '.#....#.', '..####..'],
    ghost:   ['..####..', '.######.', '##.##.##', '##.##.##', '########', '########', '########', '#.##.##.'],
    antenna: ['#..##..#', '.#.##.#.', '..####..', '...##...', '...##...', '..####..', '.######.', '########'],
    arrows:  ['..#.....', '.#######', '..#.....', '........', '.....#..', '#######.', '.....#..', '........'],
    dollar:  ['...##...', '.######.', '##.##...', '.#####..', '...####.', '...##.##', '.######.', '...##...'],
    boxout:  ['...##...', '..####..', '.######.', '...##...', '#..##..#', '#..##..#', '#......#', '########'],
    crate:   ['########', '#.####.#', '##.##.##', '###..###', '###..###', '##.##.##', '#.####.#', '########'],
    door:    ['.######.', '.#....#.', '.#....#.', '.#...##.', '.#...##.', '.#....#.', '.#....#.', '########'],
    boxin:   ['...##...', '...##...', '.######.', '..####..', '#..##..#', '#......#', '#......#', '########'],
    gear:    ['#..##..#', '.######.', '.##..##.', '##....##', '##....##', '.##..##.', '.######.', '#..##..#'],
    screen:  ['########', '#......#', '#......#', '#......#', '########', '...##...', '..####..', '........'],
    flame:   ['...#....', '..##....', '..###.#.', '.####.##', '.#######', '########', '.######.', '..####..'],
    phone:   ['.######.', '.#....#.', '.#....#.', '.#....#.', '.#....#.', '.######.', '.##..##.', '.######.'],
    flag:    ['.#####..', '.######.', '.######.', '.#####..', '.#......', '.#......', '.#......', '###.....'],
    check:   ['........', '.......#', '......##', '#....##.', '##..##..', '.####...', '..##....', '........'],
    steps:   ['#.......', '##......', '###.....', '####....', '#####...', '######..', '#######.', '########'],
    list:    ['##.#####', '........', '##.#####', '........', '##.#####', '........', '##.#####', '........'],
    grid:    ['###..###', '###..###', '###..###', '........', '........', '###..###', '###..###', '###..###'],
  };



  // Emblemi 16x16 degli avversari e di Scudo: '#' colore principale, '+' colore d'accento, 'o' nero, '.' vuoto.
  G.EMBLEMS = {
    scudo: { main: '#2473d6', accent: '#e4ebec', rows: [
      '.##############.', '################', '###..........###', '###..........###', '###...++++...###', '###..++..++..###', '###..++..++..###', '###...++++...###',
      '###...++++...###', '.###.++..++.###.', '.###.++..++.###.', '..###.++++.###..', '...###....###...', '....########....', '.....######.....', '.......##.......'] },
    nottola: { main: '#ee4f3a', accent: '#ffb000', rows: [
      '#..............#', '##............##', '###..........###', '################', '################', '##+++######+++##', '#+++++####+++++#', '#++oo++##++oo++#',
      '#++oo++##++oo++#', '#+++++####+++++#', '##+++##++##+++##', '######++++######', '.######++######.', '..############..', '...##########...', '.....######.....'] },
    ryvex: { main: '#ee4f3a', accent: '#ffb000', rows: [
      '.....######.....', '....########....', '...###....###...', '...##......##...', '...##......##...', '...##......##...', '.##############.', '################',
      '######++++######', '#####++++++#####', '#####++++++#####', '######++++######', '#######++#######', '#######++#######', '################', '.##############.'] },
    vorago: { main: '#ee4f3a', accent: '#ffb000', rows: [
      '....########....', '..############..', '.###........###.', '###..######..###', '##..########..##', '##.###....###.##', '##.##..++..##.##', '##.##.++++.##.##',
      '##.##.++++.##.##', '##.##..++.###.##', '##.###...###..##', '##..#######..###', '###..#####..###.', '.###.......###..', '..###########...', '....#######.....'] },
    terza: { main: '#ee4f3a', accent: '#ffb000', rows: [
      '....##.##.##....', '....##.##.##.##.', '....##.##.##.##.', '....##.##.##.##.', '....##.##.##.##.', '.##.##.##.##.##.', '.##.###########.', '.##.###########.',
      '.##############.', '.######++++####.', '..#####++++####.', '..#####++++####.', '...###########..', '....#########...', '....#########...', '.....#######....'] },
    gru: { main: '#ee4f3a', accent: '#ffb000', rows: [
      '#......##......#', '##.....##.....##', '###...####...###', '####..####..####', '#####.####.#####', '################', '.##############.', '..############..',
      '...##########...', '....###++###....', '....###++###....', '.....######.....', '.....######.....', '....##.##.##....', '...##..##..##...', '...#...##...#...'] },
    eclissi: { main: '#ee4f3a', accent: '#ffb000', rows: [
      '.......##.......', '..#....##....#..', '...#........#...', '.....++++++.....', '....++oooo++....', '...++oooooo++...', '...+oooooooo+...', '##.+oooooooo+.##',
      '##.+oooooooo+.##', '...+oooooooo+...', '...++oooooo++...', '....++oooo++....', '.....++++++.....', '...#........#...', '..#....##....#..', '.......##.......'] },
  };

  // Simulazione di ogni tecnica, mostrata cliccando la carta: due passaggi [da, a, testo, nodo che viene compromesso].
  // I nodi dello schema sono: atk (attaccante), c2 (suo server), sup (fornitore), web (servizio esposto), user (dipendente), srv (server), data (dati).
  // h = nodi già compromessi quando la tecnica comincia.
  const SIM = {
    scan: { s: [['atk', 'web', 'L\'attaccante invia migliaia di richieste ai tuoi indirizzi pubblici per vedere chi risponde.'],
      ['web', 'atk', 'Ogni servizio che risponde rivela nome e versione: è la mappa di ciò che si può attaccare.']] },
    osint: { s: [['atk', 'user', 'Senza toccare la rete, l\'attaccante cerca i dipendenti su social, sito aziendale e vecchie fughe di dati.'],
      ['user', 'atk', 'Ne ricava nomi, ruoli e indirizzi email: gli servono per scrivere messaggi credibili.']] },
    infophish: { s: [['atk', 'user', 'Arriva un\'email che sembra di un collega: chiede un numero interno, un nome, una procedura.'],
      ['user', 'atk', 'Chi risponde in buona fede consegna informazioni che renderanno credibile l\'attacco vero.']] },
    maldev: { s: [['atk', 'c2', 'L\'attaccante scrive un malware apposta per te, mai visto prima dagli antivirus.'],
      ['c2', 'atk', 'Lo prova contro i prodotti di sicurezza più diffusi finché non passa inosservato.']] },
    domain: { s: [['atk', 'c2', 'L\'attaccante registra un dominio quasi uguale al tuo: una lettera cambiata, un trattino in più.'],
      ['c2', 'user', 'Da lì partiranno email e pagine di accesso false, difficili da distinguere dalle vere.']] },
    tool: { s: [['c2', 'atk', 'Sul mercato nero si comprano strumenti d\'attacco già pronti, con tanto di istruzioni.'],
      ['atk', 'web', 'Così anche un gruppo poco esperto può usare tecniche da professionisti.']] },
    phish: { s: [['atk', 'user', 'Un dipendente riceve un\'email mirata, con un allegato che sembra un documento di lavoro.'],
      ['user', 'c2', 'Se lo apre, il codice nascosto nell\'allegato dà all\'attaccante un primo punto d\'appoggio.', 'user']] },
    usb: { s: [['atk', 'user', 'Una chiavetta viene lasciata nel parcheggio o spedita come omaggio.'],
      ['user', 'srv', 'Chi la collega per curiosità esegue il malware direttamente dentro la rete, saltando il perimetro.', 'user']] },
    remote: { s: [['atk', 'web', 'Una VPN o un desktop remoto è raggiungibile da Internet, per far lavorare i tecnici da casa.'],
      ['web', 'srv', 'Con una password indovinata o rubata l\'attaccante entra come un dipendente qualsiasi.', 'web']] },
    supply: { s: [['atk', 'sup', 'L\'attaccante viola un fornitore di software e nasconde il suo codice in un aggiornamento.', 'sup'],
      ['sup', 'srv', 'Tu installi l\'aggiornamento perché ti fidi del fornitore: il malware entra dalla porta principale.', 'srv']] },
    pubexp: { s: [['atk', 'web', 'Un servizio esposto ha una vulnerabilità nota: la correzione esiste, ma non è stata installata.'],
      ['web', 'srv', 'L\'attaccante invia una richiesta costruita apposta e il server esegue i suoi comandi.', 'web']] },
    macro: { s: [['atk', 'user', 'Il documento chiede di «abilitare il contenuto» per essere letto.'],
      ['user', 'c2', 'Con quel clic parte una macro: un piccolo programma che scarica ed esegue il malware.', 'user']] },
    valid: { s: [['c2', 'atk', 'L\'attaccante compra nomi utente e password finiti in una fuga di dati.'],
      ['atk', 'srv', 'Entra con credenziali vere: per i sistemi è un accesso normale, e nessun allarme suona.', 'srv']] },
    autorun: { h: ['user'], s: [['c2', 'user', 'Il malware si aggiunge ai programmi che partono da soli all\'accensione.'],
      ['user', 'c2', 'Spegnere e riaccendere non basta più: a ogni avvio richiama il suo padrone.']] },
    acct: { h: ['srv'], s: [['atk', 'srv', 'L\'attaccante crea un nuovo account dal nome innocuo, magari con diritti di amministratore.'],
      ['atk', 'srv', 'Anche se il malware viene rimosso, può rientrare quando vuole con quell\'account.']] },
    service: { s: [['c2', 'srv', 'Il malware si registra come servizio di sistema, in mezzo a decine di servizi legittimi.', 'srv'],
      ['srv', 'data', 'Gira con i privilegi più alti e riparte da solo: da lì può raggiungere tutto.']] },
    c2web: { h: ['user'], s: [['user', 'c2', 'Il computer infetto contatta il server dell\'attaccante con normali richieste HTTPS.'],
      ['c2', 'user', 'Gli ordini tornano indietro cifrati, mescolati al traffico web di tutti i giorni.']] },
    c2dns: { h: ['user'], s: [['user', 'c2', 'Il malware nasconde i suoi messaggi dentro richieste DNS, che quasi nessuno blocca.'],
      ['c2', 'user', 'Le risposte DNS contengono gli ordini: un canale lento, ma molto difficile da notare.']] },
    rat: { h: ['user'], s: [['c2', 'user', 'L\'attaccante installa un comune programma di assistenza remota, di quelli usati dai tecnici.'],
      ['c2', 'user', 'Comanda il computer come se fosse seduto lì, e il programma sembra del tutto legittimo.']] },
    ransom: { h: ['srv'], s: [['srv', 'data', 'Il malware cifra i file uno dopo l\'altro, sui computer e sui server condivisi.', 'data'],
      ['data', 'atk', 'Poi compare la richiesta: pagare per riavere i dati, senza garanzia di ottenerli.']] },
    exfil: { h: ['srv'], s: [['data', 'srv', 'L\'attaccante raccoglie i dati riservati e li comprime in un punto della rete.'],
      ['srv', 'c2', 'Li invia fuori poco alla volta, lungo lo stesso canale usato per ricevere ordini.']] },
    wipe: { h: ['srv'], s: [['srv', 'data', 'Il malware sovrascrive file e dischi: non c\'è nessuna chiave e nessun riscatto.', 'data'],
      ['data', 'srv', 'L\'obiettivo non è il denaro: è fermare l\'organizzazione il più a lungo possibile.']] },
  };
  G.TECH.forEach(list => list.forEach(t => { t.sim = SIM[t.k].s; t.hit = SIM[t.k].h || []; }));

  // Indici ricavati dai dati
  G.T = {}; G.D = {}; G.J = {};
  G.TECH.forEach((list, p) => list.forEach(t => { t.p = p; G.T[t.k] = t; }));
  G.DEFS.forEach(d => { G.D[d.k] = d; });
  G.JOKERS.forEach(j => { G.J[j.k] = j; });
  G.countersOf = k => G.DEFS.filter(d => d.x.includes(k));
})(window.SLC);
