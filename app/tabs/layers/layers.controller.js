angular.module('LayersTabController', ['APIService', 'SettingsService', 'ngMaterial'])

.controller('LayersTabController', function LayersTabController($scope, $rootScope, Projects, LayersTabSettings, MapSettings, ProjectSettings, APP_CONFIG, $mdDialog, $mdToast)
{
	
	$scope.groupActiveChange = MapSettings.groupActiveChange;  
	$scope.layerActiveChange = MapSettings.layerActiveChange; 
	$scope.toggleShowAllGroups = MapSettings.toggleShowAllGroups;
	$scope.toggleShowAllLayers = MapSettings.toggleShowAllLayers;
	
	//TODO: move all this into layers table and pull from each layer
	let bogiFeatureParams = {
		featureNamespace:	'section368',
		featurePrefix:		'section368',
		outputFormat:		'application/json',
		geometryName:		'geom',
		queryURL:			'http://bogi.evs.anl.gov/geoserver/section368/wfs'
	}
	
	let ameupFeatureParams = {
		featureNamespace:	'http://ameup.usgin.org',
		featurePrefix:		'AMEUP',
		outputFormat:		'application/json',
		geometryName:		'the_geom',
		queryURL:			'http://ameup.usgin.org:8080/geoserver/wfs'
	}
	
	//The azgs layers are a bit boogered for now so I'm going to ignore them
	let azgsFeatureParams = {
		featureNamespace:	undefined,
		featurePrefix:		undefined,
		outputFormat:		undefined,
		geometryName:		undefined,
		queryURL:			undefined
	}
	
	let queryFeatures = (layer => {
		//TODO: parse fields of layer to fill out below.
		console.log(layer);
		console.log(layer.source.url);
		console.log(layer.source.params);
		
		
		let paramStub;
		if (layer.source.url.toLowerCase().includes("bogi")) {
			paramStub = bogiFeatureParams;
		} else if (layer.source.url.toLowerCase().includes("ameup")) {
			paramStub = ameupFeatureParams;
		} else if (layer.source.url.toLowerCase().includes("azgs")) {
			paramStub = azgsFeatureParams;
		} else {
			paramStub = {};
		}
		
		let featureType = layer.source.params.LAYERS;
		if (featureType != undefined) {
			let split = featureType.split(":");
			featureType = split.length == 1 ? featureType : split[1];
		}
		console.log("featureType = " + featureType);

		let featureRequest = new ol.format.WFS().writeGetFeature({
			srsName: 'EPSG:3857',
			featureNS: paramStub.featureNamespace,
			featurePrefix: paramStub.featurePrefix,
			featureTypes: [featureType], 
			outputFormat: 'application/json',
			//ogc is not in most of the examples and docs online, but is necessary (https://github.com/openlayers/openlayers/pull/5653)
			filter: ol.format.ogc.filter.bbox(paramStub.geometryName, MapSettings.data.aoi.getExtent(), 'urn:ogc:def:crs:EPSG::3857')
		});
			
		//make sure its good to go
		console.log(featureRequest);
		featureRequest = featureRequest.hasChildNodes() ? featureRequest : undefined;
		
		if (featureRequest != undefined && paramStub.queryURL != undefined) {
			// then post the request and add the received features to a layer
			fetch('/proxy/' + paramStub.queryURL, {
				method: 'POST',
				body: new XMLSerializer().serializeToString(featureRequest)
			}).then(function(response) {
				console.log(response);
				return response.json();
				//return response.text();
			}).then(function(json) {
				console.log(json);
				//$scope.queryResults = JSON.stringify(json);
				
				//$scope.queryResults[0] = ["No features"];
				json.features.forEach((feature, index, array) => {
					LayersTabSettings.data.queryResults[index] = JSON.stringify(feature.properties, null, 4);
					console.log('queryResults = ');console.log(LayersTabSettings.data.queryResults[index]);
				});
	
				$scope.$apply();
	
				//TODO: Add features to map? Something like this:
				/**
				var features = new ol.format.GeoJSON().readFeatures(json);
				vectorSource.addFeatures(features);
				map.getView().fit(vectorSource.getExtent());
				**/
			});
		} else {
			let noData = {noData:"Layer cannot be queried"};
			LayersTabSettings.data.queryResults[0] = JSON.stringify(noData, null, 4);//"Layer cannot be queried";
			console.log('queryResults = ');console.log(LayersTabSettings.data.queryResults[0]);
		}

	});
	
	$scope.layerClicked = function(layerName) {
		console.log("layer clicked = " + layerName);
		LayersTabSettings.data.queryLayer = layerName;
		LayersTabSettings.data.queryResults = [];
		let layer = MapSettings.data.layers.find(l => {return l.name === layerName;});
		if (layer != null) {
			console.log(layer);
			queryFeatures(layer); 
		}
	}
	
	//Refresh on AOI change
    $rootScope.$on("AOIchanged", function(){
		console.log("received AOIchanged");
		$scope.layerClicked(LayersTabSettings.data.queryLayer);
	});
	
});