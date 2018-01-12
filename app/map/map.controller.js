angular.module('MapController', ['APIService', 'SettingsService', 'MapToolsService', 'AuthService'])

.controller('MapController', function MapController($scope, $rootScope, $mdDialog, $mdToast, $http, olData, Layers, LayerGroups, MapSettings, APP_CONFIG, ProjectSettings, LayersTabSettings, MapTools, Auth) {
	function print_call_stack() {
		var stack = new Error().stack;
		console.log("PRINTING CALL STACK");
		console.log( stack );
	}	
		
	$scope.showResultsTab = false;
		
	/*	
	olData.getMap().then(function(map) {
		console.log("setting map");
		MapSettings.data.theMap = map;
				
		$scope.data.aoi = undefined;
		
		let mousePosition = new ol.control.MousePosition({
			coordinateFormat: ol.coordinate.createStringXY(2),
			projection: 'EPSG:4326',
			className: 'ol-scale-line-inner',
			target: document.getElementById('positionDisplay'),
			undefinedHTML: '&nbsp;'
		});

		map.addControl(mousePosition);

		let scaleLine = new ol.control.ScaleLine({ 
			units: 'us'
		});
		map.addControl(scaleLine);				
	});
	*/
					
	//MapSettings.initializeMap();
	MapSettings.initializeMap()
	.then(function() {
		ProjectSettings.fetchProjects(); //Good a place as any, I guess
		olData.getMap().then(function(map) {
			console.log("setting map 2");
			MapSettings.data.theMap = map;
			$scope.data.aoi = undefined;
			
			let mousePosition = new ol.control.MousePosition({
				coordinateFormat: ol.coordinate.createStringXY(2),
				projection: 'EPSG:4326',
				className: 'ol-scale-line-inner',
				target: document.getElementById('positionDisplay'),
				undefinedHTML: '&nbsp;'
			});

			map.addControl(mousePosition);

			let scaleLine = new ol.control.ScaleLine({ 
				units: 'us'
			});
			map.addControl(scaleLine);				
		});
	});

	$scope.center = MapSettings.data.center;
	$scope.view = MapSettings.data.view;
	$scope.groups = MapSettings.data.groups;
	$scope.layers = MapSettings.data.layers;
	//$scope.showAll = MapSettings.data.showAll;
	$scope.data = MapSettings.data; //Need this for showAll
	
	//These (and the Auth injections at the top) are for pooping out project data on the Reports tab. They are not currently used.
	$scope.userName = Auth.data.username;
	$scope.projectData = ProjectSettings.data;

	$scope.defaults = {
		interactions: {
			mouseWheelZoom: true
		},
		controls: {
			zoom: true,
			rotate: false,
			attribution: false
		}/*,
		view: {
			rotation:0,
			//Swagged coords for a bounding box around AZ
			//Extent units must be in EPSG:3857 I think. So I used this page to convert: https://epsg.io/transform#s_srs=4326&t_srs=3857&x=-108.8774390&y=36.7459890
			extent: [-12788071.07, 3664032.74, -12132192.78, 4449227.64],
			//projection: 'EPSG:4326',			
			//extent: [-114.877197, 31.2405812, -108.985342, 37.072575],
			minZoom: 7
		}
		*/
	};
		
	//scaleline does not work when added via the defaults above. Instead, we must create this object then use it with ol-control in the html
	$scope.controls = [
			//{ name: 'scaleline', active: true}
	]
		
	$scope.toolsData = MapTools.data;
	$scope.homeExtent = MapTools.homeExtent;
	$scope.infoMode = MapTools.data.infoMode;
	$scope.infoClicked = MapTools.infoClicked;
	$scope.otherInfoClicked = MapTools.otherInfoClicked;
	$scope.bboxMode = MapTools.data.bboxMode;
	$scope.bboxClicked = MapTools.bboxClicked;
	$scope.polyMode = MapTools.data.polyMode;
	$scope.polyClicked = MapTools.polyClicked;
	$scope.searchClicked = MapTools.searchClicked;
	
});
