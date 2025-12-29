// Components/ExchangerScreen.js
import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  Modal,
  Image,
  ScrollView,
  Alert,
  ImageBackground as RNImageBackground,
  StatusBar,
  Platform,
  Share,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppCtx } from '../App';

// assets
const BACK = require('../assets/bg.webp');
const PYRAMID = require('../assets/pyramid.webp');
const SCARAB = require('../assets/scarab.webp');
const FLOWER = require('../assets/flower.webp');
const QUEEN = require('../assets/onb_queen.webp');
const CROWN = require('../assets/crown.webp');
const BUTTON = require('../assets/button.webp'); // ✅ используем button.webp как есть

const SALAD = '#FF2E2E';
const SALAD_SOFT = 'rgba(255,46,46,0.28)';
const SALAD_SOFT2 = 'rgba(255,46,46,0.16)';
const DARK = '#1A0303';
const CARD = 'rgba(0,0,0,0.62)';
const CARD2 = 'rgba(0,0,0,0.46)';

const POOLS = {
  pyramid: [
    'My strength is quiet but unwavering.',
    'I hold my ground even as the world around me changes.',
    'Stability begins within me.',
    'I will stand firm as the light of my days.',
    'My steps are sure, even when small.',
    'Where I am focused, there is order.',
    'My foundation is strong, and I grow on it.',
    'I choose strength that does not make noise.',
    'My inner foundation holds me.',
    'I am composed, collected, and strong.',
  ],
  scarab: [
    'Silence speaks louder than words.',
    "I see what others don’t notice.",
    'My thoughts are clear and calm.',
    'Wisdom is in observation.',
    'I listen to the world carefully.',
    'Small details lead me to big changes.',
    'My mind is bright and even.',
    'I know when to move slowly.',
    'Quiet decisions are the strongest.',
    'I trust my inner voice.',
  ],
  flower: [
    'My beauty is natural and easy.',
    'I am soft, but strong.',
    'Today I allow myself to shine.',
    'Tenderness is also strength.',
    'My mood is blooming.',
    'I decorate my day with simple things.',
    'I always have room for beauty.',
    'The light falls on me just the way it should.',
    'I allow myself to be warm.',
    'Beauty comes when I breathe calmly.',
  ],
  crown: [
    'A crown does not create beauty — it only highlights what is already inside.\n\nThe Queen once said that every woman has her own story of light, but she does not see it every day. That is why she created this crown as a sign: stop, look at yourself more closely.\n\nIn the shine of gold you see not luxury, but a reflection of your own strength, softness and path.\n\nThe crown opens the story of beauty — a place where your steps, photos, thoughts and small victories are added up into its own legend.\n\nBeauty does not disappear, it is just waiting for you to look at it directly.',
  ],
};

const pickPhrase = (type) => {
  const arr = POOLS[type] || POOLS.pyramid;
  return arr[Math.floor(Math.random() * arr.length)];
};

