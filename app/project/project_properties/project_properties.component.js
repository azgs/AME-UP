'use strict';

angular.module('ProjectProperties', ['ngMaterial', 'APIService'])
	.component('projectProperties', {
		bindings: { 
			onValid: '&',
			name: '=',
			selectedType: '='
		},
		templateUrl: 'project/project_properties/project_properties.html',

		controller: function ProjectPropertiesController($scope, $mdDialog, ProjectTypes, ProjectSettings) {
			console.log("project types controller enter");
			let $ctrl = this;
						
			$scope.projectTypes = ProjectTypes.query();
			$scope.projectTypes.$promise.then(function(data) {
				//console.log("projectTypes = "); 
				//console.log($scope.projectTypes);
				//console.log("projectTypes[0] = "); 
				//console.log($scope.projectTypes[0]); 
				//console.log(data);
				data.forEach(function(projectType, index) {
					//console.log("projectType = " + projectType.name);
					//console.log("currentProject =");console.log(ProjectSettings.data.currentProject);
					if (ProjectSettings.data.currentProject && projectType.name === ProjectSettings.data.currentProject.type.name) {
						//console.log("found it");
						data[index] = ProjectSettings.data.currentProject.type;
						$ctrl.selectedType = data[index];//TODO: clone this instead using direct ref to avoid contamination after Cancel
						$scope.validateForm();
					}
					projectType.attributes.forEach(function(attr) {
						//console.log("attr = " + attr.name);
						//console.log("attr.inputType = " + attr.inputType);
						try {
							if (attr.inputType.startsWith("[")) {
								attr.options = JSON.parse(attr.inputType);
							} else if (attr.inputType.startsWith("regex")) {
								attr.regex = attr.inputType.substr(5, attr.inputType.length-5);
								//console.log("attr.regex = " + attr.regex);
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
			
			$scope.projectTypes.$promise.catch(function() {$scope.error = "There was a problem communicating with the server"; console.log($scope.error);}); 
			
			$scope.validateForm = function() {
				//console.log("validate form, name = " + $scope.name);console.log($scope.selectedType);
				//console.log("validate form, ctrl.name = " + $ctrl.name);console.log($ctrl.selectedType);
				if ($ctrl.onValid) {
					let attributeVacantCount;
					if ($ctrl.selectedType/*$scope.selectedType*/) {
						//attributeVacantCount = $scope.selectedType.attributes.reduce(function(acc, attribute) {
						attributeVacantCount = $ctrl.selectedType.attributes.reduce(function(acc, attribute) {
							if (attribute.required && !attribute.value) {
								++acc;
							} 
							return acc;
						}, 0);
					}
					console.log("validateForm result = " + !(!$scope.name || !$scope.selectedType || attributeVacantCount > 0));
					//$ctrl.onValid({value: !(!$scope.name || !$scope.selectedType || attributeVacantCount > 0)});
					$ctrl.onValid({value: !(!$ctrl.name || !$ctrl.selectedType || attributeVacantCount > 0)});
				}
			}
			
		}
	});