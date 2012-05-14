#!/bin/bash

for d in original_data/*
do
    mkdir fixed_data/$(basename $d)Fixed
    ./fix_data $d fixed_data/$(basename $d)Fixed
done
