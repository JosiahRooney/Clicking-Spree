import { UNITS, UPGRADES, SKILLS, SKILL_BRANCHES, VERSION } from './data.js';
import {
	stats, unitCost, upgradeCost, crewNeeded, unitKps, displayKps, hvtReward,
	canBuyUnit, canBuyUpgrade, canBuySkill, xpProgress, skillPoints, branchPoints, tierRequirement,
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

const statsTable = (...rows) => h('table', { className: 'stats-table' },
	rows.map(([label, ...cells]) => h('tr', {}, h('td', {}, label), h('td', {}, ...cells))),
);



// ======== Header ========

function Header(actions) {
	const kills = h('span', { className: 'stat-value' });
	const kps = h('span', { className: 'stat-value' });
	const level = h('span', { className: 'player-level' });
	const xpBar = h('progress', { className: 'xp-bar' });
	const xpText = h('span', { className: 'xp-text' });
	const points = h('span');
	const hvtButton = h('button', { className: 'hvt-button', type: 'button', hidden: true, onClick: actions.clickHvt });
	const loadButton = h('button', { type: 'button', onClick: actions.load }, 'Load');
	const saveButton = h('button', { type: 'button', onClick: actions.save }, 'Save');
	const resetButton = h('button', { type: 'button', className: 'reset-button', onClick: actions.reset }, 'Reset');

	const el = h('div', { className: 'topcontent' },
		h('div', { className: 'menu' }, loadButton, ' ', saveButton, ' ', resetButton),
		h('h1', {}, 'Clicking Spree'),
		h('span', { className: 'headerspan' }, `v${VERSION}`),
		h('img', { src: 'images/warlogo.jpg', className: 'warlogo', alt: 'image of war' }),
		h('p', {}, 'Click the button to attack enemies and earn kills. Spend kills on troops and upgrades.'),
		h('button', { className: 'clicker', type: 'button', onClick: actions.attack }, 'Attack'),
		h('div', { className: 'killz' },
			'You have ', kills, ' kills.', h('br'),
			'You have ', kps, ' kills per second (KPS).',
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
			style: { left: `${40 + Math.random() * 250}px`, top: `${170 + Math.random() * 30}px` },
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
			loadButton.disabled = !env.hasSave;

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
export function App(actions) {
	const header = Header(actions);
	const barracks = BarracksPanel(actions);
	const upgrades = UpgradesPanel(actions);
	const skills = SkillsPanel(actions);
	const tabs = [
		Tab('barracks', 'Barracks', actions),
		Tab('upgrades', 'Upgrades', actions, availableUpgrades),
		Tab('skills', 'Skills', actions, skillPoints),
	];

	const el = h('div', { className: 'mainwrap' },
		h('div', { className: 'maincontent' },
			header.el,
			h('div', { className: 'bottomcontent' },
				h('div', { className: 'tab-bar' }, tabs.flatMap((tab, i) => (i === 0 ? [tab.el] : [' ', tab.el]))),
				barracks.el,
				upgrades.el,
				skills.el,
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
		},
	};
}
