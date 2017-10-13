'use strict';

angular.module('MapToolsService', ['APIService', 'SettingsService', 'ngMessages'])
	.factory('MapTools', function($rootScope, $mdToast, $mdDialog, $q, MapSettings, LayersTabSettings, APP_CONFIG, InfoTool, OtherInfoTool, SearchTool) {
		console.log("MapTools init enter");
		
		let data = {
			infoMode: false,
			otherInfoMode: false,
			polyMode: false,
			bboxMode: false
		}

		let showToast = function(message) {
			$mdToast.show(
				$mdToast.simple()
					.textContent(message)
					.hideDelay(3000)
			);
		};
		
		let homeExtent = function() {
			MapSettings.data.center.lat = APP_CONFIG.initialLat;
			MapSettings.data.center.lon = APP_CONFIG.initialLon;
			MapSettings.data.center.zoom = APP_CONFIG.initialZoom;
			MapSettings.data.view.rotation = 0;
		}
		
		let searchClicked = function(event) {
			SearchTool.showSearchDialog(event);
		}

		let features = new ol.Collection();
		let featureOverlay = new ol.layer.Vector({
			source: new ol.source.Vector({features: features}),
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: '#ffcc33',
					width: 2
				}),
				image: new ol.style.Circle({
					radius: 7,
					fill: new ol.style.Fill({
						color: '#ffcc33'
					})
				})
			})
		});

		
		let infoClicked = function() {
			console.log("info clicked");
			data.infoMode = !data.infoMode;
			if (data.infoMode) {
				data.polyMode = false;
				data.bboxMode = false;
				data.otherInfoMode = false;
				clearPolyInteraction();
				clearBboxInteraction();
				OtherInfoTool.clearInteraction();
				InfoTool.addInteraction();
			} else {
				InfoTool.clearInteraction();		
			}
		}
		
		let layerClicked = InfoTool.layerClicked;
		
		let otherInfoClicked = function() {
			console.log("otherinfo clicked");
			data.otherInfoMode = !data.otherInfoMode;
			if (data.otherInfoMode) {
				data.polyMode = false;
				data.bboxMode = false;
				data.infoMode = false;
				clearPolyInteraction();
				clearBboxInteraction();
				InfoTool.clearInteraction();
				OtherInfoTool.addInteraction();
			} else {
				OtherInfoTool.clearInteraction();		
			}
		}
		
		
		let bboxClicked = function() {
			data.bboxMode = !data.bboxMode;
			if (data.bboxMode) {
				data.polyMode = false;
				data.infoMode = false;		
				data.otherInfoMode = false;		
				clearPolyInteraction();
				InfoTool.clearInteraction();
				OtherInfoTool.clearInteraction();
				addBboxInteraction();
			} else {
				//MapSettings.data.theMap.removeInteraction(dragBox);
				clearBboxInteraction();
			}
		}
	
		let dragBox;
		let layer;

		let addBboxInteraction = function() {
			console.log("add bbox interaction");
			if (MapSettings.data.theMap === undefined) {
				console.log("no map!");
				return;
			}

			if (MapSettings.data.aoi != undefined) {
				features.push(new ol.Feature(MapSettings.data.aoi));
			}
			featureOverlay.setMap(MapSettings.data.theMap);
	
			if (!dragBox) {
				dragBox = new ol.interaction.DragBox({
					//condition: ol.events.condition.shiftKeyOnly,
					className: 'myDragBox'
				});
				dragBox.on('boxend', function(evt) {
					console.log("boxend");
					document.getElementById('positionDisplay').style.visibility = "hidden";
					
					MapSettings.data.aoi = dragBox.getGeometry();	
					$rootScope.$apply();//I have no idea why, but this is necessary to get the watcher to fire. I think it has to do with the fact that aoi is never attached to a scope. 
					
					features.push(new ol.Feature(MapSettings.data.aoi));
					//featureOverlay.setMap(MapSettings.data.theMap);	
				});

				// To remove the layer when start drawing a new dragbox
				dragBox.on('boxstart', function(evt) {
					features.clear();
					//featureOverlay.setMap(null);
					MapSettings.data.aoi = undefined;
				});		

				dragBox.on('boxdrag', function(evt) {
					document.getElementById('positionDisplay').style.visibility = "visible";
				});		
			}
			
			MapSettings.data.theMap.addInteraction(dragBox);
			MapSettings.data.selectedTabIndex = 2;
		}
		
		let clearBboxInteraction = function() {
			console.log("clearBboxInteraction");
			data.bboxMode = false;
			if (MapSettings.data.theMap === undefined) {
				console.log("clearBboxInteraction, no map");
				return;
			}
			features.clear();
			featureOverlay.setMap(null);
			MapSettings.data.theMap.removeInteraction(dragBox);		
			MapSettings.data.selectedTabIndex = 0;
		}

		let polyClicked = function() {
			data.polyMode = !data.polyMode;
			if (data.polyMode) {
				data.bboxMode = false;
				data.infoMode = false;		
				data.otherInfoMode = false;		
				clearBboxInteraction();
				InfoTool.clearInteraction();
				OtherInfoTool.clearInteraction();
				addPolyInteraction();		
			} else {
				//MapSettings.data.theMap.removeInteraction(draw);		
				//MapSettings.data.theMap.removeInteraction(modify);		
				clearPolyInteraction();
			}
		}
		
		let modify = new ol.interaction.Modify({
			features: features,
		});
		
		modify.on('changed', function(evt) {
			console.log("changed");
			MapSettings.data.aoi = evt.feature.getGeometry();
		});
		
			
		let draw = new ol.interaction.Draw({
			features: features,
			type: "Polygon"
		}); 
		
		draw.on('drawstart', function(evt) {
			console.log("drawstart");
			MapSettings.data.aoi = undefined;
			features.clear();
		});

		draw.on('drawend', function(evt) {
			console.log("drawend");
			MapSettings.data.aoi = evt.feature.getGeometry();
			$rootScope.$apply();//I have no idea why, but this is necessary to get the watcher to fire. I think it has to do with the fact that aoi is never attached to a scope. 
		});
		
		let addPolyInteraction = function() {
			if (MapSettings.data.theMap === undefined) {
				return;
			}
			
			if (MapSettings.data.aoi != undefined) {
				features.push(new ol.Feature(MapSettings.data.aoi));
			}
			featureOverlay.setMap(MapSettings.data.theMap);
			MapSettings.data.theMap.addInteraction(modify);
			MapSettings.data.theMap.addInteraction(draw);
			MapSettings.data.selectedTabIndex = 2;
		}
		
		let clearPolyInteraction = function() {
			console.log("clearPolyInteraction");
			data.polyMode = false;
			if (MapSettings.data.theMap === undefined) {
				return;
			}
			
			features.clear();
			featureOverlay.setMap(null);
			MapSettings.data.theMap.removeInteraction(modify);
			MapSettings.data.theMap.removeInteraction(draw);
			MapSettings.data.selectedTabIndex = 0;
		}
		

		$rootScope.$on('initializingMap', function(event, data) {
			console.log('received initializingMap');
			InfoTool.clearInteraction();
			clearBboxInteraction();
			clearPolyInteraction();
		})

		$rootScope.$on('mapInitialized', function(event, data) {
			console.log('received mapInitialized');
			if (MapSettings.data.aoi != undefined) {
				features.push(new ol.Feature(MapSettings.data.aoi));
				featureOverlay.setMap(MapSettings.data.theMap);
			}
		});
		
		

		return {
			data: data,
			homeExtent: homeExtent,
			infoClicked: infoClicked,
			otherInfoClicked: otherInfoClicked,
			layerClicked: layerClicked,
			bboxClicked: bboxClicked,
			polyClicked: polyClicked,
			searchClicked: searchClicked
		}
		
	});
