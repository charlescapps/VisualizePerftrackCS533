/*******************************************************************
	VisualizePT.js
	Michael Barger
	CS 533, Prof. Karen Karavanic, Portland State U
	
	Manages the 3D graphics for the VisualizePerfTrack
	project, using THREE.js (WebGL) and SPARKS.js
	
*******************************************************************/



// 3D globals
var WIDTH, HEIGHT, VIEW_ANGLE, ASPECT, NEAR, FAR;
var azimuth, zenith, mouse_x, mouse_y, camera;
var rack_height, renderer, composer, target, camera_radius, camera_home, scene, directional_light, point_light, ambient_light;
var U = 1.75;							// rackspace unit height
var ROOM_HEIGHT = 130, ROOM_DIM = 317.5;
var MAX_AZIMUTH = Math.PI / 2;
var MOUSE_SPEED = 0.0001
var mouse_decay;
var rack_mat;						// common rack top/base material
var rack_name;
var TMU_DEPTH = 2.5, TMU_WIDTH, TMU_HEIGHT;

// Particle variables
var particles_playing;
var particle_geo, particle_mat;
var emitter = [];
var NUM_PARTICLES = 300;
var PARTICLE_SIZE = 6.5;
var PARTICLE_HUE = 0.1, PARTICLE_SAT = 0.9, PARTICLE_VAL = 0.8;
var PARTICLE_DRIFT = 0.3, PARTICLE_DRIFT_OFFSET = 0.15, PARTICLE_LIFT = 1.2, PARTICLE_LIFT_RANGE = 1.0, PARTICLE_GRAVITY = 0.055;
var PARTICLE_EXPECTANCY_RANGE = 31, PARTICLE_EXPECTANCY_MIN = 5;
var FIRST_FEW_TICKS = 3.0, LAST_FEW_TICKS = 7.0;

// data globals
var $lab;			// full input XML file
var aisle = [];		// array of all aisles
var rack = [];		// array of all racks
var node = [];		// array of all nodes
var rackstats;		// stats common to all racks 




/********************************************************************
						INTERFACE FUNCTIONS
********************************************************************/


// sets the color of a node based on incoming/outgoing air temperatures,
// normalized on a 0-99 scale.
// This will eventually show both incoming and outgoing temperatures simultaneously,
// but for now, it will just show outgoing air temperature for testing purposes.
function setNodeTemp(	node_no,			// int absolute node ID #
									temp_in,			// int (0~99) normalized temperature in
									temp_out ) {		// int (0~99) normalized temperature out
									
	var red_in, blue_in, red_out, blue_out;
	temp_in %= 100;
	temp_out %= 100;
	
	// calculate in/out color values
	red_in = (temp_in + 1) / 100.0;
	blue_in = 1.0 - (temp_in + 1) / 100.0;
	red_out = (temp_out + 1) / 100.0;
	blue_out = 1.0 - (temp_out + 1) / 100.0;
	
	// set the color of each of the node's faces
	for ( var i = 0; i < 4; i++ )
		node[node_no].faces[0].vertexColors[i].setRGB( red_in, 0, blue_in );
	for ( var i = 0; i < 4; i++ )
		node[node_no].faces[1].vertexColors[i].setRGB( red_out, 0, blue_out );
	node[node_no].faces[2].vertexColors[0].setRGB( red_out, 0, blue_out );
	node[node_no].faces[2].vertexColors[1].setRGB( red_out, 0, blue_out );
	node[node_no].faces[2].vertexColors[2].setRGB( red_in, 0, blue_in );
	node[node_no].faces[2].vertexColors[3].setRGB( red_in, 0, blue_in );
	node[node_no].faces[3].vertexColors[0].setRGB( red_in, 0, blue_in );
	node[node_no].faces[3].vertexColors[1].setRGB( red_in, 0, blue_in );
	node[node_no].faces[3].vertexColors[2].setRGB( red_out, 0, blue_out );
	node[node_no].faces[3].vertexColors[3].setRGB( red_out, 0, blue_out );
	
	// and flag the node's geometry as needing its colors updated in the next refresh	
	node[node_no].geo.colorsNeedUpdate = true;
	
}

