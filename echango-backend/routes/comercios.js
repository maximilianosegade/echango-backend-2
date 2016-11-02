var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient

/* 
 * Consulta de comercios cercanos a los que se indican,
 * tomando como centro los mismos y un radio determinado en Kms.
 */
var comerciosCercanos = function (req, res, next) {
  var i=0;
  var comercios = [];

  for (;;i++) {
  	if (req.params['lat' + i] && req.params['long' + i]) {
  		comercios.push({
  			lat: req.params['lat' + i],
  			long: req.params['long' + i],
  			comerciosCercanos: []
  		});
  	}else
  		break;
  }

  var url = 'mongodb://localhost:27017/myproject';
  // Use connect method to connect to the server
  MongoClient.connect(url, function(err, db) {
    console.log("Connected successfully to server");
    db.close();
  });

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(comercios));
}

router.get('/cercanos', comerciosCercanos);

module.exports = {
	comerciosCercanos: comerciosCercanos,
	router: router
}