

var audioRecord = (function () {
	
	URL = window.URL || window.webkitURL; //webkitURL is deprecated

	var serverURL = "https://sdb.phonologist.org/audio/upload.php";
	
	
	var strings = {
		title: "Gravador",
		meaningText: "Significado:",
		promptText: "Frase:",
		chooseSpeaker: "Falante:",
		chooseSpeakerOption : "Favor escolher o falante",
		recordButton : "Gravar",
		stopButton : "Parar",
		sentButton : "Salvar",
		tryagainButton: "Excluir",
		uploadSuccessful : "Salvo! ✔︎",
		uploading : "Salvando...",
		recording : "Gravando..",
		processing: "Processando...",
		forward: "próximo ▶︎",
		back: "◀︎ anterior",
		finished: "Acabou ✔︎︎"
	}

	var English = window.location.href.indexOf("english")>-1; 
	if(English) {
		strings = {
			title: "Web recorder",
			meaningText: "Meaning:",
			promptText: "Phrase:",
			chooseSpeaker: "Speaker:",
			chooseSpeakerOption : "Please choose speaker",
			recordButton : "Record",
			stopButton : "Stop",
			sentButton : "Save",
			tryagainButton: "Delete",
			uploadSuccessful : "Saved! ✔︎",
			uploading : "Saving...",
			recording : "Recording..",
			processing: "Processing...",
			forward: "next ▶︎",
			back: "◀︎ previous",
		finished: "All done! ✔︎︎"
		}
	}


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
	var recorderWrapperID = "recorder"; // DIV that recorder will be in
	var soundFile = "test"; // default filename
	var recordingStatus = false; // are we currently recording?
	var verbose = "false";

	function launch() {
	
		document.title = strings.title;
		startStopButton.innerHTML = strings.recordButton;
		startStopButton.addEventListener("click", toggleRecording);
		startStopButton.disabled = true;

		document.getElementById("prompts.back").innerHTML = strings.back;
		document.getElementById("prompts.forward").innerHTML = strings.forward;
		document.getElementById("choosespeaker").innerHTML = strings.chooseSpeaker;
		document.getElementById("meaningtext").innerHTML = strings.meaningText;
		document.getElementById("prompttext").innerHTML = strings.promptText;
		document.getElementById("consultant").options[0].innerHTML = strings.chooseSpeakerOption;

		promptManager.launch();
		
	}
	
	function toggleRecording() {
		if(!recordingStatus) {
			startRecording();
			recordingStatus = true;
			startStopButton.innerHTML = strings.stopButton;
			
		} else {
			stopRecording();
			recordingStatus = false;
			startStopButton.innerHTML = strings.recordButton;
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

			recorder.onEncodingProgress = function (recorder, progress) {
				//console.log(progress);
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
			status.innerHTML = strings.recording;
			status.classList.add("pulsating");
			document.getElementById("status").append(status);


			 __log("Recording started");

		}).catch(function(err) {
			//enable the record button if getUSerMedia() fails
			startStopButton.innerHTML = strings.recordButton;
		});

		startStopButton.innerHTML = strings.stopButton;
	}

	function stopRecording() {
		__log("stopRecording() called");
	
		//stop microphone access
		gumStream.getAudioTracks()[0].stop();

		//disable the stop button
		//startStopButton.innerHTML = strings.recordButton;
		startStopButton.disabled = true;
		//document.getElementById("status").innerHTML = "";
		
		let status = document.createElement('span');
		status.innerHTML = strings.processing;
		status.classList.add("pulsating");
		document.getElementById("status").innerHTML = "";
		document.getElementById("status").append(status);
		
		recorder.finishRecording();
		__log('Recording stopped');
	}

	function createDownloadLink(blob,encoding) {

	
		var url = URL.createObjectURL(blob);
		var au = document.createElement('audio');
		var li = document.createElement('li');

		//add controls to the <audio> element
		au.controls = true;
		au.src = url;
		//add the new audio and a elements to the li element
		li.appendChild(au);
	
		var filename = audioRecord.soundFile + "_" + new Date().toISOString() + "" + '.'+encoding;

		//upload button
		var that = this;
		this.upload = document.createElement('button');
		upload.href="#";
		upload.id = filename;
		//console.log(filename);
		upload.innerHTML = strings.sentButton;
		upload.addEventListener("click", function(event){
			  var xhr=new XMLHttpRequest();
			  xhr.onload=function(e) {
				  if(this.readyState === 4) {
					  __log("Server returned: " , e.target.responseText.replace(/\s+/g," "));
					  document.getElementById("status").innerHTML = strings.uploadSuccessful;
					  document.getElementById("recordingsList").innerHTML = "";
					  promptManager.phraseDone();
				  }
			  };
			  xhr.upload.onprogress = function(e) {
				  document.getElementById(that.upload.id).disabled = true;

				  let status = document.createElement('span');
				  status.innerHTML = strings.uploading;
				  status.classList.add("pulsating");
				  document.getElementById("status").innerHTML = "";
				  document.getElementById("status").append(status);
			  } 
		  
			  var fd=new FormData();
			  fd.append("audio_data",blob, filename);
			  xhr.open("POST",serverURL,true);
			  xhr.send(fd);
		})

		this.tryagain = document.createElement('button');
		tryagain.href="#";
		tryagain.innerHTML = strings.tryagainButton;
		tryagain.addEventListener("click", function(event){
			document.getElementById("status").innerHTML = "";
			startStopButton.disabled = false;
			document.getElementById("recordingsList").innerHTML = "";
			
		})		

		document.getElementById("status").innerHTML = "";
		document.getElementById("status").appendChild(upload);
		document.getElementById("status").appendChild(tryagain);

		recordingsList.appendChild(li);
	}



	//helper function
	function __log(e, data) {
		//log.innerHTML += "\n" + e + " " + (data || '');
		if (this.verbose) {
			console.log(e + " " + (data || ''));
		}
	}



	return {
		toggleRecording: toggleRecording,
		soundFile: soundFile,
		launch: launch
	}
})(); 

