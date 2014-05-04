#!/bin/bash

read -p "Are you sure you want to overwrite the language database y/n? " prompt
    case "$prompt" in
            y*)  	while getopts "d" opt
					do
						case $opt in
							d)
								printf "\n\nDownloading latest database version\n\n"
								wget https://paste.directory/admin/exportlanguages -N -O languages.json --no-check-certificate
								if [[ $? > 0 ]]; then
									printf "\n\nError while retrieving the file, aborting.\n\n"
									exit 1
								fi
								;;
						esac
					done
						printf "\n\nOverwriting database\n\n"
						mongoimport -d "pastedirectory" -c "languages"  --drop --file languages.json
						printf "\n\nOperation completed\n\n"
						;;
            n*)  echo "Operation aborted" ;;
    esac
	
