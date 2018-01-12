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

		if (ev.currentTarget.id == 'saveAs' || !ProjectSettings.data.currentProject || !ProjectSettings.data.currentProject.id) {
			
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: ev,
				templateUrl: 'project/save.project.html',
				controller: function($scope, $mdDialog) {
					if (ProjectSettings.data.currentProject) {
						$scope.selectedType = ProjectSettings.data.currentProject.type;
						$scope.name = ProjectSettings.data.currentProject.name;
					} else {
						$scope.selectedType = null;
						$scope.name = null;
					}
					
					$scope.title = 'Save Project';
					
					$scope.formValid = false;
					
					$scope.setFormValid = function(state) {
						console.log("setFormValid, state = " + state);
						$scope.formValid = state;
					}
			
					$scope.cancel = function() {
						console.log("canceling");
						$mdDialog.cancel();
					};
					$scope.submit = function() {
						console.log("submitting, selectedType = "); console.log($scope.selectedType);
						$mdDialog.hide({name: $scope.name, type: $scope.selectedType});
					}
				}
			})
			.then(function(tmpProject) {
				console.log("back from dialog, name = " + tmpProject.name); console.log(tmpProject.type);
				
				project.name = tmpProject.name;
				project.type = tmpProject.type;
				
				Projects.create(
					project,
					function(tmpProject) {
						//ProjectSettings.data.currentProjectID = result.id;
						project.id = tmpProject.id;
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

	$scope.editProject = function(ev) {
		console.log("editProject enter");
		$mdDialog.show({
			parent: angular.element(document.body),
			targetEvent: ev,
			templateUrl: 'project/edit.project.html',
			controller: function($scope, $mdDialog) {
				$scope.title = 'Edit Project';

				if (ProjectSettings.data.currentProject) {
					$scope.selectedType = ProjectSettings.data.currentProject.type;
					$scope.name = ProjectSettings.data.currentProject.name;
				} else {
					$scope.selectedType = null;
					$scope.name = null;
				}
		
				$scope.cancel = function() {
					console.log("canceling");
					$mdDialog.cancel();
				};
				$scope.submit = function() {
					console.log("submitting, selectedType = "); console.log($scope.selectedType);
					$mdDialog.hide({name: $scope.name, type: $scope.selectedType});
				}
			}
		})
		.then(function(project) {
			console.log("back from dialog, name = " + project.name); console.log(project.type);
			if (ProjectSettings.data.currentProject) {
				ProjectSettings.data.currentProject.name = project.name;
				ProjectSettings.data.currentProject.type = project.type;
			} else {
				ProjectSettings.data.currentProject = project;
			}
			console.log("current project set to "); console.log(ProjectSettings.data.currentProject);
			$scope.showToast('Project properties changed', true);
		}, function() {
			//$rootScope.toggleSideNav();
		});
		

	}
	
	
})//;
.controller('ProjectListController', function ProjectListController($scope, ProjectSettings, $mdDialog) {
	$scope.projects = ProjectSettings.data.projects;
});
