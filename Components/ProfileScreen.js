// Components/ProfileScreen.js
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { AppCtx } from '../App';

const BG = require('../assets/bg.webp');
const PHOTO_HOLDER = require('../assets/photo_holder.webp');
const BTN = require('../assets/button.webp');

const SCARAB = require('../assets/scarab.webp');
const PYRAMID = require('../assets/pyramid.webp');
const FLOWER = require('../assets/flower.webp'); // Tulip

const STORAGE_PROFILE = '@qcw_profile';
const STORAGE_PROGRESS = '@qcw_progress_v1';
const LEGACY_PROGRESS = 'qcw_progress_v1';

const COLORS = {
  bg: '#000000',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.70)',

  // красный стиль
  accent: '#FF1F1F',
  accentSoft: 'rgba(255, 31, 31, 0.35)',
  accentSoft2: 'rgba(255, 31, 31, 0.18)',

  card: 'rgba(0,0,0,0.58)',
  card2: 'rgba(0,0,0,0.42)',

  btnText: '#0E0F0B',
};

const DAY_MS = 24 * 60 * 60 * 1000;

const safeParse = (s, fallback) => {
  try {
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
};

const pad2 = (n) => String(n).padStart(2, '0');
const formatCountdown = (msLeft) => {
  const left = Math.max(0, msLeft);
  const h = Math.floor(left / (1000 * 60 * 60));
  const m = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((left % (1000 * 60)) / 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
};

export default function ProfileScreen() {
  const ctx = useContext(AppCtx);

  const [loaded, setLoaded] = useState(false);

  // profile
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  // progress / daily bonus
  const [progress, setProgress] = useState({
    artifacts: { scarab: 0, pyramid: 0, flower: 0 },
    dailyBonusNextAt: 0,
  });

  const [now, setNow] = useState(Date.now());

  // modal / wheel
  const [bonusOpen, setBonusOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [resultText, setResultText] = useState('');

  const spinVal = useRef(new Animated.Value(0)).current;
  const spinDegRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // load profile + progress
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_PROFILE);
        if (raw) {
          const p = JSON.parse(raw);
          setName(p.name || '');
          setAbout(p.about || '');
          setPhotoUri(p.photoUri || null);
        }
      } catch {}

      try {
        const rawProg =
          (await AsyncStorage.getItem(STORAGE_PROGRESS)) ||
          (await AsyncStorage.getItem(LEGACY_PROGRESS));
        const p = safeParse(rawProg, null);

        if (p) {
          const artifacts = p.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
          const dailyBonusNextAt = Number(p.dailyBonusNextAt || 0);

          setProgress((prev) => ({
            ...prev,
            artifacts: {
              scarab: Number(artifacts.scarab || 0),
              pyramid: Number(artifacts.pyramid || 0),
              flower: Number(artifacts.flower || 0),
            },
            dailyBonusNextAt: Number.isFinite(dailyBonusNextAt) ? dailyBonusNextAt : 0,
          }));
        }
      } catch {}

      setLoaded(true);
    })();
  }, []);

  const saveProgress = async (next) => {
    setProgress(next);
    try {
      await AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify(next));
    } catch {}
  };

  const canSave = useMemo(() => name.trim().length > 0 && !saving, [name, saving]);

  const canSpin = useMemo(() => {
    const nextAt = Number(progress.dailyBonusNextAt || 0);
    return !nextAt || now >= nextAt;
  }, [progress.dailyBonusNextAt, now]);

  const bonusCountdown = useMemo(() => {
    const nextAt = Number(progress.dailyBonusNextAt || 0);
    if (!nextAt) return '00:00:00';
    if (now >= nextAt) return '00:00:00';
    return formatCountdown(nextAt - now);
  }, [progress.dailyBonusNextAt, now]);

  const pickPhoto = async () => {
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

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Profile', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);
      await AsyncStorage.setItem(
        STORAGE_PROFILE,
        JSON.stringify({
          name: name.trim(),
          about: about.trim(),
          photoUri: photoUri || null,
        })
      );
      Alert.alert('Success', 'Profile saved.');
    } catch {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete all data?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_PROFILE);
          setName('');
          setAbout('');
          setPhotoUri(null);
          Alert.alert('Success', 'Profile deleted.');
        },
      },
    ]);
  };

  // button.webp aspect ratio
  const btnAsset = Image.resolveAssetSource(BTN);
  const btnAR = btnAsset?.width && btnAsset?.height ? btnAsset.width / btnAsset.height : 3.2;
  const btnW = Math.min(360, Math.round(0.82 * 360));
  const btnH = btnW / btnAR;

  // wheel setup: 3 sectors
  const SLICE = 120;
  // стартовые углы (0° = вправо). Так сектор "Scarab" будет сверху.
  const sliceStarts = [-150, -30, 90]; // 3 сектора по 120°
  const centers = sliceStarts.map((s) => s + SLICE / 2); // [-90, 30, 150]
  const pointerAngle = -90; // указатель сверху

  const PRIZES = useMemo(
    () => [
      { key: 'scarab', title: 'Scarab' },
      { key: 'pyramid', title: 'Pyramid' },
      { key: 'flower', title: 'Tulip' },
    ],
    []
  );

  const openBonus = () => {
    setResultText('');
    setBonusOpen(true);
  };

  const closeBonus = () => {
    if (spinning) return;
    setBonusOpen(false);
  };

  const spinWheel = async () => {
    if (spinning) return;
    if (!canSpin) return;

    setSpinning(true);
    setResultText('');

    const prizeIndex = Math.floor(Math.random() * 3);
    const jitter = Math.floor(Math.random() * 31) - 15; // небольшая вариативность
    const c = centers[prizeIndex] + jitter;

    // сколько повернуть (по часовой), чтобы центр сектора стал под указателем
    const delta = pointerAngle - c;
    const target = ((delta % 360) + 360) % 360;

    const fullTurns = 4 + Math.floor(Math.random() * 3); // 4..6
    const start = spinDegRef.current;
    const end = start + fullTurns * 360 + target;

    spinVal.setValue(start);

    Animated.timing(spinVal, {
      toValue: end,
      duration: 2400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      spinDegRef.current = end;

      const won = PRIZES[prizeIndex];

      const nextAt = Date.now() + DAY_MS;
      const prevArtifacts = progress.artifacts || { scarab: 0, pyramid: 0, flower: 0 };

      const nextProgress = {
        ...progress,
        artifacts: {
          ...prevArtifacts,
          [won.key]: Number(prevArtifacts[won.key] || 0) + 1,
        },
        dailyBonusNextAt: nextAt,
      };

      await saveProgress(nextProgress);

      // если есть контекст — обновим и там
      if (ctx?.addArtifacts) {
        ctx.addArtifacts({
          scarab: won.key === 'scarab' ? 1 : 0,
          pyramid: won.key === 'pyramid' ? 1 : 0,
          flower: won.key === 'flower' ? 1 : 0,
        });
      }

      setResultText(`You won: ${won.title} +1`);
      setSpinning(false);
    });
  };

  const rotate = spinVal.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const { width } = Dimensions.get('window');
  const WHEEL_SIZE = Math.min(280, Math.round(width * 0.72));

  if (!loaded) return null;

  const a = progress.artifacts || { scarab: 0, pyramid: 0, flower: 0 };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground source={BG} style={styles.bg}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>PROFILE</Text>
            </View>

            <View style={styles.inputCard}>
              <TextInput
                placeholder="Your name"
                placeholderTextColor="rgba(255,31,31,0.45)"
                value={name}
                onChangeText={setName}
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={[styles.inputCard, styles.inputCardTall]}>
              <TextInput
                placeholder="About yourself"
                placeholderTextColor="rgba(255,31,31,0.45)"
                value={about}
                onChangeText={setAbout}
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={pickPhoto} style={styles.photoCard}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Image source={PHOTO_HOLDER} style={[styles.photoHolderImg, { tintColor: COLORS.accent }]} />
                  <Text style={styles.photoText}>Your photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Artifacts (НЕ красим иконки) */}
            <View style={styles.artifactsCard}>
              <Text style={styles.sectionTitle}>Artifacts</Text>

              <View style={styles.artRow}>
                <View style={styles.artItem}>
                  <Image source={SCARAB} style={styles.artIcon} />
                  <Text style={styles.artCount}>{a.scarab ?? 0}</Text>
                  <Text style={styles.artName}>Scarab</Text>
                </View>

                <View style={styles.artItem}>
                  <Image source={PYRAMID} style={styles.artIcon} />
                  <Text style={styles.artCount}>{a.pyramid ?? 0}</Text>
                  <Text style={styles.artName}>Pyramid</Text>
                </View>

                <View style={styles.artItem}>
                  <Image source={FLOWER} style={styles.artIcon} />
                  <Text style={styles.artCount}>{a.flower ?? 0}</Text>
                  <Text style={styles.artName}>Tulip</Text>
                </View>
              </View>
            </View>

            {/* Daily Bonus */}
            <View style={styles.bonusCard}>
              <View style={styles.bonusTop}>
                <Text style={styles.sectionTitle}>Daily Bonus</Text>
                <Text style={styles.bonusStatus}>
                  {canSpin ? 'Available now' : `Next spin in ${bonusCountdown}`}
                </Text>
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={openBonus} style={styles.bonusBtnWrap}>
                <ImageBackground
                  source={BTN}
                  resizeMode="contain"
                  style={[styles.btnBg, { width: btnW * 0.7, height: btnH * 0.7 }]}
                >
                  <Text style={styles.btnText}>Open</Text>
                </ImageBackground>
              </TouchableOpacity>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onSave}
                disabled={!canSave}
                style={[styles.btnWrap, !canSave && { opacity: 0.55 }]}
              >
                <ImageBackground
                  source={BTN}
                  resizeMode="contain"
                  style={[styles.btnBg, { width: btnW * 0.6, height: btnH * 0.6 }]}
                >
                  <Text style={styles.btnText}>{saving ? 'Saving...' : 'Save'}</Text>
                </ImageBackground>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.9} onPress={onDelete} style={[styles.btnWrap, styles.deleteBtn]}>
                <ImageBackground
                  source={BTN}
                  resizeMode="contain"
                  style={[styles.btnBg, { width: btnW * 0.6, height: btnH * 0.6 }]}
                >
                  <Text style={styles.btnText}>Delete</Text>
                </ImageBackground>
              </TouchableOpacity>
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Daily Bonus Modal */}
        <Modal visible={bonusOpen} transparent animationType="fade" onRequestClose={closeBonus}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Daily Bonus</Text>

              <View style={[styles.wheelStage, { height: WHEEL_SIZE + 28 }]}>
                {/* pointer */}
                <View style={styles.pointer} />

                {/* wheel */}
                <Animated.View
                  style={[
                    styles.wheel,
                    {
                      width: WHEEL_SIZE,
                      height: WHEEL_SIZE,
                      borderRadius: WHEEL_SIZE / 2,
                      transform: [{ rotate }],
                    },
                  ]}
                >
                  <View style={styles.wheelFace}>
                    {/* 3 sectors */}
                    <View style={StyleSheet.absoluteFillObject}>
                      {sliceStarts.map((startDeg, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.sliceWrap,
                            { transform: [{ rotate: `${startDeg}deg` }] },
                          ]}
                        >
                          <View style={styles.sliceClip}>
                            <View
                              style={[
                                styles.sliceFill,
                                {
                                  transform: [{ rotate: `${SLICE}deg` }],
                                  backgroundColor:
                                    idx === 0
                                      ? 'rgba(255,31,31,0.18)'
                                      : idx === 1
                                      ? 'rgba(255,31,31,0.10)'
                                      : 'rgba(255,31,31,0.14)',
                                },
                              ]}
                            />
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* labels */}
                    <Text style={[styles.wheelLabel, styles.labelTop]}>Scarab</Text>
                    <Text style={[styles.wheelLabel, styles.labelRight]}>Pyramid</Text>
                    <Text style={[styles.wheelLabel, styles.labelLeft]}>Tulip</Text>

                    {/* hub */}
                    <View style={styles.hubOuter}>
                      <View style={styles.hubInner} />
                    </View>
                  </View>
                </Animated.View>
              </View>

              <Text style={styles.modalHint}>
                {canSpin ? 'Spin to get 1 artifact.' : `You can spin again in ${bonusCountdown}.`}
              </Text>

              {!!resultText && <Text style={styles.resultText}>{resultText}</Text>}

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={spinWheel}
                  disabled={!canSpin || spinning}
                  style={[styles.modalBtn, (!canSpin || spinning) && { opacity: 0.55 }]}
                >
                  <Text style={styles.modalBtnText}>{spinning ? 'Spinning...' : 'Spin'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={closeBonus}
                  disabled={spinning}
                  style={[styles.modalBtn, styles.modalBtnSecondary, spinning && { opacity: 0.55 }]}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  bg: { flex: 1, width: '100%', height: '100%' },

  content: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 200,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 22 },
  headerTitle: { color: COLORS.text, fontSize: 22, letterSpacing: 1, fontWeight: '800', left: 10 },

  inputCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  inputCardTall: { minHeight: 92, paddingVertical: 12 },
  input: { color: COLORS.text, fontSize: 16 },
  textArea: { minHeight: 68 },

  photoCard: {
    height: 250,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.accentSoft,
    marginTop: 10,
  },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  photoHolderImg: { width: 56, height: 56, resizeMode: 'contain', opacity: 0.95 },
  photoText: { color: COLORS.text, fontSize: 16, opacity: 0.95 },

  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900', letterSpacing: 0.6 },

  artifactsCard: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accentSoft,
    padding: 14,
  },
  artRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  artItem: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.accentSoft2,
    backgroundColor: COLORS.card2,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ✅ без tintColor
  artIcon: { width: 30, height: 30, resizeMode: 'contain', opacity: 0.95 },
  artCount: { marginTop: 8, color: COLORS.text, fontSize: 20, fontWeight: '900' },
  artName: { marginTop: 4, color: COLORS.dim, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  bonusCard: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accentSoft,
    padding: 14,
  },
  bonusTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  bonusStatus: { color: COLORS.dim, fontSize: 12, fontWeight: '700' },
  bonusBtnWrap: { alignSelf: 'center', marginTop: 14, opacity: 0.9 },

  btnRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 22 },
  btnWrap: { opacity: 0.85 },
  deleteBtn: { opacity: 0.75 },
  btnBg: { alignItems: 'center', justifyContent: 'center' },
  btnText: { color: COLORS.btnText, fontSize: 20, fontWeight: '900', letterSpacing: 0.3 },

  // modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderWidth: 2,
    borderColor: COLORS.accentSoft,
    padding: 16,
  },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center' },

  wheelStage: { marginTop: 14, alignItems: 'center', justifyContent: 'center' },

  pointer: {
    position: 'absolute',
    top: 6,
    zIndex: 5,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.accent,
  },

  wheel: { alignItems: 'center', justifyContent: 'center' },

  wheelFace: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderWidth: 2,
    borderColor: COLORS.accentSoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ✅ 3 сектора (pure View pie slice)
  sliceWrap: { ...StyleSheet.absoluteFillObject },
  sliceClip: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    right: 0,
    overflow: 'hidden',
  },
  sliceFill: {
    position: 'absolute',
    width: '200%',
    height: '100%',
    right: 0,
    borderRadius: 9999,
  },

  wheelLabel: {
    position: 'absolute',
    color: '#FFEAEA',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  labelTop: { top: 18, alignSelf: 'center' },
  labelRight: { right: 18, top: '58%' },
  labelLeft: { left: 18, top: '58%' },

  hubOuter: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 2,
    borderColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubInner: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.accent, opacity: 0.9 },

  modalHint: { marginTop: 8, textAlign: 'center', color: COLORS.dim, fontSize: 12, fontWeight: '700' },
  resultText: { marginTop: 10, textAlign: 'center', color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.2 },

  modalBtnRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  modalBtn: {
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondary: { backgroundColor: 'rgba(255,31,31,0.18)', borderColor: COLORS.accentSoft },
  modalBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },
});
