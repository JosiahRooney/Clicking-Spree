export const VERSION = '1.13';

// needs: units consumed on purchase. reveal: kills needed before the unit is shown.
// group: which group-specific skills (e.g. Armored Doctrine, Motor Pool) apply to the unit.
export const UNITS = [
	{
		id: 'recruit',
		group: 'infantry',
		name: 'Recruit',
		baseCost: 50,
		kps: 0,
		needs: null,
		reveal: 0,
		description: "A fresh boot right out of basic training. Sometimes hits the target. Recruit a lot of these. You'll need them later for more advanced units.",
		image: 'images/jungle_soldier.gif',
	},
	{
		id: 'marksman',
		group: 'infantry',
		name: 'Marksman',
		baseCost: 350,
		kps: 5,
		needs: { unit: 'recruit', amount: 1, label: 'Recruit' },
		reveal: 74,
		description: 'A more seasoned warrior with higher skills in weaponry. Can become special forces. Requires one recruit.',
		image: 'images/delta_desert.gif',
	},
	{
		id: 'crewWpn',
		group: 'support',
		name: 'Crew-Served Weapon',
		baseCost: 3750,
		kps: 25,
		needs: { unit: 'recruit', amount: 3, label: 'Recruits' },
		reveal: 450,
		description: 'A crew served weapon requires multiple recruits in order to man it.',
		image: 'images/mortar.png',
	},
	{
		id: 'hemet',
		group: 'vehicle',
		name: 'HEMET',
		baseCost: 10_000,
		kps: 0,
		// Supplies per second, before supplyMultiplier. Combat units leave this off.
		sps: 1,
		needs: { unit: 'recruit', amount: 2, label: 'Recruits' },
		reveal: 1500,
		description: 'A HEMET cargo truck. Hauls supplies instead of fighting. Crews 2 recruits.',
		image: 'images/hemet.png',
	},
	{
		id: 'ifv',
		group: 'vehicle',
		name: 'Infantry Fighting Vehicle',
		baseCost: 24750,
		kps: 175,
		needs: { unit: 'recruit', amount: 5, label: 'Recruits' },
		reveal: 3449,
		description: 'An armored infantry fighting vehicle. Crews 5 recruits.',
		image: 'images/ifv.png',
	},
	{
		id: 'specOps',
		group: 'special',
		name: 'Special Forces Operative',
		baseCost: 129500,
		kps: 1250,
		needs: { unit: 'marksman', amount: 1, label: 'Marksman' },
		reveal: 19499,
		description: 'A deadly force on the battlefield. Expensive to train and outfit, but can stealthily engage many enemies without retaliation. Requires a Marksman',
		image: 'images/cs_sas.gif',
	},
	{
		id: 'heavy',
		group: 'vehicle',
		name: 'Heavy Armor',
		baseCost: 1880000,
		kps: 28000,
		needs: { unit: 'marksman', amount: 3, label: 'Marksmen' },
		reveal: 719999,
		description: 'Main battle tank. The heavy muscle of any military. Crews 3 marksmen.',
		image: 'images/heavy.png',
	},
	{
		id: 'f15',
		group: 'aircraft',
		name: 'F-15 Fighter Jet',
		baseCost: 14990000,
		kps: 145500,
		needs: { unit: 'specOps', amount: 1, label: 'Spec Ops' },
		reveal: 2900000,
		description: "The F-15 is an air superiority fighter jet. It's fast, expensive, and deadly. It requires one well trained soldier to pilot it.",
		image: 'images/F15.png',
	},
	{
		id: 'b1b',
		group: 'aircraft',
		name: 'B-1 Lancer Bomber',
		baseCost: 145670000,
		kps: 2567000,
		needs: { unit: 'specOps', amount: 4, label: 'Spec Ops' },
		reveal: 29000000,
		description: 'The B-1 Lancer is a four-engine supersonic variable-sweep wing, jet-powered strategic bomber. This powerful aircraft requires 4 specialists to crew it.',
		image: 'images/B-1-09.png',
	},
];

// ======== Buildings ========

