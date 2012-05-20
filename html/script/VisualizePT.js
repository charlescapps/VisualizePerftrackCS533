// 3D globals
var WIDTH, HEIGHT, VIEW_ANGLE, ASPECT, NEAR, FAR, angle, mouse, rack_height, renderer, target, camera_radius, camera_home, scene, directional_light, point_light, ambient_light, spotlight, spotlight_target;
var U = 1.75;							// rackspace unit height
var max_angle = Math.PI / 2;
var MOUSE_SPEED = 0.0001
var mouse_decay;
var rack_mat;						// common rack material


// data globals
var $lab;			// full input XML file
var aisle = [];		// array of all aisles
var rack = [];		// array of all racks
var node = [];		// array of all nodes
var rackstats;		// stats common to all racks 



$(window).load( function() {

	// initialize the 3D engine
	setup3D();
	
	// get XML file and when complete, execute getLabSetup
	$.ajax( {type: "GET", url: "script/labconfig.xml", dataType: "xml", success: getLabSetup, error: xmlGetError} );
	
	$("#main3d").mousedown( function() {
		mouse_decay = false;
		mouse = 0;
		$("#main3d").bind( "mousemove", function( event ) {
			mouse = event.pageX - $("#main3d").position().left - $("#main3d").width() / 2;
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



$(window).resize( function() {

	WIDTH = $("#main3d").width(); HEIGHT = $("#main3d").height();
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
	renderer.setSize( WIDTH, HEIGHT );
	
});



// initializes the 3D environment
function setup3D() {

	// initialize 3d globals
	WIDTH = $("#main3d").width(); HEIGHT = $("#main3d").height();
	VIEW_ANGLE = 65; ASPECT = WIDTH / HEIGHT; NEAR = 5; FAR = 1000;	// camera setup vars
	angle = 0, mouse = 0, mouse_decay = true;
	
	// initialize renderer
	renderer = new THREE.WebGLRenderer( { antialias : true, shadowMapEnabled : true, shadowMapSoft : true, gammaInput : true, gammaOutput : true } );
    renderer.setSize( WIDTH, HEIGHT );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
    $("#main3d").append( renderer.domElement );

	// initialize scene
    scene = new THREE.Scene();

	// add camera
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
    scene.add( camera );
    target = new THREE.Vector3();
	
	// setup materials
	rack_mat = new THREE.MeshPhongMaterial( { color: 0x111111, ambient: 0x000000, shininess: 4 } );
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



// this function creates the lab's 3d objects and associates them with the primary data structures
function createLab() {

	var cur_x = 0, max_z = 0;
	var aisle_spacebetween;
	rack_height = rackstats.base + rackstats.maxnodes * U + rackstats.top;

	

	$($lab).find( "aisle" ).each( function() {
		var aisle_width = parseInt( $(this).attr("width") );
		aisle_spacebetween = parseInt( $(this).attr("spacebetween") );
		$(this).find( "row:first, row:last" ).each( function() {
			var cur_z = 0;
			var row_spacebetween = parseInt( $(this).attr("spacebetween") );
			
			$(this).find( "rack" ).each( function() {
				var i, j;
				var rack_name = $(this).attr("name");
				var rack_numnodes = parseInt( $(this).attr("nodes") );
				var cur_y;
				var this_rack = rack.filter( function (element, index, array) {
					return rack_name == element.name;
				} )[0];
				
				var geo, mat, this_mesh;
				
				// create top of rack
				geo = new THREE.CubeGeometry( rackstats.depth, rackstats.top, rackstats.width, 1, 1, 1, null, { ny: false } );
				this_rack.topmesh = new THREE.Mesh( geo, rack_mat );
				this_rack.topmesh.position.set( cur_x, rack_height - rackstats.top / 2, cur_z );
				this_rack.topmesh.castShadow = true;
				scene.add( this_rack.topmesh );
				
				// create nodes
				geo = new THREE.CubeGeometry(	rackstats.depth, rackstats.maxnodes * U, rackstats.width,
																			1, rackstats.maxnodes, 1, null, { py: false, ny: false }  );
				mat = [ new THREE.MeshPhongMaterial( { color : 0x000099, vertexColors: THREE.VertexColors, shininess: 4 } ),
							new THREE.MeshBasicMaterial( { color: 0xFFFFFF, wireframe: true, wireframeLinewidth: 3, transparent: true, opacity: 0.1 } ) ];
				this_rack.nodemesh = new THREE.SceneUtils.createMultiMaterialObject( geo, mat );
				this_rack.nodemesh.position.set( cur_x, rack_height - (rackstats.maxnodes * U / 2) - rackstats.top, cur_z );
				for ( i = 0; i < rack_numnodes; i++ ) {
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
								
				cur_z += rackstats.width + row_spacebetween;
			});
			if ( cur_z > max_z )
				max_z = cur_z;			
			cur_x += rackstats.depth + aisle_width;
		});

		cur_x -= aisle_width + rackstats.depth - aisle_spacebetween;
	});
	
	// set initial camera position
	cur_x -= aisle_spacebetween;
	camera_radius = max_z * 1.1;
	camera_home = new THREE.Vector3( cur_x / 2, rack_height + 1, camera_radius );
	target = new THREE.Vector3( cur_x / 2, rack_height / 2, max_z / 2 );
	camera.position = camera_home;
	camera.lookAt( target );
	
	// create room
	var geo = new THREE.CubeGeometry( 317.5, 120, 317.5, 20, 8, 20 );
	var materials = [	new THREE.MeshPhongMaterial( { color : 0xFFFFFF, shading : THREE.SmoothShading, shininess : 5 } ),
				new THREE.MeshBasicMaterial( { color : 0x444444, shading : THREE.FlatShading, wireframe : true, wireframeLinewidth : 4, opacity : 0.3, transparent : true } ) ];
			
	var room_mesh = THREE.SceneUtils.createMultiMaterialObject( geo, materials );
	room_mesh.position.set( cur_x / 2, 60, max_z / 2 );
	room_mesh.children[0].doubleSided = true;
	room_mesh.children[1].doubleSided = true;
	room_mesh.children[0].receiveShadow = true;
	room_mesh.children[1].receiveShadow = true;
	scene.add( room_mesh );

	// add lights

	
	directional_light = new THREE.DirectionalLight( 0x666666 );
	directional_light.position.set( 0, 1, 0 ).normalize();
	scene.add( directional_light );
	
	
	ambient_light = new THREE.AmbientLight( 0x555555 );
	scene.add( ambient_light );
	
	var target_obj = new THREE.Object3D;
	target_obj.position.set( cur_x / 2, 0, max_z / 2 );
	scene.add( target_obj );
	spotlight = new THREE.SpotLight( 0xFFFFFF, 3 );
	spotlight.position.set( cur_x / 2, 120, max_z / 2 );
	spotlight.target = target_obj;
	spotlight.castShadow = true;
	
	spotlight.shadowDarkness = 0.5;
	spotlight.shadowMapWidth = 1024;
	spotlight.shadowMapHeight = 1024;
	spotlight.shadowMapDarkness = 0.95;
	spotlight.shadowBias = 0.0001;
	spotlight.shadowCameraNear = NEAR; spotlight.shadowCameraFar = FAR; spotlight.shadowCameraFov = VIEW_ANGLE;
	
	scene.add( spotlight );
	
/*
	point_light = new THREE.SpotLight( 0x666666, 2 );
	point_light.position = camera.position;
	point_light.target = target_obj;
	point_light.castShadow = true;
	point_light.shadowMapWidth = 1024;
	point_light.shadowMapHeight = 1024;
	point_light.shadowMapDarkness = 0.95;
	scene.add( point_light );
*/
	
	
	// start animation
	animate();
	
}


// sets the color of a node based on incoming/outgoing air temperatures
// normalized on a 0-99 scale
// this will eventually show both incoming and outgoing temperatures simultaneously
// but for now, it will just show outgoing air temperature for testing purposes
function setNodeTemp( node_no, temp_in, temp_out ) {
	var color, red, blue;
	temp_out %= 100;
	
	blue = Math.floor(0x0000FF - temp_out * (0x0000FF / 100.0) ).toString( 16 );
	red = Math.floor(temp_out * (0x0000FF / 100.0)).toString( 16 );
	color = "0x" + red + "00" + blue;
	
	node[node_no].faces.color.setHex( color );
}


// animation loop function
function animate() {
	
	requestAnimationFrame( animate );
	render();
	
}



function render() {

	if ( mouse != 0 && angle != 0 )
		angle += mouse * MOUSE_SPEED *  ( 1 - ((mouse * angle) / Math.abs(mouse * angle))  * (Math.abs(angle)/ max_angle) );
	else
		angle += mouse * MOUSE_SPEED * ( 1 - (Math.abs(angle) / max_angle) );
	
	if ( mouse_decay == true ) {
		if ( Math.abs( mouse ) < 0.1 ) {
			mouse_decay = false;
			mouse = 0;
		}
		mouse /= 1.1;
	}
	
	camera.position.x = target.x + camera_radius * Math.sin( angle );
	camera.position.z = target.z + camera_radius * Math.cos( angle );
	camera.lookAt( target );

	renderer.render( scene, camera );
	
}



function xmlGetError( jqXHR, textStatus, errorThrown ) {

	$("#labstats").append( textStatus + ": " + errorThrown );
	
}