import { UNITS, BUILDINGS, ATTACHMENTS, WEAPON_SLOTS, SKILLS, SKILL_BRANCHES, ZONES, LEVELS, VERSION, BOSS_POWER_FUZZ, BOSS_RETREAT_PENALTY } from './data.js';
import {
	stats, unitCost, attachmentCost, crewNeeded, unitKps, unitSps, displayKps, hvtReward, attackCooldown,
	magazineRounds, reloadSeconds, finishReload, unseenAttachments, noticeAttachments,
	canBuyUnit, canBuyAttachment, canBuySkill, xpProgress, skillPoints, branchPoints, tierRequirement,
	levelDef, levelAvailable, levelBeat, canFightBoss, playerPower, bossPower, repeatClearSupplies,
	buildingCost, buildingRevealed, canBuyBuilding, buildingRate,
} from './game.js';

// Components are built once and return { el, update(state, env) }.
// update() only patches the parts that change, so images and hover state survive re-renders.

export const h = (tag, props = {}, ...children) => {
	const el = document.createElement(tag);
	for (const [key, value] of Object.entries(props)) {
		if (key.startsWith('on')) {
			el.addEventListener(key.slice(2).toLowerCase(), value);
		} else if (key === 'style') {
			Object.assign(el.style, value);
		} else {
			el[key] = value;
		}
	}
	el.append(...children.flat().filter((child) => child != null && child !== false));
	return el;
};

const setText = (el, value) => {
	const text = String(value);
	if (el.textContent !== text) {
		el.textContent = text;
	}
};

// Scientific notation from 1000 up. The whole value has at most 4 digits besides the "e"
// (1e3, 1.22e4, 8.5e10): a longer exponent leaves fewer digits for the coefficient.
// Trailing zeros are dropped, and the exponent is written without a plus.
export const formatSci = (n) => {
	const sign = n < 0 ? '-' : '';
	const abs = Math.abs(n);
	let exp = Math.floor(Math.log10(abs));
	// One digit is always kept for the coefficient, even if the exponent is already 4 digits long.
	const sigs = (e) => Math.max(1, 4 - String(Math.abs(e)).length);
	let mantissa = Number((abs / 10 ** exp).toPrecision(sigs(exp)));
	if (mantissa >= 10) {
		exp += 1;
		mantissa = 1;
	}
	return `${sign}${mantissa}e${exp}`;
};

// Thousand groups: 1K, 1M, 1B, 1T, then the usual idle-game names. Past Dc, scientific notation still fits.
const SUFFIXES = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

// Same 1000 cutoff. The suffix stands in for the exponent, so the coefficient gets up to 4 significant digits: 1K, 12.22K, 1M.
export const formatSuffix = (n) => {
	const sign = n < 0 ? '-' : '';
	const abs = Math.abs(n);
	let tier = Math.floor(Math.log10(abs) / 3) - 1;
	if (tier >= SUFFIXES.length) {
		return formatSci(n);
	}
	let scaled = Number((abs / 1000 ** (tier + 1)).toPrecision(4));
	if (scaled >= 1000) {
		tier += 1;
		if (tier >= SUFFIXES.length) {
			return formatSci(n);
		}
		scaled = 1;
	}
	return `${sign}${scaled}${SUFFIXES[tier]}`;
};

const notationKey = 'clickingSpreeNotation';
let notation = 'sci';

export const setNotation = (mode) => {
	notation = mode === 'suffix' ? 'suffix' : 'sci';
	localStorage.setItem(notationKey, notation);
};

export const loadNotation = () => {
	notation = localStorage.getItem(notationKey) === 'suffix' ? 'suffix' : 'sci';
};

const formatLarge = (n, small) => (Math.abs(n) >= 1000 ? (notation === 'suffix' ? formatSuffix(n) : formatSci(n)) : small(n));

// Up to 2 decimals, without trailing zeros: 5, 8.25, 1.3. Large values use formatSci.
const formatNumber = (n) => formatLarge(n, (value) => String(Number(value.toFixed(2))));

// Whole numbers below 1000: 125. Large values use formatSci.
const formatCount = (n) => formatLarge(n, (value) => String(Math.floor(value)));

const levelLabel = (def) => `Zone ${def.zoneNumber} - Level ${def.levelNumber}: ${def.name}`;

// Two significant digits below 1000 (6.5, 240). Larger power uses the same scientific form as other numbers.
const formatPower = (n) => formatLarge(n, (value) => String(Number(value.toPrecision(2))));

// A fixed offset per level (from its id), so the estimate never flickers or changes between visits.
const fuzzFactor = (id) => {
	let hash = 0;
	for (const char of id) {
		hash = (hash * 31 + char.charCodeAt(0)) % 1000;
	}
	return 1 + BOSS_POWER_FUZZ * (hash / 500 - 1);
};

const estimatedBossPower = (def) => bossPower(def) * fuzzFactor(def.id);

