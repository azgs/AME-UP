'use strict';

//Note: The returns from each of these factories are built statically. This means that the token is assigned when the service is spun up and not again after. And this means that when a user logs in, this service must be restarted. This is ugly, but I haven't yet found a way around it.
angular.module('APIService', ['ngResource'])
	.factory('Layers', function($resource, APP_CONFIG) {
		//console.log("layersAPI = " + APP_CONFIG.layersAPI);

		return $resource(APP_CONFIG.layersAPI + '/layers/:layerID', {layerID:'@id'}, {
			query: {
				method: 'GET',
				isArray: true,
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			get: {
				method: 'GET',
				isArray: false,
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			}
		});
	})
	.factory('LayerGroups', function($resource, APP_CONFIG) {
		console.log("API LayerGroups enter"/*, token = " + window.localStorage.getItem(APP_CONFIG.tokenKey)*/);
		return $resource(APP_CONFIG.layersAPI + '/layergroups/:layerGroupID', {layerGroupID:'@id'}, {
			query: {
				method: 'GET',
				isArray: true,
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			get: {
				method: 'GET',
				isArray: false,
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			}
		});
	})
	.factory('User', function($resource, APP_CONFIG) {
		return $resource(APP_CONFIG.layersAPI + '/users/:userID', {userID:'@id'}, {
			register: {
				method: 'POST',
				isArray: false,
				params:{signup: true}
			},
			authenticate: {
				method: 'POST',
				isArray: false
			},
			get: {
				method: 'GET',
				isArray: false,
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			}
		});
		
	})
	.factory('PWReset', function($resource, APP_CONFIG) {
		return $resource(APP_CONFIG.layersAPI + '/users/pwreset', {}, {
			get: {
				method: 'GET',
				isArray: false
			},
			post: {
				method: 'POST',
				isArray: false
			}
		});
		
	})
	.factory('Roles', function($resource, APP_CONFIG) {
		return $resource(APP_CONFIG.layersAPI + '/roles/:roleID', {roleID:'@id'}, {
			query: {
				method: 'GET',
				isArray: true,
			},
			get: {
				method: 'GET',
				isArray: false,
			}
		});
	})
	.factory('Reports', function($resource, APP_CONFIG) {
		return $resource(APP_CONFIG.layersAPI + '/reports', {}, {
			get: {
				method: 'GET',
				isArray: false,//true,
				transformResponse: function(data, headers){
					//The result from the endpoint for Contact Report is an array nested three deep. It is more convenient to the html to flatten this and this seems to be the best place to do it.
					function flatten(arr) {
					  return arr.reduce(function (flat, toFlatten) {
						return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
					  }, []);
					}	
					
					let result = angular.fromJson(data);
					if (result.records) { //skip all this if not a Contact report
						let flattened = flatten(result.records);
						let returnObj = {textBoxContent: result.textBoxContent, records:flattened};
						return returnObj;
					} else {
						return result;
					}
				}
			}
		});
	})
	.factory('Projects', function($resource, APP_CONFIG) {
		return $resource(APP_CONFIG.layersAPI + '/projects/:projectID', {projectID:'@id'}, {
			query: {
				method: 'GET',
				isArray: true,
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			/**
			get: {
				method: 'GET',
				isArray: false,
			}
			**/
			create: {
				method: 'POST',
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			update: {
				method: 'PUT',
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			delete: {
				method: 'DELETE',
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			}
			
		});
	})
	.factory('ProjectTypes', function($resource, APP_CONFIG) {
		return $resource(APP_CONFIG.layersAPI + '/project_types', {}, {
			query: {
				method: 'GET',
				isArray: true,
				//headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			/**
			get: {
				method: 'GET',
				isArray: false,
			}
			**/			
		});
	})	
	.factory('WFSProxy', function($resource, APP_CONFIG) {
		return $resource(APP_CONFIG.layersAPI + '/wfs_proxy', {}, {
			xmlQuery: {
				method: 'POST',
				isArray: false,
				//headers: { 
				//	'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey)
				//} 
			}
		});
	})
	// Injects an HTTP interceptor that injects an authorization header for calls on the API
	// This is needed because the factories above are initialized once at start up and the auth token is not available if the user has not logged in.
	.factory('authHttpInterceptor', function (APP_CONFIG) {
		return {
			request: function (config) {
				//if (config.url.includes(APP_CONFIG.layersAPI)) { 
				if (config.url.indexOf(APP_CONFIG.layersAPI) !== -1) {
					config.headers.Authorization = 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey);
				}
				return config;
			}
		};
	})
	.config(function ($httpProvider) {
	  $httpProvider.interceptors.push('authHttpInterceptor');
	})	
	//Arguably, this should go somewhere else, since it's not part of our API server. But then again, I don't see a need to create a whole other service for it so... 
	.factory('Nominatim', function($resource, APP_CONFIG) {
		return $resource('http://nominatim.openstreetmap.org/search/:place', {}, {
			query: {
				method: 'GET',
				isArray: true,
				params:{format: 'json', addressdetails: 1, viewbox: '-114.877197, 31.2405812, -108.985342, 37.072575', bounded: 1}
			}		
		});
	});