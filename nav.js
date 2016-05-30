$('.upgrades').hide();

$('.barracksh3').click(function(){
	$('.upgrades').hide();
	$('.barracks').show();
});

$('.upgradesh3').click(function(){
	$('.barracks').hide();
	$('.upgrades').show();
});

var scrollPoint = 76;

$(document).scroll(function(){
if ($(document).scrollTop() >= scrollPoint) {
    $('.topcontent').css('box-shadow','0 0 14px rgba(0, 0, 0, 0.7)');
} else {
    $('.topcontent').css('box-shadow','none');
};
});