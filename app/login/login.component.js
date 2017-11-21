'use strict';

angular.module('login', ['ngMaterial', 'AuthService', 'APIService'])
	.component('login', {
		templateUrl: 'login/partials/login.html',
		controller: function LoginController($scope, Auth, $state, $mdDialog, Roles, PWReset, $q) {
			$scope.credentials = {
				username: '',
				password: '',
				password2: '',
				firstName: '',
				lastName: '',
				email: '',
				desiredRole: ''
			};
			
			$scope.showRegistration = false;
			
			$scope.roles = Roles.query(function() {
				$scope.roles.forEach(function(role) {
					console.log("role = " + role.name);
				});
			});

			
			$scope.showAlert = function(titleText, bodyText) {
				$mdDialog.show(
					$mdDialog.alert()
						.parent(angular.element(document.querySelector('#popupContainer')))
						.clickOutsideToClose(true)
						.title(titleText)
						.textContent(bodyText)
						.ariaLabel(titleText)
						.ok('Ok')
				);
			};
						
			$scope.login = function () {
				Auth.login($scope.credentials).then(function(msg) {
					console.log("logged in");
					//TODO: This sequence is lame, but I can't at the moment find a better way to make sure the api service gets refreshed with the new token
					//window.location.reload();
					//window.location.assign('/#!/map');
					$state.go('map');
				}, function(errMsg) {
					console.log("not logged in");
					$scope.showAlert('Login problem', errMsg);
				});
			}
			
			$scope.register = function(action) {
				console.log("action = " + action);
				if (action == 'show') {
					$scope.showRegistration = true;
				} else if (action == 'submit') {
					console.log("submitting");
					if ($scope.credentials.password != $scope.credentials.password2) {
						$scope.showAlert('Registration problem', 'Passwords do not match');
					} else {
						Auth.register($scope.credentials).then(function(msg) {
							console.log("registered");
							$scope.showAlert('Registration submitted', 'You will receive an email when your registration has been approved.');
							$scope.showRegistration = false;
						}, function(errMsg) {
							console.log("not registered");
							$scope.showAlert('Registration problem', errMsg);
						});
					}
				} else { 
					$scope.showRegistration = false;
				}
			}
			
			$scope.requestPWReset = function(ev) {
				$mdDialog.show({
					parent: angular.element(document.body),
					targetEvent: ev,
					templateUrl: 'login/partials/request.dialog.html',
					controller: function($scope, $mdDialog) {
						$scope.title = "Request Password Reset";
						$scope.email = null;
				
						$scope.cancel = function() {
							$mdDialog.cancel();
						};
						$scope.submit = function() {
							$mdDialog.hide($scope.email);
						}
					}
				})
				.then(function(email) {
					$mdDialog.show({
						parent: angular.element(document.body),
						targetEvent: ev,
						templateUrl: 'login/partials/request_status.dialog.html',
						controller: function($scope, $mdDialog) {
							$scope.title = "Request Status";
							$scope.showProgress = true;
							$scope.error = false;
							
							$scope.email = email;

							$q(function(resolve, reject) {
								PWReset.get({"email": email}, function() {resolve();}, function() {reject();});
							})
							.then(function() {
								$scope.showProgress = false; 
								$scope.error = false;
							})
							.catch(function() {
								$scope.showProgress = false;
								$scope.error = true;
							});
							
							$scope.cancel = function() {
								$mdDialog.cancel();
							};
							$scope.submit = function() {
								$mdDialog.hide();
							}
						}
					})


				}, function() {
				});
			}
		}
	});
	