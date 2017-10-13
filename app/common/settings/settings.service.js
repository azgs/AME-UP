'use strict';

angular.module('SettingsService', ['APIService'])
	.factory('MapSettings', function($http, $rootScope, $q, Layers, LayerGroups, LayersTabSettings, APP_CONFIG) {
		console.log("MapSettings init enter");
		
		let data = {
			center: undefined,
			view: undefined,
			showAll: undefined,
			groups: undefined,
			layers: undefined,
			aoi: undefined, 
			theMap: undefined,
			selectedTabIndex: 0,
			showResultsTab: false

		}
		
		let groupActiveChange = function(group) {
			data.layers.forEach(function(layer) {
				if (layer.group == group.name) {
					layer.visible = group.active;
					checkQueryLayer(layer);
				}
			});
			$rootScope.$broadcast('visibilityChanged', {
				data: ''
			});
		};
			
		let layerActiveChange = function(layer) {
			data.groups.forEach(function(group) {
				if (group.name == layer.group) { // if layer's group is off, turn it on
					group.active = group.active || layer.visible;
					if (group.ordinal == 1 && layer.visible) { //if user just turned on a Base Map layer, turn the others off
						data.layers.forEach(function(thisLayer) {
							if (thisLayer.group === layer.group && thisLayer.name !== layer.name) {
								thisLayer.visible = false;
							}
						});
						
					}
				}
			});
			$rootScope.$broadcast('visibilityChanged', {
				data: ''
			});
			
			checkQueryLayer(layer);
		};
		
		let checkQueryLayer = function(layer) {
			//If layer is not active and it is the selected layer for queries, make it not be
			if (!layer.visible && layer.name === LayersTabSettings.data.queryLayer) {
				LayersTabSettings.data.queryLayer = undefined;
				$rootScope.$broadcast('queryLayerHidden', {
					data: ''
				});
			}
		}

		let toggleShowAllGroups = function() {
			data.showAll = !data.showAll;
		};

		let toggleShowAllLayers = function(group) {
			group.showAll = !group.showAll;
		};
		
		/***
		let getAOIType = function(geometry) {
			//TODO: This is stinky. Should make this explicit in db table and API
			const extent = geometry.getExtent();
			const coords = geometry.getCoordinates();
			if (coords[1][0] === extent[0] && coords[1][1] === extent[1] && coords[3][0] === extent[2] && coords[3][1] === extent[3]) {
				return "bbox";
			} else {
				return "polygon";
			}
		}
		***/
		
		let initializeMap = function (project) {
			return $q(function(resolve, reject) {
				console.log("MapSettings initializeMap enter");

				$rootScope.$broadcast('initializingMap', {
					data: ''
				});
				
				if (data.groups) {
					console.log("resetting groups array");
					data.groups.length = 0;
				} else {
					console.log("creating new groups array");
					data.groups = [];
				}

				if (data.layers) {
					console.log("resetting layers array");
					data.layers.length = 0;
				} else {
					console.log("creating new layers array");
					data.layers = [];
				}
				
				data.center = APP_CONFIG.center;	
				data.view = {
					rotation:0,
					//Swagged coords for a bounding box around AZ
					//Extent units must be in EPSG:3857 I think. So I used this page to convert: https://epsg.io/transform#s_srs=4326&t_srs=3857&x=-108.8774390&y=36.7459890
					extent: [-12788071.07, 3664032.74, -12132192.78, 4449227.64],
					//projection: 'EPSG:4326',			
					//extent: [-114.877197, 31.2405812, -108.985342, 37.072575],
					minZoom: 7
				};
				
				//console.log("resetMap, data.center:");
				//console.log(data.center);
			
				if (project) {
					data.center.lat = project.centerLat;
					data.center.lon = project.centerLon;
					data.center.zoom = project.zoom;
					data.aoi = project.aoi;
					data.showAll = true; //project.showAll;
				} else {
					data.center.lat = APP_CONFIG.initialLat;
					data.center.lon = APP_CONFIG.initialLon;
					data.center.zoom = APP_CONFIG.initialZoom;
					data.aoi = undefined;
					data.showAll = true;
				}
				
				console.log("calling API for groups");
				let remoteGroups = LayerGroups.query(function() {
					console.log("groups call completed");
					console.log(remoteGroups);
					remoteGroups.forEach(function(group) {
						group.active = true;
						group.showAll = data.showAll;
						data.groups.push(group);
					});
					
					if (project) {
						data.groups.forEach(function(group) {group.active = false;}); //set everything to inactive initially
						console.log("loading project");
						project.groups.forEach(function(group) {
							let parsedGroup = JSON.parse(JSON.stringify(group));
							console.log("parsedGroup.name = " + parsedGroup.name);
							//let index = data.groups.findIndex(function(element) {return element.name == parsedGroup.name;});
							//Yes, I am being obstinate in including this code when the old stuff will work in all browsers. That's me: obstinate.
							let index;
							if (data.groups.findIndex) {
								index = data.groups.findIndex(function(element) {return element.name == parsedGroup.name;});
							} else { //IE
								for (let x = 0; x < data.groups.length; x++) {
									if (data.groups[x].name == parsedGroup.name) {
										index = x;
										break;
									}
								}
							}
							console.log("index = " + index + " "); console.log(data.groups[index]);
							if (index > -1) {
								data.groups[index].active = parsedGroup.active;
								data.groups[index].showAll = true; //parsedGroup.showAll;
								data.groups[index].inProject = true;
							}
						});
					}

					
					console.log("calling API for layers");
					let remoteLayers = Layers.query(function() {
						console.log("layers call completed");
						remoteLayers.forEach(function(remoteLayer) {
							//console.log("remoteLayer");console.log(remoteLayer);
							//console.log("remoteLayer.initial_opacity = " + remoteLayer.initial_opacity);
							let layer = {
								name: remoteLayer.name,
								group: remoteLayer.layer_group,
								visible: remoteLayer.is_initially_active,
								opacity: remoteLayer.initial_opacity != undefined ? 
									remoteLayer.initial_opacity : 
									remoteLayer.layer_group === data.groups[0].name ? 1 : 0.5, //Base maps get full opacity, all others get half
								layerType: remoteLayer.layer_type,
								source: {
									type: remoteLayer.source_type,
									url: remoteLayer.source_url,
									legend_url: remoteLayer.legend_url,
									key: remoteLayer.key,
									layer: remoteLayer.layer,
									imagery_set: remoteLayer.imagery_set,
									wfs: {
										feature_namespace: remoteLayer.feature_namespace,
										feature_prefix: remoteLayer.feature_prefix,
										geometry_name: remoteLayer.geometry_name,
										url: remoteLayer.wfs_url
									},
									metadata: remoteLayer.metadata,
								}
							};
							
							layer.source.params = {};
							remoteLayer.params.forEach(function(remoteParam) {
								layer.source.params [remoteParam.name] = remoteParam.value;
							});
							
							if (remoteLayer.is_cors_challenged) {
								layer.source.url = APP_CONFIG.corsProxy + layer.source.url;
								layer.source.legend_url = APP_CONFIG.corsProxy + layer.source.legend_url;
							}

							if (layer.source.type === "TileArcGISRest") {
								$http.get(layer.source.legend_url)
									.then(function success(response){
											layer.legend_json = response.data;
										  },
										  function error(response){
											layer.legend_json = "not available";
										  });
							}

							//console.log("layer:");
							//console.log(layer);
							data.layers.push(layer);
							
						});
						
						if (project) {
							data.layers.forEach(function(layer) {layer.visible = false;}); //set all to inactive initially
							project.layers.forEach(function(layer) {
								let parsedLayer = JSON.parse(JSON.stringify(layer));
								//console.log("parsedLayer.name = " + parsedLayer.name);
								//let index = data.layers.findIndex(function(element) {return element.name == parsedLayer.name;});
								//Yes, I am being obstinate in including this code when the old stuff will work in all browsers. That's me: obstinate.
								let index;
								if (data.groups.findIndex) {
									index = data.layers.findIndex(function(element) {return element.name == parsedLayer.name;});
								} else { //IE
									for (let x = 0; x < data.layers.length; x++) {
										if (data.layers[x].name == parsedLayer.name) {
											index = x;
											break;
										}
									}
								}
								//console.log("index = " + index + " "); console.log(data.layers[index]);
								if (index > -1) {
									data.layers[index].visible = (parsedLayer.visible == undefined) ? parsedLayer.active : parsedLayer.visible;
									data.layers[index].opacity = parsedLayer.opacity;
									data.layers[index].inProject = true;
								}
							});
						}	
											
						console.log("broadcasting mapInitialized");
						$rootScope.$broadcast('mapInitialized', {
							data: ''
						});
						resolve();

					});
					
				});	
			});
			
		}
					
		return {
			data: data,
			initializeMap: initializeMap,
			groupActiveChange: groupActiveChange,
			layerActiveChange: layerActiveChange,
			toggleShowAllGroups: toggleShowAllGroups,
			toggleShowAllLayers: toggleShowAllLayers
		}
	})
	.factory('ProjectSettings', function($http, $q, Projects, MapSettings, APP_CONFIG, Auth) {
		console.log("ProjectSettings init enter");

		let data = {
			//currentProjectID: undefined,
			currentProject: undefined,
			projects: undefined,
		}
		
		const fetchProjects = function() {
			console.log("fetchProjects, enter");
			return $q(function(resolve, reject) {
				if (data.projects) {
					data.projects.length = 0;
				} else {
					data.projects = [];
				}
				let remoteProjects = Projects.query(function() {
					//console.log("fetchProjects, remoteProjects:");
					//console.log(remoteProjects);
					let aoi;
					remoteProjects.forEach(function(remoteProject) {
						if (remoteProject.aoi != undefined) {
							aoi = new ol.format.GeoJSON().readGeometry(remoteProject.aoi);
							//console.log('aoi = ');
							//console.log(aoi);
							//console.log(aoi.getExtent()); 
						}
						
						let project = {
							id: remoteProject.id,
							name: remoteProject.name,
							zoom: remoteProject.zoom_level,
							centerLon: remoteProject.center_lon,
							centerLat: remoteProject.center_lat,
							showAll: remoteProject.show_all,
							groups: angular.fromJson(remoteProject.groups),
							layers: angular.fromJson(remoteProject.layers),
							aoi: aoi,
							type: angular.fromJson(remoteProject.type),
							modifiedDate: remoteProject.modified_date
						}
						//console.log(project);
						data.projects.push(project);
					});
				});
				remoteProjects.$promise.then(function() {resolve();});
				remoteProjects.$promise.catch(function() {reject();});
			});
		}
		
		if (Auth.isAuthenticated()) {
			console.log("fetching Projects");
			fetchProjects();
		}
		
		const setCurrentProject = function(id) {
			console.log("setCurrentProject id = " + id);
			fetchProjects().then( function() {
				console.log("fetchProjects done");
				if (id) {
					const tmpProject = getProject(id);
					if (tmpProject){
						//data.currentProjectID = id;
						data.currentProject = tmpProject;
						MapSettings.initializeMap(data.currentProject);
					}
				} else {
					//data.currentProjectID = null;
					data.currentProject = null;
					MapSettings.initializeMap();
				}
			});
		}
		
		const getProject = function(id) {
			console.log("getProject id = " + id);
			const projectID = id ? id : data.currentProject.id;
			if (projectID) {
				for (let x = 0; x < data.projects.length; x++) {
					const project = data.projects[x];
					console.log("getProject, project = " + project.name);
					if (project.id == projectID) {
						console.log("getProject returning " + project.name);
						return project;
					}
				}//);
			}
			console.log("getProject returning null");
			return null;
		}
		
		return {
			data: data,
			setCurrentProject: setCurrentProject
		}
		
		
	})
	.factory('LayersTabSettings', function() {
		console.log("LayersTabSettings init enter");

		let data = {
			queryLayer: undefined,
		}
		return {
			data: data
		}
		
	});
