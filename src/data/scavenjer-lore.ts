import arenaThumb from '@/assets/lore/environment-arena.svg'
import coreSectorThumb from '@/assets/lore/environment-core-sector.svg'
import tyzonThumb from '@/assets/lore/environment-tyzon.svg'
import verdantSectorThumb from '@/assets/lore/environment-verdant-sector.svg'
import heavenTricksterThumb from '@/assets/lore/character-heaven-trickster.svg'
import zaidekThumb from '@/assets/lore/character-zaidek.svg'
import zeuseThumb from '@/assets/lore/character-zeuse.svg'
import zibThumb from '@/assets/lore/character-zib.svg'
import resonanceThumb from '@/assets/lore/universe-resonance.svg'
import scavenjerPrimeThumb from '@/assets/lore/universe-scavenjer-prime.svg'
import velientalThumb from '@/assets/lore/universe-veliental.svg'
import type {
  CortexLoreArtifact,
  CortexLoreAtlas,
  CortexLoreCharacter,
  CortexLoreEnvironment,
  CortexLoreFaction,
  CortexLoreSourceRef,
  CortexLoreUniverse,
} from '@/shared/cortex'

const NOTION_LORE: CortexLoreSourceRef = {
  label: 'Lore / Worldbuilding',
  source: 'Notion',
}

const NOTION_SIMULATION: CortexLoreSourceRef = {
  label: 'Simulation Structuring',
  source: 'Notion',
}

const NOTION_RESONANCE: CortexLoreSourceRef = {
  label: 'Resonance',
  source: 'Notion',
}

const NOTION_VELIENTAL: CortexLoreSourceRef = {
  label: 'Veliental Ascendance',
  source: 'Notion',
}

const SCAV_GAME: CortexLoreSourceRef = {
  label: 'Scav Game 1 simulation primitives',
  source: 'Scav Repo',
}

const SCAV_DIAGRAM: CortexLoreSourceRef = {
  label: 'Scav Diagram ecosystem pillars',
  source: 'Scav Repo',
}

const CORTEX_CURATED: CortexLoreSourceRef = {
  label: 'Curated Cortex atlas seed',
  source: 'Cortex',
}

