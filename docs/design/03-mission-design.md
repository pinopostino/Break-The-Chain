# 3. Mission design

The campaign has six missions of increasing difficulty. Each mission is modelled on a documented real incident, introduces one or two new concepts, and adds one narrative clue to the campaign story (Operation Eclissi).

All mission data is defined in `FOES` in [`js/data.js`](../../js/data.js).

## 3.1 Mission structure

Every mission follows the same five steps:

1. **Cutscene.** The city, what is at stake, and the adversary.
2. **Briefing and deck selection.** The adversary profile, then the player picks 10 cards from the collection.
3. **Attack.** Three turns: Preparation (phases 1-3), Intrusion (phases 4-5), Impact (phases 6-7). In each turn the player receives credits, places defenses and can pay the SOC to reveal attack cards.
4. **Debrief.** The outcome per phase, the consequences for the next mission, and the real-world case.
5. **Shop.** Not shown after the last mission. The player buys controls, jokers and upgrades.

A mission is won when the Defense score (Coverage × Mult) reaches the threshold. A lost mission costs one point of Resilience. The campaign ends after mission 6, or earlier if Resilience reaches zero.

## 3.2 Difficulty progression

| | M1 | M2 | M3 | M4 | M5 | M6 |
|---|---|---|---|---|---|---|
| City | Valdoria | San Brivio | Altamare | Lumera | Monteluce | Rocca Ardenza |
| Adversary type | Hacktivists | Ransomware | Organised crime | Supply chain | State group (boss) | Final boss |
| Threshold | 250 | 400 | 550 | 700 | 850 | 1100 |
| Reserves | 0 | 1 | 2 | 1 | 2 | 3 |
| Known phases at start | 3 | 2 | 1 | 2 | 1 | 1 |
| Phases with no information | none | 6 | 5 | 2, 6 | 3, 4, 6 | 1, 3, 4, 5, 6 |
| Techniques per phase | 1-2 | 1-2 | 1-2 | 1-2 | 1-2 | 2-3 |
| Boss rule | | | | | SOC costs 2 credits | 1 card and 1 credit fewer per turn |
| New controls offered before | | Application allowlisting | MFA, least privilege | Supplier vetting, domain monitoring | Network segmentation | |

Difficulty grows along four independent axes, so that no mission raises all of them at once:

- **Threshold:** the score to reach grows steadily, from 250 to 1100.
- **Adaptation:** reserves make the attacker switch technique after a block.
- **Uncertainty:** fewer known phases and more phases without information make the player rely on the SOC and on reading the profile.
- **Resources:** the two boss rules make intelligence and credits more expensive.

Mission 4 lowers the reserves from 2 to 1 while hiding two phases: after the jump in mission 3, the player gets a breather on adaptation and a harder task on intelligence.

Unblocked phases make the next mission harder, whatever its base parameters:

- if Installation (phase 5) gets through, the next adversary has one extra reserve;
- if Exfiltration gets through in phase 7, the next mission starts with no known phases;
- if Ransomware or Data destruction gets through in phase 7, recovery costs up to 3 funds.

## 3.3 Concept coverage

| Concept | M1 | M2 | M3 | M4 | M5 | M6 |
|---|---|---|---|---|---|---|
| C1 Cyber Kill Chain | **●** | ● | ● | ● | ● | ● |
| C2 Attack techniques | **●** | ● | ● | ● | ● | ● |
| C3 Security controls | **●** | ● | ● | ● | ● | ● |
| C4 Early disruption | **●** | ● | ● | ● | ● | ● |
| C5 Consequences of a breach | **●** | ● | ● | ● | ● | ● |
| C6 Threat intelligence | **●** | ● | ● | ● | ● | ● |
| C7 Detection and visibility (SOC) | | **●** | ● | ● | ● | ● |
| C8 Adaptive adversary | | **●** | ● | ● | ● | ● |
| C9 Defense in depth | | **●** | ● | ● | ● | ● |
| C10 Risk management | **●** | ● | ● | ● | ● | ● |
| C11 Identity and access | | | **●** | ● | ● | ● |
| C12 Supply chain risk | | | | **●** | ● | ● |
| C13 Resilience against destruction | | | | | **●** | ● |
| C14 Real incidents | **●** | **●** | **●** | **●** | **●** | **●** |

