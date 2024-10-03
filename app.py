import os
import logging
import base64
import re
from io import BytesIO

from flask import Flask, request, jsonify
from flask_cors import CORS
import speech_recognition as sr
from transformers import pipeline
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
import nltk
from nltk.tokenize import sent_tokenize
from textblob import TextBlob  # For sentiment analysis

# Load environment variables
from dotenv import load_dotenv

load_dotenv()

# Initialize logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
CORS(app, resources={r"/summarize": {"origins": CORS_ORIGINS}})

# Initialize the speech recognizer
recognizer = sr.Recognizer()

# Initialize the summarization pipeline for English text
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Initialize sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis")

# Ensure NLTK data is available
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')


def summarize_text(text, chunk_size=1000):
    """Summarize the provided text using the summarization model."""
    logger.info("Starting text summarization.")
    sentences = sent_tokenize(text)
    summaries = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 < chunk_size:
            current_chunk += " " + sentence
        else:
            summaries.append(current_chunk.strip())
            current_chunk = sentence
    
    if current_chunk:
        summaries.append(current_chunk.strip())
    
    final_summary = ""
    for chunk in summaries:
        try:
            summary = summarizer(chunk, max_length=130, min_length=30, do_sample=False)
            final_summary += summary[0]['summary_text'] + " "
        except Exception as e:
            logger.error(f"Error during summarization: {e}")
    
    logger.info("Text summarization completed.")
    return final_summary.strip()


def generate_notes(text, num_ideas=5):
    """Generate key ideas from the summarized text."""
    logger.info("Generating key ideas from summary.")
    try:
        blob = TextBlob(text)
        sentences = blob.sentences
        key_ideas = [str(sentence) for sentence in sentences[:num_ideas]]
        logger.info("Key ideas generation completed.")
        return key_ideas
    except Exception as e:
        logger.error(f"Error during key ideas generation: {e}")
        return []


def analyze_sentiment(text):
    """Analyze sentiment of the provided text."""
    logger.info("Starting sentiment analysis.")
    try:
        sentiment = sentiment_analyzer(text)
        logger.info("Sentiment analysis completed.")
        return sentiment
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        return [{"label": "Neutral", "score": 0.0}]


def summarize_speech(audio_data):
    """Summarize the provided audio data."""
    logger.info("Starting speech summarization.")
    audio_buffer = BytesIO(audio_data)
    with sr.AudioFile(audio_buffer) as source:
        audio = recognizer.record(source)
    try:
        text = recognizer.recognize_google(audio)
        logger.info("Speech recognized successfully.")
        summary = summarize_text(text)
        notes = generate_notes(summary)
        sentiment = analyze_sentiment(summary)
        return summary, notes, sentiment
    except sr.UnknownValueError:
        logger.warning("Speech Recognition could not understand the audio.")
        return "Sorry, I could not understand the audio.", [], []
    except sr.RequestError as e:
        logger.error(f"Could not request results from Speech Recognition service; {e}")
        return f"Could not request results from Speech Recognition service; {e}", [], []


def extract_video_id(youtube_url):
    """Extract the video ID from the YouTube URL."""
    logger.info(f"Extracting video ID from URL: {youtube_url}")
    regex_patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'youtu\.be\/([0-9A-Za-z_-]{11}).*',
        r'embed\/([0-9A-Za-z_-]{11}).*',
        r'watch\?v=([0-9A-Za-z_-]{11}).*',
    ]
    for pattern in regex_patterns:
        match = re.search(pattern, youtube_url)
        if match:
            video_id = match.group(1)
            logger.info(f"Extracted Video ID: {video_id}")
            return video_id
    logger.error("Invalid YouTube URL provided.")
    raise ValueError("Invalid YouTube URL")


@app.route('/summarize', methods=['POST'])
def summarize():
    logger.info("Received summarization request.")
    try:
        data = request.get_json()
        if not data:
            logger.warning("No JSON data provided in the request.")
            return jsonify(error="No data provided."), 400

        if 'text' in data:
            logger.info("Processing text input for summarization.")
            text = data['text']
            summary = summarize_text(text)
            notes = generate_notes(summary)
            sentiment = analyze_sentiment(summary)
            return jsonify(summary=summary, notes=notes, sentiment=sentiment)

        elif 'audio' in data:
            logger.info("Processing audio input for summarization.")
            audio_base64 = data['audio']
            try:
                audio_data = base64.b64decode(audio_base64)
            except base64.binascii.Error as e:
                logger.error(f"Invalid audio data: {e}")
                return jsonify(error="Invalid audio data."), 400
            summary, notes, sentiment = summarize_speech(audio_data)
            return jsonify(summary=summary, notes=notes, sentiment=sentiment)

        elif 'youtube_url' in data:
            logger.info("Processing YouTube URL for summarization.")
            youtube_url = data['youtube_url']
            try:
                video_id = extract_video_id(youtube_url)
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                transcript = transcript_list.find_transcript(['en'])
                transcript_data = transcript.fetch()
                text = ' '.join([t['text'] for t in transcript_data])
                summary = summarize_text(text)
                notes = generate_notes(summary)
                sentiment = analyze_sentiment(summary)
                return jsonify(summary=summary, notes=notes, sentiment=sentiment)
            except VideoUnavailable:
                logger.error("The YouTube video is unavailable.")
                return jsonify(error="The YouTube video is unavailable."), 400
            except TranscriptsDisabled:
                logger.error("Transcripts are disabled for this YouTube video.")
                return jsonify(error="Transcripts are disabled for this YouTube video."), 400
            except NoTranscriptFound:
                logger.error("No transcript found for the provided YouTube video.")
                return jsonify(error="No transcript found for the provided YouTube video."), 400
            except Exception as e:
                logger.error(f"Error processing YouTube video: {e}")
                return jsonify(error=f"Error processing YouTube video: {str(e)}"), 400

        else:
            logger.warning("Invalid input provided.")
            return jsonify(error="Invalid input. Please provide text, audio, or a YouTube URL."), 400

    except Exception as e:
        logger.exception(f"An unexpected error occurred: {e}")
        return jsonify(error=f"An unexpected error occurred: {str(e)}"), 500


if __name__ == '__main__':
    # Use environment variables for host and port if needed
    HOST = os.getenv("FLASK_HOST", "0.0.0.0")
    PORT = int(os.getenv("FLASK_PORT", 5000))
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() in ['true', '1', 't']
    try:
        app.run(host=HOST, port=PORT, debug=debug_mode)
    except Exception as e:
        logger.exception(f"Failed to start the Flask app: {e}")
        exit(1)
