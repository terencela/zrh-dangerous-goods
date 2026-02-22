import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useScan } from '@/lib/scan-context';
import { useI18n } from '@/lib/i18n';
import { saveScanRecord } from '@/lib/storage';
import type { VerdictStatus, Verdict } from '@/constants/rules';

function getStatusConfig(status: VerdictStatus, t: (k: any) => string) {
  switch (status) {
    case 'allowed': return { color: Colors.allowed, bg: Colors.allowedBg, border: Colors.allowedBorder, icon: 'check-circle' as const, label: t('allowed') };
    case 'conditional': return { color: Colors.conditional, bg: Colors.conditionalBg, border: Colors.conditionalBorder, icon: 'alert-circle' as const, label: t('conditional') };
    case 'not_allowed': return { color: Colors.notAllowed, bg: Colors.notAllowedBg, border: Colors.notAllowedBorder, icon: 'x-circle' as const, label: t('notAllowed') };
  }
}

function VerdictCard({ title, status, text, tip, t, explain, delay }: {
  title: string; status: VerdictStatus; text: string; tip?: string; t: (k: any) => string; explain: string; delay: number;
}) {
  const cfg = getStatusConfig(status, t);
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={[styles.verdictCard, { borderColor: Colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardExplain}>{explain}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <Feather name={cfg.icon} size={12} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      <Text style={styles.verdictText}>{text}</Text>
      {tip && (
        <View style={styles.tipRow}>
          <Feather name="info" size={11} color={Colors.textTertiary} />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function VerdictScreen() {
  const insets = useSafeAreaInsets();
  const { session, setVerdict } = useScan();
  const { t, lang } = useI18n();
  const { fromAi, instant } = useLocalSearchParams<{ fromAi?: string; instant?: string }>();
  const savedRef = useRef(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (fromAi === '1') return;
    if (!session.category) return;

    const verdict = session.category.getVerdict(session.answers, lang);
    setVerdict(verdict);

    if (!savedRef.current) {
      savedRef.current = true;
      const record = {
        id: Crypto.randomUUID(),
        categoryId: session.category.id,
        categoryName: session.category.name[lang],
        answers: session.answers,
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

      if (verdict.handBaggage.status === 'allowed' && verdict.checkedBaggage.status === 'allowed') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (verdict.handBaggage.status === 'not_allowed' || verdict.checkedBaggage.status === 'not_allowed') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  }, [session.category, fromAi]);

  const verdict = session.verdict;
  if (!verdict) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>{t('calculating')}</Text>
      </View>
    );
  }

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.dismissAll();
  };

  const overall: VerdictStatus = verdict.handBaggage.status === 'not_allowed' || verdict.checkedBaggage.status === 'not_allowed'
    ? 'not_allowed'
    : verdict.handBaggage.status === 'conditional' || verdict.checkedBaggage.status === 'conditional'
    ? 'conditional' : 'allowed';
  const overallCfg = getStatusConfig(overall, t);
  const catName = session.category ? session.category.name[lang] : (session.aiAnalysis?.itemName || '');

  const overallExplain = overall === 'allowed' ? t('verdictExplainAllowed')
    : overall === 'conditional' ? t('verdictExplainConditional')
    : t('verdictExplainNotAllowed');

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.topBar}>
        <View style={{ width: 36 }} />
        <Text style={styles.screenTitle}>{t('result')}</Text>
        <Pressable style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.5 }]} onPress={handleDone}>
          <Feather name="x" size={18} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 20 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: overallCfg.bg, borderColor: overallCfg.border }]}>
            <Feather name={overallCfg.icon} size={28} color={overallCfg.color} />
          </View>
          <Text style={styles.itemName}>{catName}</Text>
          <Text style={[styles.overallExplain, { color: overallCfg.color }]}>{overallExplain}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.whatToDoBox}>
          <Feather name="book-open" size={13} color={Colors.blue} />
          <Text style={styles.whatToDoTitle}>{t('whatToDo')}</Text>
        </Animated.View>

        <VerdictCard
          title={t('handBaggage')}
          status={verdict.handBaggage.status}
          text={verdict.handBaggage.text}
          tip={verdict.handBaggage.tip}
          t={t}
          explain={t('handBaggageExplain')}
          delay={200}
        />
        <VerdictCard
          title={t('checkedBaggage')}
          status={verdict.checkedBaggage.status}
          text={verdict.checkedBaggage.text}
          tip={verdict.checkedBaggage.tip}
          t={t}
          explain={t('checkedBaggageExplain')}
          delay={300}
        />

        <Text style={styles.sourceText}>{t('source')}</Text>

        <Pressable style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]} onPress={handleDone}>
          <Feather name="camera" size={16} color={Colors.white} />
          <Text style={styles.doneBtnText}>{t('scanAnother')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  screenTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, gap: 14 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  heroIcon: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.text, textAlign: 'center' },
  overallExplain: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 18,
  },
  whatToDoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.blueSoft,
    borderRadius: 8,
    padding: 10,
  },
  whatToDoTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.blue,
  },
  verdictCard: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitleRow: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardExplain: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, lineHeight: 15 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  verdictText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text, lineHeight: 19 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  tipText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, lineHeight: 16 },
  sourceText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center', lineHeight: 14 },
  doneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, paddingVertical: 14, borderRadius: 10, marginTop: 4 },
  doneBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});
