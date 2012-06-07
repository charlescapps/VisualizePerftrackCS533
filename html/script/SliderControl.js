
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
	//stopAnimations();
	clearInterval(animateSetInterval);
}

//Start the animation of the slider
function playSlider(){

	var current = parseInt($("#slider").slider("option", "value"));

	if (current >= endingTime )
	{
		$("#slider").slider("value", 0);
	}
	
	playAnimations();
	animateSetInterval = setInterval(animateStep, msPerStep);
	
	$("#pause").show();
	$("#play").hide();

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



function loadDataSet(set) {
	pauseSlider();
	
	$.ajax({
		url : "getSets.php", 
		dataType: "json",
		data: {"set": set},
		success: function(data) {
			masterSet = data;
			createSlider(data.length -1);
			inactivateAllNodes();
			$("#play, #rewind").show();
			$("#slider").slider("value", 0).show();

		},
		error: function(data, error){
			alert("Error loading data. " + error);
		}
	
	});
	
}


$(document).ready(function(){
	$(":button, .button").button();
	createSlider(99);
//	loadDataSet("HD");
	
			
			
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
	
	//Starter version of the page -- only the open button shows
	$("#play, #pause, #rewind, #slider").hide();
	$("#clock").html("To begin, select an experiment");
	
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
				modal: true,
				position: "top"
				});
	
	

	$("#open").click(function(){
		$("#openDialog").dialog("open");
		$(".ui-button").blur();
	});


});