// Five bands of win chance. The chance itself stays off the button.
const FIGHT_ODDS = [
	{ id: 'deadly', label: 'Deadly', max: 0.2 },
	{ id: 'unlikely', label: 'Unlikely', max: 0.4 },
	{ id: 'fair', label: 'Fair fight', max: 0.6 },
	{ id: 'favorable', label: 'Favorable', max: 0.88 },
	{ id: 'rollover', label: 'Roll over', max: 1 },
];

// Matching the boss is already a good bet. Well under is deadly, well over is a rollover.
const fightOutlook = (player, boss) => {
	const ratio = boss > 0 ? player / boss : Infinity;
	const chance = 1 / (1 + Math.exp(-4 * (ratio - 0.8)));
	return FIGHT_ODDS.find((tier) => chance < tier.max) ?? FIGHT_ODDS[FIGHT_ODDS.length - 1];
};

const showOutlook = (label, outlook) => {
	setText(label, outlook.label);
	for (const tier of FIGHT_ODDS) {
		label.classList.toggle(`fight-${tier.id}`, tier.id === outlook.id);
	}
};

function PowerCompare() {
	const you = h('strong');
	const boss = h('strong');
	const el = h('div', { className: 'power-compare' }, 'Your power ', you, ' \u00b7 Boss power ~', boss);

	return {
		el,
		update(s, def) {
			const player = playerPower(s);
			const estimate = estimatedBossPower(def);
			setText(you, formatPower(player));
			setText(boss, formatPower(estimate));
			el.classList.toggle('power-ready', player >= estimate);
		},
	};
}

const statsTable = (...rows) => h('table', { className: 'stats-table' },
	rows.map(([label, ...cells]) => h('tr', {}, h('td', {}, label), h('td', {}, ...cells))),
);



// ======== Header ========

const zoneDef = Object.fromEntries(ZONES.map((zone) => [zone.id, zone]));

const levelStatus = (def, s) => {
	if (s.map.cleared[def.id]) {
		if (s.map.activeLevel === def.id) {
			return 'Farming for supplies';
		}
		return def === LEVELS[LEVELS.length - 1] ? 'Campaign complete' : 'Boss defeated';
	}
	if (s.boss?.levelId === def.id) {
		return 'Fighting the boss';
	}
	if (levelBeat(def.id, s)) {
		return 'Boss ready';
	}
	return `${formatCount(def.killsRequired - s.map.progress[def.id])} kills to the boss`;
};

