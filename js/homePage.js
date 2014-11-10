﻿/*global */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*
 | Copyright 2013 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
dojo.require("esri.map");
dojo.require("mobile.InfoWindow");
dojo.require("esri.tasks.geometry");
dojo.require("esri.tasks.query");
dojo.require("dojox.mobile.parser");
dojo.require("dojox.mobile");
dojo.require("esri.tasks.locator");
dojo.require("dojo.string");
dojo.require("dojo.date.locale");
dojo.require("esri.tasks.find");
dojo.require("esri.layers.FeatureLayer");
dojo.require("dojox.mobile.TabBar");
dojo.require("esri.toolbars.draw");
dojo.require('dojox.charting.Chart2D');
dojo.require('dojox.charting.widget.Chart2D');
dojo.require('dojox.charting.Chart');
dojo.require("esri.tasks.gp");
dojo.require("js.config");
dojo.require("dojo.number");
dojo.require("dojo.DeferredList");
dojo.require("js.date");
dojo.require("esri.dijit.Print");

var map; //variable to store map object
var tempLayerId = "tempLayerID"; //variable to store temporary graphics layer id
var tempParcelLayerId = "tempParcelLayerID"; //variable to store temporary graphics parcel layer id
var isMobileDevice = false; //This variable will be set to 'true' when application is accessed from mobile phone device
var layersCounter = 0; //variable to store counter for layers
var mapPoint; //variable to store map point
var isiOS = false; //This variable will be set to 'true' if the application is accessed from iPhone or iPad
var isBrowser = false; //This variable will be set to 'true' when application is accessed from desktop browsers
var isTablet = false; //This variable will be set to 'true' when application is accessed from tablet device
var selectedGraphic; //variable to store selected graphic on map
var tb, drawTool, feedbackItem; //variable to feedback control events and items
var polygonFillSymbol; //variable to store fill symbol for polygon
var neighbourHoodLayerInfo; //variable to store neighborhood layer information
var currentBaseMap; //variable to store the current visible basemap key
var pdfData = {}; //Array to store the data required for PDF generation
var mapScale; //variable to store the scale level of map while generation of PDF
var reportGPService; //variable to store the geoprocessing task service for generation of reports
var propertyReportPrice; //variable to store property price for report
var propertyMapPrice; //variable to store property price for map
var webMapId; //variable to store webmap ID
var feedbackAttributes; //variable to store information about feedback
var datePattern; //variable to store pattern for date
var infoWindowHeader; //variable used to store the info window header
var downloadSpeed; //variable used to store download speed
var broadBandService; //variable used to store the broadband service information
var feedbackLayer; //variable used to store the feedback layer information
var layers; //variable used to store the sales/foreclosure layer information
var currency; //variable used to store type of currency
var paypalcurrency; //variable used to store currency code for paypal
var baseMapLayers; //Variable for storing base map layers
var mapSharingOptions; //variable for storing the tiny service URL
var infoWindowContent; //variable used to store the info window content
var draw = false; //flag set to draw polygons
var selectedParcel; //variable to store selected parcel
var selectedFeature; //variable to store selected feature
var parcelAttributeID; //variable to store parcel field
var showNullValueAs; //variable to store the default value for replacing null values
var selectedAddressColor; //variable to store highlight color for selected address
var taxParcelId; //variable to store Tax parcel display text
var geolocatedImage; //variable to store image path for geolocation
var printTaskURL; //variable to store the print task service URL for generation of reports
var lastSearchString; //variable to store the last search string value
var stagedSearch; //variable to store the time limit for search
var lastSearchTime; //variable to store the time of last searched value

