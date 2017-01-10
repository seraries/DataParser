
window.onload = function(){

var button = document.getElementById("button");
button.onclick = handleSubmitButton;
}

var apiDataArray; // this array is used for cumulative reports
var thisDaysDataArray = []; // this array is used for daily reports
var dateArray = []; // this holds an array of date strings for which dates have data in the daily reporting
var urlsArray; // this holds the strings of the urls that we need data collected for

var urlStarter = "\"creativeURL\":\"";  // this has to be added to the front of url strings to match openAPI data
var urlData; // string for holding each url's data
var currentDate; // this holds the current date string as we iterate through the date array 
var csvData; // string to hold csv data as it is built up one url at a time

var dailyBool = true; // tells parseData function whether to parse for daily (default) or cumulative totals


var comma = ","; //for formatting output to go into a csv file
var newLine = "\n"; // formatting output to go into csv file
var data; //to hold encoded csv data string
var filename = Date() + "ChannelData.csv" // filename for csv we'll export (using date() ensures unique filename)


function handleSubmitButton() {
	// start csv data string with info about the file
	csvData = "data:text/csv;charset=utf-8,";
	urlsArray = $("#urls").val().trim().split("\n"); //splits urls on new line char and trim
	
	//if they select cumulative radio button
	if($("[type=radio]:checked").val()=="cumulative"){
		dailyBool = false;
		apiDataArray = $("#inputText").val().trim().split(","); // splits apidata into string array at each comma
		
		// header column for csv file if it is cumulative reporting (no date column)
		csvData += "url,clicks,impressions,spend \n"
		
		// For each url, read through the entire file gathering clicks, imps, and spend
		urlsArray.forEach(parseData);
	}

	// else they've selected the daily radio button OR they've not selected either button
	// in either case, break the data down by day
	else{
		var re = /(\d{4}\-\d{2}\-\d{2})/; // this is the regex representing the date format "2016-11-25"
		var dailyDataArray = $("#inputText").val().trim().split(re); // split the openAPI input string by regex 
		
		// header column for csv file if it is daily reporting (difference is it has a date column)
		csvData += "date,url,clicks,impressions,spend \n"

		// the dailyDataArray contains strings. It currently has only unneeded header info at index 0. At index 1
		// and all subsequent odd indices, it has a date string. At index 2 and all subsequent even indices, it has
		// the data for the date of the previous index. So here let's make an array of all our dates/date strings.
		var i = 1;
		while(i < dailyDataArray.length){
			dateArray.push(dailyDataArray[i]);
			i += 2; // next odd index
		}
		// for each date in our array, there will be corresponding data (and it will be the even index 
		// following the date's index in the dailyDataArray which will be a string that needs to be split 
		// on the commas).
		// So iterate through dateArray and for each date, create an array of strings, and then
		// parse the data for that date FOR EACH URL, and write it to csv.
		var x = 2;
		dateArray.forEach(function(date){
			
			currentDate = date; // store the date that corresponds to the data we're parsing so we can put it in csv

			thisDaysDataArray = dailyDataArray[x].split(",");
			x += 2; // next even index
			urlsArray.forEach(parseData);
		})	
	}
	
	// convert the csv data string into a csv download file
	data = encodeURI(csvData);

	// make the csv file available on the webpage via html
	link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();

    // auto reload after each submit button press to clear the textboxes and the variables
    // otherwise it doesn't function properly for multiple submits.
    location.reload(true);  

}

function parseData(url){
	var clicks = 0;
	var impressions = 0;
	var spend = 0.0;
	var creative = urlStarter + url + "\""; // make url match format of api data

	var index = 0; // index of which string we're currently looking at in the apiDataArray for loop
	var whichArray = []; // holds either the daily data array or the cumulative data array (see condition below)

	if(dailyBool){
		whichArray = thisDaysDataArray;
	}
	else{
		whichArray = apiDataArray;
	}
	// iterate through each string in the api Data array, when i find a match to the current url,
	// gather the clicks (which are 5 strings ahead), imps (4 strings ahead), and spend (7 strings ahead)
	whichArray.forEach(function(line){
		if (creative === line) {
			var clickStr = whichArray[index+5].replace("\"clicks\":", "");
			clickStr = clickStr.replace(",", "");
			clicks += parseInt(clickStr, 10); //10 is radix so we parse using decimal notation
			
			var impStr = whichArray[index+4].replace("\"impressions\":", "").replace(",", "");
			impressions += parseInt(impStr, 10);
			
			var spendStr = whichArray[index+7].replace("\"grossRevenue\":", "").replace(",", "");
			spend += parseFloat(spendStr);

		}
		index++;
	});	// end of data array "for each" loop and of anonymous function

	// write the current url's data to the csv data string
	// if it is a daily report, INCLUDE THE DATE; else, don't
	if(dailyBool){
		urlData = currentDate + comma + url + comma + clicks + comma + impressions + comma + spend + newLine;
	}
	else{
		urlData = url + comma + clicks + comma + impressions + comma + spend + newLine;
	}

	// append the data for this url to the csv data string
	csvData += urlData;
}


