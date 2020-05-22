

var audioRecord = function () {
	
	var recorderWrapperID = "recorder"; // DIV that recorder will be in

	var recordButtonText = "Gravar";
	var stopButtonText = "Parar";
	var sentButtonText = "Mandar";
	var uploadSuccessfulText = "Foi! ✔︎";
	var uploadingText = "Subindo...︎";
	var recordingText = "Gravando...";
	
	var recordingStatus = false;
	
	URL = window.URL || window.webkitURL; //webkitURL is deprecated

	var serverURL = "https://sdb.phonologist.org/audio/upload.php";

	var gumStream; 						//stream from getUserMedia()
	var recorder; 						//WebAudioRecorder object
	var input; 							//MediaStreamAudioSourceNode  we'll be recording
	var encodingType; 					//holds selected encoding for resulting audio (file)
	var encodeAfterRecord = true;       // when to encode

	// shim for AudioContext when it's not avb. 
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	var audioContext; //new audio context to help us record

	//var encodingTypeSelect = document.getElementById("encodingTypeSelect");
	var encodingType = "mp3"

	makeUI = function (wrapperdiv) {

		let startStopButton = document.createElement('button');
		startStopButton.id = "startStopButton";
		startStopButton.innerHTML = recordButtonText;

		let statusDiv = document.createElement('div');
		statusDiv.id = "status";

		
		let controlsDiv = document.createElement('div');
		controlsDiv.id = "controls";
		controlsDiv.append(startStopButton);
		controlsDiv.append(statusDiv);

		let recordingsList = document.createElement('ol');
		recordingsList.id = "recordingsList";
		
		if(wrapperdiv) {
			//alert(wrapperdiv);
			let wrapper = document.getElementById(wrapperdiv);
			wrapper.append(controlsDiv)
			wrapper.append(recordingsList);
		} else {
			let wrapper = document.createElement('div');
			wrapper.id = recorderWrapperID;
			wrapper.append(controlsDiv)
			wrapper.append(recordingsList);
			document.body.append(wrapper);
		}


		//add events to those 2 buttons
		startStopButton = document.getElementById("startStopButton");
		startStopButton.addEventListener("click", toggleRecording);

		
	};

	function toggleRecording() {
	
		if(!recordingStatus) {
			startRecording();
			recordingStatus = true;
			startStopButton.innerHTML = stopButtonText;
		} else {
			stopRecording();
			recordingStatus = false;
			startStopButton.innerHTML = recordButtonText;
		}
	
	}


	function startRecording() {
		__log("startRecording() called");
		
		// remove earlier recordings
		document.getElementById("recordingsList").innerHTML = "";
		document.getElementById("status").innerHTML = "";

		var constraints = { audio: true, video:false }

		navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
			__log("getUserMedia() success, stream created, initializing WebAudioRecorder...");

			audioContext = new AudioContext();
			//assign to gumStream for later use
			gumStream = stream;
		
			input = audioContext.createMediaStreamSource(stream);
		
			//stop the input from playing back through the speakers
			//input.connect(audioContext.destination)

			//encodingType = encodingTypeSelect.options[encodingTypeSelect.selectedIndex].value;

			recorder = new WebAudioRecorder(input, {
			  workerDir: "js/", // must end with slash
			  encoding: encodingType,
			  numChannels:2, //2 is the default, mp3 encoding supports only 2
			  onEncoderLoading: function(recorder, encoding) {
				// show "loading encoder..." display
				__log("Loading "+encoding+" encoder...");
			  },
			  onEncoderLoaded: function(recorder, encoding) {
				// hide "loading encoder..." display
				__log(encoding+" encoder loaded");
			  }
			});

			recorder.onComplete = function(recorder, blob) { 
				__log("Encoding complete");
				createDownloadLink(blob,recorder.encoding);
			}

			recorder.setOptions({
			  timeLimit:120,
			  encodeAfterRecord:encodeAfterRecord,
			  ogg: {quality: 0.5},
			  mp3: {bitRate: 160}
			});

			//start the recording process
			recorder.startRecording();
			let status = document.createElement('span');
			status.innerHTML = recordingText;
			status.classList.add("pulsating");
			console.log(status);
			document.getElementById("status").append(status);


			 __log("Recording started");

		}).catch(function(err) {
			//enable the record button if getUSerMedia() fails
			//recordButton.disabled = false;
			//stopButton.disabled = true;
			startStopButton.innerHTML = recordButtonText;
		});

		//disable the record button
		//recordButton.disabled = true;
		//stopButton.disabled = false;
		startStopButton.innerHTML = stopButtonText;
	}

	function stopRecording() {
		__log("stopRecording() called");
	
		//stop microphone access
		gumStream.getAudioTracks()[0].stop();

		//disable the stop button
		//stopButton.disabled = true;
		//recordButton.disabled = false;
		startStopButton.innerHTML = recordButtonText;
		document.getElementById("status").innerHTML = "";
	
		recorder.finishRecording();
		__log('Recording stopped');
	}

	function createDownloadLink(blob,encoding) {

	
		var url = URL.createObjectURL(blob);
		var au = document.createElement('audio');
		var li = document.createElement('li');
		var link = document.createElement('a');

		//add controls to the <audio> element
		au.controls = true;
		au.src = url;
	
		var filename = new Date().toISOString() + "d" + '.'+encoding;

		//link the a element to the blob
	
		//link.href = url;
		//link.download = filename;
		//link.innerHTML = link.download;

		//add the new audio and a elements to the li element
		li.appendChild(au);
		//li.appendChild(link);


		//upload link
		var that = this;
		this.upload = document.createElement('button');
		upload.href="#";
		upload.id = filename;
		upload.innerHTML = sentButtonText;
		upload.addEventListener("click", function(event){
			  var xhr=new XMLHttpRequest();
			  xhr.onload=function(e) {
				  if(this.readyState === 4) {
					  __log("Server returned: " , e.target.responseText.replace(/\s+/g," "));
					  //document.document.getElementById(uploadButtonId).classList.add("good");
						document.getElementById("status").innerHTML = uploadSuccessfulText;
					  //console.log("Server returned: ",e.target.responseText);
				  }
			  };
			  xhr.upload.onprogress = function(e) {
				  document.getElementById(that.upload.id).disabled = true;

					let status = document.createElement('span');
					status.innerHTML = uploadingText;
					status.classList.add("pulsating");
					console.log(status);
					document.getElementById("status").innerHTML = "";
					document.getElementById("status").append(status);


				  //document.getElementById(that.upload.id).innerHTML = ; 
			  } 
		  
			  var fd=new FormData();
			  fd.append("audio_data",blob, filename);
			  xhr.open("POST",serverURL,true);
			  xhr.send(fd);
		})
		//li.appendChild(upload)//add the upload link to li
		document.getElementById("status").innerHTML = "";
		document.getElementById("status").appendChild(upload);

		//add the li element to the ordered list
		recordingsList.appendChild(li);
	}



	//helper function
	function __log(e, data) {
		//log.innerHTML += "\n" + e + " " + (data || '');
		console.log(e + " " + (data || ''));
	}



	return {
		makeUI: makeUI,
		startRecording: startRecording,
		stopRecording: stopRecording
	}
}; 