function init() {
    var featureLayerDeferedArray = [];
    window.onkeydown = function (e) {
        return !((e.keyCode == 9) || (e.keyCode == 13));
    };

    if (!Modernizr.geolocation) {
        dojo.byId("tdGPS").style.display = "none";
    }

    dojo.xhrGet({
        url: "errorMessages.xml",
        handleAs: "xml",
        preventCache: true,
        load: function (xmlResponse) {
            messages = xmlResponse;
        }
    });


    esriConfig.defaults.io.proxyUrl = "proxy/proxy.ashx"; //relative path
    esriConfig.defaults.io.alwaysUseProxy = false;
    esriConfig.defaults.io.timeout = 180000;    //ersi request timeout value
    esriConfig.defaults.io.postLength = 512;

    var responseObject = new js.config();

    propertyReportPrice = responseObject.PropertyReportPrice;
    propertyMapPrice = responseObject.PropertyMapPrice;
    webMapId = responseObject.WebMapId;
    feedbackAttributes = responseObject.FeedbackAttributes;
    datePattern = responseObject.DatePattern;
    infoWindowHeader = responseObject.InfoWindowHeader;
    infoWindowContent = responseObject.InfoWindowContent;
    downloadSpeed = responseObject.DownloadSpeed;
    broadBandService = responseObject.BroadBandService;
    feedbackLayer = responseObject.FeedbackLayer;
    layers = responseObject.Layers;
    currency = responseObject.Currency;
    paypalcurrency = responseObject.PayPalCurrencyCode;
    baseMapLayers = responseObject.BaseMapLayers;
    mapSharingOptions = responseObject.MapSharingOptions;
    parcelAttributeID = responseObject.ParcelIdAttribute;
    showNullValueAs = responseObject.ShowNullValueAs;
    selectedAddressColor = responseObject.SelectedAddressColor;
    taxParcelId = responseObject.TaxParcelId;
    dojo.byId("taxParcelIdMap").innerHTML = taxParcelId;
    dojo.byId("TaxParcelIdReport").innerHTML = taxParcelId;
    geolocatedImage = responseObject.GeolocatedImage;
    printTaskURL = responseObject.PrintTaskURL;

    if (!responseObject.ParcelMarkups) {
        dojo.byId("tdParcelMarkUp").style.display = "none";
    }

    if (propertyReportPrice == 0 && propertyMapPrice == 0) {
        dojo.byId('tcShoppingCartContainer').style.display = 'none';
        dojo.byId("divShareContainer").style.right = "20px";
    }
    var userAgent = window.navigator.userAgent;
    if (userAgent.indexOf("iPhone") >= 0 || userAgent.indexOf("iPad") >= 0) {
        isiOS = true;
    }

    if ((userAgent.indexOf("Android") >= 0 && userAgent.indexOf("Mobile") >= 0) || userAgent.indexOf("iPhone") >= 0) {
        fontSize = 15;
        isMobileDevice = true;
        dojo.byId("dynamicStyleSheet").href = "styles/mobile.css";
    } else if ((userAgent.indexOf("iPad") >= 0) || (userAgent.indexOf("Android") >= 0)) {
        fontSize = 14;
        isTablet = true;
        dojo.byId("dynamicStyleSheet").href = "styles/tablet.css";
    } else {
        fontSize = 11;
        isBrowser = true;
        dojo.byId("dynamicStyleSheet").href = "styles/browser.css";
    }
    dojo.byId("divSplashContent").style.fontSize = fontSize + "px";

    if (isMobileDevice) {
        dojo.byId('divSidePanel').style.display = 'none';
        dojo.byId('divAddressResultContainer').appendChild(dojo.byId('tblAddressSearch'));
        dojo.byId('divAddressContainer').style.display = "none";
        dojo.replaceClass("divAddressContainer", "", "opacityHideAnimation");
        dojo.byId("tdHelp").style.display = "none";
        dojo.byId('divSplashScreenDialog').style.width = "95%";
        dojo.byId('divSplashScreenDialog').style.height = "95%";
        dojo.byId('divParcelInformation').style.display = "none";
        dojo.byId('divParcelInformation').className = "";
        dojo.byId('divFeatureInformation').style.display = "none";
        dojo.byId('divFeatureInformation').className = "";
        dojo.byId("lblAppName").style.display = "none";
        dojo.byId("lblAppName").style.width = "80%";
        dojo.byId("divLogo").style.display = "none";
        dojo.byId("tblLayers").style.display = "none";
        dojo.byId("imgBaseMap").src = "images/layers.png";
    }
    else {
        dojo.byId('divAddressSearch').appendChild(dojo.byId('tblAddressSearch'));
        dojo.byId('divSplashScreenDialog').style.width = "350px";
        dojo.byId('divSplashScreenDialog').style.height = "290px";
        dojo.byId("divLogo").style.display = "block";
        reportGPService = new esri.tasks.Geoprocessor(responseObject.ReportGPServiceURL);

        var table = document.createElement("table");
        table.style.width = "100%";
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.cellSpacing = 0;
        table.cellPadding = 0;
        for (var i = 0; i < responseObject.ReportLayouts.length; i++) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td = document.createElement("td");
            td.style.height = "25px";
            td.style.paddingLeft = "5px";
            td.align = "left";
            td.style.borderBottom = "1px solid white";
            td.style.cursor = "pointer";
            td.innerHTML = responseObject.ReportLayouts[i].DisplayText;
            td.setAttribute("value", responseObject.ReportLayouts[i].Value);
            td.onclick = function () {
                dojo.byId('txtSelectedLayout').value = this.innerHTML;
                dojo.byId('txtSelectedLayout').setAttribute("layout", this.getAttribute("value"));
                dojo.byId('divSelectedLayout').style.display = "none";
            }
            tr.appendChild(td);
        }
        dojo.byId('divlayoutContent').appendChild(table);
    }
    ShowProgressIndicator();
    dojo.byId('divSplashScreenContainer').style.display = "block";
    dojo.addClass(dojo.byId('divSplashScreenDialog'), "divSplashScreenDialogContent");
    dojo.byId('lblAppName').innerHTML = responseObject.ApplicationName;
    dojo.byId('imgApplication').src = responseObject.ApplicationIcon;
    dojo.byId('divSplashContent').innerHTML = responseObject.SplashScreenMessage;
    dojo.replaceClass("divSplashScreenDialog", "showContainer", "hideContainer");

    SetHeightSplashScreen();
    var infoWindow = new mobile.InfoWindow({
        domNode: dojo.create("div", null, dojo.byId("map"))
    });

    map = new esri.Map("map", { slider: true, infoWindow: infoWindow });
    geometryService = new esri.tasks.GeometryService(responseObject.GeometryService);
    CreateBaseMapComponent();

    //Set address search parameters
    dojo.byId("txtAddress").setAttribute("defaultAddress", responseObject.LocatorDefaultAddress);
    dojo.byId('txtAddress').value = responseObject.LocatorDefaultAddress;
    dojo.byId("txtAddress").setAttribute("defaultAddressTitle", responseObject.LocatorDefaultAddress);
    dojo.byId("txtAddress").style.color = "gray";
    dojo.connect(dojo.byId('txtAddress'), "ondblclick", ClearDefaultText);
    dojo.connect(dojo.byId('txtAddress'), "onfocus", function (evt) {
        this.style.color = "#FFF";
    });
    dojo.connect(dojo.byId('txtAddress'), "onblur", ReplaceDefaultText);

    dojo.connect(map, "onLoad", function () {
        MapInitFunction().then(function () {
            setTimeout(function () {
                HideProgressIndicator();
            }, 100);
        });
        var mapExtent = responseObject.DefaultExtent.split(',');
        var extent = GetQuerystring('extent');
        if (extent != "") {
            mapExtent = extent.split(',');
        }
        mapExtent = new esri.geometry.Extent(parseFloat(mapExtent[0]), parseFloat(mapExtent[1]), parseFloat(mapExtent[2]), parseFloat(mapExtent[3]), map.spatialReference);
        map.setExtent(mapExtent);

        var query = new esri.tasks.Query();
        query.where = "1=1";
        query.outFields = ["*"];
        query.returnGeometry = true;
        var layerTable = document.createElement("table");
        layerTable.style.width = "100%";
        var layerTbody = document.createElement("tbody");
        layerTbody.id = "outerTbody";
        layerTable.appendChild(layerTbody);
        dojo.byId('divLayers').appendChild(layerTable);
        for (var i = 0; i < layers.length; i++) {
            if (!layers[i].ParcelQuery) {
                if (!layers[i].isDynamicMapService) {
                    featureLayerDeferedArray.push(CreateFeatureLayerCheckbox(layers[i], query, i, dojo.byId('outerTbody')));
                }
            }
        }
    });

    dojo.connect(dojo.byId('help'), "onclick", function () {
        window.open(responseObject.HelpURL);
    });

    tb = new esri.toolbars.Draw(map);
    dojo.connect(tb, "onDrawEnd", finishDrawingFeedback);
    drawTool = esri.toolbars.Draw.POLYGON;
    polygonFillSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 190, 190, 0.25]));

    pdfData.isEmpty = true;
}

