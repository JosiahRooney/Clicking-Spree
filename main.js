// ======== Game State ========

const game = {
	kills: 0,
	kps: 0,
	clickBonus: 1,
	betterRecruits: false,
	doubleTap: false,
};

// needs: units consumed on purchase. reveal: kills needed before the unit is shown.
const units = {
	recruit:  { baseCost: 50,        kps: 0,       count: 0, needs: null,                            reveal: 0,        li: '.boot',     button: '.buyRecruit',  countId: 'boots', costId: 'bootCost' },
	marksman: { baseCost: 350,       kps: 5,       count: 0, needs: { unit: 'recruit',  amount: 1 }, reveal: 74,       li: '.marksman', button: '.buyMarksman', countId: 'mm',    costId: 'mmCost' },
	crewWpn:  { baseCost: 3750,      kps: 25,      count: 0, needs: { unit: 'recruit',  amount: 3 }, reveal: 450,      li: '.cwpn',     button: '.buyCrewWpn',  countId: 'csw',   costId: 'cswCost' },
	ifv:      { baseCost: 24750,     kps: 175,     count: 0, needs: { unit: 'recruit',  amount: 5 }, reveal: 3449,     li: '.ifvs',     button: '.buyIFV',      countId: 'ifv',   costId: 'ifvCost' },
	specOps:  { baseCost: 129500,    kps: 1250,    count: 0, needs: { unit: 'marksman', amount: 1 }, reveal: 19499,    li: '.specops',  button: '.buySpecOps',  countId: 'spc',   costId: 'spcCost' },
	heavy:    { baseCost: 1880000,   kps: 28000,   count: 0, needs: { unit: 'marksman', amount: 3 }, reveal: 719999,   li: '.heavy',    button: '.buyHeavy',    countId: 'hvy',   costId: 'hvyCost' },
	f15:      { baseCost: 14990000,  kps: 145500,  count: 0, needs: { unit: 'specOps',  amount: 1 }, reveal: 2900000,  li: '.f15',      button: '.buyF15',      countId: 'f15',   costId: 'f15Cost' },
	b1b:      { baseCost: 145670000, kps: 2567000, count: 0, needs: { unit: 'specOps',  amount: 4 }, reveal: 29000000, li: '.b1b',      button: '.buyB1B',      countId: 'b1b',   costId: 'b1bCost' },
};

// Each upgrade requires the one before it.
const upgrades = [
	{
		cost: 125, reveal: 0, li: '.upgrade1', button: '.buyUpgrade1', purchased: false,
		message: 'Red Dot Sight Purchased - 5% Bonus Kills Per Click',
		apply: () => { game.clickBonus = 1.05; },
	},
	{
		cost: 750, reveal: 500, li: '.upgrade2', button: '.buyUpgrade2', purchased: false,
		message: 'Grenade Launcher Purchased - 15% Bonus Kills Per Click',
		apply: () => { game.clickBonus = 1.20; },
	},
	{
		cost: 1950, reveal: 1500, li: '.upgrade3', button: '.buyUpgrade3', purchased: false,
		message: 'Better Drill Instructors Purchased - Recruit KPS is now 1 - 3',
		apply: () => {
			game.betterRecruits = true;
			setText('bootPwr', '1 - 3');
		},
	},
	{
		cost: 25000, reveal: 20000, li: '.upgrade4', button: '.buyUpgrade4', purchased: false,
		message: 'EMR Upgrade Purchased - Marksman KPS is now 8.25',
		apply: () => {
			units.marksman.kps = 8.25;
			setText('mmPwr', '8.25');
		},
	},
	{
		cost: 250000, reveal: 200000, li: '.upgrade5', button: '.buyUpgrade5', purchased: false,
		message: 'Close Air Support Purchased - 50% chance to kill 100000 every 5 seconds',
		apply: () => startCloseAirSupport(),
	},
	{
		cost: 1200000, reveal: 1000000, li: '.upgrade6', button: '.buyUpgrade6', purchased: false,
		message: 'Double Tap Purchased - Earn 3% of your total Kills Per Second.',
		apply: () => { game.doubleTap = true; },
	},
];



// ======== DOM Helpers ========

