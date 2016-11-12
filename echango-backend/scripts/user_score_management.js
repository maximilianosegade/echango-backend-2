var https = require('https');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;	
var mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';
//var ean = "7790895000997";
var _ = require('underscore');
var assert = require('assert');

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
	
	var search_snap = new Promise(function(resolve,reject){

		var mySnap = db.collection('snapshot_en_curso').find()
		console.log("Devuelvo conexión a DB y cursor")
		resolve(mySnap);
	});

	search_snap.then(function(mySnap){
		
		//Por cada documento de la snapshot en curso (sucursal), verifico cada EAN y calculo el precio_novedad
		console.log("Por procesar novedades de comercios...")

		var v_cant_suc = 0	
		var usuarios = []

		mySnap.each(function(err,comercio){
			if (err){
				console.log('Error en each',err)
				return Promise.reject(err);
			}

			v_cant_suc++

			//Pocesa el "doc:comercio" y en el último each donde "doc:comercio" es nulo, termina de procesar
			if (comercio == null) {

				console.log("No existen registros por precesar.")
				console.log("Se procesaron: ",v_cant_suc," sucursales.")
				console.log("AHORA SI GRABO")//,usuarios)

				var usr_keys = Object.keys(usuarios)

				console.log("Largo:",usr_keys.length)
				console.log("Keys:",usr_keys)

				for (u=0; u<usr_keys.length; u++) {

					console.log("Grabo usuario: ",usr_keys[u])
					console.log("Su score es: ",usuarios[usr_keys[u]])

					if (usuarios[usr_keys[u]] < 1000.00) { var usr_weight = 1 } else
					if (usuarios[usr_keys[u]] < 10000.00) { var usr_weight = 10 } else
					if (usuarios[usr_keys[u]] < 25000.00) { var usr_weight = 150 } else
					if (usuarios[usr_keys[u]] < 100000.00) { var usr_weight = 1750 } else
						{ var usr_weight = 14500 }

					if (usuarios[usr_keys[u]] < 1000.00) { var usr_weight_det = "Chango Vacío" } else
					if (usuarios[usr_keys[u]] < 10000.00) { var usr_weight_det = "Mini Chango" } else
					if (usuarios[usr_keys[u]] < 25000.00) { var usr_weight_det = "Chango" } else
					if (usuarios[usr_keys[u]] < 100000.00) { var usr_weight_det = "Chango Lleno" } else
						{ var usr_weight_det = "Super Chango" }

					db.collection('usuarios').update({_id:usr_keys[u]},{$set: {score:usuarios[usr_keys[u]], weight:usr_weight,chango_type: usr_weight_det}})
				}
				
				console.log("Se han procesado las novedades y generado el último snapshot.")
				console.log("Cerrando conexión a base de datos...")
				db.close()
				return;
			} else {

				//Informo el comercio a procesar
				console.log("PROCESANDO NUEVO COMERCIO -------------------------------------")
				console.log("Procesando comercio:",comercio._id)					
				
				//Obtengo un array con todos los _id de los EAN que tienen novedades para el comercio
				var keys = Object.keys(comercio)

				//Imprimo el array para ver los EAN con novedades
				console.log(keys)

				//Arranco de la posición "e=1" porque la posición 0 contiene el _id del comercio
				//Comienzo a recorrer todos los EAN con novedades
				for (e=1; e<keys.length; e++){

					//Asigno el EAN a recorrer
					var ean = keys[e]
					
					//No debería pasar, pero en caso que el EAN sea nulo, significa que no tengo más registros para procesar y retorno
					if (ean == null){
						console.log("No existen artículos para procesar en el comercio: ",comercio._id)
						return;
					}

					console.log("PROCESANDO NUEVO EAN -------------------------------------")
					
					//Informo qué EAN estoy procesando
					console.log("Proceso EAN:",ean)

					//Imprimo el objeto EAN asignado
					console.log("EAN:",comercio[ean])

					//Muestro el precio novedad definido para dicho EAN en "Define_price"
					console.log("Precio guardado: $",comercio[ean].precio_novedad)
					var nvd = comercio[ean].precio_novedad

					//Asigno el array de novedades a la variable novedades, la cual comienzo a recorrer desde la primer novedad
					var novedades = comercio[ean].novedades

					//Informo la cantidad de novedades para el EAN
					console.log("Se procesarán ",novedades.length," novedades...")
					
					for (i=0; i<novedades.length; i++){
						
						//Identifico la novedad comenzando por la 1 (por eso le sumo 1)
						novedad_nro = i+1

						console.log("Proceso usuario de novedad N°",novedad_nro)
						
						console.log("Usuario: ",novedades[i].usuario)
						var usr = novedades[i].usuario

						console.log("Precio informado por el usuario: $",novedades[i].precio)
						var prc = novedades[i].precio

						console.log("El usuario informó el precio con un score de: ",novedades[i].score)
						var scr = novedades[i].score

						//Verifico si el usuario existe en el array de usuarios de novedades
						//Si no existe deberé asignarle una posición
						//Si existe, deberé sumar los puntos que ha obtenido en esta novedad a los puntos de array
						var usr_exist = _.has(usuarios,usr)

						if (usr_exist == true) {
							
							console.log("Usuario existente:",usr)

						} else {

							usuarios[usr]=scr

							console.log("Se ha agregado un usuario a la lista: ",usr)
							console.log("Imprimo lista actualizada: ", usuarios)
						}

						console.log("El usuario tiene actualmente un score =",usuarios[usr])

						//Calculo el porcentaje de diferencia con respecto a la novedad calculada
						if (nvd >= prc) {
							var diferencia = nvd - prc
						} else {
							var diferencia = prc - nvd
						}

						var porcentaje = parseFloat((diferencia / nvd) * 100).toFixed(2)

						console.log("El porcentaje de desvío es: %",porcentaje)

						if (porcentaje <= 1.00) { var add_score = 100 } else
						if (porcentaje <= 3.00) { var add_score = 70 } else
						if (porcentaje <= 5.00) { var add_score = 50 } else
						if (porcentaje <= 10.00) { var add_score = 20 } else
						if (porcentaje <= 20.00) { var add_score = 5 } else
						if (porcentaje <= 30.00) { var add_score = -10 } else
						if (porcentaje <= 50.00) { var add_score = -200 } else
						if (porcentaje <= 100.00) { var add_score = -1050 } else 
							{var add_score = - 3000};

						console.log("El score adicional que le corresponde al usuario: ",usr," es = ",add_score);

						usuarios[usr] = parseFloat(usuarios[usr]) + parseFloat(add_score)

						console.log("Se guardó el score final: ",usuarios[usr])	
						console.log("Imprimo lista actualizada: ", usuarios)				
					}	
				}
			}
		})
	}).catch(function(err){console.log(err)})
}).catch(function(err){console.log(err)})
