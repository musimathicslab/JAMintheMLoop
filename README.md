# JAMintheMLoop: 

### A Musician-aid tool based on Transformer models for jam session-like music generation.

<p align='center'> 
    <img src=https://github.com/musimathicslab/JAMintheMLoop/assets/52039988/7bf38b1c-293b-4662-a5aa-34a35c9f7703 width=200>
</p>

### https://jaminthemloop.yuribrandi.com/
**JAMintheMLoop is a free, open-source web tool that simulates a Jam session with a music-generating AI.**

This is a thesis work based on the [Magenta JavaScript API](https://github.com/magenta/magenta-js), specifically on the [Onsets and Frames](https://arxiv.org/abs/1710.11153) model and on the [Music Transformer](https://arxiv.org/abs/1809.04281) model: the former allows a recording to be transcribed into a MIDI file (locally by the means of magenta.js), the latter is deployed on a server (w/ [Gunicorn](https://gunicorn.org/) + [Flask](https://flask.palletsprojects.com/)) and can generate conditioned compositions based on existing MIDI melodies.

## Contributions

Contributions are very much appreciated. Please well describe your changes inside your PR to make it easier to understand them.

If you encounter any problem or bug that is unrelated with your own machine, please report it and *open a new issue* with replicable steps. 
## How does it work

First the audio is recorded by the web browser using the [MediaStream Recording API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API), which generates an Ogg Vorbis audio blob object. 

This blob is transcribed locally by the [Onsets and Frames](https://arxiv.org/abs/1710.11153) model run through the [Magenta JavaScript library](https://github.com/magenta/magenta-js), generating a MIDI blob object.

By the means of an AJAX request, the MIDI blob is sent to the [Music Transformer](https://arxiv.org/abs/1809.04281) model in a [FormData object](https://developer.mozilla.org/en-US/docs/Web/API/FormData). This model is deployed on a server using the [Flask](https://flask.palletsprojects.com/)-[Gunicorn](https://gunicorn.org/) combo and returns an original conditioned MIDI melody.

<center> 
    <img src=https://github.com/musimathicslab/JAMintheMLoop/assets/52039988/0d60b945-ae0e-4a4b-b36d-bc588ab0eb05 width=700>
</center>

## How to deploy this project

To deploy this project on you own machine, you can follow the brief step-by-step guide provided below. 

Please bear in mind this guide will be as generic as possible to allow you to use any preferred server and OS combination; however some steps may be very *Linux-oriented* and have not been tested on either MacOS or Windows/*WSL*.

### Guide:
### 1. Clone the repo
First clone the repo. You can use GitHub's interface as well.
 ```bash 
git clone https://github.com/musimathicslab/JAMintheMLoop.git 
```
### 2. Deploy the web client 
Deploy the web client contained inside the [www-client folder](www-client) on any Web Server (e.g.: Apache, Nginx ...).

Generate a FontAwesome kit here:

 >https://fontawesome.com/start

 And add it in the ``index.html`` file.

> **Important**: remember to update the URL of the AJAX POST request in the [script.js](www-client/scripts/script.js) file after deploying the back-end.

### 3. Deploy the back-end:

Since this project uses ``TensorFlow 1.15.x``, a Python version < 3.8 is needed. To automatically achieve this you can install a custom venv with [Anaconda](https://www.anaconda.com/download)

1. Install anaconda 
    > https://docs.anaconda.com/free/anaconda/install/index.html

2. Create a tensorflow 1.15.x Conda venv with automatically resolved dependencies (like Python version).

    ```bash 
    conda create -n jaminthemloop python tensorflow=1.15
    ```
3. Activate the virtual environment. Remember you need to do this every time you deploy flask.
     ```bash 
    conda activate jaminthemloop
    ```
4. Install sound and *C* libraries needed by the ``python-rtmidi`` package. This step is from the official [Magenta repository](https://github.com/magenta/magenta).

    For ``Debian`` and *Debian-based* distributions (Ubuntu, Mint ...)
    ```bash 
    sudo apt-get install build-essential libasound2-dev libjack-dev portaudio19-dev
    ```

    For ``Fedora``:
    ```bash 
    sudo dnf group install "C Development Tools and Libraries"
    sudo dnf install SAASound-devel jack-audio-connection-kit-devel portaudio-devel
    ```

5. Install all packages in [requirements.txt](requirements.txt).
     ```bash 
    pip install -r requirements.txt
    ```
    These requirements also include Flask. I would, however, recommend you to re-install the up-to-date version.
    ```bash 
    pip install flask
    ```
6. The project won't run yet, as we need the Music Transformer's checkpoints. To download them you may need to [intall gsutil](https://cloud.google.com/storage/docs/gsutil_install) first.

    Create an empty folder called ``model`` inside the [Flask-back-end](Flask-back-end) folder.

     ```bash
    mkdir model
    ```

   Now download the checkpoints inside the ``model`` folder.
   
    ```bash
    gsutil -q -m cp -r gs://magentadata/models/music_transformer/checkpoints/* path_to/Flask-back-end/model
    ```

    This command should download 6 files in total. But we only need these 3: 

    > melody_conditioned_model_16.ckpt.data-00000-of-00001
    >
    > melody_conditioned_model_16.ckpt.index
    >
    > melody_conditioned_model_16.ckpt.meta

8. Change directory to the [Back-end folder](Flask-back-end) and start your Flask service (remember to activate your venv)
    ```bash 
    python jaminthemloop.py
    ```
    This should start Flask on the *5000 port* on *localhost*.

    > Note: as probably warned by your *CLI*, this method is not meant for *deployment to prodution*. Please use a web server such as Gunicorn or Apache + *wsgi_mod* for that purpose.

    > Note #2: do **not** delete the ``temp_files`` folder: this is where MIDI files are "temporarily" stored when received. For debugging purposes, however, they are not currently being deleted after being processed; you can change this behaviour by adding a file deletion instruction in [jaminthemloop.py](Flask-back-end/jaminthemloop.py)
    


## License

This project is distributed under the [GNU General Public License v3](LICENSE.md).

![GPLv3Logo](https://www.gnu.org/graphics/gplv3-127x51.png)
