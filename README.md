# SummaListen

SummaListen is a Python-based application that allows users to summarize audio from YouTube videos and transcribe audio files into text. This project aims to provide an easy way to extract key information from lengthy audio sources, making it a valuable tool for students, researchers, and anyone interested in efficiently consuming content.

## Features

- **YouTube Video Summarization**: 
  - Download and transcribe audio from YouTube videos to generate concise summaries.
  
- **Audio Transcription**: 
  - Convert audio files into text format for easy reading and summarization.

- **Text Summarization**: 
  - Utilize advanced natural language processing techniques to summarize long texts into key points, making information more digestible.

- **User-Friendly Interface**: 
  - A simple and intuitive web interface that allows users to input text or audio and retrieve summaries easily.

- **Cross-Origin Resource Sharing (CORS)**: 
  - Enables the application to be accessed from different domains without issues, enhancing usability across various platforms.

## Technologies Used

- **Flask**: A lightweight WSGI web application framework for Python.
- **Speech Recognition**: To transcribe audio data into text.
- **Transformers**: Utilizing models from Hugging Face for advanced summarization capabilities.
- **youtube-dl**: A command-line program to download videos from YouTube and other sites.

## How It Works

1. **Input Source**: Users can either input a YouTube link or upload audio files.
2. **Transcription**: The application transcribes the audio into text using speech recognition technologies.
3. **Summarization**: The transcribed text or any provided text is summarized to highlight key information.
4. **Output**: Users receive the summarized content in an easily readable format.

## Future Enhancements

- Implement user authentication for saving and retrieving previous summaries.
- Allow users to adjust the summary length and detail level.
- Support additional video and audio platforms for enhanced functionality.

## Contributing

Contributions to SummaListen are welcome! If you have suggestions or improvements, please feel free to submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