function LevelPanel(actions) {
	let levelId = LEVELS[0].id;
	const zone = h('div', { className: 'level-zone' });
	const title = h('div', { className: 'level-title' });
	const bar = h('progress', { className: 'level-progress' });
	const count = h('div', { className: 'level-count' });
	const status = h('div', { className: 'level-status' });
	const fightOdds = h('span', { className: 'fight-odds' });
	const fightButton = h('button', { type: 'button', className: 'fight-button', onClick: () => actions.startBoss(levelId) });
	const fightRow = h('div', { className: 'fight-row' }, fightButton, fightOdds);
	const progressBlock = h('div', {}, bar, count, status, fightRow);

	const bossName = h('span');
	const timerFill = h('div', { className: 'boss-timer-fill' });
	const timerBar = h('div', { className: 'boss-timer' }, timerFill);
	const bossBar = h('progress', { className: 'boss-hp' });
	const bossHp = h('span');
	const bossTime = h('span', { className: 'boss-time' });
	const bossBlock = h('div', { className: 'boss-block' },
		h('div', { className: 'boss-name' }, 'BOSS: ', bossName),
		timerBar,
		bossBar,
		h('div', { className: 'boss-stats' }, bossHp, bossTime),
	);

	const power = PowerCompare();
	const reward = h('div', { className: 'level-reward' });
	const el = h('div', { className: 'level-panel' }, zone, title, power.el, reward, progressBlock, bossBlock);

	const announce = ({ levelId: id, defeatedBoss, supplies }) => {
		const def = levelDef[id];
		// Beating the final boss has no next level, so the banner names the finished campaign instead.
		const finished = defeatedBoss === def.boss.name;
		const banner = h('div', { className: 'level-banner' },
			h('div', { className: 'level-banner-top' }, defeatedBoss ? `${defeatedBoss} defeated!` : 'Deployed'),
			h('div', {}, finished ? 'Campaign complete' : `${defeatedBoss ? 'NEW LEVEL: ' : ''}${levelLabel(def)}`),
			supplies > 0 && h('div', { className: 'level-banner-detail' }, `+${formatCount(supplies)} supplies`),
		);
		banner.addEventListener('animationend', () => banner.remove());
		el.append(banner);
		el.classList.remove('level-new');
		void el.offsetWidth;
		el.classList.add('level-new');
	};

	const announceRetreat = ({ bossName, killsLost }) => {
		const banner = h('div', { className: 'level-banner level-banner-retreat' },
			h('div', { className: 'level-banner-top' }, 'Forced to retreat'),
			h('div', {}, `${bossName} held the line.`),
			h('div', { className: 'level-banner-detail' }, `Lost ${formatCount(killsLost)} kills in the retreat.`),
		);
		banner.addEventListener('animationend', () => banner.remove());
		el.append(banner);
	};

	// Repeat clears can happen thousands of times a second, so they're summed and shown at most once per interval.
	const toastInterval = 5000;
	let lastToastAt = -Infinity;
	const pending = { count: 0, supplies: 0 };
	const showRepeatToast = () => {
		const text = pending.count === 1
			? `Level cleared, no boss to fight. +${formatCount(pending.supplies)} supplies`
			: `Level cleared ${formatCount(pending.count)} times. +${formatCount(pending.supplies)} supplies collected`;
		const toast = h('div', { className: 'repeat-toast' }, text);
		toast.addEventListener('animationend', () => toast.remove());
		el.append(toast);
		pending.count = 0;
		pending.supplies = 0;
		lastToastAt = performance.now();
	};

	let seenLevelStarts = 0;
	let seenBossLosses = 0;
	let seenRepeats = { count: 0, supplies: 0 };

	return {
		el,
		update(s) {
			const def = levelDef[s.map.activeLevel];
			levelId = def.id;
			setText(zone, `${zoneDef[def.zone].name} \u00b7 ${zoneDef[def.zone].faction}`);
			setText(title, levelLabel(def));

			const cleared = s.map.cleared[def.id];
			power.el.hidden = cleared;
			power.update(s, def);
			setText(reward, cleared
				? `No boss here. +${formatCount(repeatClearSupplies(def))} supplies per clear`
				: `First clear: +${formatCount(def.supplies)} supplies`);
			bar.max = def.killsRequired;
			bar.value = Math.min(s.map.progress[def.id], def.killsRequired);
			setText(count, `${formatCount(bar.value)} / ${formatCount(def.killsRequired)} ${cleared ? 'kills toward the next clear' : 'lifetime kills earned here'}`);
			setText(status, levelStatus(def, s));
			fightRow.hidden = !canFightBoss(def.id, s);
			setText(fightButton, `Fight Boss: ${def.boss.name}`);
			showOutlook(fightOdds, fightOutlook(playerPower(s), estimatedBossPower(def)));

			progressBlock.hidden = s.boss !== null;
			bossBlock.hidden = s.boss === null;
			if (s.boss) {
				const boss = levelDef[s.boss.levelId].boss;
				setText(bossName, boss.name);
				bossBar.max = s.boss.maxHp;
				bossBar.value = Math.max(0, s.boss.hp);
				setText(bossHp, `${formatCount(Math.max(0, s.boss.hp))} / ${formatCount(s.boss.maxHp)} HP`);
				setText(bossTime, `${s.boss.timeLeft}s left`);
				const timeLow = s.boss.timeLeft <= 5;
				bossTime.classList.toggle('boss-time-low', timeLow);
				timerBar.classList.toggle('boss-timer-low', timeLow);
				timerFill.style.width = `${(s.boss.timeLeft / boss.seconds) * 100}%`;
			}

			if (s.levelStarts > seenLevelStarts) {
				announce(s.lastLevelStart);
			}
			seenLevelStarts = s.levelStarts;
			if (s.bossLosses > seenBossLosses) {
				announceRetreat(s.lastBossLoss);
			}
			seenBossLosses = s.bossLosses;

			if (s.repeatClears.count > seenRepeats.count) {
				pending.count += s.repeatClears.count - seenRepeats.count;
				pending.supplies += s.repeatClears.supplies - seenRepeats.supplies;
			}
			seenRepeats = { ...s.repeatClears };
			if (pending.count > 0 && performance.now() - lastToastAt >= toastInterval) {
				showRepeatToast();
			}
		},
	};
}

