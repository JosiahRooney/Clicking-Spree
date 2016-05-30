// Global Variables
var kills = 0;
var boots = 0;
var mm = 0;
var csw = 0;
var ifv = 0;
var spc = 0;
var hvy = 0;
var f15 = 0;
var b1b = 0;
var upgrade = false;
var upgradeVal = 0;
var bootUpg = false;
var bootPwr = (boots * (Math.random().toFixed(2)));
var mmUpg = false;
var mmPwr = 5;
var cahUpg = false;
var total = 0;
var rate = false;
var prevUpg1 = false;
var prevUpg2 = false;
var prevUpg3 = false;
var prevUpg4 = false;
var prevUpg5 = false;
var prevUpg6 = false;

// Hide units until you can afford them (don't hide first unit)
$('.marksman').hide();
$('.cwpn').hide();
$('.ifvs').hide();
$('.specops').hide();
$('.heavy').hide();
$('.f15').hide();
$('.b1b').hide();

// Hide upgrades until you can afford them (don't hide first upgrade)
$('.upgrade2').hide();
$('.upgrade3').hide();
$('.upgrade4').hide();
$('.upgrade5').hide();
$('.upgrade6').hide();



// The Upgrades

function buyUpgrade1(){
    var upg1Cost = 125;
    if(kills >= upg1Cost){
        upgrade = true;
    	kills = kills - upg1Cost;
        document.getElementById('upgrade1').innerHTML = ('Red Dot Sight Purchased - 5% Bonus Kills Per Click');
        document.getElementById('kills').innerHTML = kills.toFixed(2);
        upgradeVal = 1.05;
        prevUpg1 = true;
    };
};

function buyUpgrade2(){
    var upg2Cost = 750;
    if(kills >= upg2Cost && prevUpg1 == true){
    	kills = kills - upg2Cost;
        document.getElementById('upgrade2').innerHTML = ('Grenade Launcher Purchased - 15% Bonus Kills Per Click');
        document.getElementById('kills').innerHTML = kills.toFixed(2);
        upgradeVal = 1.20;
        prevUpg2 = true;
    };
};

function buyUpgrade3(){
    var upg3Cost = 1950;
    if(kills >= upg3Cost && prevUpg2 == true){
    	kills = kills - upg3Cost;
        document.getElementById('upgrade3').innerHTML = ('Better Drill Instructors Purchased - Recruit KPS is now 1 - 3');
        document.getElementById('kills').innerHTML = kills.toFixed(2);
        document.getElementById('bootPwr').innerHTML = ('1 - 3');
        bootUpg = true;
        prevUpg3 = true;
    };
};

function buyUpgrade4(){
    var upg4Cost = 25000;
    if(kills >= upg4Cost && prevUpg3 == true){
    	kills = kills - upg4Cost;
        document.getElementById('upgrade4').innerHTML = ('EMR Upgrade Purchased - Marksman KPS is now 13.25');
        document.getElementById('kills').innerHTML = kills.toFixed(2);
        document.getElementById('mmPwr').innerHTML = ('13.25');
        mmUpg = true;
        prevUpg4 = true;
    };
};

function buyUpgrade5(){
    var upg5Cost = 250000;
    if(kills >= upg5Cost && prevUpg4 == true){
    	kills = kills - upg5Cost;
        document.getElementById('upgrade5').innerHTML = ('Close Air Support Purchased - 50% chance to kill 100,000 every 5 seconds');
        document.getElementById('kills').innerHTML = kills.toFixed(2);
		setInterval(function () {
			i = (Math.floor(Math.random() * 10));
				if (i >= 6) {
					addc(100000);
				}
			}, 5000);
        prevUpg5 = true;
    };
};

function buyUpgrade6(){
    var upg6Cost = 1200000;
    if(kills >= upg6Cost && prevUpg5 == true){
    	kills = kills - upg6Cost;
        document.getElementById('upgrade6').innerHTML = ('Double Tap Purchased - Earn 3% of your total Kills Per Second.');
        document.getElementById('kills').innerHTML = kills.toFixed(2);
        rate = true;
        prevUpg6 = true;
    };
};










