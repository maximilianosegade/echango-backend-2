const dbutils = require('../../util/mongo');
const hostNovedades = 'webi.certant.com';
const pathNovedades = '/echango/novedades_subida/_design/_view/_view/_compra_por_dia_2?descending=true';
const dbPublicaNovedades = 'novedades_subida';
const nano     = require('nano')({
	url: 'https://webi.certant.com/echango',
	parseUrl: false})
  , username = 'echango'
  , userpass = 'echango2016';
const bluebird = require('bluebird');

bluebird.promisifyAll(nano);  
var dbNovedades = bluebird.promisifyAll(nano.use(dbPublicaNovedades));

module.exports = {

	copiarNovedadesDesdeDbPublicaAPrivada:function (fechaHoy, fechaHasta){
		var idNovedades = [];

		console.log('Se van a consultar las novedades de precios...');
		return obtenerNovedadesDbPublica(fechaHasta).then(function(novedades){	
			for (var i=0; i<novedades.length; i++){
				idNovedades.push(novedades[i].id);
			}			
			console.log('Se obtuvieron las novedades de precios.');
			console.log('Se va a persistir el snapshot en historico...');
			return persistirNovedadesEnDbPrivada(fechaHoy, novedades);
/*		}).then(function(){
			console.log('Se van a borrar los doc con ID: ', idNovedades)
			return idNovedades.reduce(function(sequence, id) {
			  return sequence.then(function() {
			    return dbNovedades.getAsync(id);
			  }).then(function(doc){
			  	dbNovedades.destroyAsync(doc._id, doc._rev);
			  })
			}, Promise.resolve());*/
		}).then(function(result){
			console.log('Se ha persistido el snapshot en historico.');
			return Promise.resolve();
		}).catch(function(err){
			console.log('Fallo la copia de novedades de compras desde ',
				'DB publica a DB privada.');
			return Promise.reject(err);
		});

	}

}

function obtenerNovedadesDbPublica(fechaHasta){

	return new Promise(function(resolve, reject){

		var https = require('https');
		var options = {
  			host: hostNovedades,
  			path: pathNovedades + 
  				(fechaHasta?
  					'&endkey='+	encodeURIComponent('"'+fechaHasta+'"'):''),
  			method: 'GET'
		};		
		var req = https.request(options, function(res) {
		  var body = '';

		  res.on('data', function(d) {
		    body += d;
		  });

		  res.on('end', function(d) {
		    resolve(JSON.parse(body).rows);
		  });
		});

		req.end();

		req.on('error', function(e) {
		  reject(e);
		});

	});

}

function persistirNovedadesEnDbPrivada(fechaHoy, novedades){

	var i;
	var snapshot = {
		_id: fechaHoy,
		compras: []
	};	
	
	for (i=0; i<novedades.length; i++){
		snapshot.compras.push(novedades[i].value);
	}

	return dbutils.insert('compras_hist', snapshot);
}