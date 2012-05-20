SELECT t1.experiment, t1.trial, t1.rack, CAST(t1.node as integer) AS node, t1.cpu0temp, t2.cpu1temp, t1.date FROM
(
    (
    SELECT experiment, trial, substring (data_category from 4 for 2) AS rack, 
    substring (data_category from 10) AS node, 
    data_type, date, data_value AS CPU0Temp 
    FROM cpu_temp WHERE data_type = 'CPU0Temp'
    ) as t1
JOIN 
    (
    SELECT experiment, trial, substring (data_category from 4 for 2) AS rack, substring (data_category from 10) AS node, data_type, date, data_value AS cpu1temp
    FROM cpu_temp WHERE data_type = 'CPU1Temp'
    ) as t2
ON (t1.experiment=t2.experiment AND t1.node=t2.node AND t1.date = t2.date AND t1.trial = t2.trial)
)
ORDER BY node, date
