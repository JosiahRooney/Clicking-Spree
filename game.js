import { UNITS, UPGRADES } from './data.js';

const unitDef = Object.fromEntries(UNITS.map((def) => [def.id, def]));
const upgradeDef = Object.fromEntries(UPGRADES.map((def) => [def.id, def]));

const freshState = () => ({
	kills: 0,
	kps: 0,
	activeTab: 'barracks',
	units: Object.fromEntries(UNITS.map((def) => [def.id, 0])),
	upgrades: Object.fromEntries(UPGRADES.map((def) => [def.id, false])),
	revealed: {
		units: Object.fromEntries(UNITS.map((def) => [def.id, false])),
		upgrades: Object.fromEntries(UPGRADES.map((def) => [def.id, false])),
	},
});

// Other modules hold a reference to this object, so it is only ever mutated, never reassigned.
export const state = freshState();



// ======== Derived values ========

export const stats = (s = state) => ({
	clickBonus: s.upgrades.m203 ? 1.20 : s.upgrades.redDot ? 1.05 : 1,
	betterRecruits: s.upgrades.drillInstructors,
	marksmanKps: s.upgrades.emr ? 8.25 : 5,
	closeAirSupport: s.upgrades.closeAirSupport,
	doubleTap: s.upgrades.doubleTap,
});

export const unitCost = (def, s = state) => Math.floor(def.baseCost * 1.1 ** s.units[def.id]);

export const unitKps = (def, s = state) => (def.id === 'marksman' ? stats(s).marksmanKps : def.kps);

export const canBuyUnit = (def, s = state) => {
	const hasCrew = !def.needs || s.units[def.needs.unit] >= def.needs.amount;
	return s.kills >= unitCost(def, s) && hasCrew;
};

export const canBuyUpgrade = (def, s = state) => {
	const index = UPGRADES.indexOf(def);
	const previousBought = index === 0 || s.upgrades[UPGRADES[index - 1].id];
	return !s.upgrades[def.id] && previousBought && s.kills >= def.cost;
};



// ======== Actions ========

export function attack() {
	const { clickBonus, doubleTap } = stats();
	state.kills += clickBonus + (doubleTap ? state.kps * 0.03 : 0);
}

export function buyUnit(id) {
	const def = unitDef[id];
	if (!canBuyUnit(def)) {
		return;
	}
	state.kills -= unitCost(def);
	state.units[id] += 1;
	if (def.needs) {
		state.units[def.needs.unit] -= def.needs.amount;
	}
}

export function buyUpgrade(id) {
	const def = upgradeDef[id];
	if (!canBuyUpgrade(def)) {
		return;
	}
	state.kills -= def.cost;
	state.upgrades[id] = true;
}

export function setTab(tab) {
	state.activeTab = tab;
}

// Each recruit rolls separately: 0 - 1 kills, or 1 - 3 with Better Drill Instructors
const rollRecruit = (betterRecruits) => (betterRecruits ? Math.floor(Math.random() * 3) + 1 : Math.random());

const rollRecruitKills = () => {
	const { betterRecruits } = stats();
	let total = 0;
	for (let i = 0; i < state.units.recruit; i++) {
		total += rollRecruit(betterRecruits);
	}
	return total;
};

export function tick() {
	const unitKills = UNITS.reduce((sum, def) => sum + state.units[def.id] * unitKps(def), 0);
	state.kps = rollRecruitKills() + unitKills;
	state.kills += state.kps;
}

export function closeAirSupportTick() {
	if (stats().closeAirSupport && Math.random() < 0.5) {
		state.kills += 100000;
	}
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
	units: s.units,
	upgrades: s.upgrades,
	revealed: s.revealed,
});

// Returns false (leaving state untouched) if json is missing or invalid.
// Accepts the older format where upgrades was an array of booleans in chain order.
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
	for (const def of UNITS) {
		fresh.units[def.id] = Number(save.units?.[def.id]) || 0;
		fresh.revealed.units[def.id] = save.revealed?.units?.[def.id] === true;
	}
	UPGRADES.forEach((def, index) => {
		fresh.upgrades[def.id] = savedUpgrade(def, index);
		fresh.revealed.upgrades[def.id] = save.revealed?.upgrades?.[def.id] === true;
	});
	updateReveals(fresh);

	Object.assign(s, fresh, { activeTab: s.activeTab });
	return true;
}
