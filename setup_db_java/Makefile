ALL_SRC = src/cs533/*.java

setup_cs533_db.jar: cs533_classes
	jar vcmfe Manifest setup_cs533_db.jar cs533.Main -C bin cs533

cs533_classes: $(ALL_SRC)
	javac -g -classpath driver/postgresql-9.1-902.jdbc4.jar -sourcepath src -d ./bin $(ALL_SRC)
	
clean: 
	rm -f -r bin/*
	rm -f setup_cs533_db.jar
