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
var rack_mat;						// common rack material
var rack_name;

// Particle variables
var particles_playing;
var particle_geo, particle_mat;
var emitter = [];
var NUM_PARTICLES = 200;
var PARTICLE_SIZE = 15;
var PARTICLE_HUE = 0.1, PARTICLE_SAT = 0.9, PARTICLE_VAL = 0.8;
var PARTICLE_DRIFT = 0.3, PARTICLE_DRIFT_OFFSET = 0.15, PARTICLE_LIFT = 1.2, PARTICLE_LIFT_RANGE = 1.0, PARTICLE_GRAVITY = 0.055;
var PARTICLE_EXPECTANCY_RANGE = 4, PARTICLE_EXPECTANCY_MIN = 25;

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
									
	var in_color, out_color, red, blue;
	temp_in %= 100;
	temp_out %= 100;
	
	// produce node's color
	blue = Math.floor(0x0000FF - temp_out * (0x0000FF / 99.0) ).toString( 16 );
	red = Math.floor(temp_out * (0x0000FF / 99.0)).toString( 16 );
	in_color = "0x" + red + "00" + blue;
	
	// set the color of each of the node's faces
	for ( var j = 0; j < 4; j++ )
		node[node_no].faces[j].color.setHex( parseInt( in_color ) );
	// and flag the node's geometry as needing its colors updated in the next refresh	
	node[node_no].geo.colorsNeedUpdate = true;
}


