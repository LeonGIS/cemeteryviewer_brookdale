var isOrientationChanged = false;
var tinyResponse; //variable for storing the response getting from tiny url api
var tinyUrl; //variable for storing the tiny url

//function to handle orientation change event 
function OrientationChanged() {
    map.infoWindow.hide();
    if (map) {
        isOrientationChanged = true;
        var timeout = (isMobileDevice && isiOS) ? 100 : 500;
        setTimeout(function () {
            if (isMobileDevice) {
                map.reposition();
                map.resize();
                SetHeightAddressResults();
                SetHeightParcelData();
                SetHeightSplashScreen();
               // SetHeightFeatureData();
               // FixTabWidth();
                setTimeout(function () {
                    if (selectedGraphic) {
                        map.setExtent(GetMobileMapExtent(selectedGraphic));
                    }
                    isOrientationChanged = false;
                }, 500);

            }
            else {
                SetHeightAddressResults();

                setTimeout(function () {
                    if (selectedGraphic) {
                        map.setExtent(GetBrowserMapExtent(selectedGraphic));
                    }
                    SetHeightParcelData();
                    isOrientationChanged = false;
                }, 500);

            }
        }, timeout);
    }
}

//function to handle resize browser event handler
function resizeHandler() {
    if (map) {
        map.reposition();
        map.resize();
    }
}

//function to fix tab width
function FixTabWidth() {
    if (isMobileDevice) {
        setTimeout(function () {
            var tabWidth = Math.round(dojo.window.getBox().w / 3);
            dojo.byId('divTabBar').style.width = Math.round(dojo.window.getBox().w - 20) + "px";
            dojo.query('.mblTabButton', dojo.byId('divTabBar')).forEach(function (node, idx, arr) {
                node.style.width = (tabWidth - 14) + "px";
            });
        }, 500);
    }
}

//function to get the extent based on the mappoint for mobile devices
function GetMobileMapExtent(mapPoint) {
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

//function to get the extent based on the mappoint 
function GetBrowserMapExtent(mapPoint) {
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

//Function to get map Extent
function GetMapExtent() {
    var extents = map.extent.xmin.toString() + ",";
    extents += map.extent.ymin.toString() + ",";
    extents += map.extent.xmax.toString() + ",";
    extents += map.extent.ymax.toString();
    return (extents);
}

//function to hide splash screen container
function HideSplashScreenMessage() {
    if (dojo.isIE < 9) {
        dojo.byId("divSplashScreenDialog").style.display = "none";
    }
    dojo.addClass('divSplashScreenContainer', "opacityHideAnimation");
    dojo.replaceClass("divSplashScreenDialog", "hideContainer", "showContainer");
    window.onkeydown = null;
    dojo.byId('txtSearchBox').readOnly = false;
    dojo.connect(dojo.byId("txtSearchBox"), 'onkeypress', function (evt) {
        key = evt.keyCode;
        if (key == dojo.keys.ENTER) {
            dojo.byId("txtSearchBox").blur();
            SearchBurialTable();
        }
    });
}

//function to set height for splash screen
function SetHeightSplashScreen() {
    var height = (isMobileDevice) ? (dojo.window.getBox().h - 110) : (dojo.coords(dojo.byId('divSplashScreenDialog')).h - 80);
    dojo.byId('divSplashContent').style.height = (height + 10) + "px";
    CreateScrollbar(dojo.byId("divSplashContainer"), dojo.byId("divSplashContent"));
}


//function to show progress indicator 
function ShowProgressIndicator(nodeId) {
    dojo.byId('divLoadingIndicator').style.display = "block";
}

//function to hide progress indicator
function HideProgressIndicator() {
    dojo.byId('divLoadingIndicator').style.display = "none";
}

//function to locate using GPS
function ShowMyLocation() {
    map.getLayer(tempLayerId).clear();
    navigator.geolocation.getCurrentPosition(
		function (position) {
		    ShowProgressIndicator('map');
		    var mapPoint = new esri.geometry.Point(position.coords.longitude, position.coords.latitude, new esri.SpatialReference({ wkid: 4326 }));
		    var graphicCollection = new esri.geometry.Multipoint(new esri.SpatialReference({ wkid: 4326 }));
		    graphicCollection.addPoint(mapPoint);
		    geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
		        HideProgressIndicator();

		        // Get Cemetery layer full extent
		      //  var plotLayer = map.getLayer(cemeteryKey)
		      //  if (!plotLayer.fullExtent.contains(newPointCollection[0].getPoint(0))) {
		        if (!mapExtent.contains(newPointCollection[0].getPoint(0))) {
		      //  if (!map.getLayer(layers[0].Key).fullExtent.contains(newPointCollection[0].getPoint(0))) {
		           alert(messages.getElementsByTagName("outsideArea")[0].childNodes[0].nodeValue);
		            return;
		        }
		        mapPoint = newPointCollection[0].getPoint(0);
		        map.centerAt(mapPoint);
		        var symbol = new esri.symbol.PictureMarkerSymbol(geolocatedImage, 25, 25);
		        var graphic = new esri.Graphic(mapPoint, symbol, null, null);
		        map.getLayer(tempLayerId).add(graphic);
		     //   LocateParcelonMap(null, mapPoint);
		        ShowFeatureInfoWindow2(mapPoint);
		    });
		},
		function (error) {
		    HideProgressIndicator();
		    switch (error.code) {
		        case error.TIMEOUT:
		            alert(messages.getElementsByTagName("timeOut")[0].childNodes[0].nodeValue);
		            break;
		        case error.POSITION_UNAVAILABLE:
		            alert(messages.getElementsByTagName("positionUnavailable")[0].childNodes[0].nodeValue);
		            break;
		        case error.PERMISSION_DENIED:
		            alert(messages.getElementsByTagName("permissionDenied")[0].childNodes[0].nodeValue);
		            break;
		        case error.UNKNOWN_ERROR:
		            alert(messages.getElementsByTagName("unknownError")[0].childNodes[0].nodeValue);
		            break;
		    }
		}, { timeout: 5000 });
}