// sets the node's colors to gray
function inactivateNode( node_no ) {
	
	// set the color of each of the node's faces
	for ( var i = 0; i < 4; i++ )
		for ( var j = 0; j < 4; j++ )
			node[node_no].faces[i].vertexColors[j].setRGB( 0.3, 0.3, 0.3 );
	
	// and flag the node's geometry as needing its colors updated in the next refresh	
	node[node_no].geo.colorsNeedUpdate = true;
	
}


// sets the node's colors to gray
function inactivateAllNodes() {
	
	// for each node
	for ( var n = 0; n < node.length; n++ )
		inactivateNode( n );
	
}


// Sets the sparkiness of a rack based on its power usage, normalized on a 0-99 scale
function setRackEnergy(	rack_name,	// String rack's name ( "A1", "B4", etc )
										energy ) {		// int (0~99) normalized energy level

	var this_rack = rack.filter( function (element, index, array) {
					return rack_name == element.name;
				} )[0];
	energy %= 100;
	var face_color = energy / 100.0;
	
	this_rack.emitter.rate = energy;
	this_rack.emitter.lift = PARTICLE_LIFT + ( energy / 100.0 * PARTICLE_LIFT_RANGE - PARTICLE_LIFT_RANGE / 2.0 );
	this_rack.topface.color.setRGB( face_color, face_color / 1.05, face_color / 1.15 );
	this_rack.topgeo.colorsNeedUpdate = true;
	
}


// Sets a given rack's TMU's in- and out- water temperatures
// Will do nothing if the rack is not spray-cooled
function setTMUTemp(	rack_name,			// String rack's name ( "A1", "B4", etc )
									temp_in,				// int (0~99) normalized temperature in
									temp_out		) {     // int (0~99) normalized temperature out
									
	var this_rack = rack.filter( function (element, index, array) {
					return rack_name == element.name;
				} )[0];
	
	if ( this_rack.cooling == "spray" ) {
		var red_in, blue_in, red_out, blue_out;
		temp_in %= 100;
		temp_out %= 100;
		
		// calculate in/out color values
		red_in = (temp_in + 1) / 100.0;
		blue_in = 1.0 - (temp_in + 1) / 100.0;
		red_out = (temp_out + 1) / 100.0;
		blue_out = 1.0 - (temp_out + 1) / 100.0;
		
		// set the color of each of the node's faces
		this_rack.TMUgeo.faces[0].vertexColors[0].setRGB( red_out, 0, blue_out );
		this_rack.TMUgeo.faces[0].vertexColors[3].setRGB( red_out, 0, blue_out );
		this_rack.TMUgeo.faces[0].vertexColors[1].setRGB( red_in, 0, blue_in );
		this_rack.TMUgeo.faces[0].vertexColors[2].setRGB( red_in, 0, blue_in );
		for ( var i = 0; i < 4; i++ )
			this_rack.TMUgeo.faces[1].vertexColors[i].setRGB( red_out, 0, blue_out );
		this_rack.TMUgeo.faces[2].vertexColors[0].setRGB( red_out, 0, blue_out );
		this_rack.TMUgeo.faces[2].vertexColors[3].setRGB( red_out, 0, blue_out );
		this_rack.TMUgeo.faces[2].vertexColors[2].setRGB( red_in, 0, blue_in );
		this_rack.TMUgeo.faces[2].vertexColors[1].setRGB( red_in, 0, blue_in );
		this_rack.TMUgeo.faces[3].vertexColors[2].setRGB( red_in, 0, blue_in );
		this_rack.TMUgeo.faces[3].vertexColors[1].setRGB( red_in, 0, blue_in );
		this_rack.TMUgeo.faces[3].vertexColors[0].setRGB( red_out, 0, blue_out );
		this_rack.TMUgeo.faces[3].vertexColors[3].setRGB( red_out, 0, blue_out );
		
		// and flag the node's geometry as needing its colors updated in the next refresh	
		this_rack.TMUgeo.colorsNeedUpdate = true;
	}
	
}


