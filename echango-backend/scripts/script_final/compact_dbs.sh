#!/bin/bash
declare -a dbnames=("comercios" "novedades_subida" "precios_por_comercio" "productos" )

for dbname in "${dbnames[@]}" 
do
	curl -H "Content-Type: application/json" -X POST https://webi.certant.com/echango/$dbname/_compact
done