const loreUniverses: CortexLoreUniverse[] = [
  {
    id: 'universe-scavenjer-prime',
    kind: 'universe',
    title: 'Scavenjer Prime',
    layer: 'anchor',
    storyline:
      'The player-facing reality where real cities, businesses, AR drops, rewards, Ekos, and Marbleverse activity stay understandable.',
    direction:
      'Keep lore surface-level and useful: collectibles can reference deeper canon without requiring players to study it.',
    summary:
      'The anchor layer for real-world hunts, partner destinations, collectibles, and reward loops.',
    canonStatus: 'stable',
    accent: 'cyan',
    imageUrl: scavenjerPrimeThumb,
    aesthetic: 'Neon city field ops, real-world AR markers, clean cyberpunk utility.',
    automationContext:
      'Use this universe when an agent needs drop copy, partner reward framing, player onboarding, or Eko utility without heavy mythology.',
    personalityContext:
      'Grounded, direct, adventurous, trust-building, and clear about what players can do next.',
    visualPrompt:
      'Compact neon city AR hunt, glowing marker over a real street grid, practical cyberpunk field interface.',
    sourceRefs: [NOTION_SIMULATION, SCAV_DIAGRAM, CORTEX_CURATED],
    relatedCharacterIds: ['character-zib-unit', 'character-heaven-trickster'],
    relatedEnvironmentIds: ['environment-ar-drop-zone'],
    relatedFactionIds: ['faction-scavenjers'],
    relatedArtifactIds: ['artifact-eko', 'artifact-dark-circuit', 'artifact-drop'],
    tags: ['anchor', 'ar-drops', 'businesses', 'ekos'],
  },
  {
    id: 'universe-resonance',
    kind: 'universe',
    title: 'Resonance',
    layer: 'resonance',
    storyline:
      'A cyberpunk society divided into sectors where public Drops demand participation and volunteers answer in place of civilians.',
    direction:
      'Use music, masks, sectors, and emotional restraint. Stories are vibes, sacrifices, signals, and short-form cinematic pressure.',
    summary:
      'The stylized music-driven simulation for sectors, Drops, Zaidek, ZIB units, and volunteer responders.',
    canonStatus: 'stable',
    accent: 'magenta',
    imageUrl: resonanceThumb,
    aesthetic: 'Glitch-hop, dark electro-pop, masks, sealed sectors, luminous countdowns.',
    automationContext:
      'Use this universe for Zaidek posts, music-linked lore bleeds, masked character prompts, and sector-specific content briefs.',
    personalityContext:
      'Quiet, unsettled, precise, observant, emotional without overexplaining.',
    visualPrompt:
      'Masked cyberpunk responders under a public countdown, sector lights, restrained cinematic lighting, music-video mood.',
    sourceRefs: [NOTION_RESONANCE, NOTION_LORE, CORTEX_CURATED],
    relatedCharacterIds: ['character-zaidek', 'character-zib-unit'],
    relatedEnvironmentIds: ['environment-core-sector', 'environment-verdant-sector'],
    relatedFactionIds: ['faction-ascendants', 'faction-devoids'],
    relatedArtifactIds: ['artifact-drop'],
    tags: ['music', 'drops', 'sectors', 'zaidek'],
  },
  {
    id: 'universe-veliental-ascendance',
    kind: 'universe',
    title: 'Veliental Ascendance',
    layer: 'mythic',
    storyline:
      'The deep anime/mythic canon of Velients, elemental powers, Zeocards, Cyber Gods, war arcs, factions, planets, and Scavenjer origins.',
    direction:
      'Treat as deep canon for long-form arcs. It inspires symbols and collectibles but should not overload Scavenjer Prime.',
    summary:
      'The mythic lore engine behind Velients, Zeocards, gods, planets, and long-form anime-scale stakes.',
    canonStatus: 'review',
    accent: 'amber',
    imageUrl: velientalThumb,
    aesthetic: 'Anime myth-tech, elemental cores, cyber gods, Zeocards, war-scarred planets.',
    automationContext:
      'Use this universe when agents need deep story arcs, faction conflict, character backstory, or collectible symbolism.',
    personalityContext:
      'Mythic, dramatic, protective, power-focused, emotionally heightened, and arc-driven.',
    visualPrompt:
      'Anime cyber god sigil, elemental card portal, glowing power core, mythic sci-fi war atmosphere.',
    sourceRefs: [NOTION_VELIENTAL, NOTION_SIMULATION, CORTEX_CURATED],
    relatedCharacterIds: ['character-zeuse'],
    relatedEnvironmentIds: ['environment-tyzon-city', 'environment-dark-arena'],
    relatedFactionIds: ['faction-demon-corporation', 'faction-church-deeton'],
    relatedArtifactIds: ['artifact-zeocard', 'artifact-velient-core'],
    tags: ['velients', 'zeocards', 'anime', 'mythic'],
  },
]

