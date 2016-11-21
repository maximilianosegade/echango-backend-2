var dbutils = require('../../util/mongo');
var MongoClient = require('mongodb').MongoClient;	
var mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';
var _ = require('underscore')

module.exports = {

	actualizarUltimaSnapshot: function(){

		var get_connect = new Promise(function(resolve,reject){

			MongoClient.connect(mongoUrl, function(err, db) {
				if (err){
					console.log('Error connect', err)
					reject(err);
				}
				resolve(db)
			})
		});


		return get_connect.then(function(db){
			console.log("Entro al paso 1")
			return new Promise (function(resolve,reject){

				console.log("Entro al paso 2")
				var search_nov = new Promise (function(resolve2,reject){

					var myNov = db.collection('snapshot_en_curso').find()

					resolve2(myNov)
				});

				search_nov.then(function(myNov){

					var v_cant_suc = 0	
					var updatesNovedades = [];

					console.log('Se van a impactar las novedades en el ultimo snapshot de precios...');
		

					myNov.forEach(function(novedad){

						if (novedad == null) {

							console.log("No existen registros por precesar.")
							resolve(updatesNovedades)
						}

						var search_snap = new Promise (function (resolve3,reject){

							var mySnap = db.collection('ultima_snapshot').find({_id: novedad._id}).toArray()
							resolve3(mySnap);
						})

						search_snap.then(function(mySnap){
							v_cant_suc++

							novedadesComercio = novedad
							console.log("Asigno Novedad de comercio, para el comercio:",novedadesComercio._id)

							console.log("mySnap es: ",mySnap[0]._id)
							var ultimoSnapshotComercio = mySnap[0]
							var precioOld;
							var modificado = false;

							console.log("Debo iterar por cada ean de novedades")
							console.log("Novedades Comercio es:", novedadesComercio)
							
							for (ean in novedadesComercio){

								 if (!(ean === '_id')){
									modificado = true;

									console.log("El EAN es: ",ean)
									precioOld = ultimoSnapshotComercio.precios[ean];
									ultimoSnapshotComercio.precios[ean].precio = novedadesComercio[ean].precio_novedad;					

									console.log('Se actualizo ean: ', ean,
										' en comercio: ', novedadesComercio._id,
										' precio: ', precioOld, ' => ',
										ultimoSnapshotComercio.precios[ean].precio);
								}
							}

							if (modificado){
								console.log('Se va a actualizar comercio: ', novedadesComercio._id, '.');
								db.collection('ultima_snapshot').update({_id: novedadesComercio._id}, ultimoSnapshotComercio);
							}

							console.log("Hago push de novedades")
							updatesNovedades.push(novedadesComercio);
						})

					})

					resolve(updatesNovedades)
				})
			})	
		})
	}
}
					