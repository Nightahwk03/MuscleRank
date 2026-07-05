// --- data.js ---
const INITIAL_MUSCLES = [
    { id: 'chest', name: 'Chest', xp: 0, rank: 'Wood 1' },
    { id: 'biceps', name: 'Biceps', xp: 0, rank: 'Wood 1' },
    { id: 'triceps', name: 'Triceps', xp: 0, rank: 'Wood 1' },
    { id: 'shoulders', name: 'Shoulders', xp: 0, rank: 'Wood 1' },
    { id: 'lats', name: 'Lats', xp: 0, rank: 'Wood 1' },
    { id: 'quads', name: 'Quads', xp: 0, rank: 'Wood 1' },
    { id: 'hamstrings', name: 'Hamstrings', xp: 0, rank: 'Wood 1' },
    { id: 'calves', name: 'Calves', xp: 0, rank: 'Wood 1' },
    { id: 'core', name: 'Core', xp: 0, rank: 'Wood 1' },
    { id: 'forearms', name: 'Forearms', xp: 0, rank: 'Wood 1' },
    { id: 'glutes', name: 'Glutes', xp: 0, rank: 'Wood 1' },
    { id: 'traps', name: 'Traps', xp: 0, rank: 'Wood 1' },
    { id: 'upper_back', name: 'Upper Back', xp: 0, rank: 'Wood 1' },
    { id: 'lower_back', name: 'Lower Back', xp: 0, rank: 'Wood 1' },
    { id: 'neck', name: 'Neck', xp: 0, rank: 'Wood 1' }
];

const INITIAL_EXERCISES = [
    { id: 'bench_press', name: 'Bench Press', type: 'compound', hasWarmup: true, muscleContributions: { chest: 0.7, triceps: 0.2, shoulders: 0.1 } },
    { id: 'bicep_curl', name: 'Bicep Curl', type: 'isolation', muscleContributions: { biceps: 1.0 } },
    { id: 'squat', name: 'Barbell Squat', type: 'compound', hasWarmup: true, muscleContributions: { quads: 0.6, hamstrings: 0.2, core: 0.2 } },
    { id: 'deadlift', name: 'Deadlift', type: 'compound', hasWarmup: true, muscleContributions: { hamstrings: 0.4, lats: 0.3, core: 0.2, quads: 0.1 } },
    { id: 'pullup', name: 'Pull-up', type: 'compound', hasWarmup: true, muscleContributions: { lats: 0.7, biceps: 0.3 } }
];

const MAJOR_RANKS = [
    { name: 'Wood', start: 0, end: 400, colorClass: 'rank-wood' },
    { name: 'Bronze', start: 400, end: 900, colorClass: 'rank-bronze' },
    { name: 'Silver', start: 900, end: 1800, colorClass: 'rank-silver' },
    { name: 'Gold', start: 1800, end: 4000, colorClass: 'rank-gold' },
    { name: 'Diamond', start: 4000, end: 10000, colorClass: 'rank-diamond' },
    { name: 'Platinum', start: 10000, end: 23000, colorClass: 'rank-platinum' },
    { name: 'Obsidian', start: 23000, end: 50000, colorClass: 'rank-obsidian' },
    { name: 'Titanium', start: 50000, end: 120000, colorClass: 'rank-titanium' },
    { name: 'Demon', start: 120000, end: 250000, colorClass: 'rank-demon' }
];

const RANKS = [];
MAJOR_RANKS.forEach(rank => {
    const gap = rank.end - rank.start;
    const tierSize = gap / 5;
    for (let i = 1; i <= 5; i++) {
        RANKS.push({
            name: `${rank.name} ${i}`,
            threshold: rank.start + (tierSize * (i - 1)),
            colorClass: rank.colorClass
        });
    }
});

// --- storage.js ---
const SUPABASE_URL = 'https://zqamwfxcfaeagdgwrfqw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYW13ZnhjZmFlYWdkZ3dyZnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTUwMzQsImV4cCI6MjA5ODY3MTAzNH0.rZL2l5QzCa6cK6fKjaEXR_Ni19GTAyoOK52q8DXX91k';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const SupabaseModule = {
    currentUser: null,
    syncTimeout: null,
    async checkSession() {
        const { data } = await supabaseClient.auth.getSession();
        if (data.session) {
            this.currentUser = data.session.user;
            await this.pullData();
            return true;
        }
        return false;
    },
    async login(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.currentUser = data.user;
        await this.pullData();
    },
    async register(email, password) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        this.currentUser = data.user;
        await this.pushData();
    },
    async logout() {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            await this.pushData();
        }
        await supabaseClient.auth.signOut();
        this.currentUser = null;
        localStorage.clear();
        location.reload();
    },
    async pullData() {
        if (!this.currentUser) return;
        const { data, error } = await supabaseClient.from('user_data').select('data').eq('id', this.currentUser.id).single();
        if (error && error.code !== 'PGRST116') {
            console.error('Pull Data Error:', error);
        }
        if (data && data.data) {
            const payload = data.data;
            for (const key in payload) {
                if (typeof payload[key] === 'object' && payload[key] !== null) {
                    localStorage.setItem(key, JSON.stringify(payload[key]));
                } else {
                    localStorage.setItem(key, payload[key]);
                }
            }
        }
    },
    async pushData() {
        if (!this.currentUser) return;
        const payload = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('mr_')) {
                payload[key] = localStorage.getItem(key);
            }
        }
        const syncStatus = document.getElementById('cloud-sync-status');
        if (syncStatus) syncStatus.innerHTML = '<span style="color: #bbb;">Syncing...</span>';

        const { error } = await supabaseClient.from('user_data').upsert({
            id: this.currentUser.id,
            data: payload
        });
        if (error) {
            console.error('Push Data Error:', error);
            const errMsg = error.message || JSON.stringify(error);
            if (syncStatus) syncStatus.innerHTML = '<div style="color: #ff4444; margin-top: 5px; text-align: left; background: rgba(255,0,0,0.1); padding: 5px; border-radius: 4px; font-size: 0.75rem; border: 1px solid #ff4444;">⚠️ Sync Failed:<br>' + errMsg + '</div>';
        } else {
            if (syncStatus) syncStatus.innerHTML = '<span style="color: #00ff00;">✅ Saved to Cloud</span>';
            setTimeout(() => { if (syncStatus) syncStatus.innerHTML = ''; }, 3000);
        }
    },
    scheduleSync() {
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            this.pushData();
        }, 3000);
    }
};

const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage', e);
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            if (window.supabase) {
                SupabaseModule.scheduleSync();
            }
        } catch (e) {
            console.error('Error writing to localStorage', e);
        }
    },
    clear() {
        localStorage.clear();
    }
};

// --- changelog.js ---
const ChangeLogModule = {
    logs: [],
    init() {
        this.logs = Storage.get('mr_changelog', []);
    },
    log(type, message) {
        const entry = {
            id: 'log_' + Date.now(),
            type, // 'create', 'edit', 'delete', 'workout'
            message,
            timestamp: new Date().toISOString()
        };
        this.logs.unshift(entry);
        Storage.set('mr_changelog', this.logs);
    },
    getAllLogs() { return this.logs; }
};

// --- settings.js ---
const SettingsModule = {
    settings: { unit: 'lbs', bodyweight: 150, weeklyGoal: 5, streakMultiplier: 1.0, lastStreakEval: null },
    history: [],
    init() {
        this.settings = Storage.get('mr_settings', { unit: 'lbs', bodyweight: 150, weeklyGoal: 5, streakMultiplier: 1.0, lastStreakEval: null });
        this.history = Storage.get('mr_bodyweight_history', []);
        
        // Ensure defaults if missing in existing storage
        if (this.settings.weeklyGoal === undefined) this.settings.weeklyGoal = 5;
        if (this.settings.streakMultiplier === undefined) this.settings.streakMultiplier = 1.0;
        
        if (this.history.length === 0) {
            // Seed initial data point
            this.history.push({ date: new Date().toISOString(), weight: this.settings.bodyweight });
            Storage.set('mr_bodyweight_history', this.history);
        }
    },
    save(unit, bodyweight, weeklyGoal) {
        this.settings.unit = unit;
        this.settings.bodyweight = bodyweight;
        this.settings.weeklyGoal = weeklyGoal;
        
        Storage.set('mr_settings', this.settings);
        
        // Log to history
        this.history.push({ date: new Date().toISOString(), weight: bodyweight });
        Storage.set('mr_bodyweight_history', this.history);
        
        ChangeLogModule.log('edit', `Updated settings: ${bodyweight} ${unit}, ${weeklyGoal} days/week`);
    },
    updateStreak(newMultiplier) {
        this.settings.streakMultiplier = newMultiplier;
        this.settings.lastStreakEval = new Date().toISOString();
        Storage.set('mr_settings', this.settings);
    },
    getSettings() { return this.settings; },
    getHistory() { return this.history; }
};



// --- streak.js ---
const StreakEngine = {
    evaluate() {
        const settings = SettingsModule.getSettings();
        const history = HistoryModule.getAllHistory();
        
        const now = new Date();
        const currentWeekStart = this.getStartOfWeek(now);
        
        let lastEval = settings.lastStreakEval ? new Date(settings.lastStreakEval) : null;
        
        if (!lastEval) {
            // First time evaluation, just set timestamp so we evaluate NEXT week
            SettingsModule.updateStreak(1.0);
            return;
        }

        let evalWeekStart = this.getStartOfWeek(lastEval);
        
        if (currentWeekStart.getTime() === evalWeekStart.getTime()) {
            return; // Still in the same week, no evaluation needed yet
        }
        
        let newMultiplier = settings.streakMultiplier;
        
        while (evalWeekStart.getTime() < currentWeekStart.getTime()) {
            const evalWeekEnd = new Date(evalWeekStart);
            evalWeekEnd.setDate(evalWeekEnd.getDate() + 6);
            evalWeekEnd.setHours(23, 59, 59, 999);
            
            const uniqueDays = new Set();
            history.forEach(h => {
                const hDate = new Date(h.date);
                if (hDate.getTime() >= evalWeekStart.getTime() && hDate.getTime() <= evalWeekEnd.getTime()) {
                    uniqueDays.add(hDate.toLocaleDateString());
                }
            });
            
            if (uniqueDays.size >= settings.weeklyGoal) {
                newMultiplier += 0.1;
            } else {
                newMultiplier -= 0.1;
                if (newMultiplier < 1.0) newMultiplier = 1.0;
            }
            
            evalWeekStart.setDate(evalWeekStart.getDate() + 7);
        }
        
        newMultiplier = Math.round(newMultiplier * 10) / 10;
        SettingsModule.updateStreak(newMultiplier);
    },
    getStartOfWeek(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday is start of week
        return new Date(d.setDate(diff));
    }
};

// --- exercise.js ---
const ExerciseModule = {
    exercises: [],
    init() {
        this.exercises = Storage.get('mr_exercises', INITIAL_EXERCISES);
        if (!Storage.get('mr_exercises')) Storage.set('mr_exercises', this.exercises);
    },
    getAllExercises() { return this.exercises; },
    getExerciseById(id) { return this.exercises.find(ex => ex.id === id); },
    saveExercise(id, name, type, primaryMuscle, secondaryMuscles, description, hasWarmup, isBodyweight) {
        let contributions = { [primaryMuscle]: 1.0 };
        secondaryMuscles.forEach(m => contributions[m] = 0.3);
        const exData = {
            id: id || 'ex_' + Date.now(),
            name,
            type,
            description,
            hasWarmup: type === 'compound' ? !!hasWarmup : false,
            isBodyweight: !!isBodyweight,
            muscleContributions: contributions,
            isCustom: true
        };
        if (id) {
            const index = this.exercises.findIndex(e => e.id === id);
            if (index !== -1) {
                this.exercises[index] = exData;
                ChangeLogModule.log('edit', `Edited exercise: ${name}`);
            } else {
                this.exercises.push(exData);
                ChangeLogModule.log('create', `Created exercise: ${name}`);
            }
        } else {
            this.exercises.push(exData);
            ChangeLogModule.log('create', `Created exercise: ${name}`);
        }
        Storage.set('mr_exercises', this.exercises);
        return exData;
    },
    deleteExercise(id) {
        const ex = this.getExerciseById(id);
        if (ex) {
            this.exercises = this.exercises.filter(e => e.id !== id);
            Storage.set('mr_exercises', this.exercises);
            ChangeLogModule.log('delete', `Deleted exercise: ${ex.name}`);
        }
    }
};

