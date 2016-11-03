var express = require('express');
var router = express.Router();
var mongodb = require('../util/mongo');

require('bluebird').promisifyAll(mongodb);

/* 
 * Consulta de comercios cercanos a los que se indican,
 * tomando como centro los mismos y un radio determinado en Kms.
 */
var comerciosCercanos = function (req, res, next) {
  var i=0;
  var comercios = [];

  // Inicializo lista de posiciones geograficas con sus ID de
  // comercios cercanos (array vacio).
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

  if (!comercios.length)
    throw new Error('No se especificaron ubicaciones.');

  // Por cada posicion obtengo los comercios cercanos.
  comercios.reduce(function(sequence, comercio) {

    return sequence.then(function() {
      return mongodb.findComerciosCercanos(comercio.lat, comercio.long, req.query['radio']);
    }).then(function(resp){
      comercio.comerciosCercanos = resp;
    });

  }, Promise.resolve()).then(function(){  

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(comercios));

  }).catch(function(err){
    next(err);
  });

}

router.get('/cercanos', comerciosCercanos);

module.exports = {
	comerciosCercanos: comerciosCercanos,
	router: router
}