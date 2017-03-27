angular.module('AuthService', ['APIService'])
 
	.service('Auth', function($q, $http, User, APP_CONFIG) {
		const TOKEN_KEY = APP_CONFIG.tokenKey;
		const USER_KEY = 'USERNAME';
		let isAuthenticated = false;
		let authToken;
		
		let data = {
			username: "Account information"
		};
		
		//TODO: Keeping user in window storage is necessary because of the reload we have to do on user login, which in turn is necessary to get the token loaded into the $resource factories. Ugh. Until we find a way to avoid that reload, this will be necessary. 
		//TODO: Rather than simply load username here, fetch complete user data from API.
		data.username = window.localStorage.getItem(USER_KEY);
	 
		function loadToken() {
			const token = window.localStorage.getItem(TOKEN_KEY);
			if (token) {
				useToken(token);
			}
		}
		
		function storeToken(token) {
			window.localStorage.setItem(TOKEN_KEY, token);
			console.log("auth, stored token = " + window.localStorage.getItem(TOKEN_KEY));
			useToken(token);
		}
		
		function useToken(token) {
			isAuthenticated = true;
			authToken = token;
		}
		
		function destroyToken() {
			authToken = undefined;
			isAuthenticated = false;
			window.localStorage.removeItem(TOKEN_KEY);
		}
		
		let register = function(user) {
			return $q(function(resolve, reject) {
				User.register({username:user.username, password:user.password, firstName:user.firstName, lastName:user.lastName, email:user.email, desiredRole:user.desiredRole}, function(user){resolve(user.msg);}, function(response){reject(response.data.msg);});
			});
		}

		let login = function(user) {
			data.username = user.username; 
			window.localStorage.setItem(USER_KEY, user.username); 
			
			return $q(function(resolve, reject) {
				User.authenticate({username:user.username, password:user.password}, function(response){storeToken(response.token); resolve(response.msg);}, function(response){data.username = null; window.localStorage.setItem(USER_KEY, null); reject(response.data.msg);});
			});
		}
		
		let logout = function() {
			data.username = null;
			window.localStorage.setItem(USER_KEY, null);
			destroyToken();
		}
				
		loadToken();
		
		return {
			data: data,
			login: login,
			register: register,
			logout: logout,
			isAuthenticated: function() {return isAuthenticated;}
		}
	})
	
	.factory('AuthInterceptor', function($rootScope, $q, AUTH_EVENTS) {
		return {
			responseError: function(response) {
				$rootScope.$broadcast({
					401: AUTH_EVENTS.notAuthenticated
				}[response.status], response);
				return $q.reject(response);
			}
		};
	})
	.config(function ($httpProvider) {
		$httpProvider.interceptors.push('AuthInterceptor');
	});
		
		