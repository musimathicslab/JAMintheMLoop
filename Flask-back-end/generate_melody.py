import numpy as np
# from google.colab import files
import tensorflow.compat.v1 as tf
import datetime

from tensor2tensor import models
from tensor2tensor import problems
from tensor2tensor.data_generators import text_encoder
from tensor2tensor.utils import decoding
from tensor2tensor.utils import trainer_lib

from magenta.models.score2perf import score2perf
import note_seq
"""
"""


class MelodyToPianoPerformanceProblem(score2perf.AbsoluteMelody2PerfProblem):
    @property
    def add_eos_symbol(self):
        return True

class MusicTransformer:
    tf.disable_v2_behavior()
    inputs = []
    decode_length = 0
    model_name = "transformer"
    hparams_set = "transformer_tpu"
    ckpt_path = "model/melody_conditioned_model_16.ckpt"

    problem = None
    conditional_encoders = None
    predicted = None

    def __init__(self):

        self.problem = MelodyToPianoPerformanceProblem()
        self.conditional_encoders = self.problem.get_feature_encoders()
        # Set up HParams.
        hparams = trainer_lib.create_hparams(hparams_set=self.hparams_set)
        trainer_lib.add_problem_hparams(hparams, self.problem)
        hparams.num_hidden_layers = 16
        hparams.sampling_method = "random"

        # Set up decoding HParams.
        decode_hparams = decoding.decode_hparams()
        decode_hparams.alpha = 0.0
        decode_hparams.beam_size = 1

        # Create Estimator.
        run_config = trainer_lib.create_run_config(hparams)
        estimator = trainer_lib.create_estimator(
            self.model_name,
            hparams,
            run_config,
            decode_hparams=decode_hparams
        )
        # Start the Estimator, loading from the specified checkpoint.
        input_fn = decoding.make_input_fn_from_generator(self.input_generator())
        self.predicted = estimator.predict(
            input_fn,
            checkpoint_path=self.ckpt_path  # Path of a specific checkpoint to predict.
        )

        # Burn
        next(self.predicted)

    def input_generator(self):
          while True:
            yield {
                "inputs": np.array([[self.inputs]], dtype=np.int32),
                "targets": np.zeros([1, 0], dtype=np.int32),
                "decode_length": np.array(self.decode_length, dtype=np.int32)
            }

    # Decode a list of IDs.
    def decode(self, ids, encoder):
        ids = list(ids)
        if text_encoder.EOS_ID in ids:
            ids = ids[:ids.index(text_encoder.EOS_ID)]
        return encoder.decode(ids)



    def midi_input_cleanup(self, midi_file_path):
      input_midi = note_seq.midi_file_to_note_sequence(midi_file_path)
      # Handle sustain pedal in the primer.
      primer_ns = note_seq.apply_sustain_control_changes(input_midi)

      # Trim to desired number of seconds.
      max_primer_seconds = 20  # @param {type:"slider", min:1, max:120}
      if primer_ns.total_time > max_primer_seconds:
        print('Primer is longer than %d seconds, truncating.' % max_primer_seconds)
        primer_ns = note_seq.extract_subsequence(
            primer_ns, 0, max_primer_seconds)

      # Remove drums from primer if present.
      if any(note.is_drum for note in primer_ns.notes):
        print('Primer contains drums; they will be removed.')
        notes = [note for note in primer_ns.notes if not note.is_drum]
        del primer_ns.notes[:]
        primer_ns.notes.extend(notes)

      # Set primer instrument and program.
      for note in primer_ns.notes:
        note.instrument = 1
        note.program = 0

      return primer_ns

    # @title Generate Continuation
    # @markdown Continue a piano performance, starting with the
    # @markdown chosen priming sequence.
    def generate_continuation(self, midi_file_path):

      primer_ns = self.midi_input_cleanup(midi_file_path)

      targets = self.conditional_encoders['targets'].encode_note_sequence(
          primer_ns)

      # Remove the end token from the encoded primer.
      targets = targets[:-1]

      # decode_length = max(0, 4096 - len(targets))
      self.decode_length =  256  # Reduced decode_length to the size of target for JAMINtheMLoop purposes.
      if len(targets) >= 4096:
            print('Primer has more events than maximum sequence length; nothing will be generated.')


      # Generate sample events.
      sample_ids = next(self.predicted)['outputs']


      # Decode to NoteSequence.
      midi_filename = self.decode(
          sample_ids,
          encoder = self.conditional_encoders['targets'])

      ns = note_seq.midi_file_to_note_sequence(midi_filename)

      # Append continuation to primer.
      # FINAL version MUST NOT concatenate the primer sequence
      # continuation_ns = note_seq.concatenate_sequences([primer_ns, ns])
      now = datetime.datetime.now()
      filename = "result/conditional_generate_" + now.strftime('%Y_%m_%d_%H_%M_%S') + '.mid'
      # note_seq.sequence_proto_to_midi_file(continuation_ns, filename)
      note_seq.sequence_proto_to_midi_file(ns, filename)
      print('Melody continuation generated in ' + filename)
      return filename
