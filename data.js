export const VERSION = '1.2';

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
		image: { src: 'images/jungle_soldier.gif', className: 'unit-image' },
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
		image: { src: 'images/delta_desert.gif', className: 'unit-image' },
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
		image: { src: 'images/mortar.png', style: { height: 'auto', width: '90px' } },
	},
	{
		id: 'ifv',
		group: 'vehicle',
		name: 'Infantry Fighting Vehicle',
		baseCost: 24750,
		kps: 175,
		needs: { unit: 'recruit', amount: 5, label: 'Recruits' },
		reveal: 3449,
		description: 'An armored infantry fighting vehicle. Crews 5 recruits. First vehicle available.',
		image: { src: 'images/ifv.png', style: { height: 'auto', width: '165px' } },
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
		image: { src: 'images/cs_sas.gif', className: 'unit-image' },
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
		image: { src: 'images/heavy.png', style: { height: 'auto', width: '215px' } },
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
		image: { src: 'images/F15.png', style: { height: 'auto', width: '345px', marginTop: '10px' } },
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
		image: { src: 'images/B-1-09.png' },
	},
];

// Array order is the upgrade chain: each upgrade requires the one before it.
// Effects live in stats() in game.js, keyed by id.
export const UPGRADES = [
	{
		id: 'redDot',
		name: 'Red Dot Sight',
		cost: 125,
		reveal: 0,
		description: 'This upgrade will replace the iron sights on your rifle, allowing greater accuracy and more kills per second with each click.',
		bonus: { before: 'Kills Per Second bonus: ', value: '+5%', after: '' },
		purchasedMessage: 'Red Dot Sight Purchased - 5% Bonus Kills Per Click',
	},
	{
		id: 'm203',
		name: 'M203 Launcher',
		cost: 750,
		reveal: 500,
		description: 'Attach an M203 40MM grenade launcher to the underside of your rifle. Splash damage results in greater enemy casualties.',
		bonus: { before: 'Kills Per Second bonus: ', value: '+15%', after: '' },
		purchasedMessage: 'Grenade Launcher Purchased - 15% Bonus Kills Per Click',
	},
	{
		id: 'drillInstructors',
		name: 'Better Drill Instructors',
		cost: 1950,
		reveal: 1500,
		description: 'Hire better drill instructors for boot camp, resulting in more efficient and effective recruits. Best of all they can aim better!',
		bonus: { before: 'Recruit Kills Per Second: ', value: '1 - 3', after: '' },
		purchasedMessage: 'Better Drill Instructors Purchased - Recruit KPS is now 1 - 3',
	},
	{
		id: 'emr',
		name: 'M39 EMR upgrade',
		cost: 25000,
		reveal: 20000,
		description: 'Replace the old M14 EBR designated marksman rifle with the newer M39 EMRs. Improves accuracy and range for Marksmen.',
		bonus: { before: 'Marksman Kills Per Second bonus: ', value: '+65%', after: '' },
		purchasedMessage: 'EMR Upgrade Purchased - Marksman KPS is now 8.25',
	},
	{
		id: 'closeAirSupport',
		name: 'Close Air Support',
		cost: 250000,
		reveal: 200000,
		description: 'Call in close air support. This upgrade has 50% chance to automatically do 100000 kills every 5 seconds.',
		bonus: { before: '', value: '50% chance, 100000 kills, 5sec cooldown.', after: '' },
		purchasedMessage: 'Close Air Support Purchased - 50% chance to kill 100000 every 5 seconds',
	},
	{
		id: 'doubleTap',
		name: 'Double Tap I',
		cost: 1200000,
		reveal: 1000000,
		description: 'Upgrade your rifle to have a higher fire rate. Each click earns 3% of total Kills Per Second.',
		bonus: { before: 'Earn ', value: '3%', after: ' KPS per click' },
		purchasedMessage: 'Double Tap Purchased - Earn 3% of your total Kills Per Second.',
	},
];



// ======== Experience and levels ========

// XP needed to go from level L to L + 1 is floor(XP_BASE * XP_GROWTH ** (L - 1)).
export const XP_BASE = 100;
export const XP_GROWTH = 1.5;



// ======== Skill tree ========

export const SKILL_BRANCHES = [
	{ id: 'assault', name: 'Assault', description: 'More kills from clicking and from your troops.' },
	{ id: 'intel', name: 'Intel', description: 'Critical hits, better odds, and High-Value Targets.' },
	{ id: 'logistics', name: 'Logistics', description: 'Cheaper units and upgrades.' },
];

// Points that must be spent in a branch before each tier (1 - 4) opens.
export const TIER_REQUIREMENTS = [0, 5, 10, 15];

export const BASE_CRIT_MULTIPLIER = 5;
export const TICK_CRIT_MULTIPLIER = 3;
export const BASE_CAS_CHANCE = 0.5;
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
		description: 'Each click also earns +1% of your KPS per rank. Stacks with Double Tap.',
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
		description: 'Upgrade prices 8% lower per rank.',
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
