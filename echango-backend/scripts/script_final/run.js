const fechaInicio = new Date();
const moment = require('moment');
/*
const fechaInicioFormateada = fechaInicio.toISOString()
	.replace(/T/, ' ')
  	.replace(/\..+/, '');
*/
const fechaInicioFormateada = moment().format().replace(/T/, ' ').replace(/-\d\d:\d\d/, '');
const fechaHastaNovedades = moment().subtract(5, 'days').format().replace(/T/, ' ').replace(/-\d\d:\d\d/, '');

(function run(){
	log('Iniciando script de gestion de precios.');
	log('Iniciando paso 1 - Copiar novedades DB Publica a Privada.');
	logSeparator();
	
	var paso1 = require('./01_price_management').
		copiarNovedadesDesdeDbPublicaAPrivada(fechaInicioFormateada, fechaHastaNovedades);
	
	paso1.then(function(){

		logSeparator();
		log('Paso 1 finalizado.');
		log('Iniciando paso 2 - Construir snapshot en curso.');
		logSeparator();
		return require('./10_construir_snapshot_en_curso').
			construirSnapshotEnCurso(fechaInicioFormateada);

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
		
		//return require('./40_actualizar_ultimo_snapshot').
		return require('./41_actualizar_ultimo_snapshot').
			actualizarUltimaSnapshot();

	}).then(function(){

		logSeparator();
		log('Paso 5 finalizado.');
		log('Iniciando paso 6 - Backup de snapshot en curso.');
		logSeparator();
		
		return require('./50_backup_snapshot_en_curso').
			backUp(fechaInicioFormateada);

	}).then(function(){

		logSeparator();
		log('Paso 6 finalizado.');
		log('Iniciando paso 7 - Cargar promociones.');
		logSeparator();
		
		//return require('./60_promotion_management').
		//	actualizarPromociones();
		return Promise.resolve();

	}).then(function(){

		logSeparator();
		log('Paso 7 finalizado.');
		log('Iniciando paso 8 - Replicar ultimo snapshot '+
			'consolidado en DB publica.');
		logSeparator();
		
		return require('./70_replicar_ultimo_snapshot_en_db_publica').
			replicarUltimoSnapshotEnDbPublica();
	
	}).then(function(){

		logSeparator();
		log('Paso 8 finalizado.');
		logDuracionTotal();

	}).catch(function(err){
		log('Fallo la ejecucion del script. ', err);
	});

})();

function log(msg){
	console.log(new Date()+ ' - '+ msg);
}

function logDuracionTotal(){
	duracionEnSegundos = ((new Date()-fechaInicio)/1000).toFixed(0);
	log('Duracion total del script (segundos): ' + duracionEnSegundos);
}

function logSeparator(){
	log('=========================================================');
}