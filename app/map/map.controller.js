angular.module('MapController', ['APIService', 'SettingsService'])

.controller('MapController', function MapController($scope, $http, olData, Layers, LayerGroups, MapSettings, APP_CONFIG, ProjectSettings) {
	function print_call_stack() {
		var stack = new Error().stack;
		console.log("PRINTING CALL STACK");
		console.log( stack );
	}	
	
	olData.getMap().then(map => {
		
		/**
		$scope.boxExtent = map.getView().calculateExtent(map.getSize());
		console.log("extent"); console.log($scope.boxExtent);
		console.log(ol.proj.toLonLat([$scope.boxExtent[0], $scope.boxExtent[1]]));
		console.log(ol.proj.toLonLat([$scope.boxExtent[2], $scope.boxExtent[3]]));
		**/
		
		let mousePosition = new ol.control.MousePosition({
			coordinateFormat: ol.coordinate.createStringXY(2),
			projection: 'EPSG:4326',
			className: 'ol-scale-line-inner',
			target: document.getElementById('positionDisplay'),
			undefinedHTML: '&nbsp;'
		});

		map.addControl(mousePosition);

		/**
		//TODO: Get single point select working
		selectSingleClick = new ol.interaction.Select();
		selectSingleClick.on('select', event => {
			console.log("single click received");
			console.log(event);
			map.removeLayer(layer);
			$scope.selectPoint = event.mapBrowserEvent.coordinate;
			if ($scope.infoMode) {
				$scope.layerClicked($scope.queryLayer);
			}
		});
		map.addInteraction(selectSingleClick);
		**/
		
		let dragBox = new ol.interaction.DragBox({
			condition: ol.events.condition.shiftKeyOnly,
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: [0, 0, 255, 1]
				})
			})
		});

		//The following from https://gis.stackexchange.com/questions/136068/keep-dragbox-visible
		let layer;
		dragBox.on('boxend', (evt) => {
			document.getElementById('positionDisplay').style.visibility = "hidden";
			// Get the current dragbox coordinateds 
			let coordinates = dragBox.getGeometry().getCoordinates();
			console.log("coordinates"); console.log(coordinates);
			$scope.boxExtent = dragBox.getGeometry().getExtent();
			console.log("extent"); console.log($scope.boxExtent);
			console.log(ol.proj.toLonLat([$scope.boxExtent[0], $scope.boxExtent[1]]));
			console.log(ol.proj.toLonLat([$scope.boxExtent[2], $scope.boxExtent[3]]));
			// Create the polygon and pass the coordinates
			let polygonFeature = new ol.Feature(
							   new ol.geom.Polygon(coordinates));

			// Create the layer and style it as you like
			layer = new ol.layer.Vector({
				source: new ol.source.Vector({
					features: [polygonFeature]
				}),
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						width: 1,
						color: [0, 0, 0, 1]
					}),
					fill: new ol.style.Fill({
						color: [127, 166, 59, 0.3]
					})
				})
			});

			// Assuming that you have a map instance, add the created layer to the map
			map.addLayer(layer);
			
			if ($scope.infoMode) {
				$scope.layerClicked($scope.queryLayer);
			}
			
		});

		// To remove the layer when you start drawing a new dragbox
		dragBox.on('boxstart', (evt) => {
			$scope.selectPoint = undefined;
			//document.getElementById('positionDisplay').style.visibility = "visible";
			map.removeLayer(layer);
			$scope.boxExtent = map.getView().calculateExtent(map.getSize());
			console.log("extent"); console.log($scope.boxExtent);
			console.log(ol.proj.toLonLat([$scope.boxExtent[0], $scope.boxExtent[1]]));
			console.log(ol.proj.toLonLat([$scope.boxExtent[2], $scope.boxExtent[3]]));
		});		

		dragBox.on('boxdrag', (evt) => {
			document.getElementById('positionDisplay').style.visibility = "visible";
		});		
		
		map.addInteraction(dragBox);
		
	});
					
	MapSettings.initializeMap();//.then( function() {

	$scope.center = MapSettings.data.center;
	$scope.groups = MapSettings.data.groups;
	$scope.layers = MapSettings.data.layers;
	//$scope.showAll = MapSettings.data.showAll;
	$scope.data = MapSettings.data; //Need this for showAll

	$scope.defaults = {
		interactions: {
			mouseWheelZoom: true
		},
		controls: {
			zoom: true,
			rotate: false,
			attribution: false
		},
		view: {
			//Swagged coords for a bounding box around AZ
			//Extent units must be in EPSG:3857 I think. So I used this page to convert: https://epsg.io/transform#s_srs=4326&t_srs=3857&x=-108.8774390&y=36.7459890
			extent: [-12788071.07, 3664032.74, -12132192.78, 4449227.64],
			minZoom: 7
		}
	};
		
	//scaleline does not work when added via the defaults above. Instead, we must create this object then use it with ol-control in the html
	$scope.controls = [
			{ name: 'scaleline', active: true }
	]
	
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

		/**
		let filter;
		if ($scope.selectPoint != undefined) {
			filter = ol.format.ogc.filter.intersects(paramStub.geometryName, new ol.geom.Point($scope.selectPoint), 'urn:ogc:def:crs:EPSG::3857')
		} else {
			filter = ol.format.ogc.filter.bbox(paramStub.geometryName, $scope.boxExtent, 'urn:ogc:def:crs:EPSG::3857')
		}
		**/
		let featureRequest = new ol.format.WFS().writeGetFeature({
			srsName: 'EPSG:3857',
			featureNS: paramStub.featureNamespace,
			featurePrefix: paramStub.featurePrefix,
			featureTypes: [featureType], 
			outputFormat: 'application/json',
			//ogc is not in most of the examples and docs online, but is necessary (https://github.com/openlayers/openlayers/pull/5653)
			filter: ol.format.ogc.filter.bbox(paramStub.geometryName, $scope.boxExtent, 'urn:ogc:def:crs:EPSG::3857')
			//filter: filter
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
					$scope.queryResults[index] = JSON.stringify(feature.properties, null, 4);
					console.log($scope.queryResults[index]);
				});
	
				$scope.$apply();
	
				//TODO: see if this works for feature display
				/**
				var features = new ol.format.GeoJSON().readFeatures(json);
				vectorSource.addFeatures(features);
				map.getView().fit(vectorSource.getExtent());
				**/
			});
		} else {
			let noData = {noData:"Layer cannot be queried"};
			$scope.queryResults[0] = JSON.stringify(noData, null, 4);//"Layer cannot be queried";
		}

	});
	
	$scope.layerClicked = function(layerName) {
		console.log("layer clicked = " + layerName);
		$scope.queryLayer = layerName;
		$scope.queryResults = [];
		let layer = $scope.layers.find(l => {return l.name === layerName;});
		if (layer != null) {
			console.log(layer);
			//Disabling this for now
			//queryFeatures(layer); 
		}
	}

	$scope.infoClicked = function() {
		console.log("info clicked");
		if (!$scope.infoMode) {
			if ($scope.boxExtent == undefined) {
				olData.getMap().then(map => {
					$scope.boxExtent = map.getView().calculateExtent(map.getSize());
					console.log("extent"); console.log($scope.boxExtent);
					console.log(ol.proj.toLonLat([$scope.boxExtent[0], $scope.boxExtent[1]]));
					console.log(ol.proj.toLonLat([$scope.boxExtent[2], $scope.boxExtent[3]]));
				});
			}

			console.log("groups[0].name = " + $scope.groups[0].name);
			for (x = 0; x < $scope.layers.length; x++) {
				console.log("layers.group = " + $scope.layers[x].group);
				if ($scope.layers[x].group === $scope.groups[1].name) { //assumes first group is always base maps
					$scope.queryLayer = $scope.layers[x].name;
					break;
				}
			}
			$scope.infoMode = true;
		} else {
			$scope.infoMode = false;
			$scope.selectedIndex = 0;
			$scope.queryLayer = undefined;
		}
	}
	
	$scope.infoMode = false;
	$scope.queryLayer = undefined;
	$scope.queryResults = [];
	$scope.selectedIndex = 0;
	
	/**
	//TODO: This change detection isn't working correctly. Might be worth another look at some point.
	$scope.$watch(function(){return MapSettings.data;}, 
	function(newVal, oldVal){
		if (newVal == oldVal) {
			console.log("center changed but initializing");
		} else {
			console.log("center change detected");
			ProjectSettings.data.changed++;
		}
	},
	true);
	
	ProjectSettings.data.changed = 0;
	**/
	
});