// Sets a given rack's TMU's energy usage
// Will do nothing if the rack is not spray-cooled
// **************************************************************
// FUNCTION DISABLED due to lack of necessary data
// **************************************************************

function setTMUEnergy(	rack_name,			// String rack's name ( "A1", "B4", etc )
									energy			) {     // int (0~99) normalized energy level
									
	/*
	var this_rack = rack.filter( function (element, index, array) {
					return rack_name == element.name;
				} )[0];						
	
	if ( this_rack.cooling == "spray" ) {
		var green = (energy + 1) / 100.0;
		
		for ( var i = 0; i < 4; i++ )
			this_rack.TMUgeo.faces[0].vertexColors[i].setRGB( 0, green, 0 );
		this_rack.TMUgeo.colorsNeedUpdate = true;
	
	}
	*/
	
}


// Starts animations
function playAnimations() {

	particles_playing = true;

}


// Pauses/Stops animations
function stopAnimations() {

	particles_playing = false;

}


// Returns whether the 3D is currently animating or not
function isAnimating() {

	return particles_playing == true;
	
}


/********************************************************************
						INTERNAL FUNCTIONS
********************************************************************/

// ****** Executes as soon as the window has loaded
$(window).load( function() {

	// initialize the 3D engine
	init3D();
	
	// get XML file and when complete, execute getLabSetup
	$.ajax( {type: "GET", url: "script/labconfig.xml", dataType: "xml", success: getLabSetup, error: xmlGetError} );
	
	$("#main3d").mousedown( function() {
		/** TEST HARNESS **********************************
		for ( r in rack ) {
			setRackEnergy( rack[r].name, Math.round( Math.random() * 99 ) );
			setTMUTemp( rack[r].name, Math.round( Math.random() * 99 ), Math.round( Math.random() * 99 ) );
			//setTMUEnergy( rack[r].name, Math.round( Math.random() * 99 ) );
		}
		for ( var i = 0; i < node.length; i++ ) {
			if ( Math.random() > 0.5 )
				setNodeTemp( i, Math.round( Math.random()  * 99 ), Math.round( Math.random()  * 99 ) );
			else
				inactivateNode( i );
		}
		playAnimations();
		/*********************************************************/
		mouse_decay = false;
		mouse_x = 0;
		$("#main3d").bind( "mousemove", function( event ) {
			mouse_x = event.pageX - $("#main3d").position().left - $("#main3d").width() / 2;
		});
	});
	
	$("body").mouseup( function() {
		mouse_decay = true;
		$("#main3d").unbind( "mousemove" );
	});
	
	$("#main3d").mouseleave( function() {
		mouse_decay = true;
		$("#main3d").unbind( "mousemove" );
	});
	
});



// ****** Makes sure the 3D draws properly even if the browser window is resized
$(window).resize( function() {

	WIDTH = $("#main3d").width(); HEIGHT = $("#main3d").height();
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
	renderer.setSize( WIDTH, HEIGHT );
	
});






