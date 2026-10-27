// Append-only log of what has happened this session. Each message carries the game
// data after the event, so questions like "has the player reached 500 lifetime kills?"
// are answered from the stream rather than from the current save, which prestige can wipe.

const log = [];
const listeners = new Set();
const defeatedBosses = new Set();
let peakLifetimeKills = 0;

const EPHEMERAL = new Set([
	'start', 'restored', 'reset', 'tick', 'attack', 'reload', 'reload-finished',
	'hvt-appeared', 'hvt-clicked', 'tab-selected', 'buy-amount', 'revealed',
	'level-started', 'supplies-collected', 'attachments-noticed',
]);

function fold(message) {
	const lifetimeKills = message.data?.lifetimeKills ?? message.detail?.lifetimeKills ?? 0;
	if (lifetimeKills > peakLifetimeKills) peakLifetimeKills = lifetimeKills;
	if (message.type === 'boss-defeated' && message.detail?.levelId) {
		defeatedBosses.add(message.detail.levelId);
	}
}

function notify(message) {
	for (const listener of [...listeners]) listener(message);
}

export function record(type, detail = {}, data = null) {
	const message = { type, time: Date.now(), detail, data };
	log.push(message);
	fold(message);
	notify(message);
	return message;
}

export function subscribe(listener) {
	listeners.add(listener);
	const current = latestData();
	if (current) listener(log[log.length - 1]);
	return () => listeners.delete(listener);
}

export function messages() {
	return log;
}

export function latestData() {
	for (let i = log.length - 1; i >= 0; i--) {
		if (log[i].data) return log[i].data;
	}
	return null;
}

export function bossDefeated(levelId) {
	return defeatedBosses.has(levelId);
}

export function lifetimeKillsReached(amount) {
	return peakLifetimeKills >= amount;
}

export function clearStream() {
	log.length = 0;
	defeatedBosses.clear();
	peakLifetimeKills = 0;
}

// Boss defeats and the highest lifetime-kill total survive prestige, which clears both
// from the live state. Other actions are kept as a short tail so a save stays small.
export function savedEvents() {
	const bosses = [];
	const seen = new Set();
	const tail = [];
	for (const message of log) {
		if (message.type === 'boss-defeated' && message.detail?.levelId && !seen.has(message.detail.levelId)) {
			seen.add(message.detail.levelId);
			bosses.push({
				type: 'boss-defeated',
				time: message.time,
				detail: { levelId: message.detail.levelId, bossName: message.detail.bossName ?? null },
			});
		}
		if (!EPHEMERAL.has(message.type)) {
			tail.push({ type: message.type, time: message.time, detail: message.detail ?? {} });
		}
	}
	const saved = tail.slice(-200);
	for (const boss of bosses) {
		if (!saved.some((message) => message.type === 'boss-defeated' && message.detail?.levelId === boss.detail.levelId)) {
			saved.push(boss);
		}
	}
	if (peakLifetimeKills > 0 && !saved.some((message) => (message.detail?.lifetimeKills ?? 0) >= peakLifetimeKills)) {
		saved.push({ type: 'lifetime-kills', time: Date.now(), detail: { lifetimeKills: peakLifetimeKills } });
	}
	return saved;
}

export function replaceStream(next) {
	log.length = 0;
	defeatedBosses.clear();
	peakLifetimeKills = 0;
	if (Array.isArray(next)) {
		for (const message of next) {
			if (!message || typeof message.type !== 'string') continue;
			log.push({
				type: message.type,
				time: Number(message.time) || 0,
				detail: message.detail && typeof message.detail === 'object' ? message.detail : {},
				data: message.data && typeof message.data === 'object' ? message.data : null,
			});
			fold(log[log.length - 1]);
		}
	}
	if (log.length > 0) notify(log[log.length - 1]);
}
