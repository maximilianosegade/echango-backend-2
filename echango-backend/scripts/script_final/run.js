const fechaInicio = '2016-11-12 06:30:08';

(function run(){
	log('Iniciando script de gestion de precios.');
	log('Iniciando paso 1 - Copiar novedades DB Publica a Privada.');
	
	var paso1 = require('./01_price_management').
		copiarNovedadesDesdeDbPublicaAPrivada(fechaInicio);
	
	paso1.then(function(){

		log('Paso 1 finalizado.');
		log('Iniciando paso 2 - Construir snapshot en curso.');
		return require('./10_construir_snapshot_en_curso').
			construirSnapshotEnCurso(fechaInicio);

	}).then(function(){

		log('Paso 2 finalizado.');
		log('Iniciando paso 3 - Calcular nuevo precio por novedades.');
		return require('./20_define_price').
			calcularPrecioNovedad();

	}).then(function(){
		log('Paso 3 finalizado.');
	}).catch(function(err){
		log('Fallo la ejecucion del script. ', err);
	});

})();

function log(msg){
	console.log(new Date().toISOString(), ' - ', msg);
}