---
status: active
project: meta
type: index
---
# VAULT INDEX

Read this note first. It contains the profile, map, and maintenance contract for this vault.

## Vault location

`/Users/948471/Projects/Muse/vault`

The files are stored locally. Any note read by Codex may be sent to OpenAI for processing
under the account's product and data-control settings. Do not store secrets here.

## Who I Am

I am Mike. I am a seasoned IT professional with over 25 years experience. I am part of the Microsoft Business Group here within the Cloud Infrastruction and Security (CIS) service line here at Cognizant. I am a senior Azure solution architect. I am part of the presales and solutioning group within the Microsoft Business Group, also MBG for short. I focus on presales, solutioning, and offerings. I am also one of our AI experts focusing on all things AI, not just Microsofts AI in copilot, and Azure foundry, but also 3rd party AI solutions. Very tech centric, and hands on, and interesting in all things technology related from computers, smart homes, smart cars, etc.

## 4000794467, Navacor-Cloud Consolidation CR1-AUG 2026 (02 - 4000794467, Navacor-Cloud Consolidation CR1-AUG 2026)

Will add after

- **Status:** Active

## 4000799075, Elevanc-ICP and 14 Apps-JUL 2026 (03 - 4000799075, Elevanc-ICP and 14 Apps-JUL 2026)

Will add after

- **Status:** Active

## 4000800071, CVS Pha-CVS Omnicare Infra security-AUG 2026 (04 - 4000800071, CVS Pha-CVS Omnicare Infra security-AUG 2026)

Will add after

- **Status:** Active

## 4000802545, Molina - CareSync+ Consolidation-OCT 2026 (05 - 4000802545, Molina - CareSync+ Consolidation-OCT 2026)

Will add after

- **Status:** Active

## Microsoft Sovereign Cloud Offering (06 - Microsoft Sovereign Cloud Offering)

Working with Amit from delivery and MSFT to create Cognizants offering in this space

- **Status:** Active

## Cognizant Cloud FinOps Offering (07 - Cognizant Cloud FinOps Offering)

Working with the CIS FinOps team to understand our offering

- **Status:** Active

## MBG Presales Agents (08 - MBG Presales Agents)

Utilize Agents and AI more efficiently within our MBG presales group

- **Status:** Active
- **Tools:** Azure Foundry, Copilot Studio

## Vault Structure

```text
00 - Inbox          ← Capture first, organize later
01 - Daily Notes    ← Append-only session history
02 - 4000794467, Navacor-Cloud Consolidation CR1-AUG 2026 ← Will add after
03 - 4000799075, Elevanc-ICP and 14 Apps-JUL 2026 ← Will add after
04 - 4000800071, CVS Pha-CVS Omnicare Infra security-AUG 2026 ← Will add after
05 - 4000802545, Molina - CareSync+ Consolidation-OCT 2026 ← Will add after
06 - Microsoft Sovereign Cloud Offering ← Working with Amit from delivery and MSFT to create Cognizants offering in this space
07 - Cognizant Cloud FinOps Offering ← Working with the CIS FinOps team to understand our offering
08 - MBG Presales Agents ← Utilize Agents and AI more efficiently within our MBG presales group
09 - Personal       ← Personal reference notes
10 - Archive        ← Completed and inactive material
11 - Resources      ← Cross-project guides and Jobs
```

## What's Active

The current source of truth is [[Active Priorities]]. Verify an item's real state before
acting; a listed item may already have changed.

## My Preferences for Working with AI

- Always try to lead with AI, and use AI whenever and wherever possible. Try to agentify everything.

## Writing Rules

- Always be professional, and to the point. Try not to add too much fluff when writing. When needed provide reference links as evidence to back up claims.

## How Memory Works

This vault is durable external context. Load only what the current task needs. Start here,
follow the appropriate folder index or Job boot chain, and use search when links are not
enough. The vault is the memory store; the model is not assumed to retain earlier sessions.

## Vault Rules

### Frontmatter

Every Markdown note uses YAML frontmatter:

```yaml
---
status: active
project: project-slug
type: reference
---
```

- `status`: `active`, `completed`, `parked`, `idea`, or `archived`
- `type`: `index`, `reference`, `guide`, `plan`, or `log`
- `project`: what the note serves, using these mappings:
- `02 - 4000794467, Navacor-Cloud Consolidation CR1-AUG 2026/*` → `4000794467-navacor-cloud-consolidation-cr1-aug-2026`
- `03 - 4000799075, Elevanc-ICP and 14 Apps-JUL 2026/*` → `4000799075-elevanc-icp-and-14-apps-jul-2026`
- `04 - 4000800071, CVS Pha-CVS Omnicare Infra security-AUG 2026/*` → `4000800071-cvs-pha-cvs-omnicare-infra-security-aug-2026`
- `05 - 4000802545, Molina - CareSync+ Consolidation-OCT 2026/*` → `4000802545-molina-caresync-consolidation-oct-2026`
- `06 - Microsoft Sovereign Cloud Offering/*` → `microsoft-sovereign-cloud-offering`
- `07 - Cognizant Cloud FinOps Offering/*` → `cognizant-cloud-finops-offering`
- `08 - MBG Presales Agents/*` → `mbg-presales-agents`
- `09 - Personal/*` → `personal`
- `01 - Daily Notes/*` → `personal`
- `11 - Resources/*` → `meta`
- `00 - Inbox/*` → infer from content, otherwise `personal`
- Root-level notes → `meta`

Infer values from context. Code and non-note files do not receive note frontmatter.

### Links and indexes

- Link important people, named projects/products, and directly related notes with `[[wikilinks]]`.
- Do not link generic words, the same target twice, or a note to itself.
- Each substantive folder has an index named after the unnumbered folder name.
- Update an index in the same change as any note it maps.
- If a file is renamed outside Obsidian, repair every old wikilink reference.

### Capture and persistence

- Append to an existing logical home before creating a thin new note.
- Save durable decisions and corrections; do not save casual chat or speculation.
- Ask before storing health, financial, legal, credential, or other sensitive details.
- Never write secret values. Refer to their Keychain or password-manager item instead.
- Archive only when explicitly requested. Set `status: archived`, move the file, and update indexes.

### Daily notes

- Location: `01 - Daily Notes/MM - Month YYYY/YYYY-MM-DD.md`
- Create from [[Daily Note Template]] and change `type` to `log`.
- One note per local calendar day. Append sessions; never overwrite or rewrite history.
- Update the Index before adding the session body.
- Record outcomes, open work, decisions, notes touched, and profile changes.

### Jobs

A Job is one master guide for recurring work. Its boot chain links only the context that
specific task needs. Read one Job end-to-end, follow its links, execute the procedure, and
fold confirmed corrections into its Lessons section.
