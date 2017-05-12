angular.module('MapController', ['APIService', 'SettingsService'])

.controller('MapController', function MapController($scope, $rootScope, $mdDialog, $http, olData, Layers, LayerGroups, MapSettings, APP_CONFIG, ProjectSettings, LayersTabSettings) {
	function print_call_stack() {
		var stack = new Error().stack;
		console.log("PRINTING CALL STACK");
		console.log( stack );
	}	
	
	olData.getMap().then(map => {
		
		/**
		//Just playing with geometry here
		let geom = new ol.geom.Polygon.fromExtent([-5, -6, 5, 6]);
		console.log('geom = ');
		console.log(geom);
		let geom_GeoJSON = new ol.format.GeoJSON().writeGeometry(geom);
		console.log(geom_GeoJSON);
		let geomx = new ol.format.GeoJSON().readGeometry(geom_GeoJSON);
		console.log('geomx = ');
		console.log(geomx);
		console.log(geomx.getExtent());
		**/
		
		$scope.data.aoi = undefined;
		
		let mousePosition = new ol.control.MousePosition({
			coordinateFormat: ol.coordinate.createStringXY(2),
			projection: 'EPSG:4326',
			className: 'ol-scale-line-inner',
			target: document.getElementById('positionDisplay'),
			undefinedHTML: '&nbsp;'
		});

		map.addControl(mousePosition);

		let scaleLine = new ol.control.ScaleLine({ 
			units: 'us'
		});
		map.addControl(scaleLine);
		
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
			//$scope.data.aoi = dragBox.getGeometry().getExtent();
			$scope.data.aoi = dragBox.getGeometry();
			console.log("$scope.data.aoi"); console.log($scope.data.aoi);
			
			//let polygonFeature = new ol.Feature(new ol.geom.Polygon.fromExtent($scope.data.aoi));
			let polygonFeature = new ol.Feature($scope.data.aoi);
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
			map.addLayer(layer);
			
			if ($scope.infoMode) {
				//$scope.layerClicked($scope.queryLayer);
				$rootScope.$emit('AOIchanged');
			}
			
		});

		// To remove the layer when you start drawing a new dragbox
		dragBox.on('boxstart', (evt) => {
			$scope.selectPoint = undefined;
			map.removeLayer(layer);
			$scope.data.aoi = undefined;
		});		

		dragBox.on('boxdrag', (evt) => {
			document.getElementById('positionDisplay').style.visibility = "visible";
		});		
		
		map.addInteraction(dragBox);
		
		$scope.$on('initializingMap', function(event, data) {
			console.log('received initializingMap');
			map.removeLayer(layer);
		})

		$scope.$on('mapInitialized', function(event, data) {
			console.log('received mapInitialized');
			if ($scope.data.aoi != undefined) {
				console.log("adding layer");
				console.log($scope.data.aoi);
				let polygonFeature = new ol.Feature($scope.data.aoi);
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
				map.addLayer(layer);
			}
		})
		
		
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
			//{ name: 'scaleline', active: true}
	]
		
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

			//TODO: Showing first group is kinda dumb I think
			console.log("groups[0].name = " + $scope.groups[0].name);
			for (x = 0; x < $scope.layers.length; x++) {
				console.log("layers.group = " + $scope.layers[x].group);
				if ($scope.layers[x].group === $scope.groups[1].name) { //assumes first group is always base maps
					LayersTabSettings.data.queryLayer = $scope.layers[x].name;
					break;
				}
			}
			$scope.infoMode = true;
		} else {
			$scope.infoMode = false;
			$scope.selectedIndex = 0;
			LayersTabSettings.data.queryLayer = undefined;
		}
	}
	
	$scope.infoMode = false;
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