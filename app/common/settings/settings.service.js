'use strict';

angular.module('SettingsService', ['APIService'])
	.factory('MapSettings', function($http, Layers, LayerGroups, APP_CONFIG) {
		console.log("MapSettings init enter");
		
		let data = {
			center: undefined,
			showAll: undefined,
			groups: undefined,
			layers: undefined,
		}
		
		let groupActiveChange = function(group) {
			data.layers.forEach(function(layer) {
				if (layer.group == group.name) {
					layer.active = group.active;
				}
			});
		};
			
		let layerActiveChange = function(layer) {
			data.groups.forEach(function(group) {
				if (group.name == layer.group) {
					group.active = group.active || layer.active;
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
				data.showAll = project.showAll;
				project.groups.forEach(group => {
					data.groups.push(JSON.parse(JSON.stringify(group)));
				});
				project.layers.forEach(layer => {
					data.layers.push(JSON.parse(JSON.stringify(layer)));
				});
			} else {
				data.center.lat = APP_CONFIG.initialLat;
				data.center.lon = APP_CONFIG.initialLon;
				data.center.zoom = APP_CONFIG.initialZoom;
				data.showAll = false;
				console.log("calling API for groups");
				let remoteGroups = LayerGroups.query(function() {
					console.log("groups call completed");
					remoteGroups.forEach(function(group) {
						group.active = true;
						group.showAll = data.showAll;
						data.groups.push(group);
					});
					
					console.log("calling API for layers");
					let remoteLayers = Layers.query(function() {
						console.log("layers call completed");
						remoteLayers.forEach(function(remoteLayer) {
							let layer = {
								name: remoteLayer.name,
								group: remoteLayer.layer_group,
								active: remoteLayer.is_initially_active,
								opacity: remoteLayer.opacity ? 
									remoteLayer.opacity : 
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
								$http.get(layer.source.legend_url).
									success(function(data, status, headers, config) {
										layer.legend_json = data;
									}).
									error(function(data, status, headers, config) {
										layer.legend_json = "not available";
									});
							}

							//console.log("layer:");
							//console.log(layer);
							data.layers.push(layer);
							
						});
					});
					
				});
			}
		
/**		
			if (data.groups) {
				console.log("resetting groups array");
				data.groups.length = 0;
			} else {
				console.log("creating new groups array");
				data.groups = [];
			}

			if (project) {
				project.groups.forEach(group => {
					data.groups.push(JSON.parse(JSON.stringify(group)));
				});
			} else {
				console.log("calling API for groups");
				let remoteGroups = LayerGroups.query(function() {
					console.log("groups call completed");
					remoteGroups.forEach(function(group) {
						group.active = true;
						group.showAll = data.showAll;
						data.groups.push(group);
					});
				});
			}

			if (data.layers) {
				console.log("resetting layers array");
				data.layers.length = 0;
			} else {
				console.log("creating new layers array");
				data.layers = [];
			}
			
			if (project) {
				project.layers.forEach(layer => {
					data.layers.push(JSON.parse(JSON.stringify(layer)));
				});
			} else {
				console.log("calling API for layers");
				let remoteLayers = Layers.query(function() {
					console.log("layers call completed");
					remoteLayers.forEach(function(remoteLayer) {
						let layer = {
							name: remoteLayer.name,
							group: remoteLayer.layer_group,
							active: remoteLayer.is_initially_active,
							opacity: remoteLayer.opacity ? 
								remoteLayer.opacity : 
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
							$http.get(layer.source.legend_url).
								success(function(data, status, headers, config) {
									layer.legend_json = data;
								}).
								error(function(data, status, headers, config) {
									layer.legend_json = "not available";
								});
						}

						//console.log("layer:");
						//console.log(layer);
						data.layers.push(layer);
						
					});
				});
			}
**/
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
			projects: undefined
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
				remoteProjects.forEach(function(remoteProject) {
					let project = {
						id: remoteProject.id,
						name: remoteProject.name,
						zoom: remoteProject.zoom_level,
						centerLon: remoteProject.center_lon,
						centerLat: remoteProject.center_lat,
						showAll: remoteProject.show_all,
						groups: angular.fromJson(remoteProject.groups),
						layers: angular.fromJson(remoteProject.layers),
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
