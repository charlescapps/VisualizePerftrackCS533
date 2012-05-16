package cs533; 

import java.io.BufferedReader;
import java.io.IOException;

public class ParseConfig {

    private static final char COMMENT='#'; 
    private static final String USER_TOKEN = "USERNAME"; 
    private static final String PASSWORD_TOKEN = "PASSWORD"; 
    private static final String CONNECT_TOKEN = "CONNECT_STRING"; 
    private static final String DRIVER_TOKEN = "DRIVER_CLASS"; 

    private String userName; 
    private String password; 
    private String connectStr; 
    private String driverClass; 

    public String getUserName() {
        return userName; 
    }

    public String getPassword() {
        return password; 
    }

    public String getConnectStr() {
        return connectStr; 
    }

    public String getDriverClass() {
        return driverClass; 
    }

    public ParseConfig(BufferedReader configFile) throws IOException {
		String line; 

		while ((line = configFile.readLine()) != null) {

			line = line.trim(); 
			String[] tokens = line.split("\\s"); //split on whitespace

			if (tokens.length < 2)
				continue; 

			if (line.charAt(0) == COMMENT)
				continue; 

			if (tokens[0].equals(USER_TOKEN)) {
                this.userName = tokens[1]; 
            }
            else if (tokens[0].equals(PASSWORD_TOKEN)) {
                this.password = tokens[1]; 
            }
            else if (tokens[0].equals(CONNECT_TOKEN)) {
                this.connectStr = tokens[1]; 
            }
            else if (tokens[0].equals(DRIVER_TOKEN)) {
                this.driverClass = tokens[1]; 
            }
        }
    }
}
