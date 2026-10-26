import {
	UNITS, ATTACHMENTS, WEAPON_SLOTS, SKILLS, TIER_REQUIREMENTS, XP_BASE, XP_GROWTH,
	BASE_CRIT_MULTIPLIER, TICK_CRIT_MULTIPLIER, BASE_CAS_CHANCE, HVT, LEVELS,
	BASE_ATTACK_COOLDOWN, BASE_MAG_ROUNDS, BASE_RELOAD_SECONDS, BOSS_RETREAT_PENALTY, REPEAT_CLEAR_SHARE,
	BUILDINGS, BUILDING_COST_GROWTH, BUILDING_SPEEDUP,
} from './data.js';

const unitDef = Object.fromEntries(UNITS.map((def) => [def.id, def]));
const attachmentDef = Object.fromEntries(ATTACHMENTS.map((def) => [def.id, def]));
const starterForSlot = Object.fromEntries(ATTACHMENTS.filter((def) => def.starter).map((def) => [def.slot, def.id]));
const skillDef = Object.fromEntries(SKILLS.map((def) => [def.id, def]));
const buildingDef = Object.fromEntries(BUILDINGS.map((def) => [def.id, def]));
export const levelDef = Object.fromEntries(LEVELS.map((def) => [def.id, def]));

const freshState = () => ({
	kills: 0,
	kps: 0,
	xp: 0,
	// Every kill ever earned. Spending never lowers it.
	lifetimeKills: 0,
	supplies: 0,
	map: {
		activeLevel: LEVELS[0].id,
		// Kills earned while each level was active.
		progress: Object.fromEntries(LEVELS.map((def) => [def.id, 0])),
		cleared: Object.fromEntries(LEVELS.map((def) => [def.id, false])),
	},
	activeTab: 'units',
	units: Object.fromEntries(UNITS.map((def) => [def.id, 0])),
	// How many of each unit were paid for with kills. Price grows from this, not from units on hand,
	// so troops produced by buildings (or spent as crew) don't change the cost.
	bought: Object.fromEntries(UNITS.map((def) => [def.id, 0])),
	buildings: Object.fromEntries(BUILDINGS.map((def) => [def.id, 0])),
	// Fraction of the next unit each building type has produced (always below 1).
	buildingProgress: Object.fromEntries(BUILDINGS.map((def) => [def.id, 0])),
	// owned: paid for and kept forever. equipped: one id per slot. Barrel, magazine, sight, and stock start with a plain part.
	weapon: {
		owned: Object.fromEntries(ATTACHMENTS.map((def) => [def.id, Boolean(def.starter)])),
		equipped: Object.fromEntries(WEAPON_SLOTS.map((slot) => [slot.id, starterForSlot[slot.id] ?? null])),
		// Unlocked attachments the player has already looked at. The rest badge their slot.
		seen: Object.fromEntries(ATTACHMENTS.map((def) => [def.id, Boolean(def.starter)])),
	},
	skills: Object.fromEntries(SKILLS.map((def) => [def.id, 0])),
	revealed: {
		units: Object.fromEntries(UNITS.map((def) => [def.id, false])),
		attachments: Object.fromEntries(ATTACHMENTS.map((def) => [def.id, Boolean(def.starter)])),
	},
	// Countdowns in seconds. nextIn is null until the next target has been scheduled.
	hvt: { nextIn: null, activeFor: 0 },
	// Rounds left in the magazine. A reload refills it to the current capacity.
	ammo: BASE_MAG_ROUNDS,
	// Not saved: earliest time the Attack button can fire again, and when a reload finishes.
	nextAttackAt: 0,
	reloadUntil: 0,
	// Not saved: lets the UI notice a new critical hit.
	attacks: 0,
	lastAttack: { amount: 0, crit: false },
	// Not saved: the running boss fight, or null. Reloading mid-fight is the same as losing it.
	boss: null,
	// Not saved: lets the UI notice a level start and announce it.
	levelStarts: 0,
	lastLevelStart: { levelId: null, defeatedBoss: null, supplies: 0 },
	// Not saved: running totals of repeat clears, so the UI can batch them into one message.
	repeatClears: { count: 0, supplies: 0 },
	// Not saved: lets the UI notice a lost boss fight and announce the retreat.
	bossLosses: 0,
	lastBossLoss: { bossName: null, killsLost: 0 },
});

