 SELECT t1.experiment, t1.trial, t1.rack, t1.node::integer AS node, t1.cpu0temp, t2.cpu1temp, (t1.cpu0temp + t2.cpu1temp) / 2::double precision AS avg_cpu_temp, NULL::double precision AS dimm1temp, NULL::double precision AS dimm2temp, NULL::double precision AS avg_dimm_temp, t1.date
   FROM ( SELECT cpu_temp.experiment, cpu_temp.trial, "substring"(cpu_temp.data_category::text, 4, 2) AS rack, "substring"(cpu_temp.data_category::text, 10) AS node, cpu_temp.data_type, cpu_temp.date, cpu_temp.data_value AS cpu0temp
           FROM cpu_temp
          WHERE cpu_temp.data_type::text = 'CPU0Temp'::text) t1
   JOIN ( SELECT cpu_temp.experiment, cpu_temp.trial, "substring"(cpu_temp.data_category::text, 4, 2) AS rack, "substring"(cpu_temp.data_category::text, 10) AS node, cpu_temp.data_type, cpu_temp.date, cpu_temp.data_value AS cpu1temp
           FROM cpu_temp
          WHERE cpu_temp.data_type::text = 'CPU1Temp'::text) t2 ON t1.experiment::text = t2.experiment::text AND t1.node = t2.node AND t1.date = t2.date AND t1.trial = t2.trial
  ORDER BY t1.node::integer, t1.date;
