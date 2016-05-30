<!DOCTYPE html>
<html>
<head>
<title>
	Clicking Spree
</title>
<meta name="description" content="A modern military themed incremental game for people who are very bored. This game is better than Call of Duty.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" type="text/css" href="style.css" />
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
<link href='http://fonts.googleapis.com/css?family=Special+Elite' rel='stylesheet' type='text/css'>
<link href='http://fonts.googleapis.com/css?family=Share' rel='stylesheet' type='text/css'>

<meta property="og:title" content="Clicking Spree v1.0" />
<meta property="og:description" content="A modern military themed incremental game for people who are very bored. This game is better than Call of Duty." />
<meta property="og:image" content="http://norcadesign.com/projects/clickingspree/images/warlogo.jpg"/>
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-44897668-1', 'auto');
  ga('send', 'pageview');

</script>
</head>
<body>

<div class="mainwrap">
<div class="maincontent">
	<div class="topcontent">
		<div class="menu">
			<button disabled type="button">
				Load (coming soon)
			</button>
			<button disabled type="button">
				Save (coming soon)
			</button>
		</div>
		
		<h1>Clicking Spree</h1>
		<span class="headerspan">v1.0</span>

		<img src="images/warlogo.jpg" class="warlogo" alt="image of war">

		<p>Click the button to attack enemies and earn kills. Spend kills on troops and upgrades. </p>

		<button class="clicker" onclick="addc(1)" type="button">
			Attack
		</button>

		<div class="killz">
			You have <span id="kills">0.00</span> kills.<br>
			You have <span id="kps">0.00</span> kills per second (KPS).
		</div>
	</div>
	<div class="bottomcontent">

	<h3 class="barracksh3">
		Barracks
	</h3>
	<h3 class="upgradesh3">
		Upgrades
	</h3>
	<div class="barracks">
		<ul style="padding:0 15px;">
			<li>
				Click the buttons to enlist new troops. New options will appear as you earn more kills.
			</li>
			<li class="boot">
				<button class="buyRecruit" onclick="buyRecruit()" type="button">
					Recruit
				</button>
				<p class="desc">A fresh boot right out of basic training. Sometimes hits the target. Recruit a lot of these. You'll need them later for more advanced units.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span id="bootCost">50</span> kills
						</td>
					</tr>
					<tr>
						<td>
							Have:
						</td>
						<td>
							<span id="boots">0</span>
						</td>
					</tr>
				</table>
				<p>Kill Per Second: <span id="bootPwr">0 - 1</span></p>
			</li>
			<img src="images/jungle_soldier.gif" style="margin:10px;">

			<li class="marksman">
				<button class="buyMarksman" onclick="buyMarksman()" type="button">
					Marksman
				</button>
				<p class="desc">A more seasoned warrior with higher skills in weaponry. Can become special forces. Requires one recruit.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span id="mmCost">350</span> kills<br> <span>1</span> Recruit
						</td>
					</tr>
					<tr>
						<td>
							Have:
						</td>
						<td>
							<span id="mm">0</span>
						</td>
					</tr>
				</table>
				<p>Kill Per Second: <span id="mmPwr">5</span></p>
				<img src="images/delta_desert.gif" style="margin:10px;">
			</li>
			

			<li class="cwpn">
				<button class="buyCrewWpn" onclick="buyCrewWpn()" type="button">
					Crew-Served Weapon
				</button>
				<p class="desc">A crew served weapon requires multiple recruits in order to man it.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span id="cswCost">3750</span> kills<br> <span>3</span> Recruits
						</td>
					</tr>
					<tr>
						<td>
							Have:
						</td>
						<td>
							<span id="csw">0</span>
						</td>
					</tr>
				</table>
				<p>Kills Per Second: <span>25</span></p>
				<img src="images/mortar.png" style="height: auto; width: 90px;">
			</li>
			

			<li class="ifvs">
				<button class="buyIFV" onclick="buyIFV()" type="button">
					Infantry Fighting Vehicle
				</button>
				<p class="desc">An armored infantry fighting vehicle. Crews 5 recruits. First vehicle available.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span id="ifvCost">24750</span> kills<br> <span>5</span> Recruits
						</td>
					</tr>
					<tr>
						<td>
							Have:
						</td>
						<td>
							<span id="ifv">0</span>
						</td>
					</tr>
				</table>
				<p>Kills Per Second: <span>175</span></p>
			<img src="images/ifv.png" style="height: auto;width: 165px;">
			</li>

			<li class="specops">
				<button class="buySpecOps" onclick="buySpecOps()" type="button">
					Special Forces Operative
				</button>
				<p class="desc">A deadly force on the battlefield. Expensive to train and outfit, but can stealthily engage many enemies without retaliation. Requires a Marksman</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span id="spcCost">129,500</span> kills<br> <span>1</span> Marksman
						</td>
					</tr>
					<tr>
						<td>
							Have:
						</td>
						<td>
							<span id="spc">0</span>
						</td>
					</tr>
				</table>
				<p>Kills Per Second: <span>1250</span></p>
			<img src="images/cs_sas.gif" style="margin:10px;">
			</li>

			<li class="heavy">
				<button class="buyHeavy" onclick="buyHeavy()" type="button">
					Heavy Armor
				</button>
				<p class="desc">Main battle tank. The heavy muscle of any military. Crews 3 marksmen.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span id="hvyCost">1,880,000</span> kills<br> <span>3</span> Marksmen
						</td>
					</tr>
					<tr>
						<td>
							Have:
						</td>
						<td>
							<span id="hvy">0</span>
						</td>
					</tr>
				</table>
				<p>Kills Per Second: <span>28,000</span></p>
			<img src="images/heavy.png" style="height: auto;width: 215px;">
			</li>

			<li class="f15">
				<button class="buyF15" onclick="buyF15()" type="button">
					F-15 Fighter Jet
				</button>
				<p class="desc">The F-15 is an air superiority fighter jet. It's fast, expensive, and deadly. It requires one well trained soldier to pilot it.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span id="f15Cost">14,990,000</span> kills<br> <span>1</span> Spec Ops
						</td>
					</tr>
					<tr>
						<td>
							Have:
						</td>
						<td>
							<span id="f15">0</span>
						</td>
					</tr>
				</table>
				<p>Kills Per Second: <span>145,500</span></p>
			<img src="http://i.imgur.com/aawzVE9.png" style="height: auto; width: 345px; margin-top: 10px;">
			</li>

			<li class="b1b">
				<button class="buyB1B" onclick="buyB1B()" type="button">
					B-1 Lancer Bomber
				</button>
				<p class="desc">The B-1 Lancer is a four-engine supersonic variable-sweep wing, jet-powered strategic bomber. This powerful aircraft requires 4 specialists to crew it.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span id="b1bCost">145,670,000</span> kills<br> <span>4</span> Spec Ops
						</td>
					</tr>
					<tr>
						<td>
							Have:
						</td>
						<td>
							<span id="b1b">0</span>
						</td>
					</tr>
				</table>
				<p>Kills Per Second: <span>2,567,000</span></p>
			<img src="images/B-1-09.png">
			</li>


			<li></li>
		</ul>
	</div>
	<!-- End Barracks -->
	
	<div class="upgrades">
		<ul style="padding:0 15px;">
			<li>
				Click the buttons to upgrade yourself and your troops. New options will appear as you earn more kills.
			</li>
			<li class="upgrade1" id="upgrade1">
				<button class="buyUpgrade1" onclick="buyUpgrade1()" type="button">
					Red Dot Sight
				</button>
				<p class="desc">This upgrade will replace the iron sights on your rifle, allowing greater accuracy and more kills per second with each click.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span>125</span> kills
						</td>
					</tr>
				</table>
				<p>Kills Per Second bonus: <span>+5%</span></p>
			</li>

			<li class="upgrade2" id="upgrade2">
				<button class="buyUpgrade2" onclick="buyUpgrade2()" type="button">
					M203 Launcher
				</button>
				<p class="desc">Attach an M203 40MM grenade launcher to the underside of your rifle. Splash damage results in greater enemy casualties.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span>750</span> kills
						</td>
					</tr>
				</table>
				<p>Kills Per Second bonus: <span>+15%</span></p>
			</li>

			<li class="upgrade3" id="upgrade3">
				<button class="buyUpgrade3" onclick="buyUpgrade3()" type="button">
					Better Drill Instructors
				</button>
				<p class="desc">Hire better drill instructors for boot camp, resulting in more efficient and effective recruits. Best of all they can aim better!</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span>1950</span> kills
						</td>
					</tr>
				</table>
				<p>Recruit Kills Per Second: <span>1 - 3</span></p>
			</li>

			<li class="upgrade4" id="upgrade4">
				<button class="buyUpgrade4" onclick="buyUpgrade4()" type="button">
					M39 EMR upgrade
				</button>
				<p class="desc">Replace the old M14 EBR designated marksman rifle with the newer M39 EMRs. Improves accuracy and range for Marksmen.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span>25000</span> kills
						</td>
					</tr>
				</table>
				<p>Marksman Kills Per Second bonus: <span>+65%</span></p>
			</li>

			<li class="upgrade5" id="upgrade5">
				<button class="buyUpgrade5" onclick="buyUpgrade5()" type="button">
					Close Air Support
				</button>
				<p class="desc">Call in close air support. This upgrade has 50% chance to automatically do 100,000 kills every 5 seconds.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span>250000</span> kills
						</td>
					</tr>
				</table>
				<p><span>50% chance, 100,000 kills, 5sec cooldown.</span></p>
			</li>

			<li class="upgrade6" id="upgrade6">
				<button class="buyUpgrade6" onclick="buyUpgrade6()" type="button">
					Double Tap I
				</button>
				<p class="desc">Upgrade your rifle to have a higher fire rate. Each click earns 3% of total Kills Per Second.</p>
				<table style="margin-top:10px;">
					<tr>
						<td>
							Cost:
						</td>
						<td>
							<span>1200000</span> kills
						</td>
					</tr>
				</table>
				<p>Earn <span>3%</span> KPS per click</p>
			</li>

			<li></li>
		</ul>
	</div>
	<!-- End Upgrades -->

	</div>


</div>
</div>
<script type="text/javascript" src="nav.js"></script>
<script type="text/javascript" src="main.js"></script>
</body>
</html>