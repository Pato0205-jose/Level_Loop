import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';
import {
  getExercisesForTopic,
  type Exercise,
  type FillResultExercise,
  type MatchPairsExercise,
  type MemoryMatchExercise,
  type MultipleChoiceExercise,
  type MultiSelectExercise,
  type NumberRainExercise,
  type OrderSequenceExercise,
  type QuickAnswerExercise,
  type SpeedRunExercise,
  type TapBlanksExercise,
  type TrueFalseExercise,
} from '../constants/exercises';
import { LevelUpOverlay } from '../components/LevelUpOverlay';
import { androidTextInputProps } from '../components/GlassPanel';
import { StreakCelebrationOverlay } from '../components/StreakCelebrationOverlay';
import { getNextTopic, type RoadmapNode } from '../constants/roadmaps';
import { feedback } from '../services/feedback';
import type { CompletionDelta } from '../services/progress';

type Props = {
  topicId: string;
  topicTitle: string;
  courseId?: string;
  onBack: () => void;
  /** Va al dashboard / inicio (botón "Volver al inicio"). */
  onGoHome?: () => void;
  /** Carga el siguiente tema del roadmap, si existe. */
  onNextTopic?: (node: RoadmapNode) => void;
  /**
   * Se llama cuando la sesión termina (sin vidas o todos resueltos).
   * Puede devolver el delta de progreso para mostrarlo en pantalla.
   */
  onFinish?: (result: ExerciseResult) => Promise<CompletionDelta | null> | void;
};

export type ExerciseResult = {
  topicId: string;
  correct: number;
  total: number;
  livesLeft: number;
};

type Status = 'idle' | 'correct' | 'wrong';

const STARTING_LIVES = 3;
const ERROR_COLOR = '#ffb4ab';

export function ExerciseScreen({
  topicId,
  topicTitle,
  courseId,
  onBack,
  onGoHome,
  onNextTopic,
  onFinish,
}: Props) {
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const sessionSeed = useRef(`${topicId}-${Date.now()}`).current;
  const exercises = useMemo(() => {
    const all = getExercisesForTopic(topicId);
    return shuffleStable(all, sessionSeed);
  }, [topicId, sessionSeed]);

  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedSet, setSelectedSet] = useState<Set<number>>(new Set());
  const [boolAnswer, setBoolAnswer] = useState<boolean | null>(null);
  const [matchPairs, setMatchPairs] = useState<Record<number, number>>({});
  const [orderArr, setOrderArr] = useState<number[]>([]);
  const [tapTokens, setTapTokens] = useState<number[]>([]);
  const [memoryDone, setMemoryDone] = useState(false);
  const [gameOutcome, setGameOutcome] = useState<'win' | 'lose' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [lives, setLives] = useState(STARTING_LIVES);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [outOfTime, setOutOfTime] = useState(false);
  const [delta, setDelta] = useState<CompletionDelta | null>(null);
  const finishReportedRef = useRef(false);

  const total = exercises.length;
  const current = exercises[index];
  const progressPct = total > 0 ? ((index + (status !== 'idle' ? 1 : 0)) / total) * 100 : 0;

  const reportFinish = useCallback(
    async (result: ExerciseResult) => {
      if (finishReportedRef.current) return;
      finishReportedRef.current = true;
      try {
        const res = await onFinish?.(result);
        if (res) setDelta(res);
      } catch {
        // Swallow: the UI ya muestra el resumen local.
      }
    },
    [onFinish],
  );

  const checkAnswer = useCallback(() => {
    if (!current) return;
    let ok = false;
    switch (current.type) {
      case 'multiple-choice':
        ok = selectedOption === current.correctIndex;
        break;
      case 'fill-result':
      case 'quick-answer':
        ok =
          normalize(inputValue) === normalize(current.answer) &&
          inputValue.trim() !== '';
        break;
      case 'true-false':
        ok = boolAnswer !== null && boolAnswer === current.answer;
        break;
      case 'multi-select': {
        const correct = new Set(current.correctIndices);
        ok =
          selectedSet.size === correct.size &&
          [...selectedSet].every((i) => correct.has(i));
        break;
      }
      case 'match-pairs': {
        ok =
          Object.keys(matchPairs).length === current.left.length &&
          current.left.every((_, i) => matchPairs[i] === i);
        break;
      }
      case 'order-sequence': {
        ok =
          orderArr.length === current.steps.length &&
          orderArr.every((v, i) => v === i);
        break;
      }
      case 'tap-blanks': {
        ok =
          tapTokens.length === current.answer.length &&
          tapTokens.every((tokenIdx, i) => {
            const allTokens = buildTapBank(current);
            return allTokens[tokenIdx] === current.answer[i];
          });
        break;
      }
      case 'memory-match':
        ok = memoryDone;
        break;
      case 'speed-run':
      case 'number-rain':
        ok = gameOutcome === 'win';
        break;
    }
    setStatus(ok ? 'correct' : 'wrong');
    if (ok) {
      setCorrectCount((c) => c + 1);
      feedback('correct');
    } else {
      setLives((l) => Math.max(0, l - 1));
      feedback('wrong');
    }
  }, [
    current,
    selectedOption,
    inputValue,
    boolAnswer,
    selectedSet,
    matchPairs,
    orderArr,
    tapTokens,
    memoryDone,
    gameOutcome,
  ]);

  useEffect(() => {
    if (
      gameOutcome !== null &&
      status === 'idle' &&
      (current?.type === 'speed-run' || current?.type === 'number-rain')
    ) {
      checkAnswer();
    }
  }, [gameOutcome, status, current, checkAnswer]);

  const handleTimeout = useCallback(() => {
    if (status !== 'idle') return;
    setOutOfTime(true);
    setStatus('wrong');
    setLives((l) => Math.max(0, l - 1));
    feedback('timeout');
  }, [status]);

  const advance = useCallback(() => {
    if (lives <= 0) {
      setFinished(true);
      feedback('wrong');
      void reportFinish({ topicId, correct: correctCount, total, livesLeft: 0 });
      return;
    }
    const nextIndex = index + 1;
    if (nextIndex >= total) {
      setFinished(true);
      feedback('lessonComplete');
      void reportFinish({ topicId, correct: correctCount, total, livesLeft: lives });
      return;
    }
    setIndex(nextIndex);
    setSelectedOption(null);
    setSelectedSet(new Set());
    setBoolAnswer(null);
    setMatchPairs({});
    setOrderArr([]);
    setTapTokens([]);
    setMemoryDone(false);
    setGameOutcome(null);
    setInputValue('');
    setStatus('idle');
    setOutOfTime(false);
  }, [index, total, lives, correctCount, reportFinish, topicId]);

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  if (total === 0) {
    return (
      <View style={styles.root}>
        <BackgroundDecor />
        <View style={[styles.center, { paddingTop: insets.top + 64 }]}>
          <Text style={styles.emptyTitle}>Aún no hay ejercicios</Text>
          <Text style={styles.emptySubtitle}>
            Este tema todavía no tiene retos disponibles.
          </Text>
          <PrimaryButton label="Volver" icon="arrow-back" onPress={onBack} />
        </View>
      </View>
    );
  }

  if (finished) {
    const nextTopic = getNextTopic(courseId, topicId);
    return (
      <CompletionView
        topicTitle={topicTitle}
        correct={correctCount}
        total={total}
        livesLeft={lives}
        delta={delta}
        nextTopic={nextTopic}
        onGoHome={onGoHome ?? onBack}
        onNextTopic={onNextTopic}
      />
    );
  }

  const canVerify = (() => {
    switch (current.type) {
      case 'multiple-choice':
        return selectedOption !== null;
      case 'fill-result':
      case 'quick-answer':
        return inputValue.trim() !== '';
      case 'true-false':
        return boolAnswer !== null;
      case 'multi-select':
        return selectedSet.size > 0;
      case 'match-pairs':
        return Object.keys(matchPairs).length === current.left.length;
      case 'order-sequence':
        return orderArr.length === current.steps.length;
      case 'tap-blanks':
        return tapTokens.length === current.answer.length;
      case 'memory-match':
        return memoryDone;
      case 'speed-run':
      case 'number-rain':
        return gameOutcome !== null;
      default:
        return false;
    }
  })();

  return (
    <View style={styles.root}>
      <BackgroundDecor />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 110,
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ExerciseTypeBadge type={current.type} trick={'trick' in current && current.trick} />

        {current.type === 'multiple-choice' && (
          <MultipleChoiceView
            exercise={current}
            selectedOption={selectedOption}
            status={status}
            onSelect={(i) => {
              feedback('select');
              setSelectedOption(i);
            }}
          />
        )}
        {current.type === 'fill-result' && (
          <FillResultView
            exercise={current}
            value={inputValue}
            status={status}
            onChange={setInputValue}
          />
        )}
        {current.type === 'quick-answer' && (
          <QuickAnswerView
            key={current.id}
            exercise={current}
            value={inputValue}
            status={status}
            onChange={setInputValue}
            onTimeout={handleTimeout}
          />
        )}
        {current.type === 'true-false' && (
          <TrueFalseView
            exercise={current}
            value={boolAnswer}
            status={status}
            onSelect={(v) => {
              feedback('select');
              setBoolAnswer(v);
            }}
          />
        )}
        {current.type === 'multi-select' && (
          <MultiSelectView
            exercise={current}
            selected={selectedSet}
            status={status}
            onToggle={(i) => {
              feedback('select');
              const next = new Set(selectedSet);
              if (next.has(i)) next.delete(i);
              else next.add(i);
              setSelectedSet(next);
            }}
          />
        )}
        {current.type === 'match-pairs' && (
          <MatchPairsView
            key={current.id}
            exercise={current}
            pairs={matchPairs}
            status={status}
            onChange={(p) => {
              feedback('select');
              setMatchPairs(p);
            }}
          />
        )}
        {current.type === 'order-sequence' && (
          <OrderSequenceView
            key={current.id}
            exercise={current}
            order={orderArr}
            status={status}
            onChange={(o) => {
              feedback('select');
              setOrderArr(o);
            }}
          />
        )}
        {current.type === 'tap-blanks' && (
          <TapBlanksView
            key={current.id}
            exercise={current}
            tokens={tapTokens}
            status={status}
            onChange={(t) => {
              feedback('select');
              setTapTokens(t);
            }}
          />
        )}
        {current.type === 'memory-match' && (
          <MemoryMatchView
            key={current.id}
            exercise={current}
            status={status}
            completed={memoryDone}
            onComplete={() => {
              setMemoryDone(true);
              feedback('correct');
            }}
          />
        )}
        {current.type === 'speed-run' && (
          <SpeedRunView
            key={current.id}
            exercise={current}
            status={status}
            outcome={gameOutcome}
            onFinish={(win) => {
              setGameOutcome(win ? 'win' : 'lose');
              feedback(win ? 'correct' : 'wrong');
            }}
          />
        )}
        {current.type === 'number-rain' && (
          <NumberRainView
            key={current.id}
            exercise={current}
            status={status}
            outcome={gameOutcome}
            onFinish={(win) => {
              setGameOutcome(win ? 'win' : 'lose');
              feedback(win ? 'correct' : 'wrong');
            }}
          />
        )}
      </ScrollView>

      <ExerciseHeader
        topicTitle={topicTitle}
        index={index}
        total={total}
        lives={lives}
        progressPct={progressPct}
        onBack={onBack}
      />

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
        pointerEvents="box-none"
      >
        {status === 'idle' ? (
          <PrimaryButton
            label="Verificar"
            icon="check"
            disabled={!canVerify}
            onPress={checkAnswer}
          />
        ) : (
          <FeedbackPanel
            status={status}
            outOfTime={outOfTime}
            correctText={getCorrectText(current)}
            onContinue={advance}
            lastLife={status === 'wrong' && lives === 0}
          />
        )}
      </View>
    </View>
  );
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[,]/g, '.')
    .replace(/[¿?¡!]/g, '');
}

