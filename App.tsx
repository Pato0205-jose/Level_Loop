import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { installWebWarningFilter } from './src/utils/suppressWarnings';

installWebWarningFilter();

import { HomeScreen } from './src/screens/HomeScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen, type Course } from './src/screens/DashboardScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { RankingScreen } from './src/screens/RankingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ProfileEditorScreen } from './src/screens/ProfileEditorScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { AchievementDetailScreen } from './src/screens/AchievementDetailScreen';
import { CourseRoadmapScreen } from './src/screens/CourseRoadmapScreen';
import { CourseLessonsScreen } from './src/screens/CourseLessonsScreen';
import { ExerciseScreen } from './src/screens/ExerciseScreen';
import { LessonScreen } from './src/screens/LessonScreen';
import type { MainTab } from './src/components/BottomNav';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { snackbar, SnackbarProvider } from './src/components/Snackbar';
import { StreakCelebrationOverlay } from './src/components/StreakCelebrationOverlay';
import type { RoadmapNode } from './src/constants/roadmaps';
import { getLesson, type Lesson } from './src/constants/lessons';
import {
  getCurrentUser,
  isOnboardingDone,
  logout as doLogout,
  type PublicUser,
} from './src/services/auth';
import { feedback, loadFeedbackPrefs } from './src/services/feedback';
import {
  getProgress,
  recordExerciseResult,
  type CompletionDelta,
  type ExerciseResult,
  type UserProgress,
} from './src/services/progress';
import { syncAchievements } from './src/services/achievements';
import {
  markStreakGreetedToday,
  shouldShowStreakGreeting,
} from './src/services/streakGreeting';
import { initStreakReminders } from './src/services/pushReminders';
import { resolveWorkingApiBaseUrl } from './src/config/backend';

