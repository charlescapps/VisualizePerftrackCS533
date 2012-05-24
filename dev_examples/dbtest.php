<?php
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_COMPILE_ERROR);

//Super cheap way to avoid putting charles's pw on github.
//When you run this yourself, just put a password.txt file in the directory
//and put just the password in the file
$pwfile = fopen('password.txt', 'r');
$pw = fgets($pwfile);
fclose($pwfile);

$db = pg_connect('host=db.cecs.pdx.edu port=5432 dbname=ccapps user=ccapps password='.$pw) or die('Could not connect');

echo pg_last_error($db);

$query = "SELECT * FROM rack_level_data LIMIT 500";

$result = pg_query($query);
if (!$result) {
    echo "Problem with query $query <br />";
    echo pg_last_error();
    exit();
}

echo "<table>";

$prevrow = array();


while ($row = pg_fetch_assoc($result)) {
    if (empty($prevrow)) { //If we don't have a prevrow, this is the first
        echo "<tr>";
        foreach ($row as $key =>$value)
            echo "<td>$key</td>";
        echo "</tr>";
        $prevrow = $row;
    }
    echo "<tr>";
    foreach( $row as $key => $value){
        if ($prevrow[$key] == $value)
    	    echo "<td>" . $value . "</td>";
    	else
    	    echo "<td bgcolor='red'>" . $value . "</td>";
    }
    echo "</tr>";
    $prevrow = $row;
}

echo "</table>";

pg_close($db);
?>
