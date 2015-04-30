
		
 var NumberCode;
 var m_CodeArray;
		
 var m_GraveIDArray;
 var m_NameArray;
 var m_DateArray;
 var m_RankArray;
 var m_BodyCount;
		
function GraveClass(NumberCode, LetterCode, GraveID, NameString, DateString){
		this.NumberCode = NumberCode;
		this.m_CodeArray = new Array();
		this.m_GraveIDArray = new Array();
		this.m_NameArray = new Array();
		this.m_DateArray = new Array();
		this.m_RankArray = new Array();
		this.m_CodeArray.push(LetterCode);
		this.m_GraveIDArray.push(GraveID);
		this.m_NameArray.push(NameString);
		this.m_DateArray.push(DateString);
		
			
		var intRank;
		intRank = FindRank(LetterCode);  // commented out for testion 3/1/2012
		this.m_RankArray.push(intRank);
			
		this.m_BodyCount = 0;		
		
		this.AddToExistingGrave = function (LetterCode, GraveID, NameString, DateString){
			var intRank;
			intRank = FindRank(LetterCode);
			
			this.m_CodeArray.push(LetterCode);
			this.m_GraveIDArray.push(GraveID);
			this.m_NameArray.push(NameString);
			this.m_DateArray.push(DateString);
			this.m_RankArray.push(intRank);
			this.m_BodyCount = m_BodyCount +1 ;	
		}
		
		 this.GenerateGraveControl = function(){
		
			
			
			//Sort Array
			var intIndices;
			var intIndex;
			var blnFull = true;
			
			var gravenumarray = new Array();
			var burialarray;
			var txtID, txtName, txtDate, txtFull;
			
			
			// Must replace this portion
			//intIndices = m_RankArray.sort(Array.NUMERIC | Array.RETURNINDEXEDARRAY)
			// first copy Rank Array
			var rankcopy = new Array();
			for (var i = 0; i< this.m_RankArray.length; i++){
				rankcopy.push(this.m_RankArray[i]);	
			}
			// Second ... sort the copy
			rankcopy.sort(sortNumber);
			
			// Next populate Index array by search values
			intIndices = new Array();
			for (var i = 0; i < rankcopy.length; i++) {
				intIndex = this.m_RankArray.indexOf(rankcopy[i]);
				intIndices.push(intIndex);
			}
			
			
			
			for (var i = 0; i< intIndices.length; i++)
			{
				var burial = new Array();
				
				intIndex = intIndices[i];
		
				txtID = this.m_GraveIDArray[intIndex].toString();
				txtName = this.m_NameArray[intIndex].toString();	
				txtDate = this.m_DateArray[intIndex].toString();
			
				burial.push(txtID);
				burial.push(txtName);
				burial.push(txtDate);
			
				gravenumarray.push(burial);
			}	
			return gravenumarray;
	}
		
}


function InsertString(LetterCode, GraveID, NameString, DateString){
	var intRank;
	intRank = FindRank(LetterCode);
			
	m_CodeArray.push(LetterCode);
	m_GraveIDArray.push(GraveID);
	m_NameArray.push(NameString);
	m_DateArray.push(DateString);
	m_RankArray.push(intRank);
		
	m_BodyCount = m_BodyCount +1 ;	
}

		
function FindRank(LetterCode){
	var intRank = -1;
			
	switch (LetterCode)
	{
		case "R":
			intRank = 1;
			break;
		case "L":
			intRank = 2;
			break;
		case "E":
			intRank = 3;
			break;
		case "C":
			intRank = 4;
			break;
		case "B":
			intRank = 5;
			break;
		case "A":
			intRank = 6;
			break;
		case "S":
			intRank = 7;
			break;
		case "D":
			intRank = 8;
			break;
		default:
			intRank = 99;
			break;
	}
	return intRank;
}

function sortbycode(a, b){
	return a.NumberCode - b.NumberCode;
}

function sortNumber(a,b){
	return a-b;
}