// Other modules hold a reference to this object, so it is only ever mutated, never reassigned.
export const state = freshState();



// ======== Experience and levels ========

export const xpToNext = (level) => Math.floor(XP_BASE * XP_GROWTH ** (level - 1));

export const xpProgress = (s = state) => {
	let level = 1;
	let into = s.xp;
	while (into >= xpToNext(level) && level < 1000) {
		into -= xpToNext(level);
		level += 1;
	}
	return { level, into, needed: xpToNext(level) };
};

export const levelFromXp = (xp) => xpProgress({ xp }).level;

const pointsSpent = (s, branch) => SKILLS
	.filter((def) => branch === undefined || def.branch === branch)
	.reduce((sum, def) => sum + s.skills[def.id], 0);

export const branchPoints = (s, branch) => pointsSpent(s, branch);

export const skillPoints = (s = state) => levelFromXp(s.xp) - 1 - pointsSpent(s);

export const tierRequirement = (tier) => TIER_REQUIREMENTS[tier - 1];

export const tierUnlocked = (def, s = state) => branchPoints(s, def.branch) >= tierRequirement(def.tier);

export const canBuySkill = (def, s = state) => skillPoints(s) > 0
	&& s.skills[def.id] < def.maxRank
	&& tierUnlocked(def, s)
	&& (!def.requires || s.skills[def.requires] > 0);



// ======== Derived values ========

const matchingSkills = (s, type, group) => SKILLS.filter((def) => s.skills[def.id] > 0
	&& def.effect.type === type
	&& (group === undefined || def.effect.group === group));

// Percentage bonuses add up.
const effectTotal = (s, type, group) => matchingSkills(s, type, group)
	.reduce((sum, def) => sum + def.effect.amount * s.skills[def.id], 0);

// Discounts multiply, so stacking them can never take a price to zero.
const discountFactor = (s, type, group) => matchingSkills(s, type, group)
	.reduce((factor, def) => factor * (1 - def.effect.amount * s.skills[def.id]), 1);

const equippedAttachments = (s) => WEAPON_SLOTS
	.map((slot) => attachmentDef[s.weapon.equipped[slot.id]])
	.filter(Boolean);

const effectSum = (s, type) => equippedAttachments(s)
	.filter((def) => def.effect.type === type)
	.reduce((sum, def) => sum + def.effect.amount, 0);

export const stats = (s = state) => ({
	// Weapon. clickBonus starts at 1 kill per click; attachments add to it.
	clickBonus: 1 + effectSum(s, 'click'),

	// Assault
	clickMultiplier: 1 + effectTotal(s, 'clickBonus'),
	kpsMultiplier: (def) => 1 + effectTotal(s, 'kpsBonus') + effectTotal(s, 'groupKpsBonus', def.group),
	clickKpsShare: effectTotal(s, 'clickKpsShare'),
	allKillsMultiplier: 1 + effectTotal(s, 'allKillsBonus'),

	// Intel. Accessory and sight crit is added on top of skill crit.
	critChance: effectTotal(s, 'critChance') + effectSum(s, 'crit'),
	critMultiplier: BASE_CRIT_MULTIPLIER + effectTotal(s, 'critMultiplier'),
	recruitRolls: 1 + effectTotal(s, 'recruitRolls'),
	casChance: BASE_CAS_CHANCE + effectTotal(s, 'casChance'),
	hvtUnlocked: effectTotal(s, 'hvtUnlock') > 0,
	hvtFrequency: 1 + HVT.analysisFrequency * effectTotal(s, 'hvtAnalysis'),
	hvtRewardMultiplier: 1 + HVT.analysisReward * effectTotal(s, 'hvtAnalysis'),
	tickCritChance: effectTotal(s, 'tickCritChance'),

	// Logistics
	unitCostMultiplier: (def) => discountFactor(s, 'unitDiscount') * discountFactor(s, 'groupDiscount', def.group),
	upgradeCostMultiplier: discountFactor(s, 'upgradeDiscount'),
	costGrowth: 1.1 - effectTotal(s, 'costGrowthReduction'),
	crewReduction: effectTotal(s, 'crewReduction'),
	// Raises supplies per second from logistics units. Upgrades can add to this later.
	supplyMultiplier: 1,
});

