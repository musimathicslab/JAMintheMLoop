$(document).ready(function(){

    let stop_btn = "#stop > button";
    let rec_btn = "#record > button:first-child";
    let redo_btn = "#record > button:nth-child(2)";
    let download_btn = "#record > button:nth-child(3)";
    let loading = "#record > button:nth-child(4)";

    var mediaRecorder;

    var tempAudioURL;

    setupMediaRecording();

    const model = initModel();

    function setupMediaRecording(){
        if(navigator.mediaDevices){
            console.log("getUserMedia supported.");
    
            const constraints = {
                audio:
                        {
                            channels: 1,
                            autoGainControl: false,
                            echoCancellation: false,
                            noiseSuppression: false
                        }
             };
            let chunks = [];
    
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then((stream) => {
                    mediaRecorder = new MediaRecorder(stream);
                    //mediaRecorder.audioBitsPerSecond = 1411000;
                    console.log(mediaRecorder.audioBitsPerSecond);

                    console.log(MediaRecorder.isTypeSupported("audio/ogg;codecs=opus"));
                    
                    mediaRecorder.onstop = (e) => {
                        console.log("data available after MediaRecorder.stop() called.");
                
                        //audio.controls = true;
                        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });

                        chunks = [];
                        const audioURL = URL.createObjectURL(blob);
                        //audio.src = audioURL;
                        console.log("recorder stopped");


                        //if Debug enabled
                        var datetime = new Date($.now());
                        
                        $("#rawSource").attr('href', audioURL);
                        $("#rawSource").attr('download', 'raw_' + datetime +'.ogg');
                        $("#rawSource").attr('target', '_blank');
			
                        showLoadingScreen();

			            //Asynchronous function 
                        transcribeAndSend(blob);    
                    };
    
                    mediaRecorder.ondataavailable = (e) => {
                        chunks.push(e.data);
                    };
                })
                .catch((err) => {
                    console.error(`An eccor occurred: ${err}`);
                });
        }
        else
            console.error("getUserMedia is not supported by this browser.");
    }
    
    function initModel() {
        const model = new mm.OnsetsAndFrames('https://storage.googleapis.com/magentadata/js/checkpoints/transcription/onsets_frames_uni');
        
        model.initialize().then(() =>{
            //console.log("model loaded successfully");
            $(loading).hide();
            $(rec_btn).show();
        });
        // Things are slow on Safari.
        if (window.webkitOfflineAudioContext) {
          safariWarning.hidden = false;
        }
        
        // Things are very broken on ios12.
        if (navigator.userAgent.indexOf('iPhone OS 12_0') >= 0) {
          iosError.hidden = false;
          buttons.hidden = true;
        }
        return model;
    }


    $(rec_btn).click(function(){
        $(this).hide();
        $(download_btn).hide();
        $(redo_btn).hide();
        $("#loading_text").hide();
        MIDIjs.stop();
        
        startCounter();
    });

    $(document).on("keypress", function(e){
        if(e.which == 32){ //spacebar
            
            if($(stop_btn).is(':hidden') && $(rec_btn).is(':visible')){ //to avoid problems when stopping during the counter timer.
                $(rec_btn).trigger("click");
            }
            else if($(stop_btn).is(":visible") && $(rec_btn).is(":hidden")){
                $(stop_btn).trigger("click");
            }
        }
    
    });

    function startCounter(){
        var count = 3;
        $("#counter").text(count);

        var int = setInterval(function() {
            if(count == 1){
                $("#counter").html('');
                $(stop_btn).show();
                clearInterval(int);
                startRecording();
                return;
            }
            $("#counter").text(--count);
        }, 1000);
    }

    $(stop_btn).click(function(){
        //$(rec_btn).show();
        $(this).hide();
        stopRecording();
    });


    function startRecording(){
        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");

        $("#canvas-container").show();
    }

    function stopRecording(){
        mediaRecorder.stop();
        console.log(mediaRecorder.state);
        console.log("recorder stopped");

        $("#canvas-container").hide();
    }

    $(redo_btn).click(function(){
        MIDIjs.stop();
        MIDIjs.play(tempAudioURL); 
    });

    function showLoadingScreen(){
        $(loading).show();
        $(rec_btn).hide();

        $("#loading_text").show();
        $("#loading_text > p").eq(0).show();
        $("#loading_text > p").eq(1).hide();

        let loading_messages = [
            "Swapping space and time",
            "Downloading golf balls",
            "Warming up reactor",
            "Reticulating splines",
            "Searching for the answer to life, the universe, and everything",
            "Counting backwards from infinity",
            "Pay no attention to the man behind the curtain",
            "Calculating gravitational constant in your bay",
            "Following the white rabbit",
            "Satellites are moving into position",
            "The gods contemplate your fate",
            "Warming up the processors",
            "Reconfiguring the office coffee machine",
            "Recalibrating the internet",
            "Testing ozone",
            "Embiggening prototypes",
            "Deterministically simulating the future",
            "Testing for perfection",
            "Initializing Giant Lazer",
            "Dividing eternity by zero",
            "Watching Cat videos on the internet",
            "Creating Universe (this may take some time)",
            "Creating Time-Loop Inversion Field",
            "Transporting you into the future",
            "Commencing infinite loop",
            "Communing with nature",
            "Spinning the wheel of fortune",
            "Logging in to Skynet",
            "Engaging self-awareness circuits",
            "Downloading more pixels",
            "Preparing for hyperspace jump",
            "Slaying a Balrog",
            "Waiting for magic to happen",
            "Locating infinite improbability drive",
            "Traveling backward in time",
            "Taking over the world",
            "Setting the modulating fibulator to full polarity",
            "Reassembling atoms"
          ];
    
          var rndIndex = Math.floor(Math.random() * loading_messages.length);

          console.log(loading_messages[rndIndex]);
          $("#loading_text > p").eq(0).text(loading_messages[rndIndex]);
    }

    function hideLoadingScreen(){
        $(loading).hide();
        $(rec_btn).show();
        $(redo_btn).show();
        $(download_btn).show();

        $("#loading_text > p").eq(0).hide();
        $("#loading_text > p").eq(1).show();
    }
   
    async function transcribeAndSend(blob) {
        
        model.transcribeFromAudioFile(blob).then((ns) => {
            
            //DEBUG ONLY
            ns.notes.forEach(n => console.log(n))

            //const quantizedSequence
            
            /*
                The model noteSequence output does include all needed parameters,
                such as note velocity which is commonly absent.
            */
            const midiObj = mm.sequenceProtoToMidi(ns);

            const file = new Blob([midiObj], {type: 'audio/midi'});
	    

            //SEND
	        AJAXPost(file);
      

            const audioURL = URL.createObjectURL(file);

            $("#midiSource").attr('href', audioURL);
            $("#midiSource").attr('download', 'audio.mid');
            $("#midiSource").attr('target', '_blank');

            return file;
        });
    }

    //AJAX POST Request to Flask Server
    function AJAXPost(midi_blob){

	console.log(midi_blob);
	var formData = new FormData();
	formData.append("midiBlob", midi_blob);

	$.ajax({
		type: 'POST',
	        url: 'https://REPLACE-ME', //<------------------------- URL GOES HERE (should be 127.0.0.1:5000).
		data: formData,
		processData: false,
		contentType: false,
		cache: false,
		xhr:function(){
			var xhr = new XMLHttpRequest();
			xhr.responseType = 'blob';
			return xhr;
		},
		success: function(data, result){
			console.log("Request to server: " + result);
			console.log(data);
			
			try {
                    
                    const audioURL = URL.createObjectURL(data);
                    MIDIjs.play(audioURL); 
                    hideLoadingScreen();

                    tempAudioURL = audioURL;

                    $(download_btn).children().attr('href', audioURL);
                    $(download_btn).children().attr('download', 'generated_audio.mid');
                    $(download_btn).children().attr('target', '_blank');

                    $("#midiOutput").attr('href', audioURL);
                    $("#midiOutput").attr('download', 'generated_audio.mid');
                    $("#midiOutput").attr('target', '_blank');
                }
			catch (error){
				console.error(error);
				alert("Ooops...an error occurred");
			}

		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log(textStatus);
		}
	});
    }

    $("input#debug_mode").prop('checked', false);

    $("input#debug_mode").click(function() {
        $("#rawSource").toggle();
        $("#midiSource").toggle();
        $("#midiOutput").toggle();
    });
    
});
