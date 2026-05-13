import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PlaceRecommendation } from '@/src/types';
import { estimateDriveTime, formatDistance, haversineKm } from '@/src/utils/distance';
import { fetchRecommendations } from '@/src/utils/fetchRecommendations';
import type { ParsedTranscript } from '@/src/utils/parseTranscript';
import { parseTranscript } from '@/src/utils/parseTranscript';

const PRICE_LABEL: Record<ParsedTranscript['priceRange'], string> = {
  budget: 'Under ₱200',
  moderate: '₱200–600',
  upscale: '₱600–1500',
  fine_dining: '₱1500+',
};

const MODE_LABEL: Record<ParsedTranscript['mode'], string> = {
  individual: 'Solo',
  date: 'Date night',
  group: 'Group',
};

const PRICE_SYMBOL: Record<PlaceRecommendation['priceRange'], string> = {
  budget: '₱',
  moderate: '₱₱',
  upscale: '₱₱₱',
  fine_dining: '₱₱₱₱',
};

type UserLocation = { latitude: number; longitude: number };

export default function ResultsScreen() {
  const router = useRouter();
  const { transcript } = useLocalSearchParams<{ transcript: string }>();

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') return;
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then((pos) => {
        const { latitude, longitude } = pos.coords;
        const inPhilippines =
          latitude >= 4.5 && latitude <= 21.1 && longitude >= 116.7 && longitude <= 126.6;
        setUserLocation(
          inPhilippines ? { latitude, longitude } : { latitude: 14.5547, longitude: 121.0244 },
        );
      });
    });
  }, []);

  const {
    data: parsed,
    isLoading: parsedLoading,
    error: parsedError,
    refetch: refetchParsed,
  } = useQuery({
    queryKey: ['transcript', transcript],
    queryFn: () => parseTranscript(transcript ?? ''),
    enabled: !!transcript,
    staleTime: Infinity,
    retry: 1,
  });

  const {
    data: recommendations,
    isLoading: recsLoading,
    error: recsError,
    refetch: refetchRecs,
  } = useQuery({
    queryKey: ['recommendations', transcript],
    queryFn: () => {
      if (!parsed) throw new Error('Preferences not ready');
      return fetchRecommendations(parsed);
    },
    enabled: !!parsed,
    staleTime: Infinity,
    retry: 1,
  });

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="flex-row items-center gap-1 rounded-xl px-2 py-1.5 active:opacity-60"
        >
          <Text className="text-base text-orange-500">←</Text>
          <Text className="text-base font-medium text-orange-500">Back</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-5 pb-10 pt-2">
          {parsedLoading && (
            <View className="flex-1 items-center justify-center gap-4">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="text-base text-neutral-500 dark:text-neutral-400">
                Figuring out your vibe...
              </Text>
            </View>
          )}

          {parsedError !== null && !parsedLoading && (
            <View className="flex-1 items-center justify-center gap-6">
              <Text className="text-center text-base text-red-500 dark:text-red-400">
                {parsedError instanceof Error ? parsedError.message : 'Something went wrong'}
              </Text>
              <Pressable
                onPress={() => refetchParsed()}
                accessibilityRole="button"
                accessibilityLabel="Try again"
                className="rounded-2xl bg-orange-500 px-6 py-3"
              >
                <Text className="font-semibold text-white">Try again</Text>
              </Pressable>
            </View>
          )}

          {parsed !== undefined && !parsedLoading && (
            <View className="gap-5">
              <View>
                <Text className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Your preferences
                </Text>
                {transcript ? (
                  <Text
                    className="mt-1 text-sm italic text-neutral-400 dark:text-neutral-500"
                    numberOfLines={2}
                  >
                    "{transcript}"
                  </Text>
                ) : null}
              </View>

              <View className="rounded-2xl bg-orange-500/10 p-4 dark:bg-orange-500/15">
                <Text className="text-sm leading-relaxed text-orange-700 dark:text-orange-300">
                  {parsed.summary}
                </Text>
              </View>

              <View className="flex-row gap-3">
                <PreferenceChip label="Mode" value={MODE_LABEL[parsed.mode]} />
                <PreferenceChip
                  label="Party"
                  value={parsed.groupSize === 1 ? '1 person' : `${parsed.groupSize} people`}
                />
                <PreferenceChip label="Budget" value={PRICE_LABEL[parsed.priceRange]} />
              </View>

              {parsed.cuisines.length > 0 && (
                <TagSection title="Cuisines" tags={parsed.cuisines} color="sky" />
              )}
              {parsed.vibes.length > 0 && (
                <TagSection title="Vibe" tags={parsed.vibes} color="violet" />
              )}
              {parsed.dietaryNeeds.length > 0 && (
                <TagSection title="Dietary needs" tags={parsed.dietaryNeeds} color="emerald" />
              )}

              <View className="gap-3">
                <Text className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                  Places for you
                </Text>

                {recsLoading && (
                  <View className="flex-row items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <ActivityIndicator size="small" color="#f97316" />
                    <Text className="text-sm text-neutral-400 dark:text-neutral-500">
                      Finding spots for you...
                    </Text>
                  </View>
                )}

                {recsError !== null && !recsLoading && (
                  <View className="gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                    <Text className="text-sm text-red-500 dark:text-red-400">
                      {recsError instanceof Error
                        ? recsError.message
                        : 'Could not load recommendations'}
                    </Text>
                    <Pressable
                      onPress={() => refetchRecs()}
                      accessibilityRole="button"
                      accessibilityLabel="Retry recommendations"
                      className="self-start rounded-xl bg-red-500 px-4 py-2"
                    >
                      <Text className="text-sm font-semibold text-white">Retry</Text>
                    </Pressable>
                  </View>
                )}

                {recommendations?.map((rec) => (
                  <RecommendationCard key={rec.name} rec={rec} userLocation={userLocation} />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceChip({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <Text className="text-xs text-neutral-400 dark:text-neutral-500">{label}</Text>
      <Text className="mt-0.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
        {value}
      </Text>
    </View>
  );
}

function RecommendationCard({
  rec,
  userLocation,
}: {
  rec: PlaceRecommendation;
  userLocation: { latitude: number; longitude: number } | null;
}) {
  const distanceKm = userLocation
    ? haversineKm(userLocation.latitude, userLocation.longitude, rec.latitude, rec.longitude)
    : null;

  return (
    <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Name + area */}
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-bold text-neutral-900 dark:text-white">{rec.name}</Text>
          <Text className="text-xs text-neutral-400 dark:text-neutral-500">{rec.area}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
            <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {rec.cuisineType}
            </Text>
          </View>
          <Text className="text-sm font-semibold text-orange-500">
            {PRICE_SYMBOL[rec.priceRange]}
          </Text>
        </View>
      </View>

      {/* Rating + distance + ETA row */}
      <View className="mt-2.5 flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-amber-400">★</Text>
          <Text className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {rec.rating.toFixed(1)}
          </Text>
        </View>
        {distanceKm !== null && (
          <>
            <Text className="text-xs text-neutral-300 dark:text-neutral-600">·</Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatDistance(distanceKm)}
            </Text>
            <Text className="text-xs text-neutral-300 dark:text-neutral-600">·</Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              🚗 {estimateDriveTime(distanceKm)}
            </Text>
          </>
        )}
      </View>

      <Text className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
        {rec.description}
      </Text>
      <Text className="mt-2 text-xs italic text-neutral-400 dark:text-neutral-500">
        {rec.whyItMatches}
      </Text>
    </View>
  );
}

type TagColor = 'sky' | 'violet' | 'emerald';

function TagSection({ title, tags, color }: { title: string; tags: string[]; color: TagColor }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {tags.map((tag) => (
          <TagPill key={tag} tag={tag} color={color} />
        ))}
      </View>
    </View>
  );
}

function TagPill({ tag, color }: { tag: string; color: TagColor }) {
  if (color === 'sky') {
    return (
      <View className="rounded-full bg-sky-100 px-3 py-1 dark:bg-sky-900/40">
        <Text className="text-sm font-medium text-sky-700 dark:text-sky-300">{tag}</Text>
      </View>
    );
  }
  if (color === 'violet') {
    return (
      <View className="rounded-full bg-violet-100 px-3 py-1 dark:bg-violet-900/40">
        <Text className="text-sm font-medium text-violet-700 dark:text-violet-300">{tag}</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-900/40">
      <Text className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{tag}</Text>
    </View>
  );
}
