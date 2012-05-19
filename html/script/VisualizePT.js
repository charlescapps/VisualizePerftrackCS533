// 3D globals
var WIDTH, HEIGHT, VIEW_ANGLE, ASPECT, NEAR, FAR, rack_height, renderer, camera, scene, directional_light, point_light, ambient_light;
var U = 1.75;							// rackspace unit height
var dU = .15;							// space between rackspaces
var rack_mat;						// common rack material


// data globals
var $lab;			// full input XML file
var aisle = [];		// array of all aisles
var rack = [];		// array of all racks
var node = [];		// array of all nodes
var rackstats;		// stats common to all racks 



$(window).load (function() {

	// initialize the 3D engine
	setup3D();
	
	// get XML file and when complete, execute getLabSetup
	$.ajax( {type: "GET", url: "script/labconfig.xml", dataType: "xml", success: getLabSetup, error: xmlGetError} );
	
});


$(window).resize (function() {
	WIDTH = $("#main3d").width(); HEIGHT = $("#main3d").height();
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
	renderer.setSize( WIDTH, HEIGHT );
});

// initializes the 3D environment
function setup3D() {

	// initialize 3d globals
	WIDTH = $("#main3d").width(); HEIGHT = $("#main3d").height();
	VIEW_ANGLE = 45; ASPECT = WIDTH / HEIGHT; NEAR = 50; FAR = 1000;	// camera setup vars
	
	// initialize renderer
	renderer = new THREE.WebGLRenderer();
    renderer.setSize( WIDTH, HEIGHT );
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
				scene.add( this_rack.topmesh );
				
				// create nodes
				geo = new THREE.CubeGeometry(	rackstats.depth, rackstats.maxnodes * U, rackstats.width,
																			1, rackstats.maxnodes, 1, null, { py: false, ny: false }  );
				mat = [ new THREE.MeshLambertMaterial( { color : 0x000099, vertexColors: THREE.FaceColors } ),
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
				scene.add( this_rack.nodemesh );

				// create base of rack
				geo = new THREE.CubeGeometry( rackstats.depth, rackstats.base, rackstats.width, 1, 1, 1, null, { py: false, ny : false } );
				this_rack.basemesh = new THREE.Mesh( geo, rack_mat );
				this_rack.basemesh.position.set( cur_x, rackstats.base / 2, cur_z );
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
	camera.position.set( cur_x / 2, rack_height + 1, max_z *  1.8 );
	camera.lookAt( new THREE.Vector3( cur_x / 2, rack_height / 2, 0 ) );
	
	var room_mesh = makeSolidWireframeMesh( new THREE.CubeGeometry( 317.5, 120, 317.5, 20, 8, 20 ), 0xffff99, 0.15, 4, 0x444444, false );
	room_mesh.position.set( cur_x / 2, 60, max_z / 2 );
	scene.add( room_mesh );

	/*
	directional_light = new THREE.DirectionalLight( 0xffffff );
	directional_light.position.set( 0, -1, -1 ).normalize();
	scene.add( directional_light );
	*/
	
	point_light = new THREE.PointLight( 0xFFFFFF );
	point_light.position = camera.position;
	scene.add( point_light );
	
	ambient_light = new THREE.AmbientLight( 0x333333 );
	ambient_light.color.setHSV( 0.1, 0.5, 0.3 );
	scene.add( ambient_light );
	
	// start animation
	animate();
	
}


// animation loop function
function animate() {
	
	requestAnimationFrame( animate );
	
	renderer.render( scene, camera );
	
}


function makeSolidWireframeMesh( geometry, facecolor, wire_op, linewidth, linecolor, transp ) {

	if ( linecolor === undefined ) linecolor = facecolor;
	if ( linewidth === undefined ) linewidth = 1;
	if ( transp === undefined ) transp = false;
	if ( wire_op === undefined ) wire_op = 1.0;

	var materials = [
		new THREE.MeshBasicMaterial( { color : facecolor, shading : THREE.FlatShading, opacity : 0.5, transparent : transp } ),
		new THREE.MeshBasicMaterial( { color : linecolor, shading : THREE.FlatShading, wireframe : true, wireframeLinewidth : linewidth, opacity : wire_op, transparent : false } )
		];
	return new THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
	
}



function xmlGetError( jqXHR, textStatus, errorThrown ) {

	$("#labstats").append( textStatus + ": " + errorThrown );
	
}