import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { Card, Divider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";


export default function App() {
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [audioFileName, setAudioFileName] = useState(""); // New state to store file name
  const [transcription, setTranscription] = useState([
    {
      start_time: 0.008488964346349746,
      end_time: 3.1154499151103567,
      speaker: "SPEAKER_02",
      text: "Okay, so are you ready to jump into something pretty interesting?",
    },
    {
      start_time: 3.0135823429541597,
      end_time: 4.847198641765704,
      speaker: "SPEAKER_01",
      text: "Absolutely. Let's do it. Let's go.",
    },
    {
      start_time: 3.6247877758913414,
      end_time: 4.7247877758913415,
      speaker: "SPEAKER_02",
      text: "Let's do it. Let's go.",
    },
    {
      start_time: 5.101867572156197,
      end_time: 6.35823429541596,
      speaker: "SPEAKER_02",
      text: "Okay. Yeah. ",
    },
    {
      start_time: 5.3056027164685915,
      end_time: 6.405602716468591,
      speaker: "SPEAKER_01",
      text: "Yeah. ",
    },
    {
      start_time: 6.35823429541596,
      end_time: 7.458234295415959,
      speaker: "SPEAKER_01",
      text: "You know you hear all this",
    },
    {
      start_time: 6.663837011884551,
      end_time: 14.643463497453311,
      speaker: "SPEAKER_02",
      text: "You know, you hear all this stuff about how to level up your sales game and all that. This presentation that we're looking at today is called Fall.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);


  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mm = String(date.getUTCMinutes()).padStart(2, "0");
    const ss = String(date.getUTCSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        alert("Permission to access microphone is required!");
        return;
      }
      const recordingInstance = new Audio.Recording();
      await recordingInstance.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recordingInstance.startAsync();
      setRecording(recordingInstance);
      Alert.alert("Recording Started", "Your audio recording has begun.");
    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Could not start recording.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setAudioFileName("RecordedAudio.wav"); // Set a name for recorded files
      setRecording(null);
      Alert.alert("Recording Stopped", "Audio file saved successfully.");
    } catch (err) {
      console.error("Failed to stop recording", err);
      alert("Could not stop recording.");
    }
  };

  const pickAudioFile = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setAudioUri(selectedFile.uri);
        setAudioFileName(selectedFile.name); // Save file name

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

  const playAudio = async () => {
    if (!audioUri) {
      alert("No audio selected!");
      return;
    }
  
    try {
      if (sound) {
        await sound.unloadAsync(); // Unload previous sound
      }
  
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
  
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
  
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
    } catch (error) {
      console.error("Error playing audio:", error);
      alert("Could not play audio file.");
    }
  };
  
  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
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
      let response = await fetch("http://192.168.1.4:8000/transcribe/", {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
        redirect: "follow",
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
        <TouchableOpacity
          onPress={recording ? stopRecording : startRecording}
          style={[styles.button, { backgroundColor: recording ? "#ff3b30" : "#007AFF" }]}
        >
          <Ionicons name={recording ? "stop-circle" : "mic-circle"} size={30} color="white" />
          <Text style={styles.buttonText}>{recording ? "Stop Recording" : "Start Recording"}</Text>
        </TouchableOpacity>

        {/* Audio File Picker */}
        <TouchableOpacity onPress={pickAudioFile} style={styles.button}>
          <Ionicons name="cloud-upload-outline" size={30} color="white" />
          <Text style={styles.buttonText}>Upload Audio File</Text>
        </TouchableOpacity>

        {/* Show uploaded file name if available
        {audioFileName ? <Text style={styles.fileName}>Uploaded File: {audioFileName}</Text> : null} */}

        <TouchableOpacity
          onPress={transcribeAudio}
          style={[styles.button, { backgroundColor: "#34C759" }]}
        >
          <Ionicons name="document-text-outline" size={30} color="white" />
          <Text style={styles.buttonText}>Get Transcription</Text>
        </TouchableOpacity>

         {/* Show uploaded or recorded file name */}
         {audioUri && (
          <View style={styles.audioFileContainer}>
            <Ionicons name="musical-notes-outline" size={24} color="#007AFF" />
            <Text style={styles.fileName}>{audioFileName}</Text>
            
            {/* Play Button */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
              <TouchableOpacity onPress={isPlaying ? pauseAudio : playAudio} style={styles.playButton}>
                <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={32} color="#34C759" />
                <Text style={styles.playButtonText}>{isPlaying ? "Pause" : "Play"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
      </Card>

      {loading && <ActivityIndicator size="large" color="#007AFF" />}

      <FlatList
        data={transcription}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card2}>
            <Card.Content>
              <Text style={styles.speakerTitle}>{item.speaker}</Text>
              <Text style={styles.timestamp}>
                ⏱ {formatTime(item.start_time)} - {formatTime(item.end_time)}
              </Text>
              <Divider style={styles.divider} />
              <Text style={styles.message}>{item.text}</Text>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
    marginTop: 24,
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
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
  audioFileContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButtonText: {
    fontSize: 16,
    marginBottom: 5,
  },
  bold: {
    fontWeight: "bold",
  },
  listContainer: {
    padding: 10,
  },
  card: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 4,
  },
  card2: {
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 3, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  speakerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  message: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  divider: {
    marginVertical: 5,
  },
});
