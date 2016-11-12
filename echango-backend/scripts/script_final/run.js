const fechaHoy = '2016-11-13 06:30:08';

var novedadesDbPublica = require('./01_price_management');

(function run(){
	log('Iniciando script de gestion de precios.');
	log('Iniciando paso 1 - Copiar novedades DB Publica a Privada.');
	
	var paso1 = novedadesDbPublica.copiarNovedadesDesdeDbPublicaAPrivada(fechaHoy);
	paso1.then(function(){
		log('Paso 1 finalizado.');
	}).catch(function(err){
		log('Fallo la ejecucion del script. ', err);
	});

})();

function log(msg){
	console.log(new Date().toISOString(), ' - ', msg);
}