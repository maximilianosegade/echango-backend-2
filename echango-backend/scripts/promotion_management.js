var https = require('https');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;	
var _ = require('underscore')
var mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';
//var ean = "7790895000997";
var precio_base_weight = 10000;

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

	var search_snap = new Promise(function(resolve,reject){

		var mySnap = db.collection('ultima_snapshot').find()
		console.log("Devuelvo conexión a DB y cursor de Snap")
		resolve(mySnap);
	});

	var search_promos = new Promise(function(resolve,reject){

		var promos = db.collection('promos_actuales').find().toArray()
		console.log("Devuelvo conexión a DB y cursor de Promos")
		resolve(promos);
	});

	search_promos.then(function(promos){

		search_snap.then(function(mySnap){
			
			//Por cada documento de la snapshot en curso (sucursal), verifico cada EAN y calculo el precio_novedad
			console.log("Por procesar novedades de comercios...")

			//Pocesa el "doc:comercio" y en el último each donde "doc:comercio" es nulo, termina de procesar
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
					return;
					

				} else {

					//Informo el comercio a procesar
					console.log("PROCESANDO NUEVO COMERCIO -------------------------------------")
					//console.log("Procesando comercio:",comercio._id)
					
					console.log("Comercio:", comercio)
					//Obtengo un array con todos los _id de los EAN que tienen novedades para el comercio
					var keys = Object.keys(comercio.precios)

					//Imprimo el array para ver los EAN con novedades
					//console.log(keys)

					//Obtengo la cadena en base al string de comercio
					console.log("Log 1")
					var cadena = comercio._id.substring(0,2)
					console.log("La cadena es: ", cadena)

					console.log("Promociones:",util.inspect(promos, {depht: null}))
					console.log("Promociones:",promos[0])

					console.log("Log 2")
					var promo_comercio = _.findWhere(promos,{_id:cadena})

					console.log("Encontré:",promo_comercio)

					//Arranco de la posición "e=1" porque la posición 0 contiene el _id del comercio
					//Comienzo a recorrer todos los EAN con novedades
					
					if (typeof promo_comercio !== 'undefined' && promo_comercio !== null ){
						
						for (e=1; e<keys.length; e++){

							//Asigno el EAN a recorrer
							var ean = keys[e]
							
							//No debería pasar, pero en caso que el EAN sea nulo, significa que no tengo más registros para procesar y retorno
							if (ean == null){
								console.log("Log 3")
								console.log("2comercio_id:",promo_comercio._id)
								console.log("No existen artículos para procesar en el comercio: ",comercio._id)
								return;
							}

							console.log("PROCESANDO NUEVO EAN -------------------------------------")
							
							//Informo qué EAN estoy procesando
							console.log("Proceso EAN:",ean)

							//Imprimo el objeto EAN asignado
							console.log("EAN valor:",comercio.precios[ean])

							//Asigno las promociones al nuevo EAN:
							console.log("promo_comercio_id:",promo_comercio._id)
							comercio.precios[ean].promociones = promo_comercio.promociones

							console.log("Se han guardado las promciones...")
						}
			
						console.log("Grabo promoción:")
						console.log("comercio_id:",comercio._id)
					   	db.collection('ultima_snapshot').update({_id:comercio._id},{$set: {precios:comercio.precios}})	
					   	console.log("He grabado la promoción")
					}
				}

			})
		}).catch(function(err){

			console.log(err)

		})
	}).catch(function(err){

		console.log(err)

	})

}).catch(function(err){

		console.log(err);
})



