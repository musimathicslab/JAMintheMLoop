from flask import Flask, request, send_file
import os
import time
import generate_melody as model
app = Flask(__name__)

@app.route("/generate_melody", methods=['POST'])
def do_gen():
    if('midiBlob' in request.files):
        file = request.files['midiBlob']
        file_path = os.path.join('temp_files', file.filename)
        file.save(file_path)
        generated_filename = str(time.time()) + ".mid"
        os.rename(file_path, 'temp_files/' + generated_filename)
        
        cont_path = model.generate_continuation('temp_files/' + generated_filename)
        
        return send_file(cont_path, mimetype='audio/midi', as_attachment=True)
    else:
        print("file not here")
        return "File not sent or incorrect filename"
         

@app.route("/generate_melody", methods=['GET'])
def output_error():
    return "GET requests are not enabled, please use POST requests instead."

if __name__ == "__main__":
    app.run(host='0.0.0.0')