export const unitCost = (def, s = state) => {
	const { unitCostMultiplier, costGrowth } = stats(s);
	return Math.floor(def.baseCost * unitCostMultiplier(def) * costGrowth ** s.bought[def.id]);
};

export const attachmentCost = (def, s = state) => Math.floor(def.cost * stats(s).upgradeCostMultiplier);

export const crewNeeded = (def, s = state) => (def.needs ? Math.max(1, def.needs.amount - stats(s).crewReduction) : 0);

// Kills per second for one unit, before the all-kills bonus.
export const unitKps = (def, s = state) => def.kps * stats(s).kpsMultiplier(def);

// Seconds between attacks. Barrel attachments multiply this (lower is faster).
export const attackCooldown = (s = state) => BASE_ATTACK_COOLDOWN * equippedAttachments(s)
	.filter((def) => def.effect.type === 'speed')
	.reduce((factor, def) => factor * def.effect.amount, 1);

const equippedMagazine = (s) => equippedAttachments(s).find((def) => def.effect.type === 'magazine');

export const magazineRounds = (s = state) => equippedMagazine(s)?.effect.rounds ?? BASE_MAG_ROUNDS;

export const reloadSeconds = (s = state) => BASE_RELOAD_SECONDS * (equippedMagazine(s)?.effect.reload ?? 1);

// A finished reload refills the mag. Called from the attack loop and the UI timer.
export function finishReload(s = state) {
	if (s.ammo <= 0 && s.reloadUntil > 0 && Date.now() >= s.reloadUntil) {
		s.ammo = magazineRounds(s);
		s.reloadUntil = 0;
	}
}

// A larger magazine fills immediately. A smaller one drops extra rounds. A reload in progress is left alone.
const syncAmmo = (previousCapacity, s = state) => {
	if (s.reloadUntil > Date.now()) return;
	const capacity = magazineRounds(s);
	s.ammo = capacity > previousCapacity ? capacity : Math.min(s.ammo, capacity);
};

// Supplies per second from one unit. Combat units have no sps, so they add nothing.
export const unitSps = (def, s = state) => (def.sps ?? 0) * stats(s).supplyMultiplier;

export const supplyPerSecond = (s = state) => UNITS.reduce((sum, def) => sum + s.units[def.id] * unitSps(def, s), 0);

// What the player actually earns per second, including the all-kills bonus.
export const displayKps = (s = state) => s.kps * stats(s).allKillsMultiplier;

// The average of each recruit's best roll, so power doesn't jump around with the dice.
const expectedRecruitRoll = (s) => {
	const { recruitRolls: rolls } = stats(s);
	return rolls / (rolls + 1);
};

const expectedKps = (s) => UNITS.reduce((sum, def) => sum
	+ s.units[def.id] * (def.id === 'recruit' ? expectedRecruitRoll(s) * stats(s).kpsMultiplier(def) : unitKps(def, s)), 0);

// Expected kills per second in a fight: troops and clicking at the rifle's real fire rate, crits included.
// Directly comparable to bossPower: at least equal power should win in time.
export const playerPower = (s = state) => {
	const {
		clickBonus, clickMultiplier, clickKpsShare, critChance, critMultiplier,
		tickCritChance, allKillsMultiplier,
	} = stats(s);
	const kps = expectedKps(s);
	const troops = kps * (1 + tickCritChance * (TICK_CRIT_MULTIPLIER - 1));
	const click = (clickBonus * clickMultiplier + kps * clickKpsShare) * (1 + critChance * (critMultiplier - 1));
	const cooldown = attackCooldown(s);
	const rounds = magazineRounds(s);
	// Sustained fire rate, with the reload pause counted in.
	const shotsPerSecond = rounds / (rounds * cooldown + reloadSeconds(s));
	return (troops + click * shotsPerSecond) * allKillsMultiplier;
};

export const bossPower = (def) => def.boss.hp / def.boss.seconds;

const hvtBaseReward = (s) => Math.max(HVT.minReward, s.kps * HVT.rewardSeconds) * stats(s).hvtRewardMultiplier;

// What clicking the current target pays, including the all-kills bonus.
export const hvtReward = (s = state) => hvtBaseReward(s) * stats(s).allKillsMultiplier;

export const canBuyUnit = (def, s = state) => {
	const hasCrew = !def.needs || s.units[def.needs.unit] >= crewNeeded(def, s);
	return s.kills >= unitCost(def, s) && hasCrew;
};

