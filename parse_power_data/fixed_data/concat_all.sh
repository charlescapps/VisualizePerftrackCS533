#!/bin/bash

for d in ./*
do
    cat $d/*.fixed > $(basename $d).txt
done