// Bought with supplies. Each one produces its unit for free (no crew used).
// seconds: time for one building to produce one unit. Every extra building adds BUILDING_SPEEDUP of the
// first one's rate, so time per unit = seconds / (1 + BUILDING_SPEEDUP * (count - 1)): 5s, 4s, 3.3s, ...
// Past one unit per second, the leftover rate carries over and more units come out each second.
export const BUILDING_COST_GROWTH = 1.15;
export const BUILDING_SPEEDUP = 0.25;
export const BUILDINGS = [
	{ id: 'barracks', unit: 'recruit', label: ['Recruit', 'Recruits'], name: 'Barracks', baseCost: 10, seconds: 5, description: 'Bunks, a drill field and a sergeant who never sleeps. Turns out fresh Recruits.' },
	{ id: 'firingRange', unit: 'marksman', label: ['Marksman', 'Marksmen'], name: 'Firing Range', baseCost: 60, seconds: 15, description: 'Long lanes and steel targets. Trains Marksmen without using up your Recruits.' },
	{ id: 'armory', unit: 'crewWpn', label: ['Crew-Served Weapon', 'Crew-Served Weapons'], name: 'Armory', baseCost: 300, seconds: 30, description: 'Assembles and crews heavy weapons. Produces Crew-Served Weapons, crew included.' },
	{ id: 'supplyDepot', unit: 'hemet', label: ['HEMET', 'HEMETs'], name: 'Supply Depot', baseCost: 600, seconds: 45, description: 'Fuel, ramps, and a loading crew. Rolls out HEMET cargo trucks, crew included.' },
	{ id: 'vehicleDepot', unit: 'ifv', label: ['IFV', 'IFVs'], name: 'Vehicle Depot', baseCost: 1_000, seconds: 60, description: 'A maintenance yard that rolls out crewed Infantry Fighting Vehicles.' },
	{ id: 'trainingCompound', unit: 'specOps', label: ['Operative', 'Operatives'], name: 'Training Compound', baseCost: 5_000, seconds: 90, description: 'A secluded selection course that graduates Special Forces Operatives.' },
	{ id: 'tankFactory', unit: 'heavy', label: ['Tank', 'Tanks'], name: 'Tank Factory', baseCost: 50_000, seconds: 150, description: 'An assembly line for main battle tanks, delivered with a full crew.' },
	{ id: 'airfield', unit: 'f15', label: ['F-15', 'F-15s'], name: 'Airfield', baseCost: 500_000, seconds: 210, description: 'Runways, hangars and pilots. Launches F-15 Fighter Jets.' },
	{ id: 'bomberHangar', unit: 'b1b', label: ['B-1', 'B-1s'], name: 'Bomber Hangar', baseCost: 5_000_000, seconds: 300, description: 'A strategic hangar that fields a crewed B-1 Lancer every five minutes.' },
];

// Seconds between attacks with nothing equipped. Barrel and magazine speed multipliers shrink this.
export const BASE_ATTACK_COOLDOWN = 0.5;
// Rounds in an empty magazine slot, and seconds to refill it.
export const BASE_MAG_ROUNDS = 30;
export const BASE_RELOAD_SECONDS = 2;

// One attachment equipped per slot. effect.click adds to the base 1 kill per click,
// effect.speed multiplies the attack cooldown (lower is faster), effect.crit adds crit chance.
// effect.magazine sets rounds in the mag and a reload-time multiplier (lower is faster).
export const WEAPON_SLOTS = [
	{ id: 'muzzle', name: 'Muzzle' },
	{ id: 'barrel', name: 'Barrel' },
	{ id: 'accessory', name: 'Accessory' },
	{ id: 'underbarrel', name: 'Underbarrel' },
	{ id: 'magazine', name: 'Magazine' },
	{ id: 'sight', name: 'Sight' },
	{ id: 'stock', name: 'Stock' },
];