window.onload = function(){
    audioRecord();
    audioRecord().makeUI("recorder"); // id of wrapper
    
    document.getElementById("consultant").addEventListener("change", loadPhrases);
}

//var consultantSelection;
///////// load sentences for speakers


function loadPhrases() {

	var prompts = [];
    var consultantSelection = document.getElementById("consultant");

	let consultant = consultantSelection.options[consultantSelection.selectedIndex].value;
	//console.log(consultant);
	if (consultant != "none") {

		function doGET(path, callback) {
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					// The request is done; did it work?
					if (xhr.status == 200) {
						// ***Yes, use `xhr.responseText` here***
						callback(xhr.responseText);
					} else {
						// ***No, tell the callback the call failed***
						callback(null);
					}
				}
			};
			xhr.open("GET", path);
			xhr.send();
		}

		function handleFileData(fileData) {
			if (!fileData) {
				// Show error
				return;
			}
			// Use the file data
			prompts = fileData.trim().split(/[\r\n]/g);
			showPhrases(prompts,0);
		}

		// Do the request
		doGET("prompts/" + consultant + ".txt" , handleFileData);		
	}
	
	showPhrases = function(arr,index) {
		console.log(index);
		if(arr[index]) {
			let t = arr[index].split(/\t/);
			document.getElementById("prompt").innerHTML = t[0].trim();
			if(t[1] && t[1].trim()) { 
				document.getElementById("meaning").innerHTML = t[1].trim(); 
			} else {
				document.getElementById("meaning").innerHTML = "(indisponível)"
			}
		}
	}
	
	


}





