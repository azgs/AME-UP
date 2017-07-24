angular.module('ProjectController', ['APIService', 'SettingsService', 'ngMaterial', 'ChangeMonitorService', 'ngMessages'])

.controller('ProjectController', function ProjectController($scope, $rootScope, $q, Projects, MapSettings, ProjectSettings, ChangeMonitor, ProjectTypes, APP_CONFIG, $mdDialog, $mdToast) {

	$scope.projects = ProjectSettings.data.projects;
	
	//ProjectSettings.fetchProjects();
		
	$scope.showToast = function(message, closeSideNav) {
		$mdToast.show(
			$mdToast.simple()
				.textContent(message)
				.hideDelay(3000)
		).then( function() {
			if (closeSideNav) {
				$rootScope.toggleSideNav();
			}
		});
	};

	function getChangesDialog (ev, title) {
		return $mdDialog.confirm()
				.title(title)
				.textContent('Are you sure? Unsaved changes will be lost')
				.ariaLabel(title)
				.targetEvent(ev)
				.ok('Yes')
				.cancel('No');
	}
	
	function verifyChanges(ev, title) {
		return $q(function(resolve, reject) {
			if (ChangeMonitor.data.changed) {
				$mdDialog.show(getChangesDialog(ev, title)).then(function() {
					resolve();
				},
				function() {
					reject();
				});
			} else {
				resolve();
			}
		});
	}
	
	$scope.newProject = function(ev) {
		console.log("newProject enter, ChangeMonitor.data.changed = " + ChangeMonitor.data.changed);
		
		verifyChanges(ev, 'New Project').then(function() {
			ProjectSettings.setCurrentProject(null);
			$scope.showToast('New project created', true);
		},
		function() {				
			//$rootScope.toggleSideNav();
		});
	}
	
	$scope.openProject = function(ev) {
		console.log("openProject enter");
					
		verifyChanges(ev, 'Open Project').then(function() {
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: ev,
				templateUrl: 'project/open.project.html',
				controller: function($scope, $mdDialog) {
					$scope.tmpSelect;
			
					$scope.cancel = function() {
						$mdDialog.cancel();
					};
					$scope.answer = function(answer) {
						$mdDialog.hide(answer);
					}
				}
			})
			.then(function(answer) {
				ProjectSettings.setCurrentProject(answer);
				console.log("current project set to "); console.log(ProjectSettings.data.currentProject);
				$scope.showToast('Opening project', true);
			}, function() {
				//$rootScope.toggleSideNav();
			});
		},
		function() {				
			//$rootScope.toggleSideNav();
		});
  };
  	
	$scope.saveProject = function(ev) {
		console.log("saveProject, ProjectSettings.data.currentProjectName = " + ProjectSettings.data.currentProjectName);

		let aoiGeoJSON;
		if (MapSettings.data.aoi != undefined) {
			//let aoiGeom = new ol.geom.Polygon.fromExtent(MapSettings.data.aoi); //TODO: For now, aoi is saved as a box extent. This will change to a geometry in the future.
			//console.log('aoiGeom = ');
			//console.log(aoiGeom);
			//aoiGeoJSON = new ol.format.GeoJSON().writeGeometry(aoiGeom);
			aoiGeoJSON = new ol.format.GeoJSON().writeGeometry(MapSettings.data.aoi);
			console.log(aoiGeoJSON);
		}
		
		const project = {
			zoomLevel: MapSettings.data.center.zoom,
			centerLon: MapSettings.data.center.lon,
			centerLat: MapSettings.data.center.lat,
			showAll: MapSettings.data.showAll,
			groups: angular.toJson(MapSettings.data.groups),
			layers: angular.toJson(MapSettings.data.layers),
			aoi: aoiGeoJSON
		}

		if (ev.currentTarget.id == 'saveAs' || !ProjectSettings.data.currentProject) {
			const confirm = $mdDialog.prompt({
					title: 'Save Project',
					locals: {},
					controller: DialogController,
					templateUrl: 'project/save_dialog.html',
					targetEvent: event,
					ok: 'Submit',
					cancel: 'Cancel'
				});

				function DialogController($scope, $mdDialog) {
					$scope.showJson = false;
					$scope.title = 'Save Project';
					$scope.selectedType = null;
					$scope.name = null;
					$scope.projectTypes = ProjectTypes.query();
					
					$scope.projectTypes.$promise.then(function(data) {
						console.log("projectTypes = "); 
						console.log($scope.projectTypes);
						console.log("projectTypes[0] = "); 
						console.log($scope.projectTypes[0]); 
						console.log(data);
						data.forEach(function(projectType, index) {
							console.log("projectType = " + projectType.name);
							console.log("currentProject =");console.log(ProjectSettings.data.currentProject);
							if (ProjectSettings.data.currentProject && projectType.name === ProjectSettings.data.currentProject.type.name) {
								console.log("found it");
								data[index] = ProjectSettings.data.currentProject.type;
								$scope.selectedType = data[index];//TODO: clone this instead using direct ref to avoid contamination after Cancel
							}
							projectType.attributes.forEach(function(attr) {
								console.log("attr = " + attr.name);
								console.log("attr.inputType = " + attr.inputType);
								try {
									if (attr.inputType.startsWith("[")) {
										attr.options = JSON.parse(attr.inputType);
									} else if (attr.inputType.startsWith("regex")) {
										//attr.regex = attr.inputType.substr(5, attr.inputType.length-5);
										attr.regex = attr.inputType.substr(5, attr.inputType.length-5);
										console.log("attr.regex = " + attr.regex);
									} else if (attr.inputType !== "text" && attr.inputType !== "number") {
										throw("unknown input type: " + attr.inputType);
									}
								} catch(err) {
									console.log(err);
									attr.inputType = "text";
								}
							});
						});						
					}); 
					
					$scope.projectTypes.$promise.catch(function() {$scope.error = "There was a problem communicating with the server"; console.log($scope.error);}); //TODO: make use of this in html

					$scope.cancelDialog = function() {
						console.log("canceling");
						$mdDialog.cancel();
					}
					
					$scope.submitDialog = function() {
						console.log("submitting, selectedType = "); console.log($scope.selectedType);
						$mdDialog.hide({name: $scope.name, type: $scope.selectedType});
					}

					$scope.validateForm = function() {
						let attributeVacantCount;
						if ($scope.selectedType) {
							attributeVacantCount = $scope.selectedType.attributes.reduce(function(acc, attribute) {
								if (attribute.required && !attribute.value) {
									++acc;
								} 
								return acc;
							}, 0);
						}
						return !$scope.name || !$scope.selectedType || attributeVacantCount > 0
					}
				}
				
			console.log('MapSettings.data.aoi = ');console.log(MapSettings.data.aoi);

			$mdDialog.show(confirm).then(function(result) {
				console.log("resolved, result = ");console.log(result);
				//TODO: check preexisting name
				const name = result.name;
				project.name = name;
				project.type = result.type;
				
				Projects.create(
					project,
					function(result) {
						//ProjectSettings.data.currentProjectID = result.id;
						project.id = result.id;
						ProjectSettings.setCurrentProject(project.id);
						$scope.showToast('Project saved', true);
					},
					function() {
						$scope.showToast('There was a problem. Project not saved.');
					}
				);
			}, function() {
				//$rootScope.toggleSideNav();
			});
		} else {
			project.name = ProjectSettings.data.currentProject.name;
			project.type = ProjectSettings.data.currentProject.type;
			project.id = ProjectSettings.data.currentProject.id;
			Projects.update(
				//{projectID: ProjectSettings.data.currentProjectID},
				{projectID: ProjectSettings.data.currentProject.id},
				project,
				function() {
					$scope.showToast('Project saved', true);
					ProjectSettings.setCurrentProject(project.id); //technically, id is already set, but calling this forces project/map reload and change detection reset
				},
				function() {
					$scope.showToast('There was a problem. Project not saved.');
				}
			);
		}		
	};

	
	$scope.deleteProject = function(ev) {
		if (ProjectSettings.data.currentProject) {
			const confirm = $mdDialog.confirm()
				.title('Delete Project')
				.textContent('Are you sure you want to delete this project? This cannot be undone.')
				.ariaLabel('Delete project')
				.targetEvent(ev)
				.ok('Yes')
				.cancel('No');

			$mdDialog.show(confirm).then(function() {
				Projects.delete(
					//{projectID: ProjectSettings.data.currentProjectID},
					{projectID: ProjectSettings.data.currentProject.id},
					function(result) {
						//TODO: remove from local list?
						//console.log("deleteProject, ProjectSettings.data.currentProjectName = " + ProjectSettings.data.currentProjectName);
						ProjectSettings.fetchProjects();
						ProjectSettings.setCurrentProject(null);
						$scope.showToast('Project deleted');
					},
					function() {
						$scope.showToast('There was a problem. Project not deleted.');
					}
				);
			}, function() {
				//$rootScope.toggleSideNav();
			});
		} else {
			//TODO:???
			console.log("What, no project name?");
		}
	}

	
})//;
.controller('ProjectListController', function ProjectListController($scope, ProjectSettings, $mdDialog) {
	$scope.projects = ProjectSettings.data.projects;
});
