// Components/HistoryDetailsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';

const BACK = require('../assets/bg.webp');
const PHOTO_HOLDER = require('../assets/photo_holder.webp');

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

export default function HistoryDetailsScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [item, setItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAbout, setEditAbout] = useState('');
  const [editPhotoUri, setEditPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadItem = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history = safeParse(raw, []);
      const found = Array.isArray(history) ? history.find((h) => h.id === id) : null;
      if (found) {
        setItem(found);
        setEditAbout(found.about || '');
        setEditPhotoUri(found.photoUri || null);
      }
    } catch {}
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  const toggleFavorite = useCallback(async () => {
    if (!item) return;
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history = safeParse(raw, []);
      const updated = history.map((h) =>
        h.id === id ? { ...h, favorite: !h.favorite } : h
      );
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setItem({ ...item, favorite: !item.favorite });
    } catch {}
  }, [item, id]);

  const onShare = useCallback(async () => {
    if (!item) return;
    try {
      const message = `Day ${item.dayIndex || 1}\nTask ${Number(item.taskIndex || 0) + 1}\n\n${item.prompt || ''}\n\n${item.about || ''}`.trim();
      await Share.share({ message });
    } catch {}
  }, [item]);

  const onDelete = useCallback(() => {
    if (!item) return;
    Alert.alert('Delete task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(HISTORY_KEY);
            const history = safeParse(raw, []);
            const updated = history.filter((h) => h.id !== id);
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
            navigation.goBack();
          } catch {}
        },
      },
    ]);
  }, [item, id, navigation]);

  const onEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const onCancelEdit = useCallback(() => {
    setIsEditing(false);
    if (item) {
      setEditAbout(item.about || '');
      setEditPhotoUri(item.photoUri || null);
    }
  }, [item]);

  const onSaveEdit = useCallback(async () => {
    if (!item) return;
    setSaving(true);
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history = safeParse(raw, []);
      const updated = history.map((h) =>
        h.id === id
          ? {
              ...h,
              about: editAbout.trim(),
              photoUri: editPhotoUri,
            }
          : h
      );
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setItem({ ...item, about: editAbout.trim(), photoUri: editPhotoUri });
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }, [item, id, editAbout, editPhotoUri]);

  const onReplacePhoto = useCallback(async () => {
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      });
      if (res?.didCancel) return;
      const uri = res?.assets?.[0]?.uri;
      if (uri) setEditPhotoUri(uri);
    } catch {
      Alert.alert('Error', 'Could not open gallery.');
    }
  }, []);

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

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <ImageBackground source={BACK} style={styles.bg} resizeMode="cover">
          <View style={styles.dim} />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={BACK} style={styles.bg} resizeMode="cover">
        <View style={styles.dim} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: 200 }]}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            </View>

            {/* Photo */}
            <View style={styles.photoCard}>
              {isEditing ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={onReplacePhoto}
                  style={styles.photoContainer}
                >
                  {editPhotoUri ? (
                    <Image source={{ uri: editPhotoUri }} style={styles.photo} resizeMode="cover" />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Image source={PHOTO_HOLDER} style={styles.photoHolderImg} />
                      <Text style={styles.photoPlaceholderText}>Replace photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.photoContainer}>
                  {item.photoUri ? (
                    <Image source={{ uri: item.photoUri }} style={styles.photo} resizeMode="cover" />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Image source={PHOTO_HOLDER} style={styles.photoHolderImg} />
                      <Text style={styles.photoPlaceholderText}>No photo</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.dayTaskText}>
                Day {item.dayIndex || 1} / Task {Number(item.taskIndex || 0) + 1}
              </Text>
              <Text style={styles.promptText}>{item.prompt || ''}</Text>

              {isEditing ? (
                <View style={styles.editInputCard}>
                  <TextInput
                    value={editAbout}
                    onChangeText={setEditAbout}
                    placeholder="About task"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.editInput}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              ) : (
                <Text style={styles.aboutText}>{item.about || '—'}</Text>
              )}

              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>

            {/* Actions */}
            {isEditing ? (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={onCancelEdit}
                  disabled={saving}
                >
                  <Text style={[styles.actionBtnText, styles.cancelBtnText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.actionBtn, styles.saveBtn]}
                  onPress={onSaveEdit}
                  disabled={saving}
                >
                  <Text style={[styles.actionBtnText, styles.saveBtnText]}>
                    {saving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.actionBtn}
                  onPress={toggleFavorite}
                >
                  <Text style={styles.actionBtnText}>
                    {item.favorite ? 'Unfavorite' : 'Favorite'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.actionBtn}
                  onPress={onEdit}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.actionBtn}
                  onPress={onShare}
                >
                  <Text style={styles.actionBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={onDelete}
                >
                  <Text style={[styles.actionBtnText, styles.deleteBtnText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}

            {isEditing && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.replacePhotoBtn}
                onPress={onReplacePhoto}
              >
                <Text style={styles.replacePhotoBtnText}>Replace photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },
  flex: { flex: 1 },

  content: {
    paddingHorizontal: 18,
    paddingTop: Platform.select({ ios: 10, android: 18 }),
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  backBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1.5,
    borderColor: RED_SOFT,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },

  photoCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderWidth: 1.5,
    borderColor: RED_SOFT,
  },
  photoContainer: {
    width: '100%',
    height: 300,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    gap: 12,
  },
  photoHolderImg: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    opacity: 0.6,
  },
  photoPlaceholderText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 16,
    fontWeight: '800',
  },

  infoCard: {
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: RED_SOFT,
    padding: 18,
    marginBottom: 16,
  },
  dayTaskText: {
    color: RED,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  promptText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 16,
  },
  aboutText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  dateText: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 14,
    fontWeight: '700',
  },

  editInputCard: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: RED_SOFT2,
    padding: 14,
    marginBottom: 16,
    minHeight: 120,
  },
  editInput: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 22,
    minHeight: 92,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1.5,
    borderColor: RED_SOFT,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  deleteBtn: {
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderColor: 'rgba(255,255,255,0.20)',
  },
  deleteBtnText: {
    color: '#FFF',
  },
  cancelBtn: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.70)',
  },
  saveBtn: {
    backgroundColor: RED,
    borderColor: RED,
  },
  saveBtnText: {
    color: '#170909',
  },

  replacePhotoBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1.5,
    borderColor: RED_SOFT,
    marginBottom: 16,
  },
  replacePhotoBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
});

