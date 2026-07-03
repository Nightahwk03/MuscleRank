export const INITIAL_MUSCLES = [
    { id: 'chest', name: 'Chest', xp: 0, rank: 'Unranked' },
    { id: 'biceps', name: 'Biceps', xp: 0, rank: 'Unranked' },
    { id: 'triceps', name: 'Triceps', xp: 0, rank: 'Unranked' },
    { id: 'shoulders', name: 'Shoulders', xp: 0, rank: 'Unranked' },
    { id: 'lats', name: 'Lats', xp: 0, rank: 'Unranked' },
    { id: 'quads', name: 'Quads', xp: 0, rank: 'Unranked' },
    { id: 'hamstrings', name: 'Hamstrings', xp: 0, rank: 'Unranked' },
    { id: 'calves', name: 'Calves', xp: 0, rank: 'Unranked' },
    { id: 'core', name: 'Core', xp: 0, rank: 'Unranked' }
];

export const INITIAL_EXERCISES = [
    { 
        id: 'bench_press', 
        name: 'Bench Press', 
        muscleContributions: { chest: 0.7, triceps: 0.2, shoulders: 0.1 } 
    },
    { 
        id: 'bicep_curl', 
        name: 'Bicep Curl', 
        muscleContributions: { biceps: 1.0 } 
    },
    { 
        id: 'squat', 
        name: 'Barbell Squat', 
        muscleContributions: { quads: 0.6, hamstrings: 0.2, core: 0.2 } 
    },
    {
        id: 'deadlift',
        name: 'Deadlift',
        muscleContributions: { hamstrings: 0.4, lats: 0.3, core: 0.2, quads: 0.1 }
    },
    {
        id: 'pullup',
        name: 'Pull-up',
        muscleContributions: { lats: 0.7, biceps: 0.3 }
    }
];

export const RANKS = [
    { name: 'Unranked', threshold: 0, colorClass: 'rank-unranked' },
    { name: 'Bronze', threshold: 100, colorClass: 'rank-bronze' },
    { name: 'Silver', threshold: 1000, colorClass: 'rank-silver' },
    { name: 'Gold', threshold: 3000, colorClass: 'rank-gold' },
    { name: 'Platinum', threshold: 6000, colorClass: 'rank-platinum' },
    { name: 'Diamond', threshold: 10000, colorClass: 'rank-diamond' },
    { name: 'Obsidian', threshold: 15000, colorClass: 'rank-obsidian' },
    { name: 'Demon', threshold: 25000, colorClass: 'rank-demon' }
];