const loreCharacters: CortexLoreCharacter[] = [
  {
    id: 'character-zaidek',
    kind: 'character',
    title: 'Zaidek',
    universeId: 'universe-resonance',
    role: 'Cross-simulation cultural architect',
    summary:
      'A masked intelligence who appears at inflection points and reframes perception without fully explaining the system.',
    canonStatus: 'stable',
    accent: 'cyan',
    imageUrl: zaidekThumb,
    aesthetic: 'Reflective helmet, subtle LEDs, techwear, minimal movement, controlled framing.',
    automationContext:
      'Use for short signal statements, drop-adjacent prompts, cultural commentary, and rare lore bleeds.',
    personalityContext:
      'Calm, controlled, self-aware, quietly authoritative, never desperate, questions over answers.',
    visualPrompt:
      'Masked cyberpunk signal figure in clean techwear, reflective visor, subtle cyan-magenta light, still posture.',
    sourceRefs: [NOTION_RESONANCE, { label: 'Reality Zaidek', source: 'Notion' }, CORTEX_CURATED],
    relatedCharacterIds: ['character-zib-unit'],
    relatedEnvironmentIds: ['environment-core-sector'],
    relatedFactionIds: ['faction-devoids'],
    relatedArtifactIds: ['artifact-drop'],
    tags: ['zaidek', 'signal', 'masked', 'creator-presence'],
  },
  {
    id: 'character-zib-unit',
    kind: 'character',
    title: 'ZIB Units',
    universeId: 'universe-resonance',
    role: 'Companion assistant constructs',
    summary:
      'Small assistant constructs created by Zaidek to support Drop detection, navigation, task interpretation, and emotional companionship.',
    canonStatus: 'stable',
    accent: 'green',
    imageUrl: zibThumb,
    aesthetic: 'Cute compact bot, screen-face display, visible Z mark, sector-adapted techwear.',
    automationContext:
      'Use when an agent needs an in-world assistant voice, navigation helper, or gentle context companion.',
    personalityContext:
      'Helpful, emotionally intelligent, nonviolent, observant, lightly playful, and intentionally limited.',
    visualPrompt:
      'Small friendly cyber assistant bot in tiny techwear, screen face with Z mark, soft green-cyan display glow.',
    sourceRefs: [NOTION_RESONANCE, CORTEX_CURATED],
    relatedCharacterIds: ['character-zaidek'],
    relatedEnvironmentIds: ['environment-core-sector', 'environment-ar-drop-zone'],
    relatedFactionIds: [],
    relatedArtifactIds: ['artifact-zib-unit', 'artifact-drop'],
    tags: ['zib', 'assistant', 'companion', 'automation'],
  },
  {
    id: 'character-heaven-trickster',
    kind: 'character',
    title: 'Heaven Trickster v1',
    universeId: 'universe-scavenjer-prime',
    role: 'Scavenjer character archetype',
    clan: 'Heaven',
    summary:
      'A broad-shouldered cyber carnival trickster with silver hair, poncho techwear, holo feathers, and playful presence.',
    canonStatus: 'review',
    accent: 'cyan',
    imageUrl: heavenTricksterThumb,
    aesthetic: 'Cyan palette, holographic feathers, poncho layers, carnival cyber styling.',
    automationContext:
      'Use as a promptable archetype for collectible variants, avatar direction, and playful reward campaign visuals.',
    personalityContext:
      'Playful, clever, theatrical, charismatic, and hard to read without becoming chaotic.',
    visualPrompt:
      'Stylish carnival cyber trickster, silver hair, cyan holographic poncho, rune chest plate, holo feathers overhead.',
    sourceRefs: [{ label: 'Scavenjer character database', source: 'Notion' }, CORTEX_CURATED],
    relatedCharacterIds: [],
    relatedEnvironmentIds: ['environment-ar-drop-zone'],
    relatedFactionIds: ['faction-scavenjers'],
    relatedArtifactIds: ['artifact-eko'],
    tags: ['heaven', 'trickster', 'avatar', 'collectible'],
  },
  {
    id: 'character-zeuse',
    kind: 'character',
    title: 'Zeuse',
    universeId: 'universe-veliental-ascendance',
    role: 'Main character',
    summary:
      'A protective Scavenjer tied to Veliental conflict, loss, Pyzer, and reincarnation into organic cyber form after the first arc.',
    canonStatus: 'review',
    accent: 'amber',
    imageUrl: zeuseThumb,
    aesthetic: 'Anime hero silhouette, fire-coded power, Zeocard tension, war-scarred techwear.',
    automationContext:
      'Use for long-form character arcs, emotional anime beats, sacrifice scenes, and Veliental protagonist prompts.',
    personalityContext:
      'Protective, strength-seeking, haunted by loss, loyal to family, vulnerable to power bargains.',
    visualPrompt:
      'Anime cyber warrior with fire-god symbolism, Zeocard energy, tense heroic stance, warm amber-red lighting.',
    sourceRefs: [NOTION_VELIENTAL, CORTEX_CURATED],
    relatedCharacterIds: [],
    relatedEnvironmentIds: ['environment-tyzon-city', 'environment-dark-arena'],
    relatedFactionIds: ['faction-scavenjers', 'faction-church-deeton'],
    relatedArtifactIds: ['artifact-zeocard', 'artifact-velient-core'],
    tags: ['zeuse', 'veliental', 'protagonist', 'fire'],
  },
]