function Header(actions) {
	const kills = h('span', { className: 'stat-value' });
	const kps = h('span', { className: 'stat-value' });
	const level = h('span', { className: 'player-level' });
	const xpBar = h('progress', { className: 'xp-bar' });
	const xpText = h('span', { className: 'xp-text' });
	const points = h('span');
	const lifetime = h('span');
	const supplies = h('strong', { className: 'supplies-count' });
	const levelPanel = LevelPanel(actions);
	const hvtButton = h('button', { className: 'hvt-button', type: 'button', hidden: true, onClick: actions.clickHvt });
	const loadButton = h('button', { type: 'button', onClick: actions.load }, 'Load');
	const saveButton = h('button', { type: 'button', onClick: actions.save }, 'Save');
	const resetButton = h('button', { type: 'button', className: 'reset-button', onClick: actions.reset }, 'Reset');
	const cooldownFill = h('span', { className: 'attack-cooldown' });
	const ammoLabel = h('span', { className: 'attack-ammo' });
	const attackButton = h('button', { className: 'clicker', type: 'button' }, h('span', { className: 'attack-label' }, 'Attack'), ammoLabel, cooldownFill);
	let holding = false;
	let armedUntil = 0;
	let cooldownTimer = null;
	const releaseAttack = () => { holding = false; };
	attackButton.addEventListener('pointerdown', (event) => {
		if (event.button !== 0) return;
		event.preventDefault();
		holding = true;
		attackButton.setPointerCapture(event.pointerId);
		actions.attack();
	});
	attackButton.addEventListener('pointerup', releaseAttack);
	attackButton.addEventListener('pointercancel', releaseAttack);
	attackButton.addEventListener('lostpointercapture', releaseAttack);
	attackButton.addEventListener('keyup', (event) => {
		if (event.key === ' ' || event.key === 'Enter') actions.attack();
	});
	const notationButtons = [
		['sci', '1e3', 'Scientific notation'],
		['suffix', '1K', 'Suffix notation'],
	].map(([mode, label, title]) => h('button', {
		type: 'button',
		className: 'notation-button',
		title,
		onClick: () => {
			setNotation(mode);
			actions.render();
		},
	}, label));

	const el = h('div', { className: 'topcontent' },
		h('div', { className: 'menu' },
			h('span', { className: 'brand' }, `Clicking Spree v${VERSION}`), ' ',
			h('span', { className: 'notation-switch' }, ...notationButtons), ' ',
			loadButton, ' ', saveButton, ' ', resetButton,
		),
		levelPanel.el,
		h('p', {}, 'Click or hold the button to attack. It fires until the magazine is empty, then reloads. Spend kills on troops and attachments.'),
		attackButton,
		h('div', { className: 'killz' },
			'You have ', kills, ' kills.', h('br'),
			'You have ', kps, ' kills per second (KPS).',
			h('div', { className: 'lifetime-kills' }, 'Supplies: ', supplies, ' \u00b7 Lifetime kills: ', lifetime),
			h('div', { className: 'player-info' },
				h('span', { className: 'player-xp' }, 'Level ', level, ' ', xpBar, ' ', xpText),
				h('span', { className: 'skill-points' }, points, ' skill points'),
			),
		),
		hvtButton,
	);

	const scrollPoint = 76;
	window.addEventListener('scroll', () => {
		el.style.boxShadow = window.scrollY >= scrollPoint ? '0 0 14px rgba(0, 0, 0, 0.7)' : 'none';
	});

	let flashTimer;
	const flashSaved = () => {
		saveButton.textContent = 'Saved!';
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => { saveButton.textContent = 'Save'; }, 1500);
	};

	let seenAttacks = 0;
	const showHit = ({ amount, crit }) => {
		const text = h('span', {
			className: crit ? 'hit-float hit-crit' : 'hit-float',
			style: { left: `${40 + Math.random() * 250}px`, top: `${100 + Math.random() * 30}px` },
		}, `${crit ? 'CRIT! ' : ''}+${formatNumber(amount)}`);
		text.addEventListener('animationend', () => text.remove());
		el.append(text);
	};

	return {
		el,
		flashSaved,
		update(s, env) {
			const progress = xpProgress(s);
			setText(kills, formatLarge(s.kills, (value) => value.toFixed(2)));
			setText(kps, formatLarge(displayKps(s), (value) => value.toFixed(2)));
			setText(level, progress.level);
			xpBar.max = progress.needed;
			xpBar.value = progress.into;
			setText(xpText, `${formatCount(progress.into)} / ${formatCount(progress.needed)} XP`);
			setText(points, skillPoints(s));
			setText(lifetime, formatCount(s.lifetimeKills));
			setText(supplies, formatCount(s.supplies));
			loadButton.disabled = !env.hasSave;
			finishReload(s);
			const readyAt = Math.max(s.nextAttackAt, s.reloadUntil);
			const wait = Math.max(0, readyAt - Date.now());
			const reloading = s.ammo <= 0 && s.reloadUntil > Date.now();
			attackButton.classList.toggle('clicker-reloading', reloading);
			setText(ammoLabel, reloading ? 'Reloading' : `${s.ammo}/${magazineRounds(s)}`);
			if (wait === 0) {
				clearTimeout(cooldownTimer);
				cooldownTimer = null;
				armedUntil = readyAt;
				cooldownFill.style.transition = 'none';
				cooldownFill.style.width = '0';
			} else if (readyAt !== armedUntil || (holding && cooldownTimer === null)) {
				if (readyAt !== armedUntil) {
					armedUntil = readyAt;
					const total = (reloading ? reloadSeconds(s) : attackCooldown(s)) * 1000;
					cooldownFill.style.transition = 'none';
					cooldownFill.style.width = `${Math.max(0, (1 - wait / total) * 100)}%`;
					requestAnimationFrame(() => {
						cooldownFill.style.transition = `width ${wait}ms linear`;
						cooldownFill.style.width = '100%';
					});
				}
				clearTimeout(cooldownTimer);
				cooldownTimer = setTimeout(() => {
					cooldownTimer = null;
					if (holding) actions.attack();
					else actions.render();
				}, Math.max(0, readyAt - Date.now()));
			}
			notationButtons.forEach((button) => {
				button.classList.toggle('notation-active', button.textContent === (notation === 'suffix' ? '1K' : '1e3'));
			});
			levelPanel.update(s);

			if (s.attacks > seenAttacks) {
				showHit(s.lastAttack);
			}
			seenAttacks = s.attacks;

			hvtButton.hidden = s.hvt.activeFor <= 0;
			if (!hvtButton.hidden) {
				setText(hvtButton, `High-Value Target! +${formatCount(hvtReward(s))} kills (${s.hvt.activeFor}s)`);
			}
		},
	};
}



