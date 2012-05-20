SELECT t1.experiment, t1.trial, t1.rack, CAST(t1.node as integer) AS node, t1.dimm1temp, t2.dimm2temp, (t1.dimm1temp + t2.dimm2temp)/2 AS avg_dimm_temp, t1.date FROM
(
(
SELECT experiment, trial, substring (data_category from 5 for 2) AS rack, 
substring (data_category from 11) AS node, 
data_type, date, data_value AS dimm1temp 
FROM dimm_temp WHERE data_type = 'DIMM1Temp'
) as t1
JOIN 
(
SELECT experiment, trial, substring (data_category from 5 for 2) AS rack, substring (data_category from 11) AS node, data_type, date, data_value AS dimm2temp
FROM dimm_temp WHERE data_type = 'DIMM2Temp'
) as t2
ON (t1.experiment=t2.experiment AND t1.node=t2.node AND t1.date = t2.date AND t1.trial = t2.trial)
)
ORDER BY node, date
