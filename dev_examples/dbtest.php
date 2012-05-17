<?php
$db = pg_connect('host=db.cecs.pdx.edu port=5432 dbname=ccapps user=ccapps password=perftrack') or die('Could not connect');

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
