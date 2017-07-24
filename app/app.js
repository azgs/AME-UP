'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('mapApp', [
  'openlayers-directive',
  'MapController',
  'login',
  'ngMaterial',
  'ngResource',
  'ngMaterialAccordion',
  'ngSanitize',
  'ui.router',
  'AuthService',
  'ProjectController',
  'ReportsTabController',
  'LayersTabController',
  'AttributesTabController',
  'SettingsService'
])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('blue-grey')
    .accentPalette('brown');
})
.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  $stateProvider
  .state('cover', {
    url: '/',
    templateUrl: 'cover/cover.html'
  })
  .state('help', {
    url: '/help',
    templateUrl: 'help/help.html'
  })
  .state('map', {
    url: '/map',
    templateUrl: 'map/map.html',
	//controller: 'MapController' //TODO: either put this here or in html template, not both or will be called twice
  });
 
  $urlRouterProvider.otherwise('/');
  
  //TODO: This leads to reload/url-paste issues. Apparently needs url rewriting installed as well. Maybe later.
  //$locationProvider.html5Mode(true); 
})

.controller('AuthCatcher', function($scope, $rootScope, $state, $mdDialog, Auth, AUTH_EVENTS, $mdSidenav, ProjectSettings, $mdToast) {

	$scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
		Auth.logout();
		$state.go('cover');
	});
  
	$rootScope.toggleSideNav = function() {
		$mdSidenav('main').toggle();
	}
	
	$scope.notImplemented = function() {
		$mdToast.show(
			$mdToast.simple()
				.textContent("Not yet implemented")
				.hideDelay(3000)
		);
	}

	$scope.help = function(event) {
		console.log("help clicked");
		$state.go('help');
		$rootScope.toggleSideNav();

	}
	
	$scope.projectData = ProjectSettings.data;
	$scope.authData = Auth.data;
	
	let browserCheck = function() {
		console.log("browserCheck");
		
		if (!Auth.isAuthenticated()) {
			const supported = Modernizr.es6collections;
			if (!supported) {
				let alert = $mdDialog.alert({
					title: "",
					textContent: "You are using an unsupported browser to access AME-UP. Presentation and performance may be degraded. Please consider using the latest version of Chrome, Firefox, Opera, Safari, or Edge instead.",
					targetEvent: event,
					ok: 'OK'
				});
				
				$mdDialog
					.show( alert )
					.finally(function() {
						alert = undefined;
					});
			}
		}
		
		
	}
	
	browserCheck();
})

.run(function ($rootScope, $state, Auth, AUTH_EVENTS) {
  $rootScope.$on('$stateChangeStart', function (event,next, nextParams, fromState) {
    if (!Auth.isAuthenticated()) {
      console.log(next.name);
      if (next.name == 'map') {
        event.preventDefault();
        $state.go('cover');
      }
    }
  });
  
  $rootScope.isAuthenticated = function() {return Auth.isAuthenticated();}
  $rootScope.logout = function() {Auth.logout(); /*$state.go('cover');*/ window.location.reload();} //TODO: Using state has better flow, but does not refresh the api service. Consequently, we end up using the previous user's auth token. Forcing a page reload prevents this. Is there a better way?
   
});