// The Barracks

function buyRecruit(){
    var bootCost = Math.floor(50 * Math.pow(1.1,boots));     			//works out the cost of this unit
    if(kills >= bootCost){                                   			//checks that the player can afford the unit
        boots = boots + 1;                                   			//increases number of boots
    	kills = kills - bootCost;                          				//removes the kills spent
        document.getElementById('boots').innerHTML = boots;  			//updates the number of boots for the user
        document.getElementById('kills').innerHTML = kills.toFixed(2);  //updates the number of kills for the user
    };
    var nextCost = Math.floor(50 * Math.pow(1.1,boots));       			//works out the cost of the next unit
    document.getElementById('bootCost').innerHTML = nextCost;  			//updates the unit cost for the user
};

function buyMarksman(){
    var mmCost = Math.floor(350 * Math.pow(1.1,mm));     				//works out the cost of this unit
    var mmBoots = 1;
    if(kills >= mmCost && boots >= mmBoots){                			//checks that the player can afford the unit
        mm = mm + 1;                                   					//increases number of mm
    	kills = kills - mmCost;                          				//removes the kills spent
    	boots = boots - mmBoots;										//removes the boots spent
        document.getElementById('mm').innerHTML = mm;  					//updates the number of mm for the user
        document.getElementById('boots').innerHTML = boots;  			//updates the number of boots for the user
        document.getElementById('kills').innerHTML = kills.toFixed(2);  //updates the number of kills for the user
    };
    var nextCost = Math.floor(350 * Math.pow(1.1,mm));       			//works out the cost of the next unit
    document.getElementById('mmCost').innerHTML = nextCost;  			//updates the unit cost for the user
};

function buyCrewWpn(){
    var cswCost = Math.floor(3750 * Math.pow(1.1,csw));     				//works out the cost of this unit
    var cswBoots = 3;
    if(kills >= cswCost && boots >= cswBoots){                          //checks that the player can afford the unit
        csw = csw + 1;                                   				//increases number of csw
    	kills = kills - cswCost;                          				//removes the kills spent
    	boots = boots - cswBoots;										//removes the boots spent
        document.getElementById('csw').innerHTML = csw;					//updates the number of csw for the user
        document.getElementById('boots').innerHTML = boots;  			//updates the number of boots for the user
        document.getElementById('kills').innerHTML = kills.toFixed(2);  //updates the number of kills for the user
    };
    var nextCost = Math.floor(3750 * Math.pow(1.1,csw));       			//works out the cost of the next unit
    document.getElementById('cswCost').innerHTML = nextCost;  			//updates the unit cost for the user
};

function buyIFV(){
    var ifvCost = Math.floor(24750 * Math.pow(1.1,ifv));     			//works out the cost of this unit
    var ifvBoots = 5;
    if(kills >= ifvCost && boots >= ifvBoots){                          //checks that the player can afford the unit
        ifv = ifv + 1;                                   				//increases number of ifv
    	kills = kills - ifvCost;                          				//removes the kills spent
    	boots = boots - ifvBoots;										//removes the boots spent
        document.getElementById('ifv').innerHTML = ifv;					//updates the number of boots for the user
        document.getElementById('boots').innerHTML = boots;  			//updates the number of ifv for the user
        document.getElementById('kills').innerHTML = kills.toFixed(2);  //updates the number of kills for the user
    };
    var nextCost = Math.floor(24750 * Math.pow(1.1,ifv));       			//works out the cost of the next unit
    document.getElementById('ifvCost').innerHTML = nextCost;  			//updates the unit cost for the user
};