// --- ranking.js ---
const RankingModule = {
    muscles: [],
    init() {
        let stored = Storage.get('mr_muscles');
        if (!stored) {
            this.muscles = INITIAL_MUSCLES;
            Storage.set('mr_muscles', this.muscles);
        } else {
            // Merge missing muscles (e.g., if forearms was just added)
            INITIAL_MUSCLES.forEach(im => {
                if (!stored.find(m => m.id === im.id)) {
                    stored.push(im);
                }
            });
            this.muscles = stored;
            Storage.set('mr_muscles', this.muscles);
        }
    },
    getAllMuscles() { return this.muscles; },
    calculateExerciseXP(topWeight, reps, userBodyweight, streakMultiplier) {
        const baseExp = 50;
        let weightMultiplier = 0;
        
        if (topWeight === 0) {
            weightMultiplier = 0;
        } else {
            const ratio = topWeight / userBodyweight;
            if (ratio <= 0.5) weightMultiplier = 0.8;
            else if (ratio <= 0.75) weightMultiplier = 0.9;
            else if (ratio <= 1.0) weightMultiplier = 1.0;
            else if (ratio <= 1.25) weightMultiplier = 1.1;
            else if (ratio <= 1.5) weightMultiplier = 1.2;
            else if (ratio <= 1.75) weightMultiplier = 1.3;
            else if (ratio <= 2.0) weightMultiplier = 1.5;
            else {
                const excess = ratio - 2.0;
                weightMultiplier = 1.5 + (Math.floor(excess / 0.25) + 1) * 0.2;
            }
        }
        
        let repMultiplier = 1.0;
        if (reps >= 1 && reps <= 5) repMultiplier = 0.8;
        else if (reps >= 6 && reps <= 11) repMultiplier = 1.2;
        else if (reps >= 12) repMultiplier = 1.0;
        
        const finalExp = Math.floor(baseExp * weightMultiplier * repMultiplier * streakMultiplier);
        return finalExp;
    },
    distributeXP(exerciseId, rawXP, exerciseModule, isWarmup = false) {
        const exercise = exerciseModule.getExerciseById(exerciseId);
        if (!exercise) return [];
        let rankUps = [];
        
        // Find primary muscle (the one with the highest contribution percentage)
        const maxContribution = Math.max(...Object.values(exercise.muscleContributions));

        Object.entries(exercise.muscleContributions).forEach(([muscleId, percentage]) => {
            const isPrimary = percentage === maxContribution;
            
            let actualPercentage = percentage;
            if (isWarmup) {
                if (isPrimary) actualPercentage = 0.8 * percentage;
                else actualPercentage = 0.25; // As per user request, secondary muscles get 0.25x exp during warmup
            }
            
            const xpGained = Math.floor(rawXP * actualPercentage);
            const muscleIndex = this.muscles.findIndex(m => m.id === muscleId);
            if (muscleIndex !== -1) {
                const currentMuscle = this.muscles[muscleIndex];
                currentMuscle.xp += xpGained;
                const oldRank = currentMuscle.rank;
                const newRankInfo = this.getRankForXP(currentMuscle.xp);
                if (oldRank !== newRankInfo.name) {
                    currentMuscle.rank = newRankInfo.name;
                    rankUps.push({ muscleName: currentMuscle.name, newRank: currentMuscle.rank });
                }
            }
        });
        Storage.set('mr_muscles', this.muscles);
        return rankUps;
    },
    getRankForXP(xp) {
        return [...RANKS].reverse().find(r => xp >= r.threshold) || RANKS[0];
    },
    getNextRank(currentRankName) {
        const index = RANKS.findIndex(r => r.name === currentRankName);
        if (index === -1 || index === RANKS.length - 1) return null;
        return RANKS[index + 1];
    }
};

// Workout tracking has been removed and will be built in a future module.

// --- history.js ---
const HistoryModule = {
    history: [],
    init() { this.history = Storage.get('mr_history', []); },
    saveWorkout(workoutData) {
        this.history.unshift(workoutData);
        Storage.set('mr_history', this.history);
        ChangeLogModule.log('workout', `Completed Workout: ${workoutData.name}`);
    },
    getAllHistory() { return this.history; },
    deleteWorkout(id) {
        this.history = this.history.filter(w => w.id !== id);
        Storage.set('mr_history', this.history);
    }
};

const DraftModule = {
    drafts: [],
    init() { this.drafts = Storage.get('mr_workout_drafts', []); },
    saveDraft(draftData) {
        // If updating an existing draft, remove the old one first
        if (draftData.draftId) {
            this.drafts = this.drafts.filter(d => d.draftId !== draftData.draftId);
        } else {
            draftData.draftId = 'draft_' + Date.now();
        }
        draftData.updatedAt = new Date().toISOString();
        this.drafts.unshift(draftData);
        Storage.set('mr_workout_drafts', this.drafts);
    },
    deleteDraft(draftId) {
        this.drafts = this.drafts.filter(d => d.draftId !== draftId);
        Storage.set('mr_workout_drafts', this.drafts);
    },
    getAllDrafts() { return this.drafts; },
    getDraftById(id) { return this.drafts.find(d => d.draftId === id); }
};

// --- pokemon.js ---
const PokemonModule = {
    unlocked: [],
    unlockedShiny: [],
    init() {
        this.unlocked = Storage.get('mr_pokemon_unlocked', []);
        this.unlockedShiny = Storage.get('mr_pokemon_shiny', []);
    },
    unlockRandom() {
        if (typeof POKEMON_SPRITES === 'undefined' || typeof SHINY_POKEMON_SPRITES === 'undefined') return null;
        
        const unobtainedRegular = POKEMON_SPRITES.filter(sprite => !this.unlocked.includes(sprite));
        const unobtainedShiny = SHINY_POKEMON_SPRITES.filter(sprite => !this.unlockedShiny.includes(sprite));
        
        if (unobtainedRegular.length === 0 && unobtainedShiny.length === 0) return null; // Fully complete
        
        let rollShiny = Math.random() < 0.05;
        if (unobtainedRegular.length === 0) rollShiny = true;
        if (unobtainedShiny.length === 0) rollShiny = false;
        
        if (rollShiny) {
            const randomIndex = Math.floor(Math.random() * unobtainedShiny.length);
            const unlockedSprite = unobtainedShiny[randomIndex];
            this.unlockedShiny.push(unlockedSprite);
            Storage.set('mr_pokemon_shiny', this.unlockedShiny);
            ChangeLogModule.log('create', `Unlocked a new SHINY Pokemon!`);
            return { sprite: unlockedSprite, isShiny: true };
        } else {
            const randomIndex = Math.floor(Math.random() * unobtainedRegular.length);
            const unlockedSprite = unobtainedRegular[randomIndex];
            this.unlocked.push(unlockedSprite);
            Storage.set('mr_pokemon_unlocked', this.unlocked);
            ChangeLogModule.log('create', `Unlocked a new Pokemon!`);
            return { sprite: unlockedSprite, isShiny: false };
        }
    },
    getUnlocked() { return this.unlocked; },
    getUnlockedShiny() { return this.unlockedShiny; }
};

// --- team.js ---
const TeamModule = {
    team: [null, null, null, null, null, null],
    init() {
        this.team = Storage.get('mr_team', [null, null, null, null, null, null]);
    },
    setSlot(index, sprite, isShiny) {
        // Validation: cannot have 2 same pokemon unless one is shiny
        // Pokemon are identified by their base filename, e.g. "1.png"
        const isDuplicate = this.team.some((slot, i) => {
            if (i === index) return false; // Ignore the slot we're replacing
            if (slot && slot.sprite === sprite) {
                // If the sprite filename matches, they must not have the same isShiny status
                if (slot.isShiny === isShiny) return true;
            }
            return false;
        });
        
        if (isDuplicate) {
            return false; // Failed to set due to duplication rule
        }
        
        this.team[index] = { sprite, isShiny };
        Storage.set('mr_team', this.team);
        return true;
    },
    getTeam() {
        return this.team;
    },
    removeSlot(index) {
        this.team[index] = null;
        Storage.set('mr_team', this.team);
    }
};

// --- template.js ---
const TemplateModule = {
    templates: [],
    init() { this.templates = Storage.get('mr_templates', []); },
    saveTemplate(templateData) {
        const index = this.templates.findIndex(t => t.id === templateData.id);
        if (index !== -1) {
            this.templates[index] = templateData;
            ChangeLogModule.log('edit', `Edited Workout Routine: ${templateData.name}`);
        } else {
            this.templates.push(templateData);
            ChangeLogModule.log('create', `Created Workout Routine: ${templateData.name}`);
        }
        Storage.set('mr_templates', this.templates);
    },
    deleteTemplate(id) {
        const t = this.getTemplateById(id);
        if (t) {
            this.templates = this.templates.filter(temp => temp.id !== id);
            Storage.set('mr_templates', this.templates);
            ChangeLogModule.log('delete', `Deleted Workout Routine: ${t.name}`);
        }
    },
    getAllTemplates() { return this.templates; },
    getTemplateById(id) { return this.templates.find(t => t.id === id); }
};