function getCorrectText(ex: Exercise): string {
  switch (ex.type) {
    case 'multiple-choice':
      return ex.options[ex.correctIndex];
    case 'fill-result':
    case 'quick-answer':
      return ex.answer;
    case 'true-false':
      return ex.answer ? 'Verdadero' : 'Falso';
    case 'multi-select':
      return ex.correctIndices.map((i) => ex.options[i]).join(', ');
    case 'match-pairs':
      return ex.left.map((l, i) => `${l} → ${ex.right[i]}`).join('  ·  ');
    case 'order-sequence':
      return ex.steps.join(' → ');
    case 'tap-blanks':
      return ex.answer.join(' · ');
    case 'memory-match':
      return ex.pairs.map((p) => `${p.a} ↔ ${p.b}`).join('  ·  ');
    case 'speed-run':
      return `Necesitabas al menos ${ex.goal} aciertos en ${ex.seconds}s.`;
    case 'number-rain':
      return ex.criterion;
  }
}

/** Devuelve el banco de fichas mezclado (correctas + decoys) en orden estable. */
function buildTapBank(ex: TapBlanksExercise): string[] {
  return [...ex.answer, ...(ex.decoys ?? [])];
}

function ExerciseHeader({
  topicTitle,
  index,
  total,
  lives,
  progressPct,
  onBack,
}: {
  topicTitle: string;
  index: number;
  total: number;
  lives: number;
  progressPct: number;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <BlurView
      intensity={50}
      tint="dark"
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          height: insets.top + 110,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={({ pressed }) => [pressed && styles.pressedSoft]}
        >
          <MaterialIcons name="close" size={26} color={colors.outline} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerCounter}>
            {Math.min(index + 1, total)} / {total}
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {topicTitle}
          </Text>
        </View>
        <View style={styles.heartsRow}>
          {Array.from({ length: STARTING_LIVES }).map((_, i) => (
            <MaterialIcons
              key={i}
              name={i < lives ? 'favorite' : 'favorite-border'}
              size={20}
              color={i < lives ? ERROR_COLOR : colors.outlineVariant}
            />
          ))}
        </View>
      </View>
      <View style={styles.headerProgressTrack}>
        <LinearGradient
          colors={[colors.tertiaryBright, '#a6c8ff']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.headerProgressFill,
            { width: `${Math.min(100, progressPct)}%` },
          ]}
        />
      </View>
    </BlurView>
  );
}

function ExerciseTypeBadge({
  type,
  trick,
}: {
  type: Exercise['type'];
  trick?: boolean;
}) {
  const meta: Record<Exercise['type'], { label: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
    'multiple-choice': { label: 'Opción múltiple', icon: 'list-alt' },
    'fill-result': { label: 'Completar resultado', icon: 'edit' },
    'quick-answer': { label: 'Respuesta rápida', icon: 'bolt' },
    'true-false': { label: 'Verdadero o falso', icon: 'rule' },
    'multi-select': { label: 'Selección múltiple', icon: 'checklist' },
    'match-pairs': { label: 'Empareja pares', icon: 'shuffle' },
    'order-sequence': { label: 'Ordena los pasos', icon: 'reorder' },
    'tap-blanks': { label: 'Completa los huecos', icon: 'touch-app' },
    'memory-match': { label: '¡Minijuego! Memoria', icon: 'extension' },
    'speed-run': { label: '¡Minijuego! Speed Run', icon: 'speed' },
    'number-rain': { label: '¡Minijuego! Lluvia', icon: 'grain' },
  };
  const { label, icon } = meta[type];
  return (
    <View style={styles.typeBadgeRow}>
      <View style={styles.typeBadge}>
        <MaterialIcons name={icon} size={14} color={colors.tertiaryBright} />
        <Text style={styles.typeBadgeText}>{label}</Text>
      </View>
      {trick && (
        <View style={styles.trickBadge}>
          <MaterialIcons name="warning" size={12} color="#ffb86b" />
          <Text style={styles.trickBadgeText}>¡Pregunta trampa!</Text>
        </View>
      )}
    </View>
  );
}

