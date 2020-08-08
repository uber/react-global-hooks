#!/bin/bash
set -x #echo on
for m in modules/*/ ; do
  for d in examples/*/ ; do
    destination=${d}node_modules/@uber
    mkdir -p $destination
    rm -rf $destination/${m#modules/}
    cp -R ${m} $destination/${m#modules/}
  done
done