// --- main.js Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // If testing the new colors, uncomment the line below to reset your data ONCE
    // Storage.clear();

    ChangeLogModule.init();
    SettingsModule.init();
    PokemonModule.init();
    TeamModule.init();
    ExerciseModule.init();
    HistoryModule.init();
    DraftModule.init();
    RankingModule.init();
    TemplateModule.init();
    PullLogModule.init();

    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const muscleListEl = document.getElementById('muscle-list');
    
    // Workout Template DOM
    const workoutTemplatesView = document.getElementById('workout-templates-view');
    const templatesList = document.getElementById('templates-list');
    const createTemplateBtn = document.getElementById('create-template-btn');
    const templateBuilderView = document.getElementById('template-builder-view');
    const templateIdInput = document.getElementById('template-id');
    const templateNameInput = document.getElementById('template-name');
    const templateExercisesContainer = document.getElementById('template-exercises-container');
    const templateExerciseSelect = document.getElementById('template-exercise-select');
    const addToTemplateBtn = document.getElementById('add-to-template-btn');
    const saveTemplateBtn = document.getElementById('save-template-btn');
    const cancelTemplateBtn = document.getElementById('cancel-template-btn');

    const finishWorkoutBtn = document.getElementById('finish-workout-btn');
    const workoutActive = document.getElementById('workout-active');
    const activeExercisesEl = document.getElementById('active-exercises');
    const exerciseSelect = document.getElementById('exercise-select');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const workoutTimerEl = document.getElementById('workout-timer');
    const historyListEl = document.getElementById('history-list');
    const rankUpModal = document.getElementById('rank-up-modal');
    const rankUpMessage = document.getElementById('rank-up-message');
    const closeModalBtn = document.getElementById('close-modal-btn');
    


    closeModalBtn.addEventListener('click', () => {
        rankUpModal.classList.add('hidden');
    });

    let workoutTimerInterval = null;
    let workoutSeconds = 0;

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            Storage.set('mr_last_view', target);
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Mark the parent section active (for visual state)
            document.querySelectorAll('.sidebar-section').forEach(g => g.classList.remove('active'));
            const parentGroup = btn.closest('.sidebar-section');
            if (parentGroup) parentGroup.classList.add('active');

            views.forEach(v => {
                if(v.id === target) v.classList.remove('hidden');
                else v.classList.add('hidden');
            });
            
            if (target === 'statistics') renderStatistics();
            if (target === 'muscle-rankings') renderDashboard();
            if (target === 'record-session') renderRecordSession();
            if (target === 'workout-log') renderWorkoutLog();
            if (target === 'exercise-master') renderExercisesMaster();
            if (target === 'workout-master') renderTemplatesList();
            if (target === 'change-log') renderChangeLog();
            if (target === 'settings') renderSettings();
            if (target === 'profile') renderProfile();
            if (target === 'pack-pull') renderPackPull();
            if (target === 'pull-log') renderPullLog();
            if (target === 'pokeweight') renderPokeweight();
            if (target === 'analytics') renderAnalytics();
            // Close mobile menu on click
            const sidebar = document.getElementById('sidebar');
            if (sidebar && window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }
    
    // Close muscle tooltip on outside click
    document.addEventListener('click', (e) => {
        const tooltip = document.getElementById('muscle-tooltip');
        if (tooltip && !tooltip.classList.contains('hidden')) {
            if (!e.target.closest('.muscle-path')) {
                tooltip.style.opacity = '0';
                setTimeout(() => tooltip.classList.add('hidden'), 200);
            }
        }
    });

    function renderChangeLog() {
        const list = document.getElementById('change-log-list');
        list.innerHTML = '';
        const logs = ChangeLogModule.getAllLogs();
        if (logs.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary);">No activity recorded yet.</p>';
            return;
        }
        logs.forEach(log => {
            const d = new Date(log.timestamp);
            const entry = document.createElement('div');
            entry.className = `change-log-entry ${log.type}`;
            entry.innerHTML = `
                <div class="log-timestamp">${d.toLocaleString()}</div>
                <div class="log-content">${log.message}</div>
            `;
            list.appendChild(entry);
        });
    }

    function renderSettings() {
        const settings = SettingsModule.getSettings();
        document.getElementById('settings-weight-unit').value = settings.unit;
        
        const goalSelect = document.getElementById('settings-weekly-goal');
        if (goalSelect) goalSelect.value = settings.weeklyGoal || 5;
        
        renderScrollPicker('bodyweight-picker', Math.round(settings.bodyweight), 50, 400);
        
        const manualInput = document.getElementById('manual-bodyweight-input');
        if (manualInput) manualInput.value = settings.bodyweight;
        const unitLabel = document.getElementById('bodyweight-unit-label');
        if (unitLabel) unitLabel.textContent = settings.unit;
        
        document.getElementById('final-settings-display').textContent = `${settings.bodyweight} ${settings.unit}`;
        const finalGoalDisplay = document.getElementById('final-settings-goal-display');
        if (finalGoalDisplay) finalGoalDisplay.textContent = settings.weeklyGoal || 5;
        
        document.getElementById('settings-display-view').classList.remove('hidden');
        document.getElementById('settings-edit-view').classList.add('hidden');
    }

    function renderProfile() {
        if (SupabaseModule.currentUser) {
            const emailEl = document.getElementById('profile-email-display');
            if (emailEl) emailEl.textContent = SupabaseModule.currentUser.email;
        }
    }

    let currentPokemonType = 'regular'; // 'regular' or 'shiny'
    let currentPokemonFilter = 'all';
    
    function renderPokemon() {
        if (typeof POKEMON_SPRITES === 'undefined' || typeof SHINY_POKEMON_SPRITES === 'undefined') return;
        const grid = document.getElementById('pokemon-grid');
        const countDisplay = document.getElementById('pokemon-count-display');
        
        const isShiny = currentPokemonType === 'shiny';
        const allSprites = isShiny ? SHINY_POKEMON_SPRITES : POKEMON_SPRITES;
        const unlocked = isShiny ? PokemonModule.getUnlockedShiny() : PokemonModule.getUnlocked();
        
        grid.innerHTML = '';
        
        let displaySprites = [];
        if (currentPokemonFilter === 'all') {
            displaySprites = allSprites;
        } else if (currentPokemonFilter === 'obtained') {
            displaySprites = unlocked;
        } else if (currentPokemonFilter === 'unobtained') {
            displaySprites = allSprites.filter(s => !unlocked.includes(s));
        }

        const folder = isShiny ? 'Shiny Pokemon' : 'pokemon-sprites';

        displaySprites.forEach(sprite => {
            const isObtained = unlocked.includes(sprite);
            const card = document.createElement('div');
            card.className = `pokemon-card ${isObtained ? 'obtained' : 'unobtained'}`;
            if (isShiny) {
                card.style.borderColor = isObtained ? 'rgba(255, 215, 0, 0.5)' : '#2A1642';
                if (isObtained) {
                    card.style.background = 'rgba(255, 215, 0, 0.05)';
                    const badge = document.createElement('div');
                    badge.className = 'shiny-badge';
                    badge.textContent = 'SHINY';
                    card.appendChild(badge);
                }
            }
            const imgClass = isShiny ? 'shiny-sprite' : '';
            card.innerHTML += `<img src="${folder}/${sprite}" class="${imgClass}" alt="Pokemon" loading="lazy">`;
            
            const currentTeam = TeamModule.getTeam();
            const inTeam = currentTeam.some(slot => slot && slot.sprite === sprite && slot.isShiny === isShiny);
            
            if (inTeam) {
                card.innerHTML += `<div class="in-team-badge">In Team</div>`;
            }
            
            grid.appendChild(card);
        });

        countDisplay.textContent = `Obtained: ${unlocked.length} / ${allSprites.length}`;
    }

    document.querySelectorAll('.pokemon-type-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.pokemon-type-tab').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentPokemonType = e.target.dataset.type;
            renderPokemon();
        });
    });

    document.querySelectorAll('.pokemon-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.pokemon-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentPokemonFilter = e.target.dataset.filter;
            renderPokemon();
        });
    });

    // --- Team UI Logic ---
    let activeTeamSlotIndex = null;

    function renderTeam() {
        const grid = document.getElementById('team-grid');
        grid.innerHTML = '';
        const team = TeamModule.getTeam();
        
        for (let i = 0; i < 6; i++) {
            const slotData = team[i];
            const slotEl = document.createElement('div');
            
            if (slotData) {
                slotEl.className = 'team-slot filled';
                const folder = slotData.isShiny ? 'Shiny Pokemon' : 'pokemon-sprites';
                
                slotEl.innerHTML = `
                    <img src="${folder}/${slotData.sprite}" alt="Team Member">
                    ${slotData.isShiny ? '<div class="shiny-badge">SHINY</div>' : ''}
                    <div style="display: flex; gap: 5px; width: 100%;">
                        <button class="action-btn secondary-btn" style="flex: 1; padding: 0.3rem; font-size: 0.8rem;" onclick="window.openTeamSelectModal(${i})">Edit</button>
                        <button class="action-btn" style="flex: 1; padding: 0.3rem; font-size: 0.8rem; border: 1px solid #ff4444; color: #ff4444; background: transparent;" onclick="window.removeTeamSlot(${i})">Remove</button>
                    </div>
                `;
            } else {
                slotEl.className = 'team-slot';
                slotEl.innerHTML = `
                    <div style="color: var(--text-secondary); margin-bottom: 20px;">Empty Slot</div>
                    <button class="action-btn primary-btn" style="width: 100%; padding: 0.3rem; font-size: 0.8rem;" onclick="window.openTeamSelectModal(${i})">Add Pokemon</button>
                `;
            }
            grid.appendChild(slotEl);
        }
    }

    window.removeTeamSlot = function(index) {
        TeamModule.removeSlot(index);
        renderTeam();
    };

    window.openTeamSelectModal = function(index) {
        activeTeamSlotIndex = index;
        const modal = document.getElementById('team-select-modal');
        const grid = document.getElementById('team-select-grid');
        grid.innerHTML = '';
        
        const unlockedRegular = PokemonModule.getUnlocked();
        const unlockedShiny = PokemonModule.getUnlockedShiny();
        const currentTeam = TeamModule.getTeam();
        
        let allUnlocked = [
            ...unlockedRegular.map(s => ({ sprite: s, isShiny: false })),
            ...unlockedShiny.map(s => ({ sprite: s, isShiny: true }))
        ];
        
        // Filter out pokemon already on the team (excluding the current slot being edited)
        allUnlocked = allUnlocked.filter(p => {
            const isAssigned = currentTeam.some((slot, i) => {
                if (i === activeTeamSlotIndex) return false;
                if (slot && slot.sprite === p.sprite && slot.isShiny === p.isShiny) return true;
                return false;
            });
            return !isAssigned;
        });
        
        if (allUnlocked.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">You have not obtained any Pokemon yet.</p>';
        } else {
            allUnlocked.forEach(p => {
                const folder = p.isShiny ? 'Shiny Pokemon' : 'pokemon-sprites';
                const card = document.createElement('div');
                card.className = 'pokemon-card obtained';
                card.style.cursor = 'pointer';
                if (p.isShiny) {
                    card.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                    card.style.background = 'rgba(255, 215, 0, 0.05)';
                    card.innerHTML = '<div class="shiny-badge">SHINY</div>';
                }
                const imgClass = p.isShiny ? 'shiny-sprite' : '';
                card.innerHTML += `<img src="${folder}/${p.sprite}" class="${imgClass}" alt="Pokemon" loading="lazy">`;
                
                card.addEventListener('click', () => {
                    const success = TeamModule.setSlot(activeTeamSlotIndex, p.sprite, p.isShiny);
                    if (success) {
                        modal.classList.add('hidden');
                        renderTeam();
                    } else {
                        alert("You cannot have two of the exact same Pokemon on your team unless one of them is a Shiny!");
                    }
                });
                grid.appendChild(card);
            });
        }
        
        modal.classList.remove('hidden');
    };

    

    // --- Analytics UI Logic ---
    const AnalyticsModule = {
        chartInstance: null,
        currentDate: new Date()
    };

    function renderAnalytics() {
        const settings = SettingsModule.getSettings();
        const streakEl = document.getElementById('analytics-streak-display');
        const goalEl = document.getElementById('analytics-goal-display');
        if (streakEl) streakEl.textContent = `${(settings.streakMultiplier || 1.0).toFixed(1)}x`;
        if (goalEl) goalEl.textContent = settings.weeklyGoal || 5;
        
        const filterSelect = document.getElementById('analytics-filter');
        const workoutsGroup = document.getElementById('analytics-workouts-group');
        const exercisesGroup = document.getElementById('analytics-exercises-group');
        const monthSelect = document.getElementById('cal-month-select');
        const yearSelect = document.getElementById('cal-year-select');
        
        // Populate Templates
        workoutsGroup.innerHTML = '';
        TemplateModule.getAllTemplates().forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            workoutsGroup.appendChild(opt);
        });

        // Populate Exercises
        exercisesGroup.innerHTML = '';
        ExerciseModule.getAllExercises().forEach(e => {
            const opt = document.createElement('option');
            opt.value = 'ex_' + e.id;
            opt.textContent = e.name;
            exercisesGroup.appendChild(opt);
        });

        // Populate Years (2000 to 2050)
        yearSelect.innerHTML = '';
        for (let y = 2000; y <= 2050; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        }

        // Set initial select values
        monthSelect.value = AnalyticsModule.currentDate.getMonth();
        yearSelect.value = AnalyticsModule.currentDate.getFullYear();

        // Event Listeners
        filterSelect.onchange = () => {
            renderAnalyticsGraph(filterSelect.value);
            renderAnalyticsCalendar(filterSelect.value, AnalyticsModule.currentDate);
        };
        
        monthSelect.onchange = () => {
            AnalyticsModule.currentDate.setMonth(parseInt(monthSelect.value));
            renderAnalyticsCalendar(filterSelect.value, AnalyticsModule.currentDate);
        };

        yearSelect.onchange = () => {
            AnalyticsModule.currentDate.setFullYear(parseInt(yearSelect.value));
            renderAnalyticsCalendar(filterSelect.value, AnalyticsModule.currentDate);
        };

        // Initial Render
        renderAnalyticsGraph(filterSelect.value);
        renderAnalyticsCalendar(filterSelect.value, AnalyticsModule.currentDate);
    }

    function renderAnalyticsGraph(filterValue) {
        if (AnalyticsModule.chartInstance) {
            AnalyticsModule.chartInstance.destroy();
        }
        
        const ctx = document.getElementById('analytics-chart').getContext('2d');
        let labels = [];
        let datasets = [];
        let yAxesConfig = {
            y: { ticks: { color: '#a0aabf' }, grid: { color: '#2A1642' } }
        };

        if (filterValue === 'overall_bodyweight') {
            const history = SettingsModule.getHistory().sort((a,b) => new Date(a.date) - new Date(b.date));
            const dataPoints = [];
            
            if (history.length > 0) {
                const startDate = new Date(history[0].date);
                startDate.setHours(0,0,0,0);
                const endDate = new Date(); // Fill up to today
                endDate.setHours(0,0,0,0);
                
                let currentIndex = 0;
                let currentWeight = history[0].weight;
                
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    // Find the latest weight entered on or before the current loop date
                    while (currentIndex < history.length - 1) {
                        const nextEntryDate = new Date(history[currentIndex + 1].date);
                        nextEntryDate.setHours(0,0,0,0);
                        if (nextEntryDate.getTime() <= d.getTime()) {
                            currentIndex++;
                            currentWeight = history[currentIndex].weight;
                        } else {
                            break;
                        }
                    }
                    labels.push(new Date(d).toLocaleDateString());
                    dataPoints.push(currentWeight);
                }
            }
            datasets.push({
                label: 'Bodyweight (' + SettingsModule.getSettings().unit + ')',
                data: dataPoints,
                borderColor: '#00C3FF',
                backgroundColor: 'rgba(176, 38, 255, 0.1)',
                tension: 0.4,
                fill: true
            });
        } else if (filterValue.startsWith('ex_')) {
            const exId = filterValue.replace('ex_', '');
            let history = HistoryModule.getAllHistory();
            const dateMap = {};
            
            history.forEach(h => {
                const exLogs = h.exercises.filter(e => e.id === exId);
                if (exLogs.length > 0) {
                    const dateStr = new Date(h.date).toLocaleDateString();
                    if (!dateMap[dateStr]) dateMap[dateStr] = { maxWeight: 0, totalVolume: 0 };
                    
                    exLogs.forEach(log => {
                        log.sets.forEach(set => {
                            if (set.reps > 0 && set.weight > 0) {
                                dateMap[dateStr].totalVolume += (set.reps * set.weight);
                                if (set.weight > dateMap[dateStr].maxWeight) {
                                    dateMap[dateStr].maxWeight = set.weight;
                                }
                            }
                        });
                    });
                }
            });
            
            labels = Object.keys(dateMap).sort((a,b) => new Date(a) - new Date(b));
            const weightPoints = labels.map(l => dateMap[l].maxWeight);
            const volumePoints = labels.map(l => dateMap[l].totalVolume);
            
            datasets.push({
                label: 'Max Weight',
                data: weightPoints,
                borderColor: '#FFD700', // Gold
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                tension: 0.4,
                yAxisID: 'y'
            });
            datasets.push({
                label: 'Total Volume',
                data: volumePoints,
                borderColor: '#39FF14', // Neon Green
                backgroundColor: 'rgba(0, 255, 102, 0.1)',
                tension: 0.4,
                yAxisID: 'y1'
            });
            
            yAxesConfig = {
                y: { type: 'linear', display: true, position: 'left', ticks: { color: '#FFD700' }, grid: { color: '#2A1642' } },
                y1: { type: 'linear', display: true, position: 'right', ticks: { color: '#39FF14' }, grid: { drawOnChartArea: false } }
            };
        } else {
            let history = HistoryModule.getAllHistory();
            if (filterValue !== 'overall_volume') {
                history = history.filter(h => h.templateId === filterValue);
            }
            
            // Group by date
            const volumeMap = {};
            history.forEach(h => {
                const dateStr = new Date(h.date).toLocaleDateString();
                if(!volumeMap[dateStr]) volumeMap[dateStr] = 0;
                volumeMap[dateStr] += h.totalVolume;
            });
            
            // Sort dates
            labels = Object.keys(volumeMap).sort((a,b) => new Date(a) - new Date(b));
            const dataPoints = labels.map(l => volumeMap[l]);
            
            datasets.push({
                label: 'Total Volume',
                data: dataPoints,
                borderColor: '#00C3FF',
                backgroundColor: 'rgba(176, 38, 255, 0.1)',
                tension: 0.4,
                fill: true
            });
        }

        AnalyticsModule.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#a0aabf' }, grid: { color: '#2A1642' } },
                    ...yAxesConfig
                },
                plugins: {
                    legend: { labels: { color: '#ffffff' } }
                }
            }
        });
    }

    function renderAnalyticsCalendar(filterValue, dateObj) {
        const grid = document.getElementById('calendar-grid');
        const monthSelect = document.getElementById('cal-month-select');
        const yearSelect = document.getElementById('cal-year-select');
        grid.innerHTML = '';
        
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        
        if (monthSelect && yearSelect) {
            monthSelect.value = month;
            yearSelect.value = year;
        }
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Find days to highlight or display data
        const highlightedDays = new Set();
        const bodyweightMap = {};
        
        if (filterValue !== 'overall_bodyweight') {
            let history = HistoryModule.getAllHistory();
            if (filterValue.startsWith('ex_')) {
                const exId = filterValue.replace('ex_', '');
                history = history.filter(h => h.exercises.some(e => e.id === exId));
            } else if (filterValue !== 'overall_volume') {
                history = history.filter(h => h.templateId === filterValue);
            }
            history.forEach(h => {
                const hDate = new Date(h.date);
                if (hDate.getFullYear() === year && hDate.getMonth() === month) {
                    highlightedDays.add(hDate.getDate());
                }
            });
        } else {
            const bwHistory = SettingsModule.getHistory().sort((a,b) => new Date(a.date) - new Date(b.date));
            if (bwHistory.length > 0) {
                let currentWeight = bwHistory[0].weight;
                let currentIndex = 0;
                
                const today = new Date();
                today.setHours(0,0,0,0);
                
                const firstLogDate = new Date(bwHistory[0].date);
                firstLogDate.setHours(0,0,0,0);

                for (let i = 1; i <= daysInMonth; i++) {
                    const currentLoopDate = new Date(year, month, i);
                    currentLoopDate.setHours(0,0,0,0);
                    
                    // Stop filling if we are past today
                    if (currentLoopDate.getTime() > today.getTime()) break;

                    // Advance currentIndex if there's a newer weight on or before this day
                    while (currentIndex < bwHistory.length - 1) {
                        const nextDate = new Date(bwHistory[currentIndex + 1].date);
                        nextDate.setHours(0,0,0,0);
                        if (nextDate.getTime() <= currentLoopDate.getTime()) {
                            currentIndex++;
                            currentWeight = bwHistory[currentIndex].weight;
                        } else {
                            break;
                        }
                    }
                    
                    // Only display if the current day is after or equal to the very first log
                    if (currentLoopDate.getTime() >= firstLogDate.getTime()) {
                        highlightedDays.add(i);
                        bodyweightMap[i] = currentWeight;
                    }
                }
            }
        }
        
        // Blank cells before first day
        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement('div');
            blank.className = 'calendar-day empty';
            grid.appendChild(blank);
        }
        
        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.style.flexDirection = 'column'; // Allow stacking text
            dayCell.innerHTML = `<span>${i}</span>`;
            
            if (highlightedDays.has(i)) {
                dayCell.classList.add('highlighted');
                if (filterValue === 'overall_bodyweight' && bodyweightMap[i] !== undefined) {
                    dayCell.innerHTML += `<div style="font-size: 0.65rem; margin-top: 2px; color: #FFD700;">${bodyweightMap[i]} ${SettingsModule.getSettings().unit}</div>`;
                }
            }
            grid.appendChild(dayCell);
        }
    }

    // Scroll Picker Logic
    function renderScrollPicker(pickerId, currentValue, min, max) {
        const picker = document.getElementById(pickerId);
        if(!picker) return;
        picker.innerHTML = '';
        let activeIndex = 0;
        let index = 0;
        for(let i = min; i <= max; i++) {
            const item = document.createElement('div');
            item.className = 'scroll-picker-item';
            item.textContent = i;
            item.dataset.val = i;
            if (i === currentValue) {
                item.classList.add('active');
                activeIndex = index;
            }
            picker.appendChild(item);
            index++;
        }
        
        // Initial Position
        const itemHeight = 40;
        picker.style.transform = `translateY(${55 - (activeIndex * itemHeight)}px)`;
        
        // Drag logic
        let isDragging = false;
        let startY = 0;
        let currentTranslate = 55 - (activeIndex * itemHeight);
        let prevTranslate = currentTranslate;

        const updateActiveItem = (translate) => {
            const items = picker.querySelectorAll('.scroll-picker-item');
            items.forEach(i => i.classList.remove('active'));
            let idx = Math.round((55 - translate) / itemHeight);
            if(idx < 0) idx = 0;
            if(idx >= items.length) idx = items.length - 1;
            
            const activeItem = items[idx];
            if (activeItem) {
                activeItem.classList.add('active');
                const manualInput = document.getElementById('manual-bodyweight-input');
                // Only update the manual input if the user isn't actively typing in it
                if (manualInput && document.activeElement !== manualInput) {
                    manualInput.value = activeItem.dataset.val;
                }
            }
            return idx;
        };

        picker.onmousedown = (e) => {
            isDragging = true;
            startY = e.clientY;
        };
        document.onmousemove = (e) => {
            if(!isDragging) return;
            const dy = e.clientY - startY;
            currentTranslate = prevTranslate + dy;
            picker.style.transform = `translateY(${currentTranslate}px)`;
            updateActiveItem(currentTranslate);
        };
        document.onmouseup = () => {
            if(!isDragging) return;
            isDragging = false;
            let idx = updateActiveItem(currentTranslate);
            const items = picker.querySelectorAll('.scroll-picker-item');
            if(idx < 0) idx = 0;
            if(idx >= items.length) idx = items.length - 1;
            
            currentTranslate = 55 - (idx * itemHeight);
            picker.style.transform = `translateY(${currentTranslate}px)`;
            prevTranslate = currentTranslate;
        };
    }

    document.getElementById('edit-settings-btn').addEventListener('click', () => {
        document.getElementById('settings-display-view').classList.add('hidden');
        document.getElementById('settings-edit-view').classList.remove('hidden');
    });

    document.getElementById('settings-weight-unit').addEventListener('change', (e) => {
        const unitLabel = document.getElementById('bodyweight-unit-label');
        if (unitLabel) unitLabel.textContent = e.target.value;
    });

    document.getElementById('cancel-settings-btn').addEventListener('click', () => {
        document.getElementById('settings-display-view').classList.remove('hidden');
        document.getElementById('settings-edit-view').classList.add('hidden');
    });

    document.getElementById('save-settings-btn').addEventListener('click', () => {
        const unit = document.getElementById('settings-weight-unit').value;
        const goalSelect = document.getElementById('settings-weekly-goal');
        const weeklyGoal = goalSelect ? parseInt(goalSelect.value) : 5;
        const manualInput = document.getElementById('manual-bodyweight-input');
        const weight = manualInput && manualInput.value ? parseFloat(manualInput.value) : 150;
        SettingsModule.save(unit, weight, weeklyGoal);
        renderSettings();
        alert('Settings saved!');
    });

    document.getElementById('reset-data-btn').addEventListener('click', () => {
        const confirmed = confirm("Are you sure you want to reset all progress data? This will wipe your Workout Logs, Ranks, XP, and Pull Logs, but will keep your Templates, Exercises, Profile, and Settings intact.");
        if (confirmed) {
            // Reset History (Workout Logs)
            Storage.set('mr_history', []);
            HistoryModule.init();
            DraftModule.init();

            // Reset Muscles (Ranks & XP)
            // We stringify/parse to deep clone INITIAL_MUSCLES so we don't accidentally mutate the const array
            Storage.set('mr_muscles', JSON.parse(JSON.stringify(INITIAL_MUSCLES)));
            RankingModule.init();

            // Reset Pull Logs
            Storage.set('mr_pull_logs', []);
            PullLogModule.init();
            
            // Reset Pokemon Collection
            Storage.set('mr_pokemon_unlocked', []);
            Storage.set('mr_pokemon_shiny', []);
            PokemonModule.init();
            
            // Future placeholders for Shop, Exp
            Storage.set('mr_exp', 0);
            Storage.set('mr_shop', []);

            // Clear Change Log
            Storage.set('mr_changelog', []);
            ChangeLogModule.init();
            
            alert('Data reset successfully! Your progress and workout logs have been wiped.');
        }
    });



    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to sign out?")) {
                SupabaseModule.logout();
            }
        });
    }

    let statisticsPopulated = false;

    function renderStatistics() {
        const grid = document.getElementById('statistics-grid');
        grid.innerHTML = '';
        
        const history = HistoryModule.getAllHistory();
        const settings = SettingsModule.getSettings();
        const muscles = RankingModule.getAllMuscles();
        
        // 1. Perfect Weeks
        const weeklyGoal = settings.weeklyGoal || 3;
        const weekMap = {};
        history.forEach(h => {
            const weekStr = StreakEngine.getStartOfWeek(h.date).toISOString();
            if (!weekMap[weekStr]) weekMap[weekStr] = 0;
            weekMap[weekStr]++;
        });
        let perfectWeeks = 0;
        for (const w in weekMap) {
            if (weekMap[w] >= weeklyGoal) perfectWeeks++;
        }
        
        // 2. Streak Multiplier
        const streakMultiplier = (settings.streakMultiplier || 1.0).toFixed(1) + 'x';
        
        // 3. Highest Rank
        let sortedMuscles = [...muscles].sort((a, b) => b.xp - a.xp);
        const topMuscle = sortedMuscles[0];
        const highestRankText = topMuscle ? `${topMuscle.rank}<br><span style="font-size:1rem; color:var(--text-secondary);">${topMuscle.name}</span>` : 'N/A';
        
        // 4. Area of Improvement
        const bottom3 = [...muscles].sort((a, b) => a.xp - b.xp).slice(0, 3);
        const improvementText = bottom3.length > 0 ? bottom3.map(m => `${m.name} (${m.rank})`).join('<br>') : 'N/A';
        
        const cardsData = [
            { title: 'Perfect Weeks', value: perfectWeeks, color: '#B026FF', bg: 'linear-gradient(135deg, rgba(176, 38, 255, 0.1), rgba(0, 0, 0, 0.4))' },
            { title: 'Streak Multiplier', value: streakMultiplier, color: '#9B30FF', bg: 'linear-gradient(135deg, rgba(155, 48, 255, 0.1), rgba(0, 0, 0, 0.4))' },
            { title: 'Highest Rank', value: highestRankText, color: '#DA70D6', bg: 'linear-gradient(135deg, rgba(218, 112, 214, 0.1), rgba(0, 0, 0, 0.4))' },
            { title: 'Area of Improvement', value: improvementText, color: '#8A2BE2', bg: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(0, 0, 0, 0.4))' }
        ];
        
        cardsData.forEach(c => {
            const card = document.createElement('div');
            card.style.background = c.bg;
            card.style.border = `1px solid ${c.color}`;
            card.style.borderRadius = '16px';
            card.style.padding = '30px 20px';
            card.style.textAlign = 'center';
            card.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.5)`;
            card.style.backdropFilter = 'blur(12px)';
            card.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'center';
            card.style.alignItems = 'center';
            
            // Dynamic Hover Micro-animations
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = `0 15px 40px ${c.color}40, 0 0 10px ${c.color}40 inset`;
                card.style.border = `1px solid ${c.color}`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.5)`;
                card.style.border = `1px solid ${c.color}`;
            });

            card.innerHTML = `
                <h3 style="color: ${c.color}; margin: 0 0 15px 0; font-size: 1.0rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">${c.title}</h3>
                <div style="color: #fff; font-size: 1.8rem; font-weight: 900; text-shadow: 0 0 15px ${c.color}80; line-height: 1.4;">${c.value}</div>
            `;
            grid.appendChild(card);
        });
    }

    function renderDashboard() {
        const settings = SettingsModule.getSettings();
        const streakEl = document.getElementById('dashboard-streak-display');
        const goalEl = document.getElementById('dashboard-goal-display');
        if (streakEl) streakEl.textContent = settings.streakMultiplier.toFixed(1) + 'x';
        if (goalEl) goalEl.textContent = settings.weeklyGoal || 5;

        muscleListEl.innerHTML = '';
        const muscles = RankingModule.getAllMuscles();

        const getRankVisuals = (rankName) => {
            const parts = rankName.split(' ');
            const baseRank = parts[0]; 
            const tierStr = parts[1];
            
            const mapping = {
                'Unranked': { solid: '#FFFFFF', gradient: '#FFFFFF' },
                'Wood': { solid: '#D2B48C', gradient: 'linear-gradient(135deg, #D2B48C, #A0522D)' },
                'Bronze': { solid: '#CD7F32', gradient: 'linear-gradient(135deg, #8B4513, #FFA500)' },
                'Silver': { solid: '#C0C0C0', gradient: 'linear-gradient(135deg, #D3D3D3, #FFFFFF)' },
                'Gold': { solid: '#FFD700', gradient: 'linear-gradient(135deg, #FFD700, #DAA520)' },
                'Diamond': { solid: '#9B30FF', gradient: 'linear-gradient(135deg, #8A2BE2, #FFFFFF)' },
                'Platinum': { solid: '#E5E4E2', gradient: 'linear-gradient(135deg, #FFC0CB, #FFFFFF, #A9A9A9)' },
                'Obsidian': { solid: '#4B0082', gradient: 'linear-gradient(135deg, #000000, #4B0082)' },
                'Titanium': { solid: '#E6E6FA', gradient: 'linear-gradient(135deg, #808080, #C0C0C0, #FFFFFF)' },
                'Demon': { solid: '#FF4500', gradient: 'linear-gradient(135deg, #FF0000, #FF4500, #FFFF00)' }
            };
            const baseVisuals = mapping[baseRank] || mapping['Unranked'];
            
            if (baseRank === 'Unranked' || !tierStr) return baseVisuals;
            
            const tier = parseInt(tierStr);
            // Tier 1: +0.24, Tier 2: +0.12, Tier 3: 0, Tier 4: -0.12, Tier 5: -0.24
            const percent = (3 - tier) * 0.12;
            if (percent === 0) return baseVisuals;
            
            const shadeHexColor = (color, percent) => {
                const f = parseInt(color.slice(1), 16),
                      t = percent < 0 ? 0 : 255,
                      p = percent < 0 ? percent * -1 : percent,
                      R = f >> 16,
                      G = f >> 8 & 0x00FF,
                      B = f & 0x0000FF;
                return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
            };
            
            return {
                solid: shadeHexColor(baseVisuals.solid, percent),
                gradient: baseVisuals.gradient.replace(/#[0-9a-fA-F]{6}/g, match => shadeHexColor(match, percent))
            };
        };

        const muscleToSlugs = {
            'chest': ['chest'],
            'biceps': ['biceps'],
            'triceps': ['triceps'],
            'shoulders': ['deltoids'],
            'lats': ['lats'],
            'quads': ['quadriceps'],
            'hamstrings': ['hamstring'],
            'calves': ['calves'],
            'core': ['abs', 'obliques'],
            'forearms': ['forearm'],
            'glutes': ['gluteal'],
            'traps': ['trapezius'],
            'upper_back': ['upper-back'],
            'lower_back': ['lower-back'],
            'neck': ['neck']
        };

        muscles.forEach(muscle => {
            const currentRank = RankingModule.getRankForXP(muscle.xp);
            const visuals = getRankVisuals(currentRank.name);
            
            const slugs = muscleToSlugs[muscle.id] || [];
            slugs.forEach(slug => {
                const paths = document.querySelectorAll(`.muscle-path[data-muscle="${slug}"]`);
                paths.forEach(el => {
                    el.style.fill = visuals.solid;
                    
                    // Store dataset properties for the tooltip click listener
                    el.dataset.muscleName = muscle.name;
                    el.dataset.rankName = currentRank.name;
                    el.dataset.rankColor = visuals.solid;

                    // Lowered drop shadow slightly because the paths are tightly packed
                    if(currentRank.name !== 'Unranked') el.style.filter = `drop-shadow(0 0 3px ${visuals.solid})`;
                    else el.style.filter = 'none';
                    
                    // Add click listener for tooltip
                    el.style.cursor = 'pointer';
                    el.addEventListener('click', (e) => {
                        const tooltip = document.getElementById('muscle-tooltip');
                        if (tooltip) {
                            tooltip.innerHTML = `<strong>${muscle.name}</strong><br><span style="color:${visuals.solid}">${currentRank.name}</span>`;
                            tooltip.style.left = e.pageX + 'px';
                            tooltip.style.top = (e.pageY - 40) + 'px';
                            tooltip.classList.remove('hidden');
                            tooltip.style.opacity = '1';
                            
                            // Auto hide
                            setTimeout(() => {
                                tooltip.style.opacity = '0';
                                setTimeout(() => tooltip.classList.add('hidden'), 200);
                            }, 2500);
                        }
                    });
                });
            });
        });

        muscles.forEach(muscle => {
            const currentRank = RankingModule.getRankForXP(muscle.xp);
            const nextRank = RankingModule.getNextRank(currentRank.name);
            const visuals = getRankVisuals(currentRank.name);
            
            let progressPercent = 100;
            let xpText = `${muscle.xp} XP`;
            if (nextRank) {
                const xpInCurrentRank = muscle.xp - currentRank.threshold;
                const xpNeededForNext = nextRank.threshold - currentRank.threshold;
                progressPercent = (xpInCurrentRank / xpNeededForNext) * 100;
                xpText = `${muscle.xp} / ${nextRank.threshold} XP`;
            }

            const card = document.createElement('div');
            card.className = `muscle-card ${currentRank.colorClass || ''}`;
            card.innerHTML = `
                <div class="muscle-header">
                    <span>${muscle.name.toUpperCase()}</span>
                    <span class="rank-text" style="color: ${visuals.solid}">${currentRank.name.toUpperCase()}</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${progressPercent}%; background: ${visuals.gradient}; box-shadow: 0 0 10px ${visuals.solid}"></div>
                </div>
                <div style="text-align: right; font-size: 0.8rem; margin-top: 0.3rem; color: var(--text-secondary);">
                    ${xpText}
                </div>
            `;
            muscleListEl.appendChild(card);
        });
    }

    // --- EXERCISE MASTER LOGIC ---
    const exForm = document.getElementById('exercise-form');
    const exTypeSelect = document.getElementById('ex-type');
    const exWarmupGroup = document.getElementById('ex-warmup-group');
    const exWarmupCheckbox = document.getElementById('ex-warmup');
    const exPrimarySelect = document.getElementById('ex-primary');
    const secDropdownTrigger = document.getElementById('sec-dropdown-trigger');
    const secOptionsContainer = document.getElementById('sec-options-container');
    const exMasterList = document.getElementById('exercise-master-list');
    const exCancelBtn = document.getElementById('cancel-ex-btn');
    const exFormPanel = document.getElementById('exercise-form-panel');
    const exLibraryPanel = document.getElementById('exercise-library-panel');
    const showExFormBtn = document.getElementById('show-ex-form-btn');

    showExFormBtn.addEventListener('click', () => {
        exFormPanel.classList.remove('hidden');
        exLibraryPanel.classList.add('hidden');
        showExFormBtn.classList.add('hidden');
        document.getElementById('confirm-ex-btn').textContent = 'Confirm';
        exForm.reset();
        document.getElementById('ex-id').value = '';
    });

    exTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'compound') {
            exWarmupGroup.classList.remove('hidden');
        } else {
            exWarmupGroup.classList.add('hidden');
            exWarmupCheckbox.checked = false;
        }
    });

    secDropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        secOptionsContainer.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-multi-select')) {
            secOptionsContainer.classList.add('hidden');
        }
    });

    exPrimarySelect.addEventListener('change', (e) => {
        const primary = e.target.value;
        document.querySelectorAll('.multi-select-option').forEach(opt => {
            const cb = opt.querySelector('input[type="checkbox"]');
            if (cb.value === primary) {
                opt.classList.add('disabled');
                cb.checked = false;
            } else {
                opt.classList.remove('disabled');
            }
        });
        updateSecondaryTriggerText();
    });

    function updateSecondaryTriggerText() {
        const selectedCbs = Array.from(document.querySelectorAll('.multi-select-option input[type="checkbox"]:checked'));
        if (selectedCbs.length === 0) {
            secDropdownTrigger.innerHTML = 'Select Secondary Muscles <span class="arrow">▼</span>';
        } else {
            const names = selectedCbs.map(cb => cb.nextElementSibling.textContent).join(', ');
            secDropdownTrigger.innerHTML = `<span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block; max-width:90%;">${names}</span> <span class="arrow">▼</span>`;
        }
    }

    function populateMuscleSelects() {
        const muscles = RankingModule.getAllMuscles();
        exPrimarySelect.innerHTML = '<option value="" selected>Select Primary Muscle</option>';
        secOptionsContainer.innerHTML = '';
        
        muscles.forEach(m => {
            // Primary Dropdown
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name;
            exPrimarySelect.appendChild(opt);
            
            // Secondary Checkboxes
            const optDiv = document.createElement('label');
            optDiv.className = 'multi-select-option';
            optDiv.innerHTML = `<input type="checkbox" value="${m.id}"> <span>${m.name}</span>`;
            
            const cb = optDiv.querySelector('input[type="checkbox"]');
            cb.addEventListener('change', updateSecondaryTriggerText);
            
            secOptionsContainer.appendChild(optDiv);
        });
    }

    function renderExercisesMaster() {
        populateMuscleSelects();
        renderExerciseMasterList();
    }

    function renderExerciseMasterList() {
        exMasterList.innerHTML = '';
        const exercises = ExerciseModule.getAllExercises();
        
        exercises.forEach(ex => {
            const card = document.createElement('div');
            card.className = 'exercise-card';
            
            let primary = [];
            let secondary = [];
            if (ex.muscleContributions) {
                Object.entries(ex.muscleContributions).forEach(([mId, val]) => {
                    const mName = RankingModule.getAllMuscles().find(m => m.id === mId)?.name || mId;
                    if (val === 1.0) primary.push(mName);
                    else secondary.push(mName);
                });
            }
            
            card.innerHTML = `
                <div class="exercise-card-info">
                    <h4>${ex.name} ${ex.isCustom ? '<span style="font-size:0.7rem; color:var(--gold); border:1px solid var(--gold); padding:2px 4px; border-radius:4px; margin-left:6px;">Custom</span>' : ''}${ex.hasWarmup ? '<span style="font-size:0.7rem; color:var(--neon-primary); border:1px solid var(--neon-primary); padding:2px 4px; border-radius:4px; margin-left:6px;">Warmup</span>' : ''}</h4>
                    <p><strong>Primary:</strong> ${primary.join(', ') || 'N/A'}</p>
                    ${secondary.length > 0 ? `<p><strong>Secondary:</strong> ${secondary.join(', ')}</p>` : ''}
                </div>
                <div class="exercise-card-actions">
                    <button class="edit-ex-btn" data-id="${ex.id}">Edit</button>
                    <button class="delete-ex-btn" data-id="${ex.id}">Delete</button>
                </div>
            `;
            exMasterList.appendChild(card);
        });

        // Attach edit/delete listeners
        document.querySelectorAll('.edit-ex-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const ex = ExerciseModule.getExerciseById(id);
                if(ex) editExercise(ex);
            });
        });
        
        document.querySelectorAll('.delete-ex-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(confirm('Delete this exercise?')) {
                    ExerciseModule.deleteExercise(e.target.dataset.id);
                    renderExerciseMasterList();
                }
            });
        });
    }

    function editExercise(ex) {
        document.getElementById('ex-id').value = ex.id;
        document.getElementById('ex-name').value = ex.name;
        document.getElementById('ex-type').value = ex.type || 'compound';
        document.getElementById('ex-desc').value = ex.description || '';
        
        // Reset selections
        exPrimarySelect.value = '';
        document.querySelectorAll('.multi-select-option input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.multi-select-option').classList.remove('disabled');
        });
        
        if (ex.muscleContributions) {
            Object.entries(ex.muscleContributions).forEach(([mId, val]) => {
                if (val === 1.0) {
                    exPrimarySelect.value = mId;
                } else {
                    const cb = document.querySelector(`.multi-select-option input[value="${mId}"]`);
                    if(cb) cb.checked = true;
                }
            });
            // Disable the primary muscle in the secondary list
            if (exPrimarySelect.value) {
                const primaryCb = document.querySelector(`.multi-select-option input[value="${exPrimarySelect.value}"]`);
                if(primaryCb) primaryCb.closest('.multi-select-option').classList.add('disabled');
            }
        }
        
        exWarmupCheckbox.checked = !!ex.hasWarmup;
        if (ex.type === 'compound') exWarmupGroup.classList.remove('hidden');
        else exWarmupGroup.classList.add('hidden');
        
        const exIsBodyweightCheckbox = document.getElementById('ex-is-bodyweight');
        if (exIsBodyweightCheckbox) {
            exIsBodyweightCheckbox.checked = !!ex.isBodyweight;
        }
        
        updateSecondaryTriggerText();
        
        document.getElementById('confirm-ex-btn').textContent = 'Update Confirm';
        exFormPanel.classList.remove('hidden');
        exLibraryPanel.classList.add('hidden');
        showExFormBtn.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    exCancelBtn.addEventListener('click', () => {
        exForm.reset();
        document.getElementById('ex-id').value = '';
        exWarmupGroup.classList.add('hidden');
        exWarmupCheckbox.checked = false;
        const exIsBodyweightCheckbox = document.getElementById('ex-is-bodyweight');
        if (exIsBodyweightCheckbox) exIsBodyweightCheckbox.checked = false;
        document.querySelectorAll('.multi-select-option input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.multi-select-option').classList.remove('disabled');
        });
        updateSecondaryTriggerText();
        document.getElementById('confirm-ex-btn').textContent = 'Confirm';
        exFormPanel.classList.add('hidden');
        exLibraryPanel.classList.remove('hidden');
        showExFormBtn.classList.remove('hidden');
    });

    document.getElementById('draft-ex-btn').addEventListener('click', () => {
        alert('Draft saved! (Placeholder for future functionality)');
        exCancelBtn.click();
    });

    exForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('ex-id').value;
        const name = document.getElementById('ex-name').value;
        const type = document.getElementById('ex-type').value;
        const desc = document.getElementById('ex-desc').value;
        const primary = exPrimarySelect.value;
        const hasWarmup = exWarmupCheckbox.checked;
        const isBodyweight = document.getElementById('ex-is-bodyweight') ? document.getElementById('ex-is-bodyweight').checked : false;
        
        const secondary = [];
        document.querySelectorAll('.multi-select-option input[type="checkbox"]:checked').forEach(cb => {
            if (cb.value !== primary) secondary.push(cb.value);
        });
        
        ExerciseModule.saveExercise(id, name, type, primary, secondary, desc, hasWarmup, isBodyweight);
        
        exCancelBtn.click(); // Reset form
        renderExerciseMasterList();
    });


    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    // --- WORKOUT TEMPLATE LOGIC ---
    let pendingTemplateExercises = [];

    function renderTemplatesList() {
        workoutTemplatesView.classList.remove('hidden');
        templateBuilderView.classList.add('hidden');
        
        templatesList.innerHTML = '';
        const templates = TemplateModule.getAllTemplates();
        if (templates.length === 0) {
            templatesList.innerHTML = '<p style="color:var(--text-secondary)">No templates yet. Create one!</p>';
            return;
        }
        templates.forEach(t => {
            const validExercisesCount = t.exercises.filter(ex => ExerciseModule.getExerciseById(ex.id)).length;
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="display:flex; align-items:center; gap: 8px;">
                            <h4 style="margin:0 0 5px 0;">${t.name}</h4>
                            ${t.isDraft ? '<span class="draft-badge" style="background:var(--surface); color:var(--text-secondary); padding:2px 6px; border-radius:4px; font-size:0.7rem; border:1px solid var(--border);">DRAFT</span>' : ''}
                        </div>
                        <p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">${validExercisesCount} Exercises</p>
                    </div>
                    <div style="display:flex; gap:5px; flex-direction:column; align-items:flex-end;">
                        <div style="display:flex; gap:5px;">
                            <button class="action-btn secondary-btn edit-template-btn" data-id="${t.id}" style="padding:0.3rem 0.6rem; font-size:0.8rem; border-color:var(--text-secondary); color:var(--text-secondary);">Edit</button>
                            <button class="action-btn danger-btn delete-template-btn" data-id="${t.id}" style="padding:0.3rem 0.6rem; font-size:0.8rem; margin:0;">Delete</button>
                        </div>
                    </div>
                </div>
            `;
            templatesList.appendChild(card);
        });

        document.querySelectorAll('.edit-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tpl = TemplateModule.getTemplateById(e.target.dataset.id);
                if (!tpl) return;
                
                workoutTemplatesView.classList.add('hidden');
                templateBuilderView.classList.remove('hidden');
                
                templateIdInput.value = tpl.id;
                templateNameInput.value = tpl.name;
                pendingTemplateExercises = [...tpl.exercises];
                renderTemplateBuilderExercises();
                
                let optionsHtml = '<option value="" disabled selected>Select Exercise...</option>';
                ExerciseModule.getAllExercises().forEach(ex => {
                    optionsHtml += `<option value="${ex.id}">${ex.name}</option>`;
                });
                templateExerciseSelect.innerHTML = optionsHtml;
                
                document.getElementById('template-builder-view').querySelector('h2').textContent = 'Edit Workout Routine';
                saveTemplateBtn.textContent = 'Update Routine';
            });
        });

        document.querySelectorAll('.delete-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Are you sure you want to delete this routine?')) {
                    TemplateModule.deleteTemplate(e.target.dataset.id);
                    renderTemplatesList();
                }
            });
        });
    }

    createTemplateBtn.addEventListener('click', () => {
        workoutTemplatesView.classList.add('hidden');
        templateBuilderView.classList.remove('hidden');
        
        templateIdInput.value = '';
        templateNameInput.value = '';
        pendingTemplateExercises = [];
        renderTemplateBuilderExercises();
        
        document.getElementById('template-builder-view').querySelector('h2').textContent = 'Create Workout Routine';
        saveTemplateBtn.textContent = 'Save Routine';
        
        let optionsHtml = '<option value="" disabled selected>Select Exercise...</option>';
        ExerciseModule.getAllExercises().forEach(ex => {
            optionsHtml += `<option value="${ex.id}">${ex.name}</option>`;
        });
        templateExerciseSelect.innerHTML = optionsHtml;
    });

    cancelTemplateBtn.addEventListener('click', () => {
        templateBuilderView.classList.add('hidden');
        workoutTemplatesView.classList.remove('hidden');
    });

    addToTemplateBtn.addEventListener('click', () => {
        const exId = templateExerciseSelect.value;
        if (!exId) return;
        
        // Prevent duplicate exercises in the same routine
        if (pendingTemplateExercises.some(ex => ex.id === exId)) {
            alert('Exercise already added to this routine.');
            return;
        }

        pendingTemplateExercises.push({ id: exId, setsCount: 3 });
        renderTemplateBuilderExercises();
        templateExerciseSelect.value = '';
    });

    function renderTemplateBuilderExercises() {
        templateExercisesContainer.innerHTML = '';
        let totalSets = 0;

        pendingTemplateExercises.forEach((exData, idx) => {
            const dbEx = ExerciseModule.getExerciseById(exData.id);
            if (!dbEx) return; // Skip deleted exercises
            
            totalSets += exData.setsCount;
            if (dbEx.hasWarmup) totalSets += 1;
            
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.background = 'rgba(255,255,255,0.05)';
            row.style.padding = '10px';
            row.style.borderRadius = '8px';
            row.innerHTML = `
                <div style="font-weight: 500; display: flex; align-items: center; gap: 8px;">
                    ${dbEx.name}
                    ${dbEx.hasWarmup ? '<span title="Includes Warmup Set" style="font-size: 0.7rem; color: var(--neon-primary); border: 1px solid var(--neon-primary); padding: 1px 4px; border-radius: 4px; line-height: 1;">W</span>' : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <label style="font-size: 0.85rem; color: var(--text-secondary);">Sets:</label>
                    <input type="number" min="${dbEx.hasWarmup ? '0' : '1'}" value="${exData.setsCount}" class="set-input" style="width: 50px; text-align: center;" data-idx="${idx}">
                    <button class="action-btn danger-btn remove-tpl-ex-btn" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.8rem;">X</button>
                </div>
            `;
            templateExercisesContainer.appendChild(row);
        });

        const totalSetsEl = document.getElementById('template-total-sets');
        if (totalSetsEl) {
            totalSetsEl.textContent = `${totalSets} Set${totalSets !== 1 ? 's' : ''} Total`;
        }

        document.querySelectorAll('.remove-tpl-ex-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                pendingTemplateExercises.splice(e.target.dataset.idx, 1);
                renderTemplateBuilderExercises();
            });
        });

        document.querySelectorAll('.set-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = e.target.dataset.idx;
                const dbEx = ExerciseModule.getExerciseById(pendingTemplateExercises[idx].id);
                const minSets = (dbEx && dbEx.hasWarmup) ? 0 : 1;
                const validatedSets = Math.max(minSets, Number(e.target.value));
                e.target.value = validatedSets;
                pendingTemplateExercises[idx].setsCount = validatedSets;
                renderTemplateBuilderExercises();
            });
        });
    }

    function saveTemplate(isDraft) {
        const name = templateNameInput.value.trim();
        const id = templateIdInput.value || ('tpl_' + Date.now());
        
        if (!name) return alert('Enter a routine name');
        
        // Clean up any deleted exercises before saving
        const validExercises = pendingTemplateExercises.filter(ex => ExerciseModule.getExerciseById(ex.id));
        
        if (validExercises.length === 0) return alert('Add at least one valid exercise');

        TemplateModule.saveTemplate({
            id,
            name,
            isDraft,
            exercises: validExercises
        });
        
        templateBuilderView.classList.add('hidden');
        workoutTemplatesView.classList.remove('hidden');
        renderTemplatesList();
    }

    saveTemplateBtn.addEventListener('click', () => saveTemplate(false));
    
    const saveDraftBtn = document.getElementById('save-draft-btn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => saveTemplate(true));
    }


    function showRankUpModal(rankUps) {
        let msgHtml = rankUps.map(r => `<strong>${r.muscleName}</strong> reached <span style="color:var(--gold)">${r.newRank}</span>!`).join('<br>');
        rankUpMessage.innerHTML = msgHtml;
        rankUpModal.classList.remove('hidden');
    }
    closeModalBtn.addEventListener('click', () => { rankUpModal.classList.add('hidden'); });

    function renderRecordSession() {
        const templatesContainer = document.getElementById('log-templates-list');
        templatesContainer.innerHTML = '';
        
        const drafts = DraftModule.getAllDrafts();
        drafts.forEach(d => {
            const card = document.createElement('div');
            card.className = 'log-template-card';
            card.style.border = '1px solid #FFD700'; // Gold border for drafts
            card.style.background = 'rgba(255, 215, 0, 0.05)';
            
            card.innerHTML = `
                <div class="log-template-header">
                    <div class="log-template-title" style="color: #FFD700;">${d.name} <span style="font-size:0.7rem; color:var(--text-secondary)">(DRAFT)</span></div>
                </div>
                <div class="log-template-exercises" style="display: block;">
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">Last updated: ${new Date(d.updatedAt).toLocaleString()}</div>
                    <button class="action-btn log-draft-btn" data-draftid="${d.draftId}" data-templateid="${d.templateId}" style="width: 100%; background: #FFD700; color: #000;">Resume Draft</button>
                    <button class="action-btn secondary-btn delete-draft-btn" data-draftid="${d.draftId}" style="width: 100%; margin-top: 10px;">Discard Draft</button>
                </div>
            `;
            templatesContainer.appendChild(card);
            
            card.querySelector('.log-draft-btn').addEventListener('click', (e) => {
                const draftId = e.target.dataset.draftid;
                const templateId = e.target.dataset.templateid;
                const draftData = DraftModule.getDraftById(draftId);
                openLogWorkoutModal(templateId, draftData);
            });

            card.querySelector('.delete-draft-btn').addEventListener('click', (e) => {
                if (confirm('Are you sure you want to discard this draft?')) {
                    DraftModule.deleteDraft(e.target.dataset.draftid);
                    renderRecordSession();
                }
            });
        });
        
        const templates = TemplateModule.getAllTemplates();
        if (templates.length === 0 && drafts.length === 0) {
            templatesContainer.innerHTML = '<p style="color:var(--text-secondary)">No routines available. Go to Workout Master to create one.</p>';
        } else {
            templates.forEach(t => {
                const card = document.createElement('div');
                card.className = 'log-template-card';
                let exercisesHtml = t.exercises.map(exRef => {
                    const dbEx = ExerciseModule.getExerciseById(exRef.id);
                    if(!dbEx) return '';
                    return `<li style="margin-bottom: 4px; color: var(--text-secondary); font-size: 0.9rem;">${dbEx.name} - ${exRef.setsCount} Sets ${dbEx.hasWarmup ? '(+1 Warmup)' : ''}</li>`;
                }).join('');
                
                card.innerHTML = `
                    <div class="log-template-header">
                        <div class="log-template-title">${t.name} ${t.isDraft ? '<span style="font-size:0.7rem; color:var(--text-secondary)">(Draft)</span>' : ''}</div>
                        <span class="chevron">▼</span>
                    </div>
                    <div class="log-template-exercises">
                        <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 15px;">
                            ${exercisesHtml}
                        </ul>
                        <button class="action-btn primary-btn log-workout-btn" data-id="${t.id}" style="width: 100%;">Log Workout</button>
                    </div>
                `;
                templatesContainer.appendChild(card);
                
                // Accordion toggle
                card.querySelector('.log-template-header').addEventListener('click', () => {
                    card.classList.toggle('active');
                });
            });
            
            document.querySelectorAll('.log-workout-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    openLogWorkoutModal(e.target.dataset.id);
                });
            });
        }
    }
    
    function deleteLoggedWorkout(workoutId) {
        const history = HistoryModule.getAllHistory();
        const workout = history.find(w => w.id === workoutId);
        if (!workout) return;

        // Deduct XP
        const userBw = SettingsModule.getSettings().bodyweight || 150;
        const currentStreakMult = SettingsModule.getSettings().streakMultiplier || 1.0;

        workout.exercises.forEach(exRef => {
            const dbEx = ExerciseModule.getExerciseById(exRef.id);
            if (!dbEx) return;
            let maxWeight = 0;
            let maxWeightReps = 0;
            
            exRef.sets.forEach(set => {
                if (set.completed && set.weight >= maxWeight) {
                    if (set.weight > maxWeight) {
                        maxWeight = set.weight;
                        maxWeightReps = set.reps;
                    } else if (set.weight === maxWeight && set.reps > maxWeightReps) {
                        maxWeightReps = set.reps;
                    }
                }
            });
            
            if (maxWeight === 0 && maxWeightReps === 0) return;
            if (dbEx.isBodyweight) {
                maxWeight += userBw;
            }
            
            const exXp = RankingModule.calculateExerciseXP(maxWeight, maxWeightReps, userBw, currentStreakMult);
            if (exXp > 0) {
                RankingModule.distributeXP(exRef.id, -exXp, ExerciseModule, false);
            }
        });

        // Ensure no muscle XP drops below 0
        RankingModule.getAllMuscles().forEach(muscle => {
            if (muscle.xp < 0) muscle.xp = 0;
            
            // Recalculate rank just in case it dropped below the threshold
            const newRankInfo = RankingModule.getRankForXP(muscle.xp);
            muscle.rank = newRankInfo.name;
        });
        Storage.set('mr_muscles', RankingModule.getAllMuscles());

        // Delete from history
        HistoryModule.deleteWorkout(workoutId);
        
        // Log in Change Log
        ChangeLogModule.log('delete', `Deleted logged workout: ${workout.name} (${new Date(workout.date).toLocaleDateString()})`);
        
        renderWorkoutLog();
        alert('Workout deleted and XP safely deducted.');
    }

    function renderWorkoutLog() {
        const historyListEl = document.getElementById('history-list');
        historyListEl.innerHTML = '';
        const history = HistoryModule.getAllHistory();
        if (history.length === 0) {
            historyListEl.innerHTML = '<p style="color:var(--text-secondary)">No past workouts logged yet.</p>';
            return;
        }
        history.forEach(workout => {
            const date = new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const card = document.createElement('div');
            card.className = 'history-card';
            let exercisesHtml = workout.exercises.map(ex => {
                const setsDone = ex.sets.filter(s => s.completed).length;
                return setsDone > 0 ? `${ex.name} (${setsDone} sets)` : '';
            }).filter(Boolean).join(', ');
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div class="date">${date}</div>
                        <div style="margin-bottom: 0.5rem; color: var(--neon-success); font-weight: bold;">${workout.name}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Volume:</strong> ${workout.totalVolume} ${SettingsModule.getSettings().unit}</div>
                    </div>
                    <button class="action-btn danger-btn delete-workout-btn" data-id="${workout.id}" style="padding: 4px 8px; font-size: 0.8rem; width: auto; min-width: 0; background: rgba(255, 68, 68, 0.1); border: 1px solid #ff4444; color: #ff4444;">DELETE</button>
                </div>
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    ${exercisesHtml}
                </div>
            `;
            
            card.querySelector('.delete-workout-btn').addEventListener('click', (e) => {
                if (confirm('Are you sure you want to delete this logged workout? The XP gained from this workout will be deducted from your muscles, which may result in a rank down.')) {
                    deleteLoggedWorkout(workout.id);
                }
            });
            
            historyListEl.appendChild(card);
        });
    }

    let currentLoggingTemplateId = null;
    let currentLoggingDraftId = null;
    function openLogWorkoutModal(templateId, draftData = null) {
        const tpl = TemplateModule.getTemplateById(templateId);
        if(!tpl) return;
        currentLoggingTemplateId = templateId;
        currentLoggingDraftId = draftData ? draftData.draftId : null;
        
        document.getElementById('active-workout-title').textContent = `Log: ${tpl.name}`;
        
        // Date picker
        if (draftData && draftData.date) {
            document.getElementById('workout-log-date').value = draftData.date.split('T')[0];
        } else {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            document.getElementById('workout-log-date').value = `${yyyy}-${mm}-${dd}`;
        }
        
        const container = document.getElementById('active-workout-exercises');
        container.innerHTML = '';
        const unit = SettingsModule.getSettings().unit;
        
        tpl.exercises.forEach((exRef, eIdx) => {
            const dbEx = ExerciseModule.getExerciseById(exRef.id);
            if(!dbEx) return;
            
            let exDraftData = null;
            if (draftData && draftData.exercises && draftData.exercises[eIdx]) {
                exDraftData = draftData.exercises[eIdx].sets;
            }
            
            const exDiv = document.createElement('div');
            exDiv.className = 'exercise-logging-block';
            exDiv.style.border = '1px solid #2A1642';
            exDiv.style.padding = '10px';
            exDiv.style.borderRadius = '8px';
            exDiv.style.background = 'rgba(0,0,0,0.2)';
            
            let html = `<h4 style="margin: 0 0 10px 0; color: var(--text-primary);">${dbEx.name}</h4>`;
            
            let setIndex = 0;
            if(dbEx.hasWarmup) {
                let wVal = '', rVal = '';
                if (exDraftData && exDraftData[setIndex]) {
                    wVal = exDraftData[setIndex].weight || '';
                    rVal = exDraftData[setIndex].reps || '';
                }
                html += `
                    <div class="set-row">
                        <label style="color: var(--neon-primary);">Warmup</label>
                        <input type="number" class="log-weight" data-eidx="${eIdx}" data-settype="warmup" value="${wVal}" placeholder="Wt (${unit})" min="0">
                        <input type="number" class="log-reps" data-eidx="${eIdx}" data-settype="warmup" value="${rVal}" placeholder="Reps" min="0">
                    </div>
                `;
                setIndex++;
            }
            
            for(let s = 1; s <= exRef.setsCount; s++) {
                let wVal = '', rVal = '';
                if (exDraftData && exDraftData[setIndex]) {
                    wVal = exDraftData[setIndex].weight || '';
                    rVal = exDraftData[setIndex].reps || '';
                }
                html += `
                    <div class="set-row">
                        <label>Set ${s}</label>
                        <input type="number" class="log-weight" data-eidx="${eIdx}" data-settype="regular" data-setidx="${s}" value="${wVal}" placeholder="Wt (${unit})" min="0">
                        <input type="number" class="log-reps" data-eidx="${eIdx}" data-settype="regular" data-setidx="${s}" value="${rVal}" placeholder="Reps" min="0">
                    </div>
                `;
                setIndex++;
            }
            exDiv.innerHTML = html;
            container.appendChild(exDiv);
        });
        
        document.getElementById('workout-logging-modal').classList.remove('hidden');
    }

    document.getElementById('cancel-workout-log-btn').addEventListener('click', () => {
        document.getElementById('workout-logging-modal').classList.add('hidden');
        currentLoggingTemplateId = null;
        currentLoggingDraftId = null;
    });

    document.getElementById('save-workout-draft-btn').addEventListener('click', () => {
        const tpl = TemplateModule.getTemplateById(currentLoggingTemplateId);
        if(!tpl) return;
        
        const loggedExercises = [];
        let totalVolume = 0;
        
        tpl.exercises.forEach((exRef, eIdx) => {
            const dbEx = ExerciseModule.getExerciseById(exRef.id);
            if(!dbEx) return;
            const sets = [];
            const weightInputs = document.querySelectorAll(`.log-weight[data-eidx="${eIdx}"]`);
            const repsInputs = document.querySelectorAll(`.log-reps[data-eidx="${eIdx}"]`);
            
            weightInputs.forEach((wInput, idx) => {
                const rInput = repsInputs[idx];
                const weight = Number(wInput.value) || 0;
                const reps = Number(rInput.value) || 0;
                sets.push({ weight, reps, completed: (weight > 0 || reps > 0), type: wInput.dataset.settype });
                if (weight > 0 || reps > 0) totalVolume += weight * reps;
            });
            
            loggedExercises.push({
                id: exRef.id,
                name: dbEx.name,
                sets: sets
            });
        });
        
        const logDateInput = document.getElementById('workout-log-date').value;
        const finalDate = logDateInput ? new Date(logDateInput).toISOString() : new Date().toISOString();
        
        const draftData = {
            draftId: currentLoggingDraftId,
            name: tpl.name,
            templateId: tpl.id,
            date: finalDate,
            totalVolume: totalVolume,
            exercises: loggedExercises
        };
        
        DraftModule.saveDraft(draftData);
        document.getElementById('workout-logging-modal').classList.add('hidden');
        currentLoggingTemplateId = null;
        currentLoggingDraftId = null;
        renderRecordSession(); 
        
        alert('Draft saved!');
    });

    document.getElementById('active-workout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const tpl = TemplateModule.getTemplateById(currentLoggingTemplateId);
        if(!tpl) return;
        
        const logDateInput = document.getElementById('workout-log-date').value;
        const finalDate = logDateInput ? new Date(logDateInput).toISOString() : new Date().toISOString();
        
        // Find user's bodyweight at the time of this workout
        let userBw = SettingsModule.getSettings().bodyweight;
        const bwHistory = SettingsModule.getHistory().sort((a,b) => new Date(a.date) - new Date(b.date));
        for (let i = bwHistory.length - 1; i >= 0; i--) {
            if (new Date(bwHistory[i].date).getTime() <= new Date(finalDate).getTime()) {
                userBw = bwHistory[i].weight;
                break;
            }
        }
        
        const loggedExercises = [];
        let totalVolume = 0;
        let totalWorkoutXP = 0;
        let allRankUps = [];
        
        tpl.exercises.forEach((exRef, eIdx) => {
            const dbEx = ExerciseModule.getExerciseById(exRef.id);
            if(!dbEx) return;
            
            const sets = [];
            const weightInputs = document.querySelectorAll(`.log-weight[data-eidx="${eIdx}"]`);
            const repsInputs = document.querySelectorAll(`.log-reps[data-eidx="${eIdx}"]`);
            
            let maxWeight = 0;
            let maxWeightReps = 0;
            
            weightInputs.forEach((wInput, idx) => {
                const rInput = repsInputs[idx];
                let weight = Number(wInput.value) || 0;
                const reps = Number(rInput.value) || 0;
                
                // If this is a bodyweight exercise, their actual bodyweight acts as the baseline weight, 
                // plus whatever they entered in the weight box (e.g., added chains/plates).
                if (dbEx.isBodyweight && (weight > 0 || reps > 0)) {
                    weight += userBw;
                }
                
                if (weight > 0 || reps > 0) {
                    sets.push({ weight, reps, completed: true, type: wInput.dataset.settype });
                    totalVolume += weight * reps;
                }
                
                // Track Best Set
                if (weight > maxWeight) {
                    maxWeight = weight;
                    maxWeightReps = reps;
                } else if (weight === maxWeight && reps > maxWeightReps) {
                    maxWeightReps = reps;
                }
            });
            
            // Calculate and Distribute XP
            const currentStreakMult = SettingsModule.getSettings().streakMultiplier;
            const exXp = RankingModule.calculateExerciseXP(maxWeight, maxWeightReps, userBw, currentStreakMult);
            
            if (exXp > 0) {
                const rankUps = RankingModule.distributeXP(exRef.id, exXp, ExerciseModule, false);
                if (rankUps && rankUps.length > 0) {
                    allRankUps.push(...rankUps);
                }
                totalWorkoutXP += exXp;
            }
            
            loggedExercises.push({
                id: exRef.id,
                name: dbEx.name,
                sets: sets
            });
        });
        
        const workoutData = {
            id: 'wo_' + Date.now(),
            name: tpl.name,
            templateId: tpl.id,
            date: finalDate,
            totalVolume: totalVolume,
            totalXP: totalWorkoutXP,
            exercises: loggedExercises
        };
        
        HistoryModule.saveWorkout(workoutData);
        
        // Remove draft if completing a draft
        if (currentLoggingDraftId) {
            DraftModule.deleteDraft(currentLoggingDraftId);
            currentLoggingDraftId = null;
        }
        
        document.getElementById('workout-logging-modal').classList.add('hidden');
        currentLoggingTemplateId = null;
        renderRecordSession(); // Refresh the view
        
        if (allRankUps.length > 0) {
            showRankUpModal(allRankUps);
        } else {
            alert(`Workout Logged Successfully! You earned ${totalWorkoutXP} XP.`);
        }
    });

    StreakEngine.evaluate();
    
    // Restore last active view
    const lastView = Storage.get('mr_last_view', 'muscle-rankings');
    const targetBtn = document.querySelector(`.nav-btn[data-target="${lastView}"]`);
    if (targetBtn) {
        targetBtn.click();
    } else {
        renderDashboard();
    }
});




    // --- PACK PULL LOGIC ---
    const packPullSetSelect = document.getElementById('pack-pull-set-select');
    const packPullGrid = document.getElementById('pack-pull-grid');
    let packPullPopulated = false;

    const packPullBackBtn = document.getElementById('pack-pull-back-btn');
    const packPullRandomBtn = document.getElementById('pack-pull-random-btn');
    
    function renderPackPull() {
        if (!packPullPopulated && typeof PACK_PULL_DATA !== 'undefined') {
            const sets = (typeof PACK_ORDER !== 'undefined') ? PACK_ORDER.filter(s => PACK_PULL_DATA[s]) : Object.keys(PACK_PULL_DATA).sort();
            packPullPopulated = true;
            let currentOpenedSet = null;
            
            const renderPacks = () => {
                currentOpenedSet = null;
                packPullBackBtn.classList.add('hidden');
                if (packPullRandomBtn) packPullRandomBtn.classList.add('hidden');
                
                const searchContainer = document.getElementById('pack-search-container');
                if (searchContainer) searchContainer.style.display = 'block';

                packPullGrid.style.display = 'flex';
                packPullGrid.style.flexDirection = 'column';
                packPullGrid.style.alignItems = 'center';
                packPullGrid.style.gap = '15px';
                packPullGrid.innerHTML = '';
                sets.forEach((setName, index) => {
                    const card = document.createElement('div');
                    card.className = 'pokemon-card pack-item stagger-in';
                    card.style.animationDelay = `${index * 0.03}s`;
                    card.dataset.packName = setName;
                    card.style.display = 'flex';
                    card.style.aspectRatio = 'auto';
                    card.style.flexDirection = 'row';
                    card.style.alignItems = 'center';
                    card.style.justifyContent = 'space-between';
                    card.style.cursor = 'pointer';
                    card.style.textAlign = 'left';
                    card.style.padding = '15px 25px';
                    card.style.background = 'rgba(0,0,0,0.4)';
                    card.style.gap = '20px';
                    card.style.width = '100%';
                    card.style.maxWidth = '800px';
                    card.style.borderRadius = '12px';
                    
                    const allPackCards = PACK_PULL_DATA[setName] || [];
                    const totalCards = allPackCards.length;
                    let uniquePulled = 0;
                    const unlockedSet = new Set(PokemonModule.getUnlocked());
                    allPackCards.forEach(c => {
                        const imgPath = typeof c === 'string' ? c : c.image;
                        if (unlockedSet.has(imgPath)) uniquePulled++;
                    });

                    const logoUrl = (typeof PACK_LOGOS !== 'undefined' && PACK_LOGOS[setName]) ? PACK_LOGOS[setName] : null;
                    if (logoUrl) {
                        card.innerHTML = `
                            <div style="display: flex; flex-direction: column; flex: 1;">
                                <span style="color: var(--neon-primary); font-size: 1rem; font-weight: bold;">${setName}</span>
                                <span style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 5px;">${uniquePulled} / ${totalCards} Collected</span>
                            </div>
                            <img src="${logoUrl}" alt="${setName}" loading="lazy" style="max-height: 45px; max-width: 140px; object-fit: contain;">
                        `;
                    } else {
                        card.innerHTML = `
                            <div style="display: flex; flex-direction: column; flex: 1;">
                                <h3 style="color: var(--neon-primary); margin: 0; font-size: 1rem;">${setName}</h3>
                                <span style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 5px;">${uniquePulled} / ${totalCards} Collected</span>
                            </div>
                        `;
                    }
                    
                    card.addEventListener('click', () => {
                        currentOpenedSet = setName;
                        const searchContainer = document.getElementById('pack-search-container');
                        if (searchContainer) searchContainer.style.display = 'none';
                        renderImages(PACK_PULL_DATA[setName] || []);
                    });
                    packPullGrid.appendChild(card);
                });
            };

            const renderImages = (images) => {
                packPullBackBtn.classList.remove('hidden');
                if (packPullRandomBtn && currentOpenedSet) packPullRandomBtn.classList.remove('hidden');
                packPullGrid.style.display = 'grid';
                packPullGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
                packPullGrid.innerHTML = '';
                
                images.forEach((cardData, index) => {
                    const imgPath = typeof cardData === 'string' ? cardData : cardData.image;
                    const img = document.createElement('img');
                    img.src = imgPath;
                    img.loading = 'lazy';
                    img.style.width = '100%';
                    img.style.borderRadius = '8px';
                    img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                    img.style.objectFit = 'contain';
                    img.style.backgroundColor = 'rgba(0,0,0,0.2)';
                    
                    const cardWrapper = document.createElement('div');
                    cardWrapper.className = 'stagger-in';
                    cardWrapper.style.animationDelay = `${index * 0.05}s`;
                    cardWrapper.style.display = 'flex';
                    cardWrapper.style.flexDirection = 'column';
                    cardWrapper.style.alignItems = 'center';
                    
                    // Lightbox logic
                    img.style.cursor = 'pointer';
                    img.addEventListener('click', () => {
                        if (window.openLightbox) {
                            window.openLightbox(images, index);
                        }
                    });
                    
                    cardWrapper.appendChild(img);
                    
                    packPullGrid.appendChild(cardWrapper);
                });
            };
            
            packPullBackBtn.addEventListener('click', renderPacks);
            
            if (packPullRandomBtn) {
                packPullRandomBtn.addEventListener('click', () => {
                    if (!currentOpenedSet) return;
                    let allCards = PACK_PULL_DATA[currentOpenedSet] || [];
                    
                    if (allCards.length === 0) return;
                    
                    const numPulls = Math.floor(Math.random() * 3) + 6; // 6 to 8 cards
                    const pulled = [];
                    for (let i = 0; i < numPulls; i++) {
                        const randomIndex = Math.floor(Math.random() * allCards.length);
                        const card = allCards[randomIndex];
                        pulled.push(card);
                        
                        // Add to unlocked collection if not already owned
                        const imgPath = typeof card === 'string' ? card : card.image;
                        if (!PokemonModule.unlocked.includes(imgPath)) {
                            PokemonModule.unlocked.push(imgPath);
                        }
                    }
                    Storage.set('mr_pokemon_unlocked', PokemonModule.unlocked);
                    
                    PullLogModule.savePull(pulled, currentOpenedSet);
                    renderImages(pulled);
                });
            }
            
            // Initial render of all packs
            renderPacks();
            
            // Search logic
            const searchInput = document.getElementById('pack-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    const packItems = document.querySelectorAll('.pack-item');
                    packItems.forEach(item => {
                        if (item.dataset.packName.toLowerCase().includes(query)) {
                            item.style.display = 'flex';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            }
        }
    }

    // --- PULL LOG LOGIC ---
    const PullLogModule = {
        logs: [],
        init() {
            this.logs = Storage.get('mr_pull_logs', []);
        },
        savePull(cards, packName = 'Unknown Pack') {
            const pullData = {
                id: 'pull_' + Date.now(),
                date: new Date().toISOString(),
                cards: cards,
                packName: packName
            };
            this.logs.unshift(pullData); // Add to beginning
            Storage.set('mr_pull_logs', this.logs);
            ChangeLogModule.log('create', `Pulled ${cards.length} cards from ${packName}.`);
        },
        getAllLogs() {
            return this.logs;
        }
    };

    function renderPullLog() {
        const listEl = document.getElementById('pull-log-list');
        listEl.innerHTML = '';
        
        const logs = PullLogModule.getAllLogs();
        if (logs.length === 0) {
            listEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No pulls logged yet.</p>';
            return;
        }
        
        logs.forEach(log => {
            const dateObj = new Date(log.date);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const card = document.createElement('div');
            card.style.background = 'rgba(0,0,0,0.3)';
            card.style.border = '1px solid #2A1642';
            card.style.borderRadius = '8px';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.padding = '15px 20px';
            card.style.cursor = 'pointer';
            
            const pName = log.packName || 'Random Pull';
            const logoUrl = (typeof PACK_LOGOS !== 'undefined' && PACK_LOGOS[pName]) ? PACK_LOGOS[pName] : null;
            const titleHtml = logoUrl 
                ? `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;"><img src="${logoUrl}" style="height: 24px; object-fit: contain;"> <h3 style="color: var(--neon-primary); margin: 0;">${pName}</h3></div>`
                : `<h3 style="color: var(--neon-primary); margin: 0 0 5px 0;">${pName}</h3>`;

            card.innerHTML = `
                <div>
                    ${titleHtml}
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${dateStr} at ${timeStr}</p>
                </div>
                <div>
                    <span style="background: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 4px; font-weight: bold;">${log.cards.length} Cards</span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                const modal = document.getElementById('pull-log-modal');
                const grid = document.getElementById('pull-log-modal-grid');
                grid.innerHTML = '';
                
                log.cards.forEach((cardData, index) => {
                    const imgPath = typeof cardData === 'string' ? cardData : cardData.image;
                    const img = document.createElement('img');
                    img.src = imgPath;
                    img.style.width = '100%';
                    img.style.borderRadius = '8px';
                    img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                    img.style.objectFit = 'contain';
                    img.style.backgroundColor = 'rgba(0,0,0,0.2)';
                    
                    // Lightbox logic
                    img.style.cursor = 'pointer';
                    img.addEventListener('click', () => {
                        if (window.openLightbox) {
                            window.openLightbox(log.cards, index);
                        }
                    });
                    
                    const c = document.createElement('div');
                    c.style.display = 'flex';
                    c.style.flexDirection = 'column';
                    c.style.alignItems = 'center';
                    c.appendChild(img);
                    grid.appendChild(c);
                });
                
                modal.classList.remove('hidden');
            });
            
            listEl.appendChild(card);
        });
    }

    const closePullLogModalBtn = document.getElementById('close-pull-log-modal-btn');
    if (closePullLogModalBtn) {
        closePullLogModalBtn.addEventListener('click', () => {
            document.getElementById('pull-log-modal').classList.add('hidden');
        });
    }

    // --- POKEWEIGHT LOGIC ---
    let pokeweightDataFetched = false;
    function renderPokeweight() {
        if (pokeweightDataFetched) return; // Prevent re-fetching if already loaded
        
        const tbody = document.getElementById('pokeweight-table-body');
        const searchInput = document.getElementById('pokeweight-search');
        
        const renderTable = (filterText = '') => {
            tbody.innerHTML = ''; // Clear existing data if any
            
            if (typeof POKEWEIGHT_DATA === 'undefined') {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--neon-danger); padding: 20px;">Failed to load data. Please ensure pokeweight-data.js exists.</td></tr>';
                return;
            }

            const lowerFilter = filterText.toLowerCase();
            const filteredData = POKEWEIGHT_DATA.filter(p => p.name.toLowerCase().includes(lowerFilter));

            if (filteredData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 20px;">No Pokemon found matching your search.</td></tr>';
                return;
            }

            filteredData.forEach((pokemon, index) => {
                const tr = document.createElement('tr');
                // Alternate row background colors for better readability
                tr.style.background = index % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)';
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                
                tr.innerHTML = `
                    <td style="padding: 12px 15px; color: var(--text-primary); font-weight: bold;">${pokemon.name}</td>
                    <td style="padding: 12px 15px; color: var(--text-secondary);">${pokemon.kgs} kg</td>
                    <td style="padding: 12px 15px; color: var(--text-secondary);">${pokemon.lbs} lbs</td>
                `;
                tbody.appendChild(tr);
            });
        };

        // Attach search listener
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderTable(e.target.value);
            });
        }

        // Initial render
        renderTable();
        pokeweightDataFetched = true;
    }

    // --- LIGHTBOX LOGIC ---
    const lightboxModal = document.getElementById('card-lightbox-modal');
    const closeLightboxBtn = document.getElementById('close-lightbox-btn');
    const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
    const lightboxNextBtn = document.getElementById('lightbox-next-btn');
    const lightboxImg = document.getElementById('lightbox-image');
    
    window.currentLightboxImages = [];
    window.currentLightboxIndex = 0;
    
    window.openLightbox = (images, index) => {
        if (!lightboxModal || !lightboxImg) return;
        window.currentLightboxImages = images;
        window.currentLightboxIndex = index;
        updateLightboxView();
        lightboxModal.style.display = 'flex';
        lightboxModal.classList.remove('hidden');
    };
    
    const updateLightboxView = () => {
        if (window.currentLightboxImages.length === 0) return;
        const currentData = window.currentLightboxImages[window.currentLightboxIndex];
        lightboxImg.src = typeof currentData === 'string' ? currentData : currentData.image;
        
        if (lightboxPrevBtn) {
            lightboxPrevBtn.style.opacity = window.currentLightboxIndex > 0 ? '1' : '0.2';
            lightboxPrevBtn.style.cursor = window.currentLightboxIndex > 0 ? 'pointer' : 'default';
        }
        if (lightboxNextBtn) {
            lightboxNextBtn.style.opacity = window.currentLightboxIndex < window.currentLightboxImages.length - 1 ? '1' : '0.2';
            lightboxNextBtn.style.cursor = window.currentLightboxIndex < window.currentLightboxImages.length - 1 ? 'pointer' : 'default';
        }
    };
    
    if (lightboxModal && closeLightboxBtn) {
        const closeLightbox = () => {
            lightboxModal.style.display = 'none';
            lightboxModal.classList.add('hidden');
        };
        closeLightboxBtn.addEventListener('click', closeLightbox);
        
        if (lightboxPrevBtn) {
            lightboxPrevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.currentLightboxIndex > 0) {
                    window.currentLightboxIndex--;
                    updateLightboxView();
                }
            });
        }
        if (lightboxNextBtn) {
            lightboxNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.currentLightboxIndex < window.currentLightboxImages.length - 1) {
                    window.currentLightboxIndex++;
                    updateLightboxView();
                }
            });
        }
        
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
        
        document.addEventListener('keydown', (e) => {
            if (lightboxModal.style.display === 'flex') {
                if (e.key === 'ArrowLeft' && window.currentLightboxIndex > 0) {
                    window.currentLightboxIndex--;
                    updateLightboxView();
                } else if (e.key === 'ArrowRight' && window.currentLightboxIndex < window.currentLightboxImages.length - 1) {
                    window.currentLightboxIndex++;
                    updateLightboxView();
                } else if (e.key === 'Escape') {
                    closeLightbox();
                }
            }
        });
    }

// Initial Auth Check
SupabaseModule.checkSession().then(isLoggedIn => {
    if (isLoggedIn) {
        document.getElementById('auth-overlay').style.display = 'none';
    }
});

// Supabase Auth UI Logic
const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authErrorMsg = document.getElementById('auth-error-msg');
let isLoginMode = true;

if (document.getElementById('show-login-btn')) {
    document.getElementById('show-login-btn').addEventListener('click', (e) => {
        isLoginMode = true;
        e.target.style.borderBottom = '2px solid var(--neon-primary)';
        e.target.style.color = 'var(--neon-primary)';
        document.getElementById('show-register-btn').style.borderBottom = '2px solid transparent';
        document.getElementById('show-register-btn').style.color = 'var(--text-secondary)';
        document.getElementById('auth-submit-btn').textContent = 'Sign In';
        document.getElementById('forgot-password-btn').style.display = 'block';
        authErrorMsg.style.display = 'none';
    });

    document.getElementById('show-register-btn').addEventListener('click', (e) => {
        isLoginMode = false;
        e.target.style.borderBottom = '2px solid var(--neon-primary)';
        e.target.style.color = 'var(--neon-primary)';
        document.getElementById('show-login-btn').style.borderBottom = '2px solid transparent';
        document.getElementById('show-login-btn').style.color = 'var(--text-secondary)';
        document.getElementById('auth-submit-btn').textContent = 'Create Account';
        document.getElementById('forgot-password-btn').style.display = 'none';
        authErrorMsg.style.display = 'none';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        authErrorMsg.style.display = 'none';
        
        const submitBtn = document.getElementById('auth-submit-btn');
        submitBtn.textContent = 'Processing...';
        
        try {
            if (isLoginMode) {
                await SupabaseModule.login(email, password);
            } else {
                await SupabaseModule.register(email, password);
            }
            authOverlay.style.display = 'none';
            window.location.reload(); 
        } catch (error) {
            authErrorMsg.textContent = error.message;
            authErrorMsg.style.display = 'block';
            submitBtn.textContent = isLoginMode ? 'Sign In' : 'Create Account';
        }
    });

    const forgotBtn = document.getElementById('forgot-password-btn');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', async () => {
            const email = document.getElementById('auth-email').value;
            if (!email) {
                authErrorMsg.textContent = 'Please enter your email address above first.';
                authErrorMsg.style.display = 'block';
                return;
            }
            authErrorMsg.style.display = 'none';
            forgotBtn.textContent = 'Sending...';
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://nightahwk03.github.io/MuscleRank/'
            });
            if (error) {
                authErrorMsg.textContent = error.message;
                authErrorMsg.style.display = 'block';
            } else {
                authErrorMsg.textContent = 'Password reset email sent! Check your inbox.';
                authErrorMsg.style.color = 'var(--neon-primary)';
                authErrorMsg.style.display = 'block';
            }
            forgotBtn.textContent = 'Forgot Password?';
        });
    }
}

// Password visibility toggle logic
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const authPasswordInput = document.getElementById('auth-password');
const eyeIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
const eyeSlashIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

if (togglePasswordBtn && authPasswordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        if (authPasswordInput.type === 'password') {
            authPasswordInput.type = 'text';
            togglePasswordBtn.innerHTML = eyeSlashIconSvg;
        } else {
            authPasswordInput.type = 'password';
            togglePasswordBtn.innerHTML = eyeIconSvg;
        }
    });
}

// Password Reset Flow Check
if (window.location.hash.includes('type=recovery')) {
    const resetOverlay = document.getElementById('reset-password-overlay');
    if (resetOverlay) {
        resetOverlay.style.display = 'flex';
        document.getElementById('auth-overlay').style.display = 'none';
        
        document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const resetErrorMsg = document.getElementById('reset-error-msg');
            const newPassword = document.getElementById('reset-new-password').value;
            const confirmPassword = document.getElementById('reset-confirm-password').value;
            
            resetErrorMsg.style.display = 'none';
            
            if (newPassword !== confirmPassword) {
                resetErrorMsg.textContent = 'Passwords do not match!';
                resetErrorMsg.style.display = 'block';
                return;
            }
            
            const btn = document.getElementById('reset-submit-btn');
            btn.textContent = 'Updating...';
            
            const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
            
            if (error) {
                resetErrorMsg.textContent = error.message;
                resetErrorMsg.style.display = 'block';
                btn.textContent = 'Update Password';
            } else {
                alert('Password successfully updated! You can now log in.');
                window.location.hash = '';
                window.location.reload();
            }
        });
    }
}

// Reset password visibility toggle logic
const toggleResetNewBtn = document.getElementById('toggle-reset-new-password-btn');
const resetNewInput = document.getElementById('reset-new-password');
if (toggleResetNewBtn && resetNewInput) {
    toggleResetNewBtn.addEventListener('click', () => {
        if (resetNewInput.type === 'password') {
            resetNewInput.type = 'text';
            toggleResetNewBtn.innerHTML = eyeSlashIconSvg;
        } else {
            resetNewInput.type = 'password';
            toggleResetNewBtn.innerHTML = eyeIconSvg;
        }
    });
}

const toggleResetConfirmBtn = document.getElementById('toggle-reset-confirm-password-btn');
const resetConfirmInput = document.getElementById('reset-confirm-password');
if (toggleResetConfirmBtn && resetConfirmInput) {
    toggleResetConfirmBtn.addEventListener('click', () => {
        if (resetConfirmInput.type === 'password') {
            resetConfirmInput.type = 'text';
            toggleResetConfirmBtn.innerHTML = eyeSlashIconSvg;
        } else {
            resetConfirmInput.type = 'password';
            toggleResetConfirmBtn.innerHTML = eyeIconSvg;
        }
    });
}
