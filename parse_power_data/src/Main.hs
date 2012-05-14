module Main where

import List
import System
import System.IO
import System.Directory

import FixData

--This program converts a directory of CSV files in the output from PerfTrack
--to a new directory with a fixed file for each original file. 
--Output names are: <original_file>.fixed
--
--The next thing to do is to put all these files into a single file. I just
--did this with, for example, "cat *.fixed > air_temp_all.txt" 

usageStr::String
usageStr = "concat_files <dir_name> <output_dir>" ++
			"\nFiles in directory assumed to be PNNL raw data .csv files."

--get rid of hidden files, ".", "..", and non-csv files. 
filterFiles :: [String] -> [String]
filterFiles fs = filter (\f -> head f /= '.' && f /= [] && elem ".csv" (tails f)) fs

--Get file base name, i.e. throw out path
fileBaseName :: String -> String
fileBaseName = reverse . takeWhile (/= '/') . reverse

main::IO()
main = 
 do  args <- getArgs              
     if (length (args) /= 2)      
        then do putStrLn usageStr
                exitWith (ExitFailure 1)
     else do    let dirFileName = head args
                let outputDirName = args !! 1
                putStrLn ("Reading files from: '" ++ dirFileName ++ "'")

                filesInDir <- (getDirectoryContents dirFileName) >>= (return . filterFiles)
                let inputFileNames = map (\f -> dirFileName ++ "/" ++ f) filesInDir
                let outputFileNames = map (\n -> outputDirName ++ "/" ++ n ++ ".fixed") filesInDir

                writeAllResults inputFileNames outputFileNames

                return ()
 
--[Input File Names] -> [Output File Names] -> Write results
writeAllResults :: [String] -> [String] -> IO ()
writeAllResults [] _ = return ()
writeAllResults (x:xs) (y:ys)
    = do inputH <- openFile x ReadMode
         xContents <- hGetContents inputH
         let header = fileNameToFirstCols $ fileBaseName x
         let resultFile = rowsToRawFile $ rawFileToRows xContents header

         outputH <- openFile y WriteMode
         hPutStr outputH resultFile

         isInputOpen <- hIsOpen inputH
         if isInputOpen then do hClose inputH else return ()
         isOutputOpen <- hIsOpen outputH
         if isOutputOpen then do hClose outputH else return ()
         
         writeAllResults xs ys
