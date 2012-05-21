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

$query = "SELECT * FROM tower";

$result = pg_query($query);
if (!$result) {
    echo "Problem with query $query <br />";
    echo pg_last_error();
    exit();
}

echo "<table>";

while ($row = pg_fetch_assoc($result)) {
    echo "<tr>";
    echo "<td>" . $row['data_type'] . "</td>";
    echo "<td>" . $row['date'] . "</td>";
    echo "<td>" . $row['data_value'] . "</td>";
    echo "</tr>";
}

echo "</table>";

pg_close($db);
?>
