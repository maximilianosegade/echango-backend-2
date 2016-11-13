var fs = require('fs');
var compraOriginal = JSON.parse(fs.readFileSync('compra_test.js'));

var f = function (doc) {
  if (doc.fecha_compra) emit(doc.fecha_compra, {usuario: doc.usuario, comercio: doc.comercio, fecha_compra: doc.fecha_compra, detalle_compra: doc.detalle_compra});
	var compraModificada = {
	'usuario': compraOriginal.usuario,
	'comercio': compraOriginal.comercio._id,
	'fecha_compra': compraOriginal.fecha,
	'detalle_compra': {
	'articulos': []
	}
	}

	for (var i=0; i<compraOriginal.productos.length; i++){
	compraModificada.detalle_compra.articulos.push({
	'ean': compraOriginal.productos[i].ean,
	'precio_lista': compraOriginal.productos[i].precio_lista
	});
	}
}


console.log('Compra modificada:');
console.log(JSON.stringify(compraModificada));