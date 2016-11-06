var https = require('https');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;	
var mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';
//var ean = "7790895000997";
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
		
					precio_base = comercio[ean].precio_base
					console.log("Precio base: $",precio_base)

					var novedades = comercio[ean].novedades
					console.log("Imprimo novedades del artículo - Tipo:",typeof novedades)
					console.log(novedades)

					precio_novedad_num = precio_base * precio_base_weight
					console.log("precio_novedad_num = ",precio_novedad_num)
					precio_novedad_denom = precio_base_weight
					console.log("precio_novedad_denom = ",precio_novedad_denom)

					for (i=0; i<novedades.length; i++){
						
						novedad_nro = i+1

						console.log("Precio de novedad N°",novedad_nro,"= $",novedades[i].precio)
						console.log("Peso de novedad N°",novedad_nro,"= ",novedades[i].score)

						console.log("precio_novedad_num ANTES:",precio_novedad_num)
						precio_novedad_num += novedades[i].precio * novedades[i].score
						console.log("precio_novedad_num DESPUES:",precio_novedad_num)
						
						console.log("precio_novedad_denom ANTES:",precio_novedad_denom)
						precio_novedad_denom += parseFloat(novedades[i].score)
						console.log("precio_novedad_denom DESPUES:",precio_novedad_denom)
						}

					var precio_novedad = precio_novedad_num / precio_novedad_denom
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