// ======== Units ========

const unitKpsLabel = (def, s) => {
	const { allKillsMultiplier, kpsMultiplier } = stats(s);
	if (def.id === 'recruit') {
		const multiplier = kpsMultiplier(def) * allKillsMultiplier;
		return `${formatNumber(0)} - ${formatNumber(multiplier)}`;
	}
	return formatNumber(unitKps(def, s) * allKillsMultiplier);
};

function UnitCard(def, actions) {
	const button = h('button', { type: 'button', onClick: () => actions.buyUnit(def.id) }, def.name);
	const cost = h('span');
	const have = h('span');
	const rate = h('span');
	const crewAmount = h('span');
	const crew = def.needs && [h('br'), '+ ', crewAmount, ' ', def.needs.label];

	const el = h('li', { className: 'unit-row' },
		h('div', { className: 'unit-thumb' }, h('img', { src: def.image, alt: def.name })),
		h('div', { className: 'unit-info' },
			button,
			h('p', { className: 'unit-desc' }, def.description),
		),
		statsTable(
			['Cost:', cost, ' kills', crew],
			['Have:', have],
			[def.sps ? 'Supplies:' : 'KPS:', rate, def.sps ? '/s' : ''],
		),
	);

	return {
		el,
		update(s) {
			el.hidden = !s.revealed.units[def.id];
			button.disabled = !canBuyUnit(def, s);
			setText(cost, formatCount(unitCost(def, s)));
			setText(have, formatCount(s.units[def.id]));
			setText(rate, def.sps ? formatNumber(unitSps(def, s)) : unitKpsLabel(def, s));
			if (def.needs) {
				setText(crewAmount, crewNeeded(def, s));
			}
		},
	};
}

function UnitsPanel(actions) {
	const cards = UNITS.map((def) => UnitCard(def, actions));
	const el = h('div', { className: 'units' },
		h('ul', { className: 'card-list' },
			h('li', {}, 'Click the buttons to enlist new troops. New options will appear as you earn more kills.'),
			cards.map((card) => card.el),
			h('li'),
		),
	);

	return {
		el,
		update(s) {
			el.hidden = s.activeTab !== 'units';
			cards.forEach((card) => card.update(s));
		},
	};
}



// ======== Buildings ========

const unitByID = Object.fromEntries(UNITS.map((def) => [def.id, def]));

const productionLabel = (def, rate) => {
	const [one, many] = def.label;
	if (rate === 0) {
		return `1 ${one} every ${def.seconds}s`;
	}
	if (rate < 1) {
		return `1 ${one} every ${(1 / rate).toFixed(1)}s`;
	}
	const amount = formatNumber(rate);
	return `${amount} ${amount === '1' ? one : many} per second`;
};

function BuildingCard(def, actions) {
	const unit = unitByID[def.unit];
	const button = h('button', { type: 'button', onClick: () => actions.buyBuilding(def.id) }, def.name);
	const cost = h('span');
	const owned = h('span');
	const rate = h('span');
	const nextFill = h('div', { className: 'building-next-fill' });
	const nextBar = h('div', { className: 'building-next' }, nextFill);

	const el = h('li', { className: 'unit-row' },
		h('div', { className: 'unit-thumb' }, h('img', { src: unit.image, alt: unit.name })),
		h('div', { className: 'unit-info' },
			button,
			h('p', { className: 'unit-desc' }, def.description),
			nextBar,
		),
		statsTable(
			['Cost:', cost, ' supplies'],
			['Owned:', owned],
			['Makes:', rate],
		),
	);

	let lastProgress = null;
	let lastRate = null;

	return {
		el,
		update(s) {
			el.hidden = !buildingRevealed(def, s);
			button.disabled = !canBuyBuilding(def, s);
			setText(cost, formatCount(buildingCost(def, s)));
			setText(owned, formatCount(s.buildings[def.id]));
			const unitsPerSecond = buildingRate(def, s);
			setText(rate, productionLabel(def, unitsPerSecond));

			// Past one unit per second production is continuous, so a "next unit" bar would only flicker.
			const progress = s.buildingProgress[def.id];
			nextBar.hidden = unitsPerSecond === 0 || unitsPerSecond >= 1;
			if (nextBar.hidden || (progress === lastProgress && unitsPerSecond === lastRate)) {
				lastProgress = progress;
				lastRate = unitsPerSecond;
				return;
			}
			// Progress is where this second started. Animate across the second, up to a full unit.
			// Landing on the stored value instead left the bar a step short, then jumped to the leftover.
			const wrapped = lastProgress !== null && progress < lastProgress;
			if (wrapped || lastRate !== unitsPerSecond) {
				nextFill.style.transition = 'none';
				nextFill.style.width = `${progress * 100}%`;
				void nextFill.offsetWidth;
			}
			nextFill.style.transition = 'width 1s linear';
			nextFill.style.width = `${Math.min(1, progress + unitsPerSecond) * 100}%`;
			lastProgress = progress;
			lastRate = unitsPerSecond;
		},
	};
}