// ****** Initializes the 3D environment
function init3D() {

	// initialize 3d globals
	WIDTH = $("#main3d").width(); HEIGHT = $("#main3d").height();
	VIEW_ANGLE = 65; ASPECT = WIDTH / HEIGHT; NEAR = 5; FAR = 1000;	// camera setup vars
	azimuth = 0, mouse_x = 0, mouse_decay = true;
	
	// initialize renderer
	renderer = new THREE.WebGLRenderer( { antialias : true, shadowMapEnabled : true, shadowMapSoft : true, gammaInput : true, gammaOutput : true } );
    renderer.setSize( WIDTH, HEIGHT );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.setClearColorHex( 0x000099, 1 );
    $("#main3d").append( renderer.domElement );

	// initialize scene
    scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0x8888AA, 0.0045 );

	// add camera
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
    scene.add( camera );
    target = new THREE.Vector3();
	
	// setup materials
	rack_mat = new THREE.MeshPhongMaterial( { color: 0x111111, vertexColors: THREE.VertexColors, ambient: 0xFFFFFF, shininess: 4, specular: 0xFFFFFF } );
}






// gets the lab setup info from the lab-config XML file and reads it into primary data structures
function getLabSetup( xml ) {

	$lab = xml;
	var num_racks = 0, num_nodes = 0;
	
	var $rackstatsxml = $(xml).find( "rackstats" );
	rackstats = { maxnodes : parseInt( $rackstatsxml.attr("maxnodes") ),
				  width : parseInt( $rackstatsxml.attr("width") ),
				  base : parseInt( $rackstatsxml.attr("base") ),
				  top : parseInt( $rackstatsxml.attr("top") ),
				  depth : parseInt( $rackstatsxml.attr("depth") ) };
	
	// the loops are set up this way so that only the first and last rows described in the XML are acted upon
	// any rows besides those two will be ignored
	$(xml).find( "aisle" ).each( function() {
	$(this).find( "row:first, row:last" ).each( function() {
	$(this).find( "rack" ).each( function() {
		var num_rack_nodes = parseInt( $(this).attr("nodes") );
		
		rack.push( {node : [],
					type : $(this).attr("type"),
					cooling : $(this).attr("cooling"),
					name : $(this).attr("name"),
					id : $(this).index() } );
		
		for ( var i = 0; i < num_rack_nodes; i++ ) {
			rack[num_racks].node.push( { id : num_nodes,
										 rack : rack[num_racks],
										 heat : 0 } );
			node[num_nodes] = rack[num_racks].node[i];
			num_nodes++; 
		}
		num_racks++;
	});
	});
	});
	
	createLab();		// when complete, create the lab's 3d objects
	
}