const loreEnvironments: CortexLoreEnvironment[] = [
  {
    id: 'environment-core-sector',
    kind: 'environment',
    title: 'Core Sector',
    universeId: 'universe-resonance',
    environmentType: 'sector',
    summary:
      'A dense, illuminated, information-saturated sector where the name Scavenjers endures for volunteer Drop responders.',
    canonStatus: 'stable',
    accent: 'cyan',
    imageUrl: coreSectorThumb,
    aesthetic: 'Dense neon, routine-integrated optics, reputation-driven identity, controlled unease.',
    automationContext:
      'Use for Scavenjer volunteer stories, Zaidek appearances, urban Drop scenes, and reputation-driven content.',
    personalityContext:
      'Alert, tense, introspective, quietly hopeful, and shaped by public speculation.',
    visualPrompt:
      'Dense cyberpunk sector, luminous signs, public countdown, HUD-lite wearables, volunteer responders in shadow.',
    sourceRefs: [NOTION_RESONANCE, CORTEX_CURATED],
    relatedCharacterIds: ['character-zaidek', 'character-zib-unit'],
    relatedEnvironmentIds: [],
    relatedFactionIds: ['faction-scavenjers', 'faction-ascendants'],
    relatedArtifactIds: ['artifact-drop'],
    tags: ['sector', 'core', 'drops', 'urban'],
  },
  {
    id: 'environment-verdant-sector',
    kind: 'environment',
    title: 'Verdant Sector',
    universeId: 'universe-resonance',
    environmentType: 'sector',
    summary:
      'A tribal futurist sector that interprets Drops as divine omens and technology as a spiritual conduit.',
    canonStatus: 'stable',
    accent: 'green',
    imageUrl: verdantSectorThumb,
    aesthetic: 'Tribal ambient, organic bass, ritual wearables, circuitry treated as spirit conduit.',
    automationContext:
      'Use for ritual Drop interpretation, ancestral signal language, and sector-specific visual/music briefs.',
    personalityContext:
      'Reverent, continuous, sacrifice-aware, community-rooted, and spiritually technical.',
    visualPrompt:
      'Tribal futurist biodome, glowing ritual circuits, elders reading frequencies, organic neon landscape.',
    sourceRefs: [NOTION_RESONANCE, CORTEX_CURATED],
    relatedCharacterIds: [],
    relatedEnvironmentIds: [],
    relatedFactionIds: ['faction-ascendants'],
    relatedArtifactIds: ['artifact-drop'],
    tags: ['sector', 'verdant', 'ritual', 'frequencies'],
  },
  {
    id: 'environment-tyzon-city',
    kind: 'environment',
    title: 'Tyzon City',
    universeId: 'universe-veliental-ascendance',
    environmentType: 'city',
    summary:
      'The capital city of Evangelon, guarded by Armament-made weaponry and ruled by strong Zeo users and wealth.',
    canonStatus: 'review',
    accent: 'magenta',
    imageUrl: tyzonThumb,
    aesthetic: 'Huge neon city, business-style tech attire, class separation, weaponized governance.',
    automationContext:
      'Use for Veliental city scenes, faction pressure, wealthy Zeo-user politics, and Scavenjer outsider contrast.',
    personalityContext:
      'Polished, guarded, hierarchical, tense, impressive, and morally compressed.',
    visualPrompt:
      'Massive anime cyber city, neon business district, Armament weapons, portals, class-divided skyline.',
    sourceRefs: [NOTION_VELIENTAL, CORTEX_CURATED],
    relatedCharacterIds: ['character-zeuse'],
    relatedEnvironmentIds: ['environment-dark-arena'],
    relatedFactionIds: ['faction-demon-corporation'],
    relatedArtifactIds: ['artifact-zeocard'],
    tags: ['tyzon', 'city', 'evangelon', 'zeocards'],
  },
  {
    id: 'environment-dark-arena',
    kind: 'environment',
    title: 'Dark Arena',
    universeId: 'universe-veliental-ascendance',
    environmentType: 'arena',
    summary:
      'A game-facing dark terrain with artifact beacon, hostile glitch units, wild companions, and survival pressure.',
    canonStatus: 'draft',
    accent: 'green',
    imageUrl: arenaThumb,
    aesthetic: 'Dark terrain, glowing artifact, cyber-crystal trees, grid floor, survival simulation.',
    automationContext:
      'Use for browser-game combat prompts, survival loops, artifact retrieval, enemies, companions, and arena tests.',
    personalityContext:
      'Urgent, combat-aware, exploratory, resource-driven, and readable at game speed.',
    visualPrompt:
      'Dark cyber arena floor, green artifact beacon, crystal foliage, glitch enemies, survival HUD energy.',
    sourceRefs: [SCAV_GAME, CORTEX_CURATED],
    relatedCharacterIds: ['character-zeuse'],
    relatedEnvironmentIds: [],
    relatedFactionIds: [],
    relatedArtifactIds: ['artifact-velient-core'],
    tags: ['arena', 'simulation', 'artifact', 'game'],
  },
  {
    id: 'environment-ar-drop-zone',
    kind: 'environment',
    title: 'AR Drop Zone',
    universeId: 'universe-scavenjer-prime',
    environmentType: 'drop-zone',
    summary:
      'The practical real-world play space where players scan, collect, redeem, and create proof around drops.',
    canonStatus: 'stable',
    accent: 'amber',
    imageUrl: scavenjerPrimeThumb,
    aesthetic: 'Real location, digital marker, countdown, sponsor reward context, scan-ready composition.',
    automationContext:
      'Use for operational drop briefs, partner creative, Discord announcements, and field-ready player instructions.',
    personalityContext:
      'Clear, energetic, location-aware, practical, and reward-focused.',
    visualPrompt:
      'Real-world AR marker over a city location, countdown badge, reward beam, scan interface, player proof moment.',
    sourceRefs: [SCAV_DIAGRAM, CORTEX_CURATED],
    relatedCharacterIds: ['character-zib-unit', 'character-heaven-trickster'],
    relatedEnvironmentIds: [],
    relatedFactionIds: ['faction-scavenjers'],
    relatedArtifactIds: ['artifact-drop', 'artifact-eko'],
    tags: ['ar', 'drop', 'marbleverse', 'field'],
  },
]

