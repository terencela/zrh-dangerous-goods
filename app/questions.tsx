import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useScan } from '@/lib/scan-context';
import { useI18n } from '@/lib/i18n';

export default function QuestionsScreen() {
  const insets = useSafeAreaInsets();
  const { session, setAnswer } = useScan();
  const { t, lang } = useI18n();
  const [step, setStep] = useState(0);
  const progressWidth = useSharedValue(0);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const questions = session.category?.questions || [];
  const currentQ = questions[step];
  const total = questions.length;
  const currentAnswer = currentQ ? (session.answers[currentQ.id] || '') : '';

  useEffect(() => {
    progressWidth.value = withTiming(((step + 1) / total) * 100, { duration: 300 });
  }, [step, total]);

  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` as any }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      router.push('/verdict');
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const handleSelect = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentQ) setAnswer(currentQ.id, value);
  };

  if (!currentQ || !session.category) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.mutedText}>{t('noQuestions')}</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.linkText}>{t('back')}</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.topBar}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={handleBack}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.stepText}>{step + 1} / {total}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)} style={styles.contextHint}>
          <Feather name="help-circle" size={12} color={Colors.blue} />
          <Text style={styles.contextHintText}>{t('questionHint')}</Text>
        </Animated.View>

        <Text style={styles.questionText}>{currentQ.text[lang]}</Text>

        <View style={styles.optionsArea}>
          {currentQ.options?.map((opt) => {
            const isSelected = currentAnswer === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.optionCard, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(opt.value)}
              >
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                  {opt.label[lang]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomPadding + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.nextBtn, !currentAnswer && styles.nextBtnDisabled, pressed && !!currentAnswer && { opacity: 0.85 }]}
          onPress={handleNext}
          disabled={!currentAnswer}
        >
          <Text style={[styles.nextBtnText, !currentAnswer && styles.nextBtnTextDisabled]}>
            {step === total - 1 ? t('showResult') : t('next')}
          </Text>
          <Feather name={step === total - 1 ? 'check' : 'arrow-right'} size={16} color={currentAnswer ? Colors.white : Colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  mutedText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  linkText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textTertiary },
  progressWrap: { paddingHorizontal: 20, marginBottom: 8 },
  progressBg: { height: 2, backgroundColor: Colors.border, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  contextHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.blueSoft,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  contextHintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  questionText: { fontSize: 20, fontFamily: 'Inter_600SemiBold', color: Colors.text, lineHeight: 28, marginBottom: 28, letterSpacing: -0.3 },
  optionsArea: { gap: 8 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  optionSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.accent },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  optionText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text, lineHeight: 18 },
  optionTextActive: { color: Colors.accent },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, paddingVertical: 14, borderRadius: 10 },
  nextBtnDisabled: { backgroundColor: Colors.surfaceSecondary },
  nextBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  nextBtnTextDisabled: { color: Colors.textTertiary },
});
