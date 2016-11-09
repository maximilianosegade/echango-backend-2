var mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';

function obtenerComprasHistoricoPorId(id){
	var dbTrack;

	console.log('Se van a buscar compras historicas por ID [', id, ']...');
	
	return new Promise(function(resolve, reject){

		var MongoClient = require('mongodb').MongoClient;	
		MongoClient.connect(mongoUrl, function(err, db) {
			dbTrack = db;

			if (err){
				if (dbTrack){
					dbTrack.close();
				}
				console.log('Error connect', err);
				reject(err);
			}
			
			console.log('Conexion a DB exitosa.');
			console.log('Buscar en tabla compras_hist...');

		    db.collection('compras_hist').find({'_id': id}).toArray(function(err, result){
		    	if (err){
		    		if (dbTrack){
						dbTrack.close();
					}
		    		console.log('Error insert', err);
		    		reject(err);
		    	}

		    	if (dbTrack){
					dbTrack.close();
				}

				if (!result.length)
					reject(new Error('No se encontro el documento con las compras historicas.'))
				else
					resolve(result[0].compras);
		    });
		});

	});

}


var id= '2016-11-09 03:25:51';
var snapComercios = {};
var usuarios = [];
var comercios = [];
var scores,
	preciosBase;

// obtener compras hist.
obtenerComprasHistoricoPorId(id).then(function(compras){

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

	return new Promise(function(resolve, reject){

		var MongoClient = require('mongodb').MongoClient;	
		MongoClient.connect(mongoUrl, function(err, db) {
			dbTrack = db;

			if (err){
				if (dbTrack){
					dbTrack.close();
				}
				console.log('Error connect', err);
				reject(err);
			}
			
			console.log('Conexion a DB exitosa.');
			console.log('Buscar en tabla usuarios...');

		    db.collection('usuarios').find({'_id': {'$in': usuarios}},{_id:1, score:1}).toArray(function(err, result){
		    	if (err){
		    		if (dbTrack){
						dbTrack.close();
					}
		    		console.log('Error insert', err);
		    		reject(err);
		    	}

		    	if (dbTrack){
					dbTrack.close();
				}

				resolve(result);
		    });

		});

	});

}).then(function(scoresObtenidos){

	console.log('Scores obtenidos: ', scoresObtenidos);
	scores = scoresObtenidos;

	return new Promise(function(resolve, reject){

		var MongoClient = require('mongodb').MongoClient;	
		MongoClient.connect(mongoUrl, function(err, db) {
			dbTrack = db;

			if (err){
				if (dbTrack){
					dbTrack.close();
				}
				console.log('Error connect', err);
				reject(err);
			}
			
			console.log('Conexion a DB exitosa.');
			console.log('Buscar en tabla ultima_snapshot...');

		    db.collection('ultima_snapshot').find({'_id': {'$in': comercios}}).toArray(function(err, result){
		    	if (err){
		    		if (dbTrack){
						dbTrack.close();
					}
		    		console.log('Error insert', err);
		    		reject(err);
		    	}

		    	if (dbTrack){
					dbTrack.close();
				}

				resolve(result);
		    });

		});

	});

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
						snapComercios[comercios[i]][prop].precio_base = preciosBase[j].precios[prop];
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

	var MongoClient = require('mongodb').MongoClient;	
	MongoClient.connect(mongoUrl, function(err, db) {
		dbTrack = db;

		if (err){
			if (dbTrack){
				dbTrack.close();
			}
			console.log('Error connect', err);
			return Promise.reject(err);
		}

	    db.collection('snapshot_en_curso').insertMany(insertDocs, function(err, result){
	    	if (err){
	    		if (dbTrack){
					dbTrack.close();
				}
	    		console.log('Error insert', err);
	    		return Promise.reject(err);
	    	}
	    	
	    	console.log('Snapshots actualizados en DB.');

	    	if (dbTrack){
				dbTrack.close();
			}
	    	return Promise.resolve(result);
	    });
	});

}).catch(function(err){

	console.log('Fallo la generacion de snapshot en curso para [', id, ']. ', err);

});