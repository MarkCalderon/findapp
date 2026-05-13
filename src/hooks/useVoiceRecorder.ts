import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

import { transcribeAudio } from '@/src/utils/transcribeAudio';

type RecorderState = 'idle' | 'recording' | 'transcribing';

export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const startRecording = useCallback(async () => {
    setError(null);
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      setError('Microphone permission denied');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recordingRef.current = recording;
    setState('recording');
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    setState('transcribing');
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recordingRef.current = null;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    if (!uri) {
      setError('No audio captured — please try again');
      setState('idle');
      return;
    }

    try {
      const text = await transcribeAudio(uri);
      if (text) {
        onTranscriptRef.current(text);
      } else {
        setError('Nothing was detected — please try again');
      }
    } catch {
      setError('Transcription failed — please try again');
    } finally {
      setState('idle');
    }
  }, []);

  const toggle = useCallback(() => {
    if (state === 'idle') startRecording();
    else if (state === 'recording') stopRecording();
  }, [state, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => null);
        recordingRef.current = null;
      }
    };
  }, []);

  return {
    isRecording: state === 'recording',
    isTranscribing: state === 'transcribing',
    toggle,
    error,
    clearError: () => setError(null),
  };
}
