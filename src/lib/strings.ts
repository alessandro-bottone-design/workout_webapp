/* ============================================
   Italian UI strings — Natural Sentence Case
   Apple Design System: No all-caps
   ============================================ */

export const strings = {
  // Navigation
  nav: {
    home: 'Home',
    program: 'Scheda',
    progress: 'Progressi',
    calendar: 'Calendario',
  },

  // Home
  home: {
    greeting: 'Buongiorno',
    subtitle: 'Pronto ad allenarti?',
    todayLabel: 'Oggi',
    lastWorkout: 'Ultimo workout',
    thisWeek: 'Questa settimana',
    startWorkout: 'Inizia workout',
    resumeWorkout: 'Riprendi allenamento',
    exercises: (n: number) => `${n} esercizi`,
    workoutsPerWeek: (done: number, target: number) => `${done} / ${target} workout`,
    noWorkoutHistory: 'Nessun allenamento completato ancora.',
    noProgram: 'Nessuna scheda configurata.',
    noSessionTitle: 'Nessuna scheda',
    settings: 'Impostazioni',
  },

  // Workout
  workout: {
    overview: 'Workout',
    progress: (done: number, total: number) => `${done} / ${total} esercizi completati`,
    status: {
      upcoming: 'Prossimo',
      active: 'Attivo',
      done: 'Completato',
    },
    startCta: 'Inizia workout',
    continueCta: 'Continua workout',
    completeCta: 'Completa',
    endCta: 'Termina',
    cancelWorkout: 'Termina allenamento',
    resumeWorkout: 'Riprendi',
    inProgress: 'Allenamento in corso',
    confirmCancel: 'Sei sicuro di voler terminare l\'allenamento?',
    confirmCancelDetail: 'Il progresso parziale verrà salvato.',
    seriesLabel: (current: number, total: number) => `Serie ${current} di ${total}`,
    lastTime: 'Ultima volta',
    noLastTime: 'Primo allenamento',
    reps: 'Ripetizioni',
    weight: 'Peso',
    edit: 'Modifica',
    completeSet: 'Completa serie',
    restPresets: 'Recupero',
    duration: 'Durata',
    pause: 'Pausa',
    reset: 'Azzera',
    cardioStart: 'Avvia',
    cardioComplete: 'Completa',
    completeWorkoutCta: 'Completa workout',
    allDoneHint: 'Completa tutti gli esercizi per terminare',
    earlyCompleteCta: 'Termina comunque',
    earlyCompleteTitle: 'Termina comunque',
    earlyCompleteDetail:
      'Hai esercizi non completati. Vuoi terminare comunque l\'allenamento? I set già registrati verranno salvati.',
    backToOverview: 'Torna alla panoramica',
  },

  // Exercise
  exercise: {
    completed: 'Completato',
    series: (n: number) => `${n} serie`,
    cardioDone: 'Cardio completato',
  },

  // Timer
  timer: {
    rest: 'Recupero',
    restDone: 'Recupero terminato',
    adjust: 'Aggiungi tempo',
    stop: 'Termina recupero',
    presets: 'Ricomincia',
    dismiss: 'Chiudi',
    running: 'Recupero in corso',
    add30: 'Aggiungi 30 secondi',
    add60: 'Aggiungi 60 secondi',
  },

  // Workout Complete
  workoutComplete: {
    title: 'Workout\ncompletato',
    exercises: (n: number) => `${n} esercizi`,
    sets: (n: number) => `${n} serie`,
    progress: 'Progressi',
    end: 'Termina',
  },

  // Program
  program: {
    title: 'La mia scheda',
    current: 'Programma attuale',
    weeks: (current: number, total: number) => `${current} / ${total} settimane`,
    editProgram: 'Modifica scheda',
    addExercise: '+ Aggiungi esercizio',
    noProgram: 'Nessuna scheda configurata.',
    createProgram: 'Crea scheda',
    sessionsSection: 'Sedute',
    createProgramDetail: 'Crea una scheda per iniziare ad allenarti',
    editProgramLabel: 'Modifica scheda',
    goToProgram: 'Vai alla scheda',
    loading: 'Caricamento in corso…',
  },

  // Session detail (route /program/session/:sessionId)
  sessionDetail: {
    title: 'Seduta',
    editLabel: 'Modifica seduta',
    startCta: 'Inizia questa seduta',
    cardio: 'Cardio',
    setLine: (sets: number | undefined, reps: number | undefined, weight?: number) =>
      `${sets} × ${reps}${weight ? ` · ${weight} kg` : ''}`,
  },

  // Edit session (route /program/session/:sessionId/edit)
  editSession: {
    title: 'Modifica seduta',
    reorder: 'Riordina',
  },

  // Edit exercise
  editExercise: {
    title: 'Esercizio',
    name: 'Nome',
    sets: 'Serie',
    reps: 'Ripetizioni',
    weight: 'Peso iniziale',
    rest: 'Recupero',
    notes: 'Note',
    save: 'Salva esercizio',
    cancel: 'Annulla',
    delete: 'Elimina esercizio',
    confirmDelete: 'Eliminare questo esercizio dalla scheda?',
    confirmDeleteDetail: 'Lo storico allenamenti non verrà eliminato.',
    notFoundTitle: 'Esercizio non trovato',
    notFoundDetail:
      'L\'esercizio non esiste più nella scheda oppure il link non è valido.',
  },

  // Progress
  progress: {
    title: 'Progressi',
    thisWeek: 'Questa settimana',
    streak: 'Streak',
    totalWorkouts: 'Workout completati',
    avgDuration: 'Durata media',
    exerciseTrends: 'Andamento esercizi',
    noData: 'I tuoi progressi appariranno dopo i primi allenamenti.',
    noDataTitle: 'Nessun dato ancora',
    noDataShort: 'Nessun dato',
    stall: 'Progressione',
    stallDetail: (weight: string, days: number) =>
      `Sei a ${weight} da ${days} giorni.\n\nTi senti stabile con tecnica e ripetizioni?\nPotresti provare un piccolo aumento di carico.`,
  },

  // Exercise history
  exerciseHistory: {
    last: 'Ultimo',
    chart: 'Storico peso',
    sectionTitle: 'Storico',
    chartEmpty: 'Completa un altro allenamento per vedere il grafico',
    chartEmptyHint: 'I dati appariranno dopo il primo allenamento',
    noData: 'Nessun dato disponibile per questo esercizio.',
  },

  // Calendar
  calendar: {
    title: 'Calendario',
    completed: 'Completato',
    prevMonth: 'Mese precedente',
    nextMonth: 'Mese successivo',
    noWorkout: 'Nessun allenamento in questo giorno',
    dayLabel: (date: number, hasWorkout: boolean) =>
      `${date} ${hasWorkout ? '- allenamento' : ''}`,
  },

  // Settings
  settings: {
    title: 'Impostazioni',
    defaultTimer: 'Timer recupero predefinito',
    sound: 'Suono',
    vibration: 'Vibrazione',
    data: 'Dati',
    dataInfo: 'I dati sono salvati localmente su questo dispositivo.',
    resetData: 'Resetta dati app',
    resetConfirm: 'Questa azione eliminerà definitivamente scheda, allenamenti e storico presenti su questo dispositivo.',
    resetButton: 'Elimina tutto',
    resetCancel: 'Annulla',
    appleHealth: 'Apple Health',
    appleHealthNote: 'Richiede app nativa',
    version: 'Versione',
    weeklyTarget: 'Sessioni a settimana',
    weeklyTargetInfo: 'Quanti allenamenti punti ogni settimana',
    weeklyTargetDecrease: 'Riduci obiettivo settimanale',
    weeklyTargetIncrease: 'Aumenta obiettivo settimanale',
    restoreTitle: 'Ripristinare la scheda predefinita?',
    restoreDetail:
      'Le 4 sedute verranno reimpostate alla versione ufficiale (Scheda Allenamento 4 sedute). Lo storico dei workout già completati rimarrà intatto.',
    restoreConfirm: 'Ripristina Scheda',
    restoreCancel: 'Annulla',
    resetDone: 'Dati resettati',
    restoreDone: 'Scheda predefinita ripristinata con successo',
  },

  // Errors / Empty states
  errors: {
    genericError: 'Si è verificato un errore.',
    unexpected: 'Qualcosa è andato storto',
    dbError: 'Errore nel salvataggio dei dati.',
    retry: 'Riprova',
    notFound: 'Pagina non trovata.',
    goHome: 'Torna alla home',
    workoutNotFound: 'Allenamento non trovato',
    workoutNotFoundDetail:
      'Il link non è valido oppure l\'allenamento non è più disponibile.',
  },

  // Actions
  actions: {
    save: 'Salva',
    cancel: 'Annulla',
    confirm: 'Conferma',
    delete: 'Elimina',
    edit: 'Modifica',
    back: 'Indietro',
    done: 'Fatto',
  },
} as const;
