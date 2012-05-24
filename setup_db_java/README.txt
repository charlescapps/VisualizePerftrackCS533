This is a small program that takes a tab-delimited text file with perftrack
data and pushes it to a remote database. 

Usage is: 

To build: 

Makefile default command should work. Requires postgres driver
in driver/ subfolder. 

to run:

java -jar setup_cs533_db.jar <config_filename> <table_name> <input_file>
    e.g. java -jar setup_cs533_db.jar connect.txt cpu_temp CPUTempFixed.txt

Note it appears that queries to CAT databases only works on the PSU network. 
Not sure how to get around that, we may need to eventually migrate to another
database, which should be easy with this program simply by modifying 
connect.txt. 
