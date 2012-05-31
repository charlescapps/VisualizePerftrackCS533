<?php
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_COMPILE_ERROR);

// low/high are the expected low and high temperatures, limit is a cheap limit on the number of rows
// TODO: Allow limit to find the number of timestamp?

function generate_node_json($trial = 1, $low = 50, $high = 150, $limit = 200)
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
	
	$query = "SELECT * FROM node_level_data_rand WHERE trial = $trial ORDER BY date, node LIMIT $limit";
	
	$result = pg_query($query);
	if (!$result) {
	    echo "Problem with query $query <br />";
	    echo pg_last_error();
	    exit();
	}	
	
//  ***** Building the array 

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
		    $tick_data = array('time'  => $timecount,
		     				   'nodes' => array());
		    $timecount++;
	    }
	    
	    $tempIn  = round(($row['airintemp']   - $low) * $normalize_size);
	    $tempOut = round(($row['airexchangetemp'] - $low) * $normalize_size);
	    
	    $node_info = array('node'    => $row['node'],
	    				   'tempIn'  => $tempIn,
	    				   'tempOut' => $tempOut);
	    
	    array_push($tick_data['nodes'], $node_info);
	    
	    
	    $prevtime = $row['date'];
	}

	pg_close($db);
	
	return json_encode($data);
}


	
print_r(generate_node_json(1, 60, 110, 200));



?>
