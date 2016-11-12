var dbutils = require('../../util/mongo');

module.exports = {
	backUp: function (id){
		return obtenerSnapshotEnCurso().then(function(snap){
			return backupSnapshotEnHistorico(id, snap);
		}).then(function(){
			return dbutils.remove('snapshot_en_curso');
		});
	}
}

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

	for (var i=0; i<snapshot.length; i++){
		var snapComercio = snapshot[i];
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
	};

	return Promise.all(inserts);

}