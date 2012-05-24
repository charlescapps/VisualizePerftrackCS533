package cs533; 

import java.io.BufferedReader;
import java.io.IOException;

import java.sql.Connection; 
import java.sql.ResultSet;
import java.sql.Statement; 
import java.sql.DriverManager; 
import java.sql.SQLException;

import java.text.DateFormat;
import java.text.ParseException;

import java.util.Date;

public class FillGaps {

    private Connection connexion; 
    private String inputTable;
    private String outputTable;

    public FillGaps(String connectStr, String userName, String pass, String inputTable, 
            String outputTable) throws SQLException {
        this.connexion = DriverManager.getConnection(connectStr, userName, pass); 
        this.inputTable = inputTable;
        this.outputTable = outputTable;
    }

    public void fillGapsInTable() 
        throws SQLException {

        Statement stmt = connexion.createStatement();  
        Statement newTableStmt = connexion.createStatement();  
        String originalTableQuery = "SELECT * FROM " + inputTable; 
        ResultSet input = stmt.executeQuery(originalTableQuery); 

        double _power=0.0, _powerFac=0.0, _kwh=0.0, _resTemp=0.0, 
               _inTemp=0.0, _outTemp=0.0, _delta = 0.0; 

        while (input.next()) {

            String exp = input.getString(1); 
            int trial = input.getInt(2); 
            String rack = input.getString(3); 
            String timeStamp = input.getString(4);
            double power = input.getDouble(5); 
            double powerFac = input.getDouble(6); 
            double kwh = input.getDouble(7); 
            double resTemp = input.getDouble(8); 
            double inTemp = input.getDouble(9); 
            double outTemp = input.getDouble(10); 
            double deltaTemp = input.getDouble(11); 

            if (power != 0.0) { //get previous non-null value
                _power = power; 
                _powerFac = powerFac; 
                _kwh = kwh; 
            }
            if (resTemp != 0.0) {
                _resTemp = resTemp; 
                _inTemp = inTemp; 
                _outTemp = outTemp; 
                _delta = deltaTemp; 
            }

            newTableStmt.addBatch(
                    "INSERT INTO " + outputTable + " VALUES (" 
                    + q(exp) + ", " 
                    + trial + ", " 
                    + q(rack) + ", " 
                    + q(timeStamp) + ", "
                    + _power + ", " 
                    + _powerFac + ", " 
                    + _kwh + ", " 
                    + _resTemp + ", " 
                    + _inTemp + ", " 
                    + _outTemp + ", " 
                    + _delta + ");"); 
            }

        createEmptyRackDataTable(outputTable); 
        int[] result = newTableStmt.executeBatch(); 
             
        }



    private void createEmptyRackDataTable(String tableName) 
        throws SQLException {

        String createTbl = "CREATE TABLE " + tableName + 
            " (experiment varchar(40), " +
            " trial smallint, " + 
            " rack varchar(40), " + 
            " date timestamp, " + 
            " power double precision, " +
            " powerfactor double precision, " + 
            " powerkwh double precision, " + 
            " reservoirtemp double precision, " +
            " waterinlettemp double precision, " + 
            " wateroutlettemp double precision, " + 
            " delta_water_temp double precision);"; 

        
        Statement stmt = connexion.createStatement();  
        stmt.execute(createTbl); 
    }

    

  
    public static String q(String s) {
        return "'" + s + "'"; 
    }


}
