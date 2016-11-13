var https = require('https');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;	
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

		var mySnap = db.collection('snapshot_en_curso').find()
		console.log("Devuelvo conexión a DB y cursor")
		resolve(mySnap);
	})

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
					
					precio_base = comercio[ean].precio_base
					console.log("Precio base: $",precio_base)

					var novedades = comercio[ean].novedades
					console.log("Imprimo novedades del artículo:")
					console.log(novedades)
					
					var novedades_nro = 0

					var precio_novedad_num = 0
					var precio_novedad_denom = 0
					
					var cant_chango_lleno = 0
					var prc_chango_lleno = 0
					var cant_chango = 0
					var prc_chango = 0
					
					//El precio base existe si es TRUE
					if (comercio[ean].precio_base) {

						precio_novedad_num = precio_base * precio_base_weight
						console.log("precio_novedad_num = ",precio_novedad_num)

						precio_novedad_denom = precio_base_weight
						console.log("precio_novedad_denom = ",precio_novedad_denom)

						var excluir_precio_base = 0
						//En caso de existir el precio base, tengo que analizar si lo incluyo

					} else {

						var excluir_precio_base = 1
						//Excluyo el análisis del precio base
						console.log("Artículo sin precio base.")
					}
						
					console.log("1 - excluir_precio_base =",excluir_precio_base)

					for (i=0; i<novedades.length; i++){

						novedad_nro = i+1						
						
						if (novedades[i].score < 1000.00) { var nov_weight = 1 } else
						if (novedades[i].score < 10000.00) { var nov_weight = 10 } else
						if (novedades[i].score < 25000.00) { var nov_weight = 150 } else
						if (novedades[i].score < 100000.00) { var nov_weight = 1750 } else
						{ var nov_weight = 14500 }

						console.log("Precio de novedad N°",novedad_nro,"= $",novedades[i].precio)
						console.log("Peso de novedad N°",novedad_nro,"= ",nov_weight)



						// Análisis de precio base - si es 1 se excluye el análisis
						if (excluir_precio_base == 0){

							//SUPER CHANGO
							if (nov_weight == 14500) {

								//Calculo el porcentaje de diferencia con el precio base para la novedad del usuario
								if (novedades[i].precio >= comercio[ean].precio_base) {
									var diferencia = novedades[i].precio - comercio[ean].precio_base
								} else {
									var diferencia = comercio[ean].precio_base - novedades[i].precio
								}
								
								var porcentaje = parseFloat((diferencia / comercio[ean].precio_base) * 100).toFixed(2)
								
								if (porcentaje > 15) {
									excluir_precio_base = 1
									//Se deberá excluir el precio base del cálculo
									console.log("Se ha excluido el precio base por usuario Super Chango")
								}
							}

							//CHANGO LLENO
							if (nov_weight == 1750) {

								cant_chango_lleno++
								prc_chango_lleno += parseFloat(novedades[i].precio)

								if (cant_chango_lleno >= 10) {

									var prom_prc_chango_lleno = prc_chango_lleno / cant_chango_lleno

									if (prom_prc_chango_lleno >= comercio[ean].precio_base) {
										var diferencia = prom_prc_chango_lleno - comercio[ean].precio_base
									} else {
										var diferencia = comercio[ean].precio_base - prom_prc_chango_lleno
									}
									
									var porcentaje = parseFloat((diferencia / comercio[ean].precio_base) * 100).toFixed(2)

									if ( porcentaje > 30){

										excluir_precio_base = 1
										//Se deberá excluir el precio base del cálculo
										console.log("Se ha excluido el precio base por usuarios Chango Lleno")
									}

								}

							}

							//CHANGO
							if (nov_weight == 150) {

								cant_chango++
								prc_chango += parseFloat(novedades[i].precio)

								if (cant_chango >= 50) {

									var prom_prc_chango = prc_chango / cant_chango

									if (prom_prc_chango >= comercio[ean].precio_base) {
										var diferencia = prom_prc_chango - comercio[ean].precio_base
									} else {
										var diferencia = comercio[ean].precio_base - prom_prc_chango
									}
									
									var porcentaje = parseFloat((diferencia / comercio[ean].precio_base) * 100).toFixed(2)

									if ( porcentaje > 50){

										excluir_precio_base = 1
										//Se deberá excluir el precio base del cálculo
										console.log("Se ha excluido el precio base por usuarios Chango")
									}

								}

							}

						}

						console.log("2 - excluir_precio_base =",excluir_precio_base)

						if (novedades[i].score >= 0) {
							console.log("precio_novedad_num ANTES:",precio_novedad_num)
							precio_novedad_num += novedades[i].precio * nov_weight
							console.log("precio_novedad_num DESPUES:",precio_novedad_num)
							
							console.log("precio_novedad_denom ANTES:",precio_novedad_denom)
							precio_novedad_denom += parseFloat(nov_weight)
							console.log("precio_novedad_denom DESPUES:",precio_novedad_denom)
						}
					}

					console.log("3 - excluir_precio_base =",excluir_precio_base)
					
					// Si el flag está en 1 se excluye el precio base
					if (excluir_precio_base == 1) {

						//Para excluir el precio base, el mismo debe haber existido
						if (comercio[ean].precio_base) {

							console.log("Se excluirá el precio base")
							precio_novedad_num += -(precio_base * precio_base_weight)

							precio_novedad_denom += -precio_base_weight

						}

					}

					console.log("4 - excluir_precio_base =",excluir_precio_base)
					console.log("Voy a dividir: $",precio_novedad_num," por $",precio_novedad_denom)

					var precio_novedad = parseFloat(precio_novedad_num / precio_novedad_denom).toFixed(2)

					console.log("Precio novedad: $",precio_novedad)
					comercio[ean].precio_novedad = precio_novedad
					console.log("Precio guardado: $",comercio[ean].precio_novedad);
			   }

			   console.log("Grabo precio_novedad:",comercio)
			   db.collection('snapshot_en_curso').update({_id:comercio._id},comercio)
			}
		})
	}).catch(function(err){

		console.log(err)

	})

}).catch(function(err){

		console.log(err);
})
