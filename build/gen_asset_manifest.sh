#!/bin/bash

copy_dir=$1

# cleanup
mkdir -p "$copy_dir"
rm -rf "$copy_dir"/*

if [ ! -d "static" ]; then
  exit 0
fi

# enter god mode in bash
# read files in directory recursively
# get md5 hashes of each file
# copy each file to dest dir
find static -not -path "*/\.*" -type f -print -exec sh -c '
  copy_parent_dir=$1
  filepath=$2
  ext="${filepath##*.}"
  hash=$(cut -d " " -f2- <<< "$(openssl md5 $filepath)")
  hash=${hash:0:12}
  hashed_filepath=${filepath%.*}.${hash}.${ext}
  hashed_filepath="$copy_parent_dir"/${hashed_filepath#*/}
  dest_dir=$(dirname $hashed_filepath)
  echo $hashed_filepath
  mkdir -p "$dest_dir"
  cp -rp "$filepath" "$hashed_filepath"
' sh "$copy_dir" {} ';'
