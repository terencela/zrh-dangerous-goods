import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { getScanHistory, deleteScanRecord, type ScanRecord } from '@/lib/storage';
import { useScan } from '@/lib/scan-context';
import { useI18n } from '@/lib/i18n';
import { ITEM_CATEGORIES } from '@/constants/rules';

function getStatusColor(status: string) {
  if (status === 'allowed') return Colors.allowed;
  if (status === 'conditional') return Colors.conditional;
  return Colors.notAllowed;
}

function getStatusIcon(status: string): keyof typeof Feather.glyphMap {
  if (status === 'allowed') return 'check-circle';
  if (status === 'conditional') return 'alert-circle';
  return 'x-circle';
}

function HowItWorksCard({ t }: { t: (k: any) => string }) {
  const steps = [
    { icon: 'camera' as const, title: t('step1Title'), desc: t('step1Desc'), num: '1' },
    { icon: 'cpu' as const, title: t('step2Title'), desc: t('step2Desc'), num: '2' },
    { icon: 'check-circle' as const, title: t('step3Title'), desc: t('step3Desc'), num: '3' },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.howCard}>
      <View style={styles.howHeader}>
        <Feather name="zap" size={13} color={Colors.blue} />
        <Text style={styles.howTitle}>{t('howItWorks')}</Text>
      </View>
      {steps.map((s, i) => (
        <View key={i} style={styles.howStep}>
          <View style={styles.howStepNum}>
            <Text style={styles.howStepNumText}>{s.num}</Text>
          </View>
          <View style={styles.howStepContent}>
            <Text style={styles.howStepTitle}>{s.title}</Text>
            <Text style={styles.howStepDesc}>{s.desc}</Text>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

function HistoryItem({ item, onDelete, onPress, lang }: { item: ScanRecord; onDelete: () => void; onPress: () => void; lang: 'de' | 'en' }) {
  const cat = ITEM_CATEGORIES.find(c => c.id === item.categoryId);
  const iconName = (cat?.icon || 'package') as keyof typeof Feather.glyphMap;
  const displayName = cat ? cat.name[lang] : item.categoryName;
  const date = new Date(item.timestamp);
  const timeStr = date.toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const hbLabel = lang === 'de' ? 'HG' : 'HB';
  const cbLabel = lang === 'de' ? 'AG' : 'CB';

  return (
    <Pressable
      style={({ pressed }) => [styles.historyItem, pressed && { backgroundColor: Colors.surfaceSecondary }]}
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (Platform.OS === 'web') {
          onDelete();
        } else {
          Alert.alert(
            lang === 'de' ? 'Prüfung löschen' : 'Delete check',
            lang === 'de' ? 'Aus dem Verlauf entfernen?' : 'Remove from history?',
            [
              { text: lang === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
              { text: lang === 'de' ? 'Löschen' : 'Delete', style: 'destructive', onPress: onDelete },
            ]);
        }
      }}
    >
      <View style={styles.historyIconWrap}>
        <Feather name={iconName} size={16} color={Colors.textSecondary} />
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyName} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.historyTime}>{timeStr}</Text>
      </View>
      <View style={styles.statusDots}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{hbLabel}</Text>
          <Feather name={getStatusIcon(item.handBaggageStatus)} size={13} color={getStatusColor(item.handBaggageStatus)} />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{cbLabel}</Text>
          <Feather name={getStatusIcon(item.checkedBaggageStatus)} size={13} color={getStatusColor(item.checkedBaggageStatus)} />
        </View>
      </View>
      <Feather name="chevron-right" size={14} color={Colors.border} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { resetSession } = useScan();
  const { t, lang, setLang } = useI18n();
  const [history, setHistory] = useState<ScanRecord[]>([]);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const loadHistory = useCallback(async () => {
    const data = await getScanHistory();
    setHistory(data);
  }, []);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetSession();
    router.push('/camera');
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteScanRecord(id);
    loadHistory();
  };

  const handleViewRecord = (item: ScanRecord) => {
    router.push({ pathname: '/history-detail', params: { recordId: item.id } });
  };

  const showHowItWorks = history.length === 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('appName')}</Text>
          <Text style={styles.subtitle}>{t('airportName')}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.langToggle, pressed && { opacity: 0.6 }]}
          onPress={() => setLang(lang === 'de' ? 'en' : 'de')}
          hitSlop={8}
        >
          <Text style={styles.langText}>{lang === 'de' ? 'EN' : 'DE'}</Text>
        </Pressable>
      </View>

      <View style={styles.heroSection}>
        <Pressable
          testID="scan-button"
          style={({ pressed }) => [styles.scanButton, pressed && styles.scanButtonPressed]}
          onPress={handleScan}
        >
          <View style={styles.scanRow}>
            <View style={styles.scanIconCircle}>
              <Feather name="camera" size={20} color={Colors.white} />
            </View>
            <View style={styles.scanTextArea}>
              <Text style={styles.scanTitle}>{t('scan')}</Text>
              <Text style={styles.scanDesc}>{t('scanDesc')}</Text>
            </View>
            <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.5)" />
          </View>
        </Pressable>
      </View>

      <View style={styles.infoBar}>
        <Feather name="info" size={11} color={Colors.textTertiary} />
        <Text style={styles.infoText}>{t('infoNote')}</Text>
      </View>

      {showHowItWorks && <HowItWorksCard t={t} />}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('history')}</Text>
        {history.length > 0 && (
          <Text style={styles.countText}>{history.length}</Text>
        )}
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryItem
            item={item}
            lang={lang}
            onDelete={() => handleDeleteRecord(item.id)}
            onPress={() => handleViewRecord(item)}
          />
        )}
        contentContainerStyle={[
          styles.historyList,
          { paddingBottom: bottomPadding + 20 },
          history.length === 0 && styles.emptyContainer,
        ]}
        scrollEnabled={!!history.length}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="clock" size={20} color={Colors.border} />
            <Text style={styles.emptyTitle}>{t('noHistory')}</Text>
            <Text style={styles.emptyText}>{t('noHistoryDesc')}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 19,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    marginTop: 1,
  },
  langToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  langText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scanButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
  },
  scanButtonPressed: {
    opacity: 0.9,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  scanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTextArea: {
    flex: 1,
    gap: 2,
  },
  scanTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  scanDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 16,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    lineHeight: 15,
  },
  howCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.blueSoft,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  howHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  howTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.blue,
  },
  howStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  howStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howStepNumText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
  },
  howStepContent: {
    flex: 1,
    gap: 1,
  },
  howStepTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  howStepDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  historyList: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  historyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  historyTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    marginTop: 1,
  },
  statusDots: {
    gap: 3,
    alignItems: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: Colors.textTertiary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 44,
  },
  emptyState: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});
