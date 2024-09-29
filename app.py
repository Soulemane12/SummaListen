from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import base64
import speech_recognition as sr
from transformers import pipeline
import yt_dlp
import os
from pydub import AudioSegment

app = Flask(__name__)
CORS(app)

# Initialize the speech recognizer
recognizer = sr.Recognizer()
# Initialize the summarization pipeline for text
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def summarize_text(text, chunk_size=1000):
    """Summarize the provided text using the summarization model."""
    chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
    summaries = []
    for chunk in chunks:
        print(f"Summarizing chunk: {chunk[:50]}...")  # Print the first 50 characters of the chunk
        summary = summarizer(chunk, max_length=50, min_length=25, do_sample=False)
        if summary:
            summaries.append(summary[0]['summary_text'])
    combined_summary = " ".join(summaries)
    print(f"Combined summary: {combined_summary[:100]}...")  # Print the first 100 characters of the combined summary
    return combined_summary

def ensure_wav_format(audio_file):
    """Convert audio file to .wav format if necessary."""
    if not audio_file.endswith('.wav'):
        print(f"Converting {audio_file} to .wav format")
        sound = AudioSegment.from_file(audio_file)
        wav_file = audio_file.rsplit('.', 1)[0] + '.wav'
        sound.export(wav_file, format='wav')
        print(f"Exported to {wav_file}")
        return wav_file
    return audio_file

def transcribe_audio(audio_data):
    """Transcribe the audio data to text."""
    print(f"Transcribing audio data: {audio_data}")
    audio_file = sr.AudioFile(audio_data)
    with audio_file as source:
        audio = recognizer.record(source)
    print("Audio recorded, recognizing...")
    return recognizer.recognize_google(audio)

def download_and_transcribe_youtube(link):
    """Download YouTube video and transcribe the audio."""
    ydl_opts = {
        'format': 'bestaudio/best',
        'extractaudio': True,
        'outtmpl': '%(id)s.%(ext)s',
    }

    print(f"Downloading YouTube video: {link}")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(link, download=True)
        audio_file = ydl.prepare_filename(info).rsplit('.', 1)[0] + '.wav'

    print(f"Downloaded audio file: {audio_file}")

    # Ensure the file exists and is not empty
    if os.path.exists(audio_file):
        print(f"Found audio file: {audio_file}, size: {os.path.getsize(audio_file)} bytes")

        # Ensure the file is in wav format
        audio_file = ensure_wav_format(audio_file)

        with sr.AudioFile(audio_file) as source:
            audio = recognizer.record(source)
            print("Audio recorded for transcription.")
            return recognizer.recognize_google(audio)
    else:
        raise FileNotFoundError(f"Audio file {audio_file} not found.")

@app.route('/')
def home():
    """Serve the home page with input options."""
    return render_template('index.html')

@app.route('/summarize', methods=['POST'])
def summarize():
    """Endpoint for text and audio summarization."""
    data = request.get_json()
    print(f"Received data for summarization: {data}")
    if 'text' in data:
        summary = summarize_text(data['text'])
        return jsonify({'summary': summary})
    elif 'audio' in data:
        audio_data = base64.b64decode(data['audio'])
        with open('temp_audio.wav', 'wb') as f:
            f.write(audio_data)
        print("Temporary audio file created for transcription.")
        transcript = transcribe_audio('temp_audio.wav')
        summary = summarize_text(transcript)
        return jsonify({'summary': summary})
    return jsonify({'error': 'No valid input provided.'})

@app.route('/summarize_youtube', methods=['POST'])
def summarize_youtube():
    """Endpoint for summarizing a YouTube video."""
    data = request.get_json()
    print(f"Received data for YouTube summarization: {data}")
    if 'link' in data:
        try:
            transcript = download_and_transcribe_youtube(data['link'])
            print(f"Transcription completed: {transcript[:100]}...")  # Print the first 100 characters of the transcript
            summary = summarize_text(transcript)
            return jsonify({'summary': summary})
        except Exception as e:
            print(f"Error during transcription: {str(e)}")
            return jsonify({'error': str(e)})
    return jsonify({'error': 'No valid YouTube link provided.'})

if __name__ == '__main__':
    app.run(debug=True)
