const hostNovedades = 'webi.certant.com';
const pathNovedades = '/echango/novedades_subida/_design/_view/_view/_compra_por_dia?descending=true';
const mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';

function copiarNovedadesDesdeDbPublicaAPrivada(fechaHoy, fechaHasta){

	console.log('Se van a consultar las novedades de precios...');
	return obtenerNovedadesDbPublica(fechaHasta).then(function(novedades){	
		console.log('Se obtuvieron las novedades de precios.');
		console.log('Se va a persistir el snapshot en historico...');
		return persistirNovedadesEnDbPrivada(fechaHoy, novedades);
	}).then(function(result){
		console.log('Se ha persistido el snapshot en historico.');
		return Promise.resolve();
	}).catch(function(err){
		console.log('Fallo la copia de novedades de compras desde ',
			'DB publica a DB privada.');
		return Promise.reject(err);
	});

}

function obtenerNovedadesDbPublica(fechaHasta){

	return new Promise(function(resolve, reject){

		var https = require('https');
		var options = {
  			host: hostNovedades,
  			path: pathNovedades + 
  				(fechaHasta?'endkey="'+fechaHasta+'"':''),
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

	return require('../../util/mongo').insert('compras_hist', snapshot);
}

module.exports = {
	copiarNovedadesDesdeDbPublicaAPrivada: copiarNovedadesDesdeDbPublicaAPrivada
}