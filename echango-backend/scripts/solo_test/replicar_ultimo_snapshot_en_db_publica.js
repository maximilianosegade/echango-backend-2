var dbutils = require('../../util/mongo');
var dbUltimoSnapshot = 'ultima_snapshot';
var dbPublicaPreciosActualizados = 'precios_por_comercio';
var nano     = require('nano')({
	url: 'https://webi.certant.com/echango',
	parseUrl: false})
  , username = 'echango'
  , userpass = 'echango2016';
var bluebird = require('bluebird');

bluebird.promisifyAll(nano);  
var preciosPorComercio = bluebird.promisifyAll(nano.use(dbPublicaPreciosActualizados));

(function replicarUltimoSnapshotEnDbPublica(){
	obtenerNovedadesPrecios().then(function(novedades){
		impactarNovedades(novedades);
	});
})();

function obtenerNovedadesPrecios(){
	
	console.log('Se van a buscar las novedades del snapshot ' +
		'en curso...');
	
	return dbutils.find(dbUltimoSnapshot, {}).then(function(resp){
		console.log('Se obtuvieron las novedades:');
		console.log(resp);
		return Promise.resolve(resp);
	});

}

function impactarNovedades(novedades){

	var updatesNovedades = [];
	var auth = nano.authAsync(username, userpass);

	console.log('Se van a impactar las novedades en la DB publica Couch...');

	novedades.forEach(function(novedadesComercio){

		console.log('[', novedadesComercio._id, '] Procesando snapshot ...');
		
		for(ean in novedadesComercio.precios){
			novedadesComercio.precios[ean].promociones = []
		}

		var update = auth.then(function(){
			return preciosPorComercio.getAsync(novedadesComercio._id);
		}).then(function(resp){
			console.log('[', novedadesComercio._id, '] Update doc. Rev actual: ', resp._rev);
			novedadesComercio._rev = resp._rev;
			return preciosPorComercio.insertAsync(novedadesComercio);
		}).catch(function(err){
			console.log('[', novedadesComercio._id, '] Insertar nuevo doc.');
			return preciosPorComercio.insertAsync(novedadesComercio);
		}).then(function(resultado){
			console.log('[', novedadesComercio._id, '] Fin procesamiento snapshot => OK.') ;
			return Promise.reject();
		}).catch(function(err){
			console.log('[', novedadesComercio._id, '] Fin procesamiento snapshot => ', err) ;
			return Promise.resolve();
		});

		updatesNovedades.push(update);

	});

	Promise.all(updatesNovedades).then(function(res){
		console.log('Fin de actualizacion de novedades - OK.');
		nano.db.compact(dbPublicaPreciosActualizados);
	}).catch(function(err){
		console.log('Fin de actualizacion de novedades - ERROR. ', err);
	});
	
}