// Sets the sparkiness of a rack based on its power usage, normalized on a 0-99 scale
function setRackEnergy(	rack_name,	// String rack's name ( "A1", "B4", etc )
										energy ) {		// int (0~99) normalized energy level

	var this_rack = rack.filter( function (element, index, array) {
					return rack_name == element.name;
				} )[0];
	energy %= 100;
	
	this_rack.emitter.rate = energy;
	this_rack.emitter.lift = PARTICLE_LIFT + ( energy / 100.0 * PARTICLE_LIFT_RANGE - PARTICLE_LIFT_RANGE / 2.0 );

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
	
		for ( r in rack )
		setRackEnergy( rack[r].name, Math.round( Math.random() * 99 ) );
		playAnimations();
	
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
	rack_mat = new THREE.MeshPhongMaterial( { color: 0x111111, ambient: 0x000000, shininess: 4, specular: 0xFFFFFF } );
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

	$($lab).find( "aisle" ).each( function() {
		var aisle_width = parseInt( $(this).attr("width") );
		aisle_spacebetween = parseInt( $(this).attr("spacebetween") );
		$(this).find( "row:first, row:last" ).each( function() {
			var cur_z = 0;
			var row_spacebetween = parseInt( $(this).attr("spacebetween") );
			
			$(this).find( "rack" ).each( function() {
				var i, j;
				rack_name = $(this).attr("name");
				var rack_numnodes = parseInt( $(this).attr("nodes") );
				var cur_y;
				var this_rack = rack.filter( function (element, index, array) {
					return rack_name == element.name;
				} )[0];
				
				var geo, mat, this_mesh;
				
				// create the name of the rack
				/*
				var c = document.createElement( "canvas" );
				c.getContext("2d").font = "50px, Monospace";
				c.getContext("2d").fillText( "RACK " + rack_name, 2, 50 );
				c.width = 50 * 7;
				c.height = 100;
				var tex = new THREE.Texture( c );
				tex.needsUpdate = true;
				//var mat = new THREE.MeshBasicMaterial( { map: tex } );
				//mat.transparent = true;
				//var sprite = new THREE.Sprite( { map: tex, useScreenCoordinates: false, affectedByDistance: true, color: 0xFFFFFF } );
				//var sprite = new THREE.Mesh( new THREE.PlaneGeometry( rackstats.width, rackstats.width / 10 ), mat );
				//sprite.rotation.set( Math.PI / 2, 0, Math.PI / 2 );
				//sprite.doubleSided = true;
				sprite.position.set( cur_x, rack_height + 5, cur_z );
				scene.add( sprite );
				*/
				
				// create top of rack
				geo = new THREE.CubeGeometry( rackstats.depth, rackstats.top, rackstats.width, 1, 1, 1, null, { ny: false } );
				this_rack.topmesh = new THREE.Mesh( geo, rack_mat );
				this_rack.topmesh.position.set( cur_x, rack_height - rackstats.top / 2, cur_z );
				this_rack.topmesh.castShadow = true;
				scene.add( this_rack.topmesh );
				
				// create nodes
				geo = new THREE.CubeGeometry(	rackstats.depth, rackstats.maxnodes * U, rackstats.width,
																			1, rackstats.maxnodes, 1, null, { py: false, ny: false }  );
				mat = [ new THREE.MeshPhongMaterial( { color : 0x000099, vertexColors: THREE.VertexColors, shininess: 7, specular: 0xFFFFFF } ),
							new THREE.MeshBasicMaterial( { color: 0xFFFFFF, wireframe: true, wireframeLinewidth: 3, transparent: true, opacity: 0.1 } ) ];
				this_rack.nodemesh = new THREE.SceneUtils.createMultiMaterialObject( geo, mat );
				this_rack.nodemesh.position.set( cur_x, rack_height - (rackstats.maxnodes * U / 2) - rackstats.top, cur_z );
				geo.dynamic = true;
				for ( i = 0; i < rack_numnodes; i++ ) {
					this_rack.node[i].geo = geo;
					this_rack.node[i].faces = [];
					for ( j = 0; j < 4; j++ )
						this_rack.node[i].faces.push( geo.faces[j * rackstats.maxnodes + i] );
				}
				for ( ; i < rackstats.maxnodes; i++ )
					for ( j = 0; j < 4; j++ )
						geo.faces[j * rackstats.maxnodes + i].color.setHex( 0x444444 );
				this_rack.nodemesh.children[0].castShadow = true;
				scene.add( this_rack.nodemesh );

				// create base of rack
				geo = new THREE.CubeGeometry( rackstats.depth, rackstats.base, rackstats.width, 1, 1, 1, null, { py: false, ny : false } );
				this_rack.basemesh = new THREE.Mesh( geo, rack_mat );
				this_rack.basemesh.position.set( cur_x, rackstats.base / 2, cur_z );
				this_rack.basemesh.castShadow = true;
				scene.add( this_rack.basemesh );
				
				// create rack's particle emitter
				createEmitter( this_rack, cur_x, rack_height, cur_z );
								
				cur_z += rackstats.width + row_spacebetween;
			});
			if ( cur_z > max_z )
				max_z = cur_z;			
			cur_x += rackstats.depth + aisle_width;
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
	animate();
	
}


function initParticles() {

	var canvas = document.createElement( 'canvas' );
	canvas.width = 16;
	canvas.height = 16;

	var context = canvas.getContext( '2d' );
	var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
	gradient.addColorStop( 0, 'rgba(255,255,255,.8)' );
	gradient.addColorStop( 0.2, 'rgba(255,160,0,.6)' );
	gradient.addColorStop( 0.4, 'rgba(204,85,0,.4)' );
	gradient.addColorStop( 1, 'rgba(0,0,0,0)' );

	context.fillStyle = gradient;
	context.fillRect( 0, 0, canvas.width, canvas.height );
	
	var texture = new THREE.Texture( canvas );
	texture.needsUpdate = true;
	
	particle_mat = new THREE.ParticleBasicMaterial( { size: PARTICLE_SIZE,
																			   map: texture,
																			   blending: THREE.AdditiveBlending,
																			   transparent: true } );
	
	particles_playing = false;

}



// ****** Creates and RETURNS a new emitter at x, y, z
function createEmitter  ( cur_rack,		// current rack
									sys_x,			// float x
									sys_y,			// float y
									sys_z ) {		// float z
	
	var e = {};
	e.geo = new THREE.Geometry();
	for ( var i = 0; i < NUM_PARTICLES; i++ ) {
		var x = rackstats.depth / 2.0 - Math.random() * rackstats.depth;
		var z = rackstats.width / 2.0 - Math.random() * rackstats.width;
		var p = new THREE.Vector3( x, -500, z );
		e.geo.vertices.push( p );
	}
	e.sys = new THREE.ParticleSystem( e.geo, particle_mat );
	e.sys.position.set( sys_x, sys_y, sys_z );
	e.sys.dynamic = true;
	e.sys.sortParticles = true;
	e.particles = [];
	e.rate = 0;
	e.lift = 0;
	
	scene.add( e.sys );
	emitter.push( e );
	cur_rack.emitter = e;
}



function generateParticles( e ) {

	var r = 100 * Math.random();
	//if ( r  < e.rate ) {
	for ( var i = 0; i < Math.floor( r / (100 - e.rate / 1.01)); i++ ) {
		var new_particle = {};
		do {
			new_particle.vertex = e.geo.vertices[ Math.floor( Math.random() * (NUM_PARTICLES - 1) ) ];
		} while ( e.particles.indexOf( new_particle.vertex ) != -1 );
		new_particle.vertex.y = 0;
		new_particle.age = 0;
		new_particle.lifeExpectancy = PARTICLE_EXPECTANCY_MIN + Math.random() * PARTICLE_EXPECTANCY_RANGE;
		new_particle.velocity = new THREE.Vector3( 0, e.lift, 0 );
		
		e.particles.push( new_particle );
	}
	
}



function ageParticles( e ) {

	for ( p in e.particles ) {
		if ( ++e.particles[p].age > e.particles[p].lifeExpectancy ) {
			e.particles[p].vertex.x = rackstats.depth / 2.0 - Math.random() * rackstats.depth;
			e.particles[p].vertex.y = -500;
			e.particles[p].vertex.z = rackstats.width / 2.0 - Math.random() * rackstats.width;
			e.particles.splice( p, 1 );
		} else {
			var drift =  PARTICLE_DRIFT_OFFSET - PARTICLE_DRIFT * Math.random();
			e.particles[p].velocity.x += drift;
			e.particles[p].velocity.y -= PARTICLE_GRAVITY;
			e.particles[p].velocity.z += drift;
			
			e.particles[p].vertex.x += e.particles[p].velocity.x;
			e.particles[p].vertex.y += e.particles[p].velocity.y;
			e.particles[p].vertex.z += e.particles[p].velocity.z;
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
		}
	}
	
	//////////////   RENDER   ///////////////////
	renderer.render( scene, camera );
	
}



// ****** Displays an error to the console when the requested XML file cannot be loaded
function xmlGetError( jqXHR, textStatus, errorThrown ) {

	$("#labstats").append( textStatus + ": " + errorThrown );
	
}