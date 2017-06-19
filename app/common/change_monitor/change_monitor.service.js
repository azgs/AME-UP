'use strict';

angular.module('ChangeMonitorService', ['SettingsService'])
	.factory('ChangeMonitor', function($rootScope, MapSettings) {
		console.log("ChangeMonitor init enter");

		let data = {
			changed: false
		}

		let watchers = [];

		let clear = function() {
			console.log("clearing watchers");
			watchers.forEach(function(watcher) {watcher();});
			watchers.length = 0;
			data.changed = false;
		}

		let initialize = function() {
			console.log("initing watchers");
		
			watchers.push($rootScope.$watch(function(){return MapSettings.data.layers;},
				function(newVal, oldVal){
					console.log(">>>>>>>>>>>>layers change detected, newVal = "); console.log(newVal);
					console.log("oldVal = "); console.log(oldVal);
					
					if (angular.equals(newVal, oldVal)/*newVal === oldVal*/) {
						console.log("values are same");
					} else {
						console.log("values are different");
						for (let i = 0; i < newVal.length; i++) {
							if (!angular.equals(newVal[i], oldVal[i])/*newVal[i] !== oldVal[i]*/) {
								console.log("newVal[" + i + "] is not equal to oldVal[" + i + "]");
								console.log("oldVal = "); console.log(oldVal[i]);
								console.log("newVal = "); console.log(newVal[i]);
								//console.log(newVal.legend_json); console.log(oldVal.legend_json);
								if (newVal[i].legend_json && !oldVal[i].legend_json) {
									console.log("legend_json, ignoring");
								} else {
									data.changed = true;
								}
							}
						}
					}							
				},
				true
			));

			watchers.push($rootScope.$watch(function(){return MapSettings.data.groups;},
				function(newVal, oldVal){
					console.log(">>>>>>>>>>>>groups change detected, newVal = "); console.log(newVal);
					console.log("oldVal = "); console.log(oldVal);
					
					if (angular.equals(newVal, oldVal)/*newVal === oldVal*/) {
						console.log("values are same");
					} else {
						console.log("values are different");
						data.changed = true;
					}							
				},
				true
			));

			watchers.push($rootScope.$watch(function(){return MapSettings.data.aoi;},
				function(newVal, oldVal){
					console.log(">>>>>>>>>>>>aoi change detected, newVal = "); console.log(newVal);
					console.log("oldVal = "); console.log(oldVal);
					
					if (angular.equals(newVal, oldVal)/*newVal === oldVal*/) {
						console.log("values are same");
					} else {
						console.log("values are different");
						data.changed = true;
					}							
				},
				false
			));
			
			watchers.push($rootScope.$watch(function(){return MapSettings.data.center;},
				function(newVal, oldVal){
					console.log(">>>>>>>>>>>>center change detected, newVal = "); console.log(newVal);
					console.log("oldVal = "); console.log(oldVal);
					
					if (newVal.zoom !== oldVal.zoom || Math.abs(newVal.lat - oldVal.lat) > 0.0000001 || Math.abs(newVal.lon - oldVal.lon) > 0.0000001) {
						console.log("values are different");
						data.changed = true;
					} else {
						console.log("values are same");
					}
				},
				true
			));
		}
		
		$rootScope.$on("initializingMap", function() {console.log("ChangeMonitor received initializingMap");clear();});
		$rootScope.$on("mapInitialized", function() {console.log("ChangeMonitor received mapInitialized");initialize();});


		return {
			data: data,
			clear: clear,
			initialize: initialize
		}
	});
		