var https = require('https');

// Obtener novedades de CouchDB (novedades_subida)
var fechaHoy = new Date().toISOString()
  .replace(/T/, ' ')		// replace T with a space
  .replace(/\..+/, '');     // delete the dot and everything after

var hostNovedades = 'webi.certant.com';
//var pathNovedades = '/echango/novedades_subida/_design/_view/_view/_compra_por_dia?descending=true&endkey=%22'+fechaHoy+'%22';
var pathNovedades = '/echango/novedades_subida/_design/_view/_view/_compra_por_dia?descending=true&endkey=%222016/11/04%22';
var mongoUrl = 'mongodb://echango_mobile:aprobamos el 22/11@ec2-35-162-193-58.us-west-2.compute.amazonaws.com:38128/echango';

var options = {
  host: hostNovedades,
  path: pathNovedades,
  method: 'GET'
};

var obtenerNovedades = new Promise(function(resolve, reject){

	console.log('Se van a consultar las novedades de precios...')

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

obtenerNovedades.then(function(resp){
	var i;
	var snapshot = {
		_id: fechaHoy,
		compras: []
	};

	console.log('Se obtuvieron las novedades de precios.');
	console.log('Se va a persistir el snapshot en historico...');
	
	for (i=0; i<resp.length; i++){
		snapshot.compras.push(resp[i].value);
	}

	var MongoClient = require('mongodb').MongoClient;	
	MongoClient.connect(mongoUrl, function(err, db) {
		if (err){
			console.log('Error connect', err);
			return Promise.reject(err);
		}

	    db.collection('compras_hist').insertOne(snapshot, function(err, result){
	    	if (err){
	    		console.log('Error insert', err);
	    		return Promise.reject(err);
	    	}
	    	
	    	return Promise.resolve(result);
	    })
	})

}).then(function(result){

	console.log('Se ha persistido el snapshot en historico.', result);
	
}).catch(function(err){

	console.log(err);

});

// Presistir en MongoDB