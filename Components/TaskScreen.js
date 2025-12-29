// Components/TaskScreen.js
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { AppCtx } from '../App';

// assets
const BG = require('../assets/bg.webp');
const QUEEN = require('../assets/onb_queen.webp');
const PHOTO_HOLDER = require('../assets/photo_holder.webp');

// storage keys (синхронизировано с HomeScreen)
const PROFILE_KEY_1 = '@qcw_profile';
const PROFILE_KEY_2 = 'qcw_user';
const PROGRESS_KEY = '@qcw_progress_v1'; // исправлено: синхронизировано с HomeScreen
const LEGACY_PROGRESS = 'qcw_progress_v1';
const HISTORY_KEY = 'qcw_history_v1';

const SALAD = '#FF2E2E';
const SALAD_LIGHT = '#FF6262';
const SALAD_DARK = '#3A0C0C';

const TASKS_7x4 = [
  [
    'Take a photo of something that brings you peace today.',
    'Show a detail that caught your eye.',
    'Find an interesting shadow and take a photo of it.',
    'Take a photo of a texture that you like.',
  ],
  [
    'Show an object that gives you warmth.',
    'Find a color that lifts your mood.',
    'Take a photo of a moment when you stopped.',
    'Show something with clear shapes.',
  ],
  [
    'Take a photo of a ray of light.',
    'Find an object that symbolizes balance.',
    'Take a photo of something soft.',
    'Show something that looks harmonious.',
  ],
  [
    'Find a small detail that is easy to miss.',
    'Take a photo of a moment where you felt good.',
    'Show a shape that calms you.',
    'Take a photo of something that looks beautiful today.',
  ],
  [
    'Find an object that is held firmly.',
    'Take a photo of something that resembles movement.',
    'Show a peaceful space.',
    'Take a photo of something that made your day more enjoyable.',
  ],
  [
    'Find light falling from above.',
    'Take a photo of a detail that seems interesting.',
    'Show a moment of lightness.',
    'Take a photo of something smooth and structured.',
  ],
  [
    'Find an object that symbolizes tenderness.',
    'Show a color that you want to hold in your eyes.',
    'Find a shape that resembles a flower.',
    'Take a photo of something that you want to remember from this day.',
  ],
];

const defaultProgress = {
  dayIndex: 1,
  done: [false, false, false, false],
  cooldownUntil: 0,
  artifacts: { scarab: 0, pyramid: 0, flower: 0 },
  rewardedDayIndex: 0,
};

