// Components/RegistrationScreen.js
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

const BG = require('../assets/bg.webp');
const APP_ICON = require('../assets/app_icon.webp');
const PHOTO_HOLDER = require('../assets/photo_holder.webp');
const BTN = require('../assets/button.webp'); // ✅ button.webp

const STORAGE_KEYS = { profile: '@qcw_profile' };

const COLORS = {
  bg: '#000000',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.70)',

  // ✅ красный стиль
  lime: '#FF1F1F',
  limeSoft: 'rgba(255, 31, 31, 0.35)',
  limeSoft2: 'rgba(255, 31, 31, 0.18)',

  // карточки
  card: 'rgba(0,0,0,0.58)',
  card2: 'rgba(0,0,0,0.42)',

  btnText: '#0E0F0B',
};

export default function RegistrationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => name.trim().length > 0 && !saving, [name, saving]);

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
    } catch (e) {
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Registration', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);
      await AsyncStorage.setItem(
        STORAGE_KEYS.profile,
        JSON.stringify({
          name: name.trim(),
          about: about.trim(),
          photoUri: photoUri || null,
        })
      );

      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ button.webp: сохранить пропорции
  const btnAsset = Image.resolveAssetSource(BTN);
  const btnAR =
    btnAsset?.width && btnAsset?.height ? btnAsset.width / btnAsset.height : 3.2;

  // размер кнопки (чуть больше чем стандарт)
  const btnW = Math.min(360, Math.round(0.82 * 360)); // фикс-похоже
  const btnH = btnW / btnAR;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ImageBackground source={BG} style={styles.bg}>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.iconWrap}>
                <Image source={APP_ICON} style={styles.icon} />
              </View>
              <Text style={styles.headerTitle}>REGISTRATION</Text>
            </View>

            {/* Inputs */}
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

            {/* Photo */}
            <TouchableOpacity activeOpacity={0.9} onPress={pickPhoto} style={styles.photoCard}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Image source={PHOTO_HOLDER} style={styles.photoHolderImg} />
                  <Text style={styles.photoText}>Your photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ✅ Button: button.webp */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onSave}
              disabled={!canSave}
              style={[styles.btnWrap, !canSave && { opacity: 0.55 }]}
            >
              <ImageBackground
                source={BTN}
                resizeMode="contain" // ✅ пропорции сохраняются
                style={[styles.btnBg, { width: btnW, height: btnH }]}
              >
                <Text style={styles.btnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </ImageBackground>
            </TouchableOpacity>

            <View style={{ height: 28 }} />
          </ScrollView>
        </KeyboardAvoidingView>

      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },

  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 22,
  },

  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1.5,
    borderColor: COLORS.limeSoft, // ✅ красный кант
  },
  icon: { width: '100%', height: '100%', resizeMode: 'cover' },

  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    letterSpacing: 1,
    fontWeight: '800',
  },

  inputCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.limeSoft, // ✅ красный
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },

  inputCardTall: {
    minHeight: 92,
    paddingVertical: 12,
  },

  input: {
    color: COLORS.text,
    fontSize: 16,
  },

  textArea: {
    minHeight: 68,
  },

  photoCard: {
    height: 250,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.limeSoft, // ✅ красный
    marginTop: 10,
  },

  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    
  },

  photoHolderImg: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
    opacity: 0.95,
    tintColor:'#FF1F1F',
  },

  photoText: { color: COLORS.text, fontSize: 16, opacity: 0.95 ,  },

  // ✅ button.webp wrap
  btnWrap: {
    alignSelf: 'center',
    marginTop: 22,
  },
  btnBg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: COLORS.btnText,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
