# 1. Learning objectives

## 1.1 Target players

The game is designed for players with general computer literacy and no specialist security training, such as university students in computing or non-security staff of an organisation. It assumes that the player:

- uses email, the web and passwords in everyday life;
- reads Italian, the language of the interface;
- can follow a simple numeric score (a sum and a multiplication).

No prior knowledge of the Cyber Kill Chain, of MITRE ATT&CK or of specific security products is required: every concept is introduced inside the game.

## 1.2 General aim

> After playing, the player understands that a cyber attack is a sequence of steps that can be disrupted at several points, and is able to choose proportionate security controls against a given adversary when resources are limited.

## 1.3 Concepts

The concepts below are the content the game transmits. They are listed in the order in which the game introduces them.

| # | Concept | Definition used in the game | First met |
|---|---|---|---|
| C1 | Cyber Kill Chain | A model that splits an intrusion into seven ordered phases: Reconnaissance, Weaponization, Delivery, Exploitation, Installation, Command and Control, Actions on Objectives. | Mission 1, board |
| C2 | Attack technique | A concrete method an attacker uses in one phase, identified by its MITRE ATT&CK ID (for example T1566.001, Spearphishing Attachment). The game uses 22 techniques. | Mission 1, briefing |
| C3 | Security control | A technical, procedural or human measure that stops one or more techniques. The game uses 20 controls. | Mission 1, deck selection |
| C4 | Early disruption | Stopping an attack in its first phases is worth more than stopping it late, because fewer assets have been reached. | Mission 1, scoring |
| C5 | Consequences of a breach | A phase that is not stopped leaves effects that outlast the incident: persistence (a backdoor), stolen data, recovery costs. | Mission 1, debrief |
| C6 | Threat intelligence | Knowing in advance which techniques an adversary tends to use, so that defenses can be chosen before the attack. | Mission 1, briefing |
| C7 | Detection and visibility (SOC) | Spending resources to observe what the attacker is doing; some phases stay invisible unless someone looks. | Mission 2, hidden phases |
| C8 | Adaptive adversary | An attacker who is blocked does not give up: they switch to another technique in the same phase. | Mission 2, reserves |
| C9 | Defense in depth | Several independent controls on the same phase, so that the failure or bypass of one does not open the way. | Mission 2, fallback |
| C10 | Risk management | With a limited budget not everything can be protected: the defender decides what to cover and which risk to accept. | Mission 1, deck of 10 cards |
| C11 | Identity and access | Stolen or reused credentials and forgotten remote accesses are an entry point; MFA and least privilege reduce it. | Mission 3 |
| C12 | Supply chain risk | An organisation can be attacked through its suppliers and through software updates it trusts. | Mission 4 |
| C13 | Resilience | Some attacks aim to destroy rather than steal; offline backups and network segmentation limit the damage. | Mission 5 |
| C14 | Real incidents | Each attack pattern in the game corresponds to a documented incident with an identifiable root cause. | Every debrief |

## 1.4 Learning objectives

Objectives are written with the levels of Bloom's revised taxonomy. Each one names the mechanic that teaches it and the in-game evidence that the player has reached it.

### LO1. Name the seven phases of the Cyber Kill Chain in order

- **Level:** Remember
- **Concepts:** C1
- **Mechanics:**
  - the board is the kill chain: seven numbered columns, left to right;
  - the three turns resolve the phases in order (1-3, 4-5, 6-7);
  - every defense card shows seven pips, lit on the phases where it acts.
- **Evidence in game:** the player places cards only in valid phases without trial and error.

### LO2. Explain why an attack should be disrupted as early as possible

- **Level:** Understand
- **Concepts:** C4, C5
- **Mechanics:**
  - a block in phases 1-3 adds +2 Mult, a block in phases 4-7 adds +1;
  - an unblocked Installation phase leaves a backdoor: the next adversary gets one extra reserve;
  - an unblocked Actions on Objectives phase costs funds (ransomware, data destruction) or removes the known phases of the next mission (exfiltration).
- **Evidence in game:** the player invests credits in the Preparation turn and protects phases 5 and 7.

### LO3. Describe the attacker techniques and classify each in its kill-chain phase

- **Level:** Understand
- **Concepts:** C2
- **Mechanics:**
  - attack cards show name, MITRE ATT&CK ID and icon;
  - clicking a technique opens a step-by-step simulation with a concrete example;
  - the briefing lists the possible techniques of the adversary per phase.
- **Evidence in game:** the player recognises a revealed technique and anticipates the fallback techniques listed in the profile.

### LO4. Match each technique with the security controls that stop it

