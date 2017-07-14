angular.module('LayersTabController', ['APIService', 'SettingsService', 'MapToolsService', 'ngMaterial'])

.controller('LayersTabController', function LayersTabController($scope, $rootScope, Projects, LayersTabSettings, MapSettings, ProjectSettings, MapTools, APP_CONFIG, $mdDialog, $mdToast)
{
	
	$scope.groupActiveChange = MapSettings.groupActiveChange;  
	$scope.layerActiveChange = MapSettings.layerActiveChange; 
	$scope.toggleShowAllGroups = MapSettings.toggleShowAllGroups;
	$scope.toggleShowAllLayers = MapSettings.toggleShowAllLayers;
	
	$scope.layerSettingsData = LayersTabSettings.data;
	$scope.layerClicked = MapTools.layerClicked;	
	
	$scope.layerInfoClicked = function(event, layer) {
		console.log("layerInfoClicked");
		console.log("layer"); console.log(layer);
		
		alert = $mdDialog.alert({
			//title: layer.name,
			locals: { layer: layer },
			controller: DialogController,
			templateUrl: 'tabs/layers/layer_info_dialog.html',
			targetEvent: event,
			ok: 'Done'
		});

		function DialogController($scope, $mdDialog, layer) {
			console.log("dialog enter");
			$scope.title = layer.name;
			$scope.content = layer.source.metadata;
			
			$scope.closeDialog = function() {
				$mdDialog.hide();
			}
		}
		
		$mdDialog
			.show( alert )
			.finally(function() {
				alert = undefined;
			});
		
		
	}
});