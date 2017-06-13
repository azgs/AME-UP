angular.module('LayersTabController', ['APIService', 'SettingsService', 'MapToolsService', 'ngMaterial'])

.controller('LayersTabController', function LayersTabController($scope, $rootScope, Projects, LayersTabSettings, MapSettings, ProjectSettings, MapTools, APP_CONFIG, $mdDialog, $mdToast)
{
	
	$scope.groupActiveChange = MapSettings.groupActiveChange;  
	$scope.layerActiveChange = MapSettings.layerActiveChange; 
	$scope.toggleShowAllGroups = MapSettings.toggleShowAllGroups;
	$scope.toggleShowAllLayers = MapSettings.toggleShowAllLayers;
	
	$scope.layerSettingsData = LayersTabSettings.data;
	$scope.layerClicked = MapTools.layerClicked;	
});