// ****** This function creates the lab's 3D objects and associates them with the primary data structures
function createLab() {

	var cur_x = 0, max_z = 0;
	var aisle_spacebetween;
	rack_height = rackstats.base + rackstats.maxnodes * U + rackstats.top;
	
	initParticles();
	TMU_HEIGHT = rack_height - rackstats.top;
	TMU_WIDTH = rackstats.width * 0.35;
	
	$("#main3d img").css( "visibility", "visible" );

	$($lab).find( "aisle" ).each( function() {
		var aisle_width = parseInt( $(this).attr("width") );
		aisle_spacebetween = parseInt( $(this).attr("spacebetween") );
		
		var lastrow_mesh, lastrow_TMU;
		
		$(this).find( "row:first, row:last" ).each( function() {
			var cur_z = 0;
			var row_spacebetween = parseInt( $(this).attr("spacebetween") );
			
			lastrow_mesh = [], lastrow_TMU = [];
			
			$(this).find( "rack" ).each( function() {
				var i, j;
				rack_name = $(this).attr("name");
				var rack_numnodes = parseInt( $(this).attr("nodes") );
				var cur_y;
				var this_rack = rack.filter( function (element, index, array) {
					return rack_name == element.name;
				} )[0];
				
				var geo, mat, this_mesh;
				
				
				//// create top of rack ////
				geo = new THREE.CubeGeometry( rackstats.depth, rackstats.top, rackstats.width, 1, 1, 1, null, { ny: false } );
				this_rack.topgeo = geo;
				this_rack.topface = geo.faces[2];
				for ( f in geo.faces )
					geo.faces[f].color.setRGB( 0.1, 0.1, 0.1 );
				geo.dynamic = true;
				mat = [ rack_mat, makeTextMat( this_rack.name ) ];
				this_rack.topmesh = new THREE.SceneUtils.createMultiMaterialObject( geo, mat );
				this_rack.topmesh.position.set( cur_x, rack_height - rackstats.top / 2, cur_z );
				this_rack.topmesh.children[0].castShadow = true;
				scene.add( this_rack.topmesh );
				
				
				//// create nodes ////
				geo = new THREE.CubeGeometry(	rackstats.depth, rackstats.maxnodes * U, rackstats.width,
																			1, rackstats.maxnodes, 1, null, { py: false, ny: false }  );
				mat = [ new THREE.MeshPhongMaterial( { color : 0x888899, vertexColors: THREE.VertexColors, shininess: 7, specular: 0xFFFFFF } ),
							new THREE.MeshBasicMaterial( { color: 0xFFFFFF, wireframe: true, wireframeLinewidth: 3, transparent: true, opacity: 0.1 } ) ];
				this_rack.geo = geo;
				this_rack.nodemesh = new THREE.SceneUtils.createMultiMaterialObject( geo, mat );
				lastrow_mesh.push( this_rack.nodemesh );
				this_rack.nodemesh.position.set( cur_x, rack_height - (rackstats.maxnodes * U / 2) - rackstats.top, cur_z );
				geo.dynamic = true;
				for ( i = 0; i < rack_numnodes; i++ ) {
					this_rack.node[i].geo = geo;
					this_rack.node[i].faces = [];
					for ( j = 0; j < 4; j++ ) {
						this_rack.node[i].faces[j] = geo.faces[j * rackstats.maxnodes + i];
						for ( k = 0; k < 4; k++ )
							this_rack.node[i].faces[j].vertexColors[k] = new THREE.Color(  0x555566 );
					}
				}
				for ( ; i < rackstats.maxnodes; i++ )
					for ( j = 0; j < 4; j++ )
						geo.faces[j * rackstats.maxnodes + i].color.setHex( 0x444444 );
				this_rack.nodemesh.children[0].castShadow = true;
				scene.add( this_rack.nodemesh );

				
				//// create base of rack ////
				geo = new THREE.CubeGeometry( rackstats.depth, rackstats.base, rackstats.width, 1, 1, 1, null, { py: false, ny : false } );
				for ( f in geo.faces )
					geo.faces[f].color.setRGB( 0.1, 0.1, 0.1 );
				this_rack.basemesh = new THREE.Mesh( geo, rack_mat );
				this_rack.basemesh.position.set( cur_x, rackstats.base / 2, cur_z );
				this_rack.basemesh.castShadow = true;
				scene.add( this_rack.basemesh );
				
				
				//// create rack's particle emitter ////
				createEmitter( this_rack, cur_x, rack_height, cur_z, 0xFFA000 );
								
								
				//// create TMU ////
				if ( $(this).attr( "cooling" ) == "spray" ) {
					this_rack.cooling = "spray";
					this_rack.TMUgeo = new THREE.CubeGeometry( TMU_DEPTH, TMU_HEIGHT, TMU_WIDTH, 1, 1, 1, null, { ny : false, px : false } );
					for ( f in this_rack.TMUgeo.faces )
						for ( v = 0; v < 4; v++ )
							this_rack.TMUgeo.faces[f].vertexColors[v] = new THREE.Color( 0x444455 );
					this_rack.TMUmesh = new THREE.Mesh( this_rack.TMUgeo, rack_mat );
					this_rack.TMUgeo.dynamic = true;
					lastrow_TMU.push( this_rack.TMUmesh );
					this_rack.TMUmesh.position.set( cur_x - rackstats.depth / 2 - TMU_DEPTH / 2, TMU_HEIGHT / 2, cur_z );
					scene.add( this_rack.TMUmesh );
				} else {
					this_rack.cooling = "air";
				}
								
				cur_z += rackstats.width + row_spacebetween;
			});
			
			
			if ( cur_z > max_z )
				max_z = cur_z;			
			cur_x += rackstats.depth + aisle_width;
		});
		$(this).find( "row:last" ).each( function() {
			for ( g in lastrow_mesh )
				lastrow_mesh[g].rotation.y += Math.PI;
			for ( g in lastrow_TMU ) {
				lastrow_TMU[g].rotation.y += Math.PI;
				lastrow_TMU[g].position.x += rackstats.depth + TMU_DEPTH;
			}
		});
		cur_x -= aisle_width - aisle_spacebetween;
	});
	
	// set initial camera position
	cur_x -= aisle_spacebetween + rackstats.depth;
	camera_radius = max_z;
	camera_home = new THREE.Vector3( cur_x / 2, rack_height + 5, camera_radius );
	target = new THREE.Vector3( cur_x / 2, rack_height / 1.8, max_z / 2 );
	camera.position = camera_home;
	camera.lookAt( target );
	
	// create room
	var geo = new THREE.CubeGeometry( ROOM_DIM, ROOM_HEIGHT, ROOM_DIM, 20, 8, 20 );
	var materials = [	new THREE.MeshPhongMaterial( { color : 0xFFFFFF, shading : THREE.FlatShading, shininess : 3, specular: 0xFFFFFF } ),
				new THREE.MeshBasicMaterial( { color : 0x444444, shading : THREE.FlatShading, wireframe : true, wireframeLinewidth : 4, opacity : 0.3, transparent : true } ) ];
			
	var room_mesh = THREE.SceneUtils.createMultiMaterialObject( geo, materials );
	room_mesh.position.set( cur_x / 2, ROOM_HEIGHT / 2, max_z / 2 );
	room_mesh.children[0].doubleSided = true;
	room_mesh.children[1].doubleSided = true;
	room_mesh.children[0].receiveShadow = true;
	scene.add( room_mesh );

	// add two spot lights at each side of the room, facing toward the center,
	// and a fairly bright ambient light
	var t = new THREE.Object3D;
	t.position.set( cur_x / 2, 0, max_z / 2 );
	scene.add( t );
	makeRoofLight( 0, max_z / 2, t );
	makeRoofLight( cur_x, max_z / 2, t );
	
	ambient_light = new THREE.AmbientLight( 0x888899 );
	scene.add( ambient_light );	
	
	// start animation
	$("#main3d img").css( "visibility", "hidden" );
	animate();
	
}