//Function to get the query string value of the provided key if not found the function returns empty string
function GetQuerystring(key) {
    var _default;
    if (_default == null) _default = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);
    if (qs == null)
        return _default;
    else
        return qs[1];
}

//function to convert string to bool
String.prototype.bool = function () {
    return (/^true$/i).test(this);
};

//function to trim string   
String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ''); }

//Function to append ... for a string
String.prototype.trimString = function (len) {
    return (this.length > len) ? this.substring(0, len) + "..." : this;
}

//Creating dynamic scrollbar within container for target content
var scrolling = false; //flag to detect is touchmove event scrolling div

function CreateScrollbar(container, content) {
    var yMax;
    var pxLeft, pxTop, xCoord, yCoord;
    var scrollbar_track;
    var isHandleClicked = false;
    this.container = container;
    this.content = content;
    content.scrollTop = 0;
    if (dojo.byId(container.id + 'scrollbar_track')) {
        RemoveChildren(dojo.byId(container.id + 'scrollbar_track'));
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
    if (!dojo.byId(container.id + 'scrollbar_track')) {
        scrollbar_track = document.createElement('div');
        scrollbar_track.id = container.id + "scrollbar_track";
        scrollbar_track.className = "scrollbar_track";
    }
    else {
        scrollbar_track = dojo.byId(container.id + 'scrollbar_track');
    }

    var containerHeight = dojo.coords(container);
    if (containerHeight.h > 0) {
        scrollbar_track.style.height = (containerHeight.h - 6) + "px";
    }
    else {
        scrollbar_track.style.height = (containerHeight.h) + "px";
    }
    scrollbar_track.style.right = 0 + 'px';

    var scrollbar_handle = document.createElement('div');
    scrollbar_handle.className = 'scrollbar_handle';
    scrollbar_handle.id = container.id + "scrollbar_handle";

    scrollbar_track.appendChild(scrollbar_handle);
    container.appendChild(scrollbar_track);

    if (content.scrollHeight <= content.offsetHeight) {
        scrollbar_handle.style.display = 'none';
        scrollbar_track.style.display = 'none';
        return;
    }
    else {
        scrollbar_handle.style.display = 'block';
        scrollbar_track.style.display = 'block';
        scrollbar_handle.style.height = Math.max(this.content.offsetHeight * (this.content.offsetHeight / this.content.scrollHeight), 25) + 'px';
        yMax = this.content.offsetHeight - scrollbar_handle.offsetHeight;
        yMax = yMax - 5; //for getting rounded bottom of handel
        if (window.addEventListener) {
            content.addEventListener('DOMMouseScroll', ScrollDiv, false);
        }

        content.onmousewheel = function (evt) {
            console.log(content.id);
            ScrollDiv(evt);
        }
    }

    function ScrollDiv(evt) {
        var evt = window.event || evt //equalize event object
        var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta //delta returns +120 when wheel is scrolled up, -120 when scrolled down
        pxTop = scrollbar_handle.offsetTop;

        if (delta <= -120) {
            var y = pxTop + 10;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
        else {
            var y = pxTop - 10;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = (y - 2) + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    }

    //Attaching events to scrollbar components
    scrollbar_track.onclick = function (evt) {
        if (!isHandleClicked) {
            evt = (evt) ? evt : event;
            pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
            var offsetY;
            if (!evt.offsetY) {
                var coords = dojo.coords(evt.target);
                offsetY = evt.layerY - coords.t;
            }
            else
                offsetY = evt.offsetY;
            if (offsetY < scrollbar_handle.offsetTop) {
                scrollbar_handle.style.top = offsetY + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else if (offsetY > (scrollbar_handle.offsetTop + scrollbar_handle.clientHeight)) {
                var y = offsetY - scrollbar_handle.clientHeight;
                if (y > yMax) y = yMax // Limit vertical movement
                if (y < 0) y = 0 // Limit vertical movement
                scrollbar_handle.style.top = y + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else {
                return;
            }
        }
        isHandleClicked = false;
    };

    //Attaching events to scrollbar components
    scrollbar_handle.onmousedown = function (evt) {
        isHandleClicked = true;
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
        pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
        yCoord = evt.screenY // Vertical mouse position at start of slide.
        document.body.style.MozUserSelect = 'none';
        document.body.style.userSelect = 'none';
        document.onselectstart = function () {
            return false;
        }
        document.onmousemove = function (evt) {
            evt = (evt) ? evt : event;
            evt.cancelBubble = true;
            if (evt.stopPropagation) evt.stopPropagation();
            var y = pxTop + evt.screenY - yCoord;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = (y - 2) + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    };

    document.onmouseup = function () {
        document.body.onselectstart = null;
        document.onmousemove = null;
    };

    scrollbar_handle.onmouseout = function (evt) {
        document.body.onselectstart = null;
    };

    var startPos;
    var scrollingTimer;

    dojo.connect(container, "touchstart", function (evt) {
        touchStartHandler(evt);
    });

    dojo.connect(container, "touchmove", function (evt) {
        touchMoveHandler(evt);
    });

    dojo.connect(container, "touchend", function (evt) {
        touchEndHandler(evt);
    });

    //Handlers for Touch Events
    function touchStartHandler(e) {
        startPos = e.touches[0].pageY;
    }

    function touchMoveHandler(e) {
        var touch = e.touches[0];
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
        e.preventDefault();

        pxTop = scrollbar_handle.offsetTop;
        var y;
        if (startPos > touch.pageY) {
            y = pxTop + 10;
        }
        else {
            y = pxTop - 10;
        }

        //setting scrollbar handel
        if (y > yMax) y = yMax // Limit vertical movement
        if (y < 0) y = 0 // Limit vertical movement
        scrollbar_handle.style.top = y + "px";

        if (y == 0) {
            content.scrollTop = 0;
        }
        else {
            //setting content position
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
        scrolling = true;
        startPos = touch.pageY;
    }

    function touchEndHandler(e) {
        scrollingTimer = setTimeout(function () { clearTimeout(scrollingTimer); scrolling = false; }, 100);
    }
    //touch scrollbar end 
}

//Function for removing child elements from a container
function RemoveChildren(parentNode) {
    while (parentNode.hasChildNodes()) {
        parentNode.removeChild(parentNode.lastChild);
    }
}

//function to remove scroll bar
function RemoveScrollBar(container) {
    if (dojo.byId(container.id + 'scrollbar_track')) {
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
}



//function for showing search panel
function ShowSearchPanel() {
   // dojo.replaceClass("divShareContainer", "hideContainerHeight", "showContainerHeight");
   // dojo.byId('divShareContainer').style.height = '0px';
   // dojo.replaceClass("divLayerContainer", "hideContainerHeight", "showContainerHeight");
   // dojo.byId('divLayerContainer').style.height = '0px';
    if (isMobileDevice) {
        SetHeightAddressResults();
        dojo.byId('divAddressContainer').style.display = "block";
        dojo.replaceClass("divAddressContainer", "opacityShowAnimation", "opacityHideAnimation");
        dojo.replaceClass("divAddressContent", "showContainer", "hideContainer");
    }
    else {
        SetHeightAddressResults();
        ResetData();
        dojo.byId("divAddressSearch").style.display = "block";
   //     dojo.byId("divFeedback").style.display = "none";
    //    dojo.byId("divShoppingCart").style.display = "none";
     //   dojo.byId("divCreatePropertyReport").style.display = "none";
    }
}

//function to hide address container
function HideAddressContainer() {
    if (isMobileDevice) {
        RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
        dojo.replaceClass("divAddressContainer", "opacityHideAnimation", "opacityShowAnimation");
        dojo.replaceClass("divAddressContent", "hideContainer", "showContainer");
    }
}

//function to hide address container
function HideInfoWindowDataContainer() {
    dojo.replaceClass("divInfoWindowContainer", "opacityHideAnimation", "opacityShowAnimation");
    dojo.replaceClass("divInfoWindowContent", "hideContainer", "showContainer");
}

//function to create checkbox
function CreateCheckBox(layerId, chkBoxValue, isChecked) {
    var cb = document.createElement("img");
    cb.id = "chk" + layerId;
    if (isMobileDevice) {
        cb.style.width = "44px";
        cb.style.height = "44px";
    }
    else {
        cb.style.width = "20px";
        cb.style.height = "20px";
    }
    if (isChecked) {
        cb.src = "images/checked.png";
        cb.setAttribute("state", "check");
    }
    else {
        cb.src = "images/unchecked.png";
        cb.setAttribute("state", "uncheck");
    }
    cb.setAttribute("value", chkBoxValue);
    cb.setAttribute("layerId", layerId);
    return cb;
}


//function to get layerinfo based on key
function GetLayerInfo(key) {
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].Key == key)
            return i;
    }
}

//function to set height for parcel data container
function SetHeightFeatureData() {
    var height = (isMobileDevice) ? dojo.window.getBox().h : dojo.coords(dojo.byId('divFeatureDataScrollbarContent')).h;

    if (isBrowser) {
        dojo.byId('divFeatureDataScrollbarContainer').style.height = (height - 2) + "px";
    }
    if (isMobileDevice) {
        dojo.byId('divFeatureDataScrollbarContainer').style.height = (height - 75) + "px";
    }
    setTimeout(function () {
        CreateScrollbar(dojo.byId("divFeatureDataScrollbarContainer"), dojo.byId("divFeatureDataScrollbarContent"));
    }, 500)

}

//function to get MaxOffSet
function MaxOffSet() {
    return Math.floor(map.extent.getWidth() / map.width);
}

//function to get extent from point for querying
function ExtentFromPoint(point) {
    var tolerance = (MaxOffSet() < 10) ? 10 : MaxOffSet();
    if (isMobileDevice) {
        tolerance = (MaxOffSet() < 15) ? 15 : MaxOffSet();
    }
    var screenPoint = map.toScreen(point);
    var pnt1 = new esri.geometry.Point(screenPoint.x - tolerance, screenPoint.y + tolerance);
    var pnt2 = new esri.geometry.Point(screenPoint.x + tolerance, screenPoint.y - tolerance);
    var mapPoint1 = map.toMap(pnt1);
    var mapPoint2 = map.toMap(pnt2);
    return new esri.geometry.Extent(mapPoint1.x, mapPoint1.y, mapPoint2.x, mapPoint2.y, map.spatialReference);
}

var layerCount = 0;
var responseCount = 0;

//function to populate sales/foreclosure data
function ShowFeatureInfoWindow(mapPoint) {
    layerCount = 0;
    responseCount = 0;
    map.infoWindow.hide();
    selectedGraphic = null;
    map.getLayer(tempLayerId).clear();
    map.getLayer(tempParcelLayerId).clear();
    RemoveScrollBar(dojo.byId("divParcelDataScrollContainer"));
    dojo.byId("divFeatureDataScrollbarContainer").style.display = "block";
    RemoveChildren(dojo.byId('divFeatureDataScrollbarContent'));
    dojo.query('img[state = "check"]', dojo.byId('divLayers')).forEach(function (node, index, arr) {
        layerCount++;
        QueryLayer(node, mapPoint);
    });
}



//function to query data
function QueryLayer(node, mapPoint) {
    var layerInfo = layers[GetLayerInfo(node.getAttribute("layerId"))];
    var queryTask = new esri.tasks.QueryTask(layerInfo.ServiceURL);
    var query = new esri.tasks.Query();
    query.outSpatialReference = map.spatialReference;
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.geometry = ExtentFromPoint(mapPoint);
    query.maxAllowableOffset = MaxOffSet();
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    queryTask.execute(query, function (results) {
        responseCount++
        if (results.features.length == 0) {
            if (layerCount == responseCount) {
                LocateParcelonMap(null, mapPoint);
            }
            return;
        }
        responseCount = 0;
        selectedGraphic = results.features[0].geometry;
        RemoveChildren(dojo.byId('divFeatureDataScrollbarContent'));
        var table = document.createElement("table");
        table.style.width = "95%";
        table.style.height = "100%";
        table.style.textAlign = "left";
        dojo.byId("divFeatureDataScrollbarContent").appendChild(table);
        var tbody = document.createElement("tbody");
        table.appendChild(tbody);
        var resultSet = results.features[0];

        for (var attr in resultSet.attributes) {
            if (!resultSet.attributes[attr]) {
                resultSet.attributes[attr] = "";
            }
        }

        for (var index in layerInfo.Fields) {
            var tr = document.createElement("tr");
            tbody.appendChild(tr);
            var td = document.createElement("td");
            td.innerHTML = layerInfo.Fields[index].DisplayText;
            var td1 = document.createElement("td");
            td1.className = "tdWordBreak";
            var value = dojo.string.substitute(layerInfo.Fields[index].FieldName, resultSet.attributes);
            if (layerInfo.Fields[index].isDate) {
                var date = new js.date();
                var utcMilliseconds = Number(dojo.string.substitute(layerInfo.Fields[index].FieldName, resultSet.attributes));
                td1.innerHTML = dojo.date.locale.format(date.utcTimestampFromMs(utcMilliseconds), { datePattern: datePattern, selector: "date" });
            }
            else if (layerInfo.Fields[index].DataType == "double") {
                var formattedValue = dojo.number.format(value, { pattern: "#,##0.##" });
                td1.innerHTML = currency + " " + formattedValue;
            }
            else {
                td1.innerHTML = dojo.string.substitute(layerInfo.Fields[index].FieldName, resultSet.attributes);
            }
            tr.appendChild(td);
            tr.appendChild(td1);
        }
        var screenPoint;
        dojo.byId('tdFeatureHeading').innerHTML = layerInfo.Title;
        (isMobileDevice) ? map.setExtent(GetMobileMapExtent(selectedGraphic)) : map.setExtent(GetBrowserMapExtent(mapPoint));
        setTimeout(function () {
            if (isMobileDevice) {
                map.infoWindow.setTitle("");
                map.infoWindow.setContent("");
                setTimeout(function () {
                    var screenPoint;
                    screenPoint = map.toScreen(selectedGraphic);
                    screenPoint.y = map.height - screenPoint.y;
                    map.infoWindow.resize(225, 65);
                    map.infoWindow.show(screenPoint);
                    map.infoWindow.setTitle(dojo.string.substitute(infoWindowHeader, resultSet.attributes).trimString(20));
                    map.infoWindow.setContent(dojo.string.substitute(infoWindowContent, resultSet.attributes));
                    dojo.connect(map.infoWindow.imgDetailsInstance(), "onclick", function () {
                        dojo.byId('divFeatureInformation').style.display = "block";
                        dojo.replaceClass("divFeatureInformation", "opacityShowAnimation", "opacityHideAnimation");
                        dojo.addClass("divFeatureInformation", "divFeatureInformation");
                        dojo.replaceClass("divFeatureInfoWindow", "showContainer", "hideContainer");
                        dojo.addClass("divFeatureInfoWindow", "divFeatureInfoWindow");
                        SetHeightFeatureData();
                    });
                });
            }
            else {
                map.infoWindow.resize(330, 270);
                screenPoint = map.toScreen(mapPoint);
                screenPoint.y = map.height - screenPoint.y;
                map.infoWindow.show(screenPoint);
                map.infoWindow.setTitle("");
                map.infoWindow.reSetLocation(screenPoint);
                dojo.byId('divFeatureInfoWindow').style.display = "block";

            }
           // SetHeightFeatureData();
        }, 100);
    }, function (err) {
    });
}

//function to hide parcel information
function HideParcelInformationContainer() {
    if (isMobileDevice) {
        dojo.replaceClass("divParcelInformation", "opacityHideAnimation", "opacityShowAnimation");
        dojo.replaceClass("divParcelInfoWindow", "hideContainer", "showContainer");
    }
    else {
        map.infoWindow.hide();
        selectedGraphic = null;
    }
}

//function to hide feature information
function HideFeatureInformationContainer() {
    if (isMobileDevice) {
        dojo.replaceClass("divFeatureInformation", "opacityHideAnimation", "opacityShowAnimation");
        dojo.replaceClass("divFeatureInfoWindow", "hideContainer", "showContainer");
    }
    else {
        map.infoWindow.hide();
        selectedGraphic = null;
        dojo.byId('divFeatureInfoWindow').style.display = "none";
    }
}





function JSONstringify(obj) {
    var t = typeof (obj);
    if (t != "object" || obj === null) {
        // simple data type
        if (t == "string") obj = '"' + obj + '"';
        return String(obj);
    }
    else {
        // array or object
        var n, v, json = [], arr = (obj && obj.constructor == Array);
        for (n in obj) {
            v = obj[n];
            t = typeof (v);
            if (t == "string") v = '"' + v + '"';
            else if (t == "object" && v !== null) v = JSONstringify(v);
            json.push((arr ? "" : '"' + n + '":') + String(v));
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
}







//function to trim string
String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ''); }


//function for reseting data
function ResetData() {
   // ShowSpanErrorMessage("spanServiceErrorMessage", "");

    map.getLayer(tempLayerId).clear();
   // dojo.byId("btnDrawFeedback").innerHTML = "Draw";
   // dojo.byId("txtSelectedRequest").value = "";
   // dojo.byId('txtComment').value = "";
   // dojo.byId('txtName').value = "";
   // dojo.byId('txtPhone').value = "";
   // dojo.byId('txtMail').value = "";
   // dojo.byId("trDraw").style.display = "none";
   // dojo.byId("trDrawFeedback").style.display = "block";
   // draw = false;
   // tb.deactivate();
}

//Function for validating Email in comments tab
function CheckMailFormat(emailValue) {
    var pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailValue.length <= 149 && pattern.test(emailValue);
}

//function to validate name
function IsName(name) {
    var namePattern = /^[A-Za-z\.\-\, ]{1,150}$/;
    if (namePattern.test(name)) {
        return true;
    } else {
        return false;
    }
}

//function to validate number
function IsNumber(number) {
    var regexObj = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (regexObj.test(number)) {
        var formattedPhoneNumber = number.replace(regexObj, "($1) $2-$3");
        return true;
    } else {
        return false;
    }
}

//function to validate data
function ValidateData() {
    dojo.byId("spanServiceErrorMessage").style.display = "none";
    if (dojo.byId("txtSelectedRequest").value.trim() == "") {
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("selectFeedbackType")[0].childNodes[0].nodeValue);

        return false;
    }
    if (map.getLayer(tempLayerId).graphics.length == 0) {
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("selectArea")[0].childNodes[0].nodeValue);
        return false;
    }

    if (dojo.byId('txtComment').value.trim() == "") {
        dojo.byId('txtComment').focus();
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("enterComments")[0].childNodes[0].nodeValue);
        return false;
    }
    if (dojo.byId('txtComment').value.trim().length > 0 && dojo.byId('txtComment').value.trim().length > 255) {
        dojo.byId('txtComment').focus();
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("commentsExceeds")[0].childNodes[0].nodeValue);
        return false;
    }

    if (dojo.byId('txtName').value.trim().length > 0 && !IsName(dojo.byId('txtName').value.trim())) {
        dojo.byId('txtName').focus();
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("nameProvisions")[0].childNodes[0].nodeValue);
        return false;
    }


    if (dojo.byId('txtPhone').value.trim().length > 0 && !IsNumber(dojo.byId('txtPhone').value.trim())) {
        dojo.byId('txtPhone').focus();
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("enterValidPhone")[0].childNodes[0].nodeValue);
        return false;
    }

    if (dojo.byId('txtMail').value.trim().length > 0 && !CheckMailFormat(dojo.byId('txtMail').value)) {
        dojo.byId('txtMail').focus();
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("enterValidMail")[0].childNodes[0].nodeValue);
        return false;
    }
    return true;
}

//function to show error message span
function ShowSpanErrorMessage(controlId, message) {
    dojo.byId(controlId).style.display = "block";
    dojo.byId(controlId).innerHTML = message;
}



//function to fix tokens. Appending $ to the string for dojo.string.replace
function FixTokens(value) {
    return value.replace(/(\{[^\{\r\n]+\})/g, "$$$1");
}