const availableBuildings = (s) => BUILDINGS.filter((def) => canBuyBuilding(def, s)).length;

function BuildingsPanel(actions) {
	const cards = BUILDINGS.map((def) => BuildingCard(def, actions));
	const supplies = h('strong');
	// Shares the Units tab's row layout.
	const el = h('div', { className: 'units buildings' },
		h('ul', { className: 'card-list' },
			h('li', {}, 'Spend supplies on buildings. Each one produces its unit for free, no kills or crew needed. More of the same building makes units faster. Supplies: ', supplies),
			cards.map((card) => card.el),
			h('li'),
		),
	);

	return {
		el,
		update(s) {
			el.hidden = s.activeTab !== 'buildings';
			setText(supplies, formatCount(s.supplies));
			cards.forEach((card) => card.update(s));
		},
	};
}



// ======== Weapon ========

const attachmentBonus = (def) => {
	if (def.starter) return 'No bonus';
	if (def.effect.type === 'click') {
		return `+${formatNumber(def.effect.amount)} kill per click`;
	}
	if (def.effect.type === 'crit') {
		return `+${Math.round(def.effect.amount * 100)}% crit chance`;
	}
	if (def.effect.type === 'magazine') {
		const faster = Math.round((1 - def.effect.reload) * 100);
		return faster > 0 ? `${def.effect.rounds} rounds, ${faster}% faster reload` : `${def.effect.rounds} rounds`;
	}
	return `${Math.round((1 - def.effect.amount) * 100)}% faster attacks`;
};

const rifleGraphic = () => {
	const el = h('div', { className: 'weapon-rifle' });
	el.innerHTML = `<svg viewBox="0 0 460 110" aria-hidden="true">
		<rect x="8" y="46" width="150" height="10" rx="2" fill="#3a3a3a"/>
		<rect x="150" y="40" width="130" height="18" rx="2" fill="#2c2c2c"/>
		<rect x="168" y="28" width="70" height="12" rx="2" fill="#242424"/>
		<rect x="278" y="42" width="70" height="22" rx="2" fill="#1e1e1e"/>
		<rect x="200" y="64" width="18" height="36" rx="2" fill="#333"/>
		<path d="M348 44 h90 l14 16 v18 h-104z" fill="#3f3428"/>
		<rect x="118" y="56" width="28" height="22" rx="2" fill="#6b5344"/>
	</svg>`;
	return el;
};

function AttachmentRow(def, actions) {
	const buy = h('button', { type: 'button', onClick: () => actions.buyAttachment(def.id) }, 'Buy');
	const equip = h('button', { type: 'button', onClick: () => actions.equipAttachment(def.id) }, 'Equip');
	const remove = h('button', { type: 'button', onClick: () => actions.clearAttachment(def.slot) }, 'Remove');
	const cost = h('span');
	const price = h('span', { className: 'attachment-cost' }, cost, ' kills');
	const el = h('li', { className: 'attachment-row' },
		h('div', { className: 'attachment-info' },
			h('strong', {}, def.name),
			h('p', {}, def.description),
			h('p', { className: 'attachment-bonus' }, attachmentBonus(def)),
		),
		h('div', { className: 'attachment-actions' }, price, buy, equip, remove),
	);

	return {
		el,
		update(s, selected) {
			const owned = s.weapon.owned[def.id];
			const equipped = s.weapon.equipped[def.slot] === def.id;
			el.hidden = def.slot !== selected || !s.revealed.attachments[def.id];
			el.classList.toggle('attachment-equipped', equipped);
			buy.hidden = owned || def.starter;
			equip.hidden = !owned || equipped;
			remove.hidden = !equipped || def.starter;
			price.hidden = owned || def.starter;
			buy.disabled = !canBuyAttachment(def, s);
			setText(cost, formatCount(attachmentCost(def, s)));
		},
	};
}