function MultipleChoiceView({
  exercise,
  selectedOption,
  status,
  onSelect,
}: {
  exercise: MultipleChoiceExercise;
  selectedOption: number | null;
  status: Status;
  onSelect: (i: number) => void;
}) {
  const locked = status !== 'idle';
  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      {exercise.expression && (
        <View style={styles.expressionWrap}>
          <Text style={styles.expressionText}>{exercise.expression}</Text>
        </View>
      )}
      <View style={styles.optionsList}>
        {exercise.options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isCorrect = i === exercise.correctIndex;
          const showAsCorrect = locked && isCorrect;
          const showAsWrong = locked && isSelected && !isCorrect;
          return (
            <Pressable
              key={i}
              disabled={locked}
              onPress={() => onSelect(i)}
              style={({ pressed }) => [
                styles.option,
                isSelected && !locked && styles.optionSelected,
                showAsCorrect && styles.optionCorrect,
                showAsWrong && styles.optionWrong,
                pressed && !locked && styles.pressedSoft,
              ]}
            >
              <View
                style={[
                  styles.optionBullet,
                  isSelected && !locked && styles.optionBulletSelected,
                  showAsCorrect && styles.optionBulletCorrect,
                  showAsWrong && styles.optionBulletWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionBulletText,
                    (isSelected && !locked) || showAsCorrect || showAsWrong
                      ? styles.optionBulletTextActive
                      : null,
                  ]}
                >
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  (isSelected && !locked) && styles.optionTextSelected,
                  showAsCorrect && styles.optionTextCorrect,
                  showAsWrong && styles.optionTextWrong,
                ]}
              >
                {opt}
              </Text>
              {showAsCorrect && (
                <MaterialIcons
                  name="check-circle"
                  size={22}
                  color={colors.tertiaryBright}
                />
              )}
              {showAsWrong && (
                <MaterialIcons name="cancel" size={22} color={ERROR_COLOR} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FillResultView({
  exercise,
  value,
  status,
  onChange,
}: {
  exercise: FillResultExercise;
  value: string;
  status: Status;
  onChange: (v: string) => void;
}) {
  const locked = status !== 'idle';
  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <View style={styles.fillCard}>
        <Text style={styles.fillExpression}>{exercise.expression}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={!locked}
          keyboardType={exercise.numeric ? 'numeric' : 'default'}
          placeholder="?"
          placeholderTextColor={`${colors.outline}88`}
          style={[
            styles.fillInput,
            status === 'correct' && styles.fillInputCorrect,
            status === 'wrong' && styles.fillInputWrong,
          ]}
          autoFocus={!locked}
          returnKeyType="done"
          {...androidTextInputProps}
        />
      </View>
    </View>
  );
}

function QuickAnswerView({
  exercise,
  value,
  status,
  onChange,
  onTimeout,
}: {
  exercise: QuickAnswerExercise;
  value: string;
  status: Status;
  onChange: (v: string) => void;
  onTimeout: () => void;
}) {
  const locked = status !== 'idle';
  const [remaining, setRemaining] = useState(exercise.seconds);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
    setRemaining(exercise.seconds);
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const left = Math.max(0, exercise.seconds - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onTimeout();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [exercise.id, exercise.seconds, onTimeout]);

  useEffect(() => {
    if (locked) {
      startedAt.current = Date.now() - exercise.seconds * 1000;
    }
  }, [locked, exercise.seconds]);

  const pct = (remaining / exercise.seconds) * 100;
  const lowTime = remaining < exercise.seconds * 0.33;

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <View style={styles.timerWrap}>
        <View style={styles.timerHeader}>
          <MaterialIcons
            name="timer"
            size={16}
            color={lowTime ? ERROR_COLOR : colors.tertiaryBright}
          />
          <Text
            style={[styles.timerText, lowTime && { color: ERROR_COLOR }]}
          >
            {Math.ceil(remaining)}s
          </Text>
        </View>
        <View style={styles.timerTrack}>
          <View
            style={[
              styles.timerFill,
              {
                width: `${pct}%`,
                backgroundColor: lowTime
                  ? ERROR_COLOR
                  : colors.tertiaryBright,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.fillCard}>
        <Text style={styles.fillExpression}>{exercise.expression}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={!locked}
          keyboardType={exercise.numeric ? 'numeric' : 'default'}
          placeholder="?"
          placeholderTextColor={`${colors.outline}88`}
          style={[
            styles.fillInput,
            status === 'correct' && styles.fillInputCorrect,
            status === 'wrong' && styles.fillInputWrong,
          ]}
          autoFocus={!locked}
          returnKeyType="done"
          {...androidTextInputProps}
        />
      </View>
    </View>
  );
}

function TrueFalseView({
  exercise,
  value,
  status,
  onSelect,
}: {
  exercise: TrueFalseExercise;
  value: boolean | null;
  status: Status;
  onSelect: (v: boolean) => void;
}) {
  const locked = status !== 'idle';
  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <View style={styles.tfStatementWrap}>
        <Text style={styles.tfStatementText}>{exercise.statement}</Text>
      </View>
      <View style={styles.tfButtonsRow}>
        {[
          { val: true, label: 'Verdadero', icon: 'check-circle' as const },
          { val: false, label: 'Falso', icon: 'cancel' as const },
        ].map((opt) => {
          const isSelected = value === opt.val;
          const isCorrect = opt.val === exercise.answer;
          const showAsCorrect = locked && isCorrect;
          const showAsWrong = locked && isSelected && !isCorrect;
          return (
            <Pressable
              key={opt.label}
              disabled={locked}
              onPress={() => onSelect(opt.val)}
              style={({ pressed }) => [
                styles.tfButton,
                isSelected && !locked && styles.tfButtonSelected,
                showAsCorrect && styles.tfButtonCorrect,
                showAsWrong && styles.tfButtonWrong,
                pressed && !locked && styles.pressedSoft,
              ]}
            >
              <MaterialIcons
                name={opt.icon}
                size={28}
                color={
                  showAsCorrect
                    ? colors.tertiaryBright
                    : showAsWrong
                      ? ERROR_COLOR
                      : isSelected
                        ? colors.tertiaryBright
                        : colors.outline
                }
              />
              <Text
                style={[
                  styles.tfButtonText,
                  (isSelected || showAsCorrect || showAsWrong) && { color: colors.onSurface },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {locked && status === 'wrong' && exercise.explanation && (
        <View style={styles.explanationWrap}>
          <MaterialIcons name="lightbulb" size={16} color="#ffb86b" />
          <Text style={styles.explanationText}>{exercise.explanation}</Text>
        </View>
      )}
    </View>
  );
}

function MultiSelectView({
  exercise,
  selected,
  status,
  onToggle,
}: {
  exercise: MultiSelectExercise;
  selected: Set<number>;
  status: Status;
  onToggle: (i: number) => void;
}) {
  const locked = status !== 'idle';
  const correctSet = useMemo(() => new Set(exercise.correctIndices), [exercise]);
  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      {exercise.expression && (
        <View style={styles.expressionWrap}>
          <Text style={styles.expressionText}>{exercise.expression}</Text>
        </View>
      )}
      <Text style={styles.helperText}>Puedes marcar varias respuestas.</Text>
      <View style={styles.optionsList}>
        {exercise.options.map((opt, i) => {
          const isSelected = selected.has(i);
          const isCorrect = correctSet.has(i);
          const showAsCorrect = locked && isCorrect;
          const showAsWrong = locked && isSelected && !isCorrect;
          const missed = locked && !isSelected && isCorrect;
          return (
            <Pressable
              key={i}
              disabled={locked}
              onPress={() => onToggle(i)}
              style={({ pressed }) => [
                styles.option,
                isSelected && !locked && styles.optionSelected,
                showAsCorrect && styles.optionCorrect,
                showAsWrong && styles.optionWrong,
                missed && styles.optionMissed,
                pressed && !locked && styles.pressedSoft,
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxChecked,
                  showAsCorrect && styles.checkboxCorrect,
                  showAsWrong && styles.checkboxWrong,
                ]}
              >
                {(isSelected || showAsCorrect) && (
                  <MaterialIcons name="check" size={16} color="#001f28" />
                )}
                {showAsWrong && (
                  <MaterialIcons name="close" size={16} color="#3b0008" />
                )}
              </View>
              <Text
                style={[
                  styles.optionText,
                  isSelected && !locked && styles.optionTextSelected,
                  showAsCorrect && styles.optionTextCorrect,
                  showAsWrong && styles.optionTextWrong,
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MatchPairsView({
  exercise,
  pairs,
  status,
  onChange,
}: {
  exercise: MatchPairsExercise;
  pairs: Record<number, number>;
  status: Status;
  onChange: (p: Record<number, number>) => void;
}) {
  const locked = status !== 'idle';
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const rightOrder = useMemo(
    () => shuffleStable(exercise.right.map((_, i) => i), exercise.id),
    [exercise],
  );

  const usedRights = useMemo(
    () => new Set(Object.values(pairs)),
    [pairs],
  );

  const matchedLeft = (li: number) => pairs[li] !== undefined;

  const handleLeftPress = (li: number) => {
    if (locked) return;
    if (matchedLeft(li)) {
      const next = { ...pairs };
      delete next[li];
      onChange(next);
      setActiveLeft(null);
      return;
    }
    setActiveLeft(li);
  };

  const handleRightPress = (ri: number) => {
    if (locked) return;
    if (usedRights.has(ri)) {
      const found = Object.entries(pairs).find(([, v]) => v === ri);
      if (found) {
        const next = { ...pairs };
        delete next[Number(found[0])];
        onChange(next);
      }
      return;
    }
    if (activeLeft === null) return;
    onChange({ ...pairs, [activeLeft]: ri });
    setActiveLeft(null);
  };

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <Text style={styles.helperText}>Toca un elemento de la izquierda y luego su par a la derecha.</Text>
      <View style={styles.matchRow}>
        <View style={styles.matchCol}>
          {exercise.left.map((label, i) => {
            const matched = matchedLeft(i);
            const correct = locked && pairs[i] === i;
            const wrong = locked && matched && pairs[i] !== i;
            return (
              <Pressable
                key={`l-${i}`}
                disabled={locked}
                onPress={() => handleLeftPress(i)}
                style={({ pressed }) => [
                  styles.matchChip,
                  matched && styles.matchChipMatched,
                  activeLeft === i && styles.matchChipActive,
                  correct && styles.matchChipCorrect,
                  wrong && styles.matchChipWrong,
                  pressed && !locked && styles.pressedSoft,
                ]}
              >
                <Text style={styles.matchChipText}>{label}</Text>
                {matched && (
                  <Text style={styles.matchChipBadge}>
                    {indexLabel(Object.values(pairs).indexOf(pairs[i]) + 1, rightOrder, pairs[i])}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.matchCol}>
          {rightOrder.map((ri, displayIdx) => {
            const used = usedRights.has(ri);
            return (
              <Pressable
                key={`r-${ri}`}
                disabled={locked}
                onPress={() => handleRightPress(ri)}
                style={({ pressed }) => [
                  styles.matchChip,
                  used && styles.matchChipUsed,
                  pressed && !locked && styles.pressedSoft,
                ]}
              >
                <Text style={styles.matchChipBadgeLeft}>{displayIdx + 1}.</Text>
                <Text style={styles.matchChipText}>{exercise.right[ri]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function OrderSequenceView({
  exercise,
  order,
  status,
  onChange,
}: {
  exercise: OrderSequenceExercise;
  order: number[];
  status: Status;
  onChange: (o: number[]) => void;
}) {
  const locked = status !== 'idle';
  const shuffled = useMemo(
    () => shuffleStable(exercise.steps.map((_, i) => i), exercise.id),
    [exercise],
  );
  const remaining = shuffled.filter((i) => !order.includes(i));

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <Text style={styles.helperText}>Toca cada paso en el orden correcto.</Text>

      <View style={styles.orderSlotsWrap}>
        {exercise.steps.map((_, slotIdx) => {
          const pickedIdx = order[slotIdx];
          const filled = pickedIdx !== undefined;
          const correct = locked && filled && pickedIdx === slotIdx;
          const wrong = locked && filled && pickedIdx !== slotIdx;
          return (
            <Pressable
              key={`slot-${slotIdx}`}
              disabled={locked || !filled}
              onPress={() => {
                if (!filled) return;
                onChange(order.slice(0, -1));
              }}
              style={({ pressed }) => [
                styles.orderSlot,
                filled && styles.orderSlotFilled,
                correct && styles.orderSlotCorrect,
                wrong && styles.orderSlotWrong,
                pressed && filled && !locked && styles.pressedSoft,
              ]}
            >
              <View style={styles.orderSlotIndex}>
                <Text style={styles.orderSlotIndexText}>{slotIdx + 1}</Text>
              </View>
              <Text style={[styles.orderSlotText, !filled && styles.orderSlotPlaceholder]}>
                {filled ? exercise.steps[pickedIdx] : 'Toca un paso abajo'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.orderBank}>
        {remaining.map((i) => (
          <Pressable
            key={`bank-${i}`}
            disabled={locked}
            onPress={() => onChange([...order, i])}
            style={({ pressed }) => [
              styles.orderBankChip,
              pressed && !locked && styles.pressedSoft,
            ]}
          >
            <Text style={styles.orderBankChipText}>{exercise.steps[i]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TapBlanksView({
  exercise,
  tokens,
  status,
  onChange,
}: {
  exercise: TapBlanksExercise;
  tokens: number[];
  status: Status;
  onChange: (t: number[]) => void;
}) {
  const locked = status !== 'idle';
  const allTokens = useMemo(() => buildTapBank(exercise), [exercise]);
  const shuffled = useMemo(
    () => shuffleStable(allTokens.map((_, i) => i), exercise.id),
    [allTokens, exercise.id],
  );
  const remaining = shuffled.filter((i) => !tokens.includes(i));

  const parts = exercise.template.split('___');
  let usedSlots = 0;
  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <View style={styles.tapTemplate}>
        {parts.flatMap((part, idx) => {
          const nodes: ReactNode[] = [];
          if (part) {
            nodes.push(
              <Text key={`txt-${idx}`} style={styles.tapTemplateText}>
                {part}
              </Text>,
            );
          }
          if (idx < parts.length - 1) {
            const slotIdx = usedSlots++;
            const tokenIdx = tokens[slotIdx];
            const filled = tokenIdx !== undefined;
            const correct = locked && filled && allTokens[tokenIdx] === exercise.answer[slotIdx];
            const wrong = locked && filled && allTokens[tokenIdx] !== exercise.answer[slotIdx];
            nodes.push(
              <Pressable
                key={`slot-${slotIdx}`}
                disabled={locked || !filled}
                onPress={() => {
                  if (!filled) return;
                  const next = [...tokens];
                  next.splice(slotIdx, 1);
                  onChange(next);
                }}
                style={({ pressed }) => [
                  styles.tapSlot,
                  filled && styles.tapSlotFilled,
                  correct && styles.tapSlotCorrect,
                  wrong && styles.tapSlotWrong,
                  pressed && filled && !locked && styles.pressedSoft,
                ]}
              >
                <Text style={styles.tapSlotText}>
                  {filled ? allTokens[tokenIdx] : '____'}
                </Text>
              </Pressable>,
            );
          }
          return nodes;
        })}
      </View>
      <View style={styles.tapBank}>
        {remaining.map((i) => (
          <Pressable
            key={`bank-${i}`}
            disabled={locked || tokens.length >= exercise.answer.length}
            onPress={() => onChange([...tokens, i])}
            style={({ pressed }) => [
              styles.tapBankChip,
              tokens.length >= exercise.answer.length && styles.tapBankChipDisabled,
              pressed && !locked && styles.pressedSoft,
            ]}
          >
            <Text style={styles.tapBankChipText}>{allTokens[i]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type MemoryCard = {
  /** Índice estable de la carta dentro del ejercicio. */
  cardId: number;
  /** Id del par (0..n-1) — dos cartas comparten el mismo. */
  pairId: number;
  /** Texto a mostrar en la cara revelada. */
  label: string;
  /** A o B del par (sólo informativo). */
  side: 'a' | 'b';
};

function MemoryMatchView({
  exercise,
  status,
  completed,
  onComplete,
}: {
  exercise: MemoryMatchExercise;
  status: Status;
  completed: boolean;
  onComplete: () => void;
}) {
  const locked = status !== 'idle';
  const cards = useMemo<MemoryCard[]>(() => {
    const raw: MemoryCard[] = [];
    exercise.pairs.forEach((p, i) => {
      raw.push({ cardId: i * 2, pairId: i, label: p.a, side: 'a' });
      raw.push({ cardId: i * 2 + 1, pairId: i, label: p.b, side: 'b' });
    });
    return shuffleStable(raw, exercise.id);
  }, [exercise]);

  const [revealed, setRevealed] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const flipBusyRef = useRef(false);

  const totalPairs = exercise.pairs.length;
  const progress = matched.size / 2;

  const handleTap = (cardId: number) => {
    if (locked || completed) return;
    if (flipBusyRef.current) return;
    if (matched.has(cardId)) return;
    if (revealed.includes(cardId)) return;

    const nextRevealed = [...revealed, cardId];
    feedback('select');
    setRevealed(nextRevealed);

    if (nextRevealed.length === 2) {
      const [aId, bId] = nextRevealed;
      const a = cards.find((c) => c.cardId === aId);
      const b = cards.find((c) => c.cardId === bId);
      if (a && b && a.pairId === b.pairId) {
        // Match!
        const nextMatched = new Set(matched);
        nextMatched.add(aId);
        nextMatched.add(bId);
        setMatched(nextMatched);
        setRevealed([]);
        if (nextMatched.size === cards.length) {
          setTimeout(() => onComplete(), 350);
        }
      } else {
        // Miss
        flipBusyRef.current = true;
        setMistakes((m) => m + 1);
        setShakeId(bId);
        feedback('wrong');
        setTimeout(() => {
          setRevealed([]);
          setShakeId(null);
          flipBusyRef.current = false;
        }, 850);
      }
    }
  };

  const columns = totalPairs <= 4 ? 2 : totalPairs <= 6 ? 3 : 4;
  const cardWidth = `${100 / columns - 2}%`;

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      {exercise.subtitle && (
        <Text style={styles.helperText}>{exercise.subtitle}</Text>
      )}

      <View style={styles.memoryStatsRow}>
        <View style={styles.memoryStat}>
          <MaterialIcons name="favorite" size={14} color={colors.tertiaryBright} />
          <Text style={styles.memoryStatText}>
            {progress} / {totalPairs} pares
          </Text>
        </View>
        <View style={styles.memoryStat}>
          <MaterialIcons name="close" size={14} color={ERROR_COLOR} />
          <Text style={styles.memoryStatText}>{mistakes} fallos</Text>
        </View>
      </View>

      <View style={styles.memoryGrid}>
        {cards.map((card) => (
          <MemoryCardView
            key={card.cardId}
            card={card}
            width={cardWidth}
            isRevealed={revealed.includes(card.cardId)}
            isMatched={matched.has(card.cardId)}
            shake={shakeId === card.cardId}
            disabled={locked || completed}
            onPress={() => handleTap(card.cardId)}
          />
        ))}
      </View>

      {completed && !locked && (
        <View style={styles.memoryWinBanner}>
          <MaterialIcons name="celebration" size={20} color={colors.tertiaryBright} />
          <Text style={styles.memoryWinText}>
            ¡Completaste el minijuego! Toca verificar para continuar.
          </Text>
        </View>
      )}
    </View>
  );
}

function MemoryCardView({
  card,
  width,
  isRevealed,
  isMatched,
  shake,
  disabled,
  onPress,
}: {
  card: MemoryCard;
  width: number | string;
  isRevealed: boolean;
  isMatched: boolean;
  shake: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const visible = isRevealed || isMatched;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: visible ? 1 : 0.92,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scale, visible]);

  useEffect(() => {
    if (!shake) return;
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shake, shakeAnim]);

  return (
    <Animated.View
      style={[
        styles.memoryCardWrap,
        {
          width: width as never,
          transform: [{ scale }, { translateX: shakeAnim }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || visible}
        style={({ pressed }) => [
          styles.memoryCard,
          visible && styles.memoryCardRevealed,
          isMatched && styles.memoryCardMatched,
          pressed && !visible && styles.pressedSoft,
        ]}
      >
        {visible ? (
          <Text
            style={[
              styles.memoryCardText,
              isMatched && styles.memoryCardTextMatched,
            ]}
            numberOfLines={2}
          >
            {card.label}
          </Text>
        ) : (
          <View style={styles.memoryCardBack}>
            <MaterialIcons
              name="question-mark"
              size={28}
              color={colors.primaryAccent}
            />
          </View>
        )}
        {isMatched && (
          <View style={styles.memoryCardCheck}>
            <MaterialIcons name="check" size={14} color="#001f28" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function SpeedRunView({
  exercise,
  status,
  outcome,
  onFinish,
}: {
  exercise: SpeedRunExercise;
  status: Status;
  outcome: 'win' | 'lose' | null;
  onFinish: (success: boolean) => void;
}) {
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(exercise.seconds);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [shake, setShake] = useState<'ok' | 'no' | null>(null);
  const finishedRef = useRef(false);
  const seq = useMemo(
    () => shuffleStable(exercise.challenges, `${exercise.id}-sr`),
    [exercise],
  );

  useEffect(() => {
    if (!started || outcome !== null) return;
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [started, remaining, outcome]);

  useEffect(() => {
    if (!started || finishedRef.current) return;
    if (remaining <= 0) {
      finishedRef.current = true;
      const win = score >= exercise.goal;
      feedback(win ? 'streak' : 'timeout');
      onFinish(win);
    }
  }, [remaining, started, score, exercise.goal, onFinish]);

  const submit = useCallback(() => {
    if (outcome !== null) return;
    const challenge = seq[idx % seq.length];
    const ok = normalize(input) === normalize(challenge.answer) && input.trim() !== '';
    if (ok) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      feedback('correct');
      setShake('ok');
    } else {
      setMisses((m) => m + 1);
      setStreak(0);
      feedback('wrong');
      setShake('no');
    }
    setIdx((i) => i + 1);
    setInput('');
    setTimeout(() => setShake(null), 250);
  }, [input, idx, seq, outcome]);

  const skip = useCallback(() => {
    if (outcome !== null) return;
    setMisses((m) => m + 1);
    setStreak(0);
    setIdx((i) => i + 1);
    setInput('');
    feedback('select');
  }, [outcome]);

  const start = useCallback(() => {
    finishedRef.current = false;
    setStarted(true);
    setRemaining(exercise.seconds);
    setScore(0);
    setMisses(0);
    setIdx(0);
    setInput('');
    setStreak(0);
    feedback('select');
  }, [exercise.seconds]);

  const locked = status !== 'idle' || outcome !== null;
  const pct = (remaining / exercise.seconds) * 100;
  const challenge = seq[idx % seq.length];

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      {exercise.subtitle && (
        <Text style={styles.memorySubtitle}>{exercise.subtitle}</Text>
      )}

      <View style={styles.srStatsRow}>
        <View style={styles.srStatPill}>
          <MaterialIcons name="bolt" size={16} color={colors.tertiaryBright} />
          <Text style={styles.srStatText}>{score} / {exercise.goal}</Text>
        </View>
        <View style={styles.srStatPill}>
          <MaterialIcons name="timer" size={16} color={colors.primaryAccent} />
          <Text style={styles.srStatText}>{remaining}s</Text>
        </View>
        <View style={styles.srStatPill}>
          <MaterialIcons name="local-fire-department" size={16} color="#ffb86b" />
          <Text style={styles.srStatText}>x{streak}</Text>
        </View>
      </View>

      <View style={styles.timerTrack}>
        <LinearGradient
          colors={[colors.tertiaryBright, colors.primaryAccent]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.timerFill, { width: `${Math.max(0, pct)}%` }]}
        />
      </View>

      {!started ? (
        <Pressable
          onPress={start}
          style={({ pressed }) => [
            styles.srStartBtn,
            pressed && styles.pressedSoft,
          ]}
        >
          <MaterialIcons name="play-arrow" size={28} color="#001f28" />
          <Text style={styles.srStartBtnText}>
            ¡Comenzar! ({exercise.seconds}s)
          </Text>
        </Pressable>
      ) : outcome !== null ? (
        <View
          style={[
            styles.srResultCard,
            outcome === 'win' ? styles.srResultWin : styles.srResultLose,
          ]}
        >
          <MaterialIcons
            name={outcome === 'win' ? 'emoji-events' : 'event-busy'}
            size={36}
            color={outcome === 'win' ? colors.tertiaryBright : ERROR_COLOR}
          />
          <Text style={styles.srResultTitle}>
            {outcome === 'win' ? '¡Lo lograste!' : 'Casi…'}
          </Text>
          <Text style={styles.srResultBody}>
            Aciertos: {score} · Fallos: {misses}
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.srExpressionCard,
              shake === 'ok' && styles.srExpressionOk,
              shake === 'no' && styles.srExpressionNo,
            ]}
          >
            <Text style={styles.srExpressionText}>{challenge.expression}</Text>
            <TextInput
              autoFocus
              value={input}
              onChangeText={setInput}
              onSubmitEditing={submit}
              editable={!locked}
              keyboardType="numbers-and-punctuation"
              style={styles.fillInput}
              placeholder="?"
              placeholderTextColor={colors.outline}
              returnKeyType="done"
              {...androidTextInputProps}
            />
          </View>
          <View style={styles.srActionsRow}>
            <Pressable
              onPress={skip}
              style={({ pressed }) => [
                styles.srSkipBtn,
                pressed && styles.pressedSoft,
              ]}
            >
              <MaterialIcons name="skip-next" size={20} color={colors.outline} />
              <Text style={styles.srSkipBtnText}>Saltar</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              style={({ pressed }) => [
                styles.srSubmitBtn,
                pressed && styles.pressedSoft,
              ]}
            >
              <MaterialIcons name="check" size={22} color="#001f28" />
              <Text style={styles.srSubmitBtnText}>Enviar</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

type RainItem = { key: number; value: number; col: number; bornAt: number };

function applyRule(rule: NumberRainExercise['rule'], n: number): boolean {
  switch (rule) {
    case 'even':
      return n % 2 === 0;
    case 'odd':
      return n % 2 !== 0;
    case 'multiple-3':
      return n % 3 === 0;
    case 'multiple-5':
      return n % 5 === 0;
    case 'prime': {
      if (n < 2) return false;
      for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
      return true;
    }
    case 'gt-10':
      return n > 10;
    case 'lt-10':
      return n < 10;
  }
}

function NumberRainView({
  exercise,
  status,
  outcome,
  onFinish,
}: {
  exercise: NumberRainExercise;
  status: Status;
  outcome: 'win' | 'lose' | null;
  onFinish: (success: boolean) => void;
}) {
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(exercise.seconds);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [items, setItems] = useState<RainItem[]>([]);
  const finishedRef = useRef(false);
  const nextKeyRef = useRef(1);
  const colsRef = useRef(3);

  const finishGame = useCallback(
    (win: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      feedback(win ? 'streak' : 'wrong');
      onFinish(win);
    },
    [onFinish],
  );

  useEffect(() => {
    if (!started || outcome !== null) return;
    if (remaining <= 0) {
      finishGame(score >= exercise.goal);
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [started, remaining, outcome, score, exercise.goal, finishGame]);

  useEffect(() => {
    if (!started || outcome !== null) return;
    const interval = setInterval(() => {
      setItems((prev) => {
        const now = Date.now();
        const alive = prev.filter((it) => now - it.bornAt < 3200);
        if (alive.length >= 6) return alive;
        const v =
          exercise.numbers[Math.floor(Math.random() * exercise.numbers.length)];
        const item: RainItem = {
          key: nextKeyRef.current++,
          value: v,
          col: Math.floor(Math.random() * colsRef.current),
          bornAt: now,
        };
        return [...alive, item];
      });
    }, 700);
    return () => clearInterval(interval);
  }, [started, outcome, exercise.numbers]);

  useEffect(() => {
    if (mistakes > exercise.mistakesAllowed && outcome === null) {
      finishGame(false);
    }
  }, [mistakes, exercise.mistakesAllowed, outcome, finishGame]);

  useEffect(() => {
    if (score >= exercise.goal && outcome === null) {
      finishGame(true);
    }
  }, [score, exercise.goal, outcome, finishGame]);

  const handleTap = useCallback(
    (item: RainItem) => {
      if (outcome !== null) return;
      const valid = applyRule(exercise.rule, item.value);
      if (valid) {
        setScore((s) => s + 1);
        feedback('correct');
      } else {
        setMistakes((m) => m + 1);
        feedback('wrong');
      }
      setItems((prev) => prev.filter((it) => it.key !== item.key));
    },
    [exercise.rule, outcome],
  );

  const start = useCallback(() => {
    finishedRef.current = false;
    setStarted(true);
    setRemaining(exercise.seconds);
    setScore(0);
    setMistakes(0);
    setItems([]);
    feedback('select');
  }, [exercise.seconds]);

  const pct = (remaining / exercise.seconds) * 100;

  return (
    <View style={styles.exerciseBlock}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <Text style={styles.memorySubtitle}>{exercise.criterion}</Text>

      <View style={styles.srStatsRow}>
        <View style={styles.srStatPill}>
          <MaterialIcons name="bolt" size={16} color={colors.tertiaryBright} />
          <Text style={styles.srStatText}>{score} / {exercise.goal}</Text>
        </View>
        <View style={styles.srStatPill}>
          <MaterialIcons name="timer" size={16} color={colors.primaryAccent} />
          <Text style={styles.srStatText}>{remaining}s</Text>
        </View>
        <View style={styles.srStatPill}>
          <MaterialIcons name="error-outline" size={16} color={ERROR_COLOR} />
          <Text style={styles.srStatText}>
            {mistakes}/{exercise.mistakesAllowed}
          </Text>
        </View>
      </View>

      <View style={styles.timerTrack}>
        <LinearGradient
          colors={[colors.tertiaryBright, colors.primaryAccent]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.timerFill, { width: `${Math.max(0, pct)}%` }]}
        />
      </View>

      {!started ? (
        <Pressable
          onPress={start}
          style={({ pressed }) => [
            styles.srStartBtn,
            pressed && styles.pressedSoft,
          ]}
        >
          <MaterialIcons name="play-arrow" size={28} color="#001f28" />
          <Text style={styles.srStartBtnText}>
            ¡Comenzar! ({exercise.seconds}s)
          </Text>
        </Pressable>
      ) : outcome !== null ? (
        <View
          style={[
            styles.srResultCard,
            outcome === 'win' ? styles.srResultWin : styles.srResultLose,
          ]}
        >
          <MaterialIcons
            name={outcome === 'win' ? 'emoji-events' : 'event-busy'}
            size={36}
            color={outcome === 'win' ? colors.tertiaryBright : ERROR_COLOR}
          />
          <Text style={styles.srResultTitle}>
            {outcome === 'win' ? '¡Excelente reflejos!' : 'Casi…'}
          </Text>
          <Text style={styles.srResultBody}>
            Aciertos: {score} · Fallos: {mistakes}
          </Text>
        </View>
      ) : (
        <View style={styles.rainBoard}>
          {items.map((it) => (
            <RainBubble key={it.key} item={it} onPress={() => handleTap(it)} />
          ))}
        </View>
      )}
    </View>
  );
}

function RainBubble({
  item,
  onPress,
}: {
  item: RainItem;
  onPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 110,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  const leftPct = (item.col / 3) * 100 + 4;
  const topPct = ((item.key * 53) % 70) + 6;

  return (
    <Animated.View
      style={[
        styles.rainBubbleWrap,
        {
          left: `${leftPct}%`,
          top: `${topPct}%`,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.rainBubble,
          pressed && styles.rainBubblePressed,
        ]}
      >
        <Text style={styles.rainBubbleText}>{item.value}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Hash determinístico simple a partir de un string. */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Shuffle determinístico (Fisher-Yates con seed) para que el mismo ejercicio
 * presente siempre el mismo orden. */
function shuffleStable<T>(arr: T[], seed: string): T[] {
  const out = [...arr];
  let s = hashCode(seed) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Helper para mostrar el número del pareo en la columna izquierda. */
function indexLabel(_n: number, rightOrder: number[], rightIdx: number): string {
  const i = rightOrder.indexOf(rightIdx);
  return i >= 0 ? `${i + 1}` : '';
}

function FeedbackPanel({
  status,
  outOfTime,
  correctText,
  onContinue,
  lastLife,
}: {
  status: Status;
  outOfTime: boolean;
  correctText: string;
  onContinue: () => void;
  lastLife: boolean;
}) {
  const slide = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slide, opacity]);

  const isCorrect = status === 'correct';
  const title = isCorrect
    ? '¡Correcto!'
    : outOfTime
      ? 'Se acabó el tiempo'
      : 'Incorrecto';
  const continueLabel = lastLife ? 'Ver resultado' : 'Continuar';

  return (
    <Animated.View
      style={[
        styles.feedbackPanel,
        isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
        {
          opacity,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <View style={styles.feedbackHeader}>
        <MaterialIcons
          name={isCorrect ? 'check-circle' : 'cancel'}
          size={26}
          color={isCorrect ? colors.tertiaryBright : ERROR_COLOR}
        />
        <Text
          style={[
            styles.feedbackTitle,
            { color: isCorrect ? colors.tertiaryBright : ERROR_COLOR },
          ]}
        >
          {title}
        </Text>
      </View>
      {!isCorrect && (
        <Text style={styles.feedbackBody}>
          La respuesta correcta es{' '}
          <Text style={styles.feedbackAnswer}>{correctText}</Text>.
        </Text>
      )}
      <Pressable
        onPress={onContinue}
        style={({ pressed }) => [
          styles.continueBtn,
          isCorrect ? styles.continueBtnCorrect : styles.continueBtnWrong,
          pressed && styles.pressedSoft,
        ]}
      >
        <Text
          style={[
            styles.continueBtnText,
            { color: isCorrect ? '#001f28' : '#3b0008' },
          ]}
        >
          {continueLabel}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function CompletionView({
  topicTitle,
  correct,
  total,
  livesLeft,
  delta,
  nextTopic,
  onGoHome,
  onNextTopic,
}: {
  topicTitle: string;
  correct: number;
  total: number;
  livesLeft: number;
  delta: CompletionDelta | null;
  nextTopic: RoadmapNode | null;
  onGoHome: () => void;
  onNextTopic?: (node: RoadmapNode) => void;
}) {
  const insets = useSafeAreaInsets();
  const perfect = correct === total && livesLeft === STARTING_LIVES;
  const dead = livesLeft <= 0;
  const localXp = correct * 10 + (livesLeft > 0 ? livesLeft * 5 : 0);
  const xp = delta?.xpEarned ?? localXp;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const canGoNext = !dead && nextTopic !== null && !!onNextTopic;

  type Overlay = 'levelUp' | 'streak' | null;
  const [phase, setPhase] = useState<'summary' | 'celebration'>('summary');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const exitHandledRef = useRef(false);

  const startCelebrationOrExit = useCallback(() => {
    if (exitHandledRef.current) return;
    exitHandledRef.current = true;

    if (delta?.leveledUp) {
      setPhase('celebration');
      setOverlay('levelUp');
      feedback('levelUp');
      return;
    }
    if (delta?.streakIncreased) {
      setPhase('celebration');
      setOverlay('streak');
      feedback('streak');
      return;
    }
    onGoHome();
  }, [delta, onGoHome]);

  const dismissOverlay = () => {
    if (overlay === 'levelUp' && delta?.streakIncreased) {
      setOverlay('streak');
      feedback('streak');
    } else {
      setOverlay(null);
      onGoHome();
    }
  };

  if (phase === 'summary') {
    return (
      <View style={styles.root}>
        <BackgroundDecor />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.completionScroll,
            { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.trophyWrap,
              dead && { backgroundColor: 'rgba(255, 180, 171, 0.15)' },
            ]}
          >
            <MaterialIcons
              name={dead ? 'sentiment-dissatisfied' : 'emoji-events'}
              size={72}
              color={dead ? ERROR_COLOR : colors.primaryAccent}
            />
          </View>
          <Text style={styles.completionTitle}>
            {dead
              ? 'Sin vidas'
              : perfect
                ? '¡Tema dominado!'
                : '¡Tema completado!'}
          </Text>
          <Text style={styles.completionSubtitle}>{topicTitle}</Text>

          {delta && (
            <View style={styles.badgeRow}>
              {delta.topicJustCompleted && (
                <CompletionBadge
                  icon="lock-open"
                  label="Tema desbloqueado"
                  color={colors.tertiaryBright}
                />
              )}
              {delta.streakIncreased && (
                <CompletionBadge
                  icon="local-fire-department"
                  label={`Racha · ${delta.newStreak} ${delta.newStreak === 1 ? 'día' : 'días'}`}
                  color="#ffb86b"
                />
              )}
              {delta.leveledUp && (
                <CompletionBadge
                  icon="star"
                  label={`Nivel ${delta.newLevel}`}
                  color={colors.primaryAccent}
                />
              )}
              {delta.alreadyCompleted && !delta.topicJustCompleted && (
                <CompletionBadge
                  icon="replay"
                  label="Práctica extra"
                  color={colors.outline}
                />
              )}
            </View>
          )}

          <View style={styles.statsGrid}>
            <StatBox
              icon="check-circle"
              label="Aciertos"
              value={`${correct} / ${total}`}
              color={colors.tertiaryBright}
            />
            <StatBox
              icon="bolt"
              label="XP ganado"
              value={`+${xp}`}
              color={colors.primaryAccent}
            />
            <StatBox
              icon="favorite"
              label="Precisión"
              value={`${accuracy}%`}
              color={ERROR_COLOR}
            />
          </View>

          <Text style={styles.completionTapHint}>
            Pulsa «Volver al inicio» cuando quieras continuar
          </Text>

          <View style={styles.completionActions}>
            {canGoNext && nextTopic && (
              <PrimaryButton
                label="Siguiente lección"
                icon="arrow-forward"
                onPress={() => onNextTopic?.(nextTopic)}
              />
            )}
            <SecondaryButton
              label="Volver al inicio"
              icon="home"
              onPress={startCelebrationOrExit}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BackgroundDecor />
      {overlay === 'levelUp' && delta && (
        <LevelUpOverlay level={delta.newLevel} onClose={dismissOverlay} />
      )}
      {overlay === 'streak' && delta && (
        <StreakCelebrationOverlay streak={delta.newStreak} onClose={dismissOverlay} />
      )}
    </View>
  );
}

function CompletionBadge({
  icon,
  label,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.completionBadge, { borderColor: `${color}66`, backgroundColor: `${color}1A` }]}>
      <MaterialIcons name={icon} size={14} color={color} />
      <Text style={[styles.completionBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <BlurView intensity={30} tint="dark" style={styles.statBox}>
      <MaterialIcons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </BlurView>
  );
}

function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && styles.primaryBtnDisabled,
        pressed && !disabled && styles.pressedSoft,
      ]}
    >
      <LinearGradient
        colors={[colors.primaryContainer, colors.secondaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {icon && <MaterialIcons name={icon} size={22} color="#ffffff" />}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryBtn,
        pressed && styles.pressedSoft,
      ]}
    >
      {icon && <MaterialIcons name={icon} size={20} color={colors.onSurface} />}
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

function BackgroundDecor() {
  return (
    <>
      <View style={styles.bgGlowTop} pointerEvents="none" />
      <View style={styles.bgGlowBottom} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  bgGlowTop: {
    position: 'absolute',
    top: '15%',
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 200,
    backgroundColor: `${colors.primaryContainer}1A`,
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: '15%',
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 200,
    backgroundColor: `${colors.secondaryContainer}1A`,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.md,
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
    backgroundColor: 'rgba(19, 17, 37, 0.8)',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerCounter: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: colors.onSurface,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 4,
    minWidth: 84,
    justifyContent: 'flex-end',
  },
  headerProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${colors.tertiaryBright}33`,
    backgroundColor: `${colors.tertiaryBright}14`,
  },
  typeBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.tertiaryBright,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  trickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.4)',
    backgroundColor: 'rgba(255, 184, 107, 0.12)',
  },
  trickBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#ffb86b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  helperText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  exerciseBlock: {
    width: '100%',
    maxWidth: 480,
    gap: spacing.md,
  },
  prompt: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    lineHeight: 30,
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  expressionWrap: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.18)',
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
    alignItems: 'center',
  },
  expressionText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.primaryAccent,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  optionsList: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: `${colors.outlineVariant}66`,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  optionSelected: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}14`,
  },
  optionCorrect: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}26`,
  },
  optionWrong: {
    borderColor: ERROR_COLOR,
    backgroundColor: 'rgba(255, 180, 171, 0.15)',
  },
  optionBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: `${colors.outline}80`,
  },
  optionBulletSelected: {
    backgroundColor: colors.tertiaryBright,
    borderColor: colors.tertiaryBright,
  },
  optionBulletCorrect: {
    backgroundColor: colors.tertiaryBright,
    borderColor: colors.tertiaryBright,
  },
  optionBulletWrong: {
    backgroundColor: ERROR_COLOR,
    borderColor: ERROR_COLOR,
  },
  optionBulletText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: colors.outline,
  },
  optionBulletTextActive: {
    color: '#001f28',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: colors.onSurface,
  },
  optionTextSelected: {
    color: colors.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  optionTextCorrect: {
    color: colors.tertiaryBright,
    fontFamily: 'Poppins_700Bold',
  },
  optionTextWrong: {
    color: ERROR_COLOR,
    fontFamily: 'Poppins_700Bold',
  },
  fillCard: {
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.2)',
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
    alignItems: 'center',
    gap: spacing.md,
  },
  fillExpression: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: colors.primaryAccent,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  fillInput: {
    minWidth: 140,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.tertiaryBright,
    backgroundColor: 'rgba(19, 17, 37, 0.6)',
    color: colors.onSurface,
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    textAlign: 'center',
    outlineStyle: 'none' as never,
  },
  fillInputCorrect: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}1A`,
    color: colors.tertiaryBright,
  },
  fillInputWrong: {
    borderColor: ERROR_COLOR,
    backgroundColor: 'rgba(255, 180, 171, 0.15)',
    color: ERROR_COLOR,
  },
  timerWrap: {
    gap: 6,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.tertiaryBright,
    letterSpacing: 0.4,
  },
  timerTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 999,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${colors.outlineVariant}99`,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  secondaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    letterSpacing: 0.3,
  },
  completionActions: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.sm,
  },
  feedbackPanel: {
    width: '100%',
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
  },
  feedbackCorrect: {
    borderColor: `${colors.tertiaryBright}66`,
    backgroundColor: `${colors.tertiaryBright}1F`,
  },
  feedbackWrong: {
    borderColor: 'rgba(255, 180, 171, 0.5)',
    backgroundColor: 'rgba(255, 180, 171, 0.12)',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  feedbackTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    letterSpacing: -0.2,
  },
  feedbackBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurface,
  },
  feedbackAnswer: {
    fontFamily: 'Poppins_700Bold',
    color: colors.tertiaryBright,
  },
  continueBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  continueBtnCorrect: {
    backgroundColor: colors.tertiaryBright,
  },
  continueBtnWrong: {
    backgroundColor: ERROR_COLOR,
  },
  continueBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  trophyWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primaryContainer}26`,
    borderWidth: 2,
    borderColor: `${colors.primaryAccent}66`,
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  completionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.tertiaryBright,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  completionTapHint: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.outline,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: spacing.xs,
  },
  completionScroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    maxWidth: 420,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  completionBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 420,
  },
  statBox: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 142, 160, 0.18)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.onSurface,
    marginTop: 2,
  },
  statLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  emptyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.onSurface,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pressedSoft: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  optionMissed: {
    borderColor: 'rgba(255, 184, 107, 0.6)',
    backgroundColor: 'rgba(255, 184, 107, 0.12)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: `${colors.outline}aa`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.tertiaryBright,
    borderColor: colors.tertiaryBright,
  },
  checkboxCorrect: {
    backgroundColor: colors.tertiaryBright,
    borderColor: colors.tertiaryBright,
  },
  checkboxWrong: {
    backgroundColor: ERROR_COLOR,
    borderColor: ERROR_COLOR,
  },
  tfStatementWrap: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.2)',
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
    alignItems: 'center',
  },
  tfStatementText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.onSurface,
    textAlign: 'center',
  },
  tfButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tfButton: {
    flex: 1,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: `${colors.outlineVariant}66`,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    paddingVertical: spacing.md,
  },
  tfButtonSelected: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}14`,
  },
  tfButtonCorrect: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}26`,
  },
  tfButtonWrong: {
    borderColor: ERROR_COLOR,
    backgroundColor: 'rgba(255, 180, 171, 0.15)',
  },
  tfButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.outline,
    letterSpacing: 0.5,
  },
  explanationWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.35)',
    backgroundColor: 'rgba(255, 184, 107, 0.08)',
  },
  explanationText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.onSurface,
  },
  matchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  matchCol: {
    flex: 1,
    gap: spacing.sm,
  },
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: `${colors.outlineVariant}66`,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    minHeight: 56,
  },
  matchChipActive: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}1a`,
  },
  matchChipMatched: {
    borderColor: `${colors.tertiaryBright}66`,
    backgroundColor: `${colors.tertiaryBright}14`,
  },
  matchChipUsed: {
    opacity: 0.45,
  },
  matchChipCorrect: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}26`,
  },
  matchChipWrong: {
    borderColor: ERROR_COLOR,
    backgroundColor: 'rgba(255, 180, 171, 0.15)',
  },
  matchChipText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  matchChipBadge: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: colors.tertiaryBright,
    minWidth: 18,
    textAlign: 'right',
  },
  matchChipBadgeLeft: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: colors.outline,
    minWidth: 18,
  },
  orderSlotsWrap: {
    gap: spacing.sm,
  },
  orderSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: `${colors.outlineVariant}66`,
    backgroundColor: 'rgba(32, 29, 50, 0.35)',
    minHeight: 52,
  },
  orderSlotFilled: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(32, 29, 50, 0.7)',
  },
  orderSlotCorrect: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}26`,
  },
  orderSlotWrong: {
    borderColor: ERROR_COLOR,
    backgroundColor: 'rgba(255, 180, 171, 0.15)',
  },
  orderSlotIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.tertiaryBright}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderSlotIndexText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: colors.tertiaryBright,
  },
  orderSlotText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  orderSlotPlaceholder: {
    color: `${colors.outline}aa`,
    fontStyle: 'italic',
  },
  orderBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  orderBankChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${colors.tertiaryBright}55`,
    backgroundColor: `${colors.tertiaryBright}1a`,
  },
  orderBankChipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurface,
  },
  tapTemplate: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.18)',
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
  },
  tapTemplateText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 17,
    color: colors.onSurface,
    lineHeight: 28,
  },
  tapSlot: {
    minWidth: 56,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: `${colors.tertiaryBright}99`,
    backgroundColor: `${colors.tertiaryBright}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapSlotFilled: {
    borderStyle: 'solid',
    backgroundColor: `${colors.tertiaryBright}33`,
  },
  tapSlotCorrect: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}40`,
  },
  tapSlotWrong: {
    borderColor: ERROR_COLOR,
    backgroundColor: 'rgba(255, 180, 171, 0.2)',
  },
  tapSlotText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.onSurface,
  },
  tapBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tapBankChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: `${colors.tertiaryBright}55`,
    backgroundColor: `${colors.tertiaryBright}1a`,
  },
  tapBankChipDisabled: {
    opacity: 0.35,
  },
  tapBankChipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  memoryStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignSelf: 'flex-start',
  },
  memoryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}66`,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  memoryStatText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.onSurface,
    letterSpacing: 0.4,
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  memoryCardWrap: {
    aspectRatio: 1,
  },
  memoryCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: `${colors.primaryAccent}33`,
    backgroundColor: 'rgba(32, 29, 50, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    overflow: 'hidden',
  },
  memoryCardRevealed: {
    borderColor: colors.primaryAccent,
    backgroundColor: `${colors.primaryAccent}1a`,
  },
  memoryCardMatched: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}26`,
  },
  memoryCardBack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(80, 21, 189, 0.18)',
    borderRadius: 10,
  },
  memoryCardText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.onSurface,
    textAlign: 'center',
  },
  memoryCardTextMatched: {
    color: colors.tertiaryBright,
  },
  memoryCardCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.tertiaryBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryWinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${colors.tertiaryBright}66`,
    backgroundColor: `${colors.tertiaryBright}1a`,
  },
  memoryWinText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 18,
  },
  srStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
  },
  srStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}66`,
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
  },
  srStatText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: colors.onSurface,
    letterSpacing: 0.4,
  },
  srStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.tertiaryBright,
  },
  srStartBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#001f28',
    letterSpacing: 0.3,
  },
  srExpressionCard: {
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(207, 189, 255, 0.25)',
    backgroundColor: 'rgba(32, 29, 50, 0.6)',
    alignItems: 'center',
    gap: spacing.md,
  },
  srExpressionOk: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}1f`,
  },
  srExpressionNo: {
    borderColor: ERROR_COLOR,
    backgroundColor: 'rgba(255, 180, 171, 0.15)',
  },
  srExpressionText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: colors.primaryAccent,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  srActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  srSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${colors.outlineVariant}66`,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  srSkipBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.outline,
  },
  srSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.tertiaryBright,
  },
  srSubmitBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#001f28',
  },
  srResultCard: {
    alignItems: 'center',
    gap: 4,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  srResultWin: {
    borderColor: `${colors.tertiaryBright}80`,
    backgroundColor: `${colors.tertiaryBright}1f`,
  },
  srResultLose: {
    borderColor: 'rgba(255, 180, 171, 0.6)',
    backgroundColor: 'rgba(255, 180, 171, 0.12)',
  },
  srResultTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.onSurface,
    marginTop: 4,
  },
  srResultBody: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  rainBoard: {
    width: '100%',
    height: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.18)',
    backgroundColor: 'rgba(19, 17, 37, 0.55)',
    overflow: 'hidden',
    position: 'relative',
  },
  rainBubbleWrap: {
    position: 'absolute',
  },
  rainBubble: {
    minWidth: 64,
    height: 64,
    paddingHorizontal: spacing.sm,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: `${colors.tertiaryBright}80`,
    backgroundColor: 'rgba(32, 29, 50, 0.85)',
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 6,
  },
  rainBubblePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.92 }],
  },
  rainBubbleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.tertiaryBright,
  },
});
