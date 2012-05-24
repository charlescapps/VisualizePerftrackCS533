package cs533; 

import java.io.BufferedReader;
import java.io.FileReader;

import java.sql.SQLException;

public class MainCreateRandom {

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

        CreateRandom myCreateRandom = new CreateRandom(configData.getConnectStr(),
                configData.getUserName(), 
                configData.getPassword(), 
                args[1]); 

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
