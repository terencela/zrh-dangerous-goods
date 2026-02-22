import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useScan } from '@/lib/scan-context';
import { useI18n } from '@/lib/i18n';

function TipBadge({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.tipBadge}>
      <Feather name={icon} size={11} color="rgba(255,255,255,0.7)" />
      <Text style={styles.tipBadgeText}>{text}</Text>
    </View>
  );
}

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { setPhotoUri } = useScan();
  const { t } = useI18n();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
    if (photo) setCapturedUri(photo.uri);
  };

  const handleUsePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoUri(capturedUri);
    router.push('/analyzing');
  };

  const handleRetake = () => setCapturedUri(null);

  const handleSkip = () => {
    setPhotoUri(null);
    router.push('/categories');
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPadding }]}>
        <View style={styles.permContent}>
          <Feather name="camera-off" size={24} color={Colors.textTertiary} />
          <Text style={styles.permTitle}>{t('cameraNeeded')}</Text>
          <Text style={styles.permDesc}>{t('cameraDesc')}</Text>
          <Pressable style={({ pressed }) => [styles.permBtn, pressed && { opacity: 0.85 }]} onPress={requestPermission}>
            <Text style={styles.permBtnText}>{t('allowCamera')}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.skipLink, pressed && { opacity: 0.5 }]} onPress={handleSkip}>
            <Text style={styles.skipLinkText}>{t('continueWithout')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.previewDim} />
        <View style={[styles.previewUi, { paddingTop: topPadding + 12, paddingBottom: bottomPadding + 16 }]}>
          <Pressable style={({ pressed }) => [styles.pill, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
            <Feather name="x" size={18} color={Colors.white} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={styles.previewActions}>
            <Pressable style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]} onPress={handleRetake}>
              <Feather name="refresh-cw" size={15} color={Colors.white} />
              <Text style={styles.ghostBtnText}>{t('retake')}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.solidBtn, pressed && { opacity: 0.9 }]} onPress={handleUsePhoto}>
              <Feather name="check" size={15} color={Colors.white} />
              <Text style={styles.solidBtnText}>{t('usePhoto')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS !== 'web' ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
      )}
      <View style={[styles.overlay, { paddingTop: topPadding + 8, paddingBottom: bottomPadding + 12 }]}>
        <View style={styles.topRow}>
          <Pressable style={({ pressed }) => [styles.pill, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color={Colors.white} />
          </Pressable>
          <Text style={styles.topLabel}>{t('takePhoto')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.frameArea}>
          <View style={styles.frame}>
            <View style={[styles.c, styles.cTL]} />
            <View style={[styles.c, styles.cTR]} />
            <View style={[styles.c, styles.cBL]} />
            <View style={[styles.c, styles.cBR]} />
          </View>
          <Text style={styles.hint}>{t('placeInFrame')}</Text>
        </View>

        <View style={styles.bottomArea}>
          <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.tipsRow}>
            <TipBadge icon="tag" text={t('cameraTip1')} />
            <TipBadge icon="sun" text={t('cameraTip2')} />
            <TipBadge icon="maximize" text={t('cameraTip3')} />
          </Animated.View>

          {Platform.OS !== 'web' ? (
            <Pressable style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.9 }] }]} onPress={handleCapture}>
              <View style={styles.shutterInner} />
            </Pressable>
          ) : (
            <Pressable style={({ pressed }) => [styles.solidBtn, pressed && { opacity: 0.8 }]} onPress={handleSkip}>
              <Text style={styles.solidBtnText}>{t('webContinue')}</Text>
            </Pressable>
          )}
          <Pressable style={({ pressed }) => [styles.skipRow, pressed && { opacity: 0.5 }]} onPress={handleSkip}>
            <Text style={styles.skipText}>{t('skip')}</Text>
            <Feather name="chevron-right" size={13} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loadingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  permContent: { alignItems: 'center', paddingHorizontal: 40, gap: 10 },
  permTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginTop: 8 },
  permDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  permBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  permBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  skipLink: { paddingVertical: 8 },
  skipLinkText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  topLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.white },
  pill: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  frameArea: { alignItems: 'center', gap: 14 },
  frame: { width: 240, height: 240, position: 'relative' },
  c: { position: 'absolute', width: 32, height: 32, borderColor: 'rgba(255,255,255,0.7)' },
  cTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 10 },
  cTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 10 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 10 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 10 },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.4)' },
  bottomArea: { alignItems: 'center', gap: 14, paddingHorizontal: 24 },
  tipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tipBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  shutter: { width: 66, height: 66, borderRadius: 33, borderWidth: 3, borderColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.white },
  skipRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  skipText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.5)' },
  previewDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  previewUi: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingHorizontal: 16 },
  previewActions: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  ghostBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.white },
  solidBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 8, backgroundColor: Colors.accent },
  solidBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});
