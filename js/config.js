dojo.provide("js.config");
dojo.declare("js.config", null, {

    // This file contains various configuration settings for "Tax Parcel Viewer" template
    // 
    // Use this file to perform the following:
    //
    // 1.  Specify application title                  - [ Tag(s) to look for: ApplicationName ]
    // 2.  Set path for application icon              - [ Tag(s) to look for: ApplicationIcon ]
    // 3.  Set splash screen message                  - [ Tag(s) to look for: SplashScreenMessage ]
    // 4.  Set URL for help page                      - [ Tag(s) to look for: HelpURL ]
    //
    // 5.  Specify URL(s) for basemaps                - [ Tag(s) to look for: BaseMapLayer ]
	// 6.  Specify URL(s) for cemetery layer		  - [ Tag(s) to look for: CemeteryLayer ]	
    // 7.  Set initial map extent                     - [ Tag(s) to look for: DefaultExtent ]
    //
    

    // 9.  Specify URL for cemetery lot layer
    // 10.  Specify URL for cemetery grave table                                        
   
    // 11. Customize data formatting                  - [ Tag(s) to look for: ShowNullValueAs ]
    // 11a.Specify the image for geolocated point     - [ Tag(s) to look for: GeolocatedImage]
    //
    // 12. Customize address search settings          - [ Tag(s) to look for: LocatorDefaultAddress]
    //
    // 13. Set URL for geometry service               - [ Tag(s) to look for: GeometryService ]
    //

    // 15. Set URL for PrintTaskService               - [ Tag(s) to look for: PrintTaskURL]
    // 16. Customize info-Window settings             - [ Tag(s) to look for: InfoWindowHeader, InfoWindowContent ]
    // 17. Customize info-Popup settings              - [ Tag(s) to look for: Layers ]
    // 18. Specify the attribute for parcel ID        - [ Tag(s) to look for: ParcelIdAttribute]
    // 19. Specify the date pattern                   - [ Tag(s) to look for: DatePattern]
 
    // 25. Set the color for selected records         - [Tag(s) to look for: SelectedRecordColor]
    

    // ------------------------------------------------------------------------------------------------------------------------
    // GENERAL SETTINGS
    // -----------------------------------------------------------------------------------------------------------------------
    // Set application title .... left blank because name included in logo
    ApplicationName: "Brookdale Cemetery",

    // Set application icon path
    ApplicationIcon: "images/logo.png",

    // Set splash window content - Message that appears when the application starts
    SplashScreenMessage: "<b>Brookdale Cemetery Viewer</b> <br/> <hr/> <br/>The <b>Brookdale Cemetery Viewer</b> provides the general public cemetery burial information for the Brookdale Cemetery in Dedham, Massachusetts.<br/><br/>To locate an individual, simply click on the map or enter a partial name in the search box and select an item from the list.<br/><br/>Enter a number in the search box to locate a lot by lot number.",

    // Set URL of help page/portal
    HelpURL: "help.htm",

    // ------------------------------------------------------------------------------------------------------------------------
    // MAP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Basemap Service
    // Basemap Service
    BaseMapLayer: 
    	{  
    		ServiceURL: "http://tiles.arcgis.com/tiles/yourservice/arcgis/rest/services/servicename/MapServer", 
    		Key: "imageryMap"	
    	},
    // Cemetery Service
    CemeteryLayer: 
    	{
    		ServiceURL: "http://yourserver/arcgis/rest/services/public/Cemetery/MapServer",
    		Opacity: 0.6,
    		Key: "cemeteryMap"
    	},      
    
  	  
    // Initial map extent. Use comma (,) to separate values and do nt delete the last comma
    DefaultExtent: "-7922893.978846671,  5198307.39792448, -7921401.068138102, 5199278.387049333",

    // ------------------------------------------------------------------------------------------------------------------------
    // OPERATIONAL DATA SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Cemetery Lot layer	
    LotLayer:
    	{
    		ServiceURL: "http://yourserver/arcgis/rest/services/public/Cemetery/MapServer/5",
    		Color: "#99FFB4",
            Alpha: 0.5,
    		Fields: 
    			{
    	    	  	OID : "OBJECTID",
    	    	    LotNumber : "Lot_Number",
    	    	    OwnerFirst : "Owner_First",
    	    	    OwnerLast : "Owner_Last",
    	    	    OwnerTitle : "Owner_Title",
    	    	    Book : "Book",
    	    	    Page : "Page",
    	    	    PurchDate : "Date_Purch",
    	    	    Location : "Location",
    	    	    GravesTotal : "Max_Graves",
    	    	    GravesAvail	: "Available",
    	    	    Remarks : "Remarks"
    	    	 },
    	    GraveTableRelateId: 2,
    	    PhotoTableRelateId: 3
    	},
    	 
    // Burial Table	
    GraveTable:
    	{
    		ServiceURL: "http://yourserver/arcgis/rest/services/public/Cemetery/MapServer/10",
    		Fields: 
    			{
    				OID : "OBJECTID",
    				LotNumber : "Lot_Number",
    				GraveNumber : "Grave_Number",
    				LastName : "Deceased_Last",
    				FirstName: "Deceased_First",
    				TitleName: "Deceased_Title",
    				SuffixName: "",
    				DateOfDeath : "DeathDate",
    				DateOfBirth : "",
    				AgeAtDeath: "AgeAtDeath_Yr",
    				DiedTown: "Town_of_Death",
    				DiedState: "State_of_Death",
    				Veteran: "Veteran",
    				Inscription: "",
    				Depth: "Depth",
    				Vault: "VaultType",
    				BurialDate: "BurialDate",
    				Undertaker: "Undertaker",
    				LegalFirst: "LegalRep_First",
    				LegalLast: "LegalRep_Last",
    				LegalTitle: "LegalRep_Title",
    				Comments: "Remarks"
    			 },
    		DisplayFields: [ "Lot_Number", "Deceased_Last", "Deceased_First"],
    		BurialQuery: "(UPPER(Deceased_Last) LIKE '%${0}%') OR (UPPER(Deceased_First) LIKE '%${0}%') OR (UPPER(Lot_Number) LIKE '%${0}%') "
    	},
    	  

    // Set string value to be shown for null or blank values
    ShowNullValueAs: "N/A",

    // ------------------------------------------------------------------------------------------------------------------------
    // ADDRESS SEARCH SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    // Set default address to search
   // LocatorDefaultAddress: "1702 Brandywine Dr",

    //Set the image for geolocated point
    GeolocatedImage: "images/pushPin.png",
    
    
    
    // ------------------------------------------------------------------------------------------------------------------------
    // GEOMETRY SERVICE SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set geometry service URL
    GeometryService: "http://yourserver/arcgis/rest/services/Utilities/Geometry/GeometryServer",    

    // ------------------------------------------------------------------------------------------------------------------------
    // INFO-WINDOW SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Info-window is a small, two line popup that gets displayed on selecting a feature
    // Set Info-window title. Configure this with text/fields
    // ------------------------------------------------------------------------------------------------------------------------
    // Specify the format for date
    DatePattern: "MMM dd, yyyy",

   


    // ------------------------------------------------------------------------------------------------------------------------
    //Set the color for selected address
    SelectedRecordColor: "#FFCB1F",

  
  
});
