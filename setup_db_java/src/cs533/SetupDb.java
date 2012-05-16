package cs533; 

import java.io.BufferedReader;
import java.io.IOException;

import java.sql.Connection; 
import java.sql.Statement; 
import java.sql.DriverManager; 
import java.sql.SQLException;

import java.text.DateFormat;
import java.text.ParseException;

import java.util.Date;

public class SetupDb {

    public static final String COL1="EXPERIMENT";
    public static final String COL2="RACK";
    public static final String COL3="TRIAL";
    public static final String COL4="DATA_CATEGORY";
    public static final String COL5="DATA_TYPE";
    public static final String COL6="DATE";
    public static final String COL7="DATA_VALUE";

    public static final String INPUT_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss.SSS";

    private Connection connexion; 
    private DateFormat inputDateParser; 

    public SetupDb(String connectStr, String userName, String pass) throws SQLException {
        this.connexion = DriverManager.getConnection(connectStr, userName, pass); 
        this.inputDateParser = new java.text.SimpleDateFormat(INPUT_DATE_FORMAT); 

    }

    public void testCreateTable() throws SQLException {
        Statement stmt = connexion.createStatement();  
        for (int i = 0; i < 20; i++) 
            stmt.addBatch("INSERT INTO blargh (ID, Name) VALUES ('" + i + "', 'name" + i + "');"); 

        int[] results = null; 

        try {
            results = stmt.executeBatch(); 
        }
        catch (SQLException e) {
            e.printStackTrace(System.out); 
            while ((e = e.getNextException()) != null) {
                e.printStackTrace(System.out); 
            }
        }

        for (int i = 0; i < results.length; i++) {
            System.out.println("Result[" + i + "]=" + results[i]); 
        }
    }

    public void createPerftrackTable(String tableName, BufferedReader textFile) 
        throws IOException, SQLException {

        createEmptyPerftrackTable(tableName); 
        Statement stmt = connexion.createStatement();  

        String aLine; 

        while ((aLine = textFile.readLine()) != null) {
            //Split line into tokens by whitespace
            String[] tokens = aLine.split("\\s"); 
            assert (tokens.length==8): "invalid number of tokens in text file!"; 

            //Get values to insert into database
            String experiment = tokens[0]; 
            String rack = tokens[1]; 

            //Parse "t01" by throwing out the "t" and getting the integer value
            int trial = 
                Integer.parseInt(tokens[2].substring(1, tokens[2].length())); 

            String dataCat = tokens[3]; 
            String dataType = tokens[4]; 

            //This is Postgres compliant timestamp format, so just use this
            String timeStamp = tokens[5] + " " + tokens[6]; 

            //Coerce data into doubles
            //double dataVal = Double.parseDouble(tokens[7]); 
            String dataStr = tokens[7]; 

            stmt.addBatch("INSERT INTO " + tableName + " VALUES (" + 
                    q(experiment) + ", " +
                    q(rack) + ", " +
                    trial + ", " + 
                    q(dataCat) + ", " +
                    q(dataType) + ", " + 
                    q(timeStamp) + ", " + 
                    dataStr + 
                    ");"); 
        }

        stmt.executeBatch(); 
    }

    private void createEmptyPerftrackTable(String tableName) 
        throws SQLException {

        String createTbl = getCreateTableStmt(tableName); 
        
        Statement stmt = connexion.createStatement();  
        stmt.execute(createTbl); 
    }

    private String getCreateTableStmt(String tableName) {
        return "CREATE TABLE " + tableName + " (" +
            COL1 + " varchar(40), " +  //Experiment name
            COL2 + " varchar(40), " +  //Rack name
            COL3 + " smallint, " +     //Trial number
            COL4 + " varchar(80), " +  //Type "category"
            COL5 + " varchar(80), " +  //Type 
            COL6 + " timestamp without time zone, " + //Microsecond precision timestamp
            COL7 + " double precision)" +
                    " WITH OIDS;";  //coerce everything to double for simplicity
    }

    public static String q(String s) {
        return "'" + s + "'"; 
    }


}
