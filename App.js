import React, { useState } from "react";
import { View, Text, TouchableOpacity, Button, StyleSheet, FlatList, SafeAreaView } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { Card } from 'react-native-paper';
import AssetExample from './components/AssetExample';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [transcription, setTranscription] = useState([]);

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
    let result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (result.type === "success") {
      setAudioUri(result.uri);
    }
  };

  const transcribeAudio = async () => {
    if (!audioUri) {
      alert("No audio selected!");
      return;
    }

    let formData = new FormData();
    formData.append("file", {
      uri: audioUri,
      name: "audiofile.wav",
      type: "audio/wav",
    });

    try {
      let response = await fetch("YOUR_PYTHON_API_URL/transcribe", {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      let json = await response.json();
      setTranscription(json.transcript);
    } catch (error) {
      console.error("Error transcribing audio", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Speech Transcriber</Text>
      <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={styles.button}>
        <Text style={styles.buttonText}>{recording ? "Stop Recording" : "Start Recording"}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={pickAudioFile} style={styles.button}>
        <Text style={styles.buttonText}>Upload Audio File</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={transcribeAudio} style={styles.button}>
        <Text style={styles.buttonText}>Get Transcription</Text>
      </TouchableOpacity>
      <FlatList
        data={transcription}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.transcription}>{item}</Text>}
      />
      <Card>
        <AssetExample />
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: "blue",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  transcription: {
    fontSize: 14,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});