//var consultantSelection;
///////// load sentences for speakers
window.onload = function() {
	audioRecord.launch();
}


var promptManager = (function () {

	var prompts = [];
	var currentPromptIndex = 0;
	var consultant;
	
	var launch = function () {
		document.getElementById("prompts.back").disabled = true;
		document.getElementById("prompts.forward").disabled = true;

		document.getElementById("prompts.back").addEventListener("click", prevPrompt);
		document.getElementById("prompts.forward").addEventListener("click", nextPrompt);

		document.getElementById("consultant").addEventListener("change", load);

	}

	var load = function() {
	    let consultantSelection = document.getElementById("consultant");
		consultant = consultantSelection.options[consultantSelection.selectedIndex].value;
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
				if (fileData.trim()) {
					prompts = fileData.trim().split(/[\r\n]/g);
					/// prompts found, disable speaker choice, enable recording
					consultantSelection.disabled = true;
					startStopButton.disabled = false
					showPhrase();
					updatePromptCounter();
				}
			}

			// Do the request
			doGET("prompts/" + consultant + ".txt?rand=" + Math.random(), handleFileData);		
		}
	}

	var phraseDone = function () {
	
		if(currentPromptIndex < prompts.length-1) {
			// there is another prompt, enable next prompt button
			document.getElementById("prompts.forward").disabled = false;
		} else {
			// last prompt!
			document.getElementById("prompts.forward").disabled = true;
		}
	}

	var prevPrompt = function() {
		currentPromptIndex--;
		if(currentPromptIndex >= 0) {
			showPhrase();
		} else {
			console.log("This is weird... currentPromptIndex = " + currentPromptIndex);
		}
	}
	
	var nextPrompt = function() {
		currentPromptIndex++;
		if(currentPromptIndex < prompts.length) {
			showPhrase();
		} else {
			console.log("How did I get here? currentPromptIndex = " + currentPromptIndex);
		}
	}
	
	var showPhrase = function() {
		if(prompts[currentPromptIndex]) {
			let t = prompts[currentPromptIndex].split(/\t/);
			document.getElementById("prompt").innerHTML = t[0].trim() || "&nbsp;";
			if(t[1] && t[1].trim()) { 
				document.getElementById("meaning").innerHTML = t[1].trim() || "&nbsp;"; 
			} else {
				document.getElementById("meaning").innerHTML = "(indisponível)"
			}
			updatePromptCounter();
			startStopButton.disabled = false;
			document.getElementById("status").innerHTML = "";
			audioRecord.soundFile = consultant + "_" + t[0].trim();
		} else {
			// shouldn't happen
			console.log("Prompt not found, current index: " + currentPromptIndex);
		}
		
		if(currentPromptIndex > 0) {
			// there is a previous prompt, enable previous prompt button
			//document.getElementById("prompts.back").disabled = false;
		} else {
			// there is no previous prompt, disable previous prompt button
			document.getElementById("prompts.back").disabled = true;
		}
		// disable next prompt button (to prevent skipping)
		document.getElementById("prompts.forward").disabled = true;


	}

	var updatePromptCounter = function() {
		document.getElementById("prompts.counter").innerHTML = currentPromptIndex+1 + "/" + prompts.length;
	}

	return {
		launch: launch,
		load: load,
		phraseDone: phraseDone
	}
	

})();