export const canBuyAttachment = (def, s = state) => s.revealed.attachments[def.id]
	&& !s.weapon.owned[def.id]
	&& s.kills >= attachmentCost(def, s);

export const levelAvailable = (id, s = state) => {
	const index = LEVELS.findIndex((def) => def.id === id);
	return index === 0 || s.map.cleared[LEVELS[index - 1].id];
};

// ======== Buildings ========

export const buildingCost = (def, s = state) => Math.floor(def.baseCost * BUILDING_COST_GROWTH ** s.buildings[def.id]);

// A building shows up once the unit it produces has been revealed.
export const buildingRevealed = (def, s = state) => s.revealed.units[def.unit];

export const canBuyBuilding = (def, s = state) => buildingRevealed(def, s) && s.supplies >= buildingCost(def, s);

// Units per second from all buildings of this type: each one after the first adds BUILDING_SPEEDUP of the base rate.
export const buildingRate = (def, s = state) => {
	const count = s.buildings[def.id];
	return count === 0 ? 0 : (1 + BUILDING_SPEEDUP * (count - 1)) / def.seconds;
};

export const repeatClearSupplies = (def) => def.supplies * REPEAT_CLEAR_SHARE;

export const levelBeat = (id, s = state) => s.map.progress[id] >= levelDef[id].killsRequired;

// Cleared levels never fight again, so a boss can only be defeated once per level.
export const canFightBoss = (id, s = state) => !s.boss
	&& levelAvailable(id, s) && levelBeat(id, s) && !s.map.cleared[id];



// ======== Actions ========

// Every kill gained goes through here, so kills and XP always move together.
function earn(amount) {
	const earned = amount * stats().allKillsMultiplier;
	state.kills += earned;
	state.xp += earned;
	state.lifetimeKills += earned;
	state.map.progress[state.map.activeLevel] += earned;
	repeatClears();
	damageBoss(earned);
	return earned;
}

// A cleared level has no boss: every full killsRequired clears it again for a share of its supplies.
// Done in one step so a huge tick on a small level doesn't loop.
function repeatClears() {
	const def = levelDef[state.map.activeLevel];
	if (!state.map.cleared[def.id]) {
		return;
	}
	const clears = Math.floor(state.map.progress[def.id] / def.killsRequired);
	if (clears === 0) {
		return;
	}
	const supplies = clears * repeatClearSupplies(def);
	state.map.progress[def.id] -= clears * def.killsRequired;
	state.supplies += supplies;
	state.repeatClears.count += clears;
	state.repeatClears.supplies += supplies;
}

function startLevel(id, defeatedBoss = null, supplies = 0) {
	state.map.activeLevel = id;
	state.levelStarts += 1;
	state.lastLevelStart = { levelId: id, defeatedBoss, supplies };
}

export function selectLevel(id) {
	if (!state.boss && levelAvailable(id) && id !== state.map.activeLevel) {
		// Cleared levels count from zero on every visit; the front line keeps its progress.
		if (state.map.cleared[id]) {
			state.map.progress[id] = 0;
		}
		startLevel(id);
	}
}

export function startBoss(id) {
	if (!canFightBoss(id)) {
		return;
	}
	const { hp, seconds } = levelDef[id].boss;
	state.boss = { levelId: id, hp, maxHp: hp, timeLeft: seconds };
}

function winBoss() {
	const id = state.boss.levelId;
	state.boss = null;
	// The only place cleared flips to true, and it happens once per level:
	// one-time clear rewards belong here, never in selectLevel or on later visits.
	// Bosses only exist on the front line, so a win always moves the player forward.
	const def = levelDef[id];
	state.map.cleared[id] = true;
	state.map.progress[id] = 0;
	state.supplies += def.supplies;
	const next = LEVELS[LEVELS.indexOf(def) + 1];
	if (next) {
		startLevel(next.id, def.boss.name, def.supplies);
	} else {
		state.levelStarts += 1;
		state.lastLevelStart = { levelId: id, defeatedBoss: def.boss.name, supplies: def.supplies };
	}
}

function damageBoss(amount) {
	if (!state.boss) {
		return;
	}
	state.boss.hp -= amount;
	if (state.boss.hp <= 0) {
		winBoss();
	}
}