function CreateFeatureLayerCheckbox(featureLayer, query, count, outerTbody) {
    // A MODE_SELECTION FeatureLayer gets stuck in suspended mode at 3.1 if it is created invisible,
    // so we created it visible and then correct the visibility right after we fetch its features
    var featureId = featureLayer.Key;
    var initiallyVisible = featureLayer.isVisible;
    var featureLayerDefered = new dojo.Deferred();
    map.getLayer(featureLayer.Key).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
        if(!features || features.length === 0) {
            console.warn(featureId + ": no features found");
            return;
        } else {
            console.log(featureId + ": " + features.length + " features found");
        }

        var outerTr = document.createElement("tr");
        var outerTd = document.createElement("td");
        outerTbody.appendChild(outerTr);
        outerTr.appendChild(outerTd);
        var representativeFeature = features[0];
        var graphicsLayer = representativeFeature.getLayer();
        if(!graphicsLayer) {
            return;
        }
        // Match the configured visibility now that we've the features
        if(initiallyVisible) {
            graphicsLayer.show();
        } else {
            graphicsLayer.hide();
        }

        var graphicsLayerId = graphicsLayer.id;
        var table = document.createElement("table");
        var tbody = document.createElement("tbody");
        table.appendChild(tbody);
        var tr = document.createElement("tr");
        tbody.appendChild(tr);

        var td = document.createElement("td");
        var lastindex = graphicsLayer.url.lastIndexOf('/');
        var checkbox = CreateCheckBox(
            graphicsLayerId,
            graphicsLayer.url.substr(lastindex + 1),
            initiallyVisible);

        checkbox.onclick = function () {
            if (this.getAttribute("state") == "check") {
                this.src = "images/unchecked.png";
                this.setAttribute("state", "uncheck");
                graphicsLayer.hide();
                map.infoWindow.hide();
                selectedGraphic = null;
            }
            else {
                this.src = "images/checked.png";
                this.setAttribute("state", "check");
                ShowProgressIndicator();
                graphicsLayer.show();
                map.infoWindow.hide();
                selectedGraphic = null;
                map.getLayer(tempLayerId).clear();
                map.getLayer(tempParcelLayerId).clear();
            }
            HideProgressIndicator();
        };

        td.appendChild(checkbox);
        tr.appendChild(td);

        td = document.createElement("td");
        // display legend symbol
        if (graphicsLayer.renderer.symbol && graphicsLayer.renderer.symbol.url) {
            var img = document.createElement("img");
            img.src = graphicsLayer.renderer.getSymbol().url;
            setLegendSize(td, img);
            tr.appendChild(td);
        } else if (graphicsLayer.renderer.symbol && graphicsLayer.renderer.symbol.color && graphicsLayer.renderer.symbol.color.toHex()) {
            var div = document.createElement("div");
            div.style.backgroundColor = graphicsLayer.renderer.getSymbol().color.toHex();
            setLegendSize(td, div);
            tr.appendChild(td);
        } else {
            var div = document.createElement("div");
            setLegendSize(td, div);
            tr.appendChild(td);
        }

        td = document.createElement("td");
        for (var t = 0; t < layers.length; t++) {
            if (layers[t].Key == graphicsLayerId) {
                td.appendChild(document.createTextNode(layers[t].Title));
                break;
            }
        }
        tr.appendChild(td);
        outerTd.appendChild(table);
        return featureLayerDefered.resolve();

  }, function (err) {
        console.log(err.message);
    });
    return featureLayerDefered;
}

