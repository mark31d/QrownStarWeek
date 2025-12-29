// Components/CustomTabBar.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

// icons
const ICONS = {
  Home: require('../assets/tab_home.webp'),
  History: require('../assets/tab_history.webp'),
  Exchanger: require('../assets/tab_exchange.webp'),
  Profile: require('../assets/tab_profile.webp'),
};

const SALAD = '#FF2E2E';

// тёмно-красный фон бара
const DARK_SALAD_TOP = '#3A1818';
const DARK_SALAD_BOTTOM = '#170909';

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

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  // "полуконтейнер": общий контейнер больше, но низ уходит за экран
  const BAR_HEIGHT = 230;
  const HIDE_BOTTOM = 94; // сколько прячем вниз (регулируй под “как на первом скрине”)

  return (
    <View style={styles.outer} pointerEvents="box-none">
      <View
        style={[
          styles.barWrap,
          {
            height: BAR_HEIGHT,
            bottom: -HIDE_BOTTOM, // уезжает вниз => видна только верхняя часть (полуконтейнер)
            paddingBottom: insets.bottom, // чтобы на iPhone не прижимало к самому низу
          },
        ]}
      >
        {/* ✅ фон закрашивает ВЕСЬ полуконтейнер */}
        <LinearGradient
          colors={[
            withAlpha(DARK_SALAD_TOP, 0.94),
            withAlpha(DARK_SALAD_BOTTOM, 0.92),
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* кнопки НЕ выносим отрицательными top — они внутри, поэтому фон виден везде */}
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key] || {};
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

            const src = ICONS[route.name];

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.9}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[
                  styles.tile,
                  {
                    borderColor: isFocused ? withAlpha(SALAD, 0.65) : withAlpha(SALAD, 0.22),
                    backgroundColor: isFocused ? withAlpha(SALAD, 0.10) : withAlpha('#000000', 0.25),
                  },
                  isFocused && styles.tileFocusedShadow,
                ]}
              >
                {src ? (
                  <Image
                    source={src}
                    resizeMode="contain"
                    style={[
                      styles.icon,
                      {
                        tintColor: isFocused ? SALAD : withAlpha(SALAD, 0.28),
                        opacity: isFocused ? 1 : 0.78,
                      },
                    ]}
                  />
                ) : (
                  <View style={{ width: 26, height: 26 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },

  // ✅ один контур, без “двойной рамки”
  barWrap: {
    width: '100%',
    borderWidth: 1.2,
    borderColor: withAlpha(SALAD, 0.45),
    borderRadius: 38,
    overflow: 'hidden',
    top:30,
    

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.20,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 10 },
    }),
  },

  // размещаем иконки в верхней части полуконтейнера
  row: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 60,
    marginHorizontal:20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  tile: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tileFocusedShadow: {
    shadowColor: SALAD,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  icon: {
    width: 28,
    height: 28,
  },
});