export const ATTACHMENTS = [
	{ id: 'flashHider', slot: 'muzzle', name: 'Flash Hider', cost: 100, reveal: 0, description: 'A short cage on the muzzle. A little extra bite per shot.', effect: { type: 'click', amount: 0.15 } },
	{ id: 'suppressor', slot: 'muzzle', name: 'Suppressor', cost: 800, reveal: 400, description: 'A long can. The shot hits harder and stays quiet.', effect: { type: 'click', amount: 0.35 } },
	{ id: 'muzzleBrake', slot: 'muzzle', name: 'Muzzle Brake', cost: 5_000, reveal: 4_000, description: 'Vents that slam the blast sideways. The hardest-hitting muzzle.', effect: { type: 'click', amount: 0.6 } },

	{ id: 'basicBarrel', slot: 'barrel', name: 'Basic Barrel', cost: 0, reveal: 0, starter: true, description: 'The barrel the rifle shipped with.', effect: { type: 'none' } },
	{ id: 'shortBarrel', slot: 'barrel', name: 'Short Barrel', cost: 250, reveal: 50, description: 'A chopped barrel. Quicker to bring back on target.', effect: { type: 'speed', amount: 0.9 } },
	{ id: 'longBarrel', slot: 'barrel', name: 'Long Barrel', cost: 2_000, reveal: 1_500, description: 'More length, a faster follow-up shot.', effect: { type: 'speed', amount: 0.75 } },
	{ id: 'heavyBarrel', slot: 'barrel', name: 'Heavy Barrel', cost: 20_000, reveal: 15_000, description: 'A thick profile that settles fast. The quickest barrel.', effect: { type: 'speed', amount: 0.6 } },

	{ id: 'laser', slot: 'accessory', name: 'Laser', cost: 400, reveal: 200, description: 'A visible aiming dot. A few more shots land as crits.', effect: { type: 'crit', amount: 0.02 } },
	{ id: 'light', slot: 'accessory', name: 'Light', cost: 3_500, reveal: 3_000, description: 'A weapon light. Targets stand out, and crits come more often.', effect: { type: 'crit', amount: 0.04 } },
	{ id: 'rangefinder', slot: 'accessory', name: 'Rangefinder', cost: 80_000, reveal: 60_000, description: 'Reads the range before you fire. The best crit chance on the rail.', effect: { type: 'crit', amount: 0.08 } },

	{ id: 'grip', slot: 'underbarrel', name: 'Grip', cost: 600, reveal: 300, description: 'A vertical grip. Steadier shots, a bit more damage.', effect: { type: 'click', amount: 0.25 } },
	{ id: 'bipod', slot: 'underbarrel', name: 'Bipod', cost: 6_000, reveal: 5_000, description: 'Plants the rifle. Hits land harder.', effect: { type: 'click', amount: 0.5 } },
	{ id: 'grenadeLauncher', slot: 'underbarrel', name: 'Grenade Launcher', cost: 50_000, reveal: 40_000, description: 'A 40mm launcher under the barrel. Splash damage, by far the hardest hit.', effect: { type: 'click', amount: 1.5 } },

	{ id: 'basicMag', slot: 'magazine', name: 'Basic Mag', cost: 0, reveal: 0, starter: true, description: 'The 30-round magazine that came with the rifle.', effect: { type: 'magazine', rounds: 30, reload: 1 } },
	{ id: 'fastMag', slot: 'magazine', name: 'Fast Mag', cost: 350, reveal: 100, description: 'A speed magazine. Still 30 rounds, but it seats in half the time.', effect: { type: 'magazine', rounds: 30, reload: 0.5 } },
	{ id: 'regularMag', slot: 'magazine', name: 'Regular Mag', cost: 2_500, reveal: 2_000, description: 'A 60-round magazine. Twice as many shots before the reload.', effect: { type: 'magazine', rounds: 60, reload: 1 } },
	{ id: 'heavyMag', slot: 'magazine', name: 'Heavy Mag', cost: 40_000, reveal: 30_000, description: 'A 120-round magazine. The longest belt before you have to reload.', effect: { type: 'magazine', rounds: 120, reload: 1 } },

	{ id: 'ironSights', slot: 'sight', name: 'Iron Sights', cost: 0, reveal: 0, starter: true, description: 'The rifle\'s iron sights. Plain, and always there.', effect: { type: 'none' } },
	{ id: 'redDot', slot: 'sight', name: 'Red Dot Sight', cost: 125, reveal: 0, description: 'A red dot in place of the iron sights. Crits start to land.', effect: { type: 'crit', amount: 0.03 } },
	{ id: 'acog', slot: 'sight', name: 'ACOG Scope', cost: 15_000, reveal: 10_000, description: 'A fixed combat optic. Crits come more often.', effect: { type: 'crit', amount: 0.06 } },
	{ id: 'scope6x', slot: 'sight', name: '6x Scope', cost: 150_000, reveal: 100_000, description: 'A magnified scope. Much more likely to crit.', effect: { type: 'crit', amount: 0.1 } },
	{ id: 'nvScope', slot: 'sight', name: 'NV Scope', cost: 2_000_000, reveal: 1_500_000, description: 'A night-vision scope. The highest crit chance of any sight.', effect: { type: 'crit', amount: 0.14 } },

	{ id: 'basicStock', slot: 'stock', name: 'Basic Stock', cost: 0, reveal: 0, starter: true, description: 'The stock the rifle shipped with.', effect: { type: 'none' } },
	{ id: 'foldingStock', slot: 'stock', name: 'Folding Stock', cost: 1_000, reveal: 800, description: 'A compact stock. A modest boost to each shot.', effect: { type: 'click', amount: 0.2 } },
	{ id: 'rifleStock', slot: 'stock', name: 'Rifle Stock', cost: 25_000, reveal: 20_000, description: 'A solid stock that puts more of the shot on target.', effect: { type: 'click', amount: 0.45 } },
	{ id: 'sniperStock', slot: 'stock', name: 'Sniper Stock', cost: 1_000_000, reveal: 800_000, description: 'A precision stock. The strongest stock bonus to click damage.', effect: { type: 'click', amount: 0.8 } },
];



