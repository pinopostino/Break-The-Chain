# Design documentation

This folder documents the instructional design of **Spezza la Catena** (*Break the Chain*), following the design phases of the Serious Games for Cyber-Security course: definition of concepts and learning objectives, task analysis, mission structure, prototypes and storyboards.

The documentation describes the current build of the game. The game interface is in Italian: every in-game label is given in English followed by the original Italian term in italics, so that each item can be found on screen.

## Contents

| # | Document | Course topic | What it answers |
|---|---|---|---|
| 1 | [Learning objectives](01-learning-objectives.md) | Mechanics definition: concepts | What the player should know and be able to do after playing, and which mechanic teaches each objective |
| 2 | [Task analysis](02-task-analysis.md) | Mechanics definition: task analysis | How the main skill breaks down into elementary skills, and in which order they are introduced |
| 3 | [Mission design](03-mission-design.md) | Aesthetics: missions and levels | What each of the six missions teaches, and how difficulty increases |
| 4 | [Prototypes and storyboards](04-storyboards.md) | Aesthetics: details | Screen flow, wireframe and storyboard of every screen, shot lists of the cutscenes |

## Glossary of game terms

| English | In game (Italian) | Meaning |
|---|---|---|
| Kill chain | *Kill chain* | The seven phases of an attack, shown as seven columns on the board |
| Turn | *Turno* | One of the three steps of an attack: Preparation (phases 1-3), Intrusion (4-5), Impact (6-7) |
| Attack card | *Carta del red team* | A red card holding the attacker's technique for one phase, face down until revealed |
| Defense card | *Carta difesa* | A blue card holding a security control, placed in a phase to block a technique |
| Collection | *Collezione* | All the defense cards the player owns |
| Deck | *Mazzo* | The 10 cards chosen from the collection for one mission |
| Credits | *Crediti* | Per-turn budget spent to place defenses and to pay the SOC |
| Funds | *Fondi* | Campaign currency earned after each mission and spent in the shop |
| Resilience | *Resilienza* | The player's lives: three, one lost for each failed mission |
| Coverage | *Copertura* | Points earned by each successful block |
| Mult | *Molt* | Multiplier increased by each successful block |
| Defense score | *Difesa* | Coverage × Mult, compared with the mission threshold |
| Threshold | *Soglia* | The Defense score needed to win the mission |
| Reserves | *Riserve* | How many times the attacker can switch technique after being blocked |
| Fallback | *Ripiego* | The new technique the attacker uses after spending a reserve |
| SOC analysis | *Analisi del SOC* | Paying credits to reveal a face-down attack card |
| Known phases | *Fasi note* | Attack cards already revealed at the start of the mission |
| Joker | *Joker* | A campaign-long rule modifier bought in the shop |
| Debrief | *Resoconto* | The screen after each mission: outcome per phase, consequences, real case |