type AppScreen =
  | 'home'
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'onboarding'
  | 'main'
  | 'settings'
  | 'profile-editor'
  | 'notifications'
  | 'achievement-detail'
  | 'course-roadmap'
  | 'course-lessons'
  | 'exercise'
  | 'lesson';

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function AppInner() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [mainTab, setMainTab] = useState<MainTab>('missions');
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [homeFinished, setHomeFinished] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<RoadmapNode | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(
    null,
  );
  const [exerciseReturnTo, setExerciseReturnTo] =
    useState<AppScreen>('course-roadmap');
  const [lessonReturnTo, setLessonReturnTo] = useState<AppScreen>('main');
  const [streakGreeting, setStreakGreeting] = useState<number | null>(null);

  useEffect(() => {
    void resolveWorkingApiBaseUrl();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await resolveWorkingApiBaseUrl();
        const [user] = await Promise.all([getCurrentUser(), loadFeedbackPrefs()]);
        if (cancelled) return;
        setCurrentUser(user);
        setHydrated(true);
        if (user) {
          void getProgress(user.id).then((p) => {
            if (!cancelled) setProgress(p);
          });
        } else {
          setProgress(null);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
          setProgress(null);
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hydrateProgressFor = useCallback(async (userId: string) => {
    const p = await getProgress(userId);
    setProgress(p);
  }, []);

  const maybeShowStreakGreeting = useCallback(
    async (userId: string, currentProgress: UserProgress | null) => {
      const due = await shouldShowStreakGreeting(userId);
      if (!due) return;

      const p = currentProgress ?? (await getProgress(userId));
      if (!p) return;

      setStreakGreeting(p.streakDays);
      feedback('streak');
    },
    [],
  );

  const advanceFromHome = useCallback(async () => {
    if (currentUser) {
      const onboarded = await isOnboardingDone();
      if (onboarded) {
        setMainTab('missions');
        setScreen('main');
        void initStreakReminders();
      } else {
        setScreen('onboarding');
      }
    } else {
      setScreen('welcome');
    }
  }, [currentUser]);

  useEffect(() => {
    if (!hydrated || !homeFinished) return;
    void advanceFromHome();
  }, [hydrated, homeFinished, advanceFromHome]);

  useEffect(() => {
    if (screen !== 'main' || !currentUser || streakGreeting !== null) return;
    void maybeShowStreakGreeting(currentUser.id, progress);
  }, [screen, currentUser, progress, streakGreeting, maybeShowStreakGreeting]);

  const handleHomeFinish = useCallback(() => {
    setHomeFinished(true);
  }, []);

  const dismissStreakGreeting = useCallback(() => {
    const userId = currentUser?.id;
    setStreakGreeting(null);
    if (userId) {
      void markStreakGreetedToday(userId);
    }
  }, [currentUser]);

  const enterApp = useCallback(() => {
    setMainTab('missions');
    setScreen('main');
  }, []);

  const handleLoginSuccess = useCallback(
    async (user: PublicUser) => {
      setCurrentUser(user);
      let onboarded = false;
      try {
        onboarded = await isOnboardingDone();
      } catch {
        onboarded = false;
      }
      if (onboarded) {
        enterApp();
        void initStreakReminders();
      } else {
        setScreen('onboarding');
      }
      snackbar.success(
        `Bienvenida de vuelta, ${user.name.split(' ')[0]}`,
        '¡Vamos a continuar donde lo dejaste!',
      );
      void getProgress(user.id).then((p) => {
        setProgress(p);
      });
    },
    [enterApp],
  );

  const handleRegisterSuccess = useCallback(
    (user: PublicUser) => {
      setCurrentUser(user);
      setScreen('onboarding');
      snackbar.success(
        '¡Cuenta creada!',
        `Bienvenida a Level Loop, ${user.name.split(' ')[0]}.`,
      );
      void hydrateProgressFor(user.id);
    },
    [hydrateProgressFor],
  );

  const handleOnboardingFinish = useCallback(
    (user: PublicUser) => {
      setCurrentUser(user);
      enterApp();
      void initStreakReminders();
      void hydrateProgressFor(user.id);
    },
    [enterApp, hydrateProgressFor],
  );

  const handleLogout = useCallback(async () => {
    await doLogout();
    setCurrentUser(null);
    setProgress(null);
    setSelectedCourse(null);
    setSelectedTopic(null);
    setSelectedLesson(null);
    setScreen('welcome');
    snackbar.info('Sesión cerrada', 'Tu progreso se guardó correctamente.');
  }, []);

  const openSettings = useCallback(() => {
    setScreen('settings');
  }, []);

  const closeSettings = useCallback(() => {
    setScreen('main');
  }, []);

  const openProfileEditor = useCallback(() => {
    setScreen('profile-editor');
  }, []);

  const closeProfileEditor = useCallback(() => {
    setScreen('settings');
  }, []);

  const handleProfileSaved = useCallback((user: PublicUser) => {
    setCurrentUser(user);
    setScreen('settings');
    snackbar.success('Perfil actualizado', 'Tus cambios se guardaron correctamente.');
  }, []);

  const openNotifications = useCallback(() => {
    setScreen('notifications');
  }, []);

  const closeNotifications = useCallback(() => {
    setScreen('main');
  }, []);

  const openAchievement = useCallback((id: string) => {
    setSelectedAchievementId(id);
    setScreen('achievement-detail');
  }, []);

  const closeAchievement = useCallback(() => {
    setScreen('main');
  }, []);

  const handleSelectCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    setScreen('course-roadmap');
  }, []);

  const handleBrowseCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    setScreen('course-lessons');
  }, []);

  const closeCourseRoadmap = useCallback(() => {
    setScreen('main');
  }, []);

  const closeCourseLessons = useCallback(() => {
    setScreen('main');
  }, []);

  const handleSelectTopic = useCallback((node: RoadmapNode) => {
    setSelectedTopic(node);
    setExerciseReturnTo('course-roadmap');
    setScreen('exercise');
  }, []);

  const closeExercise = useCallback(() => {
    setScreen(exerciseReturnTo);
  }, [exerciseReturnTo]);

  const handleGoHomeFromExercise = useCallback(() => {
    setMainTab('missions');
    setScreen('main');
  }, []);

  const handleNextTopicFromExercise = useCallback((node: RoadmapNode) => {
    setSelectedTopic(node);
  }, []);

  const handleOpenLesson = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonReturnTo('main');
    setScreen('lesson');
  }, []);

  const handleOpenLessonFromCourseLessons = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonReturnTo('course-lessons');
    setScreen('lesson');
  }, []);

  const handleOpenLessonFromRoadmap = useCallback(
    (topicId: string, topicTitle: string) => {
      const found = getLesson(topicId);
      const lesson: Lesson =
        found ?? {
          topicId,
          courseId: 'math',
          title: topicTitle,
          summary: 'Aún no hay material teórico para este tema.',
          estimatedMin: 3,
          concepts: [],
          icon: 'menu-book',
        };
      setSelectedLesson(lesson);
      setLessonReturnTo('course-roadmap');
      setScreen('lesson');
    },
    [],
  );

  const closeLesson = useCallback(() => {
    setScreen(lessonReturnTo);
  }, [lessonReturnTo]);

  const handlePracticeFromLesson = useCallback(
    (topicId: string, topicTitle: string) => {
      setSelectedTopic({
        id: topicId,
        title: topicTitle,
        status: 'active',
        icon: 'play-arrow',
      });
      setExerciseReturnTo('lesson');
      setScreen('exercise');
    },
    [],
  );

  const handleExerciseFinish = useCallback(
    async (result: ExerciseResult): Promise<CompletionDelta | null> => {
      if (!currentUser) return null;
      const { progress: next, delta } = await recordExerciseResult(
        currentUser.id,
        result,
      );
      setProgress(next);
      const { newlyUnlocked } = await syncAchievements(currentUser.id, next);
      if (newlyUnlocked.length > 0) {
        feedback('lessonComplete');
        newlyUnlocked.forEach((ach, idx) => {
          setTimeout(() => {
            snackbar.achievement(
              `¡Logro desbloqueado: ${ach.title}!`,
              ach.caption,
            );
          }, idx * 700);
        });
      }
      return delta;
    },
    [currentUser],
  );

  return (
    <SafeAreaProvider>
      <SnackbarProvider>
      <StatusBar style="light" />
      {screen === 'home' && <HomeScreen onFinish={handleHomeFinish} />}
      {screen === 'welcome' && (
        <WelcomeScreen
          onSignIn={() => setScreen('login')}
          onCreateAccount={() => setScreen('register')}
        />
      )}
      {screen === 'login' && (
        <LoginScreen
          onBack={() => setScreen('welcome')}
          onRegister={() => setScreen('register')}
          onForgotPassword={() => setScreen('forgot-password')}
          onSubmit={handleLoginSuccess}
        />
      )}
      {screen === 'register' && (
        <RegisterScreen
          onBack={() => setScreen('welcome')}
          onSignIn={() => setScreen('login')}
          onSubmit={handleRegisterSuccess}
        />
      )}
      {screen === 'forgot-password' && (
        <ForgotPasswordScreen
          onBack={() => setScreen('login')}
          onBackToLogin={() => setScreen('login')}
        />
      )}
      {screen === 'onboarding' && currentUser && (
        <OnboardingScreen
          user={currentUser}
          onFinish={handleOnboardingFinish}
        />
      )}
      {screen === 'main' && mainTab === 'missions' && (
        <DashboardScreen
          user={currentUser}
          progress={progress}
          onLogout={handleLogout}
          activeTab={mainTab}
          onTabChange={setMainTab}
          onSelectCourse={handleSelectCourse}
          onOpenNotifications={openNotifications}
        />
      )}
      {screen === 'main' && mainTab === 'explore' && (
        <ExploreScreen
          progress={progress}
          activeTab={mainTab}
          onTabChange={setMainTab}
          onOpenLesson={handleOpenLesson}
          onSelectCourse={handleBrowseCourse}
        />
      )}
      {screen === 'main' && mainTab === 'ranking' && (
        <RankingScreen
          user={currentUser}
          progress={progress}
          activeTab={mainTab}
          onTabChange={setMainTab}
          onOpenSettings={openSettings}
        />
      )}
      {screen === 'main' && mainTab === 'profile' && (
        <ProfileScreen
          user={currentUser}
          progress={progress}
          activeTab={mainTab}
          onTabChange={setMainTab}
          onOpenSettings={openSettings}
          onOpenNotifications={openNotifications}
          onOpenAchievement={openAchievement}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          user={currentUser}
          onBack={closeSettings}
          onLogout={handleLogout}
          onEditProfile={openProfileEditor}
        />
      )}
      {screen === 'profile-editor' && currentUser && (
        <ProfileEditorScreen
          user={currentUser}
          onBack={closeProfileEditor}
          onSaved={handleProfileSaved}
        />
      )}
      {screen === 'notifications' && (
        <NotificationsScreen onBack={closeNotifications} />
      )}
      {screen === 'achievement-detail' && selectedAchievementId && (
        <AchievementDetailScreen
          achievementId={selectedAchievementId}
          userId={currentUser?.id ?? null}
          progress={progress}
          onBack={closeAchievement}
        />
      )}
      {screen === 'course-roadmap' && (
        <CourseRoadmapScreen
          courseId={selectedCourse?.id}
          progress={progress}
          onBack={closeCourseRoadmap}
          onSelectTopic={handleSelectTopic}
          onSelectLesson={handleOpenLessonFromRoadmap}
        />
      )}
      {screen === 'course-lessons' && (
        <CourseLessonsScreen
          courseId={selectedCourse?.id}
          progress={progress}
          onBack={closeCourseLessons}
          onOpenLesson={handleOpenLessonFromCourseLessons}
        />
      )}
      {screen === 'exercise' && selectedTopic && (
        <ExerciseScreen
          key={selectedTopic.id}
          topicId={selectedTopic.id}
          topicTitle={selectedTopic.title}
          courseId={selectedCourse?.id}
          onBack={closeExercise}
          onGoHome={handleGoHomeFromExercise}
          onNextTopic={handleNextTopicFromExercise}
          onFinish={handleExerciseFinish}
        />
      )}
      {screen === 'lesson' && selectedLesson && (
        <LessonScreen
          topicId={selectedLesson.topicId}
          onBack={closeLesson}
          onPractice={handlePracticeFromLesson}
        />
      )}
      {streakGreeting !== null && (
        <StreakCelebrationOverlay
          streak={streakGreeting}
          mode="greeting"
          onClose={dismissStreakGreeting}
        />
      )}
      </SnackbarProvider>
    </SafeAreaProvider>
  );
}