function buySpecOps(){
    var spcCost = Math.floor(129500 * Math.pow(1.1,spc));     			//works out the cost of this unit
    var spcMM = 1;
    if(kills >= spcCost && mm >= spcMM){                          		//checks that the player can afford the unit
        spc = spc + 1;                                   				//increases number of spc
    	kills = kills - spcCost;                          				//removes the kills spent
    	mm = mm - spcMM;												//removes the mm spent
        document.getElementById('spc').innerHTML = spc;					//updates the number of mm for the user
        document.getElementById('mm').innerHTML = mm;  					//updates the number of spc for the user
        document.getElementById('kills').innerHTML = kills.toFixed(2);  //updates the number of kills for the user
    };
    var nextCost = Math.floor(129500 * Math.pow(1.1,spc));       		//works out the cost of the next unit
    document.getElementById('spcCost').innerHTML = nextCost;  			//updates the unit cost for the user
};

function buyHeavy(){
    var hvyCost = Math.floor(1880000 * Math.pow(1.1,hvy));     			//works out the cost of this unit
    var hvyMM = 1;
    if(kills >= hvyCost && mm >= hvyMM){                          		//checks that the player can afford the unit
        hvy = hvy + 1;                                   				//increases number of hvy
    	kills = kills - hvyCost;                          				//removes the kills spent
    	mm = mm - hvyMM;												//removes the mm spent
        document.getElementById('hvy').innerHTML = hvy;					//updates the number of mm for the user
        document.getElementById('mm').innerHTML = mm;  					//updates the number of hvy for the user
        document.getElementById('kills').innerHTML = kills.toFixed(2);  //updates the number of kills for the user
    };
    var nextCost = Math.floor(1880000 * Math.pow(1.1,hvy));       		//works out the cost of the next unit
    document.getElementById('hvyCost').innerHTML = nextCost;  			//updates the unit cost for the user
};

function buyF15(){
    var f15Cost = Math.floor(14990000 * Math.pow(1.1,f15));     			//works out the cost of this unit
    var f15spc = 1;
    if(kills >= f15Cost && spc >= f15spc){                          	//checks that the player can afford the unit
        f15 = f15 + 1;                                   				//increases number of f15
    	kills = kills - f15Cost;                          				//removes the kills spent
    	spc = spc - f15spc;												//removes the spc spent
        document.getElementById('f15').innerHTML = f15;					//updates the number of spc for the user
        document.getElementById('spc').innerHTML = spc;  				//updates the number of f15 for the user
        document.getElementById('kills').innerHTML = kills.toFixed(2);  //updates the number of kills for the user
    };
    var nextCost = Math.floor(14990000 * Math.pow(1.1,f15));       		//works out the cost of the next unit
    document.getElementById('f15Cost').innerHTML = nextCost;  			//updates the unit cost for the user
};

function buyB1B(){
    var b1bCost = Math.floor(145670000 * Math.pow(1.1,b1b));     		//works out the cost of this unit
    var b1bspc = 4;
    if(kills >= b1bCost && spc >= b1bspc){                          	//checks that the player can afford the unit
        b1b = b1b + 1;                                   				//increases number of b1b
    	kills = kills - b1bCost;                          				//removes the kills spent
    	spc = spc - b1bspc;												//removes the spc spent
        document.getElementById('b1b').innerHTML = b1b;					//updates the number of spc for the user
        document.getElementById('spc').innerHTML = spc;  				//updates the number of b1b for the user
        document.getElementById('kills').innerHTML = kills.toFixed(2);  //updates the number of kills for the user
    };
    var nextCost = Math.floor(145670000 * Math.pow(1.1,b1b));       		//works out the cost of the next unit
    document.getElementById('b1bCost').innerHTML = nextCost;  			//updates the unit cost for the user
};












// ======== The Main Click Function ========

