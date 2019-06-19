#!/usr/bin/python3
import os, sys, json
import numpy as np
import subprocess
import essentia
import essentia.standard as es
sys.path.append(os.path.abspath("lib/"))
from rdp import rdp
import matplotlib.pyplot as plt

profile = "lib/essentia/profile_songvis.yaml"
profile_wavesection = "lib/essentia/profile_wavesection.yaml"
profile_low = "lib/essentia/profile_low.yaml"

class NumpyEncoder(json.JSONEncoder):
    """ Special json encoder for numpy types """
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
            np.int16, np.int32, np.int64, np.uint8,
            np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float_, np.float16, np.float32,
            np.float64)):
            return float(obj)
        elif isinstance(obj,(np.ndarray,)):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

# General Music Genre
def getGenre(feature):
    genres = {
        "cla" : "classical",
        "dan" : "dance",
        "hip" : "hiphop",
        "jaz" : "jazz",
        "pop" : "pop",
        "rhy" : "rb",
        "roc" : "rock"
    }
    return genres[feature]

# Predominant Instrument
def getInstrument(feature):
    instrument = {
        "cel" : "violin",
        "cla" : "sax",
        "flu" : "sax",
        "gac" : "guitar",
        "gel" : "guitar",
        "org" : "piano",
        "pia" : "piano",
        "sax" : "saxophone",
        "tru" : "saxophone",
        "vio" : "violin",
        "voi" : "voice"
    }
    return instrument[feature]

# General bpm
def getBPM(feature):
    if(feature < 108):
        bpm = "slow"
    else:
        bpm = "fast"
    return bpm

# General Mood
def getMood(feature):
    return feature

# General danceability \cite{Streich2005}
def getDanceability(feature):
    if(feature<0.863):
        danceability = "notdanceable"
    else:
        danceability = "danceable"
    return danceability

# Wave data
def getGlyphs(audio):
    glyphs = {}

    # Temp files
    temp_lowlevel = ".temp_low_" + str(os.path.splitext(os.path.basename(musicfile))[0]) + ".json"

    temp_highlevel = ".temp_high_" +str(os.path.splitext(os.path.basename(musicfile))[0]) + ".json"

    # Call low level descriptors
    subprocess.run(["lib/essentia/streaming_extractor_music", musicfile, temp_lowlevel])

    # Call high level descriptors
    subprocess.run(["essentia_streaming_extractor_music_svm", temp_lowlevel, temp_highlevel, profile])

    # Read low level descriptors file
    with open(temp_lowlevel, 'r', encoding='utf-8') as f:
        lowlevel_content = json.load(f)
        f.close()

    # Read high level descriptors file
    with open(temp_highlevel, 'r', encoding='utf-8') as f:
        highlevel_content = json.load(f)
        f.close()

    # Delete temporary low level and high level files
    os.remove(temp_lowlevel)
    os.remove(temp_highlevel)

    # Get each glyph

    bpm = {
        "bpm" : lowlevel_content["rhythm"]["bpm"],
        "value" : getBPM(lowlevel_content["rhythm"]["bpm"])
    }
    glyphs["bpm"] = bpm

    danceability = {
        "probability" : lowlevel_content["rhythm"]["danceability"],
        "value" : getDanceability(lowlevel_content["rhythm"]["danceability"])
    }
    glyphs["danceability"] = danceability

    mood = {
        "value" : getMood(highlevel_content["highlevel"]["mood_happy"]["all"]["happy"])
    }
    glyphs["mood"] = mood

    genre = {
        "probability" : highlevel_content["highlevel"]["genre_rosamerica"]["probability"],
        "value" : getGenre(highlevel_content["highlevel"]["genre_rosamerica"]["value"])
    }
    glyphs["genre"] = genre

    instrument = {
        "probability" : highlevel_content["highlevel"]["instrument_irmas"]["probability"],
        "value" : getInstrument(highlevel_content["highlevel"]["instrument_irmas"]["value"])
    }
    glyphs["instrument"] = instrument

    return glyphs

