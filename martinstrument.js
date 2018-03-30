
    // create the audio context (chrome only for now)
    if (! window.AudioContext) {
        if (! window.webkitAudioContext) {
            alert('no audiocontext found');
        }
        window.AudioContext = window.webkitAudioContext;
    }
    var context = new AudioContext();
    var audioBuffer;
    var sourceNode;
    var splitter;
    var analyser, analyserR, analyserL;
    var javascriptNode;

    // get the context from the canvas to draw on
    $(function() {
     var ctx = $("#canvas").get()[0].getContext("2d");


    // create a gradient for the fill. Note the strange
    // offset, since the gradient is calculated based on
    // the canvas, not the specific element we draw
    var gradient = ctx.createLinearGradient(0,0,0,350);
    gradient.addColorStop(1,'#00AA00');
    gradient.addColorStop(0.75,'#22FF00');
    gradient.addColorStop(0.25,'#ffff00');
    gradient.addColorStop(0,'#ff0000');


    // load the sound
    setupAudioNodes();
    loadSound("samples/martinstrument.ogg");


    function setupAudioNodes() {

        // setup a javascript node
        javascriptNode = context.createScriptProcessor(2048, 1, 1);
        // connect to destination, else it isn't called
        javascriptNode.connect(context.destination);


        // setup a analyzer
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 1024;

        analyserR = context.createAnalyser();
        analyserR.smoothingTimeConstant = 0.0;
        analyserR.fftSize = 1024;

        analyserL = context.createAnalyser();
        analyserL.smoothingTimeConstant = 0.0;
        analyserL.fftSize = 1024;

        // create a buffer source node
        sourceNode = context.createBufferSource();
        splitter = context.createChannelSplitter();

        // connect the source to the analyser and the splitter
        sourceNode.connect(analyser);
        sourceNode.connect(splitter);

        // connect one of the outputs from the splitter to
        // the analyser
        splitter.connect(analyserR,0,0);
        splitter.connect(analyserL,1,0);

        // connect the splitter to the javascriptnode
        // we use the javascript node to draw at a
        // specific interval.
        analyser.connect(javascriptNode);

        //splitter.connect(context.destination,0,0);
        //splitter.connect(context.destination,0,1);

        // and connect to destination
        sourceNode.connect(context.destination);
    }

    // load the specified sound
    function loadSound(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When loaded decode the data
        request.onload = function() {

            // decode the data
            context.decodeAudioData(request.response, function(buffer) {
                // when the audio is decoded play the sound
                playSound(buffer);
            }, onError);
        }
        request.send();
    }


    function playSound(buffer) {
        sourceNode.buffer = buffer;
        sourceNode.start(0);
    }

    // log if an error occurs
    function onError(e) {
        console.log(e);
    }

    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
    javascriptNode.onaudioprocess = function() {

        // get the average for the first channel
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var average = getAverageVolume(array);

        // get the average for the second channel
        var arrayR =  new Uint8Array(analyserR.frequencyBinCount);
        analyserR.getByteFrequencyData(arrayR);
        var averageR = getAverageVolume(arrayR) * 3;

        var arrayL =  new Uint8Array(analyserL.frequencyBinCount);
        analyserL.getByteFrequencyData(arrayL);
        var averageL = getAverageVolume(arrayL) * 3;

        // clear the current state
        ctx.clearRect(0, 0, 60, 350);

        // set the fill style
        ctx.fillStyle=gradient;

        // create the meters
        ctx.fillRect(0,349-averageR,25,350);
        ctx.fillRect(30,349-averageL,25,350);
        var skib = Math.round(average/14)-1
        if(skib < 0) skib = 0;
        if(skib > 4) skib = 4;
        $("#face").css('background-position-y', -skib*400);
    }
    });
    function getAverageVolume(array) {
        var values = 0;
        var average;

        var length = array.length;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
        }

        average = values / length;
        return average;
    }