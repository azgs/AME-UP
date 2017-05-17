angular.module('AttributesTabController', ['APIService', 'SettingsService', 'ngMaterial'])

.controller('AttributesTabController', function AttributesTabController($scope, $rootScope, Projects, LayersTabSettings, MapSettings, ProjectSettings, APP_CONFIG, $mdDialog, $mdToast)
{
	$scope.queryLayer = LayersTabSettings.data.queryLayer;
	$scope.queryResults = LayersTabSettings.data.queryResults;
	$scope.data = LayersTabSettings.data;
});
