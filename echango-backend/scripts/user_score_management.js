var https = require('https');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;	
var mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';
//var ean = "7790895000997";
var _ = require('underscore');
var assert = require('assert');
var precio_base_weight = 1000;

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
});

get_connect.then(function(db){
	
	var get_usuarios = new Promise (function(resolve,reject){

		db.collection('usuarios').find().toArray(function(err,result){
			if (err){
				reject(err)
			}

			resolve(result);
		})
	});

	var search_snap = new Promise(function(resolve,reject){

		var mySnap = db.collection('snapshot_en_curso').find()
		console.log("Devuelvo conexión a DB y cursor")
		resolve(mySnap);
	});

	get_usuarios.then(function(usuarios){

		search_snap.then(function(mySnap){
			
			//Por cada documento de la snapshot en curso (sucursal), verifico cada EAN y calculo el precio_novedad
			console.log("Por procesar novedades de comercios...")

			mySnap.each(function(err,comercio){
				if (err){
					console.log('Error en forEach',err)
					return Promise.reject(err);
				}

				if (comercio == null) {

					console.log("No existen registros por precesar.")
					console.log("AHORA SI GRABO",usuarios)

					db.collection('usuarios').update({_id:usuarios._id},[usuarios],{w:1 , multi:true}, function(err,numberUpdated){
						assert.equal(null,err)
						assert.equal(2,numberUpdated);
					})

					console.log("Se actualizadon: ", numberUpdated)
					console.log("Se han procesado las novedades y generado el último snapshot.")
					console.log("Cerrando conexión a base de datos...")
					db.close()
					return;

				} else {

					console.log("Comercio:",comercio)					
					var keys = Object.keys(comercio)
					console.log(keys)
					
					for (e=1; e<keys.length; e++){

						var ean = keys[e]
						
						console.log("Proceso EAN:",ean)
						if (ean == null){
							console.log("No existen artículos para procesar en el comercio: ",comercio._id)
							return;
						}

						console.log("EAN:",comercio[ean])
						console.log("Registro:")
			
						console.log("Precio guardado: $",comercio[ean].precio_novedad)
						var novedades = comercio[ean].novedades

						for (i=0; i<novedades.length; i++){
							
							novedad_nro = i+1
							var nvd = comercio[ean].precio_novedad

							console.log("Proceso usuario de novedad")

							console.log("Precio de novedad N°",novedad_nro,"= $",novedades[i].precio)
							var prc = novedades[i].precio

							console.log("Usuario de novedad N°",novedad_nro,"= ",novedades[i].usuario)
							
							var usuario = _.findWhere(usuarios,{_id : novedades[i].usuario})
							console.log("Se encontró el usuario: ",usuario)

							var usr_key = _.findKey(usuarios,{_id : novedades[i].usuario})
							console.log("La KEY es: ",usr_key,"Tipo:",typeof usr_key)//,"Entonces:...",usuarios[usr_key].score)

							scr = usuario.score
							console.log("Score es: ",scr,"de tipo:",typeof scr)

							if (nvd >= prc) {

								var diferencia = nvd - prc
								var porcentaje = parseFloat((diferencia / nvd) * 100).toFixed(2)

							} else {

								var diferencia = prc - nvd
								var porcentaje = parseFloat((diferencia / nvd) * 100).toFixed(2)
							
							}

							console.log("El porcentaje de desvío es: %",porcentaje)

							if (porcentaje <= 1.00) { var nuevo_score = parseFloat(scr) + 100 } else
							if (porcentaje <= 3.00) { var nuevo_score = parseFloat(scr) + 70 } else
							if (porcentaje <= 5.00) { var nuevo_score = parseFloat(scr) + 50 } else
							if (porcentaje <= 10.00) { var nuevo_score = parseFloat(scr) + 20 } else
							if (porcentaje <= 20.00) { var nuevo_score = parseFloat(scr) + 5 } else
							if (porcentaje <= 30.00) { var nuevo_score = parseFloat(scr) - 100 } else
							if (porcentaje <= 50.00) { var nuevo_score = parseFloat(scr) - 500 } else
							if (porcentaje <= 100.00) { var nuevo_score = parseFloat(scr) - 1500 } else 
								{var nuevo_score = parseFloat(scr) - 3000};

							console.log("El nuevo score del usuario: ",novedades[i].usuario," es = ",nuevo_score);

							usuarios[usr_key].score = nuevo_score

							console.log("Se grabó el nuevo score: ", usuarios[usr_key].score)
							console.log("Score guardado.")
						}
					}	
				}
			})
		})
	}).catch(function(err){console.log(err)})
}).catch(function(err){console.log(err)})