- **Level:** Apply
- **Concepts:** C3
- **Mechanics:**
  - a block happens only when the control placed in the phase stops the actual technique;
  - in the briefing, hovering a technique highlights the cards of the collection that stop it;
  - the debrief names, for each technique that got through, the controls that would have stopped it.
- **Evidence in game:** the share of placed cards that block increases from mission to mission.

### LO5. Apply defense in depth against an adversary that adapts

- **Level:** Apply
- **Concepts:** C8, C9
- **Mechanics:**
  - from mission 2 the adversary has reserves: when blocked, it switches to another technique of its profile;
  - each phase accepts up to two defenses, and two different controls stop both the first technique and the fallback (*Doppio blocco*);
  - the *Purple team* and *Difesa in profondità* jokers reward double blocks and blocks on many phases.
- **Evidence in game:** the player places a second, different control on phases where the profile lists two techniques.

### LO6. Analyse an adversary profile to decide where to defend

- **Level:** Analyse
- **Concepts:** C6, C7
- **Mechanics:**
  - the briefing shows the adversary's techniques per phase, with some phases marked "No information" (*Nessuna informazione*) in later missions;
  - a few attack cards are revealed at the start (known phases), the others can be revealed by the SOC for 1 credit;
  - the shop gives a hint about the next adversary.
- **Evidence in game:** the deck chosen in the briefing contains controls for the techniques of the profile, and the SOC is used on the hidden phases.

### LO7. Make risk-based trade-offs with a limited budget

- **Level:** Evaluate
- **Concepts:** C10
- **Mechanics:**
  - the deck holds only 10 cards out of a collection of 14 to 20;
  - each turn gives 4 credits, unspent credits carry over, and up to 3 saved credits become extra funds after a win;
  - the shop forces a choice between new controls, jokers and upgrades.
- **Evidence in game:** the player leaves low-impact phases uncovered on purpose and wins with credits to spare.

### LO8. Relate each attack to a documented real incident and its root cause

- **Level:** Understand
- **Concepts:** C11, C12, C13, C14
- **Mechanics:**
  - every debrief closes with the real case the mission is modelled on (Equifax, the Irish health service, Colonial Pipeline, Target, the Ukrainian power grid, NotPetya) and a one-line lesson;
  - the shop offers, before each mission, the new controls that the corresponding real incident calls for (MFA before Colonial Pipeline, supplier vetting before Target).
- **Evidence in game:** none directly; this objective is measured with the questionnaire below.

## 1.5 Objectives and mechanics at a glance

| Objective | Board and turns | Briefing and profile | SOC | Reserves and fallback | Scoring | Consequences | Simulations | Debrief | Shop |
|---|---|---|---|---|---|---|---|---|---|
| LO1 Kill chain phases | ● |  |  |  | ● |  | ● |  |  |
| LO2 Early disruption |  |  |  |  | ● | ● |  | ● |  |
| LO3 Techniques |  | ● | ● |  |  |  | ● | ● |  |
| LO4 Technique ↔ control |  | ● |  |  | ● |  | ● | ● |  |
| LO5 Defense in depth | ● | ● |  | ● | ● |  |  | ● | ● |
| LO6 Adversary profile |  | ● | ● |  |  |  |  |  | ● |
| LO7 Risk trade-offs | ● | ● | ● |  | ● | ● |  |  | ● |
| LO8 Real incidents |  |  |  |  |  |  |  | ● | ● |

## 1.6 Measuring the objectives

The objectives are meant to be measured in the beta test with the MEEGA+ questionnaire, whose learning section repeats one item for each goal of the game: "The game contributed to *verb* *goal*". The items for this game are:

| Objective | MEEGA+ item |
|---|---|
| LO1 | The game contributed to **recalling** the seven phases of the Cyber Kill Chain in order. |
| LO2 | The game contributed to **understanding** why an attack should be stopped in its early phases. |
| LO3 | The game contributed to **describing** common attacker techniques and the phase in which they are used. |
| LO4 | The game contributed to **matching** attacker techniques with the security controls that stop them. |
| LO5 | The game contributed to **applying** defense in depth against an attacker that changes technique. |
| LO6 | The game contributed to **analysing** an adversary profile to decide where to defend. |
| LO7 | The game contributed to **choosing** which risks to cover when resources are limited. |
| LO8 | The game contributed to **relating** cyber attacks to real incidents and their causes. |

Objectives LO1, LO3 and LO4 can also be checked with a short pre-test and post-test: list the phases in order, assign five techniques to their phase, match five techniques with a control that stops them.
