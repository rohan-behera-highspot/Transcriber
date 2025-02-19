import React, { useState } from "react";
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, Alert
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { Card } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

export default function App() {
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [audioFileName, setAudioFileName] = useState("");  // New state to store file name
  const [transcription, setTranscription] = useState([]);
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        alert("Permission to access microphone is required!");
        return;
      }
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    setRecording(null);
    await recording.stopAndUnloadAsync();
    setAudioUri(recording.getURI());
  };

  const pickAudioFile = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setAudioUri(selectedFile.uri);
        setAudioFileName(selectedFile.name);  // Save file name

        // Show alert that file was uploaded successfully
        Alert.alert("Success", `File uploaded: ${selectedFile.name}`);
      } else {
        alert("No file selected!");
      }
    } catch (error) {
      console.error("Error picking audio file:", error);
      alert("Failed to pick an audio file.");
    }
  };

  const transcribeAudio = async () => {
    if (!audioUri) {
      alert("No audio selected!");
      return;
    }
    setLoading(true);
    let formData = new FormData();
    formData.append("file", {
      uri: audioUri,
      name: audioFileName || "audiofile.wav",
      type: "audio/wav",
    });
    try {
      let response = await fetch("YOUR_PYTHON_API_URL/transcribe", {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      let json = await response.json();
      setTranscription(json.transcripts);
    } catch (error) {
      console.error("Error transcribing audio", error);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>WhisperSpot</Text>
      <Card style={styles.card}>
        <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={[styles.button, { backgroundColor: recording ? "#ff3b30" : "#007AFF" }]}>
          <Ionicons name={recording ? "stop-circle" : "mic-circle"} size={30} color="white" />
          <Text style={styles.buttonText}>{recording ? "Stop Recording" : "Start Recording"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={pickAudioFile} style={styles.button}>
          <Ionicons name="cloud-upload-outline" size={30} color="white" />
          <Text style={styles.buttonText}>Upload Audio File</Text>
        </TouchableOpacity>

        {/* Show uploaded file name if available */}
        {audioFileName ? (
          <Text style={styles.fileName}>Uploaded File: {audioFileName}</Text>
        ) : null}

        <TouchableOpacity onPress={transcribeAudio} style={[styles.button, { backgroundColor: "#34C759" }]}>
          <Ionicons name="document-text-outline" size={30} color="white" />
          <Text style={styles.buttonText}>Get Transcription</Text>
        </TouchableOpacity>
      </Card>
      
      {loading && <ActivityIndicator size="large" color="#007AFF" />}
      
      <FlatList
        data={transcription}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Card style={styles.transcriptionCard}>
            <Text style={styles.transcriptionText}><Text style={styles.bold}>Start Time:</Text> {item.start_time}</Text>
            <Text style={styles.transcriptionText}><Text style={styles.bold}>Speaker:</Text> {item.speaker}</Text>
            <Text style={styles.transcriptionText}><Text style={styles.bold}>Message:</Text> {item.text}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  card: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    marginLeft: 10,
  },
  fileName: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    fontWeight: "bold",
  },
  transcriptionCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginVertical: 8,
    elevation: 3,
  },
  transcriptionText: {
    fontSize: 16,
    marginBottom: 5,
  },
  bold: {
    fontWeight: "bold",
  }
});
