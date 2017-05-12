angular.module('ReportsTabController', ['APIService', 'SettingsService', 'ngMaterial'])

.controller('ReportsTabController', function ReportsTabController($scope, $rootScope, Projects, MapSettings, ProjectSettings, APP_CONFIG, $mdDialog, $mdToast)
{
	$scope.reportClicked = function(event, type) {
		//console.log("reportClicked, boxExtent = " + $scope.boxExtent);
		console.log(event);
		if (MapSettings.data.aoi == undefined) {
			showAOIalert(event);
		} else {
			showReportDialog(event, type);
		}
	}
	
    let showAOIalert = function(event) {
 		console.log("show AOI alert");
		alert = $mdDialog.alert({
			title: 'AOI required',
			textContent: 'Please specify an Area of Interest first.',
			targetEvent: event,
			ok: 'Ok'
		});

		$mdDialog
			.show( alert )
			.finally(function() {
				alert = undefined;
			});
    }
	
    let showReportDialog = function(event, type) {
		//TODO: The alert dialog here is just a stub. This will need to be a custom dialog.
 		console.log("show report");
		alert = $mdDialog.alert({
			title: type.charAt(0).toUpperCase() + type.slice(1) + ' Report',
			textContent: '<tabular results here>',
			targetEvent: event,
			ok: 'Done'
		});

		$mdDialog
			.show( alert )
			.finally(function() {
				alert = undefined;
			});
	}
	
});