const safeParse = (s, fallback) => {
  try {
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
};

const withAlpha = (hex, a = 1) => {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${a})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

export default function TaskScreen({ route, navigation }) {
  const ctx = useContext(AppCtx);
  const taskIndex = Math.max(0, Math.min(3, route?.params?.taskIndex ?? 0));
  const routeDayIndex = route?.params?.dayIndex;

  const [progress, setProgress] = useState(defaultProgress);
  const [history, setHistory] = useState([]);
  const [about, setAbout] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const dayIndex = useMemo(() => {
    const d = Number(routeDayIndex);
    return Number.isFinite(d) && d > 0 ? d : progress.dayIndex || 1;
  }, [routeDayIndex, progress.dayIndex]);

  const taskText = useMemo(() => {
    const daySlot = (dayIndex - 1) % 7;
    return TASKS_7x4[daySlot][taskIndex];
  }, [taskIndex, dayIndex]);

  const isDone = useMemo(() => !!progress?.done?.[taskIndex], [progress, taskIndex]);

  // load progress/history (profile keys kept for compat)
  useEffect(() => {
    (async () => {
      // загружаем из обоих ключей для совместимости
      const prog = safeParse(
        await AsyncStorage.getItem(PROGRESS_KEY) || await AsyncStorage.getItem(LEGACY_PROGRESS),
        null
      );
      if (prog) setProgress((prev) => ({ ...prev, ...prog }));

      const hist = safeParse(await AsyncStorage.getItem(HISTORY_KEY), []);
      setHistory(Array.isArray(hist) ? hist : []);

      await AsyncStorage.getItem(PROFILE_KEY_1);
      await AsyncStorage.getItem(PROFILE_KEY_2);
    })();
  }, []);

  // hydrate fields if already saved for this day/task
  useEffect(() => {
    const entry = [...history]
      .reverse()
      .find((x) => x?.dayIndex === dayIndex && x?.taskIndex === taskIndex);

    if (entry) {
      setAbout(entry.about || '');
      setPhotoUri(entry.photoUri || null);
    } else {
      setAbout('');
      setPhotoUri(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, dayIndex, taskIndex]);

  // Синхронизация артефактов из контекста при загрузке (если контекст имеет больше артефактов)
  useEffect(() => {
    if (ctx?.artifacts && progress) {
      const ctxArtifacts = ctx.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
      const storedArtifacts = progress.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
      
      // Обновляем прогресс если в контексте больше артефактов (например, после траты в Exchanger)
      if (
        ctxArtifacts.scarab !== storedArtifacts.scarab ||
        ctxArtifacts.pyramid !== storedArtifacts.pyramid ||
        ctxArtifacts.flower !== storedArtifacts.flower
      ) {
        setProgress((p) => ({
          ...p,
          artifacts: ctxArtifacts,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.artifacts]);

  // Сохраняем прогресс автоматически (но не историю - она сохраняется только в onComplete)
  useEffect(() => {
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress]);

  const pickPhoto = async () => {
    if (isDone) return;
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      });
      if (res?.didCancel) return;
      const uri = res?.assets?.[0]?.uri;
      if (uri) setPhotoUri(uri);
    } catch {
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  const onComplete = async () => {
    if (isDone) return;

    if (!photoUri) {
      Alert.alert('Task', 'Please add a photo to complete the task.');
      return;
    }
    if (!about.trim()) {
      Alert.alert('Task', 'Please add a short description.');
      return;
    }

    try {
      setSaving(true);

      // ✅ Загружаем актуальную историю перед сохранением
      const currentHistoryRaw = await AsyncStorage.getItem(HISTORY_KEY);
      const currentHistory = safeParse(currentHistoryRaw, []);
      const historyArray = Array.isArray(currentHistory) ? currentHistory : [];

      // вычисляем новый прогресс
      const done = Array.isArray(progress.done) ? [...progress.done] : [false, false, false, false];
      done[taskIndex] = true;
      const allDoneNow = done.every(Boolean);
      
      // если все 4 задачи выполнены - запускаем таймер на 24 часа
      let cooldownUntil = progress.cooldownUntil || 0;
      if (allDoneNow && !cooldownUntil) {
        cooldownUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
      }

      const progressToSave = { ...progress, dayIndex, done, cooldownUntil };

      // ✅ начисляем артефакты за выполненную задачу (только если задача еще не была выполнена)
      if (ctx?.addArtifacts && !isDone) {
        // За каждую выполненную задачу: +1 scarab, +1 pyramid, +1 flower
        const currentArtifacts = ctx.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
        
        // Добавляем артефакты в контекст
        ctx.addArtifacts({
          scarab: 1,
          pyramid: 1,
          flower: 1,
        });
        
        // Обновляем артефакты в прогрессе (вычисляем новое значение)
        progressToSave.artifacts = {
          scarab: currentArtifacts.scarab + 1,
          pyramid: currentArtifacts.pyramid + 1,
          flower: currentArtifacts.flower + 1,
        };
      } else if (progress.artifacts) {
        // Сохраняем текущие артефакты из прогресса
        progressToSave.artifacts = progress.artifacts;
      } else {
        // Инициализируем артефакты если их нет
        progressToSave.artifacts = ctx?.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
      }

      // ✅ Создаем новую запись с уникальным ID
      const entry = {
        id: `${dayIndex}_${taskIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dayIndex,
        taskIndex,
        title: `Task ${taskIndex + 1}`,
        prompt: taskText,
        about: about.trim(),
        photoUri,
        createdAt: Date.now(),
      };

      // ✅ Добавляем новую запись в начало массива (не заменяем старые)
      const newHistory = [entry, ...historyArray];

      // ✅ сохраняем СИНХРОННО перед goBack()
      await Promise.all([
        AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progressToSave)),
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory)),
      ]);

      // обновляем состояние после успешного сохранения
      setProgress(progressToSave);
      setHistory(newHistory);

      Alert.alert('Completed', 'Saved to your History.');
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.topRow}>
                <View style={styles.badgeWrap}>
                  <LinearGradient
                    colors={[withAlpha(SALAD_LIGHT, 0.98), withAlpha(SALAD_DARK, 0.98)]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.numText}>{taskIndex + 1}</Text>
                </View>

                <Text style={styles.title}>Task {taskIndex + 1}</Text>
              </View>

              {/* Prompt card (градиент НЕ режется: градиент абсолютный внутри wrap) */}
              <View style={styles.promptWrap}>
                <LinearGradient
                  colors={[withAlpha(SALAD_LIGHT, 0.90), withAlpha('#000000', 0.90)]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.promptInner}>
                  <Image source={QUEEN} style={styles.queenMini} resizeMode="contain" />
                  <Text numberOfLines={3} style={styles.promptText}>
                    {taskText}
                  </Text>
                </View>
              </View>

              {/* About */}
              <View style={styles.inputCard}>
                <TextInput
                  value={about}
                  onChangeText={setAbout}
                  editable={!isDone}
                  placeholder="About task"
                  placeholderTextColor={withAlpha('#FFFFFF', 0.35)}
                  style={styles.input}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Photo */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={pickPhoto}
                disabled={isDone}
                style={styles.photoCard}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Image
                      source={PHOTO_HOLDER}
                      style={[styles.photoHolder, { tintColor: SALAD, opacity: 0.98 }]}
                      resizeMode="contain"
                    />
                    <Text style={styles.photoLabel}>Your photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Button (убрали button.webp полностью — чтобы НЕ было “второй кнопки” под Complete) */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onComplete}
                disabled={isDone || saving}
                style={[styles.btnWrap, (isDone || saving) && { opacity: 0.65 }]}
              >
                <LinearGradient
                  colors={[withAlpha(SALAD, 0.95), withAlpha(SALAD_DARK, 0.95)]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.btnBase}
                >
                  <Text style={styles.btnText}>
                    {isDone ? 'Completed' : saving ? 'Saving...' : 'Complete'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.hint}>
                {isDone
                  ? 'This task is already saved in your History.'
                  : 'Add photo + description to complete.'}
              </Text>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    alignItems: 'center',
  },

  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderWidth: 1.2,
    borderColor: withAlpha(SALAD, 0.28),
    padding: 16,
    paddingTop: 18,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 14,
  },

  badgeWrap: {
    width: 62,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: withAlpha(SALAD, 0.35),
    overflow: 'hidden',
  },
  numText: {
    color: '#1A0303',
    fontSize: 22,
    fontWeight: '900',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Prompt: wrap + absolute gradient to avoid clipping artifacts/overlap
  promptWrap: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: withAlpha(SALAD, 0.28),
    overflow: 'hidden',
    marginBottom: 14,
  },
  promptInner: {
    minHeight: 120,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  queenMini: { width: 74, height: 74 },
  promptText: {
    flex: 1,
    color: '#FFE1E1',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },

  inputCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1.2,
    borderColor: withAlpha(SALAD, 0.22),
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    minHeight: 76,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    minHeight: 52,
  },

  photoCard: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1.2,
    borderColor: withAlpha(SALAD, 0.22),
  },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },

  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  photoHolder: { width: 66, height: 66 },
  photoLabel: { color: '#FFFFFF', fontSize: 16, opacity: 0.9 },

  btnWrap: {
    alignSelf: 'center',
    marginTop: 14,
  },
  btnBase: {
    width: 260,
    height: 74,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: withAlpha(SALAD, 0.55),
  },
  btnText: {
    color: '#1A0303',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  hint: {
    marginTop: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
});
