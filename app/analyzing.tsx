import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useScan, type AiAnalysis } from '@/lib/scan-context';
import { useI18n } from '@/lib/i18n';
import { ITEM_CATEGORIES } from '@/constants/rules';
import { apiRequest } from '@/lib/query-client';
import { saveScanRecord } from '@/lib/storage';
import type { VerdictStatus } from '@/constants/rules';

type AnalysisState = 'loading' | 'success' | 'error';

function getStatusConfig(status: string) {
  switch (status) {
    case 'allowed': return { color: Colors.allowed, bg: Colors.allowedBg, icon: 'check-circle' as const };
    case 'conditional': return { color: Colors.conditional, bg: Colors.conditionalBg, icon: 'alert-circle' as const };
    default: return { color: Colors.notAllowed, bg: Colors.notAllowedBg, icon: 'x-circle' as const };
  }
}

function ProgressStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <View style={styles.progressStep}>
      <View style={[styles.progressDot, done && styles.progressDotDone, active && !done && styles.progressDotActive]}>
        {done ? (
          <Feather name="check" size={8} color={Colors.white} />
        ) : active ? (
          <ActivityIndicator size={10} color={Colors.white} />
        ) : null}
      </View>
      <Text style={[styles.progressLabel, (active || done) && styles.progressLabelActive]}>{label}</Text>
    </View>
  );
}

