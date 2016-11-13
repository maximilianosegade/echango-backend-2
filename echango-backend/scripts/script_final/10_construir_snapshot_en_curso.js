const dbutils = require('../../util/mongo');

module.exports = {

	construirSnapshotEnCurso: function (id){
		
		var snapComercios = {};
		var usuarios = [];
		var comercios = [];
		var scores,
			preciosBase;

		console.log('Se van a buscar compras historicas por ID [', id, ']...');
			
		return dbutils.find('compras_hist',{_id: id}).then(function(novedades){
			
			return Promise.resolve(novedades[0].compras);

		}).then(function(compras){

			var i,
				j,
				idComercio,
				ean,
				user,
				precio;

			for (i=0; i<compras.length; i++){
				idComercio = compras[i].comercio;
				user = compras[i].usuario;
				// Guardo lista de usuarios y comercios afectados para usarlos
				// cuando termino de generar snapComercios.
				usuarios.push(user);
				comercios.push(idComercio);

				// Si no existe el comercio lo creo.
				if (!snapComercios[idComercio]){
					snapComercios[idComercio] = {
						_id: idComercio
					}
				}

				for (j=0; j<compras[i].detalle_compra.articulos.length; j++){
					ean = compras[i].detalle_compra.articulos[j].ean;
					precio = compras[i].detalle_compra.articulos[j].precio_lista;

					// Si no tiene guardado el EAN lo creo.
					if (!snapComercios[idComercio][ean]){
						snapComercios[idComercio][ean] = {
							novedades: []
						}
					}

					snapComercios[idComercio][ean].novedades.push({
						usuario: user,
						precio: precio
					});
				}

			}

			usuarios = require('underscore').uniq(usuarios);
			comercios = require('underscore').uniq(comercios);
			console.log('Usuarios de novedades: ', require('underscore').uniq(usuarios));
			console.log('Comercios de novedades: ', require('underscore').uniq(comercios));

			return dbutils.find(
				'usuarios', {'_id': {'$in': usuarios}},{_id:1, score:1}
			);

		}).then(function(scoresObtenidos){

			console.log('Scores obtenidos: ', scoresObtenidos);
			scores = scoresObtenidos;

			return dbutils.find('ultima_snapshot', {'_id': {'$in': comercios}});

		}).then(function(precios){
			var i,
				j,
				k;
			var insertDocs = [];

			console.log('Precios obtenidos OK.');
			preciosBase = precios;

			console.log('Se van a cargar los precios base y los score de usuario desde el ultimo snapshot.');

			for (i=0; i<comercios.length; i++){
				for (prop in snapComercios[comercios[i]]){
					if (/^\d+$/.test(prop)){
						
						// Setear precio base.
						for (j=0; j<preciosBase.length; j++){
												
							if (preciosBase[j]._id === comercios[i]){
								snapComercios[comercios[i]][prop].precio_base = preciosBase[j].precios[prop].precio;
								break;
							}
						}

						// Setear scores de usuario.
						for (j=0; j<snapComercios[comercios[i]][prop].novedades.length; j++){
													
							for (k=0; k<scores.length; k++){
								
								if (scores[k]._id === snapComercios[comercios[i]][prop].novedades[j].usuario){
									snapComercios[comercios[i]][prop].novedades[j].score = scores[k].score;
									break;
								}

							}
						}

					}
				}
			}

			console.log('Precios base y score cargados OK.');

			for (prop in snapComercios){
				insertDocs.push(snapComercios[prop]);
			}
			
			console.log('Snapshot generado: ', JSON.stringify(insertDocs));

			return dbutils.insert('snapshot_en_curso', insertDocs);
		}).catch(function(err){
			return Promise.reject(err);
		});

	}

}