**●** in bold marks the mission where the concept is introduced or, for C14, a new real case. Concept codes are defined in [Learning objectives](01-learning-objectives.md#13-concepts).

## 3.4 Missions

In the profile tables, controls marked with † are not in the starting collection and must be bought in the shop.

### Mission 1 · Valdoria: the training mission

| | |
|---|---|
| **Target** | Municipal aqueduct (*Acquedotto municipale*) |
| **Adversary** | Nottola Collective (*Collettivo Nottola*), hacktivists |
| **Parameters** | Threshold 250 · 0 reserves · 3 known phases · no hidden phases |
| **Real case** | Equifax, 2017 |
| **Concepts introduced** | C1-C6, C10, C14 |

**Design intent.** Mission 1 is the training level. The adversary never adapts and most of the chain is visible, so the player can learn the board, the cards and the score without surprises. The first turn of the first mission shows step-by-step instructions in the info line. Every technique in the profile is stopped by a card in the starting collection.

**Adversary profile**

| Phase | Possible techniques | Stopped by |
|---|---|---|
| 1 Reconnaissance | Active Scanning (T1595) · Gather Victim Identity Information (T1589) | Perimeter hardening · Social media hygiene |
| 2 Weaponization | Obtain Capabilities: Tool (T1588.002) · Develop Capabilities: Malware (T1587.001) | Threat intelligence |
| 3 Delivery | Spearphishing Attachment (T1566.001) | Email filter, security awareness training |
| 4 Exploitation | Exploit Public-Facing Application (T1190) | Patch management |
| 5 Installation | Create Account (T1136) · Boot or Logon Autostart Execution (T1547) | Account audit, least privilege† · EDR |
| 6 Command and Control | Application Layer Protocol: Web Protocols (T1071.001) | Inspecting proxy |
| 7 Actions on Objectives | Exfiltration Over C2 Channel (T1041) | Inspecting proxy, DLP |

**Real case and lesson.** A known vulnerability in Apache Struts, on a web portal, stayed unpatched for about two months after the fix was published; the attackers stole the data of about 147 million people. *Lesson: a patch that is available but not installed is an open door with a sign on it.*

**Narrative clue.** Among the files the hacktivists wanted to publish is a tool they did not write, signed with a small black circle.

### Mission 2 · San Brivio: the attacker adapts

| | |
|---|---|
| **Target** | Civil hospital (*Ospedale civile*) |
| **Adversary** | Ryvex Gang (*Banda Ryvex*), ransomware |
| **Parameters** | Threshold 400 · 1 reserve · 2 known phases · phase 6 hidden |
| **Real case** | Irish health service (HSE), 2021 |
| **Concepts introduced** | C7, C8, C9 |

**Design intent.** The first reserve: the first time the player blocks a phase, the attacker switches to the other technique of that phase. Two controls in the same phase become useful (*Doppio blocco*). The Command and Control phase is hidden, so the SOC becomes worth its cost. The profile is centred on people: phishing, an infected USB drive, a malicious macro.

**Adversary profile**

| Phase | Possible techniques | Stopped by |
|---|---|---|
| 1 Reconnaissance | Gather Victim Identity Information (T1589) · Phishing for Information (T1598) | Social media hygiene · Email filter, training |
| 2 Weaponization | Develop Capabilities: Malware (T1587.001) · Obtain Capabilities: Tool (T1588.002) | Threat intelligence |
| 3 Delivery | Spearphishing Attachment (T1566.001) · Replication Through Removable Media (T1091) | Email filter, training · USB port blocking, training |
| 4 Exploitation | User Execution: Malicious File (T1204.002) | Macros disabled, application allowlisting† |
| 5 Installation | Boot or Logon Autostart Execution (T1547) · Windows Service (T1543.003) | EDR · EDR, least privilege† |
| 6 Command and Control | *hidden in the briefing:* Web Protocols (T1071.001) · DNS (T1071.004) | Inspecting proxy · DNS monitoring |
| 7 Actions on Objectives | Data Encrypted for Impact (T1486) | EDR, offline backup, network segmentation† |

**Real case and lesson.** An employee opened a malicious Excel file received by email; about eight weeks later the Conti ransomware shut down the IT systems of the national health service. *Lesson: weeks pass between the first click and the damage, and in that time the attack can still be stopped.*

**Narrative clue.** The ransomware is too refined for a gang of extortionists, and it carries the same black circle: someone is supplying them.

### Mission 3 · Altamare: identity is the perimeter

| | |
|---|---|
| **Target** | Oil terminal (*Terminal petrolifero*) |
| **Adversary** | Vorago Syndicate (*Sindacato Vorago*), organised crime |
| **Parameters** | Threshold 550 · 2 reserves · 1 known phase · phase 5 hidden |
| **Real case** | Colonial Pipeline, 2021 |
| **Concepts introduced** | C11 |

**Design intent.** The adversary does not write malware: it buys stolen passwords and ready-made tools. Valid Accounts (T1078) can be stopped only by MFA, which is not in the starting collection: the shop offers MFA and least privilege before this mission, and the shop teaser mentions remote access and reused passwords. A player who ignores the hint learns, in the debrief, the exact lesson of the real case.

**Adversary profile**

| Phase | Possible techniques | Stopped by |
|---|---|---|
| 1 Reconnaissance | Active Scanning (T1595) · Gather Victim Identity Information (T1589) | Perimeter hardening · Social media hygiene |
| 2 Weaponization | Obtain Capabilities: Tool (T1588.002) | Threat intelligence |
| 3 Delivery | External Remote Services (T1133) | Perimeter hardening, MFA† |
| 4 Exploitation | Valid Accounts (T1078) · Exploit Public-Facing Application (T1190) | MFA† · Patch management |
| 5 Installation | *hidden in the briefing:* Create Account (T1136) · Windows Service (T1543.003) | Account audit, least privilege† · EDR, least privilege† |
| 6 Command and Control | Remote Access Software (T1219) · Web Protocols (T1071.001) | Application allowlisting† · Inspecting proxy |
| 7 Actions on Objectives | Data Encrypted for Impact (T1486) · Exfiltration Over C2 Channel (T1041) | EDR, offline backup, segmentation† · Inspecting proxy, DLP |

**Real case and lesson.** The attackers entered through a VPN account no longer in use, protected only by a password already exposed in a data leak and without multi-factor authentication; the pipeline that supplied much of the US east coast stopped for days. *Lesson: a single forgotten account without a second factor is enough to stop an infrastructure.*

**Narrative clue.** All the passwords came from the same seller, paid in advance by an anonymous client: someone is funding these attacks.

### Mission 4 · Lumera: the weakest supplier

| | |
|---|---|
| **Target** | Bank of Lumera (*Banca di Lumera*) |
| **Adversary** | Mano Terza Consortium (*Consorzio Mano Terza*), supply-chain attack |
| **Parameters** | Threshold 700 · 1 reserve · 2 known phases · phases 2 and 6 hidden |
| **Real case** | Target, 2013 |
| **Concepts introduced** | C12 |

**Design intent.** The bank's own defenses are solid, so the attacker comes in through suppliers: a lookalike domain, a poisoned software update, a supplier's remote access. Two of the key controls (supplier vetting, domain monitoring) are offered in the shop before the mission. Reserves drop to 1, but two phases are hidden: the challenge moves from adaptation to intelligence.

**Adversary profile**

| Phase | Possible techniques | Stopped by |
|---|---|---|
| 1 Reconnaissance | Gather Victim Identity Information (T1589) · Phishing for Information (T1598) | Social media hygiene · Email filter, training |
| 2 Weaponization | *hidden in the briefing:* Acquire Infrastructure: Domains (T1583.001) · Obtain Capabilities: Tool (T1588.002) | Domain monitoring† · Threat intelligence |
| 3 Delivery | Compromise Software Supply Chain (T1195.002) · External Remote Services (T1133) | Supplier vetting† · Perimeter hardening, MFA† |
| 4 Exploitation | Valid Accounts (T1078) | MFA† |
| 5 Installation | Windows Service (T1543.003) · Create Account (T1136) | EDR, least privilege† · Account audit, least privilege† |
| 6 Command and Control | *hidden in the briefing:* DNS (T1071.004) · Remote Access Software (T1219) | DNS monitoring · Application allowlisting† |
| 7 Actions on Objectives | Exfiltration Over C2 Channel (T1041) | Inspecting proxy, DLP |

**Real case and lesson.** The attackers stole the credentials of an air-conditioning supplier and from there reached the store network; the data of about 40 million payment cards were stolen. *Lesson: your security is only as good as that of the weakest supplier with access to your network.*

**Narrative clue.** The attackers did not want money: they searched for the list of the State's suppliers. Someone is studying how to get into the ministries.

### Mission 5 · Monteluce: the silent adversary

| | |
|---|---|
| **Target** | Power plant (*Centrale elettrica*) |
| **Adversary** | Gru Cenerina, state-sponsored group (boss) |
| **Parameters** | Threshold 850 · 2 reserves · 1 known phase · phases 3, 4 and 6 hidden |
| **Boss rule** | Silent (*Silenzioso*): every SOC analysis costs 2 credits |
| **Real case** | Ukrainian power grid, 2015 |
| **Concepts introduced** | C13 |

**Design intent.** A patient adversary that hides from the SOC: intelligence is twice as expensive and three phases are hidden. The goal is not money but disruption, so the final phase is Data destruction: no ransom to pay, only backups and segmentation limit the damage. Network segmentation is offered in the shop before the mission.

**Adversary profile**

| Phase | Possible techniques | Stopped by |
|---|---|---|
| 1 Reconnaissance | Gather Victim Identity Information (T1589) · Phishing for Information (T1598) | Social media hygiene · Email filter, training |
| 2 Weaponization | Develop Capabilities: Malware (T1587.001) | Threat intelligence |
| 3 Delivery | *hidden in the briefing:* Spearphishing Attachment (T1566.001) · Compromise Software Supply Chain (T1195.002) | Email filter, training · Supplier vetting† |
| 4 Exploitation | *hidden in the briefing:* User Execution: Malicious File (T1204.002) · Valid Accounts (T1078) | Macros disabled, application allowlisting† · MFA† |
| 5 Installation | Windows Service (T1543.003) · Boot or Logon Autostart Execution (T1547) | EDR, least privilege† · EDR |
| 6 Command and Control | *hidden in the briefing:* DNS (T1071.004) · Web Protocols (T1071.001) | DNS monitoring · Inspecting proxy |
| 7 Actions on Objectives | Data Destruction (T1485) | Offline backup, network segmentation† |

**Real case and lesson.** Phishing emails brought the BlackEnergy malware into the power companies; months later the attackers remotely opened the breakers and about 225,000 customers were left without power for hours. *Lesson: an adversary who targets an infrastructure is in no hurry, and must be found while still silent.*

**Narrative clue.** A calendar with a single date circled in black, election night, and the name of the operation: Eclissi.

### Mission 6 · Rocca Ardenza: the final exam

| | |
|---|---|
| **Target** | Election night (*Notte delle elezioni*) in the capital |
| **Adversary** | Operation Eclissi (*Operazione Eclissi*), final boss |
| **Parameters** | Threshold 1100 · 3 reserves · 1 known phase · phases 1, 3, 4, 5 and 6 hidden |
| **Boss rule** | Friday night (*Venerdì sera*): one card fewer in hand and 1 credit fewer each turn |
| **Real case** | NotPetya, 2017 |
| **Concepts introduced** | none: all concepts are tested together |

**Design intent.** The summative mission. The profile combines the techniques of all previous adversaries, with three possible techniques in most phases. Almost nothing is visible, resources are reduced, and the attacker can adapt three times. The player has to use everything learned: read the few visible phases, spend the SOC where it matters, layer defenses on the high-impact phases and accept risk elsewhere.

**Adversary profile**

| Phase | Possible techniques | Stopped by |
|---|---|---|
| 1 Reconnaissance | *hidden:* Active Scanning (T1595) · Gather Victim Identity Information (T1589) · Phishing for Information (T1598) | Perimeter hardening · Social media hygiene · Email filter, training |
| 2 Weaponization | Develop Capabilities: Malware (T1587.001) · Acquire Infrastructure: Domains (T1583.001) | Threat intelligence · Domain monitoring† |
| 3 Delivery | *hidden:* Compromise Software Supply Chain (T1195.002) · Spearphishing Attachment (T1566.001) · External Remote Services (T1133) | Supplier vetting† · Email filter, training · Perimeter hardening, MFA† |
| 4 Exploitation | *hidden:* Valid Accounts (T1078) · Exploit Public-Facing Application (T1190) · User Execution: Malicious File (T1204.002) | MFA† · Patch management · Macros disabled, application allowlisting† |
| 5 Installation | *hidden:* Boot or Logon Autostart Execution (T1547) · Create Account (T1136) · Windows Service (T1543.003) | EDR · Account audit, least privilege† · EDR, least privilege† |
| 6 Command and Control | *hidden:* Web Protocols (T1071.001) · DNS (T1071.004) · Remote Access Software (T1219) | Inspecting proxy · DNS monitoring · Application allowlisting† |
| 7 Actions on Objectives | Data Destruction (T1485) · Data Encrypted for Impact (T1486) | Offline backup, segmentation† · EDR, offline backup, segmentation† |

**Real case and lesson.** The malware spread through the update of an accounting software widely used in Ukraine; it looked like ransomware, but the data could not be recovered, and worldwide damage is estimated at around 10 billion dollars. *Lesson: even software you trust can become the vehicle of the attack, and backups and separate networks limit the damage.*

**Ending.** If the player wins, the election results are published at dawn and the systems of Calvera have held. If Resilience runs out, the team is disbanded and the country goes dark.

## 3.5 Technique coverage

Every one of the 22 techniques appears in at least one mission. Each technique except removable media appears in at least two missions, so that the player meets it again after learning which control stops it.

| Phase | Technique | ID | M1 | M2 | M3 | M4 | M5 | M6 |
|---|---|---|---|---|---|---|---|---|
| 1 | Active Scanning | T1595 | ● | | ● | | | ● |
| 1 | Gather Victim Identity Information | T1589 | ● | ● | ● | ● | ● | ● |
| 1 | Phishing for Information | T1598 | | ● | | ● | ● | ● |
| 2 | Develop Capabilities: Malware | T1587.001 | ● | ● | | | ● | ● |
| 2 | Acquire Infrastructure: Domains | T1583.001 | | | | ● | | ● |
| 2 | Obtain Capabilities: Tool | T1588.002 | ● | ● | ● | ● | | |
| 3 | Spearphishing Attachment | T1566.001 | ● | ● | | | ● | ● |
| 3 | Replication Through Removable Media | T1091 | | ● | | | | |
| 3 | External Remote Services | T1133 | | | ● | ● | | ● |
| 3 | Compromise Software Supply Chain | T1195.002 | | | | ● | ● | ● |
| 4 | Exploit Public-Facing Application | T1190 | ● | | ● | | | ● |
| 4 | User Execution: Malicious File | T1204.002 | | ● | | | ● | ● |
| 4 | Valid Accounts | T1078 | | | ● | ● | ● | ● |
| 5 | Boot or Logon Autostart Execution | T1547 | ● | ● | | | ● | ● |
| 5 | Create Account | T1136 | ● | | ● | ● | | ● |
| 5 | Create or Modify System Process: Windows Service | T1543.003 | | ● | ● | ● | ● | ● |
| 6 | Application Layer Protocol: Web Protocols | T1071.001 | ● | ● | ● | | ● | ● |
| 6 | Application Layer Protocol: DNS | T1071.004 | | ● | | ● | ● | ● |
| 6 | Remote Access Software | T1219 | | | ● | ● | | ● |
| 7 | Data Encrypted for Impact | T1486 | | ● | ● | | | ● |
| 7 | Exfiltration Over C2 Channel | T1041 | ● | | ● | ● | | |
| 7 | Data Destruction | T1485 | | | | | ● | ● |

## 3.6 Controls

| Control | In game | Cost | Coverage | Phases | Stops | Available |
|---|---|---|---|---|---|---|
| Perimeter hardening | *Hardening perimetro* | 2 | 30 | 1, 3 | T1595, T1133 | Start |
| Social media hygiene | *Igiene social* | 1 | 20 | 1 | T1589 | Start |
| Threat intelligence | *Threat intelligence* | 2 | 30 | 2 | T1587.001, T1588.002 | Start |
| Email filter | *Filtro email* | 2 | 35 | 1, 3 | T1566.001, T1598 | Start |
| USB port blocking | *Blocco porte USB* | 1 | 25 | 3 | T1091 | Start |
| Security awareness training | *Formazione* | 2 | 30 | 1, 3 | T1566.001, T1598, T1091 | Start |
| Patch management | *Patch management* | 2 | 40 | 4 | T1190 | Start |
| Macros disabled | *Macro disattivate* | 1 | 25 | 4 | T1204.002 | Start |
| EDR | *EDR* | 3 | 45 | 5, 7 | T1547, T1543.003, T1486 | Start |
| Account audit | *Audit account* | 1 | 25 | 5 | T1136 | Start |
| Inspecting proxy | *Proxy con ispezione* | 2 | 35 | 6, 7 | T1071.001, T1041 | Start |
| DNS monitoring | *Monitoraggio DNS* | 2 | 30 | 6 | T1071.004 | Start |
| Offline backup | *Backup offline* | 2 | 40 | 7 | T1486, T1485 | Start |
| DLP | *DLP* | 2 | 35 | 7 | T1041 | Start |
| MFA | *MFA* | 2 | 40 | 3, 4 | T1133, T1078 | Shop |
| Domain monitoring | *Sorveglianza domini* | 1 | 25 | 2 | T1583.001 | Shop |
| Supplier vetting | *Verifica fornitori* | 2 | 35 | 3 | T1195.002 | Shop |
| Least privilege | *Privilegi minimi* | 2 | 35 | 5 | T1543.003, T1136 | Shop |
| Application allowlisting | *Lista applicazioni* | 2 | 35 | 4, 6 | T1219, T1204.002 | Shop |
| Network segmentation | *Segmentazione di rete* | 3 | 45 | 7 | T1485, T1486 | Shop |

The starting collection (14 controls) covers every technique of mission 1, so the training mission never requires a purchase. The six shop-only controls are the answers to the concepts introduced later: identity (MFA, least privilege), supply chain (supplier vetting, domain monitoring), resilience (segmentation) and execution control (application allowlisting).

## 3.7 Design notes and open issues

- **Mission 1 as training level.** There is no separate tutorial: mission 1 plays that role through its low difficulty and the step-by-step text shown in the first turn. The rules summary is available from the title screen (*Come si gioca*).
- **Interpretation of the kill chain.** In the original Cyber Kill Chain model, disrupting any single phase stops the intrusion. The game resolves every phase, treating each one as a separate attempt that a layered defense should stop. This choice reinforces defense in depth (C9), but it should be explained to players and in the presentation.
- **Blocks followed by a successful fallback.** When a block is followed by a fallback that gets through, the block still adds Coverage and Mult, but the phase counts as passed. As a result a mission can be won with few phases actually blocked: in an automated playthrough, mission 3 was won with one phase out of seven blocked (840 against a threshold of 550). The scoring rule may need to be reconsidered.
- **Role of chance.** The actual technique of each phase is drawn at random from the profile, and so are the known phases. Randomness keeps every campaign different and models real uncertainty, while the briefing and the SOC give the player tools to reduce it.
- **Balance.** Thresholds and rewards are set by design and have not been tuned with players yet. The beta test should record the Defense score and the phases blocked in every mission.
