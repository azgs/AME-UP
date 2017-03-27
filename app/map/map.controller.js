angular.module('MapController', ['APIService', 'SettingsService'])

.controller('MapController', function MapController($scope, $http, Layers, LayerGroups, MapSettings, APP_CONFIG, ProjectSettings) {
	function print_call_stack() {
		var stack = new Error().stack;
		console.log("PRINTING CALL STACK");
		console.log( stack );
	}	
	
	if (!APP_CONFIG.useRemote) {
		angular.extend($scope, {
			center: APP_CONFIG.center,
			defaults: {
				interactions: {
					mouseWheelZoom: true
				}
			},
			groups: [{
				name: 'BaseMaps',
				type: 'Group',
				active: true
			},
			{
				name: 'Solar',
				type: 'Group',
				active: true
			},
			{
				name: 'Land Ownership',
				type: 'Group',
				active: true
			},
			{
				name: 'Environmental',
				type: 'Group',
				active: true
			},
			{
				name: 'Critical Habitat Areas',
				type: 'Group',
				active: true
			},
			{
				name: 'Military',
				type: 'Group',
				active: true
			}],
			layers: [
				{
					name: 'OpenStreetMap',
					group: 'BaseMaps',
					active: true,
					opacity: 1.0,
					source: {
						type: 'OSM'
					}
				},
				{
					name: 'Bing - Aerial',
					group: 'BaseMaps',
					active: false,
					source: {
							type: 'BingMaps',
							key: 'Ahd_32h3fT3C7xFHrqhpKzoixGJGHvOlcvXWy6k2RRYARRsrfu7KDctzDT2ei9xB',
							imagerySet: 'Aerial'
					}
				},
				{
					name: 'Stamen Terrain Labels',
					group: 'BaseMaps',
					active: false,
					source: {
							type: 'Stamen',
							layer: 'terrain-labels'
					}
				},
				{
					name: 'Wells',
					active: true,
					opacity: 0.5,
					source: {
						type: 'ImageWMS',
						params: {'LAYERS': 'Wellheader', 'TRANSPARENT': 'true', 'STYLES': ' '},
						//url: 'http://cors-anywhere.herokuapp.com/http://services.azgs.az.gov/arcgis/services/aasggeothermal/AZWellHeaders/MapServer/WMSServer'
						url: '/proxy/http://services.azgs.az.gov/arcgis/services/aasggeothermal/AZWellHeaders/MapServer/WMSServer',
						legend_url: '/proxy/http://services.azgs.az.gov/arcgis/services/aasggeothermal/AZWellHeaders/MapServer/WmsServer?request=GetLegendGraphic%26version=1.1.1%26format=image/png%26layer=Wellheader&legend_options=fontName:Roboto;fontAntiAliasing:true;fontColor:0x000033;fontSize:16;bgColor:0xf6f6f6;dpi:91'
					}
				},
				{
					name: 'Land Ownership',
					group: 'Land Ownership',
					active: true,
					opacity: 0.5,
					source: {
						type: 'TileArcGISRest',
						params: {},
						url: 'http://services.azgs.az.gov/arcgis/rest/services/test/Arizona_Land_Ownership/MapServer',
						legend_url: 'http://services.azgs.az.gov/arcgis/rest/services/test/Arizona_Land_Ownership/MapServer/legend?f=pjson'
					}
				},
				{
					name: 'Heat Map',
					group: 'Solar',
					active: true,
					opacity: 0.5,
					source: {
						type: 'TileArcGISRest',
						params: {},
						url: 'http://services.azgs.az.gov/arcgis/rest/services/test/ArizonaHeatMap/MapServer',
						legend_url: 'http://services.azgs.az.gov/arcgis/rest/services/test/ArizonaHeatMap/MapServer/legend?f=pjson'
					}
				},
				{
					name: 'Installation Ranges',
					group: 'Military',
					active: true,
					opacity: 0.5,
					source: {
						type: 'ImageWMS',
						params: {'LAYERS':'AMEUP:MILITARY_INSTALLATIONS_RANGES_TRAINING_AREAS_BND'},
						//url: 'http://10.208.3.127:8080/geoserver/AMEUP/wms'
						//url: 'http://cors-anywhere.herokuapp.com/http://Ameup.usgin.org/geoserver/web'
						url: '/proxy/http://Ameup.usgin.org/geoserver/wms',
						legend_url: '/proxy/http://ameup.usgin.org:8080/geoserver/wms?request=GetLegendGraphic&format=image/png&width=20&height=20&layer=AMEUP:MILITARY_INSTALLATIONS_RANGES_TRAINING_AREAS_BND&legend_options=fontName:Roboto;fontAntiAliasing:true;fontColor:0x000033;fontSize:16;bgColor:0xf6f6f6;dpi:91'
					}
				},
				{
					name: 'Military Training Route: Instrument Route Corridor',
					group: 'Military',
					active: true,
					opacity: 0.5,
					source: {
						type: 'ImageWMS',
						params: {'LAYERS':'section368:military_training_route_ir_corridor'},
						//url: 'http://cors-anywhere.herokuapp.com/http://bogi.evs.anl.gov/geoserver/section368/wms'
						url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms',
						legend_url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms?request=GetLegendGraphic&format=image/png&width=20&height=20&layer=section368:military_training_route_ir_corridor&legend_options=fontName:Roboto;fontAntiAliasing:true;fontColor:0x000033;fontSize:16;bgColor:0xf6f6f6;dpi:91'
					}
				},
				{
					name: 'Areas of Critical Environmental Concern',
					group: 'Environmental',
					active: true,
					opacity: 0.5,
					source: {
						type: 'ImageWMS',
						params: {'LAYERS':'section368:acec2'},
						//url: 'http://cors-anywhere.herokuapp.com/http://bogi.evs.anl.gov/geoserver/section368/wms'
						url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms',
						legend_url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms?request=GetLegendGraphic&format=image/png&width=20&height=20&layer=section368:acec2&legend_options=fontName:Roboto;fontAntiAliasing:true;fontColor:0x000033;fontSize:16;bgColor:0xf6f6f6;dpi:91'
					}
				},
				{
					name: 'ESA-Listed Species Designated Critical Habitat Areas',
					group: 'Critical Habitat Areas',
					active: true,
					opacity: 0.5,
					source: {
						type: 'ImageWMS',
						params: {'LAYERS':'section368:critical_habitat_esa_listed_species_area'},
						//url: 'http://cors-anywhere.herokuapp.com/http://bogi.evs.anl.gov/geoserver/section368/wms'
						url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms',
						legend_url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms?request=GetLegendGraphic&format=image/png&width=20&height=20&layer=section368:critical_habitat_esa_listed_species_area&legend_options=fontName:Roboto;fontAntiAliasing:true;fontColor:0x000033;fontSize:16;bgColor:0xf6f6f6;dpi:91'
					}
				},
				{
					name: 'ESA-Listed Species Designated Critical Habitat Lines',
					group: 'Critical Habitat Areas',
					active: true,
					opacity: 0.5,
					source: {
						type: 'ImageWMS',
						params: {'LAYERS':'section368:critical_habitat_esa_listed_species_line'},
						//url: 'http://cors-anywhere.herokuapp.com/http://bogi.evs.anl.gov/geoserver/section368/wms'
						url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms',
						legend_url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms?request=GetLegendGraphic&format=image/png&width=20&height=20&layer=section368:critical_habitat_esa_listed_species_line&legend_options=fontName:Roboto;fontAntiAliasing:true;fontColor:0x000033;fontSize:16;bgColor:0xf6f6f6;dpi:91'
					}
				},
				{
					name: 'Solar Energy Zone',
					group: 'Solar',
					active: true,
					opacity: 0.5,
					source: {
						type: 'ImageWMS',
						params: {'LAYERS':'section368:developable_area_sez'},
						//url: 'http://cors-anywhere.herokuapp.com/http://bogi.evs.anl.gov/geoserver/section368/wms'
						url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms',
						legend_url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms?request=GetLegendGraphic&format=image/png&width=20&height=20&layer=section368:developable_area_sez&legend_options=fontName:Roboto;fontAntiAliasing:true;fontColor:0x545454;fontSize:16;bgColor:0xf6f6f6;dpi:91'
					}
				},
				{
					name: 'Solar Energy Zone Labels',
					group: 'Solar',
					active: true,
					opacity: 0.5,
					source: {
						type: 'ImageWMS',
						params: {'LAYERS':'section368:developable_area_sez_point'},
						//url: 'http://cors-anywhere.herokuapp.com/http://bogi.evs.anl.gov/geoserver/section368/wms'
						url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms',
						legend_url: '/proxy/http://bogi.evs.anl.gov/geoserver/section368/wms?request=GetLegendGraphic&format=image/png&width=20&height=20&layer=section368:developable_area_sez_point&legend_options=fontName:Roboto;fontAntiAliasing:true;fontColor:0x000033;fontSize:16;bgColor:0xf6f6f6;dpi:91'
					}
				}
				
			]
		});
		
		$scope.layers.forEach(function(layer) {
			if (layer.source.type === "TileArcGISRest") {
				$http.get(layer.source.legend_url).
					success(function(data, status, headers, config) {
						layer.legend_json = data;
					}).
					error(function(data, status, headers, config) {
						layer.legend_json = "not available";
					});
			}
		});
	} else {
		console.log("MapController init");
		
		MapSettings.initializeMap();//.then( function() {

		$scope.center = MapSettings.data.center;
		$scope.groups = MapSettings.data.groups;
		$scope.layers = MapSettings.data.layers;
		//$scope.showAll = MapSettings.data.showAll;
		$scope.data = MapSettings.data; //Need this for showAll

		$scope.defaults = {
			interactions: {
				mouseWheelZoom: true
			},
			controls: {
				zoom: true,
				rotate: false,
				attribution: false,
			}
		};
			
		//scaleline does not work when added via the defaults above. Instead, we must create this object then use it with ol-control in the html
		$scope.controls = [
                { name: 'scaleline', active: true }
        ]
		
	};

	$scope.groupActiveChange = MapSettings.groupActiveChange;
	$scope.layerActiveChange = MapSettings.layerActiveChange;
	$scope.toggleShowAllGroups = MapSettings.toggleShowAllGroups;
	$scope.toggleShowAllLayers = MapSettings.toggleShowAllLayers;
	
	/**
	//TODO: This change detection isn't working correctly. Might be worth another look at some point.
	$scope.$watch(function(){return MapSettings.data;}, 
	function(newVal, oldVal){
		if (newVal == oldVal) {
			console.log("center changed but initializing");
		} else {
			console.log("center change detected");
			ProjectSettings.data.changed++;
		}
	},
	true);
	
	ProjectSettings.data.changed = 0;
	**/
	
});