function makeTextMat( text ) {
	var canvas = document.createElement( 'canvas' );
	var context = canvas.getContext( '2d' );
	context.font = "16px Arial";
	context.textBaseline = "top";
	canvas.height = 16;
	canvas.width = context.measureText( text ).width;
	context.fillStyle="#000000";
	context.fillRect( 0, 0, canvas.width, canvas.height );
	context.fillStyle="#FFFFFF";
	context.fillText( text, 0, 0 );
	
	var texture = new THREE.Texture( canvas );
	texture.needsUpdate = true;
	
	return new THREE.MeshBasicMaterial( { size: 10, color: 0xFFFFFF, map: texture, blending: THREE.AdditiveBlending, transparent: true } );
}

function initParticles() {

	var canvas = document.createElement( 'canvas' );
	canvas.width = 16;
	canvas.height = 16;

	var context = canvas.getContext( '2d' );
	var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
	gradient.addColorStop( 0, 'rgba(255,255,255,.8)' );
	gradient.addColorStop( 0.2, 'rgba(255,255,255,.6)' );
	gradient.addColorStop( 0.4, 'rgba(255,255,255,.3)' );
	gradient.addColorStop( 1, 'rgba(0,0,0,0)' );

	context.fillStyle = gradient;
	context.fillRect( 0, 0, canvas.width, canvas.height );
	
	var texture = new THREE.Texture( canvas );
	texture.needsUpdate = true;
	
	particle_mat = new THREE.ParticleBasicMaterial( { size: PARTICLE_SIZE,
																			   color: 0xEEEEEE,
																			   map: texture,
																			   blending: THREE.AdditiveBlending,
																			   vertexColors: true,
																			   transparent: true,
																			   depthTest: false } );
	
	particles_playing = false;

}



