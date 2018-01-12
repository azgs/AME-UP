'use strict';

angular.module('login', ['ngMaterial', 'AuthService', 'APIService'])
	.component('login', {
		templateUrl: 'login/partials/login.html',
		controller: function LoginController($scope, Auth, $state, $mdDialog, Roles, PWReset, $q) {
			$scope.credentials = {
				username: null,
				password: null,
				password2: null,
				firstName: null,
				lastName: null,
				email: null,
				organization: null,
				city: null,
				reason: null,
				desiredRole: null,
				tos: false

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
						
			$scope.loginFormValid = false;
			$scope.validateLoginForm = function() {
				$scope.loginFormValid = $scope.credentials.username && $scope.credentials.password;
			}

			$scope.login = function () {
				Auth.login($scope.credentials).then(function(msg) {
					console.log("logged in");
					$state.go('map');
				}, function(errMsg) {
					console.log("not logged in");
					$scope.showAlert('Login problem', errMsg);
				});
			}
			
			$scope.regFormValid = false;
			$scope.validateRegForm = function() {
				$scope.regFormValid = $scope.credentials.username && 
					($scope.credentials.password &&
					$scope.credentials.password2 &&
					$scope.credentials.password === $scope.credentials.password2) &&
					$scope.credentials.firstName &&
					$scope.credentials.lastName &&
					$scope.credentials.email &&
					$scope.credentials.organization &&
					$scope.credentials.city &&
					$scope.credentials.desiredRole &&
					$scope.credentials.tos === true;
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
							$scope.showAlert('Registration submitted', 'You will receive an email when your registration has been approved (within five business days).');
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
	
//Custom directive to compare password fields in registration	
var compareTo = function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
};

angular.module('login').directive("compareTo", compareTo);
				
	