// Losing costs a share of spendable kills only; XP, lifetime kills and level progress are kept,
// so the boss can be fought again right away.
function loseBoss() {
	const killsLost = state.kills * BOSS_RETREAT_PENALTY;
	state.kills -= killsLost;
	state.bossLosses += 1;
	state.lastBossLoss = { bossName: levelDef[state.boss.levelId].boss.name, killsLost };
	state.boss = null;
}

function updateBoss() {
	if (!state.boss) {
		return;
	}
	state.boss.timeLeft -= 1;
	if (state.boss.timeLeft <= 0) {
		loseBoss();
	}
}

export function attack() {
	const now = Date.now();
	if (now < state.nextAttackAt || now < state.reloadUntil) {
		return;
	}
	finishReload();
	if (state.ammo <= 0) {
		state.reloadUntil = now + reloadSeconds() * 1000;
		return;
	}
	const { clickBonus, clickMultiplier, clickKpsShare, critChance, critMultiplier } = stats();
	const amount = clickBonus * clickMultiplier + state.kps * clickKpsShare;
	const crit = critChance > 0 && Math.random() < critChance;
	state.attacks += 1;
	state.ammo -= 1;
	state.lastAttack = { amount: earn(crit ? amount * critMultiplier : amount), crit };
	state.nextAttackAt = now + attackCooldown() * 1000;
	if (state.ammo <= 0) {
		state.reloadUntil = now + reloadSeconds() * 1000;
	}
}

export function buyUnit(id) {
	const def = unitDef[id];
	if (!canBuyUnit(def)) {
		return;
	}
	const crew = crewNeeded(def);
	state.kills -= unitCost(def);
	state.units[id] += 1;
	state.bought[id] += 1;
	if (def.needs) {
		state.units[def.needs.unit] -= crew;
	}
}

export function buyBuilding(id) {
	const def = buildingDef[id];
	if (!canBuyBuilding(def)) {
		return;
	}
	state.supplies -= buildingCost(def);
	state.buildings[id] += 1;
}

// Produced units are free: no kills and no crew. Leftover progress carries into the next second.
function produceUnits() {
	for (const def of BUILDINGS) {
		const progress = state.buildingProgress[def.id] + buildingRate(def);
		// The epsilon stops float error (e.g. 3 x 1/3 = 0.9999...) from delaying a unit by a second.
		const made = Math.floor(progress + 1e-9);
		state.buildingProgress[def.id] = Math.max(0, progress - made);
		state.units[def.unit] += made;
	}
}

export function buyAttachment(id) {
	const def = attachmentDef[id];
	if (!def || def.starter || !canBuyAttachment(def)) {
		return;
	}
	state.kills -= attachmentCost(def);
	state.weapon.owned[id] = true;
	equipAttachment(id);
}

export function equipAttachment(id) {
	const def = attachmentDef[id];
	if (def && state.weapon.owned[id]) {
		const previous = magazineRounds();
		state.weapon.equipped[def.slot] = id;
		syncAmmo(previous);
	}
}

// Revealed attachments in this slot that the player has not opened yet.
export const unseenAttachments = (slot, s = state) => ATTACHMENTS.filter((def) => def.slot === slot
	&& !def.starter
	&& s.revealed.attachments[def.id]
	&& !s.weapon.owned[def.id]
	&& !s.weapon.seen[def.id]).length;

export function noticeAttachments(slot, s = state) {
	for (const def of ATTACHMENTS) {
		if (def.slot === slot && s.revealed.attachments[def.id]) s.weapon.seen[def.id] = true;
	}
}

export function clearAttachment(slot) {
	if (slot in state.weapon.equipped) {
		const previous = magazineRounds();
		state.weapon.equipped[slot] = starterForSlot[slot] ?? null;
		syncAmmo(previous);
	}
}

export function buySkill(id) {
	const def = skillDef[id];
	if (canBuySkill(def)) {
		state.skills[id] += 1;
	}
}

export function resetGame() {
	Object.assign(state, freshState());
}

export function resetSkills() {
	for (const def of SKILLS) {
		state.skills[def.id] = 0;
	}
}

export function setTab(tab) {
	state.activeTab = tab;
}

// Each recruit rolls separately (0 - 1, or 1 - 3 with Better Drill Instructors) and keeps its best roll.
const rollRecruitKills = () => {
	const { recruitRolls } = stats();
	let total = 0;
	for (let i = 0; i < state.units.recruit; i++) {
		let best = 0;
		for (let roll = 0; roll < recruitRolls; roll++) {
			best = Math.max(best, Math.random());
		}
		total += best;
	}
	return total;
};

