const url = 'mongodb://localhost:27017/echango';
const radioDefaultKms = 0.5

var mongodb = require('mongodb').MongoClient;

require('bluebird').promisifyAll(mongodb);

var dbutils = {};

dbutils.cleanDB = function(db){
  	console.log('Clean Up de la conexion de BD.');
  	if (db)
    	db.close();
}

dbutils.connect = function(){
	return mongodb.connectAsync(url);
}

dbutils.findComerciosCercanos = function(lat, long, radio){
	var dbTrack;
  	
  	return dbutils.connect().then(function(db){
   
    	dbTrack = db;
   
    	console.log('[Comercios cercanos] - Punto origen: [',
      		lat, ' - ', long, '].');        

    	var collection = require('bluebird').promisifyAll(
      		db.collection('comercios'));

    	return collection.findAsync({
      		ubicacion: {
	        $geoWithin: {
	          $centerSphere : [ 
	            [
	              parseFloat(lat), 
	              parseFloat(long)
	            ] , (radio ? radio: radioDefaultKms) / 6378.1 
	          ]
	        }
	      }
	    });

  	}).then(function(res){

    	return res.toArray();

  	}).then(function(docs){

    	var i;
    	var comercios = [];

	    console.log('[Comercios cercanos] - Total comercios encontrados: [',
	      docs.length, '].');

	    if (docs.length){
	    	for (i=0; i<docs.length; i++){
	      		console.log('[Comercios cercanos] - [', i, '] => [', docs[i]._id, '].');
	    		comercios.push(docs[i]._id);
	    	}
	    }

	    dbutils.cleanDB(dbTrack);
	    return Promise.resolve(comercios);

  	}).catch(function(err){

    	dbutils.cleanDB(dbTrack);
    	return Promise.reject(err);
    
	});
}

module.exports = dbutils;