function ButtonWebp({ title, onPress, disabled, style, large }) {
  return (
    <Pressable
      onPress={disabled ? null : onPress}
      style={({ pressed }) => [
        styles.btnWrap,
        pressed && !disabled && { transform: [{ scale: 0.99 }], opacity: 0.95 },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <RNImageBackground 
        source={BUTTON} 
        resizeMode="contain" 
        style={large ? styles.modalBtnImg : styles.btnImg}
      >
        <Text style={styles.btnText}>{title}</Text>
      </RNImageBackground>
    </Pressable>
  );
}

export default function ExchangerScreen() {
  const { artifacts, spend, canSpend } = useContext(AppCtx);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('pyramid'); // pyramid | scarab | flower | crown
  const [phrase, setPhrase] = useState('');

  const topCounts = useMemo(
    () => ({
      scarab: artifacts?.scarab ?? 0,
      pyramid: artifacts?.pyramid ?? 0,
      flower: artifacts?.flower ?? 0,
    }),
    [artifacts]
  );

  const iconFor = (type) => {
    if (type === 'pyramid') return PYRAMID;
    if (type === 'scarab') return SCARAB;
    if (type === 'flower') return FLOWER;
    return CROWN;
  };

  const openSuccess = (type) => {
    setModalType(type);
    setPhrase(pickPhrase(type));
    setModalVisible(true);
  };

  const exchangeOne = (type) => {
    const ok = spend?.({ [type]: 1 });
    if (!ok) return Alert.alert('Not enough', 'You need 1 artifact.');
    openSuccess(type);
  };

  const exchangeBeautyStory = () => {
    const cost = { flower: 3, scarab: 3 };
    const ok = spend?.(cost);
    if (!ok) return Alert.alert('Not enough', 'You need 3 flowers and 3 scarabs.');
    openSuccess('crown');
  };

  const onSharePhrase = async () => {
    try {
      await Share.share({
        message: phrase,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <ImageBackground source={BACK} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Exchanger</Text>

        {/* Artifacts bar */}
        <View style={styles.artifactsBar}>
          <Text style={styles.artifactsLabel}>Artifacts:</Text>

          <View style={styles.artRow}>
            <Image source={SCARAB} style={styles.artIcon} />
            <Text style={styles.artNum}>{topCounts.scarab}</Text>

            <Image source={PYRAMID} style={styles.artIcon} />
            <Text style={styles.artNum}>{topCounts.pyramid}</Text>

            <Image source={FLOWER} style={styles.artIcon} />
            <Text style={styles.artNum}>{topCounts.flower}</Text>
          </View>
        </View>

        {/* Pyramid */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Exchange for pyramids</Text>
            <Text style={styles.cardSub}>Phrases of strength and stability</Text>

            <View style={styles.cardRow}>
              <View style={styles.costWrap}>
                <Text style={styles.costNum}>1</Text>
                <Image source={PYRAMID} style={styles.costIcon} />
              </View>
              <ButtonWebp
                title="Exchange"
                onPress={() => exchangeOne('pyramid')}
                disabled={!canSpend?.({ pyramid: 1 })}
              />
            </View>
          </View>
        </View>

        {/* Scarab */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Exchange for a scarab</Text>
            <Text style={styles.cardSub}>Phrases of wisdom and calm</Text>

            <View style={styles.cardRow}>
              <View style={styles.costWrap}>
                <Text style={styles.costNum}>1</Text>
                <Image source={SCARAB} style={styles.costIcon} />
              </View>
              <ButtonWebp
                title="Exchange"
                onPress={() => exchangeOne('scarab')}
                disabled={!canSpend?.({ scarab: 1 })}
              />
            </View>
          </View>
        </View>

        {/* Flower */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Exchange for a flower</Text>
            <Text style={styles.cardSub}>Gentle phrases about beauty and mood</Text>

            <View style={styles.cardRow}>
              <View style={styles.costWrap}>
                <Text style={styles.costNum}>1</Text>
                <Image source={FLOWER} style={styles.costIcon} />
              </View>
              <ButtonWebp
                title="Exchange"
                onPress={() => exchangeOne('flower')}
                disabled={!canSpend?.({ flower: 1 })}
              />
            </View>
          </View>
        </View>

        {/* Big card (crown unlock) */}
        <View style={styles.bigCard}>
          <LinearGradient
            colors={[withAlpha(SALAD, 0.95), '#000000']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bigCardContent}>
            <Text style={styles.bigTitle}>Beauty Story</Text>
            <Text style={styles.bigSub}>Unlock a new feature with the Crown</Text>

            <View style={styles.bigCenter}>
              <Image source={CROWN} style={styles.crownIcon} />
            </View>

            {/* ✅ ВНИЗУ: кнопка и нужные артефакты НА ОДНОМ УРОВНЕ */}
            <View style={styles.bigBottomRow}>
              <ButtonWebp
                title="Exchange"
                onPress={exchangeBeautyStory}
                disabled={!canSpend?.({ flower: 3, scarab: 3 })}
                style={{ alignSelf: 'center' }}
              />

              <View style={styles.bigCost}>
                <View style={styles.bigCostPair}>
                  <Text style={styles.bigCostNum}>3</Text>
                  <Image source={FLOWER} style={styles.bigCostIcon} />
                </View>

                <View style={styles.bigCostPair}>
                  <Text style={styles.bigCostNum}>3</Text>
                  <Image source={SCARAB} style={styles.bigCostIcon} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ✅ увеличили скролл снизу, чтобы таббар НЕ перекрывал */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* SUCCESS MODAL */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Золотистые светящиеся точки на фоне */}
          {[...Array(15)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: 0.3 + Math.random() * 0.4,
                },
              ]}
            />
          ))}
          
          <View style={styles.modalCard}>
            <LinearGradient
              colors={[withAlpha(SALAD, 0.95), '#000000']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalCardContent}>
              <Text style={styles.modalTitle}>Successfully!</Text>

              <Image source={iconFor(modalType)} style={styles.modalIcon} />

              <View style={[styles.phraseCard, modalType === 'crown' && styles.phraseCardCrown]}>
                {modalType !== 'crown' && (
                  <Image source={QUEEN} style={styles.queenMini} />
                )}
                <ScrollView 
                  style={styles.phraseScroll}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <Text style={[styles.phraseText, modalType === 'crown' && styles.phraseTextCrown]}>{phrase}</Text>
                </ScrollView>
              </View>

              <View style={styles.modalButtons}>
                <ButtonWebp title="Share" onPress={onSharePhrase} style={styles.modalBtn} large />
                <ButtonWebp title="Close" onPress={() => setModalVisible(false)} style={[styles.modalBtn, styles.modalBtnClose]} large />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0B0A07' },

  content: {
    paddingTop: Platform.OS === 'android' ? 88 : 78,
    paddingHorizontal: 18,
    paddingBottom: 180, // ✅ больше места под таббар
  },

  h1: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginBottom: 14 },

  artifactsBar: {
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: SALAD_SOFT,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  artifactsLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '800' },
  artRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  artIcon: { width: 22, height: 22, resizeMode: 'contain' },
  artNum: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', minWidth: 18, textAlign: 'center' },

  card: {
    borderRadius: 18,
    backgroundColor: 'rgba(200, 35, 35, 0.85)', // Темнее красный фон
    borderWidth: 2,
    borderColor: SALAD_SOFT,
    marginBottom: 14,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  cardSub: { color: 'rgba(255,255,255,0.60)', marginTop: 6, marginBottom: 12, fontWeight: '700' },

  cardRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    gap: 12,
  },
  costWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  costNum: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  costIcon: { width: 28, height: 28, resizeMode: 'contain' },

  bigCard: {
    marginTop: 6,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: SALAD_SOFT,
    overflow: 'hidden',
  },
  bigCardContent: {
    padding: 16,
  },
  bigTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  bigSub: { color: 'rgba(255,255,255,0.65)', marginTop: 6, textAlign: 'center', fontWeight: '800' },

  bigCenter: { alignItems: 'center', paddingVertical: 18 },
  crownIcon: { width: 160, height: 120, resizeMode: 'contain' },

  // ✅ кнопка и артефакты в одной линии
  bigBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
   left:-70,
    marginTop: 4,
  },
  bigCost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
    marginLeft: 'auto',
  },
  bigCostPair: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bigCostNum: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  bigCostIcon: { width: 26, height: 26, resizeMode: 'contain' },

  // ✅ button.webp (не красим)
  btnWrap: { alignSelf: 'center' },
  btnImg: {
    width: 300, // ✅ увеличенный размер
    height: 110, // ✅ увеличенный размер
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Для модальных кнопок - больше размер
  modalBtnImg: {
    width: 280,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: DARK,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.3,
  },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  star: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: SALAD,
    shadowColor: SALAD,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  modalCard: {
    width: '98%',
    maxWidth: 480,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: withAlpha(SALAD, 0.65), // Красная обводка
    overflow: 'hidden',
    shadowColor: SALAD,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
    maxHeight: '85%',
  },
  modalCardContent: {
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  modalTitle: { 
    color: '#FFFFFF', 
    fontSize: 32, 
    fontWeight: '900', 
    marginTop: 4,
    letterSpacing: 0.5,
  },
  modalIcon: { 
    width: 120, 
    height: 120, 
    resizeMode: 'contain',
    marginVertical: 4,
  },

  phraseCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: SALAD, // Яркий красный фон
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    maxHeight: 300,
    shadowColor: SALAD,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  phraseCardCrown: {
    padding: 20,
    paddingHorizontal: 24,
  },
  queenMini: { 
    width: 90, 
    height: 130, 
    resizeMode: 'contain',
    marginTop: 4,
  },
  phraseScroll: {
    flex: 1,
    maxHeight: 280,
  },
  phraseText: { 
    color: '#170909', // Темно-красный текст
    fontSize: 16, 
    fontWeight: '900', 
    lineHeight: 24,
    textAlign: 'center',
  },
  phraseTextCrown: {
    fontSize: 18,
    lineHeight: 28,
    paddingHorizontal: 8,
  },
  
  modalButtons: {
    width: '100%',
    marginTop: 4,
    alignItems: 'center',
  },
  modalBtn: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
  modalBtnClose: {
    marginTop: -30,
  },
});

// helper
function withAlpha(hex, a = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${a})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
