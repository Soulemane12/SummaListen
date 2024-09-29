// script.js

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function showTab(tabName) {
    const textTab = document.getElementById('text-tab');
    const audioTab = document.getElementById('audio-tab');
    const youtubeTab = document.getElementById('youtube-tab');
    const tabButtons = document.querySelectorAll('.tab-button');

    textTab.style.display = 'none';
    audioTab.style.display = 'none';
    youtubeTab.style.display = 'none';

    if (tabName === 'text') {
        textTab.style.display = 'block';
        tabButtons[0].classList.add('active');
    } else if (tabName === 'audio') {
        audioTab.style.display = 'block';
        tabButtons[1].classList.add('active');
    } else {
        youtubeTab.style.display = 'block';
        tabButtons[2].classList.add('active');
    }

    // Reset active class for other buttons
    tabButtons.forEach((button, index) => {
        if (index !== (tabName === 'text' ? 0 : tabName === 'audio' ? 1 : 2)) {
            button.classList.remove('active');
        }
    });
}

async function toggleRecording() {
    if (!isRecording) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        isRecording = true;
        document.getElementById('record-button').innerText = 'Stop Recording';
        document.getElementById('summarize-button').disabled = false;

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Audio = reader.result.split(',')[1]; // Get base64 part
                await summarizeAudio(base64Audio);
            };
            reader.readAsDataURL(audioBlob);
        };
    } else {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('record-button').innerText = 'Start Recording';
        audioChunks = []; // Clear the chunks for the next recording
    }
}

async function summarizeText() {
    const textInput = document.getElementById('text-input').value;
    const progressText = document.getElementById('text-progress');

    // Simulating progress
    progressText.innerText = "Processing...";
    setTimeout(() => {
        // Simulated summarization (replace this with actual model inference)
        const summary = textInput.split('. ').slice(0, 2).join('. ') + '.';
        document.getElementById('text-summary').innerText = summary;
        progressText.innerText = "100%";
    }, 2000); // Simulate delay
}

async function summarizeAudio(base64Audio) {
    const progressText = document.getElementById('audio-progress');
    progressText.innerText = "Processing...";
    
    // Simulated audio transcription
    setTimeout(() => {
        const transcript = "This is a simulated transcription of the audio input."; 
        const summary = transcript.split('. ').slice(0, 2).join('. ') + '.';
        document.getElementById('audio-summary').innerText = summary;
        progressText.innerText = "100%";
    }, 2000); // Simulate delay
}

async function summarizeYouTube() {
    const youtubeLink = document.getElementById('youtube-link').value;
    const progressText = document.getElementById('youtube-progress');
    progressText.innerText = "Processing...";

    // Simulate downloading and summarizing YouTube video (this would be an async call to a service)
    setTimeout(() => {
        const transcript = "This is a simulated transcription of the YouTube video content.";
        const summary = transcript.split('. ').slice(0, 2).join('. ') + '.';
        document.getElementById('youtube-summary').innerText = summary;
        progressText.innerText = "100%";
    }, 2000); // Simulate delay
}

// Show the text tab by default
showTab('text');