// ======== Experience and levels ========

// XP needed to go from level L to L + 1 is floor(XP_BASE * XP_GROWTH ** (L - 1)).
export const XP_BASE = 100;
export const XP_GROWTH = 1.5;



// ======== Skill tree ========

export const SKILL_BRANCHES = [
	{ id: 'assault', name: 'Assault', description: 'More kills from clicking and from your troops.' },
	{ id: 'intel', name: 'Intel', description: 'Critical hits, better odds, and High-Value Targets.' },
	{ id: 'logistics', name: 'Logistics', description: 'Cheaper units and attachments.' },
];

// Points that must be spent in a branch before each tier (1 - 4) opens.
export const TIER_REQUIREMENTS = [0, 5, 10, 15];

export const BASE_CRIT_MULTIPLIER = 5;
export const TICK_CRIT_MULTIPLIER = 3;
export const BASE_CAS_CHANCE = 0.5;
export const CAS_KILLS = 100000;
// Seconds between Close Air Support rolls. main.js runs the timer.
export const CAS_INTERVAL = 5;
export const HVT = {
	minInterval: 60,
	maxInterval: 120,
	duration: 10,
	rewardSeconds: 60,
	minReward: 100,
	// Per rank of Target Analysis
	analysisFrequency: 0.15,
	analysisReward: 0.5,
};

