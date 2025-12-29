// Components/OnboardingScreen.js
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

const BACK = require('../assets/bg.webp');

// slides
const IMG_1 = require('../assets/onb_queen.webp');
const IMG_2 = require('../assets/onb_task.webp');
const IMG_3 = require('../assets/onb_book.webp');
const IMG_4 = require('../assets/onb_lock.webp');

// button.webp
const BTN = require('../assets/button.webp');

const COLORS = {
  text: '#FFFFFF',

  // красный
  lime: '#FF1F1F',
  limeSoft: 'rgba(255, 31, 31, 0.35)',
  limeSoft2: 'rgba(255, 31, 31, 0.18)',

  // нижний контейнер: черный полупрозрачный
  cardDark: 'rgba(0, 0, 0, 0.62)',

  btnText: '#0E0F0B',
};

export default function OnboardingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const slides = useMemo(
    () => [
      {
        key: 's1',
        image: IMG_1,
        imageOffsetY: 20, // ✅ королева ниже на 10px
        text:
          'Welcome to Queen Crown Week.\nHere you will spend your week of\nbeauty and strength\nwith the Queen.',
        btn: 'Continue',
      },
      {
        key: 's2',
        image: IMG_2,
        imageOffsetY: 0,
        text:
          'Every day you receive\none easy task.\nComplete it, add a photo and a\nshort description.',
        btn: 'Next',
      },
      {
        key: 's3',
        image: IMG_3,
        imageOffsetY: 0,
        text:
          'All your photos and entries are\nstored in a private weekly story,\nwhich only you can see.',
        btn: 'Okay',
      },
      {
        key: 's4',
        image: IMG_4,
        imageOffsetY: 0,
        text:
          'For your activity you receive\nartifacts: scarab, pyramid, flower.\nExchange them for motivational\nphrases from the Queen.',
        btn: 'Start',
      },
    ],
    []
  );

  const goNext = () => {
    if (index >= slides.length - 1) {
      navigation.replace('Registration');
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * W, animated: true });
  };

  const onMomentumEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    setIndex(Math.round(x / W));
  };

  // кнопка сохраняет пропорции
  const btnAsset = Image.resolveAssetSource(BTN);
  const btnAR =
    btnAsset?.width && btnAsset?.height ? btnAsset.width / btnAsset.height : 3.2;

  // кнопка меньше
  const btnW = Math.min(W * 0.58, 260);
  const btnH = btnW / btnAR;

  return (
    <ImageBackground source={BACK} resizeMode="cover" style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        decelerationRate="fast"
        snapToInterval={W}
        snapToAlignment="start"
        bounces={false}
      >
        {slides.map((s) => (
          <View key={s.key} style={styles.page}>
            {/* ✅ TOP: градиент от красного к черному */}
            <LinearGradient
              colors={['#FF1F1F', '#000000']}
              start={{ x: 0.2, y: 0.0 }}
              end={{ x: 0.8, y: 1.0 }}
              style={styles.topCard}
            >
              <View style={styles.topInnerBorder} pointerEvents="none" />

              <Image
                source={s.image}
                style={[styles.topImage, { transform: [{ translateY: s.imageOffsetY || 0 }] }]}
                resizeMode="contain"
              />
            </LinearGradient>

            {/* ✅ BOTTOM: без градиента, полный по ширине и чуть вылезает вниз */}
            <View style={styles.bottomCard}>
              <View style={styles.bottomEdgeGlow} />

              <Text style={styles.desc}>{s.text}</Text>

              <TouchableOpacity activeOpacity={0.9} onPress={goNext} style={styles.btnWrap}>
                <ImageBackground
                  source={BTN}
                  resizeMode="contain"
                  style={[styles.btnBg, { width: btnW, height: btnH }]}
                >
                  <Text style={styles.btnText}>{s.btn}</Text>
                </ImageBackground>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  page: {
    width: W,
    height: H,
    paddingTop: 86,
    paddingHorizontal: 18,
    position: 'relative',
  },

  // TOP (gradient red -> black)
  topCard: {
    height: H * 0.52,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: COLORS.limeSoft,

    shadowColor: COLORS.lime,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  topInnerBorder: {
    position: 'absolute',
    inset: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.limeSoft2,
  },
  topImage: {
    width: '90%',
    height: '90%',
  },

  // BOTTOM (no gradient)
  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -18,

    paddingTop: 26,
    paddingBottom: 36,
    paddingHorizontal: 22,

    backgroundColor: COLORS.cardDark,
    borderWidth: 2,
    borderColor: COLORS.lime,
    borderRadius: 28,

    shadowColor: COLORS.lime,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  bottomEdgeGlow: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    backgroundColor: COLORS.lime,
    borderRadius: 2,
    opacity: 0.65,
  },

  desc: {
    color: COLORS.text,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 16,
  },

  // button.webp
  btnWrap: { alignSelf: 'center', marginTop: 6 },
  btnBg: { alignItems: 'center', justifyContent: 'center' },
  btnText: {
    color: COLORS.btnText,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
