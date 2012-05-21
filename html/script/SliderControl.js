
var startingTime = 0;
var endingTime = 99;
var intervalTime = 1;
var msPerStep = 100;
//var currentTime;
var animateSetInterval;

//On pause button click, or user drags slider
function pauseSlider(){
	$("#pause").hide();
	$("#play").show();
	clearInterval(animateSetInterval);
};

//Start the animation of the slider
function playSlider(){
	$("#pause").show();
	$("#play").hide();
	animateSetInterval = setInterval(animateStep, msPerStep);
};

//Called when the slider hits a point, either through auto play or user slide
function drawFrame(time){
	
	//TODO: temporary implementation to show change over time
	setNodeTemp(34, time, time);
};

//Animation for the slider auto-play
function animateStep(){
	var current = parseInt($("#slider").slider("option", "value"));

	if (current < endingTime )
	{
		$("#slider").slider("option", "value", current + intervalTime);
	}
	else
	{
		pauseSlider();
	}
};


$(document).ready(function(){
	$(":button, .button").button();
	$("#slider").slider({
		animate: true,
		min: startingTime,
		value: startingTime,
		max: endingTime,
		step: intervalTime,
		slide: function(event, ui){
			drawFrame(ui.value);
			pauseSlider();
		},
		change: function(event, ui){
			drawFrame(ui.value);
		}
	
	});
	
			
			
	$("#play").click(function(){
		playSlider();
	});
	
	$("#pause").click(function(){
		pauseSlider();
	});

});
