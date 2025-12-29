// Components/HistoryScreen.js
import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const BACK = require('../assets/bg.webp');
const QUEEN = require('../assets/onb_queen.webp');

const HISTORY_KEY = 'qcw_history_v1';

const RED = '#FF2E2E';
const RED_SOFT = 'rgba(255,46,46,0.30)';
const RED_SOFT2 = 'rgba(255,46,46,0.18)';

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

const safeParse = (s, fallback) => {
  try {
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
};

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const parsed = safeParse(raw, []);
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const toggleFavorite = useCallback(async (id) => {
    try {
      const updated = history.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      );
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);
    } catch {}
  }, [history]);

  const stats = useMemo(() => {
    const totalTasks = history.length;
    const uniqueDays = new Set(history.map((h) => h.dayIndex)).size;
    
    // Days with 4 completed tasks
    const dayCounts = {};
    history.forEach((h) => {
      dayCounts[h.dayIndex] = (dayCounts[h.dayIndex] || 0) + 1;
    });
    const completedDays = Object.values(dayCounts).filter((count) => count === 4).length;

    // Streak: consecutive days from the highest dayIndex
    const sortedDays = Array.from(new Set(history.map((h) => h.dayIndex))).sort((a, b) => b - a);
    let streak = 0;
    if (sortedDays.length > 0) {
      let expectedDay = sortedDays[0];
      for (const day of sortedDays) {
        if (day === expectedDay && dayCounts[day] === 4) {
          streak++;
          expectedDay--;
        } else {
          break;
        }
      }
    }

    const favoritesCount = history.filter((h) => h.favorite).length;

    // Week progress: current 7-day week
    const currentWeekDays = sortedDays.filter((day) => {
      const weekStart = Math.floor((day - 1) / 7) * 7 + 1;
      const weekEnd = weekStart + 6;
      return day >= weekStart && day <= weekEnd;
    });
    const weekTasks = history.filter((h) => currentWeekDays.includes(h.dayIndex)).length;
    const weekProgress = Math.min(100, Math.round((weekTasks / 28) * 100));

    return {
      totalTasks,
      completedDays,
      streak,
      favoritesCount,
      weekProgress,
      weekTasks,
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
    let filtered = [...history];
    if (favoritesOnly) {
      filtered = filtered.filter((h) => h.favorite);
    }
    return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [history, favoritesOnly]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={BACK} style={styles.bg} resizeMode="cover">
        <View style={styles.dim} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: 200 }]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>History</Text>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCard}>
                <Image source={QUEEN} style={styles.emptyQueen} resizeMode="contain" />
                <Text style={styles.emptyText}>
                  Unfortunately,{"\n"}there are no{"\n"}completed tasks.
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Statistics Card */}
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Statistics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalTasks}</Text>
                    <Text style={styles.statLabel}>Tasks</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.completedDays}</Text>
                    <Text style={styles.statLabel}>Days</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.streak}</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.favoritesCount}</Text>
                    <Text style={styles.statLabel}>Favorites</Text>
                  </View>
                </View>
                <View style={styles.weekProgress}>
                  <Text style={styles.weekProgressLabel}>
                    Week Progress: {stats.weekTasks}/28 ({stats.weekProgress}%)
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${stats.weekProgress}%` }]} />
                  </View>
                </View>
              </View>

              {/* Favorites Toggle */}
              <View style={styles.favoritesToggle}>
                <Text style={styles.favoritesLabel}>Favorites only</Text>
                <Switch
                  value={favoritesOnly}
                  onValueChange={setFavoritesOnly}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: withAlpha(RED, 0.5) }}
                  thumbColor={favoritesOnly ? RED : 'rgba(255,255,255,0.5)'}
                />
              </View>

              {/* History List */}
              <View style={styles.list}>
                {filteredHistory.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('HistoryDetails', { id: item.id })}
                      style={styles.cardContent}
                    >
                      <View style={styles.itemLeft}>
                        <Text style={styles.itemDay}>Day {item.dayIndex || 1}</Text>
                        <Text style={styles.itemTask}>Task {Number(item.taskIndex || 0) + 1}</Text>
                        <Text style={styles.itemPrompt} numberOfLines={2}>
                          {item.prompt || ''}
                        </Text>
                      </View>

                      <View style={styles.itemRight}>
                        <View style={styles.preview}>
                          {item.photoUri ? (
                            <Image
                              source={{ uri: item.photoUri }}
                              style={styles.previewImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.noPhoto}>
                              <Text style={styles.noPhotoText}>No photo</Text>
                            </View>
                          )}
                        </View>
                        <Text numberOfLines={3} style={styles.itemNote}>
                          {item.about || '—'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.actionBtn}
                        onPress={() => toggleFavorite(item.id)}
                      >
                        <Text style={styles.actionBtnText}>
                          {item.favorite ? 'Unfavorite' : 'Favorite'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.actionBtn, styles.openBtn]}
                        onPress={() => navigation.navigate('HistoryDetails', { id: item.id })}
                      >
                        <Text style={[styles.actionBtnText, styles.openBtnText]}>Open</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },

  content: {
    paddingHorizontal: 18,
    paddingTop: Platform.select({ ios: 10, android: 18 }),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 18,
  },

  title: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Statistics
  statsCard: {
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: RED_SOFT,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: RED,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 14,
    fontWeight: '700',
  },
  weekProgress: {
    marginTop: 8,
  },
  weekProgressLabel: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: RED,
    borderRadius: 4,
  },

  // Favorites Toggle
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: RED_SOFT2,
  },
  favoritesLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Empty state
  emptyWrap: { marginTop: 70 },
  emptyCard: {
    borderRadius: 18,
    backgroundColor: withAlpha(RED, 0.90),
    borderWidth: 1.5,
    borderColor: withAlpha('#FFFFFF', 0.12),
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  emptyQueen: { width: 150, height: 150 },
  emptyText: {
    flex: 1,
    marginLeft: 14,
    color: '#220707',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },

  // List
  list: { gap: 14 },

  itemCard: {
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: RED_SOFT,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  itemLeft: { flex: 1 },
  itemDay: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 2 },
  itemTask: { color: withAlpha(RED, 0.90), fontSize: 14, fontWeight: '900', marginBottom: 8 },

  itemPrompt: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },

  itemRight: { width: 150 },
  preview: {
    width: '100%',
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1.2,
    borderColor: RED_SOFT2,
    marginBottom: 10,
  },
  previewImg: { width: '100%', height: '100%' },

  noPhoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: { color: 'rgba(255,255,255,0.45)', fontWeight: '800' },

  itemNote: { color: 'rgba(255,255,255,0.60)', fontSize: 12, lineHeight: 16 },

  // Actions
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: RED_SOFT2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1.5,
    borderColor: RED_SOFT,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  openBtn: {
    backgroundColor: RED,
    borderColor: RED,
  },
  openBtnText: {
    color: '#170909',
  },
});
