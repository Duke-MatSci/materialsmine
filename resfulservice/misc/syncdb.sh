#!/usr/bin/env bash

mkdir mockDB/restore/mongodump 2> /dev/null

if [[ -f mockDB/restore/mongodump/mgi.tgz ]]; then
  rm mockDB/restore/mongodump/mgi.tgz
fi

if [[ $NM_MONGO_DUMP == file://* ]]; then
  cp_err_msg="Unable to copy ${fn} mongo dump originally referenced as ${NM_MONGO_DUMP}"
  fn=${NM_MONGO_DUMP#file://}
  if [[ -f ${fn} ]]; then
    echo "attempting to copy mgi.tgz from ${NM_MONGO_DUMP}. This may take a few minutes"
    cp $fn mockDB/restore/mongodump/mgi.tgz
    if [[ $? -ne 0 ]]; then
      echo $cp_err_msg
    fi
  else
    echo $cp_err_msg
  fi
elif [[ -z $NM_MONGO_DUMP ]]; then
  echo error '$NM_MONGO_DUMP' not defined
else
  curl -k -o mockDB/restore/mongodump/mgi.tgz $NM_MONGO_DUMP
fi

cd mockDB/restore/mongodump
tar zxvf mgi.tgz
rm -rf mgi.tgz

docker exec -it materialsmine-mongo-1 sh -c 'mongo -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin mgi --eval "db.dropDatabase()"; mongorestore -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin -d mgi /restore/mongodump/mgi'
