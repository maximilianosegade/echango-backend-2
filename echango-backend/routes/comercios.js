var express = require('express');
var router = express.Router();
var mongodb = require('mongodb').MongoClient;

require('bluebird').promisifyAll(mongodb);

/* 
 * Consulta de comercios cercanos a los que se indican,
 * tomando como centro los mismos y un radio determinado en Kms.
 */
var comerciosCercanos = function (req, res, next) {
  var i=0;
  var comercios = [];

  for (;;i++) {
  	if (req.query['lat' + i] && req.query['long' + i]) {
  		comercios.push({
  			lat: req.query['lat' + i],
  			long: req.query['long' + i],
  			comerciosCercanos: []
  		});
  	}else
  		break;
  }

  var url = 'mongodb://localhost:27017/echango';
  var dbTrack;
  mongodb.connectAsync(url).then(function(db){
    dbTrack = db;
    console.log('[Comercios cercanos] - Punto origen: [',
      comercios[0].lat, ' - ', comercios[0].long, '].');        

    var collection = require('bluebird').promisifyAll(
      db.collection('comercios'));

    return collection.findAsync({
      ubicacion: {
        $geoWithin: {
          $centerSphere : [ 
            [
              parseFloat(comercios[0].lat), 
              parseFloat(comercios[0].long)
            ] , 1 / 6378.1 
          ]
        }
      }
    });

  }).then(function(res){
    return res.toArray();
  }).then(function(docs){
    var i;
    console.log('[Comercios cercanos] - Total comercios encontrados: [',
      docs.length, '].');

    if (docs.length){
      for (i=0; i<docs.length; i++)
        console.log('[Comercios cercanos] - [', i, '] => [', docs[i]._id, '].');
    }
  }).catch(function(err){
    console.log(err);
  }).then(function(){
    console.log('Clean Up de la conexion de BD.')
    dbTrack.close();
  });
  
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(comercios));
}

router.get('/cercanos', comerciosCercanos);

module.exports = {
	comerciosCercanos: comerciosCercanos,
	router: router
}