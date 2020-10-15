#!/bin/bash

source ../.env

MODEL=$1

if [ "$MODEL" == "configs" ] || [ "$MODEL" == "resources" ];
then
    curl -i -X DELETE http://localhost:$APPPORT/ldp/verso/$MODEL
    curl -i -X PUT http://localhost:$APPPORT/ldp/verso/$MODEL
    node migrate_resources.js $MODEL
else
  echo "\MODEL should be either 'configs' or 'resources'."
  exit 0
fi


