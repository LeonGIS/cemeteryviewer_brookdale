// Common.js - common functions for tax viewer applications to avoid copy-and-paste reuse of common functions.
// the idea is to have the map/data specific config in the .html file, and for these functions to be more
// generic - i.e., you could copy and paste the html for a water pipe app and not change common.js


  
// Function: ShowFeatureInfoWindow2
// Description:  Response from click on map ... Gets selected lot feature and related records
function ShowFeatureInfoWindow2(mapPoint) {
	map.infoWindow.hide();
	lotGraphic = null;
	map.getLayer(tempParcelLayerId).clear();

	dojo.byId("divParcelDataScrollContainer").style.display = "block";
	RemoveChildren(dojo.byId('divParcelScrollContent'));
	ShowProgressIndicator();
	QueryLotLayer(mapPoint);
}

  
// Function: QueryLotLayer
// Description: Spatial query on lot layer
function QueryLotLayer(mapPoint){
	// Set up query task for clicking on map

	var queryTask = new esri.tasks.QueryTask(queryLayerString);
	var query = new esri.tasks.Query();
	query.outSpatialReference = map.spatialReference;
	query.returnGeometry = true;
	query.outFields = ["*"];
	query.geometry = mapPoint;
	query.where = "";
	query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_WITHIN;

	//console.log("Execute queryLotsFromMap"); 
	queryTask.execute(query, function(fset) {
		if (fset.features.length > 0) {
		//	console.log("queryBurialTable: 1 or more recs returned") 
			// Check selected OID against current pop-up display... don't execute if not necessary
			if ((!featureID) || (featureID != fset.features[0].attributes[lotFields.OID]) || (!map.infoWindow.isShowing))
			{
				// Query Related Table
				QueryRelatedBurials(fset.features, mapPoint);
			}
		}
		// No lot clicked
		else {
			HideProgressIndicator();
			alert(messages.getElementsByTagName("notfoundQueryLotLayer")[0].childNodes[0].nodeValue);
		}
	},  
	// Error Function
	function(){
		HideProgressIndicator();
		alert(messages.getElementsByTagName("errorQueryLotLayer")[0].childNodes[0].nodeValue);
	});	 
}
  
  
// Function: QueryRelatedBurials
// Description:  Finds Related Table Records to first item of feature set
function QueryRelatedBurials(features, mapPoint){
	// If no mapPoint from user....then generate from feature
	if (!mapPoint){
		var polygon = features[0].geometry;
		var mapPoint = polygon.getExtent().getCenter();
		if (!polygon.contains(mapPoint)) {
			mapPoint = polygon.getPoint(0, 0);
		}  
	}

	// Get Lot Number... and other attributes
	var strLotNumber;
	if (features[0].attributes[lotFields.LotNumber] instanceof Array) 
		strLotNumber = features[0].attributes[lotFields.LotNumber][0];
	else 
		strLotNumber = features[0].attributes[lotFields.LotNumber];
	if(null == strLotNumber || "Null" == strLotNumber || "null" == strLotNumber) 
		strLotNumber = "UNKNOWN";
	strLotNumber = strLotNumber.replace(/[']/g, " ");
    

    
	g_OwnerLast = features[0].attributes[lotFields.OwnerLast];
	if(null == g_OwnerLast || "Null" == g_OwnerLast || "null" == g_OwnerLast)g_OwnerLast = "";
	else g_OwnerLast = g_OwnerLast.replace(/[']/g, " ");

	g_OwnerFirst = features[0].attributes[lotFields.OwnerFirst];
    if(null == g_OwnerFirst || "Null" == g_OwnerFirst || "null" == g_OwnerFirst) g_OwnerFirst = "";
	else g_OwnerFirst = g_OwnerFirst.replace(/[']/g, " ");
 	
 	g_OwnerTitle = features[0].attributes[lotFields.OwnerTitle];
	if(null == 	g_OwnerTitle || "Null" == 	g_OwnerTitle || "null" == g_OwnerTitle) g_OwnerTitle = "";
	g_OwnerTitle = 	g_OwnerTitle.replace(/[']/g, " ");
	
	g_LotLocation = features[0].attributes[lotFields.Location];
	if(null == g_LotLocation || "Null" == g_LotLocation || "null" == g_LotLocation) g_LotLocation = "";
	g_LotLocation = g_LotLocation.replace(/[']/g, " ");
	
	g_GravesTotal = features[0].attributes[lotFields.GravesTotal];
	g_GravesAvail = features[0].attributes[lotFields.GravesAvail];
	g_Book = features[0].attributes[lotFields.Book];
	g_Page = features[0].attributes[lotFields.Page];
	
	g_PurchDate =   features[0].attributes[lotFields.PurchDate];
 	if(null == g_PurchDate|| "Null" == g_PurchDate || "null" == g_PurchDate) g_PurchDate = "";
  	else g_PurchDate = formatDate(g_PurchDate);
	
 	
	// Define Relationship Query
	var relatedTopsQuery = new esri.tasks.RelationshipQuery();
	relatedTopsQuery.outFields = ["*"];
	relatedTopsQuery.relationshipId = graveRelateId;
	relatedTopsQuery.objectIds = [features[0].attributes.OBJECTID];
	relatedTopsQuery.returnGeometry = true;

	// Execute Query
	//console.log("Execute queryRelatedBurials");
	LotFeatureLayer.queryRelatedFeatures(relatedTopsQuery, function(relatedRecords) {
		// Not Mobile Devide
		if (!isMobileDevice) {
			// 1) Highlight parcel & zoom/pan...
			AddLotToMap(features[0], mapPoint);

			// 2) Populate Pop-up...
			if ( ! relatedRecords.hasOwnProperty(features[0].attributes.OBJECTID) ) {
				//   dojo.byId("tdList").style.display = "none";
				//console.log("queryRelatedBurials: 0 records for ObjectID: ", features[0].attributes.OBJECTID);
				FormatQueryResults(strLotNumber, tableFields, null,mapPoint);

			}
			else {
				//console.log("queryRelatedBurials: Records found for ObjectID: ", features[0].attributes.OBJECTID);
				var fset = relatedRecords[features[0].attributes.OBJECTID];
				FormatQueryResults(strLotNumber, tableFields, fset.features,mapPoint);
			}
		}
		// Mobile Device
		else {
			if (isMobileDevice) {
				HideProgressIndicator();
				map.infoWindow.setTitle("");
				map.infoWindow.setContent("");

				setTimeout(function () {

					// 1) Highlight parcel & zoom/pan... 
					AddLotToMap(features[0], mapPoint);

					// 2) Display & Place infoWindow 
					map.infoWindow.setTitle( "Lot " + strLotNumber);
					if ( ! relatedRecords.hasOwnProperty(features[0].attributes.OBJECTID) ) {
						map.infoWindow.setContent("No Burials");
					}
					else{
						var fset = relatedRecords[features[0].attributes.OBJECTID];
						map.infoWindow.setContent(fset.features.length + " Burials");
					}
					var screenPoint;
					selectedGraphic = mapPoint;
					screenPoint = map.toScreen(mapPoint);
					screenPoint.y = map.height - screenPoint.y;
					map.infoWindow.resize(225, 65);
					map.infoWindow.show(screenPoint);

					// Set On Click function for image
					dojo.connect(map.infoWindow.imgDetailsInstance(), "onclick", function () {
						if (!relatedRecords.hasOwnProperty(features[0].attributes.OBJECTID)) {
							//console.log("queryRelatedBurials: 0 records for ObjectID: ", features[0].attributes.OBJECTID);
							FormatQueryResults(strLotNumber, tableFields, null,mapPoint);

						}
						else {                                          
							var fset = relatedRecords[features[0].attributes.OBJECTID];
							FormatQueryResults(strLotNumber, tableFields, fset.features,mapPoint);                        	
						}
					});
				});
			}
		}

	}, function(){

		HideProgressIndicator();
		alert(messages.getElementsByTagName("errorQueryRelatedBurials")[0].childNodes[0].nodeValue);
	});	 
}

// Function: AddLotToMap
// Description: Highlights feature in graphics layer and change extent
function AddLotToMap(feature, mapPoint){
	// Set map selection
	var lineColor = new dojo.Color();
	lineColor.setColor(lotLayer.Color);

	var fillColor = new dojo.Color();
	fillColor.setColor(lotLayer.Color);
	fillColor.a = lotLayer.Alpha;

	var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
			new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, lineColor, 3), fillColor);
	var lotGraphic = new esri.Graphic(feature.geometry, symbol, feature.attributes);

	featureID = lotGraphic.attributes[lotFields.OID];

	map.getLayer(tempParcelLayerId).add(lotGraphic); 
	selectedGraphic = mapPoint;

	(isMobileDevice) ? map.setExtent(GetMobileMapExtent(selectedGraphic)) : map.setExtent(GetBrowserMapExtent(mapPoint));
}

  

//Function: FormatQueryResults
//Description: highlights feature and configures pop-up with table records
function FormatQueryResults(lotID, tablekeys, burialrecs, mapPoint){
    // Format Table
	RemoveChildren(dojo.byId("divParcelScrollContent"));
	var table = document.createElement("table");
	dojo.byId("divParcelScrollContent").appendChild(table);
	table.id = "tableParcelInfoWindowData";
	table.style.width = "95%";
	table.style.height = "10%";
	table.style.textAlign = "left";
	var tbody = document.createElement("tbody");
	table.appendChild(tbody);

	// No Records to format
	if (burialrecs == null){
		var tr = document.createElement("tr");

		tbody.appendChild(tr);
		var td = document.createElement("td");
		td.innerHTML = "No burials on lot";

		tr.appendChild(td);

	}
	// Format Records
	else {
		var numFeatures = burialrecs.length;

		// Create content for Pop-up
		var strLotLocation
		
		var intBurialCount = 0
		
		for (var i=0; i<numFeatures; i++) {
			// Format Name
			// Format Deceased Name Fields
			var strLastName;
			var strFirstName;
			var strTitleName;
			var strSuffixName;
			var strFullName;
		
			
			strTitleName =   burialrecs[i].attributes[tablekeys.TitleName];
			if(null == strTitleName || "Null" ==strTitleName || "null" == strTitleName) strTitleName = "";
			else strTitleName = strTitleName.replace(/[']/g, " ");

			strFullName = strTitleName;

			strFirstName = burialrecs[i].attributes[tablekeys.FirstName];
			if(null == strFirstName || "Null" ==strFirstName || "null" == strFirstName) strFirstName = "";
			else strFirstName = strFirstName.replace(/[']/g, " ");

			if (strFullName != "" && strFirstName != "") strFullName = strFullName + ' ' + strFirstName;
			else strFullName = strFirstName;

			strLastName = burialrecs[i].attributes[tablekeys.LastName];	 
			if(null == strLastName || "Null" == strLastName || "null" == strLastName)strLastName = "";
			else strLastName = strLastName.replace(/[']/g, " ");

			if (strFullName != "" && strLastName != "") strFullName = strFullName + ' ' + strLastName;
			else strFullName = strLastName;

			strSuffixName =   burialrecs[i].attributes[tablekeys.SuffixName];
			if(null == strSuffixName || "Null" ==strSuffixName || "null" == strSuffixName) strSuffixName = "";
			else strSuffixName = strSuffixName.replace(/[']/g, " ");

			if (strSuffixName != "") strFullName = strFullName + ' ' + strSuffixName;
			if (strFullName == "" ) strFullName = "NO NAME"; 
			
			// Skip Empty Graves
			if (strFullName != "NO NAME"){
				var strGraveNumber = burialrecs[i].attributes[tablekeys.GraveNumber];
				if(null == strGraveNumber || "Null" == strGraveNumber || "null" == strGraveNumber) strGraveNumber = "";
				strGraveNumber = strGraveNumber.replace(/[']/g, " ");
				
				
				
				
			//	var strBirthDate;
				//var BirthDate
				var strDeathDate;
				var DeathDate;
				var strFullDate;
				var strGraveNumber;
				
			//	strBirthDate = burialrecs[i].attributes[tablekeys.DateOfBirth];
				
		/*		if (typeof strBirthDate == "string") {
					if(null == strBirthDate || "Null" == strBirthDate || "null" == strBirthDate) strBirthDate = "";
					else strBirthDate = strBirthDate.replace(/[']/g, " ");
				}
				else{
					if(null == strBirthDate) strBirthDate = "";
					else {
							BirthDate = new Date(strBirthDate);
							strBirthDate = BirthDate.getMonth() + "/" + BirthDate.getDate() + "/" + BirthDate.getFullYear();
					}
				}*/
				
				strDeathDate = burialrecs[i].attributes[tablekeys.DateOfDeath];
				if (typeof strDeathDate == "string") {
					if(null == strDeathDate || "Null" ==strDeathDate || "null" == strDeathDate) strDeathDate = "";
					else strDeathDate = strDeathDate.replace(/[']/g, " ");
				}
				else{
					if(null == strDeathDate) strDeathDate = "";
					else {
						DeathDate = new Date(strDeathDate);
						strDeathDate = DeathDate.getMonth() + "/" + DeathDate.getDate() + "/" + DeathDate.getFullYear();
					}
				}
				
				// Replace Birth date with Age for Brookdale
				var strAgeAtDeath;
				strAgeAtDeath = burialrecs[i].attributes[tablekeys.AgeAtDeath];
				
				if (typeof strAgeAtDeath == "string") {
					if(null == strAgeAtDeath || "Null" == strAgeAtDeath || "null" == strAgeAtDeath) strAgeAtDeath = "";
					else strAgeAtDeath = strAgeAtDeath.replace(/[']/g, " ");
				}
				else{
					if(null == strAgeAtDeath) strAgeAtDeath = "";
					else strAgeAtDeath = strAgeAtDeath.toString();
				}
				
				// Replace Birth date with Age
				//if (strDeathDate != "" && strBirthDate != "") strFullDate = strBirthDate + " - " + strDeathDate;
				//else if (strDeathDate != "" && strBirthDate == "") strFullDate = "Died " + strDeathDate;
				//else if (strBirthDate != "" && strDeathDate == "") strFullDate = "Born " + strBirthDate;
				//else strFullDate = "";
				
				if (strDeathDate != "" && strAgeAtDeath != "") strFullDate = "Died " + strDeathDate + ", Age " + strAgeAtDeath ;
				else if (strDeathDate != "" && strAgeAtDeath == "") strFullDate = "Died " + strDeathDate;
				else if (strAgeAtDeath != "" && strDeathDate == "") strFullDate = "Age " + strAgeAtDeath;
				else strFullDate = "";
				
	
				//var strFullText;
				////strFullText = strFullName;
				//if (strDeathDate != "") strFullText = strFullText + "    -    " + strFullDate
				
				
				// Must format Grave depth to remove single & double quotes
		    	var strGraveDepth = burialrecs[i].attributes[tablekeys.Depth];
		    	if(null == strGraveDepth || "Null" == strGraveDepth || "null" == strGraveDepth) strGraveDepth = "";
		    	strGraveDepth =   strGraveDepth.replace(/[']/g, "ft ");
		  		strGraveDepth =   strGraveDepth.replace(/["]/g, "in");
		     
			 	var strVault = burialrecs[i].attributes[tablekeys.Vault];
				if(null == strVault || "Null" == strVault || "null" == strVault) strVault = "";
				strVault = strVault.replace(/[']/g, " ");
				
				var DateOfDeath = burialrecs[i].attributes[tablekeys.DeathDate];
				if(null == DateOfDeath || "Null" == DateOfDeath || "null" == DateOfDeath) DateOfDeath= "";
		     	else DateOfDeath = formatDate(DateOfDeath);
				
				var DateOfBurial = burialrecs[i].attributes[tablekeys.BurialDate];
		     	if(null == DateOfBurial || "Null" == DateOfBurial || "null" == DateOfBurial)DateOfBurial= "";     	
				else	DateOfBurial = formatDate(DateOfBurial);
				
		     	var strTownOfDeath = burialrecs[i].attributes[tablekeys.DiedTown];
		     	if(null == strTownOfDeath || "Null" == strTownOfDeath || "null" == strTownOfDeath) strTownOfDeath = "";
		     	strTownOfDeath = strTownOfDeath.replace(/[']/g, " ");
				
				var strStateOfDeath = burialrecs[i].attributes[tablekeys.DiedState];
		     	if(null == strStateOfDeath || "Null" == strStateOfDeath || "null" == strStateOfDeath) strStateOfDeath = "";
		     	strStateOfDeath = strStateOfDeath.replace(/[']/g, " ");
				
				var strVeteran = burialrecs[i].attributes[tablekeys.Veteran];
		     	if(null == strVeteran || "Null" == strVeteran || "null" == strVeteran) strVeteran= "";
		     	strVeteran = strVeteran.replace(/[']/g, " ");
				
				var strUndertaker = burialrecs[i].attributes[tablekeys.Undertaker];
		     	if(null == strUndertaker || "Null" == strUndertaker || "null" == strUndertaker) strUndertaker= "";
		     	strUndertaker = strUndertaker.replace(/[']/g, " ");
		     	
		     	var strLegalLastName = burialrecs[i].attributes[tablekeys.LegalLast];
		     	if(null == strLegalLastName || "Null" == strLegalLastName || "null" == strLegalLastName) strLegalLastName = "";
		     	strLegalLastName = strLegalLastName.replace(/[']/g, " ");
		     
		     	var strLegalFirstName = burialrecs[i].attributes[tablekeys.LegalFirst];
		     	if(null == strLegalFirstName || "Null" == strLegalFirstName || "null" == strLegalFirstName) strLegalFirstName = "";
		     	strLegalFirstName = strLegalFirstName.replace(/[']/g, " "); 
				
				var strLegalTitle = burialrecs[i].attributes[tablekeys.LegalTitle];
		     	if(null == strLegalTitle || "Null" == strLegalTitle || "null" == strLegalTitle) strLegalTitle= "";
		     	strLegalTitle = strLegalTitle.replace(/[']/g, " ");
				
				var strGraveRemarks  = burialrecs[i].attributes[tablekeys.Comments];
		     	if(null == strGraveRemarks || "Null" == strGraveRemarks || "null" == strGraveRemarks) strGraveRemarks= "";
		     	strGraveRemarks = strGraveRemarks.replace(/[']/g, " ");
				
				// Add Row to pop-up
				var tr = document.createElement("tr");
				tbody.appendChild(tr);
				var td = document.createElement("td");
				td.innerHTML = "<a href=\"javascript:void(0)\" onclick=\"window.open('" + "GraveReport.html?LotNumber=" + lotID + "&GraveNumber=" 
		        + strGraveNumber + "&LotLocation=" + g_LotLocation + "&MaxGraves=" + g_GravesTotal
		        + "&AvailableGraves=" + g_GravesAvail + "&OwnerLast=" + g_OwnerLast
		        + "&OwnerFirst=" + g_OwnerFirst + "&OwnerTitle=" + g_OwnerTitle 
		        + "&Page=" + g_Page + "&Book=" + g_Book + "&PurchaseDate=" + g_PurchDate
		        + "&GraveDepth=" + strGraveDepth + "&VaultType=" + strVault + "&DeceasedLast=" + strLastName
		        + "&DeceasedFirst=" + strFirstName + "&AgeAtDeath=" + strAgeAtDeath
		        + "&BurialDate=" + DateOfBurial + "&DateOfDeath=" + DateOfDeath 
		        + "&TownOfDeath=" + strTownOfDeath + "&StateOfDeath=" + strStateOfDeath 
		        + "&Veteran=" + strVeteran + "&Undertaker=" + strUndertaker 
		        + "&LegalRepFirst=" + strLegalFirstName + "&LegalRepLast=" + strLegalLastName
		        + "&LegalRepTitle=" + strLegalTitle + "&GraveRemarks=" + strGraveRemarks
		        + "')\">" + strFullName + "</a>";
	
				tr.appendChild(td);
				td = document.createElement("td");
				td.innerHTML = strFullDate
				tr.appendChild(td);
				intBurialCount = intBurialCount +1;
			}
		}
	
		
			if (intBurialCount == 0){
				  tr = document.createElement("tr");
					tbody.appendChild(tr);
					var td = document.createElement("td");
					td.innerHTML = "No Burials"
					tr.appendChild(td);
			}
		
			var tr = document.createElement("tr");
			tbody.appendChild(tr);
			
			// Link to Lot Diagram
		    tr = document.createElement("tr");
			tbody.appendChild(tr);
			var td = document.createElement("td");	
			td.innerHTML = "<a href=\"javascript:void(0)\" onclick=\"window.open('" + "LotDiagram.html?LotNumber=" + lotID  +  "')\">" + "View Lot Diagram" + "</a>";
			tr.appendChild(td);
	}

	HideProgressIndicator();	
	var screenPoint;
	dojo.byId('tdInfoHeader').innerHTML = "Lot " + lotID;
	(isMobileDevice) ? map.setExtent(GetMobileMapExtent2(mapPoint)) : map.setExtent(GetBrowserMapExtent2(mapPoint));


	setTimeout(function () {
		if (isMobileDevice) {
			screenPoint = map.toScreen(mapPoint);
			dojo.byId('divParcelInformation').style.display = "block";
			dojo.replaceClass("divParcelInformation", "opacityShowAnimation", "opacityHideAnimation");
			dojo.addClass("divParcelInformation", "divParcelInformation");
			dojo.replaceClass("divParcelInfoWindow", "showContainer", "hideContainer");
			dojo.addClass("divParcelInfoWindow", "divParcelInfoWindow");
		}
		else {

			map.infoWindow.resize(330, 270);
			screenPoint = map.toScreen(mapPoint);
			screenPoint.y = map.height - screenPoint.y;
			map.infoWindow.show(screenPoint);
			map.infoWindow.setTitle("");
			map.infoWindow.reSetLocation(screenPoint);

			dojo.byId('divParcelInfoWindow').style.display = "block";

		}
		SetHeightParcelData();
	}, 100);
}


//function LaunchLotDiagram(lotid){
//	var lotdiagramName = insertIntoHtmlURL("LotDiagram.html");
	 
//	window.open("LotDiagram.html?LotNumber=" + lotid);
//}




// Function: GetBrowserMapExtent2
// Description: function to get the extent based on the mappoint
function GetBrowserMapExtent2(mapPoint) {
	var extent;
	if (map.getLayer(tempParcelLayerId).graphics.length > 0) {
		extent = map.getLayer(tempParcelLayerId).graphics[0].geometry.getExtent().expand(6);
	}
	else {
		extent = map.extent;
	}
	var width = extent.getWidth();
	var height = extent.getHeight();
	var xmin = mapPoint.x - ((2 * width) / 2.8);
	var ymin = mapPoint.y - (height / 4);
	var xmax = xmin + width;
	var ymax = ymin + height;
	return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}

// Function: GetMobileMapExtent2
// Description: function to get the extent based on the mappoint for mobile devices
function GetMobileMapExtent2(mapPoint) {
	var extent;
	if (map.getLayer(tempParcelLayerId).graphics.length > 0) {
		extent = map.getLayer(tempParcelLayerId).graphics[0].geometry.getExtent().expand(5);
	}
	else {
		extent = map.extent;
	}
	var width = extent.getWidth();
	var height = extent.getHeight();
	var xmin = mapPoint.x - (width / 2);
	var ymin = mapPoint.y - (height / 4);
	var xmax = xmin + width;
	var ymax = ymin + height;
	return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}


// Function: SearchBurialTable
// Description: Launch query against burial table
function SearchBurialTable() {
	if (dojo.trim(dojo.byId("txtSearchBox").value) == "") {
		alert(messages.getElementsByTagName("blankName")[0].childNodes[0].nodeValue);
		return;
	}
	(isMobileDevice) ? ShowProgressIndicator('divAddressContainer') : ShowProgressIndicator('tblAddressSearch');
	QueryBurialTable();
}

  
// Function: QueryBurialTable
// Description: Setup & execute query task on burial table
function QueryBurialTable(){
	RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
	RemoveChildren(dojo.byId('tblAddressResults'));
	RemoveChildren(dojo.byId('divAddressHeader'));

	// Get Search Text
	var searchBox = dojo.byId("txtSearchBox");
	var searchText = searchBox.value;
	searchText = searchText.replace(/-/g,"");

	// Set up Query
	var queryTask = new esri.tasks.QueryTask(queryTableString);
	var queryTable = new esri.tasks.Query();
	queryTable.returnGeometry = true; 
	queryTable.outFields = ["*"];
	queryTable.spatialRelationship = esri.tasks.Query.SPATIAL_REL_WITHIN;
	queryTable.outSpatialReference = map.spatialReference;
	queryTable.where = dojo.string.substitute(graveQuery, [searchText.trim().toUpperCase()]);

	// Execute Query
	queryTask.execute(queryTable,function(fset){
		//console.log("queryBurialTable: complete"); 
		// Query return function
		if (fset.features.length > 0){
			//console.log("queryBurialTable: > 0 recs returned")
			dojo.byId("tblSearchInfo").style.display = "none";

			SetHeightAddressResults();

			// Create result table contents
			var tableHeader = document.createElement("table");
			tableHeader.className = "tblSearchHeader";
			var tbodyHeader = document.createElement("tbody");
			tableHeader.appendChild(tbodyHeader);
			var trHeader = document.createElement("tr");
			tbodyHeader.appendChild(trHeader);
			trHeader.className = "trAddressGray";

			var tdParcelId = document.createElement("td");
			trHeader.appendChild(tdParcelId);
			tdParcelId.style.width = "100px";
			tdParcelId.innerHTML = "Lot";

			var spanUp = document.createElement("span");
			spanUp.innerHTML = "&#9650";
			spanUp.id = "spanUp";
			spanUp.style.marginLeft = "10px";
			tdParcelId.appendChild(spanUp);

			var tdAddress = document.createElement("td");
			tdAddress.innerHTML = "Last Name";
			trHeader.appendChild(tdAddress);

			var spanUpAdd = document.createElement("span");
			spanUpAdd.innerHTML = "&#9650";
			spanUpAdd.id = "spanUpAdd";
			spanUpAdd.style.marginLeft = "10px";
			tdAddress.appendChild(spanUpAdd);

			var tdDate = document.createElement("td");
			tdDate.innerHTML = "First Name";
			trHeader.appendChild(tdDate);

			var spanUpDate = document.createElement("span");
			spanUpDate.innerHTML = "&#9650";
			spanUpDate.id = "spanUpDate";
			spanUpDate.style.marginLeft = "10px";
			tdDate.appendChild(spanUpDate);

			dojo.byId("divAddressHeader").appendChild(tableHeader);
			var table = dojo.byId("tblAddressResults");
			var tBody = document.createElement("tbody");
			tBody.id = "tBody";
			table.appendChild(tBody);

			// Table Sorting functions
			var sortableTable = new SortTable2(dojo.byId("tblAddressResults"));
			tdParcelId.setAttribute("sortdir", "down");
			tdAddress.setAttribute("sortdir", "down");
			tdDate.setAttribute("sortdir", "down");

			tdParcelId.onclick = function () {
				if (fset.features.length > 1) {
					sortableTable.sort(0, this.getAttribute("sortdir") == "down");
					if (this.getAttribute("sortdir") == "down") {
						this.setAttribute("sortdir", "up");
						dojo.byId("spanUp").innerHTML = "&#9660";
					}
					else {
						this.setAttribute("sortdir", "down");
						dojo.byId("spanUp").innerHTML = "&#9650";
					}
				}
				else {
					return;
				}
			};

			tdAddress.onclick = function () {
				if (fset.features.length > 1) {
					sortableTable.sort(1, this.getAttribute("sortdir") == "down");
					if (this.getAttribute("sortdir") == "down") {
						this.setAttribute("sortdir", "up");
						dojo.byId("spanUpAdd").innerHTML = "&#9660";
					}
					else {
						this.setAttribute("sortdir", "down");
						dojo.byId("spanUpAdd").innerHTML = "&#9650";
					}
				}
				else {
					return;
				}
			};
			tdDate.onclick = function () {
				if (fset.features.length > 1) {
					sortableTable.sort(2, this.getAttribute("sortdir") == "down");
					if (this.getAttribute("sortdir") == "down") {
						this.setAttribute("sortdir", "up");
						dojo.byId("spanUpDate").innerHTML = "&#9660";
					}
					else {
						this.setAttribute("sortdir", "down");
						dojo.byId("spanUpDate").innerHTML = "&#9650";
					}
				}
				else {
					return;
				}
			};	


			for (var i = 0; i < fset.features.length; i++) {
				CreateTable2(fset.features[i].attributes, dojo.byId("tBody"), dojo.byId("tblAddressResults"), tableFields.LotNumber, tableDisplayFields);
			}
			if (fset.features.length >= 1) {
				HideProgressIndicator();
			}

			SetHeightAddressResults();
		}
		else{ 
			//  console.log("queryBurialTable:  0 recs returned")
			dojo.byId('txtSearchBox').focus();
			HideProgressIndicator();
			alert(messages.getElementsByTagName("notfoundQueryBurialTable")[0].childNodes[0].nodeValue);
		}
	},  
	// Query error function
	function(){
		HideProgressIndicator();
		alert(messages.getElementsByTagName("errorQueryBurialTable")[0].childNodes[0].nodeValue);
	});	 

} 

// Function: SetHeightAddressResults  
// Description: function to set height and create scrollbar for address results
function SetHeightAddressResults() {
	var height = (isMobileDevice) ? dojo.window.getBox().h - 150 : map.height - 55;
	if (!isMobileDevice) {
		dojo.byId('divAddressScrollContent').style.height = (height - 120) + "px";
	}

	if (isMobileDevice) {
		dojo.byId('divAddressScrollContent').style.height = height + "px";
	}
	setTimeout(function () {
		CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
	}, 500)

}
  
  
  function SortTable2(table) {
	    this.tbody = table.getElementsByTagName('tbody');
	    this.thead = table.getElementsByTagName('thead');
	    this.tfoot = table.getElementsByTagName('tfoot');

	    this.getInnerText = function (el) {
	        if (typeof (el.textContent) != 'undefined') return el.textContent;
	        if (typeof (el.innerText) != 'undefined') return el.innerText;
	        if (typeof (el.innerHTML) == 'string') return el.innerHTML.replace(/<[^<>]+>/g, '');
	    }

	    this.getParent = function (el, pTagName) {
	        if (el == null) return null;
	        else if (el.nodeType == 1 && el.tagName.toLowerCase() == pTagName.toLowerCase())
	            return el;
	        else
	            return this.getParent(el.parentNode, pTagName);
	    }

	    this.sortColumnIndex = null;

	    this.sort = function (sortColumnIndex, desc) {
	        if (this.tbody[0].rows.length <= 1) {
	            return;
	        }
	        ShowProgressIndicator();
	        var itm = this.getInnerText(this.tbody[0].rows[1].cells[sortColumnIndex]);
	        this.sortColumnIndex = sortColumnIndex;
	        if (itm.match(/\d\d[-]+\d\d[-]+\d\d\d\d/)) sortfn = this.sortDate; // date
																				// format
																				// mm-dd-yyyy
	        if (itm.replace(/^\s+|\s+$/g, "").match(/^[\d\.]+$/)) sortfn = this.sortNumeric;

	        var sortfn = this.sortCaseInsensitive;

	        var newRows = new Array();
	        for (j = 0; j < this.tbody[0].rows.length; j++) {
	            newRows[j] = this.tbody[0].rows[j];
	        }

	        newRows.sort(sortfn);

	        if (desc) {
	            newRows.reverse();
	        }

	        for (i = 0; i < newRows.length; i++) {
	            this.tbody[0].appendChild(newRows[i]);
	        }

	        HideProgressIndicator();
	    }

	    this.sortCaseInsensitive = dojo.hitch(this, function (a, b) {
	        aa = this.getInnerText(a.cells[this.sortColumnIndex]).toLowerCase();
	        bb = this.getInnerText(b.cells[this.sortColumnIndex]).toLowerCase();
	        if (aa == bb) return 0;
	        if (aa < bb) return -1;
	        return 1;
	    });

	    this.sortDate = function (a, b) {
	        aa = getInnerText(a.cells[sortColumnIndex]);
	        bb = getInnerText(b.cells[sortColumnIndex]);
	        date1 = aa.substr(6, 4) + aa.substr(3, 2) + aa.substr(0, 2);
	        date2 = bb.substr(6, 4) + bb.substr(3, 2) + bb.substr(0, 2);
	        if (date1 == date2) return 0;
	        if (date1 < date2) return -1;
	        return 1;
	    }

	    this.sortNumeric = function (a, b) {
	        aa = parseFloat(getInnerText(a.cells[sortColumnIndex]));
	        if (isNaN(aa)) aa = 0;
	        bb = parseFloat(getInnerText(b.cells[sortColumnIndex]));
	        if (isNaN(bb)) bb = 0;
	        return aa - bb;
	    }
	}
  
  
// function to create table
  function CreateTable2(attributes, tBody, table, objectIdField, displayFields) {
   // map.getLayer(tempLayerId).clear();
      var tr = document.createElement("tr");
      tr.className = "trRowHeight";

      tBody.appendChild(tr);
      tr.setAttribute("lotid", attributes[objectIdField]);

      var td = document.createElement("td");
      for (var index in attributes) {
          if (!attributes[index]) {
              attributes[index] = showNullValueAs;
          }
      }
      var parcelID = attributes[displayFields[0]];
      td.innerHTML = parcelID;
      td.style.width = "100px";
      // td.className = 'bottomborder';
      var td1 = document.createElement("td");
      var postalAddress = attributes[displayFields[1]];
      td1.innerHTML = postalAddress;
      // td1.className = 'bottomborder';
      var td2 = document.createElement("td");
      var dateOfDeath = attributes[displayFields[2]];
      td2.innerHTML = dateOfDeath;
      
      
      if (!isMobileDevice) {
          td.className = 'bottomborder';
          td1.className = 'bottomborder';
          td2.className = 'bottomborder';
      }
      tr.onclick = function () {

      tr.className = "selectedAddress";
          if (isMobileDevice) {
              HideAddressContainer();
          }

          dojo.query('.selectedAddress', table).forEach(dojo.hitch(this, function (node, idx, arr) {
              node.bgColor = "";

          }));
          tr.bgColor = selectedAddressColor;
          ShowFeatureInfoWindow3(this.getAttribute("lotid"));
       
      }

      tr.appendChild(td);
      tr.appendChild(td1);
      tr.appendChild(td2);
  }

  
  
// function to populate sales/foreclosure data
  function ShowFeatureInfoWindow3(lotID) {
    
      map.infoWindow.hide();
      lotGraphic = null;
      map.getLayer(tempParcelLayerId).clear();
     
      dojo.byId("divParcelDataScrollContainer").style.display = "block";
      RemoveChildren(dojo.byId('divParcelScrollContent'));
      ShowProgressIndicator(); 
      QueryLotLayerById(lotID);
  }


  // Function: QueryLotLayerById
  // Description: Search for lot feature by LOTID field
  function QueryLotLayerById(searchID){
	  var queryTask = new esri.tasks.QueryTask(queryLayerString);
	  var query = new esri.tasks.Query();
	  query.returnGeometry = true;
	  query.where =  "\"" + lotFields.LotNumber + "\" = '" + searchID + "'" ;
	  query.outFields = ['*'];

	  // console.log("Execute queryById")
	  queryTask.execute(query, function(fset) {

		  if (fset.features.length >= 1) {
			  // console.log("queryByID: 1 rec returned")
			  // Check selected OID against current pop-up display... don't execute if not necessary
			  if ((!featureID) || (featureID != fset.features[0].attributes[lotFields.OID]) || (!map.infoWindow.isShowing))
			  {
				  // Query Related Table
				  QueryRelatedBurials(fset.features, null);
			  }
		  }
		  // No results returned
		  else {
			  //   console.log("queryByID: 0 recs returned")
			  HideProgressIndicator();
			  alert(messages.getElementsByTagName("notfoundQueryLotLayerById")[0].childNodes[0].nodeValue)
		  }

	  }, function(){
		  //  console.log("queryByID: error")
		  HideProgressIndicator();
		  alert(messages.getElementsByTagName("errorQueryLotLayerById")[0].childNodes[0].nodeValue);
	  });	  
  }
  
  // Replaces LCS ...3/15/2013
//function to set height for parcel data container
  /*function SetHeightParcelData() {
      var height = (isMobileDevice) ? dojo.window.getBox().h : dojo.coords(dojo.byId('divParcelScrollContent')).h;
      if (isMobileDevice) {
          dojo.byId('divParcelDataScrollContainer').style.height = (height) + "px";
      }
      setTimeout(function () {
          CreateScrollbar(dojo.byId("divParcelDataScrollContainer"), dojo.byId("divParcelScrollContent"));
      }, 1000);
  }*/


  
//function to set height for parcel data container
  function SetHeightParcelData() {
      var height = (isMobileDevice) ? dojo.window.getBox().h : dojo.coords(dojo.byId('divParcelScrollContent')).h;

      if (isMobileDevice) {
          dojo.byId('divParcelDataScrollContainer').style.height = (height - 105) + "px";
        //  dojo.byId('divNeighborhoodContainer').style.height = (height - 105) + "px";
          //dojo.byId('divBroadbandContainer').style.height = (height - 105) + "px";
      }
      setTimeout(function () {
          CreateScrollbar(dojo.byId("divParcelDataScrollContainer"), dojo.byId("divParcelScrollContent"));
          //CreateScrollbar(dojo.byId("divBroadbandContainer"), dojo.byId("divBroadbandContent"));
          //CreateScrollbar(dojo.byId("divNeighborhoodContainer"), dojo.byId("divNeighborhoodContent"));
      }, 1000);
  }

  
  
  

  function mapResizeOther(){
    // resize function called when the html body element is resized. Firefox
	// Case
    if (dojo.isIE) {
      // do nothing for IE
    }
    else {
      // Non-IE
      if(map){
        map.reposition();
        map.resize();
      }
    }
  }
  function mapResize(){
    // resize function called when the html mapArea/borderContainer element is
	// resized. Internet Explorer Case
    if (dojo.isIE) {
      // IE - resize
      if(map){
        map.reposition();
        map.resize();
      }
    }
    else {
      // do nothing
    }
  }

  function formatNumber(theValue){
    // format number values as whole numbers with thousands separators
    var x, x1, x2;
    if( theValue != undefined){
      var nStr = parseFloat(theValue).toFixed(0).toString();
      nStr += '';
      x = nStr.split('.');
      x1 = x[0];
      x2 = x.length > 1 ? '.' + x[1] : '';
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
    else return "";
  }


// Added 3/5/2012...LCS
  
  function formatDate(theValue){
  	// **** Modified 10/12/2011, by LCS ***
  
    var strDate;
     if( theValue != undefined){
       var d = new Date(theValue);
	   var strDay = d.getUTCDate();
	   var strMonth = d.getUTCMonth()+1;
	   var strYear = d.getUTCFullYear();
	   
       strDate  = strMonth + "/" + strDay + "/" + strYear;
	
       return strDate
     }
     else return "";
		
		
	
  }




  function help(){
    // open a new window with appName + Help.pdf
    var urlStr = insertIntoHtmlURL("Help.pdf");
    window.open(urlStr);
  }

  function insertIntoHtmlURL(addString){
    // insert the supplied string into the html appname URL.
    var urlStr = appFolder + addString;
    return(urlStr);
  }

  function getExtentString(){
    // get the extent of the current map and convert to a string
	// xmin,ymin,xmax,ymax
    var extString = map.extent.xmin.toString() + ",";
    extString += map.extent.ymin.toString() + ",";
    extString += map.extent.xmax.toString() + ",";
    extString += map.extent.ymax.toString();
    return(extString);

  }


  function getExtentString2(){
    // get the extent of the current map and convert to a string
	// xmin,ymin,xmax,ymax
    // this trims off trailing decimal spaces - good for feet, not good for
	// decimal degrees
    var val = [];
    var extString = "";
    val = map.extent.xmin.toString().split(".");
    extString += val[0] + ",";
    val = map.extent.ymin.toString().split(".");
    extString += val[0] + ",";
    val = map.extent.xmax.toString().split(".");
    extString += val[0] + ",";
    val = map.extent.ymax.toString().split(".");
    extString += val[0];
    return(extString);
  }



  function getFieldValue(graphic,fieldName){
    // return the value of a named field
    var res = esri.substitute(graphic.attributes,"${" + fieldName + "}");
    return(res);
  }

  function getMapName(){
    // get the short name of the map service using the url for mapName
    var strArray = mapName.url.split("/");
    if(strArray.length >= 2)
      return(strArray[strArray.length-2]);
    else
      return(null);
  }

  function getUrlName(layer){
    // get the short name of the layer using the url
    var strArray = layer.url.split("/");
    if(strArray.length >= 2)
      return(strArray[strArray.length-2]);
    else
      return(null);
  }

 

  function setButtonColor(num){
    // set the button color/focus for the selected map button
    var mapHtmlId;
    for (var j = 0, jl = map.layerIds.length; j < jl; j++) {
      mapHtmlId = dojo.byId("mapButton" + j);
      if(mapHtmlId != null){
        mapHtmlId.style.color = "#999999"
      }
    }
    mapHtmlId = dojo.byId("mapButton" + num);
    if(mapHtmlId != null){
      // mapHtmlId.style.backgroundImage =
		// "url('./graphics/mapButtonPressed.gif')";
      mapHtmlId.style.color = "#03336f";
      mapHtmlId.focus();
    }
  }

  function onHidePopup(){
    // when the popup is hidden/closed, clear map graphics
    if( map.graphics != null){
      map.graphics.clear();
    }
  }

  function hidePopup(){
    // when the popup is hidden/closed, clear map graphics
    if( map.graphics != null){
      map.graphics.clear();
    }
    if (map.infoWindow != null) {
      map.infoWindow.hide();
    }
    featureID = null;
  }
  
 
  
  