function WeaponPanel(actions) {
	let selected = 'muzzle';
	const callouts = WEAPON_SLOTS.map((slot) => {
		const label = h('span', { className: 'weapon-callout-name' });
		const badge = h('span', { className: 'weapon-callout-badge' });
		const button = h('button', {
			type: 'button',
			className: `weapon-callout weapon-callout-${slot.id}`,
			onClick: () => {
				selected = slot.id;
				noticeAttachments(slot.id);
				actions.render();
			},
		}, h('span', { className: 'weapon-callout-slot' }, slot.name), label, badge);
		return { slot, button, label, badge };
	});
	const rows = ATTACHMENTS.map((def) => AttachmentRow(def, actions));
	const heading = h('h4', { className: 'weapon-slot-title' });
	const summary = h('p', { className: 'weapon-summary' });
	const emptyNote = h('p', { className: 'weapon-empty' }, 'More attachments for this slot appear as you earn kills.');
	const el = h('div', { className: 'weapon' },
		summary,
		h('div', { className: 'weapon-stage' }, rifleGraphic(), ...callouts.map((callout) => callout.button)),
		heading,
		h('ul', { className: 'card-list attachment-list' }, rows.map((row) => row.el), emptyNote),
	);

	return {
		el,
		update(s) {
			el.hidden = s.activeTab !== 'weapon';
			if (s.activeTab === 'weapon') noticeAttachments(selected);
			const { clickBonus, critChance } = stats(s);
			setText(summary, `Click damage ${formatNumber(clickBonus)} · Attack every ${formatNumber(attackCooldown(s))}s · ${magazineRounds(s)} rounds, ${formatNumber(reloadSeconds(s))}s reload · Crit ${Math.round(critChance * 100)}%`);
			callouts.forEach(({ slot, button, label, badge }) => {
				const equipped = ATTACHMENTS.find((def) => def.id === s.weapon.equipped[slot.id]);
				setText(label, equipped ? equipped.name : 'Empty');
				button.classList.toggle('weapon-callout-selected', slot.id === selected);
				const unseen = unseenAttachments(slot.id, s);
				badge.hidden = unseen === 0;
				setText(badge, unseen);
			});
			const slot = WEAPON_SLOTS.find((item) => item.id === selected);
			setText(heading, slot.name);
			rows.forEach((row) => row.update(s, selected));
			emptyNote.hidden = rows.some((row) => row.el.hidden === false);
		},
	};
}



// ======== Skills ========

const skillName = (id) => SKILLS.find((def) => def.id === id).name;

function SkillCard(def, actions) {
	const button = h('button', { type: 'button', onClick: () => actions.buySkill(def.id) }, def.name);
	const rank = h('span', { className: 'skill-rank' });
	const el = h('div', { className: 'skill-card' },
		button, ' ', rank,
		h('p', { className: 'skill-desc' }, def.description),
		def.requires && h('p', { className: 'skill-requires' }, `Requires ${skillName(def.requires)}`),
	);

	return {
		el,
		update(s) {
			const current = s.skills[def.id];
			setText(rank, `${current} / ${def.maxRank}`);
			button.disabled = !canBuySkill(def, s);
			el.classList.toggle('skill-maxed', current === def.maxRank);
		},
	};
}

function SkillTier(branch, tier, actions) {
	const cards = SKILLS.filter((def) => def.branch === branch.id && def.tier === tier).map((def) => SkillCard(def, actions));
	const required = tierRequirement(tier);
	const requirement = h('span', {}, ` (needs ${required} points in ${branch.name})`);
	const label = h('div', { className: 'tier-label' }, `Tier ${tier}`, required > 0 && requirement);
	const el = h('div', { className: 'skill-tier' }, label, cards.map((card) => card.el));

	return {
		el,
		update(s) {
			const locked = branchPoints(s, branch.id) < required;
			el.classList.toggle('tier-locked', locked);
			requirement.hidden = !locked;
			cards.forEach((card) => card.update(s));
		},
	};
}

function SkillBranch(branch, actions) {
	const tierNumbers = [...new Set(SKILLS.filter((def) => def.branch === branch.id).map((def) => def.tier))].sort();
	const tiers = tierNumbers.map((tier) => SkillTier(branch, tier, actions));
	const spent = h('span');
	const el = h('div', { className: `skill-branch skill-branch-${branch.id}` },
		h('h4', {}, branch.name),
		h('p', { className: 'skill-branch-desc' }, branch.description),
		h('p', { className: 'skill-branch-spent' }, 'Points spent: ', spent),
		tiers.map((tier) => tier.el),
	);

	return {
		el,
		update(s) {
			setText(spent, branchPoints(s, branch.id));
			tiers.forEach((tier) => tier.update(s));
		},
	};
}

function SkillsPanel(actions) {
	const branches = SKILL_BRANCHES.map((branch) => SkillBranch(branch, actions));
	const points = h('span');
	const resetButton = h('button', { type: 'button', onClick: actions.resetSkills }, 'Reset skills');
	const el = h('div', { className: 'skills' },
		h('div', { className: 'skills-header' },
			h('span', {}, 'Skill points available: ', points),
			resetButton,
		),
		h('p', { className: 'skills-intro' }, 'Every kill earns 1 XP. Each level gives a skill point. Spend points in a branch to open its higher tiers.'),
		h('div', { className: 'skill-branches' }, branches.map((branch) => branch.el)),
	);

	return {
		el,
		update(s) {
			el.hidden = s.activeTab !== 'skills';
			setText(points, skillPoints(s));
			resetButton.disabled = SKILLS.every((def) => s.skills[def.id] === 0);
			branches.forEach((branch) => branch.update(s));
		},
	};
}



// ======== Map ========

