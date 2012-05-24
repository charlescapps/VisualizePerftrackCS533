ALL_SRC = src/cs533/*.java

setup_cs533_db.jar: cs533_classes
	jar vcmfe Manifest setup_cs533_db.jar cs533.Main -C bin cs533

fill_gaps_db.jar: cs533_classes
	jar vcmfe Manifest fill_gaps_db.jar cs533.MainFillGaps -C bin cs533

create_random_db.jar: cs533_classes
	jar vcmfe Manifest create_random_db.jar cs533.MainCreateRandom -C bin cs533

cs533_classes: $(ALL_SRC)
	javac -g -classpath driver/postgresql-9.1-902.jdbc4.jar -sourcepath src -d ./bin $(ALL_SRC)
	
clean: 
	rm -f -r bin/*
	rm -f setup_cs533_db.jar
