'use strict';

angular.module('MapToolsService')
	.factory('SearchTool', function($rootScope, $mdToast, $mdDialog,  $q, MapSettings, Nominatim) {
		console.log("SearchTool init enter");

		let data = {
		}

		let showToast = function(message) {
			$mdToast.show(
				$mdToast.simple()
					.textContent(message)
					.hideDelay(3000)
			);
		};
		
		
		let showSearchDialog = function(event) {
			/**
			let confirm = $mdDialog.prompt()
			  .placeholder('Address or place name')
			  .ariaLabel('Address')
			  .targetEvent(event)
			  .ok('Search')
			  .cancel('Cancel');

			$mdDialog.show(confirm).then(function(result) {
				queryGeocoder(result).then(function(jsonResult) {
					if (jsonResult.length > 0) {
						let min = ol.proj.transform([parseFloat(jsonResult[0].boundingbox[2]), parseFloat(jsonResult[0].boundingbox[0])], 'EPSG:4326','EPSG:3857');
						let max = ol.proj.transform([parseFloat(jsonResult[0].boundingbox[3]), parseFloat(jsonResult[0].boundingbox[1])], 'EPSG:4326','EPSG:3857');
						let extent = [min[0], min[1], max[0], max[1]];
						console.log(extent);
						MapSettings.data.theMap.getView().fit(extent, MapSettings.data.theMap.getSize());
					} else {
						console.log("No results found in search area");
					}
				})/*.catch(function() {
					console.log("there was a problem with geocoding");
				})*;
			}, function() {
			  showToast("Search canceled");
			});
			**/
			
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: event,
				templateUrl: 'map/maptools/searchtool/searchtool.dialog.html',
				controller: function($scope, $mdDialog) {
					$scope.waiting = false;
					$scope.searchLocation
					$scope.formValid = false;
					
					$scope.validateForm = function() {
						console.log ("validating form");
						if ($scope.searchLocation && $scope.searchLocation.trim() !== '') {
							$scope.formValid = true;
						}
					}

					$scope.locationList = null;
					$scope.selectedLocationIdx = null;
					$scope.locationSelected = function() {
						console.log("selectedLocationIdx = " + $scope.selectedLocationIdx); console.log($scope.selectedLocationIdx);
						console.log("locationList");console.log($scope.locationList);
								let min = ol.proj.transform([parseFloat($scope.selectedLocationIdx.boundingbox[2]), parseFloat($scope.selectedLocationIdx.boundingbox[0])], 'EPSG:4326','EPSG:3857');
								let max = ol.proj.transform([parseFloat($scope.selectedLocationIdx.boundingbox[3]), parseFloat($scope.selectedLocationIdx.boundingbox[1])], 'EPSG:4326','EPSG:3857');
								let extent = [min[0], min[1], max[0], max[1]];
								console.log(extent);
								$mdDialog.hide({extent: extent});
					}
					
					$scope.close = function() {
						console.log("canceling");
						$mdDialog.cancel();
					};
					$scope.search = function() {
						$scope.waiting = true;
						queryGeocoder($scope.searchLocation).then(function(jsonResult) {
							$scope.waiting = false;
							if (jsonResult.length === 1) {
								let min = ol.proj.transform([parseFloat(jsonResult[0].boundingbox[2]), parseFloat(jsonResult[0].boundingbox[0])], 'EPSG:4326','EPSG:3857');
								let max = ol.proj.transform([parseFloat(jsonResult[0].boundingbox[3]), parseFloat(jsonResult[0].boundingbox[1])], 'EPSG:4326','EPSG:3857');
								let extent = [min[0], min[1], max[0], max[1]];
								console.log(extent);
								$mdDialog.hide({extent: extent});
							} else if (jsonResult.length > 1) {
								$scope.locationList = jsonResult;
							} else {
								$scope.searchForm.searchLocation.$setValidity("nothingFound", false);
							}
						}).catch(function(err) {
							//TODO: this would probably be better as its own popup dialog
							console.log(err);
							$scope.searchForm.searchLocation.$setValidity("serverProblem", false);
						});
					}
				}
			}).then(function(newExtent) {
				console.log("back from search dialog, extent = " + newExtent.extent); console.log(newExtent.extent);
				MapSettings.data.theMap.getView().fit(newExtent.extent, MapSettings.data.theMap.getSize());
			}).catch(function(){}); // to swallow annoying "unhandled rejection" error from angular when dialog is cancelled
		}

		let queryGeocoder = function (place) {
			return $q(function(resolve, reject) {
				console.log("queryGeoCoder enter");
				let result = Nominatim.query({place: place}, function(jsonResult) {
					console.log("geocode call completed"); console.log(jsonResult);
					resolve(jsonResult);		
				},
				function(err) {
					console.log(err);
					rehect(err);
				});
			});
		}
		
		return {
			data: data,
			showSearchDialog: showSearchDialog
		}
		
	});

		