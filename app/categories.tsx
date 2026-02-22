import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, SectionList, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ITEM_CATEGORIES, getGroups, type ItemCategory } from '@/constants/rules';
import { useScan } from '@/lib/scan-context';
import { useI18n } from '@/lib/i18n';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { session, setCategory } = useScan();
  const { t, lang } = useI18n();
  const [search, setSearch] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? ITEM_CATEGORIES.filter(c =>
          c.name[lang].toLowerCase().includes(q) ||
          c.group[lang].toLowerCase().includes(q)
        )
      : ITEM_CATEGORIES;

    return getGroups(lang).map(group => ({
      title: group,
      data: filtered.filter(c => c.group[lang] === group),
    })).filter(s => s.data.length > 0);
  }, [search, lang]);

  const handleSelect = (category: ItemCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(category);
    if (category.questions.length === 0) {
      router.push({ pathname: '/verdict', params: { instant: '1' } });
    } else {
      router.push('/questions');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.topBar}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>{t('selectCategory')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {session.photoUri && (
        <View style={styles.photoRow}>
          <Image source={{ uri: session.photoUri }} style={styles.photoThumb} />
          <Text style={styles.photoLabel}>{t('yourPhoto')}</Text>
        </View>
      )}

      <View style={styles.hintBar}>
        <Feather name="help-circle" size={12} color={Colors.blue} />
        <Text style={styles.hintText}>{t('categoryHint')}</Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={14} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search')}
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Feather name="x" size={14} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const iconName = item.icon as keyof typeof Feather.glyphMap;
          const prohibited = item.group[lang] === (lang === 'de' ? 'Verboten' : 'Prohibited');
          return (
            <Pressable
              style={({ pressed }) => [styles.catItem, pressed && { backgroundColor: Colors.surfaceSecondary }]}
              onPress={() => handleSelect(item)}
            >
              <View style={[styles.catIcon, prohibited && { backgroundColor: Colors.notAllowedBg }]}>
                <Feather name={iconName} size={14} color={prohibited ? Colors.notAllowed : Colors.textSecondary} />
              </View>
              <Text style={[styles.catName, prohibited && { color: Colors.notAllowed }]} numberOfLines={2}>{item.name[lang]}</Text>
              {item.questions.length === 0 && !prohibited && (
                <View style={styles.directBadge}>
                  <Text style={styles.directText}>{t('direct')}</Text>
                </View>
              )}
              <Feather name="chevron-right" size={14} color={Colors.border} />
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingBottom: bottomPadding + 20 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="search" size={20} color={Colors.border} />
            <Text style={styles.emptyText}>{t('noResults')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 10, padding: 8, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  photoThumb: { width: 36, height: 36, borderRadius: 6, backgroundColor: Colors.surfaceSecondary },
  photoLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: Colors.blueSoft,
    borderRadius: 8,
    padding: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text, padding: 0 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  catItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 8 },
  catIcon: { width: 30, height: 30, borderRadius: 6, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text, lineHeight: 18 },
  directBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.surfaceSecondary },
  directText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', gap: 6, paddingVertical: 32 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
});