// effect.amount is applied once per rank. Percentage bonuses add up within a type;
// discounts (type ending in "Discount") multiply together so a price never reaches zero.
export const SKILLS = [
	// Assault
	{
		id: 'marksmanship', branch: 'assault', tier: 1, maxRank: 5, name: 'Marksmanship',
		description: '+10% kills per click per rank.',
		effect: { type: 'clickBonus', amount: 0.10 },
	},
	{
		id: 'fireDiscipline', branch: 'assault', tier: 1, maxRank: 5, name: 'Fire Discipline',
		description: '+5% to all KPS per rank.',
		effect: { type: 'kpsBonus', amount: 0.05 },
	},
	{
		id: 'infantryDrills', branch: 'assault', tier: 2, maxRank: 3, name: 'Infantry Drills',
		description: '+25% Recruit and Marksman KPS per rank.',
		effect: { type: 'groupKpsBonus', group: 'infantry', amount: 0.25 },
	},
	{
		id: 'armoredDoctrine', branch: 'assault', tier: 2, maxRank: 3, name: 'Armored Doctrine',
		description: '+15% IFV and Heavy Armor KPS per rank.',
		effect: { type: 'groupKpsBonus', group: 'vehicle', amount: 0.15 },
	},
	{
		id: 'airSuperiority', branch: 'assault', tier: 3, maxRank: 3, name: 'Air Superiority',
		description: '+20% F-15 and B-1 KPS per rank.',
		effect: { type: 'groupKpsBonus', group: 'aircraft', amount: 0.20 },
	},
	{
		id: 'rapidFire', branch: 'assault', tier: 3, maxRank: 3, name: 'Rapid Fire',
		description: 'Each click also earns +1% of your KPS per rank.',
		effect: { type: 'clickKpsShare', amount: 0.01 },
	},
	{
		id: 'shockAndAwe', branch: 'assault', tier: 4, maxRank: 1, name: 'Shock and Awe',
		description: '+25% to all kills from every source.',
		effect: { type: 'allKillsBonus', amount: 0.25 },
	},

	// Intel
	{
		id: 'spotter', branch: 'intel', tier: 1, maxRank: 5, name: 'Spotter',
		description: '+2% chance per rank for a click to be a critical hit (5x kills).',
		effect: { type: 'critChance', amount: 0.02 },
	},
	{
		id: 'fieldReports', branch: 'intel', tier: 1, maxRank: 2, name: 'Field Reports',
		description: 'Recruits roll one extra time per rank each second and keep the best roll.',
		effect: { type: 'recruitRolls', amount: 1 },
	},
	{
		id: 'ballisticsData', branch: 'intel', tier: 2, maxRank: 3, name: 'Ballistics Data',
		description: '+2x critical hit multiplier per rank.',
		effect: { type: 'critMultiplier', amount: 2 },
	},
	{
		id: 'airLiaison', branch: 'intel', tier: 2, maxRank: 3, name: 'Air Liaison',
		description: '+10% Close Air Support success chance per rank.',
		effect: { type: 'casChance', amount: 0.10 },
	},
	{
		id: 'highValueTargets', branch: 'intel', tier: 3, maxRank: 1, name: 'High-Value Targets',
		description: 'A target appears every 60 - 120 seconds for 10 seconds. Click it for 60 seconds of KPS (at least 100 kills).',
		effect: { type: 'hvtUnlock', amount: 1 },
	},
	{
		id: 'targetAnalysis', branch: 'intel', tier: 3, maxRank: 3, name: 'Target Analysis', requires: 'highValueTargets',
		description: 'Targets appear 15% more often and are worth 50% more per rank.',
		effect: { type: 'hvtAnalysis', amount: 1 },
	},
	{
		id: 'signalsIntelligence', branch: 'intel', tier: 4, maxRank: 1, name: 'Signals Intelligence',
		description: 'Each KPS tick has a 5% chance to be a critical hit for 3x.',
		effect: { type: 'tickCritChance', amount: 0.05 },
	},

	// Logistics
	{
		id: 'bulkRecruiting', branch: 'logistics', tier: 1, maxRank: 5, name: 'Bulk Recruiting',
		description: 'Recruit and Marksman prices 4% lower per rank.',
		effect: { type: 'groupDiscount', group: 'infantry', amount: 0.04 },
	},
	{
		id: 'supplyLines', branch: 'logistics', tier: 1, maxRank: 5, name: 'Supply Lines',
		description: 'All unit prices 2% lower per rank.',
		effect: { type: 'unitDiscount', amount: 0.02 },
	},
	{
		id: 'procurement', branch: 'logistics', tier: 2, maxRank: 3, name: 'Procurement',
		description: 'Attachment prices 8% lower per rank.',
		effect: { type: 'upgradeDiscount', amount: 0.08 },
	},
	{
		id: 'motorPool', branch: 'logistics', tier: 2, maxRank: 3, name: 'Motor Pool',
		description: 'IFV and Heavy Armor prices 6% lower per rank.',
		effect: { type: 'groupDiscount', group: 'vehicle', amount: 0.06 },
	},
	{
		id: 'efficientCrews', branch: 'logistics', tier: 3, maxRank: 1, name: 'Efficient Crews',
		description: 'Units that use crew need 1 fewer (minimum 1).',
		effect: { type: 'crewReduction', amount: 1 },
	},
	{
		id: 'priceControls', branch: 'logistics', tier: 3, maxRank: 3, name: 'Price Controls',
		description: 'Price growth per purchase drops by 0.01 per rank (1.10 to 1.07).',
		effect: { type: 'costGrowthReduction', amount: 0.01 },
	},
	{
		id: 'airForceBudget', branch: 'logistics', tier: 4, maxRank: 1, name: 'Air Force Budget',
		description: 'F-15 and B-1 prices 20% lower.',
		effect: { type: 'groupDiscount', group: 'aircraft', amount: 0.20 },
	},
];



