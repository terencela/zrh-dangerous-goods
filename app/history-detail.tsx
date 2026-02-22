import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { getScanHistory, type ScanRecord } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';
import { ITEM_CATEGORIES } from '@/constants/rules';
import type { VerdictStatus } from '@/constants/rules';

function getStatusConfig(status: VerdictStatus, t: (k: any) => string) {
  switch (status) {
    case 'allowed': return { color: Colors.allowed, bg: Colors.allowedBg, icon: 'check-circle' as const, label: t('allowed') };
    case 'conditional': return { color: Colors.conditional, bg: Colors.conditionalBg, icon: 'alert-circle' as const, label: t('conditional') };
    case 'not_allowed': return { color: Colors.notAllowed, bg: Colors.notAllowedBg, icon: 'x-circle' as const, label: t('notAllowed') };
  }
}

export default function HistoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const { t, lang } = useI18n();
  const [record, setRecord] = useState<ScanRecord | null>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    (async () => {
      const history = await getScanHistory();
      const found = history.find(r => r.id === recordId);
      if (found) setRecord(found);
    })();
  }, [recordId]);

  if (!record) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPadding }]}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  const cat = ITEM_CATEGORIES.find(c => c.id === record.categoryId);
  const iconName = (cat?.icon || 'package') as keyof typeof Feather.glyphMap;
  const displayName = cat ? cat.name[lang] : record.categoryName;
  const date = new Date(record.timestamp);
  const dateStr = date.toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handCfg = getStatusConfig(record.handBaggageStatus, t);
  const checkedCfg = getStatusConfig(record.checkedBaggageStatus, t);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.topBar}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>{t('historyDetail')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.itemInfo}>
          <View style={styles.iconWrap}><Feather name={iconName} size={20} color={Colors.textSecondary} /></View>
          <Text style={styles.itemName}>{displayName}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>

        <View style={[styles.card, { borderColor: Colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('handBaggage')}</Text>
            <View style={[styles.pill, { backgroundColor: handCfg.bg }]}>
              <Feather name={handCfg.icon} size={12} color={handCfg.color} />
              <Text style={[styles.pillText, { color: handCfg.color }]}>{handCfg.label}</Text>
            </View>
          </View>
          <Text style={styles.verdictText}>{record.handBaggageText}</Text>
          {record.handBaggageTip && (
            <View style={styles.tipRow}>
              <Feather name="info" size={11} color={Colors.textTertiary} />
              <Text style={styles.tipText}>{record.handBaggageTip}</Text>
            </View>
          )}
        </View>

        <View style={[styles.card, { borderColor: Colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('checkedBaggage')}</Text>
            <View style={[styles.pill, { backgroundColor: checkedCfg.bg }]}>
              <Feather name={checkedCfg.icon} size={12} color={checkedCfg.color} />
              <Text style={[styles.pillText, { color: checkedCfg.color }]}>{checkedCfg.label}</Text>
            </View>
          </View>
          <Text style={styles.verdictText}>{record.checkedBaggageText}</Text>
          {record.checkedBaggageTip && (
            <View style={styles.tipRow}>
              <Feather name="info" size={11} color={Colors.textTertiary} />
              <Text style={styles.tipText}>{record.checkedBaggageTip}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sourceText}>{t('source')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  content: { paddingHorizontal: 20, gap: 14 },
  itemInfo: { alignItems: 'center', gap: 6, paddingVertical: 20 },
  iconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.text, textAlign: 'center' },
  dateText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  card: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  pillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  verdictText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text, lineHeight: 19 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  tipText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, lineHeight: 16 },
  sourceText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center', lineHeight: 14 },
});
