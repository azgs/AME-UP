'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('mapApp', [
  'openlayers-directive',
  'MapController',
  'AccessController',
  'login',
  'ngMaterial',
  'ngResource',
  'ngMaterialAccordion',
  'ui.router',
  'AuthService'
])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('blue-grey')
    .accentPalette('brown');
})
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('cover', {
    url: '/',
    templateUrl: 'cover/cover.html'
  })
  .state('map', {
    url: '/map',
    templateUrl: 'map/map.html',
	controller: 'MapController'
  });
 
  $urlRouterProvider.otherwise('/');
})
.controller('AuthCatcher', function($scope, $state, Auth, AUTH_EVENTS) {
  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    Auth.logout();
    $state.go('cover');
  });
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
  $rootScope.logout = function() {Auth.logout(); $state.go('cover');}
 
  
});

