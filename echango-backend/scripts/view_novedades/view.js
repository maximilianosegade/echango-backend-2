function (doc) {
  if (doc.fecha_compra) emit(doc.fecha_compra, {usuario: doc.usuario, comercio: doc.comercio, fecha_compra: doc.fecha_compra, detalle_compra: doc.detalle_compra});
}