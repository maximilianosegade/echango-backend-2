var mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';
const radioDefaultMts = 500

var mongodb = require('mongodb').MongoClient;

var bluebird = require('bluebird');
bluebird.promisifyAll(mongodb);

var dbutils = {};

dbutils.cleanDB = function(db){
  	console.log('Clean Up de la conexion de BD.');
  	if (db)
    	db.close();
}

dbutils.connect = function(){
	return mongodb.connectAsync(mongoUrl);
}

dbutils.findComerciosCercanos = function(lat, long, radio){
	var dbTrack;
  	
  	return dbutils.connect().then(function(db){
   
    	dbTrack = db;
   
    	console.log('[Comercios cercanos] - Punto origen: [',
      		lat, ' - ', long, '].');        

    	var collection = require('bluebird').promisifyAll(
      		db.collection('comercios'));

    	/*return collection.findAsync({
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
	    });*/
	    return collection.aggregate([
	    {
	    	$geoNear: {
	          	near: { type: "Point", coordinates: [-34.602232, -58.411533]} ,
        		distanceField: "dist.calculated",
        		maxDistance: radioDefaultMts,
        		distanceMultiplier: 1.2,
        		//query: {cadena : "DIA"},
        		includeLocs: "dist.location",
        		spherical: true
	        }
	    }
	    ]);

  	}).then(function(res){

    	return res.toArray();

  	}).then(function(docs){

    	var i;
    	var comercios = [];

	    console.log('[Comercios cercanos] - Total comercios encontrados: [',
	      docs.length, '].');

	    if (docs.length){
	    	for (i=0; i<docs.length; i++){
	      		console.log('[Comercios cercanos] - [', i, '] => [', docs[i]._id, '], distancia:',
	      			parseFloat(docs[i].dist.calculated).toFixed(2),"metros.");
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

dbutils.find = function(collectionName, selector){
	var dbTrack;

	return dbutils.connect().then(function(db){   
    	dbTrack = db;   

    	var collection = bluebird.promisifyAll(
      		db.collection(collectionName));

    	return collection.find(selector);
  	}).then(function(res){
  		var data = res.toArray();
  		dbutils.cleanDB(dbTrack);
    	return data;
  	}).catch(function(err){
  		dbutils.cleanDB(dbTrack);
  		return Promise.reject(err);
  	});

}

dbutils.update = function(collectionName, s1, s2, s3){
	var dbTrack;

	return dbutils.connect().then(function(db){   
    	dbTrack = db;   

    	var collection = bluebird.promisifyAll(
      		db.collection(collectionName));

    	return collection.updateAsync(s1, s2, s3);
  	}).then(function(res){
  		dbutils.cleanDB(dbTrack);
    	return res;
  	}).catch(function(err){
  		dbutils.cleanDB(dbTrack);
  		return Promise.reject(err);
  	});

}

dbutils.insert = function(collectionName, docs){
  return dbutils.connect().then(function(db){   
    dbTrack = db;   

    var collection = bluebird.promisifyAll(
        db.collection(collectionName));

    return collection.insertAsync(docs);
  }).then(function(res){
    dbutils.cleanDB(dbTrack);
    return res;
  }).catch(function(err){
    dbutils.cleanDB(dbTrack);
    return Promise.reject(err);
  });
}

module.exports = dbutils;
//dbutils.findComerciosCercanos(-34.602232,-58.411533,0)