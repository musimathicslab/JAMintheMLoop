navigator.mediaDevices.getUserMedia({audio: true})
.then(spectrum).catch(console.log);

function spectrum(stream) {
  console.log("audio_rec loaded");
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  audioCtx.createMediaStreamSource(stream).connect(analyser);

  const canvas = document.getElementById("waveform");
  const ctx = canvas.getContext("2d");
  const data = new Uint8Array(canvas.width);

  setInterval(() => {
    ctx.fillStyle = "#1F2732";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
 
    analyser.getByteFrequencyData(data);

    let x = 0;
    for (let d of data) {
      const y = canvas.height - (d / 128) * canvas.height / 3;
      ctx.fillStyle = "white";
      ctx.fillRect(x+=2, y - canvas.height/2, 1, canvas.height - y);
      ctx.fillRect(x, (y + canvas.height * 4) / 10, 1, canvas.height - y);
    }
    
  }, 1000 * canvas.width / audioCtx.sampleRate);
};
