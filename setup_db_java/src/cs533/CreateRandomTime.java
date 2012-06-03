package cs533; 

import java.sql.Connection; 
import java.sql.Statement; 
import java.sql.DriverManager; 
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class CreateRandomTime {

    public static class Time implements Cloneable {
        public int h; 
        public int m; 
        public int s; 
        public int ms; 
        private String startDate; 
        public Time(int hr, int min, int s, int ms, String startDate) {
            this.h = hr; 
            this.m = min; 
            this.s = s; 
            this.ms = ms;
            this.startDate = startDate; 
        }

        public String addMillis(int millis) {
            ms+=millis; 

            if (ms >= 1000) {
                int tmp = ms; 
                ms = tmp % 1000; 
                s += tmp / 1000; 
            }

            if (s >= 60) {
                int tmp = s; 
                s = tmp % 60; 
                m += tmp / 60; 
            }

            if (m >= 60) {
                int tmp = m; 
                m = tmp % 60; 
                h += tmp / 60; 
            }

            return this.toString(); 

        }

        public String addSecond() {
            s++; 
            if (s >= 60) {
                s = 0; 
                m++; 
                if (m >= 60) {
                    m = 0;
                    h++; 
                    if (h >= 24) {
                        h = 0; 
                    }
                }
            }
            return this.toString(); 
        }

        @Override
        public String toString() {
            return startDate + " " + h + ":" + m + ":" + s + "." + ms; 
        }

        @Override
        public Object clone() {
            return new Time(h, m, s, ms, startDate); 
        }

    }

    
    private final Time t1StartTime; 
    private final Time t2StartTime; 
    private final Time t3StartTime; 
    private final int t1Inc; 
    private final int t2Inc; 
    private final int t3Inc; 

    private static final double CPU_TEMP_AVG = 75.0; 
    private static final double DIMM_TEMP_AVG = 110.0; 
    private static final double AIR_IN_TEMP_AVG = 65.0; 
    private static final double AIR_EXCHANGE_AVG = 110.0; 
    private static final double ASIC_TEMP_AVG = 120.0; 

    private static final double SIN_AMPLITUDE = 25.0; 
    private static final double STD_DEV = 1.5; 

    private static final int NUM_PER_NODE = 250; 
    private final String EXP_STR;
    private final static int MIN_TRIAL = 1; 
    private final static int MAX_TRIAL = 3; 

    private final List<String> RACK_STRS; 
    private final HashMap<String, List<Integer>> NODES_IN_RACK; 
    private final List<Integer> NODES; 

    private final List<String> HD_RACK_STRS; 
    private final HashMap<String, List<Integer>> HD_NODES_IN_RACK; 
    private final List<Integer> HD_NODES; 

    private static final double SIN_FREQ = 8.0*2.0*Math.PI/((double)NUM_PER_NODE);
    private static final int FREQ_VAR = 3; 

    private Connection connexion; 
    private String outputTable;
    java.util.Random rand; 

    public CreateRandomTime(String connectStr, String userName, String pass, 
            String outputTable, Time t1StartTime, int t1DurationMillis, 
            Time t2StartTime, int t2DurationMillis, 
            Time t3StartTime, int t3DurationMillis, 
            String experiment) throws SQLException {

        this.EXP_STR = experiment;

        this.t1StartTime = t1StartTime; 
        this.t2StartTime = t2StartTime; 
        this.t3StartTime = t3StartTime; 
        this.t1Inc = t1DurationMillis / NUM_PER_NODE; 
        this.t2Inc = t2DurationMillis / NUM_PER_NODE; 
        this.t3Inc = t3DurationMillis / NUM_PER_NODE; 

        this.connexion = DriverManager.getConnection(connectStr, userName, pass); 
        this.outputTable = outputTable;
        this.rand = new java.util.Random(System.currentTimeMillis()); 

        this.RACK_STRS = new ArrayList<String>(); 
        this.NODES = new ArrayList<Integer>(); 
        RACK_STRS.add("A1"); 
        RACK_STRS.add("A3"); 
        RACK_STRS.add("A4"); 
        RACK_STRS.add("B1"); 
        RACK_STRS.add("B2"); 
        RACK_STRS.add("B3"); 
        RACK_STRS.add("B4"); 
        NODES_IN_RACK = new HashMap<String, List<Integer>>(); 

        List<Integer> a1 = new ArrayList<Integer>(); 
        a1.add(56); 
        a1.add(70); 
        a1.add(83); 
        NODES_IN_RACK.put("A1", a1); 

        List<Integer> a3 = new ArrayList<Integer>(); 
        a3.add(28); 
        a3.add(42); 
        a3.add(55); 
        NODES_IN_RACK.put("A3", a3); 

        List<Integer> a4 = new ArrayList<Integer>(); 
        a4.add(0); 
        a4.add(14); 
        a4.add(27); 
        NODES_IN_RACK.put("A4", a4); 

        List<Integer> b1 = new ArrayList<Integer>(); 
        b1.add(84);
        b1.add(98); 
        b1.add(111); 
        NODES_IN_RACK.put("B1", b1); 

        List<Integer> b2 = new ArrayList<Integer>(); 
        b2.add(112);
        b2.add(126); 
        b2.add(139); 
        NODES_IN_RACK.put("B2", b2); 

        List<Integer> b3 = new ArrayList<Integer>(); 
        b3.add(140); 
        b3.add(154);
        b3.add(166); 
        NODES_IN_RACK.put("B3", b3); 

        List<Integer> b4 = new ArrayList<Integer>(); 
        b4.add(167); 
        b4.add(181);
        b4.add(191); 
        NODES_IN_RACK.put("B4", b4); 

        NODES.add(0); 
        NODES.add(14);  
        NODES.add(27);  
        NODES.add(28);  
        NODES.add(42);  
        NODES.add(55);  
        NODES.add(56);  
        NODES.add(70);  
        NODES.add(83);  
        NODES.add(84);  
        NODES.add(98);  
        NODES.add(111);  
        NODES.add(112);  
        NODES.add(126);  
        NODES.add(139);  
        NODES.add(140);  
        NODES.add(154);  
        NODES.add(166);  
        NODES.add(167);  
        NODES.add(181);  
        NODES.add(191);  
        
        this.HD_RACK_STRS = new ArrayList<String>(); 
        this.HD_NODES = new ArrayList<Integer>(); 
        HD_RACK_STRS.add("A1"); 
        HD_RACK_STRS.add("A3"); 
        HD_RACK_STRS.add("A4"); 
        HD_RACK_STRS.add("B1"); 
        HD_RACK_STRS.add("B2"); 
        HD_RACK_STRS.add("B3"); 
        HD_RACK_STRS.add("B4"); 
        HD_NODES_IN_RACK = new HashMap<String, List<Integer>>(); 

        for (int n = 0; n < 192; n++) 
            HD_NODES.add(n); 

        List<Integer> a1Nodes = new ArrayList<Integer>(); 
        for (int n = 56; n <= 83; n++) 
            a1Nodes.add(n); 
        HD_NODES_IN_RACK.put("A1", a1Nodes); 

        List<Integer> a3Nodes = new ArrayList<Integer>(); 
        for (int n = 26; n <= 55; n++) 
            a3Nodes.add(n); 
        HD_NODES_IN_RACK.put("A3", a3Nodes); 

        List<Integer> a4Nodes = new ArrayList<Integer>(); 
        for (int n = 0; n <= 27; n++) 
            a4Nodes.add(n); 
        HD_NODES_IN_RACK.put("A4", a4Nodes); 

        List<Integer> b1Nodes = new ArrayList<Integer>(); 
        for (int n = 84; n <= 111; n++) 
            b1Nodes.add(n); 
        HD_NODES_IN_RACK.put("B1", b1Nodes); 

        List<Integer> b2Nodes = new ArrayList<Integer>(); 
        for (int n = 112; n <= 139; n++) 
            b2Nodes.add(n); 
        HD_NODES_IN_RACK.put("B2", b2Nodes); 

        List<Integer> b3Nodes = new ArrayList<Integer>(); 
        for (int n = 140; n <= 166; n++) 
            b3Nodes.add(n); 
        HD_NODES_IN_RACK.put("B3", b3Nodes); 

        List<Integer> b4Nodes = new ArrayList<Integer>(); 
        for (int n = 167; n <= 191; n++) 
            b4Nodes.add(n); 
        HD_NODES_IN_RACK.put("B4", b4Nodes); 
    }

    private double getNextFreq() {
        int freq_delta = rand.nextInt(FREQ_VAR); 
        boolean lessOrMore = rand.nextBoolean();
        double freq_change = (lessOrMore ? (double)freq_delta : -(double)freq_delta);
        return SIN_FREQ + 2.0*Math.PI*freq_change/(double)NUM_PER_NODE; 
    }

    private double getNextSin(double frequency, int num) {
        return SIN_AMPLITUDE*Math.sin((double)num * frequency);
    }

    public void createRandomTable() 
        throws SQLException {

        createEmptyNodeDataTable(outputTable); 
        Statement newTableStmt = connexion.createStatement();  

        for (int t = MIN_TRIAL; t <= MAX_TRIAL; t++) {
            for (String rack: HD_RACK_STRS) {
                for (Integer node: HD_NODES_IN_RACK.get(rack)) {
                    double cpufreq = getNextFreq(); 
                    double dimmfreq = getNextFreq(); 
                    double airinfreq = getNextFreq(); 
                    double airexchangefreq = getNextFreq(); 
                    double asicfreq = getNextFreq(); 
                    Time time; 
                    int incMs; 
                    if (t == 1) {
                        time = (Time)this.t1StartTime.clone(); 
                        incMs = this.t1Inc; 
                    }
                    else if (t == 2) {
                        time = (Time)this.t2StartTime.clone(); 
                        incMs = this.t2Inc; 
                    }
                    else {
                        time = (Time)this.t3StartTime.clone(); 
                        incMs = this.t3Inc; 
                    }

                    for (int row = 0; row < NUM_PER_NODE; row++) {
                        String timeStr = time.toString(); 
                        time.addMillis(incMs); 
                        double cpu0 = CPU_TEMP_AVG + getNextSin(cpufreq, row) + rand.nextGaussian()*STD_DEV; 
                        double cpu1 = CPU_TEMP_AVG + getNextSin(cpufreq, row) + rand.nextGaussian()*STD_DEV; 
                        double cpu_avg = (cpu0+cpu1)/2.0; 
                        double dimm1 = DIMM_TEMP_AVG + getNextSin(dimmfreq, row) + rand.nextGaussian()*STD_DEV; 
                        double dimm2 = DIMM_TEMP_AVG + getNextSin(dimmfreq, row) + rand.nextGaussian()*STD_DEV; 
                        double dimm3 = DIMM_TEMP_AVG + getNextSin(dimmfreq, row) + rand.nextGaussian()*STD_DEV; 
                        double dimm4 = DIMM_TEMP_AVG + getNextSin(dimmfreq, row) + rand.nextGaussian()*STD_DEV; 
                        double dimm5 = DIMM_TEMP_AVG + getNextSin(dimmfreq, row) + rand.nextGaussian()*STD_DEV; 
                        double dimm6 = DIMM_TEMP_AVG + getNextSin(dimmfreq, row) + rand.nextGaussian()*STD_DEV; 
                        double dimm_avg = (dimm1 + dimm2 + dimm3 + dimm4 + dimm5 + dimm6)/6.0; 
                        double airin = AIR_IN_TEMP_AVG + getNextSin(airinfreq, row) + rand.nextGaussian()*STD_DEV; 
                        double airexchange = AIR_EXCHANGE_AVG + getNextSin(airexchangefreq, row) + rand.nextGaussian()*STD_DEV; 
                        double deltatemp = airexchange - airin; 
                        double asic1temp = ASIC_TEMP_AVG + getNextSin(asicfreq, row) + rand.nextGaussian()*STD_DEV;
                        double asic2temp = ASIC_TEMP_AVG + getNextSin(asicfreq, row) + rand.nextGaussian()*STD_DEV;
                        double asic3temp = ASIC_TEMP_AVG + getNextSin(asicfreq, row) + rand.nextGaussian()*STD_DEV;
                        newTableStmt.addBatch(
                                "INSERT INTO " + outputTable + " VALUES (" 
                                + q(EXP_STR) + ", " 
                                + t + ", " 
                                + q(rack) + ", " 
                                + node + ", " 
                                + q(timeStr) + ", "
                                + d(cpu0) + ", " 
                                + d(cpu1) + ", " 
                                + d(cpu_avg) + ", " 
                                + d(dimm1) + ", " 
                                + d(dimm2) + ", " 
                                + d(dimm3) + ", " 
                                + d(dimm4) + ", " 
                                + d(dimm5) + ", " 
                                + d(dimm6) + ", " 
                                + d(dimm_avg) + ", " 
                                + d(airin) + ", " 
                                + d(airexchange) + ", " 
                                + d(deltatemp) + ", " 
                                + d(asic1temp) + ", " 
                                + d(asic2temp) + ", " 
                                + d(asic3temp) + ");"); 
                    }
                }
            }
        }
            
        newTableStmt.executeBatch(); 
    }

    private String d(double d) {
        return String.format("%1$.2f", d); 

    }


    private void createEmptyNodeDataTable(String tableName) 
        throws SQLException {

        String createTbl = "CREATE TABLE " + tableName + 
            " (experiment varchar(40), " +
            " trial smallint, " + 
            " rack varchar(40), " + 
            " node integer, " +
            " date timestamp, " + 
            " cpu0temp double precision, " +
            " cpu1temp double precision, " + 
            " avg_cpu_temp double precision, " + 
            " dimm1temp double precision, " +
            " dimm2temp double precision, " + 
            " dimm3temp double precision, " + 
            " dimm4temp double precision, " + 
            " dimm5temp double precision, " + 
            " dimm6temp double precision, " + 
            " avg_dimm_temp double precision, " + 
            " airintemp double precision, " + 
            " airexchangetemp double precision, " + 
            " deltatemp double precision, " + 
            " asic1temp double precision, " + 
            " asic2temp double precision, " + 
            " asic3temp double precision);"; 

        
        Statement stmt = connexion.createStatement();  
        stmt.execute(createTbl); 
    }
  
    public static String q(String s) {
        return "'" + s + "'"; 
    }

}
