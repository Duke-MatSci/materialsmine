#!/bin/bash
mongorestore -u $MM_MONGO_USER -p $NM_MONGO_PWD --authenticationDatabase admin -d mgi  ../../mockDB/mockmgi