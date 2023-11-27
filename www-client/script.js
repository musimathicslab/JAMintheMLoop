$(document).ready(function(){

    let rec_btn = "#record > button:first-child";
    let stop_btn = "#record > button:nth-child(2)";
    let loading = "#record > button:nth-child(3)";

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
        $(stop_btn).show();
	    MIDIjs.stop();
        $("#AI_turn_text").hide();
        $("#canvas-container").show();
        $("#user_turn_text").show();
	
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

    var startInt;

    function startCounter(){
        var count = 3;
        $("#counter").text(count);

        startInt = setInterval(function() {
            if(count == 1){
                $("#counter").html('');
                clearInterval(startInt);
                startRecording();
                return;
            }
            $("#counter").text(--count);
        }, 1000);
    }


    function stopCounter(){
        var count = 6;

        var int = setInterval(function() {
            if(count == 1){
                clearInterval(int);
                stopRecording();
                return;
            }
            count--
        }, 1000);
    }

    function startRecording(){
        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");

        
        stopCounter();
    }

    function stopRecording(){
        mediaRecorder.stop();
        console.log(mediaRecorder.state);
        console.log("recorder stopped");
    }

    $(stop_btn).click(function(){
        MIDIjs.stop();
        $(rec_btn).show();
        $(this).hide();
        $("#canvas-container").hide();
        $("#user_turn_text").hide();
        clearInterval(startInt);
        $("#counter").hide();
        
        stopRecording();
    });

    MIDIjs.setPlayerCallback(function(statObj) {
    	if(statObj.status == "finished"){
		console.log("midi over");
		$(rec_btn).trigger("click");
	}
    });

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
                url: 'https://jaminthemloop.yuribrandi.com/generate',
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
                        
                        $("#user_turn_text").hide();
                        $("#AI_turn_text").show();
                        $("#canvas-container").hide();

                        tempAudioURL = audioURL;
                
                        //$(download_btn).children().attr('href', audioURL);
                        //$(download_btn).children().attr('download', 'generated_audio.mid');
                        //$(download_btn).children().attr('target', '_blank');

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