def getWaveSection(audio):
    # Set sizes
    n_samples = len(audio)
    n_of_blocks = 20
    samples_per_block = int(n_samples / n_of_blocks)

    # Final dictionary
    wave_data = {}

    # For each block
    for i in range(0, n_of_blocks):
        # x0, x1, avg_mood, avg_bpm, strong_peak, energy bands
        block = {"x0" : 0, "x1" : 0, "avg_mood" : 0, "avg_bpm" : 0, "strong_peak" : 0, "energy_band": ""}

        ## Add x0 and x1
        x0 = i*samples_per_block
        x1 = samples_per_block*(i+1)
        block["x0"] = x0
        block["x1"] = x1

        # Take a sample of the audio file...
        samples = audio[x0:x1]

        # Create temporary file for audio sample
        # monowriter to .tmp.wav
        es.MonoWriter(filename='.tmp.wav')(samples)

        # Extract lowlevel features
        subprocess.run(["lib/essentia/streaming_extractor_music", '.tmp.wav', '.l_tmp', profile_low])

        # Create temporary file for lowlevel features
        # Read low level descriptors file
        with open('.l_tmp', 'r', encoding='utf-8') as f:
            lowlevel_content = json.load(f)
            f.close()

        # Read with highlevel extractor
        subprocess.run(["essentia_streaming_extractor_music_svm", '.l_tmp', '.h_tmp', profile_wavesection])

        # Read high level descriptors file
        with open('.h_tmp', 'r', encoding='utf-8') as f:
            highlevel_content = json.load(f)
            f.close()

        ## Add avg energy
        block["strong_peak"] = lowlevel_content["lowlevel"]["spectral_strongpeak"]["mean"]

        ## Add avg bpm
        block["avg_bpm"] = lowlevel_content["rhythm"]["bpm"]

        ## Add avg bpm
        block["avg_mood"] = highlevel_content["highlevel"]["mood_happy"]["all"]["happy"]

        ## Spectral energy band
        energy_band = {}

        energy_band["low"] = lowlevel_content["lowlevel"]["spectral_energyband_low"]["mean"]

        energy_band["middle_low"] = lowlevel_content["lowlevel"]["spectral_energyband_middle_low"]["mean"]

        energy_band["middle_high"] = lowlevel_content["lowlevel"]["spectral_energyband_middle_high"]["mean"]

        energy_band["high"] = lowlevel_content["lowlevel"]["spectral_energyband_high"]["mean"]

        block["energy_band"] = energy_band

        # Insert in dictionary with key = i
        wave_data[i] = block

    # Delete temporary files
    os.remove('.tmp.wav')
    os.remove('.l_tmp')
    os.remove('.h_tmp')

    return wave_data

def getSamples(audio):
    # sample_rate = 44100
    # samples_per_second = 10
    #
    # n_of_samples = int(samples_per_second * len(audio)/sample_rate)
    n_of_samples = 256

    samples = []
    hop_size = int(len(audio)/n_of_samples)

    for i in range(0,n_of_samples):
        # samples.append([i,audio[i*hop_size]])
        samples.append(audio[i*hop_size])

    # samples = np.array(samples)
    # samples = rdp(samples, epsilon=0.1)
    # samples = (samples[:,1])
    return samples

try:
    # Final JSON
    songvis_json = {}

    # File names
    musicfile = str(sys.argv[1])
    outputname = str(os.path.splitext(os.path.basename(musicfile))[0]) + ".json"

    # Read musicfile
    audio = es.MonoLoader(filename=musicfile)()

    # Add samples
    songvis_json["samples"] = getSamples(audio)

    # Add wave section
    songvis_json["wave"] =  getWaveSection(audio)

    # Add glyphs section
    songvis_json["glyphs"] = getGlyphs(audio)

    # Metadata
    metadata = {
        "filename" : str(os.path.splitext(os.path.basename(musicfile))[0]),
        "sample_rate" : 44100
    }
    songvis_json["metadata"] = metadata

    # Write to json
    with open(outputname, 'w', encoding='utf-8') as f:
        json.dump(songvis_json, f, cls=NumpyEncoder, indent=4)
    f.close()

except Exception as e:
    print(e)

# if __name__ == '__main__':
#     parser = ArgumentParser(description = """Generate SongVis json file.# """)
#
#     parser.add_argument('-d', '--dir', help='input directory', required=True)
#     parser.add_argument('--output-json', help='output json file with audio analysis results', required=False)
#
#     args = parser.parse_args()
#
#     analyze_dir(args.dir, args.output_json, args.output_dir, args.type, args.profile, args.frames, args.include, args.ignore, args.skip_analyzed)

# if __name__ == '__main__':
#     parser = ArgumentParser(description = """
# Analyzes all audio files found (recursively) in a folder using MusicExtractor.
# """)
#
#     parser.add_argument('-d', '--dir', help='input directory', required=True)
#     parser.add_argument('--output-json', help='output json file with audio analysis results', required=False)
#     parser.add_argument('--output-dir', help='output directory to store descriptor files (maintains input directory structure)', required=False)
#     parser.add_argument('-t', '--type', nargs='+', help='type of audio files to include (can use wildcards)', required=False)
#     parser.add_argument('--profile', help='MusicExtractor profile', required=False)
#     parser.add_argument('--frames', help='store frames data', action='store_true', required=False)
#     parser.add_argument('--include', nargs='+', help='descriptors to include (can use wildcards)', required=False)
#     parser.add_argument('--ignore', nargs='+', help='descriptors to ignore (can use wildcards)', required=False)
#     parser.add_argument('--skip-analyzed', help='skip audio files for which descriptor files were found in the output directory', action='store_true')
#     args = parser.parse_args()
#
#     analyze_dir(args.dir, args.output_json, args.output_dir, args.type, args.profile, args.frames, args.include, args.ignore, args.skip_analyzed)