// ======== World map ========

// Displayed boss power is off by up to this fraction either way (fixed per level), so matchups aren't exact.
export const BOSS_POWER_FUZZ = 0.1;
// Share of current (spendable) kills lost when a boss fight runs out of time.
export const BOSS_RETREAT_PENALTY = 0.2;

// Array order is the unlock chain: each level needs the one before it cleared; the first level is always open.
// killsRequired counts kills earned while the level is active. boss.seconds is the fight's time limit.
// Boss power is hp / seconds. hp is sized from a simulated playthrough (clicking 5/s, buying the best
// power per kill, farming the latest cleared level for supplies and buying buildings) so that after
// reaching killsRequired, a typical player grinds about 30 seconds on the first level, ramping to about
// 5 minutes on the last, before their power matches the boss. From Zone 3 on, the grind assumes buildings:
// without farming, late bosses take far longer.
export const ZONES = [
	{
		id: 'desert', name: 'Operation Desert Anvil', faction: 'Insurgent Militia',
		clickBonus: 0,
		levels: [
			{ id: 'desert1', name: 'Checkpoint Raid', killsRequired: 100, boss: { name: 'Militia Captain', hp: 240, seconds: 30 } },
			{ id: 'desert2', name: 'Supply Route', killsRequired: 500, boss: { name: 'Convoy Commander', hp: 1_300, seconds: 30 } },
			{ id: 'desert3', name: 'Oasis Compound', killsRequired: 2000, boss: { name: 'Arms Dealer', hp: 6_900, seconds: 30 } },
			{ id: 'desert4', name: 'Mountain Caves', killsRequired: 5000, boss: { name: 'Militia Warlord', hp: 13_000, seconds: 30 } },
		],
	},
	{
		id: 'jungle', name: 'Operation Jungle Viper', faction: 'Guerrilla Cartel',
		clickBonus: 50,
		levels: [
			{ id: 'jungle1', name: 'River Crossing', killsRequired: 20000, boss: { name: 'Sniper Nest', hp: 280_000, seconds: 35 } },
			{ id: 'jungle2', name: 'Hidden Airstrip', killsRequired: 60000, boss: { name: 'Smuggler Pilot', hp: 3_300_000, seconds: 35 } },
			{ id: 'jungle3', name: 'Cartel Plantation', killsRequired: 150000, boss: { name: 'Enforcer', hp: 170_000_000, seconds: 35 } },
			{ id: 'jungle4', name: 'Temple Fortress', killsRequired: 400000, boss: { name: 'Cartel Kingpin', hp: 16_000_000_000, seconds: 35 } },
		],
	},
	{
		id: 'tundra', name: 'Operation Iron Frost', faction: 'Northern Mechanized Army',
		clickBonus: 500,
		levels: [
			{ id: 'tundra1', name: 'Frozen Outpost', killsRequired: 1000000, boss: { name: 'Recon Battalion', hp: 26_000_000_000, seconds: 40 } },
			{ id: 'tundra2', name: 'Rail Yard', killsRequired: 3000000, boss: { name: 'Armored Train', hp: 32_000_000_000, seconds: 40 } },
			{ id: 'tundra3', name: 'Missile Silo', killsRequired: 8000000, boss: { name: 'Silo Commander', hp: 37_000_000_000, seconds: 40 } },
			{ id: 'tundra4', name: 'Iron Citadel', killsRequired: 20000000, boss: { name: 'Tank General', hp: 43_000_000_000, seconds: 40 } },
		],
	},
	{
		id: 'blackSky', name: 'Operation Black Sky', faction: 'Rogue Superpower Command',
		clickBonus: 0,
		levels: [
			{ id: 'blackSky1', name: 'Coastal Radar', killsRequired: 50000000, boss: { name: 'Air Defense Grid', hp: 57_000_000_000, seconds: 45 } },
			{ id: 'blackSky2', name: 'Carrier Group', killsRequired: 150000000, boss: { name: 'Fleet Admiral', hp: 66_000_000_000, seconds: 45 } },
			{ id: 'blackSky3', name: 'Command Bunker', killsRequired: 400000000, boss: { name: 'Strategic Command', hp: 75_000_000_000, seconds: 45 } },
			{ id: 'blackSky4', name: 'Capital Strike', killsRequired: 1000000000, boss: { name: 'Supreme Commander', hp: 85_000_000_000, seconds: 45 } },
		],
	},
];

