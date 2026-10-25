const barracksPanel = document.querySelector('.barracks');
const upgradesPanel = document.querySelector('.upgrades');
const topContent = document.querySelector('.topcontent');
const scrollPoint = 76;

const showPanel = (panel) => {
	barracksPanel.hidden = panel !== barracksPanel;
	upgradesPanel.hidden = panel !== upgradesPanel;
};

showPanel(barracksPanel);

document.querySelector('.barracksh3').addEventListener('click', () => showPanel(barracksPanel));
document.querySelector('.upgradesh3').addEventListener('click', () => showPanel(upgradesPanel));

window.addEventListener('scroll', () => {
	topContent.style.boxShadow = window.scrollY >= scrollPoint ? '0 0 14px rgba(0, 0, 0, 0.7)' : 'none';
});
