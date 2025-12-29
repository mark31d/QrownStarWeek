// Components/InfoScreen.js
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Share,
} from 'react-native';

const BACK = require('../assets/bg.webp');
const QUEEN = require('../assets/onb_queen.webp');
const APP_ICON = require('../assets/app_icon.webp');
const BUTTON = require('../assets/button.webp');

const SALAD = '#FF2E2E';
const SALAD_SOFT = 'rgba(255,46,46,0.30)';
const CARD = 'rgba(0,0,0,0.62)';
const CARD2 = 'rgba(0,0,0,0.46)';

export default function InfoScreen() {
  const onShare = async () => {
    try {
      await Share.share({
        message: 'Queen Crown Week — weekly app with daily beauty and mood challenges.',
      });
    } catch (e) {}
  };

  return (
    <ImageBackground source={BACK} resizeMode="cover" style={styles.bg}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Information</Text>

          <View style={styles.card}>
            <Image source={QUEEN} style={styles.queen} resizeMode="contain" />
            <Text style={styles.cardText}>
              {'Queen Crown Week is a\nweekly app with daily beauty\nand mood challenges.\nComplete 4 challenges each\nday, add photos and save\nyour story.'}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Image source={APP_ICON} style={styles.icon} resizeMode="cover" />
            </View>
            <Text style={styles.cardText}>
              {'Collect artifacts and\nexchange them for\nmotivational phrases from\nthe Queen. All information\nremains only with you.'}
            </Text>
          </View>

          {/* button.webp (оригинальный размер) */}
          <TouchableOpacity activeOpacity={0.9} onPress={onShare} style={styles.btnWrap}>
            <ImageBackground
              source={BUTTON}
              resizeMode="contain"
              style={styles.btnImg}
              imageStyle={styles.btnImageStyle}
            >
              <Text style={styles.btnText}>Share</Text>
            </ImageBackground>
          </TouchableOpacity>

          {/* ✅ большой отступ, чтобы таббар НЕ перекрывал */}
          <View style={{ height: 190 }} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

  content: {
    paddingTop: 18,
    paddingHorizontal: 22,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 16,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,

    borderWidth: 2,
    borderColor: SALAD_SOFT,

    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,

    marginBottom: 18,
    minHeight: 180,
  },

  queen: {
    width: 155,
    height: 155,
  },

  iconWrap: {
    width: 108,
    height: 108,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: CARD2,
    borderWidth: 2,
    borderColor: SALAD_SOFT,
  },
  icon: { width: '100%', height: '100%' },

  cardText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },

  btnWrap: {
    alignSelf: 'center',
    marginTop: 6,
  },

  // ✅ оригинальный размер
  btnImg: {
    top:-30,
    width: 240,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },



  btnText: {
    color: '#220707',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