const rollHvtInterval = () => {
	const seconds = HVT.minInterval + Math.random() * (HVT.maxInterval - HVT.minInterval);
	return Math.round(seconds / stats().hvtFrequency);
};

function updateHvt() {
	if (!stats().hvtUnlocked) {
		return;
	}
	if (state.hvt.activeFor > 0) {
		state.hvt.activeFor -= 1;
		return;
	}
	state.hvt.nextIn ??= rollHvtInterval();
	state.hvt.nextIn -= 1;
	if (state.hvt.nextIn <= 0) {
		state.hvt.activeFor = HVT.duration;
		state.hvt.nextIn = null;
	}
}

export function tick() {
	finishReload();
	produceUnits();
	// Logistics trucks pay supplies directly. This is not a kill, so it skips earn().
	state.supplies += supplyPerSecond();
	const { kpsMultiplier, tickCritChance } = stats();
	const recruitKills = rollRecruitKills() * kpsMultiplier(unitDef.recruit);
	const unitKills = UNITS.reduce((sum, def) => sum + state.units[def.id] * unitKps(def), 0);
	state.kps = recruitKills + unitKills;

	const crit = tickCritChance > 0 && Math.random() < tickCritChance;
	earn(crit ? state.kps * TICK_CRIT_MULTIPLIER : state.kps);
	updateHvt();
	// After earn(), so the last second of KPS lands before time runs out.
	updateBoss();
}

export function clickHvt() {
	if (state.hvt.activeFor <= 0) {
		return;
	}
	earn(hvtBaseReward(state));
	state.hvt.activeFor = 0;
	state.hvt.nextIn = null;
}

// Reveals are sticky: once shown, a card stays visible even if kills drop.
export function updateReveals(s = state) {
	for (const def of UNITS) {
		if (def.reveal === 0 || s.kills > def.reveal || s.units[def.id] > 0) {
			s.revealed.units[def.id] = true;
		}
	}
	for (const def of ATTACHMENTS) {
		if (def.reveal === 0 || s.kills > def.reveal || s.weapon.owned[def.id]) {
			s.revealed.attachments[def.id] = true;
		}
	}
}



// ======== Save / Load ========

export const serialize = (s = state) => JSON.stringify({
	kills: s.kills,
	xp: s.xp,
	units: s.units,
	bought: s.bought,
	weapon: s.weapon,
	ammo: s.ammo,
	skills: s.skills,
	revealed: s.revealed,
	hvt: s.hvt,
	lifetimeKills: s.lifetimeKills,
	map: s.map,
	supplies: s.supplies,
	buildings: s.buildings,
	buildingProgress: s.buildingProgress,
});

const clampRank = (value, def) => Math.min(def.maxRank, Math.max(0, Math.floor(Number(value) || 0)));

