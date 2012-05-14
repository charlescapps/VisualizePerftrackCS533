module FixData where

import List

--Experiment, Rack, Trial, Data Category, Data Name, Date, Timestamp, Actual Data
data PNNL_ROW = PNNL_ROW String String String String String String String String

--Helper to just replace every occurrence of c with c' in a string
replaceWith::Char -> Char -> String -> String
replaceWith c c' [] = []
replaceWith c c' (x:xs) = if x == c then c':replaceWith c c' xs 
    else x:replaceWith c c' xs

--Extract columns from the file name
fileNameToFirstCols :: String -> [String] 
fileNameToFirstCols file = (experiment file):(rack file):(trial file):
    (dataCat file): (dataName file):[]

--Tokenize file name by underscore, throw out extension
fileToWords :: String -> [String]
fileToWords fileName = words $ replaceWith '_' ' ' $ takeWhile (/= '.') fileName

--Takes a directory name, returns a list of (file_name, columns), where
--"columns" is the columns we can glean from the file name
dirToFileTokens :: [String] -> [(String, [String]) ]
dirToFileTokens dirFiles = zip (files) (map fileNameToFirstCols files)
    where files = filter (\f -> (head f /= '.') && (not $ elem ".swp" $ tails f)) 
                    dirFiles

filesToFileHeaders :: [String] -> [[String]]
filesToFileHeaders dirFiles = map fileNameToFirstCols files
    where files = filter (\f -> (head f /= '.') && (not $ elem ".swp" $ tails f)) 
                    dirFiles

experiment::FilePath -> String
experiment str = (fileToWords str !! 0) ++ "_" ++ (fileToWords str !! 1)

rack::FilePath -> String
rack str = fileToWords str !! 2

trial::FilePath -> String
trial str = fileToWords str !! 3

dataName :: FilePath -> String
dataName str = tokens !! (length tokens - 1)
    where tokens = fileToWords str

dataCat :: FilePath -> String
dataCat str = concat $ reverse $ tail $ reverse endStr
    where tokens = fileToWords str
          endStr = drop 4 tokens

--Stuff to parse actual contents of a file. 
rowToData :: String -> [String]
rowToData row = words (replaceWith ',' ' ' row)

--File contents, Columns from file name --> Final data by row
rawFileToRows :: String -> [String] ->  [[String]]
rawFileToRows f headers = map (\r -> headers ++ rowToData r)  $ lines f

rowsToRawFile :: [[String]] -> String
rowsToRawFile [] = ""
rowsToRawFile (r:rs) = concat ((map ( ++ "\t") $ take (length r - 1) r) ++ [last r])
                         ++ "\n" ++ rowsToRawFile rs

--Get the name for the new file given the headers
headerToFileName :: [String] -> String
headerToFileName hs = (hs!!0) ++ "_" ++ (hs!!1) ++ "_" ++ (hs!!2) ++ "_" ++ (hs!!3)
                        ++ "_" ++ (hs!!4) ++ "_fixed.txt"
