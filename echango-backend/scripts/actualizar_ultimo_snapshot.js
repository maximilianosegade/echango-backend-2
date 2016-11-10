var dbutils = require('../util/mongo');

(function actualizarUltimaSnapshot(){
	obtenerNovedadesPrecios().then(function(novedades){
		impactarNovedades(novedades);
	});
})();

function obtenerNovedadesPrecios(){
	
	console.log('Se van a buscar las novedades del snapshot ' +
		'en curso...');
	
	return dbutils.find('snapshot_en_curso', {}).then(function(resp){
		console.log('Se obtuvieron las novedades:');
		console.log(resp);
		return Promise.resolve(resp);
	});

}

function impactarNovedades(novedades){

	var updatesNovedades = [];

	console.log('Se van a impactar las novedades en el ultimo snapshot de precios...');

	novedades.forEach(function(novedadesComercio){

		var update = dbutils.find('ultima_snapshot', {
			_id: novedadesComercio._id
		}).then(function(resp){

			var ultimoSnapshotComercio = resp[0];
			var precioOld;

			console.log('Se va a actualizar comercio: ', novedadesComercio._id, '.');

			for (ean in novedadesComercio){

				if ( !(ean === '_id') ){

					precioOld = ultimoSnapshotComercio.precios[ean];
					ultimoSnapshotComercio.precios[ean] =
						novedadesComercio[ean].precio_novedad;					

					console.log('Se actualizo ean: ', ean,
						' en comercio: ', novedadesComercio._id,
						' precio: ', precioOld, ' => ',
						ultimoSnapshotComercio.precios[ean]);
				}

			}

			dbutils.update('ultima_snapshot', {
				_id: novedadesComercio._id
			}, ultimoSnapshotComercio).then(function(result){
				console.log('Actualizacion comercio: ',
					novedadesComercio._id, ' - OK.');					
			}).catch(function(err){
				console.log('Actualizacion comercio: ',
					novedadesComercio._id, ' - ERR. ', err);					
			});

		});

		updatesNovedades.push(update);

	});

	Promise.all(updatesNovedades).then(function(res){
		console.log('Fin de actualizacion de novedades - OK.');
	}).catch(function(err){
		console.log('Fin de actualizacion de novedades - ERROR. ', err);
	});
	
}