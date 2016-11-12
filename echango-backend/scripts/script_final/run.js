const fechaInicio = '2016-11-12 06:30:08';

(function run(){
	log('Iniciando script de gestion de precios.');
	log('Iniciando paso 1 - Copiar novedades DB Publica a Privada.');
	logSeparator();
	
	var paso1 = require('./01_price_management').
		copiarNovedadesDesdeDbPublicaAPrivada(fechaInicio);
	
	paso1.then(function(){

		logSeparator();
		log('Paso 1 finalizado.');
		log('Iniciando paso 2 - Construir snapshot en curso.');
		logSeparator();
		return require('./10_construir_snapshot_en_curso').
			construirSnapshotEnCurso(fechaInicio);

	}).then(function(){

		logSeparator();
		log('Paso 2 finalizado.');
		log('Iniciando paso 3 - Calcular nuevo precio por novedades.');
		logSeparator();
		return require('./20_define_price').
			calcularPrecioNovedad();

	}).then(function(){

		logSeparator();
		log('Paso 3 finalizado.');
		log('Iniciando paso 4 - Actualizar score de usuarios.');
		logSeparator();
		return require('./30_user_score_management').
			definirScoreUsuarios();

	}).then(function(){

		logSeparator();
		log('Paso 4 finalizado.');
		log('Iniciando paso 5 - Actualizar ultimo snapshot ' +
			'con precios de novedades.');
		logSeparator();
		
		return require('./40_actualizar_ultimo_snapshot').
			actualizarUltimaSnapshot();

	}).then(function(){

		logSeparator();
		log('Paso 5 finalizado.');
		log('Iniciando paso 6 - Backup de snapshot en curso.');
		logSeparator();
		
		return require('./50_backup_snapshot_en_curso').
			backUp(fechaInicio);

	}).then(function(){

		logSeparator();
		log('Paso 6 finalizado.');
		logSeparator();
		//log('Iniciando paso 6 - Backup de snapshot en curso.');

	}).catch(function(err){
		log('Fallo la ejecucion del script. ', err);
	});

})();

function log(msg){
	console.log(new Date().toISOString(), ' - ', msg);
}

function logSeparator(){
	log('=========================================================');
}