// ======== Supplies ========

// First-clear supplies = killsRequired * SUPPLY_RATE * SUPPLY_LEVEL_GROWTH ** levelIndex (2 significant digits).
// The growth term makes later levels pay more supplies per kill, so farming early levels is never the best option.
export const SUPPLY_RATE = 0.1;
export const SUPPLY_LEVEL_GROWTH = 1.25;
// A repeat clear (no boss) pays this share of the first-clear reward.
export const REPEAT_CLEAR_SHARE = 0.1;

const roundTo2 = (n) => {
	const magnitude = 10 ** (Math.floor(Math.log10(n)) - 1);
	return Math.round(n / magnitude) * magnitude;
};

// Flat, ordered list of every level, with its zone and position for labels like "Zone 1 - Level 2".
export const LEVELS = ZONES
	.flatMap((zone, z) => zone.levels.map((level, l) => ({
		...level, zone: zone.id, zoneNumber: z + 1, levelNumber: l + 1, zoneClickBonus: zone.clickBonus ?? 0,
	})))
	.map((level, index) => ({
		...level,
		supplies: roundTo2(level.killsRequired * SUPPLY_RATE * SUPPLY_LEVEL_GROWTH ** index),
	}));



// ======== Perks and prestige ========

// Lifetime kills for each unpaid threshold. The first is 1,000,000, and each one after that is 5× higher.
export const PRESTIGE_BASE_KILLS = 1_000_000;
export const PRESTIGE_KILL_GROWTH = 5;

export const prestigeKillsRequired = (index) => PRESTIGE_BASE_KILLS * PRESTIGE_KILL_GROWTH ** index;

// Points that threshold pays: 1, then 2, then 4, ...
export const thresholdPoints = (index) => 2 ** index;

// How many thresholds `kills` has reached, not counting the `from` already claimed.
export const thresholdsReached = (kills, from = 0) => {
	let index = from;
	while (index < 40 && kills >= prestigeKillsRequired(index)) index += 1;
	return index;
};

// Sum of the points for every threshold from `from` up to, but not including, the first one still ahead.
export const prestigePoints = (kills, from = 0) => {
	const reached = thresholdsReached(kills, from);
	return reached <= from ? 0 : thresholdPoints(reached) - thresholdPoints(from);
};

// Every unowned perk costs the same. With `owned` already bought, the next one costs 2^owned: 1, then 2, then 4, ...
export const perkCost = (owned) => 2 ** owned;

