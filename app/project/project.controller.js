angular.module('ProjectController', ['APIService', 'SettingsService', 'ngMaterial', 'ChangeMonitorService'])

.controller('ProjectController', function ProjectController($scope, $rootScope, $q, Projects, MapSettings, ProjectSettings, ChangeMonitor, APP_CONFIG, $mdDialog, $mdToast) {

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
				$mdDialog.show(getChangesDialog(ev, 'New Project')).then(function() {
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
		console.log("openProject enter, ChangeMonitor.data.changed = " + ChangeMonitor.data.changed);
		
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
			const confirm = $mdDialog.prompt()
				.title('Project Name')
				.textContent('What would you like to call this project?')
				.placeholder('Project name')
				.ariaLabel('Project name')
				.targetEvent(ev)
				.ok('Submit')
				.cancel('Cancel');
				
			//TODO: save aoi with project
			console.log('MapSettings.data.aoi = ');console.log(MapSettings.data.aoi);

			$mdDialog.show(confirm).then(function(result) {
				//TODO: check preexisting name
				const name = result;
				project.name = name;
				
				Projects.create(
					project,
					function(result) {
						//ProjectSettings.data.currentProjectID = result.id;
						project.id = result.id;
						ProjectSettings.data.currentProject = project;
						ProjectSettings.fetchProjects();
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
			Projects.update(
				//{projectID: ProjectSettings.data.currentProjectID},
				{projectID: ProjectSettings.data.currentProject.id},
				project,
				function() {
					$scope.showToast('Project saved', true);
					ProjectSettings.fetchProjects();
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
