// Executed only for a fresh mongo-data volume.
const appDb = db.getSiblingDB('pins');
appDb.createUser({user:'pins',pwd:process.env.MONGO_APP_PASSWORD,roles:[{role:'readWrite',db:'pins'}]});
db.getSiblingDB('admin').createUser({
  user:'exporter',pwd:process.env.MONGO_EXPORTER_PASSWORD,
  roles:[{role:'clusterMonitor',db:'admin'},{role:'read',db:'local'},{role:'read',db:'pins'}]
});
