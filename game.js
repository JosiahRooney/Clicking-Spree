import {
	UNITS, UPGRADES, SKILLS, TIER_REQUIREMENTS, XP_BASE, XP_GROWTH,
	BASE_CRIT_MULTIPLIER, TICK_CRIT_MULTIPLIER, BASE_CAS_CHANCE, HVT, LEVELS,
} from './data.js';

const unitDef = Object.fromEntries(UNITS.map((def) => [def.id, def]));
const upgradeDef = Object.fromEntries(UPGRADES.map((def) => [def.id, def]));
const skillDef = Object.fromEntries(SKILLS.map((def) => [def.id, def]));
export const levelDef = Object.fromEntries(LEVELS.map((def) => [def.id, def]));

const freshState = () => ({
	kills: 0,
	kps: 0,
	xp: 0,
	// Every kill ever earned. Spending never lowers it.
	lifetimeKills: 0,
	map: {
		activeLevel: LEVELS[0].id,
		// Kills earned while each level was active.
		progress: Object.fromEntries(LEVELS.map((def) => [def.id, 0])),
		cleared: Object.fromEntries(LEVELS.map((def) => [def.id, false])),
	},
	activeTab: 'barracks',
	units: Object.fromEntries(UNITS.map((def) => [def.id, 0])),
	upgrades: Object.fromEntries(UPGRADES.map((def) => [def.id, false])),
	skills: Object.fromEntries(SKILLS.map((def) => [def.id, 0])),
	revealed: {
		units: Object.fromEntries(UNITS.map((def) => [def.id, false])),
		upgrades: Object.fromEntries(UPGRADES.map((def) => [def.id, false])),
	},
	// Countdowns in seconds. nextIn is null until the next target has been scheduled.
	hvt: { nextIn: null, activeFor: 0 },
	// Not saved: lets the UI notice a new critical hit.
	attacks: 0,
	lastAttack: { amount: 0, crit: false },
	// Not saved: the running boss fight, or null. Reloading mid-fight is the same as losing it.
	boss: null,
	// Not saved: lets the UI notice a level start and announce it.
	levelStarts: 0,
	lastLevelStart: { levelId: null, defeatedBoss: null },
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

export const stats = (s = state) => ({
	// Upgrades
	clickBonus: s.upgrades.m203 ? 1.20 : s.upgrades.redDot ? 1.05 : 1,
	betterRecruits: s.upgrades.drillInstructors,
	marksmanKps: s.upgrades.emr ? 8.25 : 5,
	closeAirSupport: s.upgrades.closeAirSupport,
	doubleTap: s.upgrades.doubleTap,

	// Assault
	clickMultiplier: 1 + effectTotal(s, 'clickBonus'),
	kpsMultiplier: (def) => 1 + effectTotal(s, 'kpsBonus') + effectTotal(s, 'groupKpsBonus', def.group),
	clickKpsShare: (s.upgrades.doubleTap ? 0.03 : 0) + effectTotal(s, 'clickKpsShare'),
	allKillsMultiplier: 1 + effectTotal(s, 'allKillsBonus'),

	// Intel
	critChance: effectTotal(s, 'critChance'),
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
});

export const unitCost = (def, s = state) => {
	const { unitCostMultiplier, costGrowth } = stats(s);
	return Math.floor(def.baseCost * unitCostMultiplier(def) * costGrowth ** s.units[def.id]);
};

export const upgradeCost = (def, s = state) => Math.floor(def.cost * stats(s).upgradeCostMultiplier);

export const crewNeeded = (def, s = state) => (def.needs ? Math.max(1, def.needs.amount - stats(s).crewReduction) : 0);

// Kills per second for one unit, before the all-kills bonus.
export const unitKps = (def, s = state) => {
	const base = def.id === 'marksman' ? stats(s).marksmanKps : def.kps;
	return base * stats(s).kpsMultiplier(def);
};

// What the player actually earns per second, including the all-kills bonus.
export const displayKps = (s = state) => s.kps * stats(s).allKillsMultiplier;

const hvtBaseReward = (s) => Math.max(HVT.minReward, s.kps * HVT.rewardSeconds) * stats(s).hvtRewardMultiplier;

// What clicking the current target pays, including the all-kills bonus.
export const hvtReward = (s = state) => hvtBaseReward(s) * stats(s).allKillsMultiplier;

export const canBuyUnit = (def, s = state) => {
	const hasCrew = !def.needs || s.units[def.needs.unit] >= crewNeeded(def, s);
	return s.kills >= unitCost(def, s) && hasCrew;
};

export const canBuyUpgrade = (def, s = state) => {
	const index = UPGRADES.indexOf(def);
	const previousBought = index === 0 || s.upgrades[UPGRADES[index - 1].id];
	return !s.upgrades[def.id] && previousBought && s.kills >= upgradeCost(def, s);
};

export const levelAvailable = (id, s = state) => {
	const index = LEVELS.findIndex((def) => def.id === id);
	return index === 0 || s.map.cleared[LEVELS[index - 1].id];
};

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
	damageBoss(earned);
	return earned;
}

function startLevel(id, defeatedBoss = null) {
	state.map.activeLevel = id;
	state.levelStarts += 1;
	state.lastLevelStart = { levelId: id, defeatedBoss };
}

export function selectLevel(id) {
	if (!state.boss && levelAvailable(id) && id !== state.map.activeLevel) {
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
	state.map.cleared[id] = true;
	const next = LEVELS[LEVELS.findIndex((def) => def.id === id) + 1];
	if (next) {
		startLevel(next.id, levelDef[id].boss.name);
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

// Losing costs nothing: the fight just ends and the boss can be fought again.
function updateBoss() {
	if (!state.boss) {
		return;
	}
	state.boss.timeLeft -= 1;
	if (state.boss.timeLeft <= 0) {
		state.boss = null;
	}
}

export function attack() {
	const { clickBonus, clickMultiplier, clickKpsShare, critChance, critMultiplier } = stats();
	const amount = clickBonus * clickMultiplier + state.kps * clickKpsShare;
	const crit = critChance > 0 && Math.random() < critChance;
	state.attacks += 1;
	state.lastAttack = { amount: earn(crit ? amount * critMultiplier : amount), crit };
}

export function buyUnit(id) {
	const def = unitDef[id];
	if (!canBuyUnit(def)) {
		return;
	}
	const crew = crewNeeded(def);
	state.kills -= unitCost(def);
	state.units[id] += 1;
	if (def.needs) {
		state.units[def.needs.unit] -= crew;
	}
}

export function buyUpgrade(id) {
	const def = upgradeDef[id];
	if (!canBuyUpgrade(def)) {
		return;
	}
	state.kills -= upgradeCost(def);
	state.upgrades[id] = true;
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
const rollRecruit = (betterRecruits) => (betterRecruits ? Math.floor(Math.random() * 3) + 1 : Math.random());

const rollRecruitKills = () => {
	const { betterRecruits, recruitRolls } = stats();
	let total = 0;
	for (let i = 0; i < state.units.recruit; i++) {
		let best = 0;
		for (let roll = 0; roll < recruitRolls; roll++) {
			best = Math.max(best, rollRecruit(betterRecruits));
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

export function closeAirSupportTick() {
	const { closeAirSupport, casChance } = stats();
	if (closeAirSupport && Math.random() < casChance) {
		earn(100000);
	}
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
	for (const def of UPGRADES) {
		if (def.reveal === 0 || s.kills > def.reveal || s.upgrades[def.id]) {
			s.revealed.upgrades[def.id] = true;
		}
	}
}



// ======== Save / Load ========

export const serialize = (s = state) => JSON.stringify({
	kills: s.kills,
	xp: s.xp,
	units: s.units,
	upgrades: s.upgrades,
	skills: s.skills,
	revealed: s.revealed,
	hvt: s.hvt,
	lifetimeKills: s.lifetimeKills,
	map: s.map,
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

	const savedUpgrade = (def, index) => (Array.isArray(save.upgrades) ? save.upgrades[index] : save.upgrades?.[def.id]) === true;
	const fresh = freshState();

	fresh.kills = Number(save.kills) || 0;
	fresh.xp = Number(save.xp) || 0;
	for (const def of UNITS) {
		fresh.units[def.id] = Number(save.units?.[def.id]) || 0;
		fresh.revealed.units[def.id] = save.revealed?.units?.[def.id] === true;
	}
	UPGRADES.forEach((def, index) => {
		fresh.upgrades[def.id] = savedUpgrade(def, index);
		fresh.revealed.upgrades[def.id] = save.revealed?.upgrades?.[def.id] === true;
	});
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
	for (const def of LEVELS) {
		fresh.map.progress[def.id] = Math.max(0, Number(save.map?.progress?.[def.id]) || 0);
		fresh.map.cleared[def.id] = save.map?.cleared?.[def.id] === true;
	}
	const savedLevel = save.map?.activeLevel;
	if (levelDef[savedLevel] && levelAvailable(savedLevel, fresh)) {
		fresh.map.activeLevel = savedLevel;
	}
	updateReveals(fresh);

	Object.assign(s, fresh, {
		activeTab: s.activeTab,
		attacks: s.attacks,
		lastAttack: s.lastAttack,
		levelStarts: s.levelStarts,
		lastLevelStart: s.lastLevelStart,
	});
	return true;
}
