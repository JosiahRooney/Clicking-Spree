import {
	state, attack, buyUnit, buyUpgrade, buySkill, resetSkills, clickHvt, setTab,
	tick, closeAirSupportTick, updateReveals, serialize, deserialize,
} from './game.js';
import { App } from './ui.js';

const saveKey = 'clickingSpreeSave';
const autosaveInterval = 15000;

const hasSave = () => localStorage.getItem(saveKey) !== null;

function render() {
	updateReveals(state);
	app.update(state, { hasSave: hasSave() });
}

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

const app = App(withRender({ attack, buyUnit, buyUpgrade, buySkill, resetSkills, clickHvt, setTab, save, load }));
document.getElementById('app').append(app.el);

load();
render();

const timers = withRender({ tick, closeAirSupportTick });
setInterval(timers.tick, 1000);
setInterval(timers.closeAirSupportTick, 5000);
setInterval(writeSave, autosaveInterval);