// ****** Creates and RETURNS a new emitter at x, y, z
function createEmitter  ( cur_rack,		// current rack
									sys_x,			// float x
									sys_y,			// float y
									sys_z,			// float z
									sys_color ) {	// particle colors
	
	var e = {};
	e.geo = new THREE.Geometry();
	var color = [];
	var original = [];
	for ( var i = 0; i < NUM_PARTICLES; i++ ) {
		var x = rackstats.depth / 2.0 - Math.random() * rackstats.depth;
		var z = rackstats.width / 2.0 - Math.random() * rackstats.width;
		var p = new THREE.Vector3( x, -500, z );
		original.push( new THREE.Vector3( p.x, p.y, p.z ) );
		color.push( new THREE.Color( sys_color ) );
		e.geo.vertices.push( p );
	}
	e.geo.colors = color;
	e.init_pos = original;
	
	e.sys = new THREE.ParticleSystem( e.geo, particle_mat );
	e.sys.position.set( sys_x, sys_y, sys_z );
	e.geo.dynamic = true;
	e.sys.sortParticles = true;
	e.color = new THREE.Color( sys_color );
	e.firstfew = new THREE.Color();
	e.firstfew.setRGB( (1.0 - e.color.r) / FIRST_FEW_TICKS, (1.0 - e.color.g) / FIRST_FEW_TICKS, (1.0 - e.color.b) / FIRST_FEW_TICKS );
	e.lastfew = new THREE.Color();
	e.lastfew.setRGB( e.color.r / LAST_FEW_TICKS / 1.3, e.color.g / LAST_FEW_TICKS / 1.1, e.color.b / LAST_FEW_TICKS );
	e.particles = [];
	e.cur_particle = 0;
	e.rate = 0;
	e.lift = 0;
	
	scene.add( e.sys );
	emitter.push( e );
	cur_rack.emitter = e;
}



function generateParticles( e ) {

	var r = 100 * Math.random();
	//if ( r  < e.rate ) {
	for ( var i = 0; i < Math.floor( r / (100.0 - e.rate)); i++ ) {
		var new_particle = {};
		
		new_particle.vertex = e.geo.vertices[ e.cur_particle ];
		new_particle.color = e.geo.colors[ e.cur_particle ];
		new_particle.color.setRGB( 1.0, 1.0, 1.0 );
		new_particle.init_pos = e.init_pos[ e.cur_particle ];
		new_particle.vertex.y = 0;
		new_particle.age = 0;
		new_particle.lifeExpectancy = PARTICLE_EXPECTANCY_MIN + Math.random() * PARTICLE_EXPECTANCY_RANGE;
		new_particle.velocity = new THREE.Vector3( 0, e.lift * new_particle.lifeExpectancy / PARTICLE_EXPECTANCY_RANGE, 0 );
		
		e.particles.push( new_particle );
		
		if ( ++e.cur_particle >= NUM_PARTICLES )
			e.cur_particle = 0;
	}
	
}



