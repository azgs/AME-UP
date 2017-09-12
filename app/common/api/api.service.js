'use strict';

//Note: The returns from each of these factories are built statically. This means that the token is assigned when the service is spun up and not again after. And this means that when a user logs in, this service must be restarted. This is ugly, but I haven't yet found a way around it.
angular.module('APIService', ['ngResource'])
	.factory('Layers', function($resource, APP_CONFIG) {
		//console.log("layersAPI = " + APP_CONFIG.layersAPI);

		return $resource(APP_CONFIG.layersAPI + '/layers/:layerID', {layerID:'@id'}, {
			query: {
				method: 'GET',
				isArray: true,
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			get: {
				method: 'GET',
				isArray: false,
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			}
		});
	})
	.factory('LayerGroups', function($resource, APP_CONFIG) {
		console.log("API LayerGroups enter"/*, token = " + window.localStorage.getItem(APP_CONFIG.tokenKey)*/);
		return $resource(APP_CONFIG.layersAPI + '/layergroups/:layerGroupID', {layerGroupID:'@id'}, {
			query: {
				method: 'GET',
				isArray: true,
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			get: {
				method: 'GET',
				isArray: false,
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
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
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
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
				//The result from the endpoint is an array nested three deep. It is more convenient to the html to flatten this 
				//and this seems to be the best place to do it.
				transformResponse: function(data, headers){
					function flatten(arr) {
					  return arr.reduce(function (flat, toFlatten) {
						return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
					  }, []);
					}			
					//let flattened = flatten(angular.fromJson(data));
					//return flattened;
					let result = angular.fromJson(data);
					let flattened = flatten(result.records);
					//console.log("flattened = "); console.log(flattened);
					let returnObj = {textBoxContent: result.textBoxContent, records:flattened};
					//console.log("returnObj = "); console.log(returnObj);
					return returnObj
				}
			}
		});
	})
	.factory('Projects', function($resource, APP_CONFIG) {
		return $resource(APP_CONFIG.layersAPI + '/projects/:projectID', {projectID:'@id'}, {
			query: {
				method: 'GET',
				isArray: true,
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			/**
			get: {
				method: 'GET',
				isArray: false,
			}
			**/
			create: {
				method: 'POST',
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			update: {
				method: 'PUT',
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			delete: {
				method: 'DELETE',
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			}
			
		});
	})
	.factory('ProjectTypes', function($resource, APP_CONFIG) {
		return $resource(APP_CONFIG.layersAPI + '/project_types', {}, {
			query: {
				method: 'GET',
				isArray: true,
				headers: { 'Authorization': 'Bearer ' + window.localStorage.getItem(APP_CONFIG.tokenKey) } 
			},
			/**
			get: {
				method: 'GET',
				isArray: false,
			}
			**/			
		});
	});