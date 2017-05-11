'use strict';

angular.module('SettingsService', ['APIService'])
	.factory('MapSettings', function($http, $rootScope, Layers, LayerGroups, APP_CONFIG) {
		console.log("MapSettings init enter");
		
		let data = {
			center: undefined,
			showAll: undefined,
			groups: undefined,
			layers: undefined,
			aoi: undefined //TODO: For now, aoi is saved as a box extent. This will change to a geometry in the future.
		}
		
		let groupActiveChange = function(group) {
			data.layers.forEach(function(layer) {
				if (layer.group == group.name) {
					layer.visible = group.active;
				}
			});
		};
			
		let layerActiveChange = function(layer) {
			data.groups.forEach(function(group) {
				if (group.name == layer.group) {
					group.active = group.active || layer.visible;
				}
			});
		};

		let toggleShowAllGroups = function() {
			data.showAll = !data.showAll;
		};

		let toggleShowAllLayers = function(group) {
			group.showAll = !group.showAll;
		};
		
		//const initializeMap = function (/*projectID, projectName,*/ zoom, lon, lat, showAll, groups, layers) {
		let initializeMap = function (project) {
			console.log("initializeMap enter");
			
			
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
				remoteGroups.forEach(function(group) {
					group.active = true;
					group.showAll = data.showAll;
					data.groups.push(group);
				});
				
				console.log("data.groups = ");console.log(data.groups);
				console.log("data.groups[0].name = " + data.groups[0].name);
				if (project) {
					data.groups.forEach(group => {group.active = false;}); //set everything to inactive initially
					console.log("loading project");
					project.groups.forEach(group => {
						let parsedGroup = JSON.parse(JSON.stringify(group));
						console.log("parsedGroup.name = " + parsedGroup.name);
						let index = data.groups.findIndex(element => element.name == parsedGroup.name);
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
						console.log("remoteLayer");console.log(remoteLayer);
						console.log("remoteLayer.initial_opacity = " + remoteLayer.initial_opacity);
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
								imagery_set: remoteLayer.imagery_set
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
						data.layers.forEach(layer => {layer.visible = false;}); //set all to inactive initially
						project.layers.forEach(layer => {
							let parsedLayer = JSON.parse(JSON.stringify(layer));
							console.log("parsedLayer.name = " + parsedLayer.name);
							let index = data.layers.findIndex(element => element.name == parsedLayer.name);
							console.log("index = " + index + " "); console.log(data.layers[index]);
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
	.factory('ProjectSettings', function($http, Projects, MapSettings, APP_CONFIG) {
		console.log("ProjectSettings init enter");

		let data = {
			//currentProjectID: undefined,
			currentProject: undefined,
			projects: undefined,
			changed: 0
		}
		
		const fetchProjects = function() {
			console.log("fetchProjects, enter");
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
					//TODO: For now, aoi is saved as a box extent. This will change to a geometry in the future.
					if (remoteProject.aoi != undefined) {
						aoi = new ol.format.GeoJSON().readGeometry(remoteProject.aoi);
						console.log('aoi = ');
						console.log(aoi);
						console.log(aoi.getExtent()); 
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
						//aoi: aoi.getExtent(),
						aoi: aoi,
						modifiedDate: remoteProject.modified_date
					}
					//console.log(project);
					data.projects.push(project);
				});
			});
			console.log("fetchProjects, projects:");
			console.log(data.projects);
		}
		
		fetchProjects();
		
		const setCurrentProject = function(id) {
			console.log("setCurrentProject id = " + id);
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
		}
		
		const getProject = function(id) {
			console.log("getProject id = " + id);
			const projectID = id ? id : data.currentProject.id;
			if (projectID) {
				//data.projects.forEach( project => {
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
			fetchProjects: fetchProjects,
			setCurrentProject: setCurrentProject
		}
		
		
	});
