import { UNITS, UPGRADES, SKILLS, SKILL_BRANCHES, ZONES, LEVELS, VERSION } from './data.js';
import {
	stats, unitCost, upgradeCost, crewNeeded, unitKps, displayKps, hvtReward,
	canBuyUnit, canBuyUpgrade, canBuySkill, xpProgress, skillPoints, branchPoints, tierRequirement,
	levelDef, levelAvailable, levelBeat, canFightBoss,
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

// Up to 2 decimals, without trailing zeros: 5, 8.25, 1.3
const formatNumber = (n) => String(Number(n.toFixed(2)));

// Whole numbers with thousands separators: 1,250,000
const formatCount = (n) => Math.floor(n).toLocaleString('en-US');

const levelLabel = (def) => `Zone ${def.zoneNumber} - Level ${def.levelNumber}: ${def.name}`;

const statsTable = (...rows) => h('table', { className: 'stats-table' },
	rows.map(([label, ...cells]) => h('tr', {}, h('td', {}, label), h('td', {}, ...cells))),
);



// ======== Header ========

const zoneDef = Object.fromEntries(ZONES.map((zone) => [zone.id, zone]));

const levelStatus = (def, s) => {
	if (s.map.cleared[def.id]) {
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
	const fightButton = h('button', { type: 'button', className: 'fight-button', onClick: () => actions.startBoss(levelId) });
	const progressBlock = h('div', {}, bar, count, status, fightButton);

	const bossName = h('span');
	const bossBar = h('progress', { className: 'boss-hp' });
	const bossHp = h('span');
	const bossTime = h('span', { className: 'boss-time' });
	const bossBlock = h('div', { className: 'boss-block' },
		h('div', { className: 'boss-name' }, 'BOSS: ', bossName),
		bossBar,
		h('div', { className: 'boss-stats' }, bossHp, bossTime),
	);

	const el = h('div', { className: 'level-panel' }, zone, title, progressBlock, bossBlock);

	const announce = ({ levelId: id, defeatedBoss }) => {
		const def = levelDef[id];
		const banner = h('div', { className: 'level-banner' },
			h('div', { className: 'level-banner-top' }, defeatedBoss ? `${defeatedBoss} defeated!` : 'Deployed'),
			h('div', {}, `${defeatedBoss ? 'NEW LEVEL: ' : ''}${levelLabel(def)}`),
		);
		banner.addEventListener('animationend', () => banner.remove());
		el.append(banner);
		el.classList.remove('level-new');
		void el.offsetWidth;
		el.classList.add('level-new');
	};

	let seenLevelStarts = 0;

	return {
		el,
		update(s) {
			const def = levelDef[s.map.activeLevel];
			levelId = def.id;
			setText(zone, `${zoneDef[def.zone].name} \u00b7 ${zoneDef[def.zone].faction}`);
			setText(title, levelLabel(def));

			const cleared = s.map.cleared[def.id];
			bar.max = def.killsRequired;
			bar.value = cleared ? def.killsRequired : Math.min(s.map.progress[def.id], def.killsRequired);
			setText(count, `${formatCount(bar.value)} / ${formatCount(def.killsRequired)} lifetime kills earned here`);
			setText(status, levelStatus(def, s));
			fightButton.hidden = !canFightBoss(def.id, s);
			setText(fightButton, `Fight Boss: ${def.boss.name}`);

			progressBlock.hidden = s.boss !== null;
			bossBlock.hidden = s.boss === null;
			if (s.boss) {
				const boss = levelDef[s.boss.levelId].boss;
				setText(bossName, boss.name);
				bossBar.max = s.boss.maxHp;
				bossBar.value = Math.max(0, s.boss.hp);
				setText(bossHp, `${formatCount(Math.max(0, s.boss.hp))} / ${formatCount(s.boss.maxHp)} HP`);
				setText(bossTime, `${s.boss.timeLeft}s left`);
				bossTime.classList.toggle('boss-time-low', s.boss.timeLeft <= 5);
			}

			if (s.levelStarts > seenLevelStarts) {
				announce(s.lastLevelStart);
			}
			seenLevelStarts = s.levelStarts;
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
	const levelPanel = LevelPanel(actions);
	const hvtButton = h('button', { className: 'hvt-button', type: 'button', hidden: true, onClick: actions.clickHvt });
	const loadButton = h('button', { type: 'button', onClick: actions.load }, 'Load');
	const saveButton = h('button', { type: 'button', onClick: actions.save }, 'Save');
	const resetButton = h('button', { type: 'button', className: 'reset-button', onClick: actions.reset }, 'Reset');

	const el = h('div', { className: 'topcontent' },
		h('div', { className: 'menu' },
			h('span', { className: 'brand' }, `Clicking Spree v${VERSION}`), ' ',
			loadButton, ' ', saveButton, ' ', resetButton,
		),
		levelPanel.el,
		h('p', {}, 'Click the button to attack enemies and earn kills. Spend kills on troops and upgrades.'),
		h('button', { className: 'clicker', type: 'button', onClick: actions.attack }, 'Attack'),
		h('div', { className: 'killz' },
			'You have ', kills, ' kills.', h('br'),
			'You have ', kps, ' kills per second (KPS).',
			h('div', { className: 'lifetime-kills' }, 'Lifetime kills: ', lifetime),
			h('div', { className: 'player-info' },
				'Level ', level, ' ', xpBar, ' ', xpText, ' \u00b7 ', points, ' skill points',
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
			setText(kills, s.kills.toFixed(2));
			setText(kps, displayKps(s).toFixed(2));
			setText(level, progress.level);
			xpBar.max = progress.needed;
			xpBar.value = progress.into;
			setText(xpText, `${Math.floor(progress.into)} / ${progress.needed} XP`);
			setText(points, skillPoints(s));
			setText(lifetime, formatCount(s.lifetimeKills));
			loadButton.disabled = !env.hasSave;
			levelPanel.update(s);

			if (s.attacks > seenAttacks) {
				showHit(s.lastAttack);
			}
			seenAttacks = s.attacks;

			hvtButton.hidden = s.hvt.activeFor <= 0;
			if (!hvtButton.hidden) {
				setText(hvtButton, `High-Value Target! +${Math.floor(hvtReward(s))} kills (${s.hvt.activeFor}s)`);
			}
		},
	};
}



// ======== Barracks ========

const unitKpsLabel = (def, s) => {
	const { allKillsMultiplier, kpsMultiplier, betterRecruits } = stats(s);
	if (def.id === 'recruit') {
		const multiplier = kpsMultiplier(def) * allKillsMultiplier;
		const [min, max] = betterRecruits ? [1, 3] : [0, 1];
		return `${formatNumber(min * multiplier)} - ${formatNumber(max * multiplier)}`;
	}
	return formatNumber(unitKps(def, s) * allKillsMultiplier);
};

function UnitCard(def, actions) {
	const button = h('button', { type: 'button', onClick: () => actions.buyUnit(def.id) }, def.name);
	const cost = h('span');
	const have = h('span');
	const kps = h('span');
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
			['KPS:', kps],
		),
	);

	return {
		el,
		update(s) {
			el.hidden = !s.revealed.units[def.id];
			button.disabled = !canBuyUnit(def, s);
			setText(cost, unitCost(def, s));
			setText(have, s.units[def.id]);
			setText(kps, unitKpsLabel(def, s));
			if (def.needs) {
				setText(crewAmount, crewNeeded(def, s));
			}
		},
	};
}

function BarracksPanel(actions) {
	const cards = UNITS.map((def) => UnitCard(def, actions));
	const el = h('div', { className: 'barracks' },
		h('ul', { className: 'card-list' },
			h('li', {}, 'Click the buttons to enlist new troops. New options will appear as you earn more kills.'),
			cards.map((card) => card.el),
			h('li'),
		),
	);

	return {
		el,
		update(s) {
			el.hidden = s.activeTab !== 'barracks';
			cards.forEach((card) => card.update(s));
		},
	};
}



// ======== Upgrades ========

function UpgradeCard(def, actions) {
	const button = h('button', { type: 'button', onClick: () => actions.buyUpgrade(def.id) }, def.name);
	const cost = h('span');
	const details = h('div', {},
		button,
		h('p', { className: 'desc' }, def.description),
		statsTable(['Cost:', cost, ' kills']),
		h('p', {}, def.bonus.before, h('span', {}, def.bonus.value), def.bonus.after),
	);
	const purchased = h('span', {}, def.purchasedMessage);
	const el = h('li', {}, details, purchased);

	return {
		el,
		update(s) {
			const bought = s.upgrades[def.id];
			el.hidden = !s.revealed.upgrades[def.id];
			details.hidden = bought;
			purchased.hidden = !bought;
			button.disabled = !canBuyUpgrade(def, s);
			setText(cost, upgradeCost(def, s));
		},
	};
}

function UpgradesPanel(actions) {
	const cards = UPGRADES.map((def) => UpgradeCard(def, actions));
	const el = h('div', { className: 'upgrades' },
		h('ul', { className: 'card-list' },
			h('li', {}, 'Click the buttons to upgrade yourself and your troops. New options will appear as you earn more kills.'),
			cards.map((card) => card.el),
			h('li'),
		),
	);

	return {
		el,
		update(s) {
			el.hidden = s.activeTab !== 'upgrades';
			cards.forEach((card) => card.update(s));
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
	const fightButton = h('button', { type: 'button', className: 'fight-button', onClick: () => actions.startBoss(def.id) }, 'Fight Boss');
	const status = h('span', { className: 'level-row-status' });
	const bar = h('progress', { className: 'level-progress' });
	const count = h('span', { className: 'level-row-count' });
	const el = h('li', { className: 'level-row' },
		h('div', { className: 'level-row-name' },
			h('strong', {}, `Level ${def.levelNumber}: ${def.name}`), h('br'),
			status,
		),
		h('div', { className: 'level-row-progress' }, bar, count),
		h('div', { className: 'level-row-actions' }, deployButton, fightButton),
	);

	return {
		el,
		update(s) {
			const available = levelAvailable(def.id, s);
			const active = s.map.activeLevel === def.id;
			el.classList.toggle('level-locked', !available);
			el.classList.toggle('level-active', active);
			setText(status, !available ? 'Locked' : `${active ? 'Active \u00b7 ' : ''}${levelStatus(def, s)}`);
			bar.max = def.killsRequired;
			bar.value = s.map.cleared[def.id] ? def.killsRequired : Math.min(s.map.progress[def.id], def.killsRequired);
			setText(count, `${formatCount(bar.value)} / ${formatCount(def.killsRequired)}`);
			deployButton.hidden = !available || active || s.boss !== null;
			fightButton.hidden = !canFightBoss(def.id, s);
		},
	};
}

function ZoneSection(zone, actions) {
	const rows = LEVELS.filter((def) => def.zone === zone.id).map((def) => LevelRow(def, actions));
	const el = h('div', { className: 'zone-section' },
		h('h4', {}, `Zone ${ZONES.indexOf(zone) + 1}: ${zone.name}`),
		h('p', { className: 'zone-faction' }, `Enemy: ${zone.faction}`),
		h('ul', { className: 'level-list' }, rows.map((row) => row.el)),
	);

	return {
		el,
		update(s) {
			rows.forEach((row) => row.update(s));
		},
	};
}

function MapPanel(actions) {
	const zones = ZONES.map((zone) => ZoneSection(zone, actions));
	const el = h('div', { className: 'map' },
		h('p', { className: 'map-intro' }, 'Kills earned while a level is active count toward it, on any tab. Spending never lowers progress. Reach the goal, then fight the boss to unlock the next level.'),
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

const availableUpgrades = (s) => UPGRADES.filter((def) => s.revealed.upgrades[def.id] && canBuyUpgrade(def, s)).length;
const bossesReady = (s) => LEVELS.filter((def) => canFightBoss(def.id, s)).length;
export function App(actions) {
	const header = Header(actions);
	const barracks = BarracksPanel(actions);
	const upgrades = UpgradesPanel(actions);
	const skills = SkillsPanel(actions);
	const map = MapPanel(actions);
	const tabs = [
		Tab('barracks', 'Barracks', actions),
		Tab('upgrades', 'Upgrades', actions, availableUpgrades),
		Tab('skills', 'Skills', actions, skillPoints),
		Tab('map', 'Map', actions, bossesReady),
	];

	const el = h('div', { className: 'mainwrap' },
		h('div', { className: 'maincontent' },
			header.el,
			h('div', { className: 'bottomcontent' },
				h('div', { className: 'tab-bar' }, tabs.flatMap((tab, i) => (i === 0 ? [tab.el] : [' ', tab.el]))),
				barracks.el,
				upgrades.el,
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
			barracks.update(s);
			upgrades.update(s);
			skills.update(s);
			map.update(s);
		},
	};
}
