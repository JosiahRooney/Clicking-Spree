import { UNITS, UPGRADES, VERSION } from './data.js';
import { stats, unitCost, unitKps, canBuyUnit, canBuyUpgrade } from './game.js';

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

const statsTable = (...rows) => h('table', { className: 'stats-table' },
	rows.map(([label, ...cells]) => h('tr', {}, h('td', {}, label), h('td', {}, ...cells))),
);



// ======== Header ========

function Header(actions) {
	const kills = h('span');
	const kps = h('span');
	const loadButton = h('button', { type: 'button', onClick: actions.load }, 'Load');
	const saveButton = h('button', { type: 'button', onClick: actions.save }, 'Save');

	const el = h('div', { className: 'topcontent' },
		h('div', { className: 'menu' }, loadButton, ' ', saveButton),
		h('h1', {}, 'Clicking Spree'),
		h('span', { className: 'headerspan' }, `v${VERSION}`),
		h('img', { src: 'images/warlogo.jpg', className: 'warlogo', alt: 'image of war' }),
		h('p', {}, 'Click the button to attack enemies and earn kills. Spend kills on troops and upgrades.'),
		h('button', { className: 'clicker', type: 'button', onClick: actions.attack }, 'Attack'),
		h('div', { className: 'killz' },
			'You have ', kills, ' kills.', h('br'),
			'You have ', kps, ' kills per second (KPS).',
		),
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

	return {
		el,
		flashSaved,
		update(s, env) {
			setText(kills, s.kills.toFixed(2));
			setText(kps, s.kps.toFixed(2));
			loadButton.disabled = !env.hasSave;
		},
	};
}



// ======== Barracks ========

const unitKpsLabel = (def, s) => {
	if (def.id === 'recruit') {
		return stats(s).betterRecruits ? '1 - 3' : '0 - 1';
	}
	return unitKps(def, s);
};

function UnitCard(def, actions) {
	const button = h('button', { type: 'button', onClick: () => actions.buyUnit(def.id) }, def.name);
	const cost = h('span');
	const have = h('span');
	const kps = h('span');
	const crew = def.needs && [h('br'), ' ', h('span', {}, def.needs.amount), ' ', def.needs.label];

	const el = h('li', {},
		button,
		h('p', { className: 'desc' }, def.description),
		statsTable(
			['Cost:', cost, ' kills', crew],
			['Have:', have],
		),
		h('p', {}, 'Kills Per Second: ', kps),
		h('img', { src: def.image.src, className: def.image.className ?? '', style: def.image.style ?? {} }),
	);

	return {
		el,
		update(s) {
			el.hidden = !s.revealed.units[def.id];
			button.disabled = !canBuyUnit(def, s);
			setText(cost, unitCost(def, s));
			setText(have, s.units[def.id]);
			setText(kps, unitKpsLabel(def, s));
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
	const details = h('div', {},
		button,
		h('p', { className: 'desc' }, def.description),
		statsTable(['Cost:', h('span', {}, def.cost), ' kills']),
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



// ======== App ========

export function App(actions) {
	const header = Header(actions);
	const barracks = BarracksPanel(actions);
	const upgrades = UpgradesPanel(actions);

	const el = h('div', { className: 'mainwrap' },
		h('div', { className: 'maincontent' },
			header.el,
			h('div', { className: 'bottomcontent' },
				h('h3', { className: 'barracksh3', onClick: () => actions.setTab('barracks') }, 'Barracks'),
				' ',
				h('h3', { className: 'upgradesh3', onClick: () => actions.setTab('upgrades') }, 'Upgrades'),
				barracks.el,
				upgrades.el,
			),
		),
	);

	return {
		el,
		flashSaved: header.flashSaved,
		update(s, env) {
			header.update(s, env);
			barracks.update(s);
			upgrades.update(s);
		},
	};
}