const loreFactions: CortexLoreFaction[] = [
  {
    id: 'faction-scavenjers',
    kind: 'faction',
    title: 'Scavenjers',
    universeId: 'universe-veliental-ascendance',
    agenda:
      'Protect people caught between war, systems, and power by scavenging dangerous cores, answering risk, and holding the middle line.',
    summary:
      'The helping-hand identity that appears across layers as volunteers, field operators, and protective scavenger groups.',
    canonStatus: 'stable',
    accent: 'cyan',
    imageUrl: scavenjerPrimeThumb,
    aesthetic: 'Tech-gear, S-symbol identity, practical field readiness, moral center under pressure.',
    automationContext:
      'Use as the default faction for protective player identity, volunteer responders, and mission-aligned Scavenjer copy.',
    personalityContext:
      'Protective, generous, risk-bearing, practical, community-first.',
    visualPrompt:
      'Scavenjer field crew in dark techwear with S symbols, neon city edge, collected cores and AR markers.',
    sourceRefs: [NOTION_VELIENTAL, NOTION_RESONANCE, CORTEX_CURATED],
    relatedCharacterIds: ['character-zeuse', 'character-heaven-trickster'],
    relatedEnvironmentIds: ['environment-core-sector', 'environment-ar-drop-zone'],
    relatedFactionIds: [],
    relatedArtifactIds: ['artifact-drop', 'artifact-zeocard'],
    tags: ['scavenjers', 'faction', 'volunteers', 'field'],
  },
  {
    id: 'faction-ascendants',
    kind: 'faction',
    title: 'Ascendants',
    universeId: 'universe-resonance',
    agenda:
      'System-sanctioned responders trained to stabilize Drops, interpreted differently across sectors.',
    summary:
      'Official Drop responders selected by the system and returned as necessary stabilizers.',
    canonStatus: 'stable',
    accent: 'magenta',
    imageUrl: resonanceThumb,
    aesthetic: 'Sanctioned masks, ritual authority, clean silhouettes, sector-specific myth.',
    automationContext:
      'Use for official system response, adversarial ambiguity, and sector myth prompts.',
    personalityContext:
      'Controlled, trained, distant, necessary, feared or respected depending on sector.',
    visualPrompt:
      'System-trained masked responder under countdown light, clean cyber uniform, sector crowd watching.',
    sourceRefs: [NOTION_RESONANCE, CORTEX_CURATED],
    relatedCharacterIds: [],
    relatedEnvironmentIds: ['environment-core-sector', 'environment-verdant-sector'],
    relatedFactionIds: ['faction-devoids'],
    relatedArtifactIds: ['artifact-drop'],
    tags: ['ascendants', 'system', 'responders'],
  },
  {
    id: 'faction-devoids',
    kind: 'faction',
    title: 'The Devoids',
    universeId: 'universe-resonance',
    agenda:
      'Intervene only when simulation-local outcomes fracture, repeat incorrectly, or echo beyond one world.',
    summary:
      'Cross-simulation exceptions aligned with Zaidek that mark events that should not be happening.',
    canonStatus: 'stable',
    accent: 'red',
    imageUrl: zaidekThumb,
    aesthetic: 'Minimal, unsettling, perception-breaking, almost undocumented.',
    automationContext:
      'Use sparingly for high-stakes recontextualization, cross-simulation events, and anomaly warnings.',
    personalityContext:
      'Silent, rare, precise, not heroic or villainous, impossible to fully classify.',
    visualPrompt:
      'Small cadre of silent masked anomalies, distorted space, black-white light, simulation fracture.',
    sourceRefs: [NOTION_RESONANCE, CORTEX_CURATED],
    relatedCharacterIds: ['character-zaidek'],
    relatedEnvironmentIds: [],
    relatedFactionIds: ['faction-ascendants'],
    relatedArtifactIds: [],
    tags: ['devoids', 'cross-simulation', 'anomaly'],
  },
  {
    id: 'faction-demon-corporation',
    kind: 'faction',
    title: 'De-Mon Corporation',
    universeId: 'universe-veliental-ascendance',
    agenda:
      'Control or destroy Velients through Zeocards, weapons, armor replication, and experiments.',
    summary:
      'A human association that treats Velients as monsters and pursues weaponized control.',
    canonStatus: 'review',
    accent: 'amber',
    imageUrl: tyzonThumb,
    aesthetic: 'Militarized corporate tech, experimental weapons, harsh city authority.',
    automationContext:
      'Use for antagonist systems, corporate exploitation, anti-Velient weapons, and city control beats.',
    personalityContext:
      'Authoritarian, fearful, resource-hungry, technically capable, morally hard-edged.',
    visualPrompt:
      'Militarized cyber corporation lab, ZeoBlades, captured core cards, hard amber city lighting.',
    sourceRefs: [NOTION_VELIENTAL, CORTEX_CURATED],
    relatedCharacterIds: ['character-zeuse'],
    relatedEnvironmentIds: ['environment-tyzon-city'],
    relatedFactionIds: ['faction-church-deeton'],
    relatedArtifactIds: ['artifact-zeocard', 'artifact-velient-core'],
    tags: ['demon', 'corporation', 'antagonist', 'velients'],
  },
  {
    id: 'faction-church-deeton',
    kind: 'faction',
    title: 'Church of Deeton',
    universeId: 'universe-veliental-ascendance',
    agenda:
      'Resurrect or serve Deetonix through ritual, vessels, destroyer cores, and moon-linked power.',
    summary:
      'A religious faction centered on Deetonix and the belief that life ends and begins again through his power.',
    canonStatus: 'review',
    accent: 'red',
    imageUrl: velientalThumb,
    aesthetic: 'Mythic-tech ritual, dark cyber god worship, red-black sacrificial symbolism.',
    automationContext:
      'Use for ritual antagonist arcs, Deetonix lore, sacrifice scenes, and destroyer-core objectives.',
    personalityContext:
      'Fanatical, ceremonial, prophetic, severe, devoted to rebirth through destruction.',
    visualPrompt:
      'Dark cyber church ritual, destroyer core, moon portal, red-black deity sigils, anime tragedy.',
    sourceRefs: [NOTION_VELIENTAL, CORTEX_CURATED],
    relatedCharacterIds: ['character-zeuse'],
    relatedEnvironmentIds: ['environment-dark-arena'],
    relatedFactionIds: ['faction-demon-corporation'],
    relatedArtifactIds: ['artifact-velient-core'],
    tags: ['deeton', 'church', 'deetonix', 'ritual'],
  },
]