const setText = (id, value) => {
	document.getElementById(id).textContent = value;
};

const setVisible = (selector, visible) => {
	const el = document.querySelector(selector);
	if (el) {
		el.hidden = !visible;
	}
};

const setDisabled = (selector, disabled) => {
	const el = document.querySelector(selector);
	if (el) {
		el.disabled = disabled;
	}
};



// ======== The Barracks ========

const unitCost = (unit) => Math.floor(unit.baseCost * 1.1 ** unit.count);

const canBuyUnit = (unit) => {
	const hasCrew = !unit.needs || units[unit.needs.unit].count >= unit.needs.amount;
	return game.kills >= unitCost(unit) && hasCrew;
};

function buyUnit(key) {
	const unit = units[key];
	if (canBuyUnit(unit)) {
		game.kills -= unitCost(unit);
		unit.count += 1;
		setText(unit.countId, unit.count);

		if (unit.needs) {
			const crew = units[unit.needs.unit];
			crew.count -= unit.needs.amount;
			setText(crew.countId, crew.count);
		}

		setText(unit.costId, unitCost(unit));
		setText('kills', game.kills.toFixed(2));
	}
	updateButtons();
}



// ======== The Upgrades ========

const canBuyUpgrade = (index) => {
	const upgrade = upgrades[index];
	const previousBought = index === 0 || upgrades[index - 1].purchased;
	return !upgrade.purchased && previousBought && game.kills >= upgrade.cost;
};

function buyUpgrade(index) {
	const upgrade = upgrades[index];
	if (canBuyUpgrade(index)) {
		game.kills -= upgrade.cost;
		upgrade.purchased = true;
		document.querySelector(upgrade.li).textContent = upgrade.message;
		upgrade.apply();
		setText('kills', game.kills.toFixed(2));
	}
	updateButtons();
}

function startCloseAirSupport() {
	setInterval(() => {
		if (Math.random() < 0.5) {
			addKills(100000);
		}
	}, 5000);
}



// ======== The Main Click Function ========

function addc(number) {
	let earned = number * game.clickBonus;
	if (game.doubleTap) {
		earned += game.kps * 0.03;
	}
	addKills(earned);
}

function addKills(number) {
	game.kills += number;
	setText('kills', game.kills.toFixed(2));
	updateButtons();
}

function updateButtons() {
	for (const unit of Object.values(units)) {
		setDisabled(unit.button, !canBuyUnit(unit));
		if (game.kills > unit.reveal) {
			setVisible(unit.li, true);
		}
	}

	upgrades.forEach((upgrade, index) => {
		setDisabled(upgrade.button, !canBuyUpgrade(index));
		if (game.kills > upgrade.reveal) {
			setVisible(upgrade.li, true);
		}
	});
}



// ======== Kills Per Second ========

// Each recruit rolls separately: 0 - 1 kills, or 1 - 3 with Better Drill Instructors
const rollRecruit = () => (game.betterRecruits ? Math.floor(Math.random() * 3) + 1 : Math.random());

const rollRecruitKills = () => {
	let recruitKills = 0;
	for (let i = 0; i < units.recruit.count; i++) {
		recruitKills += rollRecruit();
	}
	return recruitKills;
};

function earnKillsPerSecond() {
	const unitKills = Object.values(units).reduce((sum, unit) => sum + unit.count * unit.kps, 0);
	game.kps = rollRecruitKills() + unitKills;

	addKills(game.kps);
	setText('kps', game.kps.toFixed(2));
}



// ======== Setup ========

// Hide units and upgrades until you can afford them (the first of each stays visible)
for (const unit of Object.values(units)) {
	setVisible(unit.li, unit.reveal === 0);
}
for (const upgrade of upgrades) {
	setVisible(upgrade.li, upgrade.reveal === 0);
}

document.querySelector('.clicker').addEventListener('click', () => addc(1));

for (const [key, unit] of Object.entries(units)) {
	document.querySelector(unit.button).addEventListener('click', () => buyUnit(key));
}

upgrades.forEach((upgrade, index) => {
	document.querySelector(upgrade.button).addEventListener('click', () => buyUpgrade(index));
});

updateButtons();
setInterval(earnKillsPerSecond, 1000);
