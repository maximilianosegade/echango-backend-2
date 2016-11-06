var https = require('https');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;	
var mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';

// Obtener novedades de CouchDB (novedades_subida)
var fechaHoy = new Date().toISOString()
  .replace(/T/, ' ')		// replace T with a space
  .replace(/\..+/, '');     // delete the dot and everything after


var get_connect = new Promise(function(resolve,reject){

	MongoClient.connect(mongoUrl, function(err, db) {
		if (err){
			console.log('Error connect', err)
			reject(err);
		}
		resolve(db)
	})
})

get_connect.then(function(db){

	var define_price = new Promise(function(resolve,reject){

		var cursor = db.collection('snapshot_en_curso').find()
		console.log("Devuelvo conexión a DB y cursor")
		resolve(cursor);
	})

	define_price.then(function(mySnap){
		
		//Por cada documento de la snapshot en curso (sucursal), verifico cada EAN y calculo el precio_novedad
		console.log("Por procesar novedades de comercios...")

		mySnap.each(function(err,comercio){
			if (err){
				console.log('Error en forEach',err)
				return Promise.reject(err);
			}

			if (comercio == null) {

				console.log("No existen registros por precesar.")
				console.log("Se han procesado las novedades y generado el último snapshot.")
				console.log("Cerrando conexión a base de datos...")
				db.close()
				return Promise.resolve("0");

			} else {

			console.log("Imprimo el comercio")
			console.log(comercio)
			console.log(comercio.novedades)
		   	var com= JSON.stringify(comercio)
		   	console.log(com)
		   	console.log(JSON.parse(com))
		   	return Promise.resolve(comercio);

		   }
		})

	}).catch(function(err){

		console.log(err)

	})

}).then(function(result){

	console.log("Resultado:",result);

}).catch(function(err){

		console.log(err);
})
