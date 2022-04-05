mongo -- "$MM_DB" <<EOF
    var rootUser = '$MONGO_INITDB_ROOT_USERNAME';
    var rootPassword = '$MONGO_INITDB_ROOT_PASSWORD';
    var admin = db.getSiblingDB('admin');
    admin.auth(rootUser, rootPassword);

    var user = '$MONGO_DEVS';
    var passwd = '$MONGO_DEV_PWD';
    db.createUser({user: user, pwd: passwd, roles: ["readWrite"]});
    db.xmldata.createIndex({datasetId:1})
    db.datasets.createIndex({seq:1})
EOF