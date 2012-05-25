<?php
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_COMPILE_ERROR);

function generate_node_json($trial = 1, $low = 50, $high = 100, $limit = 100)
{
	//Three steps:
	// - Connect to db using password retrieved from password.txt
	// - Run query and set up empty arrays
	// - Build the giant array


	//When you run this yourself, just put a password.txt file in the directory
	//and put just the password in the file
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

	$prevtime = NULL;
	$tick_data = NULL;
	$timecount = 0;
	$data = array();

	while ($row = pg_fetch_assoc($result)) {
	    if ($prevtime != $row['date'])
	    {
	    	if ($tick_data) {array_push($data, $tick_data);} //push old tick data
		    $tick_data = array('time'  => $timecount,
		     				   'nodes' => array());
		    $timecount++;
	    }
	    
	    $node_info = array('node'    => $row['node'],
	    				   'tempIn'  => $row['airintemp'],
	    				   'tempOut' => $row['airexchangetemp']);
	    
	    array_push($tick_data['nodes'], $node_info);
	    
	    
	    $prevtime = $row['date'];
	}

	pg_close($db);
	
	return json_encode($data);
}


	
print_r(generate_node_json(1, 0, 0, 200));



?>