const loreArtifacts: CortexLoreArtifact[] = [
  {
    id: 'artifact-eko',
    kind: 'artifact',
    title: 'Ekos',
    universeId: 'universe-scavenjer-prime',
    function:
      'Collectible identity, access, avatars, city voting, requested drops, and Dark Circuit reward context.',
    summary:
      'The flagship collectible layer that bridges Scavenjer Prime utility with surface-level lore symbolism.',
    canonStatus: 'stable',
    accent: 'magenta',
    imageUrl: heavenTricksterThumb,
    aesthetic: 'Cyber avatar collectible, clan palette, utility-first lore reference.',
    automationContext:
      'Use for holder messaging, avatar utility, voting access, collectible prompts, and reward campaigns.',
    personalityContext:
      'Identity-first, collectible, aspirational, useful, not speculative.',
    visualPrompt:
      'Cyber collectible avatar card, clan palette, holographic access mark, Scavenjer utility chip.',
    sourceRefs: [NOTION_SIMULATION, CORTEX_CURATED],
    relatedCharacterIds: ['character-heaven-trickster'],
    relatedEnvironmentIds: ['environment-ar-drop-zone'],
    relatedFactionIds: ['faction-scavenjers'],
    relatedArtifactIds: ['artifact-dark-circuit'],
    tags: ['eko', 'collectible', 'identity'],
  },
  {
    id: 'artifact-drop',
    kind: 'artifact',
    title: 'Drops',
    universeId: 'universe-resonance',
    function:
      'Public necessity events in Resonance and practical AR hunt events in Scavenjer Prime.',
    summary:
      'The cross-layer event primitive that can be lethal ritual in lore or playable reward moment in operations.',
    canonStatus: 'stable',
    accent: 'amber',
    imageUrl: scavenjerPrimeThumb,
    aesthetic: 'Countdown, designated zone, visible marker, escalating attention.',
    automationContext:
      'Use as the core event object for story hooks, AR field ops, Discord announcements, and lore bleeds.',
    personalityContext:
      'Urgent, participatory, consequence-bearing, public, and time-sensitive.',
    visualPrompt:
      'Glowing countdown over a designated zone, public signal, AR marker, crowd tension.',
    sourceRefs: [NOTION_RESONANCE, NOTION_SIMULATION, SCAV_GAME],
    relatedCharacterIds: ['character-zaidek', 'character-zib-unit'],
    relatedEnvironmentIds: ['environment-core-sector', 'environment-ar-drop-zone'],
    relatedFactionIds: ['faction-scavenjers', 'faction-ascendants'],
    relatedArtifactIds: [],
    tags: ['drop', 'event', 'countdown', 'ar'],
  },
  {
    id: 'artifact-zeocard',
    kind: 'artifact',
    title: 'Zeocards',
    universeId: 'universe-veliental-ascendance',
    function:
      'Card-like portal devices that hold a Velient and let a synced human harness limited elemental ability.',
    summary:
      'The signature Veliental tool for capture, sync, power access, and high-risk combat structure.',
    canonStatus: 'review',
    accent: 'cyan',
    imageUrl: velientalThumb,
    aesthetic: 'Portal card, white crystal shard, elemental core light, anime battle utility.',
    automationContext:
      'Use for Veliental battle mechanics, collectible game systems, power sync scenes, and artifact lore.',
    personalityContext:
      'Powerful, dangerous, tactical, bond-dependent, and costly if overused.',
    visualPrompt:
      'Anime portal card holding elemental cyber energy, white crystal core, glowing frame, battle-ready hand pose.',
    sourceRefs: [NOTION_VELIENTAL, CORTEX_CURATED],
    relatedCharacterIds: ['character-zeuse'],
    relatedEnvironmentIds: ['environment-tyzon-city'],
    relatedFactionIds: ['faction-scavenjers', 'faction-demon-corporation'],
    relatedArtifactIds: ['artifact-velient-core'],
    tags: ['zeocard', 'velient', 'portal', 'power'],
  },
  {
    id: 'artifact-velient-core',
    kind: 'artifact',
    title: 'Velient Cores',
    universeId: 'universe-veliental-ascendance',
    function:
      'Crystal power sources that evolve Velients, centralize life force, and shape elemental races.',
    summary:
      'The deep-canon power source behind Velient evolution, combat limits, pain, and elemental conflict.',
    canonStatus: 'review',
    accent: 'green',
    imageUrl: arenaThumb,
    aesthetic: 'Glowing crystal core, elemental charge, cyber-organic energy, dangerous radius.',
    automationContext:
      'Use for elemental race prompts, power stakes, artifact retrieval, and core-protection story logic.',
    personalityContext:
      'Precious, volatile, life-sustaining, dangerous, coveted.',
    visualPrompt:
      'Glowing alien crystal core in dark terrain, elemental aura, cyber life force, warning radius.',
    sourceRefs: [NOTION_VELIENTAL, SCAV_GAME, CORTEX_CURATED],
    relatedCharacterIds: ['character-zeuse'],
    relatedEnvironmentIds: ['environment-dark-arena'],
    relatedFactionIds: ['faction-scavenjers', 'faction-demon-corporation'],
    relatedArtifactIds: ['artifact-zeocard'],
    tags: ['core', 'velient', 'crystal', 'elemental'],
  },
  {
    id: 'artifact-dark-circuit',
    kind: 'artifact',
    title: 'Dark Circuit',
    universeId: 'universe-scavenjer-prime',
    function:
      'High-stakes reward and access framing around Eko utility, without overpromising mechanics.',
    summary:
      'A controlled phrase for competitive or premium reward context that must stay aligned with actual product utility.',
    canonStatus: 'review',
    accent: 'red',
    imageUrl: zaidekThumb,
    aesthetic: 'Dark reward tier, restrained danger, Eko-gated signal, premium access.',
    automationContext:
      'Use only when copy can stay product-accurate around access, rewards, or featured Eko utility.',
    personalityContext:
      'High-stakes, restrained, selective, intense, never vague about actual user action.',
    visualPrompt:
      'Dark premium circuit interface, Eko gate mark, red-cyan warning light, reward signal.',
    sourceRefs: [NOTION_SIMULATION, CORTEX_CURATED],
    relatedCharacterIds: ['character-heaven-trickster'],
    relatedEnvironmentIds: ['environment-ar-drop-zone'],
    relatedFactionIds: ['faction-scavenjers'],
    relatedArtifactIds: ['artifact-eko'],
    tags: ['dark-circuit', 'reward', 'eko', 'access'],
  },
  {
    id: 'artifact-zib-unit',
    kind: 'artifact',
    title: 'ZIB Unit Frame',
    universeId: 'universe-resonance',
    function:
      'Physical companion construct frame for navigation, Drop interpretation, emotional support, and simulation observation.',
    summary:
      'The object-system side of ZIB characters, useful for agent automations and in-world assistant framing.',
    canonStatus: 'stable',
    accent: 'green',
    imageUrl: zibThumb,
    aesthetic: 'Small bot body, screen-face display, techwear shell, Z mark.',
    automationContext:
      'Use as the in-world wrapper when Cortex automations need to speak through a ZIB companion.',
    personalityContext:
      'Supportive, concise, nonviolent, observant, emotionally aware.',
    visualPrompt:
      'Small ZIB companion frame, compact screen-face robot, soft green display, techwear shell.',
    sourceRefs: [NOTION_RESONANCE, CORTEX_CURATED],
    relatedCharacterIds: ['character-zib-unit'],
    relatedEnvironmentIds: ['environment-core-sector'],
    relatedFactionIds: [],
    relatedArtifactIds: ['artifact-drop'],
    tags: ['zib', 'assistant', 'frame', 'automation'],
  },
]

export const SCAVENJER_LORE_ATLAS: CortexLoreAtlas = {
  loreUniverses,
  loreCharacters,
  loreEnvironments,
  loreFactions,
  loreArtifacts,
}

