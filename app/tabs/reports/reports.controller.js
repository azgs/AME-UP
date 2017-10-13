angular.module('ReportsTabController', ['APIService', 'SettingsService', 'ngMaterial', 'ngFileSaver', 'AuthService'])

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
			showAOIalert(event);
		} else {
			showReportDialog(event, type);
		}
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
				return (['Mil Zone ID', 'Restriction Type', 'Service', 'Description', 'Office', 'Contact'].indexOf(key) == -1)
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

				if (reportName === "Contact") {
					html2canvas(document.getElementById('introText'), {
						onrendered: function (canvas) {
							let data = canvas.toDataURL();
							
							//let dateStr = new Date().toLocaleDateString();
							let dateStr = $scope.date.toLocaleDateString();
							
							let docDef = {
								pageOrientation: 'landscape',
								footer: function(currentPage, pageCount) { return { text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', margin: [20, 2] }; },
								content: [
									{ text: 'Contact Report ' + dateStr, fontSize: 22, bold:true },
									{image: data, width: 740},
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
								]
							}

							//for (contact in $scope.results.records) {
							$scope.results.records.forEach(function(contact) {
								docDef.content[2].table.body.push([contact.first_name, contact.last_name, contact.position_title, contact.department, contact.agency_name, contact.agency_type, contact.phone, contact.email,  contact.street + ", " +contact.city + ", "  + contact.state + ", " + contact.zip_code]);
							});

							
							pdfMake.createPdf(docDef).download("ContactReport - " + dateStr + ".pdf");
							
						}
					});		
				} else if (reportName === "Military Encroachment") {
					/*********************
					//This version builds tables in pdfMake. Has trouble rendering xml and splitting fancy tables
					document.getElementById('introText').scrollIntoView();
					html2canvas(document.getElementById('introText'), {
						logging: true,
						onrendered: function (introCanvas) {
							document.getElementById('endText').scrollIntoView();
							html2canvas(document.getElementById('endText'), {
								logging: true,
								onrendered: function (endCanvas) {	
									let introData = introCanvas.toDataURL();
									console.log("introData = "); console.log(introData);
									console.log("introCanvas = "); console.log(introCanvas);
									let endData = endCanvas.toDataURL();
									console.log("endData = "); console.log(endData);
									console.log("endCanvas = "); console.log(endCanvas);
									
									let dateStr = new Date().toLocaleDateString();

									let docDef = {
										pageOrientation: 'landscape',
										footer: function(currentPage, pageCount) { return { text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', margin: [20, 2] }; },
										content: [
											{ text: 'Military Encroachment Report ' + dateStr, fontSize: 22, bold:true },
											{image: introData, width: 740}
										]
									};
									
									$scope.results.records.forEach(function(r) {
										let table = {
											table: {
												dontBreakRows: true,
												body: [
													[
														{
															table: {
																widths: ['*','*','*','*'],
																headerRows: 1,
																dontBreakRows: true,
																body: [
																	[
																		{text: 'Mil Zone ID', bold:true}, 
																		{text: 'Restriction Type', bold:true},
																		{text: 'Service', bold:true},
																		{text: 'Minimum Altitude', bold:true}
																	],
																	[
																		r.military_zone_id, 
																		r.restriction_type, 
																		r.service, 
																		r.minimum_altitude
																	]
																]
															}
														}
													],
													[
														[
															{
																table: {
																	headerRows: 0,
																	dontBreakRows: true,
																	body: [
																		[
																			r.comment
																		]
																	]
																}
															}
														]
													],
													[
														{
															table: {
																widths: ['auto','*'],
																headerRows: 1,
																dontBreakRows: true,
																body: [
																	[
																		{text: 'Office', bold:true}, 
																		{text: 'Contact', bold:true}
																	],
																	[
																		r.office,
																		r.contact_name,// + ", " +r.contact_email + ", "  + r.contact_phone
																	]
																]
															}
														}
													]
												]
											}	
										}
												
										docDef.content.push(table);
										docDef.content.push({text:' ', marginTop: 15});
									});
									pdfMake.createPdf(docDef).download("MilitaryEncroachmentReport - " + dateStr + ".pdf");
								}
							});
						}
					});	
					**************/
								
									
			
					let dateStr = new Date().toLocaleDateString();
								
					let docDef = {
						pageOrientation: 'landscape',
						footer: function(currentPage, pageCount) { return { text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', margin: [20, 2] }; },
						content: [
							{ text: 'Military Encroachment Report ' + dateStr, fontSize: 22, bold:true },
							{ text: ' ', fontSize: 22, bold:true },
						]
					};
					
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
								docDef.content.push({image: divData, width: 740});
								if (++x < $scope.featureCounter.count) { 
									doTheThing(x);
								} else {
									const element = document.getElementById('endText');
									element.scrollIntoView();
									html2canvas(element, {
										logging: true,
										onrendered: function (endCanvas) {	
											const endData = endCanvas.toDataURL();
											docDef.content.push({image: endData, width: 740});
											const element = document.getElementById('footer');
											element.scrollIntoView();
											html2canvas(element, {
												logging: true,
												useCORS: true,
												onrendered: function (footerCanvas) {	
													const footerData = footerCanvas.toDataURL();
													docDef.content.push({image: footerData, width: 740});
													pdfMake.createPdf(docDef).download("MilitaryEncroachmentReport - " + dateStr + ".pdf");
												}
											});
										}
									});
									
								}
							}
						});
							
					};					
					
					const element = document.getElementById('header');
					element.scrollIntoView();
					html2canvas(element, {
						logging: true,
						onrendered: function (headerCanvas) {	
							const headerData = headerCanvas.toDataURL();
							docDef.content.push({image: headerData, width: 740});
							
							const element = document.getElementById('introText');
							element.scrollIntoView();
							
							html2canvas(element, {
								logging: true,
								onrendered: function (introCanvas) {	
									const introData = introCanvas.toDataURL();
									docDef.content.push({image: introData, width: 740});

									let x = 0;
									doTheThing(x);
								}
							});
						}
					});
				} else { //TODO: Implement other reports
					let dateStr = new Date().toLocaleDateString();
								
					let docDef = {
						pageOrientation: 'landscape',
						footer: function(currentPage, pageCount) { return { text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', margin: [20, 2] }; },
						content: [
							{ text: reportName + ' Report ' + dateStr, fontSize: 22, bold:true },
							{ text: ' ', fontSize: 22, bold:true },
						]
					};
					
					const element = document.getElementById('header');
					element.scrollIntoView();
					html2canvas(element, {
						logging: true,
						onrendered: function (headerCanvas) {	
							console.log("header rendered");
							const headerData = headerCanvas.toDataURL();
							docDef.content.push({image: headerData, width: 740});
							const element = document.getElementById('introText');
							element.scrollIntoView();
							html2canvas(element, {
								logging: true,
								onrendered: function (introCanvas) {	
									console.log("intro rendered");
									const introData = introCanvas.toDataURL();
									docDef.content.push({image: introData, width: 740});
									const element = document.getElementById('footer');
									element.scrollIntoView();
									html2canvas(element, {
										logging: true,
										useCORS: true,
										onrendered: function (footerCanvas) {	
											console.log("footer rendered");
											const footerData = footerCanvas.toDataURL();
											docDef.content.push({image: footerData, width: 740});
											pdfMake.createPdf(docDef).download(reportName + "Report - " + dateStr + ".pdf");
										}
									});
								}
							});
						}
					});;
					
				}
			}
		}

		$mdDialog
			.show( alert )
			.finally(function() {
				alert = undefined;
			});
	}
	
	
});