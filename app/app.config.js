angular.module('mapApp').constant('APP_CONFIG', {
	corsProxy: '/proxy/',
	useRemote: true,
	initialLat: 34.3983,
	initialLon: -109.6513,
	initialZoom: 7,
	center: { //Flagstaff
		lat: 34.3983,
		lon: -109.6513,
		zoom: 7
	},
	tokenKey: 'AME-UP_Token',
	layersAPI: 'http://192.168.11.141:3000/api'
	//layersAPI: 'http://10.208.1.175:3000/api'
})
.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated'
});

