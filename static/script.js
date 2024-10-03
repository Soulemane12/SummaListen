// script.js

document.addEventListener("DOMContentLoaded", function() {
    // Elements
    const speechNavButton = document.getElementById("speech-nav");
    const textNavButton = document.getElementById("text-nav");
    const youtubeNavButton = document.getElementById("youtube-nav");
    const themeToggleButton = document.getElementById("theme-toggle");
    const loadingSpinner = document.getElementById("loading-spinner");

    const speechSection = document.getElementById("speech-section");
    const textSection = document.getElementById("text-section");
    const youtubeSection = document.getElementById("youtube-section");

    const startRecordingButton = document.getElementById("start-recording");
    const summarizeSpeechButton = document.getElementById("summarize");
    const transcriptDiv = document.getElementById("transcript");
    const speechStatusMessage = document.getElementById("speech-status-message");
    const speechSummaryDiv = document.getElementById("speech-summary");
    const speechSummaryText = document.getElementById("speech-summary-text");
    const speechNotesDiv = document.getElementById("speech-notes");
    const speechNotesList = document.getElementById("speech-notes-list");
    const speechSentimentDiv = document.getElementById("speech-sentiment");
    const speechSentimentText = document.getElementById("speech-sentiment-text");

    const textInput = document.getElementById("text-input");
    const submitTextButton = document.getElementById("submit-text");
    const textStatusMessage = document.getElementById("text-status-message");
    const textSummaryDiv = document.getElementById("text-summary");
    const textSummaryText = document.getElementById("text-summary-text");
    const textNotesDiv = document.getElementById("text-notes");
    const textNotesList = document.getElementById("text-notes-list");
    const textSentimentDiv = document.getElementById("text-sentiment");
    const textSentimentText = document.getElementById("text-sentiment-text");

    const youtubeURLInput = document.getElementById("youtube-url");
    const summarizeVideoButton = document.getElementById("summarize-video");
    const videoStatusMessage = document.getElementById("video-status-message");
    const videoSummaryDiv = document.getElementById("video-summary");
    const videoSummaryText = document.getElementById("video-summary-text");
    const videoNotesDiv = document.getElementById("video-notes");
    const videoNotesList = document.getElementById("video-notes-list");
    const videoSentimentDiv = document.getElementById("video-sentiment");
    const videoSentimentText = document.getElementById("video-sentiment-text");

    // Backend URL from config.js
    // Ensure config.js is included before script.js in index.html
    // Example: const BACKEND_URL = 'http://localhost:5000/summarize';
    // If not, define it here:
    // const BACKEND_URL = 'http://localhost:5000/summarize';

    // Theme State
    let isDarkMode = false;

    // Speech Recognition
    let recognition;
    let isRecording = false;

    // Navigation Functions
    function showSection(section) {
        // Hide all sections
        speechSection.classList.add("hidden");
        textSection.classList.add("hidden");
        youtubeSection.classList.add("hidden");

        // Remove active class from all nav buttons
        speechNavButton.classList.remove("active");
        textNavButton.classList.remove("active");
        youtubeNavButton.classList.remove("active");

        // Show the selected section and activate the corresponding nav button
        switch(section) {
            case 'speech':
                speechSection.classList.remove("hidden");
                speechNavButton.classList.add("active");
                break;
            case 'text':
                textSection.classList.remove("hidden");
                textNavButton.classList.add("active");
                break;
            case 'youtube':
                youtubeSection.classList.remove("hidden");
                youtubeNavButton.classList.add("active");
                break;
            default:
                speechSection.classList.remove("hidden");
                speechNavButton.classList.add("active");
        }
    }

    // Event Listeners for Navigation
    speechNavButton.addEventListener("click", () => showSection('speech'));
    textNavButton.addEventListener("click", () => showSection('text'));
    youtubeNavButton.addEventListener("click", () => showSection('youtube'));

    // Theme Toggle Functionality
    themeToggleButton.addEventListener("click", toggleTheme);

    function toggleTheme() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle("dark");
        if (isDarkMode) {
            themeToggleButton.innerHTML = '<i class="fas fa-sun mr-2"></i> Light Mode';
        } else {
            themeToggleButton.innerHTML = '<i class="fas fa-moon mr-2"></i> Dark Mode';
        }
    }

    // Initialize Theme based on default
    function initializeTheme() {
        if (isDarkMode) {
            document.body.classList.add("dark");
            themeToggleButton.innerHTML = '<i class="fas fa-sun mr-2"></i> Light Mode';
        } else {
            document.body.classList.remove("dark");
            themeToggleButton.innerHTML = '<i class="fas fa-moon mr-2"></i> Dark Mode';
        }
    }

    initializeTheme();

    // Speech Recording Functions
    startRecordingButton.addEventListener("click", () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    function startRecording() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            speechStatusMessage.textContent = "Speech Recognition is not supported in this browser.";
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; // Default language
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.start();
        isRecording = true;
        startRecordingButton.innerHTML = '<i class="fas fa-stop mr-2"></i> Stop Recording';
        speechStatusMessage.textContent = "Recording...";
        transcriptDiv.classList.remove("hidden");
        transcriptDiv.textContent = "";
        summarizeSpeechButton.disabled = true;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            transcriptDiv.textContent = transcript;
            if (event.results[0].isFinal) {
                summarizeSpeechButton.disabled = false;
            }
        };

        recognition.onerror = (event) => {
            speechStatusMessage.textContent = `Error occurred in recognition: ${event.error}`;
            stopRecording();
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start();
            }
        };
    }

    function stopRecording() {
        recognition.stop();
        isRecording = false;
        startRecordingButton.innerHTML = '<i class="fas fa-microphone mr-2"></i> Start Recording';
        speechStatusMessage.textContent = "Recording stopped.";
    }

    // Summarize Speech
    summarizeSpeechButton.addEventListener("click", async () => {
        const transcript = transcriptDiv.textContent.trim();
        if (!transcript) {
            speechStatusMessage.textContent = "No transcript available to summarize.";
            return;
        }

        showLoadingSpinner(true);
        speechStatusMessage.textContent = "Summarizing speech...";
        const response = await summarizeText(transcript);
        showLoadingSpinner(false);

        if (response.error) {
            speechStatusMessage.textContent = response.error;
            return;
        }

        // Display Summary
        speechSummaryText.textContent = response.summary;
        speechSummaryDiv.classList.remove("hidden");

        // Display Notes
        if (response.notes && response.notes.length > 0) {
            speechNotesList.innerHTML = "";
            response.notes.forEach((note, index) => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>Idea ${index + 1}:</strong> ${note}`;
                speechNotesList.appendChild(li);
            });
            speechNotesDiv.classList.remove("hidden");
        } else {
            speechNotesDiv.classList.add("hidden");
        }

        // Display Sentiment
        if (response.sentiment && response.sentiment.length > 0) {
            const sentiment = response.sentiment[0];
            speechSentimentText.textContent = `${sentiment.label} (${(sentiment.score * 100).toFixed(2)}%)`;
            speechSentimentDiv.classList.remove("hidden");
        } else {
            speechSentimentDiv.classList.add("hidden");
        }

        speechStatusMessage.textContent = "Summarization complete.";
    });

    // Summarize Text Input
    submitTextButton.addEventListener("click", async () => {
        const text = textInput.value.trim();
        if (!text) {
            textStatusMessage.textContent = "Please enter text to summarize.";
            return;
        }

        showLoadingSpinner(true);
        textStatusMessage.textContent = "Summarizing text...";
        const response = await summarizeText(text);
        showLoadingSpinner(false);

        if (response.error) {
            textStatusMessage.textContent = response.error;
            return;
        }

        // Display Summary
        textSummaryText.textContent = response.summary;
        textSummaryDiv.classList.remove("hidden");

        // Display Notes
        if (response.notes && response.notes.length > 0) {
            textNotesList.innerHTML = "";
            response.notes.forEach((note, index) => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>Idea ${index + 1}:</strong> ${note}`;
                textNotesList.appendChild(li);
            });
            textNotesDiv.classList.remove("hidden");
        } else {
            textNotesDiv.classList.add("hidden");
        }

        // Display Sentiment
        if (response.sentiment && response.sentiment.length > 0) {
            const sentiment = response.sentiment[0];
            textSentimentText.textContent = `${sentiment.label} (${(sentiment.score * 100).toFixed(2)}%)`;
            textSentimentDiv.classList.remove("hidden");
        } else {
            textSentimentDiv.classList.add("hidden");
        }

        textStatusMessage.textContent = "Summarization complete.";
    });

    // Summarize YouTube Video
    summarizeVideoButton.addEventListener("click", async () => {
        const youtubeURL = youtubeURLInput.value.trim();
        if (!youtubeURL) {
            videoStatusMessage.textContent = "Please enter a YouTube video URL.";
            return;
        }

        showLoadingSpinner(true);
        videoStatusMessage.textContent = "Summarizing YouTube video...";
        const response = await summarizeYouTube(youtubeURL);
        showLoadingSpinner(false);

        if (response.error) {
            videoStatusMessage.textContent = response.error;
            return;
        }

        // Display Summary
        videoSummaryText.textContent = response.summary;
        videoSummaryDiv.classList.remove("hidden");

        // Display Notes
        if (response.notes && response.notes.length > 0) {
            videoNotesList.innerHTML = "";
            response.notes.forEach((note, index) => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>Idea ${index + 1}:</strong> ${note}`;
                videoNotesList.appendChild(li);
            });
            videoNotesDiv.classList.remove("hidden");
        } else {
            videoNotesDiv.classList.add("hidden");
        }

        // Display Sentiment
        if (response.sentiment && response.sentiment.length > 0) {
            const sentiment = response.sentiment[0];
            videoSentimentText.textContent = `${sentiment.label} (${(sentiment.score * 100).toFixed(2)}%)`;
            videoSentimentDiv.classList.remove("hidden");
        } else {
            videoSentimentDiv.classList.add("hidden");
        }

        videoStatusMessage.textContent = "Summarization complete.";
    });

    // Function to show or hide loading spinner
    function showLoadingSpinner(show) {
        if (show) {
            loadingSpinner.classList.remove("hidden");
        } else {
            loadingSpinner.classList.add("hidden");
        }
    }

    // Function to send text to backend for summarization
    async function summarizeText(text) {
        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }),
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                const errorData = await response.json();
                return { error: errorData.error || "Error summarizing the text." };
            }
        } catch (error) {
            console.error("Error:", error);
            return { error: "An error occurred while summarizing the text." };
        }
    }

    // Function to send YouTube URL to backend for summarization
    async function summarizeYouTube(youtubeURL) {
        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ youtube_url: youtubeURL }),
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                const errorData = await response.json();
                return { error: errorData.error || "Error summarizing the YouTube video." };
            }
        } catch (error) {
            console.error("Error:", error);
            return { error: "An error occurred while summarizing the YouTube video." };
        }
    }

    // Initialize by showing the default section
    showSection('speech');
});
