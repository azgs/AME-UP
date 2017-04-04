angular.module('mapApp').constant('APP_CONFIG', {
	corsProxy: '/proxy/',
	useRemote: true,
	initialLat: 34.275306,
	initialLon: -111.660222,
	initialZoom: 7,
	center: { 
		lat: 34.275306,
		lon: -111.660222,
		zoom: 7
	},
	tokenKey: 'AME-UP_Token',
	layersAPI: 'http://192.168.11.141:3000/api'
	//layersAPI: 'http://10.208.1.165:3000/api'
})
.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated'
});

