import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { transcriptValidator } from '@/src/utils/homeForm';

export default function HomeScreen() {
  const router = useRouter();

  const form = useForm({
    defaultValues: { transcript: '' },
    onSubmit: async ({ value }) => {
      router.push({
        pathname: '/results',
        params: { transcript: value.transcript },
      });
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center items-center px-6 py-5">
            {/* Header */}
            <View className="mb-8">
              <Text
                className="text-5xl text-neutral-900 dark:text-white"
                style={{ fontFamily: 'Pacifico_400Regular', lineHeight: 72 }}
              >
                FindApp
              </Text>
            </View>

            {/* Transcript input + button grouped together */}
            <View className="w-full gap-3">
              <form.Field name="transcript" validators={{ onChange: transcriptValidator }}>
                {(field) => (
                  <>
                    <View
                      className="rounded-2xl border-2 border-orange-300 bg-white dark:border-orange-700 dark:bg-neutral-900"
                      style={{
                        shadowColor: '#f97316',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.18,
                        shadowRadius: 12,
                        elevation: 6,
                      }}
                    >
                      <TextInput
                        multiline
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        onBlur={field.handleBlur}
                        placeholder={
                          "Tell us everything — who's going, what you're craving, the vibe."
                        }
                        placeholderTextColor="#9ca3af"
                        className="p-4 pr-14 text-base leading-relaxed text-neutral-900 dark:text-white"
                        style={{ minHeight: 160, textAlignVertical: 'top' }}
                        accessibilityLabel="Describe your craving"
                      />
                      {/* TODO: wire up expo-av for voice recording */}
                      <Pressable
                        className="absolute bottom-3 right-3 h-10 w-10 items-center justify-center rounded-full bg-orange-500 shadow-sm"
                        accessibilityRole="button"
                        accessibilityLabel="Record voice input"
                        accessibilityHint="Tap to record what you want to eat"
                      >
                        <Text className="text-lg">🎤</Text>
                      </Pressable>
                    </View>
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <Text className="text-sm text-red-500 dark:text-red-400">
                        {field.state.meta.errors[0]}
                      </Text>
                    )}
                  </>
                )}
              </form.Field>

              <form.Subscribe
                selector={(s) => ({
                  isSubmitting: s.isSubmitting,
                  transcript: s.values.transcript,
                })}
              >
                {({ isSubmitting, transcript }) => {
                  const disabled = !transcript.trim() || isSubmitting;
                  return (
                    <Pressable
                      onPress={form.handleSubmit}
                      disabled={disabled}
                      className={`items-center rounded-2xl bg-orange-500 py-4 shadow-md ${disabled ? 'opacity-50' : ''}`}
                      accessibilityRole="button"
                      accessibilityLabel="Feed me already — find restaurants"
                      accessibilityState={{ disabled }}
                    >
                      <Text className="text-lg font-bold tracking-wide text-white">
                        {isSubmitting ? 'Sniffing it out...' : 'Feed Me Already'}
                      </Text>
                    </Pressable>
                  );
                }}
              </form.Subscribe>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