// One purchase each, in any order. effect.amount is applied while the perk is owned.
export const PERKS = [
	{
		id: 'extraDrill', name: 'Extra Drill',
		description: 'Recruits roll one extra time each second and keep the best roll.',
		effect: { type: 'recruitRolls', amount: 1 },
	},
	{
		id: 'speedReload', name: 'Speed Reload',
		description: 'Reload time is 25% shorter.',
		effect: { type: 'reloadMultiplier', amount: 0.75 },
	},
	{
		id: 'zeroing', name: 'Zeroing',
		description: 'Click damage is 50% higher.',
		effect: { type: 'clickMultiplier', amount: 1.5 },
	},
	{
		id: 'cadre', name: 'Cadre',
		description: 'Each prestige starts you with 15 Recruits. Buying this does not spawn them; the next prestige does. They are not purchases, so the price does not rise.',
		effect: { type: 'startingRecruits', amount: 15 },
	},
	{
		id: 'immediateAction', name: 'Immediate Action',
		description: 'A 50% chance that emptying the magazine refills it with no reload.',
		effect: { type: 'skipReload', amount: 0.5 },
	},
	{
		id: 'warCollege', name: 'War College',
		description: 'Double XP. Kills, lifetime kills, and map progress are unchanged.',
		effect: { type: 'xpMultiplier', amount: 2 },
	},
	{
		id: 'priorityShipping', name: 'Priority Shipping',
		description: 'Double supplies from trucks, first clears, and repeat clears.',
		effect: { type: 'supplyMultiplier', amount: 2 },
	},
	{
		id: 'fiveFinger', name: 'Five-Finger Discount',
		description: 'Every 5th purchase of each building is free.',
		effect: { type: 'freeFifth', amount: 5 },
	},
	{
		id: 'massConscription', name: 'Mass Conscription',
		description: 'Buying a unit enlists two for the price and crew of one.',
		effect: { type: 'doubleEnlist', amount: 2 },
	},
	{
		id: 'doubleShift', name: 'Double Shift',
		description: 'Buildings produce units twice as fast.',
		effect: { type: 'buildingSpeed', amount: 2 },
	},
	{
		id: 'sentry', name: 'Sentry',
		description: 'Attack fires on its own. You can still click.',
		effect: { type: 'autoAttack', amount: 1 },
	},
	{
		id: 'bulkBuy', name: 'Bulk Buy',
		description: 'Unit prices are half.',
		effect: { type: 'unitCostMultiplier', amount: 0.5 },
	},
	{
		id: 'drumMag', name: 'Drum Mag',
		description: 'Magazine size is doubled.',
		effect: { type: 'magazineMultiplier', amount: 2 },
	},
	{
		id: 'fullAuto', name: 'Full Auto',
		description: 'Attack cooldown is half.',
		effect: { type: 'cooldownMultiplier', amount: 0.5 },
	},
	{
		id: 'glassJaw', name: 'Glass Jaw',
		description: 'Bosses have 1/4 of their health.',
		effect: { type: 'bossHpMultiplier', amount: 0.25 },
	},
	{
		id: 'combinedArms', name: 'Combined Arms',
		description: 'Troop kills per second are doubled.',
		effect: { type: 'kpsMultiplier', amount: 2 },
	},
	{
		id: 'longSiege', name: 'Long Siege',
		description: 'Boss fights last twice as long.',
		effect: { type: 'bossTimeMultiplier', amount: 2 },
	},
	{
		id: 'skeletonCrews', name: 'Skeleton Crews',
		description: 'Units that use crew need 1 fewer (minimum 1).',
		effect: { type: 'crewReduction', amount: 1 },
	},
	{
		id: 'priceFreeze', name: 'Price Freeze',
		description: 'Unit price growth per purchase drops from 1.10 to 1.05.',
		effect: { type: 'costGrowthReduction', amount: 0.05 },
	},
	{
		id: 'totalWar', name: 'Total War',
		description: '+100% kills from every source.',
		effect: { type: 'allKillsBonus', amount: 1 },
	},
];