function addc(number) {
	if (upgrade == true ) {
		kills = kills + ((number * upgradeVal));
	} else {
		kills = kills + number;
	};

	if (rate == true) {
		kills = kills + (total * 0.03);
	} 

	document.getElementById("kills").innerHTML = kills.toFixed(2);
	//Disable/Enable buttons based on whether you can afford the unit or upgrade
	if (kills < 50) {
		$('.buyRecruit').attr('disabled','disabled');
	} else {
		$('.buyRecruit').removeAttr('disabled');
	};
	if (kills < 350 || boots < 1) {
		$('.buyMarksman').attr('disabled','disabled');
	} else {
		$('.buyMarksman').removeAttr('disabled');
	};
	if (kills < 3750 || boots < 3) {
		$('.buyCrewWpn').attr('disabled','disabled');
	} else {
		$('.buyCrewWpn').removeAttr('disabled');
	};
	if (kills < 24750 || boots < 5) {
		$('.buyIFV').attr('disabled','disabled');
	} else {
		$('.buyIFV').removeAttr('disabled');
	};
	if (kills < 129500 || mm < 1) {
		$('.buySpecOps').attr('disabled','disabled');
	} else {
		$('.buySpecOps').removeAttr('disabled');
	};
	if (kills < 1880000 || mm < 3) {
		$('.buyHeavy').attr('disabled','disabled');
	} else {
		$('.buyHeavy').removeAttr('disabled');
	};
	if (kills < 14990000 || spc < 1) {
		$('.buyF15').attr('disabled','disabled');
	} else {
		$('.buyF15').removeAttr('disabled');
	};
	if (kills < 145670000 || spc < 4) {
		$('.buyB1B').attr('disabled','disabled');
	} else {
		$('.buyB1B').removeAttr('disabled');
	};
	if (kills < 125) {
		$('.buyUpgrade1').attr('disabled','disabled');
	} else {
		$('.buyUpgrade1').removeAttr('disabled');
	};
	if (kills < 700 && prevUpg1 == true) {
		$('.buyUpgrade2').attr('disabled','disabled');
	} else {
		$('.buyUpgrade2').removeAttr('disabled');
	};
	if (kills < 1950 && prevUpg2 == true) {
		$('.buyUpgrade3').attr('disabled','disabled');
	} else {
		$('.buyUpgrade3').removeAttr('disabled');
	};
	if (kills < 25000 && prevUpg3 == true) {
		$('.buyUpgrade4').attr('disabled','disabled');
	} else {
		$('.buyUpgrade4').removeAttr('disabled');
	};
	if (kills < 250000 && prevUpg4 == true) {
		$('.buyUpgrade5').attr('disabled','disabled');
	} else {
		$('.buyUpgrade5').removeAttr('disabled');
	};
	if (kills < 1200000 && prevUpg5 == true) {
		$('.buyUpgrade5').attr('disabled','disabled');
	} else {
		$('.buyUpgrade5').removeAttr('disabled');
	};

	//Show buttons as you earn appropriate number of kills
	if (kills > 74) {
		$('.marksman').show();
	}
	if (kills > 450) {
		$('.cwpn').show();
	}
	if (kills > 3449) {
		$('.ifvs').show();
	}
	if (kills > 19499) {
		$('.specops').show();
	}
	if (kills > 719999) {
		$('.heavy').show();
	}
	if (kills > 2900000) {
		$('.f15').show();
	}
	if (kills > 29000000) {
		$('.b1b').show();
	}
	if (kills > 500) {
		$('.upgrade2').show();
	}
	if (kills > 1500) {
		$('.upgrade3').show();
	}
	if (kills > 20000) {
		$('.upgrade4').show();
	}
	if (kills > 200000) {
		$('.upgrade5').show();
	}
	if (kills > 1000000) {
		$('.upgrade6').show();
	}
}

// Update the DOM


window.setInterval(function(){

	if (bootUpg == true) {
		bootPwr = (Math.floor(Math.random() * 3) + 1);
	} else {
		bootPwr = (Math.random().toFixed(2));
	};
	addc(boots * bootPwr);

	if (mmUpg == true) {
		mmPwr = 13.25;
	};
	addc(mm * mmPwr);

	addc(csw * 25);
	addc(ifv * 175);
	addc(spc * 1250);
	addc(hvy * 28000);
	addc(f15 * 145500);
	addc(b1b * 2567000);

	total = ((boots * bootPwr) + (mm * mmPwr) + (csw * 25) + (ifv * 175) + (spc * 1250) + (hvy * 28000) + (f15 * 145500) + (b1b * 2567000)).toFixed(2);	

	document.getElementById('kps').innerHTML = total;

}, 1000);