function setLegendSize(container, currentNode) {
    if (currentNode.tagName && currentNode.tagName.toUpperCase() != "IMG") {
        if (isMobileDevice) {
            currentNode.style.margin = "4px";
            var containerSize = "36px";
        } else {
            currentNode.style.margin = "2px";
            var containerSize = "16px";
        }
    } else {
        if (isMobileDevice) {
            var containerSize = "44px";
        } else {
            var containerSize = "20px";
        }
    }
    currentNode.style.width = containerSize;
    currentNode.style.height = containerSize;
    container.appendChild(currentNode);
}

//Function to create graphics and layers
function MapInitFunction() {
    var mapInitFunctionCompleted = new dojo.Deferred();
    window.onresize = function () {
        if (!isMobileDevice) {
            resizeHandler();
        }
        else {
            OrientationChanged();
        }
    }

    var mapSlider = dojo.query(".esriSimpleSlider", this.domNode);
    if (mapSlider.length > 0) {
        dojo.addClass(mapSlider[0], "roundedCorner");
    }

    var webmapDetails = GetWebMapInfo("neighborhoodKey", webMapId);
    webmapDetails.addCallback(function (webmapInfo) {
        neighbourHoodLayerInfo = webmapInfo.layerInfo;
        for (var i in webmapInfo.layerInfo) {
            if (webmapInfo.layerInfo.hasOwnProperty(i)) {
                var neighbourHoodLayer = new esri.layers.FeatureLayer(webmapInfo.url + "/" + webmapInfo.layerInfo[i].id, {
                    mode: esri.layers.FeatureLayer.MODE_SELECTION,
                    outFields: ["*"],
                    id: webmapInfo.layerInfo[i].id
                });
                map.addLayer(neighbourHoodLayer);
            }
        }
        setTimeout(function () {
            var parcelId = GetQuerystring('parcelId');
            if (parcelId != "") {
                LocateParcelonMap(unescape(parcelId));
                return;
            }
        }, 500);
    });
    HideProgressIndicator();

    var gLayer = new esri.layers.GraphicsLayer();   //Add temporary graphics layer for pushpin
    gLayer.id = tempLayerId;
    map.addLayer(gLayer);

    var tempParcelLayer = new esri.layers.GraphicsLayer();   //Add temporary graphics layer for parcel
    tempParcelLayer.id = tempParcelLayerId;
    map.addLayer(tempParcelLayer);

    var fbLayer = new esri.layers.FeatureLayer(feedbackLayer.ServiceUrl, {
        mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
        outFields: ["*"],
        id: feedbackLayer.Key,
        displayOnPan: false
    });
    fbLayer.setDefinitionExpression("1=2");
    map.addLayer(fbLayer);

    var handle = dojo.connect(fbLayer, "onUpdateEnd", function (features) {
        for (var key in feedbackAttributes) {
            if (feedbackAttributes.hasOwnProperty(key)) {
                if (feedbackAttributes[key].DomainNames) {
                    for (var index in fbLayer.fields) {
                        if (fbLayer.fields[index].name == key) {
                            PopulateFeedbackTypes(fbLayer.fields[index].domain.codedValues, feedbackAttributes[key].ControlId);
                        }
                    }
                }
            }
        }
        dojo.disconnect(handle);
    });

    for (var i = 0; i < layers.length; i++) {
        if (layers[i].isDynamicMapService) {
            var lastindex = layers[i].ServiceURL.lastIndexOf('/');
            map.addLayer(CreateDynamicServiceLayer(layers[i].ServiceURL, layers[i].ServiceURL.substr(lastindex + 1), layers[i].Key, layers[i].isVisible, layers[i].Title));
        }
        else {
            // A MODE_SELECTION FeatureLayer gets stuck in suspended mode at 3.1 if it is created invisible,
            // so we'll create it visible and then correct the visibility right after we fetch its features
            var featureLayer = new esri.layers.FeatureLayer(layers[i].ServiceURL, {
                mode: esri.layers.FeatureLayer.MODE_SELECTION,
                outFields: ["*"],
                id: layers[i].Key,
                displayOnPan: false,
                visible: true  // the default, but we'll repeat it here for emphasis that we're ignoring the config
            });

            if (layers[i].UseColor) {
                var customLFillSymbol = new esri.symbol.SimpleFillSymbol();
                var customFillColor = new dojo.Color(layers[i].Color);
                customFillColor.a = Number(layers[i].Alpha);
                customLFillSymbol.setColor(customFillColor);
                var customRenderer = new esri.renderer.SimpleRenderer(customLFillSymbol);
                featureLayer.setRenderer(customRenderer);
                FixTabWidth();
            }
            map.addLayer(featureLayer);
        }
    }

    dojo.connect(map, "onExtentChange", function (evt) {
        mapScale = map.getLayer(baseMapLayers[0].Key).tileInfo.lods[map.getLevel()].scale;
        dojo.byId("divShareContainer").setAttribute("mapScale", mapScale);
        if (dojo.coords("divShareContainer").h > 0) {
            ShareLink(false);
        }
        if (!isOrientationChanged) {
            if (selectedGraphic) {
                var screenPoint = map.toScreen(selectedGraphic);
                screenPoint.y = map.height - screenPoint.y;
                map.infoWindow.setLocation(screenPoint);
                return;
            }
        }
    });

    dojo.connect(map, "onClick", function (evt) {
        if (draw) {
            map.infoWindow.hide();
            selectedGraphic = null;
            return;
        }
        selectedGraphic = null;

        var checked = dojo.query('img[state = "check"]', dojo.byId('divLayers'));
        if (!draw) {
            if (checked.length == 0) {
                LocateParcel(null, evt.mapPoint, null)
                return;
            }
        }
        if (!isMobileDevice) {
            dojo.byId("divParcelInformation").style.display = "none";
            dojo.byId("divFeatureInformation").style.display = "none";
        }
        ShowFeatureInfoWindow(evt.mapPoint);
    });
    mapInitFunctionCompleted.resolve();
    return mapInitFunctionCompleted;
}
dojo.addOnLoad(init);