// Returns false (leaving state untouched) if json is missing or invalid.
// Accepts older saves: upgrades as an array of booleans in chain order, and no xp/skills/hvt/map.
export function deserialize(json, s = state) {
	let save;
	try {
		save = JSON.parse(json);
	} catch {
		return false;
	}
	if (!save || typeof save !== 'object') {
		return false;
	}

	// Old upgrades were a boolean chain. Index 0 was Red Dot, index 1 was the M203.
	const legacyUpgrade = (id, index) => (Array.isArray(save.upgrades) ? save.upgrades[index] : save.upgrades?.[id]) === true;
	const fresh = freshState();

	fresh.kills = Number(save.kills) || 0;
	fresh.xp = Number(save.xp) || 0;
	// Saves from before purchases were tracked separately: every unit on hand was bought.
	const hasBought = save.bought && typeof save.bought === 'object';
	for (const def of UNITS) {
		fresh.units[def.id] = Number(save.units?.[def.id]) || 0;
		fresh.bought[def.id] = hasBought ? Math.max(0, Math.floor(Number(save.bought[def.id]) || 0)) : fresh.units[def.id];
		fresh.revealed.units[def.id] = save.revealed?.units?.[def.id] === true;
	}
	if (save.weapon && typeof save.weapon === 'object') {
		for (const def of ATTACHMENTS) {
			fresh.weapon.owned[def.id] = save.weapon.owned?.[def.id] === true;
			fresh.revealed.attachments[def.id] = save.revealed?.attachments?.[def.id] === true;
		}
		for (const slot of WEAPON_SLOTS) {
			const id = save.weapon.equipped?.[slot.id];
			const def = attachmentDef[id];
			fresh.weapon.equipped[slot.id] = def && def.slot === slot.id && fresh.weapon.owned[def.id] ? def.id : null;
		}
	} else {
		if (legacyUpgrade('redDot', 0)) {
			fresh.weapon.owned.redDot = true;
			fresh.weapon.equipped.sight = 'redDot';
		}
		if (legacyUpgrade('m203', 1)) {
			fresh.weapon.owned.grenadeLauncher = true;
			fresh.weapon.equipped.underbarrel = 'grenadeLauncher';
		}
	}
	for (const def of ATTACHMENTS) {
		if (!def.starter) continue;
		fresh.weapon.owned[def.id] = true;
		fresh.revealed.attachments[def.id] = true;
		if (!fresh.weapon.equipped[def.slot]) fresh.weapon.equipped[def.slot] = def.id;
	}
	for (const def of SKILLS) {
		fresh.skills[def.id] = clampRank(save.skills?.[def.id], def);
	}
	if (skillPoints(fresh) < 0) {
		for (const def of SKILLS) {
			fresh.skills[def.id] = 0;
		}
	}
	fresh.hvt.activeFor = Number(save.hvt?.activeFor) || 0;
	fresh.hvt.nextIn = Number.isFinite(save.hvt?.nextIn) ? save.hvt.nextIn : null;
	// Saves before 1.5 have no lifetime count, but xp has always matched every kill earned.
	fresh.lifetimeKills = Number(save.lifetimeKills) || fresh.xp || fresh.kills;
	// Saves before 1.7 have no supplies: pay out first clears already earned, and drop the full
	// progress bars cleared levels used to keep so they don't count as instant repeat clears.
	const hasSupplies = Number.isFinite(save.supplies);
	fresh.supplies = hasSupplies ? Math.max(0, save.supplies) : 0;
	for (const def of LEVELS) {
		fresh.map.progress[def.id] = Math.max(0, Number(save.map?.progress?.[def.id]) || 0);
		fresh.map.cleared[def.id] = save.map?.cleared?.[def.id] === true;
		if (!hasSupplies && fresh.map.cleared[def.id]) {
			fresh.map.progress[def.id] = 0;
			fresh.supplies += def.supplies;
		}
	}
	for (const def of BUILDINGS) {
		fresh.buildings[def.id] = Math.max(0, Math.floor(Number(save.buildings?.[def.id]) || 0));
		const progress = Number(save.buildingProgress?.[def.id]) || 0;
		fresh.buildingProgress[def.id] = Math.min(Math.max(progress, 0), 0.999);
	}
	const savedLevel = save.map?.activeLevel;
	if (levelDef[savedLevel] && levelAvailable(savedLevel, fresh)) {
		fresh.map.activeLevel = savedLevel;
	}
	updateReveals(fresh);
	// Saves from before slots were badged already showed every unlocked attachment.
	const hasSeen = save.weapon?.seen && typeof save.weapon.seen === 'object';
	for (const def of ATTACHMENTS) {
		if (def.starter || fresh.weapon.owned[def.id]) {
			fresh.weapon.seen[def.id] = true;
		} else if (hasSeen) {
			fresh.weapon.seen[def.id] = save.weapon.seen[def.id] === true;
		} else {
			fresh.weapon.seen[def.id] = fresh.revealed.attachments[def.id] === true;
		}
	}
	const capacity = magazineRounds(fresh);
	const savedAmmo = Number(save.ammo);
	fresh.ammo = Number.isFinite(savedAmmo) ? Math.min(capacity, Math.max(0, Math.floor(savedAmmo))) : capacity;
	// A reload in progress is not saved, so an empty mag comes back full.
	if (fresh.ammo === 0) fresh.ammo = capacity;

	Object.assign(s, fresh, {
		activeTab: s.activeTab,
		attacks: s.attacks,
		lastAttack: s.lastAttack,
		levelStarts: s.levelStarts,
		lastLevelStart: s.lastLevelStart,
		bossLosses: s.bossLosses,
		lastBossLoss: s.lastBossLoss,
		repeatClears: s.repeatClears,
	});
	return true;
}
