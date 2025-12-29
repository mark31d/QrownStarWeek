// Components/HomeScreen.js
import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppCtx } from '../App';

const BG = require('../assets/bg.webp');
const AVATAR_FALLBACK = require('../assets/photo_holder.webp');
const QUEEN = require('../assets/onb_queen.webp');

const SCARAB = require('../assets/scarab.webp');
const PYRAMID = require('../assets/pyramid.webp');
const FLOWER = require('../assets/flower.webp');

const INFO_ICON = require('../assets/info.webp'); // если нет — замени/удали

// ✅ ключи как в RegistrationScreen
const STORAGE_PROFILE = '@qcw_profile';
const STORAGE_PROGRESS = '@qcw_progress_v1';
const LEGACY_PROGRESS = 'qcw_progress_v1'; // на всякий случай

const COLORS = {
  bg: '#000000',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.72)',

  // ✅ красный
  lime: '#FF1F1F',
  limeSoft: 'rgba(255, 31, 31, 0.35)',
  limeSoft2: 'rgba(255, 31, 31, 0.18)',

  // карточки/контейнеры
  card: 'rgba(0,0,0,0.62)',
  card2: 'rgba(0,0,0,0.46)',
};

export default function HomeScreen({ navigation }) {
  const ctx = useContext(AppCtx);
  // ✅ артефакты НЕ статичные — берем из контекста
  const artifacts = ctx?.artifacts || { scarab: 0, pyramid: 0, flower: 0 };

  const [user, setUser] = useState({
    name: '',
    about: '',
    photoUri: null,
  });

  const [progress, setProgress] = useState({
    dayIndex: 1,
    done: [false, false, false, false],
    cooldownUntil: 0,
  });

  const [now, setNow] = useState(Date.now());

  // тик для countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // функция загрузки прогресса
  const loadProgress = useCallback(async () => {
    try {
      const raw = (await AsyncStorage.getItem(STORAGE_PROGRESS)) || (await AsyncStorage.getItem(LEGACY_PROGRESS));
      if (raw) {
        const parsed = JSON.parse(raw);
        setProgress((prev) => ({ ...prev, ...parsed }));
        
        // Синхронизируем артефакты из прогресса с контекстом
        if (parsed?.artifacts && ctx?.addArtifacts) {
          const progressArtifacts = parsed.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
          const ctxArtifacts = ctx.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
          
          // Добавляем разницу, если в прогрессе больше артефактов
          const diff = {
            scarab: Math.max(0, progressArtifacts.scarab - ctxArtifacts.scarab),
            pyramid: Math.max(0, progressArtifacts.pyramid - ctxArtifacts.pyramid),
            flower: Math.max(0, progressArtifacts.flower - ctxArtifacts.flower),
          };
          
          if (diff.scarab > 0 || diff.pyramid > 0 || diff.flower > 0) {
            ctx.addArtifacts(diff);
          }
        }
      }
    } catch {}
  }, [ctx]);

  // загрузка профиля (только один раз)
  useEffect(() => {
    (async () => {
      try {
        const p = await AsyncStorage.getItem(STORAGE_PROFILE);
        if (p) {
          const parsed = JSON.parse(p);
          setUser({
            name: parsed?.name ?? '',
            about: parsed?.about ?? '',
            photoUri: parsed?.photoUri ?? null,
          });
        }
      } catch {}
    })();
  }, []);

  // загрузка прогресса при монтировании
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // перечитываем прогресс когда экран получает фокус (возврат с TaskScreen)
  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  // Синхронизация артефактов из контекста в прогресс (когда контекст обновляется после траты)
  useEffect(() => {
    if (ctx?.artifacts) {
      const ctxArtifacts = ctx.artifacts;
      const progressArtifacts = progress.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
      
      // Обновляем прогресс если артефакты в контексте изменились (например, после траты в Exchanger)
      if (
        ctxArtifacts.scarab !== progressArtifacts.scarab ||
        ctxArtifacts.pyramid !== progressArtifacts.pyramid ||
        ctxArtifacts.flower !== progressArtifacts.flower
      ) {
        setProgress((p) => ({
          ...p,
          artifacts: ctxArtifacts,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.artifacts]);

  // сохраняем прогресс
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress)).catch(() => {});
  }, [progress]);

  const isCooldown = progress.cooldownUntil && now < progress.cooldownUntil;

  const firstUndoneIndex = useMemo(() => {
    const idx = progress.done.findIndex((x) => !x);
    return idx === -1 ? 0 : idx;
  }, [progress.done]);

  const allDone = useMemo(() => progress.done.every(Boolean), [progress.done]);

  // если все выполнено и cooldown не выставлен — ставим 24ч
  useEffect(() => {
    if (allDone && !progress.cooldownUntil) {
      setProgress((p) => ({ ...p, cooldownUntil: Date.now() + 24 * 60 * 60 * 1000 }));
    }
  }, [allDone, progress.cooldownUntil]);

  // если cooldown прошел — новый день
  useEffect(() => {
    if (progress.cooldownUntil && now >= progress.cooldownUntil && progress.cooldownUntil > 0) {
      const newProgress = {
        ...progress,
        dayIndex: progress.dayIndex + 1,
        done: [false, false, false, false],
        cooldownUntil: 0,
        // Сохраняем артефакты при переходе на новый день
        artifacts: progress.artifacts || { scarab: 0, pyramid: 0, flower: 0 },
      };
      // Сохраняем сразу в AsyncStorage синхронно
      AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify(newProgress)).catch(() => {});
      setProgress(newProgress);
    }
  }, [now, progress]);

  const countdown = useMemo(() => {
    if (!isCooldown) return '00:00:00';
    const left = Math.max(0, progress.cooldownUntil - now);

    const h = Math.floor(left / (1000 * 60 * 60));
    const m = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((left % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, [isCooldown, progress.cooldownUntil, now]);

  const onPressTask = (index) => {
    if (isCooldown) return;
    navigation.getParent()?.navigate('Task', { taskIndex: index, dayIndex: progress.dayIndex });
  };

  const onPrimaryPress = () => {
    if (isCooldown) return;
    onPressTask(firstUndoneIndex);
  };

  const primaryLabel = useMemo(() => {
    if (isCooldown) return 'Cooldown';
    if (progress.done.every((x) => !x)) return 'Start day';
    if (allDone) return 'Done';
    return 'Next task';
  }, [isCooldown, progress.done, allDone]);

  const displayName = user.name?.trim() ? user.name.trim() : 'User';
  const displayAbout = user.about?.trim() ? user.about.trim() : 'Welcome back';

  const noPhoto = !user.photoUri;

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
        <SafeAreaView style={styles.safe}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarWrap}>
                <Image
                  source={user.photoUri ? { uri: user.photoUri } : AVATAR_FALLBACK}
                  style={[styles.avatar, noPhoto && styles.avatarTint]}
                />
              </View>

              <View style={styles.headerTextWrap}>
                <Text style={styles.hello}>Hello, {displayName}</Text>
                <Text style={styles.sub}>{displayAbout}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.infoBtn}
              onPress={() => navigation.navigate('Info')}
            >
              <Image source={INFO_ICON} style={styles.infoIcon} />
            </TouchableOpacity>
          </View>

          {/* Artifacts (dynamic from context) */}
          <View style={styles.artifactsCard}>
            <Text style={styles.artifactsLabel}>Artifacts:</Text>

            <View style={styles.artItem}>
              <Image source={SCARAB} style={styles.artIcon} />
              <Text style={styles.artCount}>{artifacts?.scarab ?? 0}</Text>
            </View>

            <View style={styles.artItem}>
              <Image source={PYRAMID} style={styles.artIcon} />
              <Text style={styles.artCount}>{artifacts?.pyramid ?? 0}</Text>
            </View>

            <View style={styles.artItem}>
              <Image source={FLOWER} style={styles.artIcon} />
              <Text style={styles.artCount}>{artifacts?.flower ?? 0}</Text>
            </View>
          </View>

          {/* Main card */}
          <View style={styles.mainCard}>
            <Text style={styles.dayTitle}>Day {progress.dayIndex}</Text>

            {/* 4 tasks */}
            <View style={styles.tasksRow}>
              {[0, 1, 2, 3].map((i) => {
                const done = progress.done[i];
                const locked = isCooldown;

                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.9}
                    onPress={() => onPressTask(i)}
                    disabled={locked}
                    style={[
                      styles.taskPill,
                      done ? styles.taskPillDone : styles.taskPillIdle,
                      locked && styles.taskPillLocked,
                    ]}
                  >
                    <View style={styles.taskInnerCircle}>
                      {done ? (
                        <Text style={styles.taskCheckmark}>✓</Text>
                      ) : (
                        <Text style={styles.taskNum}>{i + 1}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* queen card */}
            <View style={styles.queenCard}>
              <Image source={QUEEN} style={styles.queenImg} resizeMode="contain" />
              <View style={styles.queenRight}>
                {!isCooldown ? (
                  <>
                    <Text style={styles.queenText}>
                      {allDone
                        ? "That's all for today.\nSee you tomorrow!"
                        : 'Start the task and\nbecome the most\nbeautiful'}
                    </Text>

                    {allDone ? (
                      <Text style={styles.countdown}>{countdown}</Text>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.limeBtn}
                        onPress={onPrimaryPress}
                      >
                        <Text style={styles.limeBtnText}>{primaryLabel}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.queenText}>{"That's all for today.\nSee you tomorrow!"}</Text>
                    <Text style={styles.countdown}>{countdown}</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.bottomPad} />
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: Platform.OS === 'android' ? 18 : 0 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  // ✅ как в регистрации: обводка + фон
  avatarWrap: {
    width: 66,
    height: 66,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // ✅ если фото не выбрано — placeholder красный
  avatarTint: {
    resizeMode: 'contain',
    tintColor: COLORS.lime,
    opacity: 0.95,
  },

  headerTextWrap: { justifyContent: 'center' },
  hello: { color: COLORS.text, fontSize: 28, fontWeight: '700' },
  sub: { color: COLORS.dim, marginTop: 4, fontSize: 16 },

  infoBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { width: 20, height: 20, tintColor: COLORS.lime },

  artifactsCard: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  artifactsLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 14, marginRight: 10 },

  artItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  artIcon: { width: 22, height: 22, resizeMode: 'contain' },
  artCount: { color: COLORS.text, fontSize: 20, fontWeight: '800', minWidth: 18, textAlign: 'center' },

  mainCard: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    borderRadius: 18,
    padding: 16,
  },
  dayTitle: { color: COLORS.text, fontSize: 34, fontWeight: '900', marginBottom: 12 },

  tasksRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  taskPill: {
    width: 74,
    height: 74,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card2,
  },
  taskPillIdle: {
    backgroundColor: 'rgba(255,31,31,0.10)',
  },
  taskPillDone: {
    backgroundColor: 'rgba(255,31,31,0.35)',
    borderColor: 'rgba(255,31,31,0.55)',
  },
  taskPillLocked: { opacity: 0.70 },

  taskInnerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: COLORS.limeSoft2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskNum: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  taskCheckmark: { 
    color: COLORS.lime, 
    fontSize: 28, 
    fontWeight: '900',
    lineHeight: 32,
  },

  queenCard: {
    backgroundColor: COLORS.card2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  queenImg: { width: 160, height: 160 },
  queenRight: { flex: 1, justifyContent: 'center' },
  queenText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },

  limeBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.lime,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  limeBtnText: { color: '#0E0F0B', fontSize: 18, fontWeight: '900' },

  countdown: {
    marginTop: 12,
    color: COLORS.lime,
    fontSize: 30,
    fontWeight: '900',
    alignSelf: 'flex-end',
  },

  bottomPad: { height: 90 },
});
