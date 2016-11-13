var dbutils = require('../../util/mongo');

module.exports = {

	actualizarUltimaSnapshot: function(){
			
		return obtenerNovedadesPrecios().then(function(novedades){
			return impactarNovedades(novedades);
		});
		
	}
}

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

	for (var i=0; i<novedades.length; i++){
		novedadesComercio = novedades[i];

		var update = dbutils.find('ultima_snapshot', {
			_id: novedadesComercio._id
		}).then(function(resp){

			var ultimoSnapshotComercio = resp[0];
			var precioOld;
			var modificado = false;

			for (ean in novedadesComercio){

				if ( !(ean === '_id') ){
					modificado = true;

					precioOld = ultimoSnapshotComercio.precios[ean];
					ultimoSnapshotComercio.precios[ean].precio =
						novedadesComercio[ean].precio_novedad;					

					console.log('Se actualizo ean: ', ean,
						' en comercio: ', novedadesComercio._id,
						' precio: ', precioOld, ' => ',
						ultimoSnapshotComercio.precios[ean].precio);
				}

			}

			if (modificado){

				console.log('Se va a actualizar comercio: ', novedadesComercio._id, '.');

				return dbutils.update('ultima_snapshot', {
					_id: novedadesComercio._id
				}, ultimoSnapshotComercio);

			}else{
				return Promise.resolve();
			}

		});

		updatesNovedades.push(update);

	}

	return Promise.all(updatesNovedades);	
}