function LevelRow(def, actions) {
	const deployButton = h('button', { type: 'button', onClick: () => actions.selectLevel(def.id) }, 'Deploy');
	const fightOdds = h('span', { className: 'fight-odds' });
	const fightButton = h('button', { type: 'button', className: 'fight-button', onClick: () => actions.startBoss(def.id) }, 'Fight Boss');
	const fightRow = h('span', { className: 'fight-row' }, fightButton, fightOdds);
	const status = h('span', { className: 'level-row-status' });
	const bar = h('progress', { className: 'level-progress' });
	const count = h('span', { className: 'level-row-count' });
	const power = PowerCompare();
	const reward = h('div', { className: 'level-row-reward' });
	const el = h('li', { className: 'level-row' },
		h('div', { className: 'level-row-name' },
			h('strong', {}, `Level ${def.levelNumber}: ${def.name}`), h('br'),
			status,
			power.el,
			reward,
		),
		h('div', { className: 'level-row-progress' }, bar, count),
		h('div', { className: 'level-row-actions' }, deployButton, fightRow),
	);

	return {
		el,
		update(s) {
			const available = levelAvailable(def.id, s);
			const active = s.map.activeLevel === def.id;
			el.hidden = !available;
			el.classList.toggle('level-active', active);
			setText(status, `${active ? 'Active \u00b7 ' : ''}${levelStatus(def, s)}`);
			const cleared = s.map.cleared[def.id];
			power.el.hidden = cleared;
			power.update(s, def);
			setText(reward, cleared
				? `+${formatCount(repeatClearSupplies(def))} supplies per clear`
				: `First clear: +${formatCount(def.supplies)} supplies`);
			bar.max = def.killsRequired;
			// A cleared level restarts from zero when deployed to, so only the active one shows partial progress.
			bar.value = cleared && !active ? def.killsRequired : Math.min(s.map.progress[def.id], def.killsRequired);
			setText(count, `${formatCount(bar.value)} / ${formatCount(def.killsRequired)}`);
			deployButton.hidden = !available || active || s.boss !== null;
			fightRow.hidden = !canFightBoss(def.id, s);
			showOutlook(fightOdds, fightOutlook(playerPower(s), estimatedBossPower(def)));
		},
	};
}

function ZoneSection(zone, actions) {
	const levels = LEVELS.filter((def) => def.zone === zone.id);
	const rows = levels.map((def) => LevelRow(def, actions));
	const el = h('div', { className: 'zone-section' },
		h('h4', {}, `Zone ${ZONES.indexOf(zone) + 1}: ${zone.name}`),
		h('p', { className: 'zone-faction' }, `Enemy: ${zone.faction}`),
		h('ul', { className: 'level-list' }, rows.map((row) => row.el)),
	);

	return {
		el,
		update(s) {
			el.hidden = !levelAvailable(levels[0].id, s);
			rows.forEach((row) => row.update(s));
		},
	};
}

function MapPanel(actions) {
	const zones = ZONES.map((zone) => ZoneSection(zone, actions));
	const el = h('div', { className: 'map' },
		h('p', { className: 'map-intro' }, `Kills earned while a level is active count toward it, on any tab. Spending never lowers progress. Reach the goal, then fight the boss to unlock the next level and earn supplies. If time runs out, you retreat and lose ${BOSS_RETREAT_PENALTY * 100}% of your current kills. Cleared levels can be replayed: each time you reach the goal again you collect a smaller share of supplies, and you stay on that level.`),
		zones.map((zone) => zone.el),
	);

	return {
		el,
		update(s) {
			el.hidden = s.activeTab !== 'map';
			zones.forEach((zone) => zone.update(s));
		},
	};
}



// ======== App ========

function Tab(id, name, actions, countAvailable = () => 0) {
	const badge = h('span', { className: 'tab-badge' });
	const el = h('h3', { className: `${id}h3`, onClick: () => actions.setTab(id) }, name, badge);

	return {
		el,
		update(s) {
			const count = countAvailable(s);
			badge.hidden = count === 0;
			setText(badge, count);
		},
	};
}

const availableAttachments = (s) => ATTACHMENTS.filter((def) => canBuyAttachment(def, s)).length;
const bossesReady = (s) => LEVELS.filter((def) => canFightBoss(def.id, s)).length;
export function App(actions) {
	const header = Header(actions);
	const units = UnitsPanel(actions);
	const buildings = BuildingsPanel(actions);
	const weapon = WeaponPanel(actions);
	const skills = SkillsPanel(actions);
	const map = MapPanel(actions);
	const tabs = [
		Tab('units', 'Units', actions),
		Tab('buildings', 'Buildings', actions, availableBuildings),
		Tab('weapon', 'Weapon', actions, availableAttachments),
		Tab('skills', 'Skills', actions, skillPoints),
		Tab('map', 'Map', actions, bossesReady),
	];

	const el = h('div', { className: 'mainwrap' },
		h('div', { className: 'maincontent' },
			header.el,
			h('div', { className: 'bottomcontent' },
				h('div', { className: 'tab-bar' }, tabs.flatMap((tab, i) => (i === 0 ? [tab.el] : [' ', tab.el]))),
				units.el,
				buildings.el,
				weapon.el,
				skills.el,
				map.el,
			),
		),
	);

	return {
		el,
		flashSaved: header.flashSaved,
		update(s, env) {
			header.update(s, env);
			tabs.forEach((tab) => tab.update(s));
			units.update(s);
			buildings.update(s);
			weapon.update(s);
			skills.update(s);
			map.update(s);
		},
	};
}