export default function AnalyzingScreen() {
  const insets = useSafeAreaInsets();
  const { session, setAiAnalysis, setCategory, setVerdict } = useScan();
  const { t, lang } = useI18n();
  const [state, setState] = useState<AnalysisState>('loading');
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progressIdx, setProgressIdx] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(withSequence(
      withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
    ), -1, true);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  useEffect(() => {
    progressTimer.current = setInterval(() => {
      setProgressIdx(prev => Math.min(prev + 1, 2));
    }, 2200);
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, []);

  useEffect(() => { analyzeImage(); }, []);

  const analyzeImage = async () => {
    try {
      setState('loading');
      setProgressIdx(0);
      let base64Image = '';
      if (session.photoUri) {
        const resp = await fetch(session.photoUri);
        const blob = await resp.blob();
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(t('photoReadError')));
          reader.readAsDataURL(blob);
        });
      }
      if (!base64Image) { setState('error'); setErrorMsg(t('noPhoto')); return; }

      const response = await apiRequest('POST', '/api/analyze-image', { image: base64Image });
      const result: AiAnalysis = await response.json();
      setAnalysis(result);
      setAiAnalysis(result);

      if (progressTimer.current) clearInterval(progressTimer.current);
      setProgressIdx(3);

      if (result.identified && result.verdict) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setState('success');
      } else if (result.identified && result.categoryId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setState('success');
      } else {
        setState('error');
        setErrorMsg(result.summary || t('aiParseError'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setState('error');
      setErrorMsg(err?.message || t('aiDefaultError'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleAcceptVerdict = () => {
    if (!analysis?.verdict || !analysis.categoryId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const matched = ITEM_CATEGORIES.find(c => c.id === analysis.categoryId);
    if (matched) setCategory(matched);

    const verdict = {
      handBaggage: {
        status: analysis.verdict.handBaggage.status as VerdictStatus,
        text: analysis.verdict.handBaggage.text,
        tip: analysis.verdict.handBaggage.tip,
      },
      checkedBaggage: {
        status: analysis.verdict.checkedBaggage.status as VerdictStatus,
        text: analysis.verdict.checkedBaggage.text,
        tip: analysis.verdict.checkedBaggage.tip,
      },
    };
    setVerdict(verdict);

    const record = {
      id: Crypto.randomUUID(),
      categoryId: analysis.categoryId,
      categoryName: analysis.itemName || (matched ? matched.name[lang] : ''),
      answers: {},
      handBaggageStatus: verdict.handBaggage.status,
      checkedBaggageStatus: verdict.checkedBaggage.status,
      handBaggageText: verdict.handBaggage.text,
      checkedBaggageText: verdict.checkedBaggage.text,
      handBaggageTip: verdict.handBaggage.tip,
      checkedBaggageTip: verdict.checkedBaggage.tip,
      photoUri: session.photoUri || undefined,
      timestamp: Date.now(),
    };
    saveScanRecord(record);

    router.push({ pathname: '/verdict', params: { fromAi: '1' } });
  };

  const handleSelectManually = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/categories');
  };

  const confLabel = analysis?.confidence === 'high' ? t('highConfidence') : analysis?.confidence === 'medium' ? t('medConfidence') : t('lowConfidence');
  const confColor = analysis?.confidence === 'high' ? Colors.allowed : analysis?.confidence === 'medium' ? Colors.conditional : Colors.notAllowed;

  const steps = [t('analyzingStep1'), t('analyzingStep2'), t('analyzingStep3')];

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.topBar}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>{t('aiAnalysis')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        {session.photoUri && (
          <View style={styles.photoWrap}>
            <Image source={{ uri: session.photoUri }} style={styles.photo} />
            {state === 'loading' && (
              <View style={styles.scanOverlay}>
                <Animated.View style={[styles.scanFrame, pulseStyle]}>
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                </Animated.View>
              </View>
            )}
          </View>
        )}

        {state === 'loading' && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.statusArea}>
            <View style={styles.stepsCol}>
              {steps.map((label, i) => (
                <ProgressStep key={i} label={label} active={progressIdx === i} done={progressIdx > i} />
              ))}
            </View>
            <View style={styles.hintBox}>
              <Feather name="zap" size={11} color={Colors.blue} />
              <Text style={styles.hintText}>{t('analyzingHint')}</Text>
            </View>
          </Animated.View>
        )}

        {state === 'success' && analysis?.verdict && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.resultArea}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultName}>{analysis.itemName}</Text>
              <View style={styles.confRow}>
                <View style={[styles.confDot, { backgroundColor: confColor }]} />
                <Text style={[styles.confText, { color: confColor }]}>{confLabel}</Text>
              </View>
            </View>

            <View style={styles.verdictMini}>
              {(['handBaggage', 'checkedBaggage'] as const).map((key) => {
                const v = analysis.verdict![key];
                const cfg = getStatusConfig(v.status);
                const label = key === 'handBaggage' ? t('handBaggage') : t('checkedBaggage');
                return (
                  <View key={key} style={[styles.verdictRow, { borderColor: Colors.border }]}>
                    <View style={styles.verdictRowLeft}>
                      <Feather name={cfg.icon} size={15} color={cfg.color} />
                      <Text style={styles.verdictLabel}>{label}</Text>
                    </View>
                    <Text style={[styles.verdictStatus, { color: cfg.color }]}>
                      {v.status === 'allowed' ? t('allowed') : v.status === 'conditional' ? t('conditional') : t('notAllowed')}
                    </Text>
                  </View>
                );
              })}
            </View>

            {analysis.summary && <Text style={styles.summaryText}>{analysis.summary}</Text>}
          </Animated.View>
        )}

        {state === 'success' && analysis && !analysis.verdict && (
          <View style={styles.resultArea}>
            <Feather name="alert-circle" size={20} color={Colors.conditional} />
            <Text style={styles.warningText}>{analysis.summary}</Text>
          </View>
        )}

        {state === 'error' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.errorArea}>
            <Feather name="alert-triangle" size={20} color={Colors.notAllowed} />
            <Text style={styles.errorTitle}>{t('analysisFailed')}</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </Animated.View>
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: bottomPadding + 16 }]}>
        {state === 'success' && analysis?.verdict && (
          <>
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]} onPress={handleAcceptVerdict}>
              <Text style={styles.primaryBtnText}>{t('continueWithResult')}</Text>
              <Feather name="arrow-right" size={16} color={Colors.white} />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.textBtn, pressed && { opacity: 0.5 }]} onPress={handleSelectManually}>
              <Text style={styles.textBtnText}>{t('chooseOther')}</Text>
            </Pressable>
          </>
        )}
        {(state === 'error' || (state === 'success' && !analysis?.verdict)) && (
          <>
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]} onPress={handleSelectManually}>
              <Feather name="list" size={16} color={Colors.white} />
              <Text style={styles.primaryBtnText}>{t('selectManually')}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.textBtn, pressed && { opacity: 0.5 }]} onPress={analyzeImage}>
              <Feather name="refresh-cw" size={13} color={Colors.textSecondary} />
              <Text style={styles.textBtnText}>{t('retry')}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  body: { flex: 1, paddingHorizontal: 20, gap: 16 },
  photoWrap: { width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.surfaceSecondary },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  scanOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 120, height: 120 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.white },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 },
  statusArea: { gap: 14 },
  stepsCol: { gap: 10, paddingVertical: 4 },
  progressStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { backgroundColor: Colors.blue },
  progressDotDone: { backgroundColor: Colors.allowed },
  progressLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  progressLabelActive: { color: Colors.text, fontFamily: 'Inter_500Medium' },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.blueSoft,
    borderRadius: 8,
    padding: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  resultArea: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  resultHeader: { gap: 4 },
  resultName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  confDot: { width: 6, height: 6, borderRadius: 3 },
  confText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  verdictMini: { gap: 0 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  verdictRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verdictLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text },
  verdictStatus: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  summaryText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 17 },
  warningText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },
  errorArea: { alignItems: 'center', gap: 6, paddingVertical: 20 },
  errorTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  errorText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center', lineHeight: 17, paddingHorizontal: 16 },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, gap: 6, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, paddingVertical: 14, borderRadius: 10 },
  primaryBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  textBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10 },
  textBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
});
