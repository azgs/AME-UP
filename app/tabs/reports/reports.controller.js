angular.module('ReportsTabController', ['APIService', 'SettingsService', 'ngMaterial', 'ngFileSaver'])

.controller('ReportsTabController', function ReportsTabController($scope, $rootScope, FileSaver, Blob, Projects, MapSettings, ProjectSettings, Reports, APP_CONFIG, $mdDialog, $mdToast)
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
			locals: { reportName: type.charAt(0).toUpperCase() + type.slice(1) },
			controller: DialogController,
			templateUrl: 'tabs/reports/report_dialog.html',
			targetEvent: event,
			ok: 'Done'
		});
		function DialogController($scope, $mdDialog, reportName) {
			$scope.reportName = reportName;
			$scope.implemented = (reportName === 'Contact' || reportName === 'Military Encroachment' || reportName === 'Permitting' || reportName ==='Infrastructure' || reportName === 'Environmental');
			//TODO: Probably should hit the Reports endpoint from a service rather than here
			//TODO: Column headers should not be hard-coded in report_dialog.html if that file is to be generic.
			/*
			if (reportName === 'Contact') {
				//$scope.results = Reports.get({report: 'contact', filter: '{"type":"Polygon","coordinates":[[[-110.71287778,32.27194444],[-109.19132222,32.27194444],[-109.19132222,33.01055556],[-110.71287778,33.01055556],[-110.71287778,32.27194444]]]}'});
				$scope.results = Reports.get({report: 'contact', filter: new ol.format.GeoJSON().writeGeometry(MapSettings.data.aoi.clone().transform("EPSG:3857", "EPSG:4326"))});
				$scope.results.$promise.catch(function() {$scope.error = "There was a problem communicating with the server"; console.log($scope.error);});
			}
			*/
			$scope.results = Reports.get({report: reportName, filter: new ol.format.GeoJSON().writeGeometry(MapSettings.data.aoi.clone().transform("EPSG:3857", "EPSG:4326"))});
			$scope.results.$promise.catch(function() {$scope.error = "There was a problem communicating with the server"; console.log($scope.error);});
			
			$scope.closeDialog = function() {
				$mdDialog.hide();
			}
			

			$scope.csvDownloadClicked = function() {
				let csvStr = 'First Name,Last Name,Title,Department,Agency Name,Agency Type,Phone,Email,Address\n';
				$scope.results.records.forEach(function(contact) {
					csvStr += '"' + contact.first_name + '","' + contact.last_name + '","' + contact.position_title + '","' + contact.department + '","' + contact.agency_name + '","' + contact.agency_type + '","' + contact.phone + '","' + contact.email + '","' + contact.street + ", " +contact.city + ", "  + contact.state + ", " + contact.zip_code + '"\n';
				});
				
				console.log("csv = " + csvStr);
				
				let data = new Blob([csvStr], { type: 'text/plain;charset=utf-8' });
				let dateStr = new Date().toLocaleDateString();
				FileSaver.saveAs(data, "ContactReport - " + dateStr + ".csv");
				
			}
			
			
			$scope.pdfDownloadClicked = function() {
				//$mdToast.show($mdToast.simple().textContent('Download not yet implemented'));	
					
				/***
				//Works but only adds what is visible in the scroll area.
				html2canvas(document.getElementById('reportBody'), {
					onrendered: function (canvas) {
						var data = canvas.toDataURL();
						var docDefinition = {
							content: [{
								image: data,
								width: 500,
							}]
						};
						pdfMake.createPdf(docDefinition).download("Report.pdf");
					}
				});		
				***/
				
				/**
				let tableContent = [];
				for (contact in results.records) {
					tableContent.push([contact.first_name, contact.last_name, contact.position_title, contact.department, contact.agency_name, contact.agency_type, contact.phone, contact.email,  contact.street + ", " +contact.city + ", "  + contact.state + ", " + contact.zip_code]);
				}
				**/

				html2canvas(document.getElementById('introText'), {
					onrendered: function (canvas) {
						let data = canvas.toDataURL();
						
						let dateStr = new Date().toLocaleDateString();
						
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
											{text: 'Address', bold:true}]
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

				/***
				let dateStr = new Date().toLocaleDateString();
				
				let docDef = {
					pageOrientation: 'landscape',
					content: [
					    { text: 'Contact Report ' + dateStr, fontSize: 22, bold:true },
						' ',
						//$scope.results.textBoxContent[0],
						introText,
						' ',
						{table: {
							headerRows: 1,
							body: [
								['First Name', 'Last Name', 'Title', 'Department', 'Agency Name', 'Agency Type', 'Phone', 'Email', 'Address']
							],
							fontSize: 10
						}}
					]
				}

				//for (contact in $scope.results.records) {
				$scope.results.records.forEach(function(contact) {
					docDef.content[2].table.body.push([contact.first_name, contact.last_name, contact.position_title, contact.department, contact.agency_name, contact.agency_type, contact.phone, contact.email,  contact.street + ", " +contact.city + ", "  + contact.state + ", " + contact.zip_code]);
				});

				
				pdfMake.createPdf(docDef).download("ContactReport - " +  + ".pdf");
				***/
			}
			
		}

		$mdDialog
			.show( alert )
			.finally(function() {
				alert = undefined;
			});
	}
	
	
});