function ageParticles( e ) {

	for ( p in e.particles ) {
		if ( ++e.particles[p].age > e.particles[p].lifeExpectancy ) {
			e.particles[p].vertex.x = e.particles[p].init_pos.x;
			e.particles[p].vertex.y = e.particles[p].init_pos.y;
			e.particles[p].vertex.z = e.particles[p].init_pos.z;
			e.particles[p].color = e.color;
			e.particles.splice( p, 1 );
		} else {
			// position/velocity change
			e.particles[p].velocity.x += PARTICLE_DRIFT_OFFSET - PARTICLE_DRIFT * Math.random();
			e.particles[p].velocity.y -= PARTICLE_GRAVITY;
			e.particles[p].velocity.z += PARTICLE_DRIFT_OFFSET - PARTICLE_DRIFT * Math.random();
			
			e.particles[p].vertex.x += e.particles[p].velocity.x;
			e.particles[p].vertex.y += e.particles[p].velocity.y;
			e.particles[p].vertex.z += e.particles[p].velocity.z;
			
			// color change
			var timeRemaining = e.particles[p].lifeExpectancy - e.particles[p].age;

			if ( e.particles[p].age <= FIRST_FEW_TICKS ) {
				e.particles[p].color.r -= e.firstfew.r;
				e.particles[p].color.g -= e.firstfew.g;
				e.particles[p].color.b -= e.firstfew.b;
			} else if ( timeRemaining <= LAST_FEW_TICKS ) {
				e.particles[p].color.r -= e.lastfew.r;
				e.particles[p].color.g -= e.lastfew.g;
				e.particles[p].color.b -= e.lastfew.b;
			}
		}
	}

}



// ******Adds a spot light on the roof, directed toward target t
function makeRoofLight(	x,			// float x coordinate of spot light along roof
									z,			// float z coordinate of spot light along roof
									t ) {		// 3D object t as a pointing target for the light

	var spotlight = new THREE.SpotLight( 0xFFFFFF, 2 );
	spotlight.position.set( x, ROOM_HEIGHT, z );
	spotlight.target = t;
	spotlight.castShadow = true;
	spotlight.shadowDarkness = 0.5;
	spotlight.shadowMapWidth = 1024;
	spotlight.shadowMapHeight = 1024;
	spotlight.shadowMapDarkness = 0.7;
	spotlight.shadowBias = 0.0001;
	spotlight.shadowCameraNear = NEAR; spotlight.shadowCameraFar = FAR; spotlight.shadowCameraFov = VIEW_ANGLE;
	scene.add( spotlight );
	
	var pointlight = new THREE.PointLight( 0xFFFFFF, 0.1 );
	pointlight.position.set( x, ROOM_HEIGHT, z );
	scene.add( pointlight );
	
}



// ****** Animation loop function
function animate() {
	
	requestAnimationFrame( animate );
	render();
	
}



// ****** Rendering function executed every refresh, responsible also for moving the camera
function render() {

	////////////////   UPDATE CAMERA POSITION   ///////////////
	if ( mouse_x != 0 && azimuth != 0 )
		azimuth += mouse_x * MOUSE_SPEED *  ( 1 - ((mouse_x * azimuth) / Math.abs(mouse_x * azimuth))  * (Math.abs(azimuth)/ MAX_AZIMUTH) );
	else
		azimuth += mouse_x * MOUSE_SPEED * ( 1 - (Math.abs(azimuth) / MAX_AZIMUTH) );
	
	if ( mouse_decay == true ) {
		if ( Math.abs( mouse_x ) < 0.1 ) {
			mouse_decay = false;
			mouse_x = 0;
		}
		mouse_x /= 1.1;
	}
	
	camera.position.x = target.x + camera_radius * Math.sin( azimuth );
	camera.position.z = target.z + camera_radius * Math.cos( azimuth );
	camera.lookAt( target );

	//////////////   PARTICLES   ////////////////
	if ( particles_playing == true ) {
		for ( e in emitter ) {
			generateParticles( emitter[e] );
			ageParticles( emitter[e] );
			emitter[e].geo.verticesNeedUpdate = true;
			emitter[e].geo.colorsNeedUpdate = true;
		}
	}
	
	//////////////   RENDER   ///////////////////
	renderer.render( scene, camera );
	
}



// ****** Displays an error to the console when the requested XML file cannot be loaded
function xmlGetError( jqXHR, textStatus, errorThrown ) {

	$("#labstats").append( textStatus + ": " + errorThrown );
	
}