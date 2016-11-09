var dbutils = require('../util/mongo');

(function backUp(){
	obtenerSnapshotEnCurso().then(function(snap){
		backupSnapshotEnHistorico('2016-12-08 00:59:14', snap);
	});
})();

function obtenerSnapshotEnCurso(){
	
	console.log('Se van a buscar las novedades del snapshot ' +
		'en curso...');
	
	return dbutils.find('snapshot_en_curso', {}).then(function(resp){
		console.log('Se obtuvieron las novedades:');
		console.log(resp);
		return Promise.resolve(resp);
	});

}

function backupSnapshotEnHistorico(idSnapshot, snapshot){

	var periodo = idSnapshot.substring(0,7);
	var inserts = [];

	console.log('Se va a backupear el snapshot :', idSnapshot, 
		' en periodo: ', periodo);

	snapshot.forEach(function(snapComercio){
		var idSnapComercio = snapComercio._id + '_' + periodo;
		var record = {};
		record.periodo = periodo;
		record[idSnapshot] = snapComercio;
		
		console.log('Guardando snap en comercio/periodo: ', idSnapComercio);
		
		var insert = dbutils.update('sucursales_hist',
			{ _id: idSnapComercio },
			{
				$set: record
			},
			{ upsert: true }
		);

		inserts.push(insert);
	});

	Promise.all(inserts).then(function(result){
		console.log('Fin de update OK');
	});

}