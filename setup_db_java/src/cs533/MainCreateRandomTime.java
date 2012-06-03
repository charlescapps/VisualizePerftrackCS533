package cs533; 

import java.io.BufferedReader;
import java.io.FileReader;

import java.sql.SQLException;
import static cs533.CreateRandomTime.Time; 

public class MainCreateRandomTime {

    private static final String USAGE = 
        "java -jar create_random_db.jar <config_filename> <output_table_name>\n" + 
        "\te.g. java -jar create_random_db.jar connect.txt node_data_rand"; 

    public static void main (String[] args) throws Exception {
        if (args.length != 2) {
            System.out.println("Invalid number of arguments.\n" + USAGE); 
            System.exit(0); 
        }

        BufferedReader readConfigFile = new BufferedReader(new FileReader(args[0])); 
        ParseConfig configData = new ParseConfig(readConfigFile); 

        //Loads the JDBC driver automagically
        Class.forName(configData.getDriverClass()); 

        Time t1StartTime = new Time(13, 37, 47, 993, "2011-05-05"); 
        Time t2StartTime = new Time(13, 47, 07, 99, "2011-05-05"); 
        Time t3StartTime = new Time(13, 56, 27, 98, "2011-05-05"); 

        CreateRandomTime myCreateRandom = new CreateRandomTime(configData.getConnectStr(),
                configData.getUserName(), 
                configData.getPassword(), 
                args[1], 
                t1StartTime, 
                540000, 
                t2StartTime, 
                540000, 
                t3StartTime, 
                540000, 
                "HD_full"); 



        try {
            myCreateRandom.createRandomTable(); 
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
