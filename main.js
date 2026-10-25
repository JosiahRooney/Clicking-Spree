import {
	state, attack, buyUnit, buyBuilding, buyUpgrade, buySkill, resetSkills, resetGame, clickHvt, setTab,
	selectLevel, startBoss, tick, closeAirSupportTick, updateReveals, serialize, deserialize,
} from './game.js';
import { CAS_INTERVAL } from './data.js';
import { App, loadNotation } from './ui.js';

const saveKey = 'clickingSpreeSave';
const autosaveInterval = 15000;

const hasSave = () => localStorage.getItem(saveKey) !== null;

// Wraps each action so the UI re-renders after it changes state.
const withRender = (actions) => Object.fromEntries(
	Object.entries(actions).map(([name, action]) => [name, (...args) => {
		action(...args);
		render();
	}]),
);

function writeSave() {
	localStorage.setItem(saveKey, serialize(state));
}

function save() {
	writeSave();
	app.flashSaved();
}

function load() {
	deserialize(localStorage.getItem(saveKey));
}

function reset() {
	if (!confirm('Reset the game? All kills, units, upgrades, XP, skills and map progress will be lost, including your save.')) {
		return;
	}
	resetGame();
	localStorage.removeItem(saveKey);
}

let app;
function render() {
	updateReveals(state);
	app.update(state, { hasSave: hasSave() });
}

const appActions = withRender({ attack, buyUnit, buyBuilding, buyUpgrade, buySkill, resetSkills, clickHvt, setTab, selectLevel, startBoss, save, load, reset });
app = App({ ...appActions, render });
document.getElementById('app').append(app.el);

loadNotation();
load();
render();

const timers = withRender({ tick, closeAirSupportTick });
setInterval(timers.tick, 1000);
setInterval(timers.closeAirSupportTick, CAS_INTERVAL * 1000);
setInterval(writeSave, autosaveInterval);
