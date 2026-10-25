# Clicking-Spree

A little incremental game made in JavaScript.

## Features

- Click **Attack** to earn kills, then spend them on troops and upgrades
- 8 units in the Barracks, from Recruits to B-1 Lancer bombers, each earning kills per second automatically
- Advanced units are crewed by cheaper ones: Marksmen need a Recruit, Heavy Armor needs 3 Marksmen, a B-1 needs 4 Spec Ops, and so on
- Unit prices rise 10% with every purchase
- Recruits roll their kills individually each second, so your income has some randomness
- 6 chained upgrades, each unlocked by buying the previous one:
  - Red Dot Sight and M203 Launcher: up to +20% kills per click
  - Better Drill Instructors: Recruits earn 1 - 3 kills per second instead of 0 - 1
  - M39 EMR: +65% Marksman kills per second
  - Close Air Support: 50% chance of 100000 bonus kills every 5 seconds
  - Double Tap: each click also earns 3% of your kills per second
- Units and upgrades are revealed as your kill count grows
- Save your progress in the browser (localStorage), with an autosave every 15 seconds; it loads automatically next time you open the game
- Plain JavaScript (ES modules) with no dependencies; the whole page is built from the unit and upgrade data in `data.js`

## How to run

The game uses ES modules, which browsers block on `file://`, so serve the folder over HTTP:

```
npx http-server
```

Then open the localhost URL it prints.

## Roadmap

- Add more units and upgrades
- Add original artwork
- Add levels/objectives

## Changelog

- v1.1.1 - refactor the code to be modular
- v1.1 - modernize js, remove jquery
- v1.0 - initial commit
