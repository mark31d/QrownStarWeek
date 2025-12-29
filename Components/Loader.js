// Components/Loader.js
import React, { useEffect, useRef } from 'react';
import { StyleSheet, ImageBackground, Animated, Easing, StatusBar, Dimensions, Text, Image, View } from 'react-native';

const BACK = require('../assets/bg.webp');
const APP_ICON = require('../assets/app_icon.webp');
const { width: W, height: H } = Dimensions.get('window');

const RED_STAR = '#FF2E2E';
const NUM_STARS = 15;

export default function Loader() {
  const logoPulse = useRef(new Animated.Value(1)).current;

  const stars = useRef(
    Array.from({ length: NUM_STARS }, () => {
      const duration = 2000 + Math.random() * 2000; // 2-4 секунды
      const startY = -50 - Math.random() * 200; // начинаем с разных позиций
      return {
        translateY: new Animated.Value(startY),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.5),
        left: Math.random() * W,
        duration: duration,
        startY: startY,
      };
    })
  ).current;

  useEffect(() => {
    // Анимация пульсации логотипа
    const logoAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    logoAnimation.start();

    // Анимация звезд
    const animations = stars.map((star, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(star.translateY, {
              toValue: H + 100,
              duration: star.duration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(star.opacity, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.delay(star.duration - 400),
              Animated.timing(star.opacity, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(star.scale, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(star.scale, {
                toValue: 0.3,
                duration: star.duration - 400,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(star.translateY, {
            toValue: star.startY,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((anim) => anim.start());

    return () => {
      logoAnimation.stop();
      animations.forEach((anim) => anim.stop());
    };
  }, [stars, H, logoPulse]);

  const Star = ({ star, index }) => {
    const rotation = star.translateY.interpolate({
      inputRange: [star.startY, H + 100],
      outputRange: ['0deg', '720deg'],
    });

    return (
      <Animated.View
        style={[
          styles.star,
          {
            left: star.left,
            transform: [
              { translateY: star.translateY },
              { rotate: rotation },
              { scale: star.scale },
            ],
            opacity: star.opacity,
          },
        ]}
      >
        <Text style={styles.starText}>★</Text>
      </Animated.View>
    );
  };

  return (
    <ImageBackground source={BACK} resizeMode="cover" style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {stars.map((star, index) => (
        <Star key={index} star={star} index={index} />
      ))}
      <View style={styles.logoContainer}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: logoPulse }],
            },
          ]}
        >
          <Image source={APP_ICON} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 24,
    color: RED_STAR,
    textShadowColor: RED_STAR,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
});
