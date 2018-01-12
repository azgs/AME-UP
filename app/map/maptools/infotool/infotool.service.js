'use strict';

angular.module('MapToolsService')
	.factory('InfoTool', function($rootScope, $mdDialog, $q, MapSettings, LayersTabSettings) {
		console.log("InfoTool init enter");

		let data = {
			active: false //TODO: Not fully used outside of this file. I'm thinking it should replace the mode booleans in MapTools.
		}

		//TODO: Had to abandon use of ol.Collection because it has performance issues on clear(). This is probably a better way to go anyhow. But, it conflicts with my use of features in the bbox and poly tools. For now, I'm fixing the obvious problem. Look into making this consistent throughout.
		let features2 = new ol.source.Vector();
		let featureOverlay2 = new ol.layer.Vector({
			source: features2,
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
		
		let markers = new ol.Collection();
		let markersOverlay = new ol.layer.Vector({
			source: new ol.source.Vector({features: markers}),
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
						color: '#ff0000'//'#ffcc33'
					})
				})
			})
		});
		
		$rootScope.$on('queryLayerHidden', function(event, data) {
			console.log('received queryLayerHidden');
			features2.clear();
		});

		let infoEventHandler = function(event) {
			console.log("single click received");
			console.log(event);
			let selectPoint = event.coordinate;
			console.log("selectPoint = "); console.log(selectPoint);
			markers.clear();
			markers.push(new ol.Feature({geometry: new ol.geom.Point(selectPoint)}));
			if (data.active) {
				//let layer = MapSettings.data.layers.find(l => {return l.name === LayersTabSettings.data.queryLayer;});
				//Yes, I am being obstinate in including this use of find when the old stuff will work in all browsers. That's me: obstinate.
				let layer;
				if (MapSettings.data.layers.find) {
					layer = MapSettings.data.layers.find(function(l) {return l.name === LayersTabSettings.data.queryLayer;});
				} else { //IE
					for (let x = 0; x < MapSettings.data.layers.length; x++) {
						if (MapSettings.data.layers[x].name === LayersTabSettings.data.queryLayer) {
							layer = MapSettings.data.layers[x];
							break;
						}
					}
				}
				showInfoDialog(layer, selectPoint, event.originalEvent);
			}				
		}		
		
		let addInteraction = function() {
			data.active = true;
			clearQueryLayerWhenDone = false;
			featureOverlay2.setMap(MapSettings.data.theMap);
			markersOverlay.setMap(MapSettings.data.theMap);
			MapSettings.data.theMap.on('singleclick', infoEventHandler);
		}
		
		let clearInteraction = function() {
			console.log("clearInfoInteraction");
			data.active = false;
			if (MapSettings.data.theMap === undefined) {
				console.log("clearInfoInteraction, no map");
				return;
			}
			
			if (clearQueryLayerWhenDone) {
				MapSettings.data.layers.some(function(layer) {
					if (layer.name === LayersTabSettings.data.queryLayer) {
						layer.visible = false;
					}
				});
				clearQueryLayerWhenDone = false;
			}
			
			features2.clear();
			featureOverlay2.setMap(null);
			markers.clear();
			markersOverlay.setMap(null);
			MapSettings.data.theMap.un('singleclick', infoEventHandler);		
		}
		
		let clearQueryLayerWhenDone = false;
		let layerClicked = function(layerName) {
			console.log("layer clicked = " + layerName);
			
			//first clear old layer from map if it wasn't active before
			if (clearQueryLayerWhenDone) {
				MapSettings.data.layers.some(function(layer) {
					if (layer.name === LayersTabSettings.data.queryLayer) {
						layer.visible = false;
					}
				});
				clearQueryLayerWhenDone = false;
			}
						
			MapSettings.data.layers.some(function(layer) {
				if (layer.name === layerName) {
					clearQueryLayerWhenDone = !layer.visible; //If layer is not initially visible then we should clear it when done					
					layer.visible = true;
					MapSettings.layerActiveChange(layer);
					LayersTabSettings.data.queryLayer = layerName;
					if (markers.getLength() > 0) {
						showInfoDialog(layer, markers.item(0).getGeometry().getFirstCoordinate());
					}
				}
			});
		}		
		
		let showInfoDialog = function(layer, selectPoint, event) {
			console.log("show info dialog");
			
			let parent = angular.element(document.querySelector('#mapContent'));
			console.log("parent");console.log(parent);
			
			let alert;
			if (layer == null) {
				alert = $mdDialog.alert({
					parent: parent,
					title: "",
					textContent: "Select layers to query by clicking the layer name in the Layers tab. Results will appear here. You do not need to close this dialog to select layers.",
					targetEvent: event,
					ok: 'OK'
				});
			} else {
				alert = $mdDialog.alert({
					parent: parent,
					title: layer.name,
					locals: { layer: layer, thePoint: selectPoint },
					controller: DialogController,
					templateUrl: 'map/maptools/infotool/results_dialog.html',
					targetEvent: event,
					ok: 'Done'
				});

				function DialogController($scope, $mdDialog, layer, thePoint) {
					console.log("dialog enter");
					$scope.alternateLayout = false;
					$scope.title = layer.name;
					let query = queryFeatures(layer, thePoint).then(function(result) {
						console.log("result =");console.log(result);
						if (result) {
							$scope.result = result;
							$scope.keys = Object.keys(result[0]);
							$scope.valuesList = [];
							result.forEach(function(r) {
								let values;
								//Yes, I am being obstinate in including this use of Object.values when the old stuff will work in all browsers. That's me: obstinate.
								if (Object.values) {
									values = Object.values(r);
								} else { //IE
									values = [];
									Object.keys(result).forEach(function(key) {values.push(r[key])});
								}
								$scope.valuesList.push(values);
							});
							console.log("keys"); console.log($scope.keys);
							console.log("valuesList"); console.log($scope.valuesList);
						}
					});
					
					$scope.closeDialog = function() {
						$mdDialog.hide();
					}
				}
			}

			$mdDialog
				.show( alert )
				.catch(function() {}) //swallows reject error when we programmatically open new dialog over old
				.finally(function() {
					alert = undefined;
				});
			
		}
					
		let queryFeatures = (function(layer, thePoint) {
			return $q(function(resolve, reject) {	
			
				let featureType = layer.source.params.LAYERS;
				if (featureType != undefined) {
					let split = featureType.split(":");
					featureType = split.length == 1 ? featureType : split[1];
				}
				console.log("featureType = " + featureType);

				console.log("zoom level = " + MapSettings.data.theMap.getView().getZoom());
				let buffer;
				switch (MapSettings.data.theMap.getView().getZoom()) {
					case 7: {
						buffer = 10000;
						break;
					}
					case 8: {
						buffer = 5000;
						break;
					}
					case 9: {
						buffer = 1000;
						break;
					} 
					case 10: {
						buffer = 700;
						break;
					}
					default: {
						buffer = 500;
						break;
					}
				}
				 
				let featureRequest = new ol.format.WFS().writeGetFeature({
					srsName: 'EPSG:3857',
					featureNS: layer.source.wfs.feature_namespace, 
					featurePrefix: layer.source.wfs.feature_prefix, 
					featureTypes: [featureType], 
					outputFormat: 'application/json',
					//Need to add the following filter, but it doesn't exist in the version of OpenLayers (3.16.0) loaded by the bower install of angular-openlayers-directive.
					//filter: ol.format.ogc.filter.intersects(paramStub.geometryName, new ol.geom.Point(thePoint), 'urn:ogc:def:crs:EPSG::3857')
					filter: ol.format.ogc.filter.bbox(layer.source.wfs.geometry_name, [thePoint[0]-buffer, thePoint[1]-buffer, thePoint[0]+buffer, thePoint[1]+buffer], 'urn:ogc:def:crs:EPSG::3857')
				});
					
				console.log("featureRequest = ");
				console.log(featureRequest);
							
				//make sure its good to go
				featureRequest = featureRequest.hasChildNodes() ? featureRequest : undefined;
							
				if (featureRequest != undefined && layer.source.wfs.url != undefined) {
					let body;
					
					// then post the request and add the received features to a layer
					try {
						//Try fetch first (not available in IE)
						//Yes, I am being obstinate in including this code when the old stuff will work in all browsers. That's me: obstinate.
						fetch('/proxy/' + layer.source.wfs.url, {
							method: 'POST',
							body: new XMLSerializer().serializeToString(featureRequest) 
							//body: queryString //For use with the xml hack above
						}).then(function(response) {
							console.log(response);
							return response.json();
						}).then(function(result) {
							console.log(result);
				
							features2.clear();
							let features;
							try {
								features = new ol.format.GeoJSON().readFeatures(result);
								console.log("features");console.log(features);
							} catch(err) {
								console.log(err);
							}
							if (features.length > 0) {
								features2.addFeatures(features);
								body = [];
								result.features.forEach(function(feature) {
									body.push(feature.properties);
								});
							} else {
								body = {noData: "There is no feature in that location"};
							}	
							
						}).catch(function(err) {
							console.log("server problem:"); console.log(err);
							body = {noData: "There was a problem communicating with the server"};
						}).then(function(stuff) {
							resolve(body);
						});
					} catch(err) { //If fetch is not available, this is IE
						let request = new XMLHttpRequest();
						request.onload = function() {
							let result = JSON.parse(this.responseText);
							console.log(result);
							features2.clear();
							let feature;
							try {
								feature = new ol.format.GeoJSON().readFeatures(result)[0];
							} catch(err) {
								console.log(err);
							}
							if (feature !== undefined) {
								features2.addFeature(feature);
								body = result.features[0].properties;
							} else {
								body = {noData: "There is no feature in that location"};
							}
							resolve(body);
						};
						request.onerror = function(err) {
							console.log("server problem:"); console.log(err);
							body = {noData: "There was a problem communicating with the server"};
							resolve(body);
							
						};
						request.open('POST', '/proxy/' + layer.source.wfs.url, true);
						request.send(new XMLSerializer().serializeToString(featureRequest));
					}

				} else {
					console.log("Layer cannot be queried");
					let notQueryable = {noData:"Layer cannot be queried"};
					resolve(notQueryable);
				}	
				
			});
		});

		
		return {
			data: data,
			addInteraction: addInteraction,
			clearInteraction: clearInteraction,
			layerClicked: layerClicked
		}
		
	});
