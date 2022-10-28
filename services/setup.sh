#!/usr/bin/env bash
# Change this 'materialsmine-v2' to the name of the materialsmine apps root directory
docker exec -it materialsmine-v2-mongo-1 bash -c 'mongo -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin <<EOF
use admin
db.dropUser("${CHEMPROPS_USER}")
db.createUser({
      user: "${CHEMPROPS_USER}",
      pwd: "${CHEMPROPS_PWD}",
      roles: [
        {role: "readWrite", db: "${CHEMPROPS_DB}"},
        {role: "dbAdmin", db: "${CHEMPROPS_DB}"}
      ]
    })
use ${CHEMPROPS_DB}
db.dropUser("${CHEMPROPS_USER}")
db.createUser({
  user: "${CHEMPROPS_USER}",
  pwd: "${CHEMPROPS_PWD}",
  roles: [
    "readWrite",
    "dbOwner"
  ]
})
EOF'

rm ./chemprops/mongo.config
eval "$(grep -w PORT= <../.env)"
eval "$(grep -w CHEMPROPS_USER= <../.env)"
eval "$(grep -w CHEMPROPS_DB= <../.env)"
eval "$(grep -w CHEMPROPS_PWD= <../.env)"
eval "$(grep -w MONGO_ADDRESS= <../.env)"
touch ./chemprops/mongo.config
echo 'NM_MONGO_USER:' $CHEMPROPS_USER >> ./chemprops/mongo.config
echo 'NM_MONGO_PORT:' $PORT >> ./chemprops/mongo.config
echo 'NM_MONGO_DB:' $CHEMPROPS_DB >> ./chemprops/mongo.config
echo 'NM_MONGO_PWD:' $CHEMPROPS_PWD >> ./chemprops/mongo.config
echo 'NM_MONGO_HOST:' $MONGO_ADDRESS >> ./chemprops/mongo.config
