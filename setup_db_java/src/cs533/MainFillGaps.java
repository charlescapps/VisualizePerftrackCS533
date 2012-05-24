package cs533; 

import java.io.BufferedReader;
import java.io.FileReader;

import java.sql.SQLException;

public class MainFillGaps {

    private static final String USAGE = 
        "java -jar setup_cs533_db.jar <config_filename> <input_table> <output_table>\n" + 
        "\te.g. java -jar setup_cs533_db.jar connect.txt cpu_temp CPUTempFixed.txt"; 

    public static void main (String[] args) throws Exception {
        if (args.length != 3) {
            System.out.println("Invalid number of arguments.\n" + USAGE); 
            System.exit(0); 
        }

        BufferedReader readConfigFile = new BufferedReader(new FileReader(args[0])); 
        ParseConfig configData = new ParseConfig(readConfigFile); 

        //Loads the JDBC driver automagically
        Class.forName(configData.getDriverClass()); 

        FillGaps myFillGaps = new FillGaps(configData.getConnectStr(),
                configData.getUserName(), 
                configData.getPassword(), 
                args[1], args[2]); 

        try {
            myFillGaps.fillGapsInTable(); 
        }
        catch (SQLException e) {
            printChainedExceptions(e); 
        }
        
    }

    private static void printChainedExceptions(SQLException e) {
        e.printStackTrace(); 

        while ( (e = e.getNextException()) != null) {
            e.printStackTrace(); 
        }
    }

}
