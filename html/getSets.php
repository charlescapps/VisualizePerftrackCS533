<?php
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_COMPILE_ERROR);

// low/high are the expected low and high temperatures, limit is a cheap limit on the number of rows
// TODO: Allow limit to find the number of timestamp?

function generate_node_json($db_table = 'ld_node_data_rand', $trial = 1, $low = 50, $high = 150, $limit = 500)
{

//  ***** Database connection and query *****

	//NOTE: To run this script, put a password.txt in your folder with Charles's
	//db password in it.  I did it this way to avoid putting it on github!
	$pwfile = fopen('password.txt', 'r'); 
	$pw = fgets($pwfile);
	fclose($pwfile);
	
	$conn_string = "host=db.cecs.pdx.edu port=5432 dbname=ccapps user=ccapps password=$pw";
	
	$db = pg_connect($conn_string) or die('Could not connect');
	
	echo pg_last_error($db);
	
	$query = "SELECT * FROM $db_table WHERE trial = $trial ORDER BY date, node LIMIT $limit";
	
	$result = pg_query($query);
	if (!$result) {
	    echo "Problem with query $query <br />";
	    echo pg_last_error();
	    exit();
	}	
	
//  ***** Building the node data 

	// See sample2.json in the dev_examples folder for an example of the output of this file

	$prevtime = NULL;
	$tick_data = NULL;
	$timecount = 0;
	$data = array();
	$normalize_size = 100 / ($high - $low);

	while ($row = pg_fetch_assoc($result)) {
	    if ($prevtime != $row['date'])
	    {
	    	if ($tick_data) {array_push($data, $tick_data);} //push old tick data
		    $tick_data = array('time'  => $row['date'],
		     				   'nodes' => array());
		    $timecount++;
	    }
	    
	    $tempIn  = round(($row['airintemp']   - $low) * $normalize_size) - 1;
	    $tempOut = round(($row['airexchangetemp'] - $low) * $normalize_size) - 1 ;
	    
	    $node_info = array('node'    => $row['node'],
	    				   'tempIn'  => $tempIn,
	    				   'tempOut' => $tempOut);
	    
	    array_push($tick_data['nodes'], $node_info);
	    
	    
	    $prevtime = $row['date'];
	}
	
//  **** Retrieve the rack data

    $query = "SELECT * FROM rack_level_data_good WHERE trial = $trial AND date <= '$prevtime' ORDER BY date, rack";
    
    $result = pg_query($query);
    if (!$result) {
	    echo "Problem with query $query <br />";
	    echo pg_last_error();
	    exit();
	}	
	
	$racks_by_time = array();
	
	//since the sensors are not synchronized, we keep track of the most
	//recent values and build an array that logs the most current values of 
	//each rack, so that they can be filled in
	$rack_power_current = array(); 
	$rack_tempIn_current = array();
	$rack_tempOut_current = array();
	
	$power_norm_size = 100 / (195 - 150);
	
	while ($row = pg_fetch_assoc($result))  //this is some of the last code I wrote, melted
	{
		
		$power = round(max($row['powerkwh'] - 150, 1) * $power_norm_size) - 1;
		$tmuTempIn = round(max($row['waterinlettemp'] - $low, 1) * $normalize_size) - 1;
		$tmuTempOut = round(max($row['wateroutlettemp'] - $low, 1) * $normalize_size) - 1;
		
		$rack_power_current[$row['rack']] = $power;
		$rack_tempIn_current[$row['rack']] = $tmuTempIn;
		$rack_tempOut_current[$row['rack']] = $tmuTempOut;
		
		$racks_by_time[$row['date']] = array();
		
		foreach (array_keys($rack_power_current) as $rack_name)
		{
			$rack_info = array('rack' => $rack_name,
						       'power' => $rack_power_current[$rack_name],
						       'tmuTempIn' => $rack_tempIn_current[$rack_name],
						       'tmuTempOut' => $rack_tempOut_current[$rack_name]);
		    array_push($racks_by_time[$row['date']], $rack_info);
		}
	}
	
	pg_close($db);

//  ***** Mix in the rack data

	//This is used later for a PHP array trick.  Unlike other languages, PHP
	//doesn't let you access elements in an associative array by index.  So
	//instead, I'll write something like this later:  $racks_by_time[$rack_keys[1]]
	$rack_keys = array_keys($racks_by_time); 
	$racks_by_time[$rack_keys[1]]; //php doesn't let you access associative arrays by index, so here's a trick! whee
	$rack_time_index = 0; //where in the rack array are we as we fold that into data?
	$final_index = sizeof($data);
	
	
	foreach ($data as &$entry)
	{ 
		while($rack_keys[$rack_time_index] < $entry['time'])
		{ 
			$rack_time_index++;
		} 
		$entry['racks'] = $racks_by_time[$rack_keys[$rack_time_index]];
	}

	
	return json_encode($data);
}

if ($_GET['set'] == 'HD')
{
	$db_table = 'hd_node_data_rand';
	$limit = 10000;
} else {
	$db_table = 'ld_node_data_rand';
	$limit = 1000;
}


	
print_r(generate_node_json($db_table, 1, 60, 110, $limit));



?>
