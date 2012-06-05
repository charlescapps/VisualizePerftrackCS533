
var startingTime = 0;
var endingTime = 99;
var intervalTime = 1;
var msPerStep = 100;
//var currentTime;
var animateSetInterval;
var masterSet;

//On pause button click, or user drags slider
function pauseSlider(){
	$("#pause").hide();
	$("#play").show();
	stopAnimations();
	clearInterval(animateSetInterval);
}

//Start the animation of the slider
function playSlider(){
	clearNodes();
	$("#pause").show();
	$("#play").hide();
	playAnimations();
	animateSetInterval = setInterval(animateStep, msPerStep);
}

//Called when the slider hits a point, either through auto play or user slide
function drawFrame(time){
	//$("#current").html(time);
	//TODO: temporary implementation to show change over time
	//setNodeTemp(34, time, time);
	
	$("#clock").html(masterSet[time]["time"]);
	
	var nodes = masterSet[time]['nodes'];
	var racks = masterSet[time]['racks'];
	$.each(nodes, function(index, value){
		//console.log(value.node + " : " + value.tempIn);
		setNodeTemp(value.node, value.tempIn, value.tempOut);
	}); 
	
	$.each(racks, function(index, value){
		setRackEnergy(value.rack, value.power);
		setTMUTemp(value.rack, value.tmuTempIn, value.tmuTempOut );
	});
}

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
}


function createSlider(maxTime) {

		endingTime = maxTime;
		$("#slider").slider("destroy");
		$("#slider").slider({
			animate: true,
			min: 0,
			value: 0,
			max: maxTime,
			step: intervalTime,
			slide: function(event, ui){
				//drawFrame(ui.value);
				pauseSlider();
			},
			change: function(event, ui){
				drawFrame(ui.value);
			}
		});
}

function clearNodes(){
	for (var i=0; i < 192; i++) {
		console.log(i);
		setNodeTemp(i, 0, 0);
	}

}

function loadDataSet(set) {
	pauseSlider();
	
	$.ajax({
		url : "getSets.php", 
		dataType: "json",
		data: {"set": set},
		success: function(data) {
			masterSet = data;
			createSlider(data.length -1);
			$("#slider").slider("value", 0);
		},
		error: function(data, error){
			alert("Error loading data. " + error);
		}
	
	});
	
}


$(document).ready(function(){
	$(":button, .button").button();
	createSlider(99);
	loadDataSet("HD");
	
			
			
	$("#play").click(function(){
		playSlider();
	});
	
	$("#pause").click(function(){
		pauseSlider();
	});

	$("#rewind").click(function(){
		pauseSlider();
		$("#slider").slider("value", 0);
	});
	
	var hd = $("<input type='button' value='High Density' />").button().click(function(){
		loadDataSet("HD");
		$("#openDialog").dialog("close");
	});
		
	var ld = $("<input type='button' value='Low Density' />").button().click(function(){
		loadDataSet("LD");
		$("#openDialog").dialog("close");
	});
	
	$("body").append($("<div id='openDialog'>").append(hd).append($("<br />")).append(ld));
	$("#openDialog").dialog({title: "Choose an experiment to load", 
				autoOpen: false,
				width: "200px",
				modal: true
				});
	
	

	$("#open").click(function(){
		$("#openDialog").dialog("open");
		$(".ui-button").blur();
	});


});
