angular.module('ReportsTabController', ['APIService', 'SettingsService', 'ngMaterial', 'ngFileSaver', 'AuthService'])

//TODO: This controller has grown out of control due to the piecemeal nature of Reports specifications. Some serious refactoring is warranted.

.filter('filterAttributes', function() {
    return function(items, inclusionTest) {
        var filtered = {};

        angular.forEach(items, function(item, key) {
            if (inclusionTest(key)) {
                filtered[key] = item;
            }
        });

        return filtered;
    };
})

.controller('ReportsTabController', function ReportsTabController($scope, $rootScope, FileSaver, Blob, Projects, MapSettings, ProjectSettings, Reports, Auth, APP_CONFIG, $mdDialog, $mdToast, $q, filterAttributesFilter)
{
	$scope.reportClicked = function(event, type) {
		//console.log("reportClicked, boxExtent = " + $scope.boxExtent);
		console.log(event);
		if (MapSettings.data.aoi == undefined) {
			//showAOIalert(event);
			showAlert('AOI required', 'Please specify an Area of Interest first.', event);
		} else if (!ProjectSettings.data.currentProject) {
			showAlert('Project required', 'Reports require project parameter definitions. Please define a project first.', event)
		} else {
			showReportDialog(event, type);
		}
	}
	
    let showAlert = function(title, text, event) {
 		console.log("show reports alert");
		alert = $mdDialog.alert({
			title: title,
			textContent: text,
			targetEvent: event,
			ok: 'Ok'
		});

		$mdDialog
			.show( alert )
			.finally(function() {
				alert = undefined;
			});
    }

    let showAOIalert = function(event) {
 		console.log("show AOI alert");
		alert = $mdDialog.alert({
			title: 'AOI required',
			textContent: 'Please specify an Area of Interest first.',
			targetEvent: event,
			ok: 'Ok'
		});

		$mdDialog
			.show( alert )
			.finally(function() {
				alert = undefined;
			});
    }
	
    let showReportDialog = function(event, type) {
 		console.log("show report");
		alert = $mdDialog.alert({
			title: type.charAt(0).toUpperCase() + type.slice(1) + ' Report',
			//textContent: '<tabular results here>',
			locals: { 
				reportName: type.charAt(0).toUpperCase() + type.slice(1),
				userName: Auth.data.username,
				project: ProjectSettings.data.currentProject
			},
			controller: DialogController,
			templateUrl: 'tabs/reports/report_dialog.html',
			targetEvent: event,
			ok: 'Done'
		});
		function DialogController($scope, $mdDialog, reportName, userName, project) {
			$scope.reportName = reportName;
			$scope.implemented = (reportName === 'Contact' || reportName === 'Military Encroachment' || reportName === 'Permitting' || reportName ==='Infrastructure' || reportName === 'Environmental' || reportName === 'Other Considerations');
			$scope.userName = userName;
			$scope.project = project;
			$scope.date = new Date();
			
			$scope.featureCounter = {count:0}; //Used to index the feature records across featureTypes
			
			$scope.omitStandardFields = function(key) {
				return (['Mil Zone ID', 'Restriction Type', 'Service', 'Description', 'Office', 'Contact', 'likelihood'].indexOf(key) == -1)
			}
			
			//console.log("project name = " + project.name);
			
			//TODO: Probably should hit the Reports endpoint from a service rather than here
			//TODO: Column headers should not be hard-coded in report_dialog.html if that file is to be generic.

			/*
			$scope.results = Reports.get({report: reportName, filter: new ol.format.GeoJSON().writeGeometry(MapSettings.data.aoi.clone().transform("EPSG:3857", "EPSG:4326"))});
			$scope.results.$promise.catch(function() {$scope.error = "There was a problem communicating with the server"; console.log($scope.error);});
			*/
			let canvas = document.getElementsByTagName('canvas')[0]; //This magically grabs the map canvas
			canvas.toBlob(function (blob) {
				$scope.thumbURL = URL.createObjectURL(blob)
				$scope.results = Reports.get({report: reportName, filter: new ol.format.GeoJSON().writeGeometry(MapSettings.data.aoi.clone().transform("EPSG:3857", "EPSG:4326"))});
				$scope.results.$promise.then( function() {
					//The following logic is to generate appropriate descriptive text for the ME report, based on project type, project height, and 
					//minimum altitude of the airspace. Arguably, this should all be done in the API server. This would require passing the project
					//to the reports endpoint and a bunch of string manipulation in the endpoint code. I'm not against that, but for now I am 
					//keeping it here and letting angular do the string lifting. 
					if (reportName === 'Military Encroachment') {
						console.log("post report processing");
						$scope.results.featureTypes.forEach(function(featureType) { 
							console.log("processing featureType");
							if (featureType.featureType === "Military_flight_corridor_area" ||
								featureType.featureType === "Mil_special_use_airspace_area") {
								featureType.features.forEach(function(feature) {
									console.log("processing feature");
									let type = null;
									let height = null;
									if (project) {
										type = project.type.name;
										project.type.attributes.some(function(attribute) {
											if (attribute.name === 'height') {
												height = attribute.value;
											}
											return height;  //Returns null or a value. If value, some exits
										});
									}
									
									if (type === null) { //User has not specified a project, give them worst case
										feature['likelihood'] = 'high';
									} else if (type === 'CSP' ||
											  (type === 'Wind' && height > 500)) {
										feature['likelihood'] = feature['Minimum Altitude'] <= 1000 ? 'high' : feature['Minimum Altitude'] <= 2000 ? 'medium' :'low';
									} else if (type === 'Wind' && height <= 500) {
										feature['likelihood'] = feature['Minimum Altitude'] <= 500 ? 'high' : feature['Minimum Altitude'] <= 2000 ? 'medium' :'low';
									} else if (type === 'PV') {
										feature['likelihood'] = feature['Minimum Altitude'] <= 500 ? 'medium' : 'low';
									} else {	
										feature['likelihood'] = 'low'; //TODO: Verify this. To handle unrecognized project type (i.e. project type added but this function not updated)
									}
									console.log("feature = "); console.log(feature);
								});
							}
							console.log(featureType);							
						});
					}
				});
				$scope.results.$promise.catch(function() {$scope.error = "There was a problem communicating with the server"; console.log($scope.error);});		
			})	
			
			$scope.closeDialog = function() {
				$mdDialog.hide();
			}
			

			$scope.csvDownloadClicked = function() {
				if (reportName === "Contact") {
					let csvStr = 'First Name,Last Name,Title,Department,Agency Name,Agency Type,Phone,Email,Address\n';
					$scope.results.records.forEach(function(contact) {
						csvStr += '"' + contact.first_name + '","' + contact.last_name + '","' + contact.position_title + '","' + contact.department + '","' + contact.agency_name + '","' + contact.agency_type + '","' + contact.phone + '","' + contact.email + '","' + contact.street + ", " +contact.city + ", "  + contact.state + ", " + contact.zip_code + '"\n';
					});
					
					console.log("csv = " + csvStr);
					
					let data = new Blob([csvStr], { type: 'text/plain;charset=utf-8' });
					//let dateStr = new Date().toLocaleDateString();
					let dateStr = $scope.date.toLocaleDateString();
					FileSaver.saveAs(data, "ContactReport - " + dateStr + ".csv");
				} else if (reportName === "Military Encroachment") {
					let csvStr = 'Mil Zone ID,Restriction Type,Service,Minimum Altitude,Description,Office,Contact\n';
					$scope.results.records.forEach(function(r) {
						csvStr += '"' + r.military_zone_id + '","' + r.restriction_type + '","' + r.service + '","' + r.minimum_altitude + '","' + r.comment + '","' + r.office + '","' + r.contact_name + ", " +r.contact_email + ", "  + r.contact_phone + '"\n';
					});
					
					console.log("csv = " + csvStr);
					
					let data = new Blob([csvStr], { type: 'text/plain;charset=utf-8' });
					let dateStr = new Date().toLocaleDateString();
					FileSaver.saveAs(data, "MilitaryEncroachmentReport - " + dateStr + ".csv");
				}
				
			}
			
			
			$scope.pdfDownloadClicked = function() {
				console.log("pdfDownloadClicked, " + reportName);
				
				let dateStr = new Date().toLocaleDateString();
							
				let docDef = {
					pageOrientation: 'landscape',
					footer: function(currentPage, pageCount) { return { text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', margin: [20, 2] }; },
					content: [
						{ text: reportName + ' Report ' + dateStr, fontSize: 22, bold:true },
						{ text: ' ', fontSize: 22, bold:true },
					]
				};
				
				const getGuts = function() {
					return $q(function(resolve, reject) {
						let guts = [];
						if (reportName === "Contact") {
							guts.push(
								{table: {
									headerRows: 1,
									dontBreakRows: true,
									body: [
										[
											{text: 'First Name', bold:true}, 
											{text: 'Last Name', bold:true},
											{text: 'Title', bold:true},
											{text: 'Department', bold:true},
											{text: 'Agency Name', bold:true}, 
											{text: 'Agency Type', bold:true},
											{text: 'Phone', bold:true}, 
											{text: 'Email', bold:true},
											{text: 'Address', bold:true}
										]
									],
									fontSize: 10
								}}
							);

							$scope.results.records.forEach(function(contact) {
								guts[0].table.body.push([contact.first_name, contact.last_name, contact.position_title, contact.department, contact.agency_name, contact.agency_type, contact.phone, contact.email,  contact.street + ", " +contact.city + ", "  + contact.state + ", " + contact.zip_code]);
							});			
							resolve(guts);
						} else if (reportName === "Military Encroachment") {					
							let doTheThing = function(x) {
								console.log("feature couter = " + $scope.featureCounter.count);
								const divID = "me_rec_" + x;
								console.log("processing " + divID);
								const element = document.getElementById(divID);
								element.scrollIntoView();
								html2canvas(element, {
									logging: true,
									background: '#ffffff',
									onrendered: function (divCanvas) {
										const divData = divCanvas.toDataURL();
										guts.push({image: divData, width: 740});
										if (++x < $scope.featureCounter.count) { 
											doTheThing(x);
										} else {
											resolve(guts);
										}
									}
								});
								
							};					
						
							let x = 0;
							doTheThing(x);
						} else if (reportName === "Permitting") {				
							docDef.pageOrientation = 'portrait';
							const element = document.getElementById('fed-permitting');
							element.scrollIntoView();
							html2canvas(element, {
								height:element.scrollHeight+120, //I dunno...just, I dunno
								logging: true,
								useCORS: true,
								onrendered: function (fedIntroCanvas) {	
									console.log("fed-permitting rendered");
									const fedIntroData = fedIntroCanvas.toDataURL();
									guts.push({image: fedIntroData, width: 520});										
									const element = document.getElementById('row-permitting');
									element.scrollIntoView();
									html2canvas(element, {
										logging: true,
										useCORS: true,
										onrendered: function (rowCanvas) {	
											console.log("row-permitting rendered");
											const rowData = rowCanvas.toDataURL();
											guts.push({image: rowData, width: 520});
											const element = document.getElementById('cec-permitting');
											element.scrollIntoView();
											html2canvas(element, {
												logging: true,
												useCORS: true,
												onrendered: function (cecCanvas) {	
													console.log("cec-permitting rendered");
													const cecData = cecCanvas.toDataURL();
													guts.push({image: cecData, width: 520});		
													resolve(guts);
												}
											});
										}
									});																				
								}
							});
						} else if (reportName === "Environmental") {											
							let doTheThing = function(x) {
								const divID = "env_rec_" + x;
								console.log("processing " + divID);
								const element = document.getElementById(divID);
								element.scrollIntoView();
								html2canvas(element, {
									logging: true,
									background: '#ffffff',
									onrendered: function (divCanvas) {
										const divData = divCanvas.toDataURL();
										guts.push({image: divData, width: 740});
										if (++x < $scope.results.impacts.length) { 
											doTheThing(x);
										} else {
											resolve(guts);
										}
									}
								});		
							};					
							
							let x = 0;
							doTheThing(x);

						} else {
							reject([{text: 'Invalid report type'}]);
						}
					});
				};
				
				const element = document.getElementById('header');
				element.scrollIntoView();
				html2canvas(element, {
					logging: true,
					onrendered: function (headerCanvas) {	
						const headerData = headerCanvas.toDataURL();
						
						const element = document.getElementById('introText');
						element.scrollIntoView();	
						html2canvas(element, {
							logging: true,
							onrendered: function (introCanvas) {	
								const introData = introCanvas.toDataURL();
								getGuts().then(function(guts) {
									const imageWidth = docDef.pageOrientation === 'landscape' ? 740 : 520;
									docDef.content.push({image: headerData, width: imageWidth});
									docDef.content.push({image: introData, width: imageWidth});
									docDef.content = docDef.content.concat(guts);
									const element = document.getElementById('endText');
									element.scrollIntoView();
									html2canvas(element, {
										logging: true,
										onrendered: function (endCanvas) {	
											const endData = endCanvas.toDataURL();
											const element = document.getElementById('footer');
											element.scrollIntoView();
											html2canvas(element, {
												logging: true,
												useCORS: true,
												onrendered: function (footerCanvas) {	
													const footerData = footerCanvas.toDataURL();
													docDef.content.push({image: endData, width: imageWidth});
													docDef.content.push({image: footerData, width: imageWidth});
													pdfMake.createPdf(docDef).download(reportName + " Report - " + dateStr + ".pdf");
												}
											});
										}
									});
								});
							}
						});
					}
				});
			}
		}

		$mdDialog
			.show( alert )
			.finally(function() {
				alert = undefined;
			});
	}
	
	
});