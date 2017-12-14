'use strict';

angular.module('MapToolsService')
	.factory('OtherInfoTool', function($rootScope, $mdDialog, $q, MapSettings, LayersTabSettings, WFSProxy) {
		console.log("OtherInfoTool init enter");

		let data = {
			active: false, //TODO: Not fully used outside of this file. I'm thinking it should replace the mode booleans in MapTools.
			showProgressSpinner: false,
			result: null,
			selectedIndex: -1,
			features: null,
			keys: null,
			valuesList: null
		}

		const myHomeTab = 3; //Results tab
		
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

		let visibilityUnregListener = null;
		
		let selectPoint = null;
		let infoEventHandler = function(event) {
			console.log("single click received");
			console.log(event);
			
			MapSettings.data.selectedTabIndex = myHomeTab;
			
			features2.clear();
			//let selectPoint = event.coordinate;
			if (event) {
				selectPoint = event.coordinate;
			}
			console.log("selectPoint = "); console.log(selectPoint);
			if (selectPoint !== null) {
				markers.clear();
				markers.push(new ol.Feature({geometry: new ol.geom.Point(selectPoint)}));
				if (data.active) {
					data.result = null;
					data.showProgressSpinner = true;
					data.selectedIndex = -1;
					data.features = null;
					data.keys = null;
					data.valuesList = null;
					if (event) { //This chokes if we are updating due to a layer visibility change
						$rootScope.$apply();
					}
					getLayersAtCoord(selectPoint).then(function(result) { 
						console.log("Done!");console.log(result)
						if (result) {
							data.showProgressSpinner = false;
							data.result = result;
						}
					});
					
				}		
			}
		}		
		
		let addInteraction = function() {
			data.active = true;
			featureOverlay2.setMap(MapSettings.data.theMap);
			markersOverlay.setMap(MapSettings.data.theMap);
			MapSettings.data.theMap.on('singleclick', infoEventHandler);
			MapSettings.data.showResultsTab = true;
			MapSettings.data.selectedTabIndex = myHomeTab;
			visibilityUnregListener = $rootScope.$on('visibilityChanged', function(event, data) {
				console.log('received visibilityChanged');
				infoEventHandler();
			});
		}
		
		let clearInteraction = function() {
			console.log("clearInfoInteraction");
			data.active = false;
			if (MapSettings.data.theMap === undefined) {
				console.log("clearInfoInteraction, no map");
				return;
			}
			
			data.result = null;
			data.showProgressSpinner = false;
			data.selectedIndex = -1;
			data.features = null;
			data.keys = null;
			data.valuesList = null;
			
			features2.clear();
			featureOverlay2.setMap(null);
			markers.clear();
			markersOverlay.setMap(null);
			MapSettings.data.theMap.un('singleclick', infoEventHandler);		
			MapSettings.data.showResultsTab = false;
			MapSettings.data.selectedTabIndex = 0; //Layers tab
			
			if (visibilityUnregListener !== null) visibilityUnregListener();
			visibilityUnregListener = null;
		}
		
		let layerClicked = function(index) {
			console.log("layer clicked, index = " + index);
			data.selectedIndex = index;
			data.features = data.result[index].featuresAtCoord;
			data.keys = Object.keys(data.features[0].properties);
			data.valuesList = [];
			data.features.forEach(function(r) {
				let values;
				//Yes, I am being obstinate in including this use of Object.values when the old stuff will work in all browsers. That's me: obstinate.
				if (Object.values) {
					values = Object.values(r.properties);
				} else { //IE
					values = [];
					Object.keys(data.features[0].properties).forEach(function(key) {values.push(r.properties[key])});
				}
				data.valuesList.push(values);
			});
			console.log("features -- "); console.log(data.features);
			console.log("keys"); console.log(data.keys);
			console.log("valuesList"); console.log(data.valuesList);
			
			//TODO: add features to map
			/***/
			features2.clear();
			let features = [];
			try {
				//features = new ol.format.GeoJSON().readFeatures(data.features);
				//features.push(new ol.format.GeoJSON().readFeature(data.features[0]));
				features = data.features.map(function(feature) {
					return new ol.format.GeoJSON().readFeature(feature);
				}, []);
				console.log("features");console.log(features);
			} catch(err) {
				console.log(err);
			}
			if (features.length > 0) {
				features2.addFeatures(features);
			}
			/***/
			
		}					

		let getLayersAtCoord = (function(thePoint) {
			return $q(function(resolve, reject) {

				//Set buffer appropriate to zoom level
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
				
				//Create list of feature sources (unique wfs servers) for layers that are currently visible, with their featureTypes and layers
				//TODO: This could be moved to separate routine
				let featureSources = MapSettings.data.layers.reduce(function(sources, layer) {
					console.log("processing layer " + layer.name);
					console.log("source url = " + layer.source.url);
					if (layer.visible && 
						layer.source.wfs.url) {
						const layerShadow = {"name": layer.name, "source": layer.source};
						const key = layer.source.wfs.url + "-" + layer.source.wfs.feature_namespace + "-" + layer.source.wfs.feature_prefix;
						console.log("key = " + key);
						let featureType = layer.source.params.LAYERS;
						if (featureType != undefined) {
							let split = featureType.split(":");
							featureType = split.length == 1 ? featureType : split[1];
						}
						console.log("featureType = " + featureType);

						if (sources[key]) {
							console.log("adding to existing source " + key + " with layer.name " + layer.name + " and featureType " + featureType);
							sources[key].featureTypes.push(featureType);
							sources[key].layers.push(layerShadow);
						} else {
							console.log("adding new source " + key + " with layer.name " + layer.name + " and featureType " + featureType);
							//sources = [];
							sources[key] = {"featureTypes":[featureType], "layers":[layerShadow]};
						}
					}
					//console.log("sources = "); console.log(sources);
					return sources;
				}, []);		
				
				console.log("featureSources = ");console.log(featureSources);
				
				let featureSourcePromises = Object.keys(featureSources).map(function(key, index, array) {
					return $q(function(resolve, reject) {					
						const featureSource = featureSources[key];
						console.log("processing featureSource "); console.log(featureSource);

						//TODO: Building request and fetching it could be in separate routine
						let featureRequest = new ol.format.WFS().writeGetFeature({
							srsName: 'EPSG:3857',
							featureNS: featureSource.layers[0].source.wfs.feature_namespace, 
							featurePrefix: featureSource.layers[0].source.wfs.feature_prefix, 
							featureTypes: featureSource.featureTypes,
							outputFormat: 'application/json',
							//Need to add the following filter, but it doesn't exist in the version of OpenLayers (3.16.0) loaded by the bower install of angular-openlayers-directive.
							//filter: ol.format.ogc.filter.intersects(paramStub.geometryName, new ol.geom.Point(thePoint), 'urn:ogc:def:crs:EPSG::3857')
							filter: ol.format.ogc.filter.bbox(featureSource.layers[0].source.wfs.geometry_name, [thePoint[0]-buffer, thePoint[1]-buffer, thePoint[0]+buffer, thePoint[1]+buffer], 'urn:ogc:def:crs:EPSG::3857')
						});
						console.log("featureRequest = ");
						console.log(featureRequest);

						//make sure its good to go
						featureRequest = featureRequest.hasChildNodes() ? featureRequest : undefined;
									
						if (featureRequest != undefined && featureSource.layers[0].source.wfs.url != undefined) {
							//TODO: if url is ameup geoserver, change to server api url (could possibly be done in proxy)
							//if (featureSource.layers[0].source.wfs.url.includes('http://ameup.usgin.org:8080/geoserver/wfs')) {
							//if (featureSource.layers[0].source.wfs.url.indexOf('http://ameup.usgin.org:8080/geoserver/wfs') !== -1) {
							if (featureSource.layers[0].source.wfs.url.indexOf('http://ameup.usgin.org') !== -1) {
								let wfsResults = WFSProxy.xmlQuery({xmlBody: new XMLSerializer().serializeToString(featureRequest)});
								wfsResults.$promise.then( function() {
									console.log("wfsResults = ");console.log(wfsResults);
									if (wfsResults.features.length > 0) {
										featureSource.layers = processWFSResult(wfsResults, featureSource); 
									} else {
										featureSource.layers = null;
									}
									resolve();
								}).catch(function(err) {
									featureSource.layers = null;
									resolve();
								});
							} else {
								try {
									//Try fetch first (not available in IE)
									//Yes, I am being obstinate in including this code when the old stuff will work in all browsers. That's me: obstinate.
									fetch('/proxy/' + featureSource.layers[0].source.wfs.url, {
										method: 'POST',
										body: new XMLSerializer().serializeToString(featureRequest) //TODO: this is the one I'd use if I didn't have to hack the filter as above
										//body: queryString //For use with the xml hack above
									}).then(function(response) {
										console.log(response);
										return response.json();
									}).then(function(result) {
										console.log(result);
										if (result.features.length > 0) {
											featureSource.layers = processWFSResult(result, featureSource); 
										} else {
											featureSource.layers = null;
										}
										resolve();
									}).catch(function(err) {
										featureSource.layers = null;
										resolve();
									})
								} catch(err) { //If fetch is not available, this is IE
									let request = new XMLHttpRequest();
									request.onload = function() {
										let result = JSON.parse(this.responseText);
										console.log(result);
										if (result.features.length > 0) {
											featureSource.layers = processWFSResult(result, featureSource);
										} else {
											featureSource.layers = null;
										}	
										resolve();
									};
									request.onerror = function(err) {
										console.log("server problem:"); console.log(err);
										featureSource.layers = null;
										resolve();
									};
									request.open('POST', '/proxy/' + layer.source.wfs.url, true);
									request.send(new XMLSerializer().serializeToString(featureRequest));
								}
							}
						
						}
					});
				});
				
				$q.all(featureSourcePromises).then(function() {
					console.log(featureSources);
					console.log(Object.keys(featureSources));
					let layersWithFeatures = Object.keys(featureSources).reduce(function(layers, key) {
						let featureSource = featureSources[key];
						console.log("featureSource = " + featureSource);
						let newLayers = featureSource.layers === null ? [] : featureSource.layers.filter(function(layer, index, array) {
							console.log("layer.name = " + layer.name);
							return layer.featuresAtCoord;
						});
						
						Array.prototype.push.apply(layers, newLayers);
						
						return layers;
					}, []);
					console.log("layersWithFeatures"); console.log(layersWithFeatures);
					resolve(layersWithFeatures);
				});

			});
		});
		
		let processWFSResult = function(result, featureSource) {		
			result.features.forEach(function(feature) {
				let layerName = feature.id.split('.')[0];
				console.log("layerName = " + layerName);
				featureSource.layers = featureSource.layers.map(function(layer, index, array) {
					let featureType = layer.source.params.LAYERS;
					if (featureType != undefined) {
						let split = featureType.split(":");
						featureType = split.length == 1 ? featureType : split[1];
					}
					if (featureType === layerName) {
						if (layer.featuresAtCoord) {
							layer.featuresAtCoord.push(feature);
						} else {
							layer.featuresAtCoord = [feature];
						}
					}
					return layer;
				});
				
			});
			
			
			const returnLayersCollection = featureSource.layers.filter(function(layer) {
				return layer.featuresAtCoord
			});
			
			console.log("returnLayersCollection = "); console.log(returnLayersCollection);
			return returnLayersCollection;
		}
		
		
		return {
			data: data,
			addInteraction: addInteraction,
			clearInteraction: clearInteraction,
			layerClicked: layerClicked,
			getLayersAtCoord: getLayersAtCoord
		}
		
	});
