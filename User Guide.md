# MuscleRank - Official Documentation

Welcome to **MuscleRank**, a gamified fitness tracker that fuses real-world bodybuilding with the thrill of Pokémon card collecting. This document serves as a comprehensive guide to understanding every feature, module, and underlying mechanic of the application.

---

## 1. Core Mechanics (EXP & Ranking)

### Experience Points (EXP) Calculation
EXP is automatically calculated when you log a workout session. The app calculates EXP using a baseline of 50 EXP, multiplying it differently depending on whether an exercise involves weights or is purely bodyweight.

*   **Weighted Exercises**: 
    The calculation is driven by how heavy the weight is *relative to your own bodyweight*, alongside a multiplier for the number of reps you perform.
    `EXP = Base (50) × Weight Multiplier × Rep Multiplier × Streak Multiplier`
    
    *Weight Multiplier (Ratio of Lifted Weight to Bodyweight)*:
    - `<= 50%`: 0.8x
    - `<= 75%`: 0.9x
    - `<= 100%`: 1.0x
    - `<= 125%`: 1.1x
    - `<= 150%`: 1.2x
    - `<= 175%`: 1.3x
    - `<= 200%`: 1.5x
    - `> 200%`: Continues to scale up (+0.2x for every additional 25% of bodyweight).

    *Rep Multiplier*:
    - `1-5 reps`: 0.8x
    - `6-11 reps`: 1.2x
    - `12+ reps`: 1.0x

*   **Bodyweight Exercises**:
    Because bodyweight exercises don't increase in weight, EXP scales up based on the number of reps you can endure. For every 5 continuous reps in a single set, the base EXP yield increases by 10%. (e.g. 1-5 reps = 100%, 6-10 reps = 110%, 11-15 reps = 120%).

*   **Muscle Distribution**: 
    When you log an exercise, the generated EXP is distributed across the muscles targeted by that exercise. Primary muscles get more of the EXP, while Secondary muscles get less.

### Muscle Ranks
As muscles gain EXP, they rank up. Each major rank consists of 5 sub-ranks (e.g., Wood 1, Wood 2... Wood 5). The major rank tiers and their required total EXP thresholds are:

1.  **Wood**: 0 - 400 EXP
2.  **Bronze**: 400 - 900 EXP
3.  **Silver**: 900 - 1,800 EXP
4.  **Gold**: 1,800 - 4,000 EXP
5.  **Diamond**: 4,000 - 10,000 EXP
6.  **Platinum**: 10,000 - 23,000 EXP
7.  **Obsidian**: 23,000 - 50,000 EXP
8.  **Titanium**: 50,000 - 120,000 EXP
9.  **Demon**: 120,000 - 250,000 EXP

When a muscle ranks up, it glows brightly and levels up on your Bodygraph, unlocking new visual milestones and bragging rights.

### Streak Multiplier
Consistency is rewarded. The **Streak Engine** evaluates your workout frequency on a weekly basis (starting on Mondays). 
*   If you meet your set goal number of days of workout (configured in Settings), your EXP multiplier increases by `+0.1x` for the next week.
*   If you miss your weekly goal, the multiplier resets back to `1.0x`.
*   This multiplier acts as a global boost to all EXP earned during your workouts.

---

## 2. Workout Management

### Exercise Master
The foundation of the app. Here, you create and manage the exercises you perform.
*   **Customization**: Name your exercise and define whether it is a Compound or Isolation movement.
*   **Targeting**: Select one Primary muscle and multiple Secondary muscles.
*   **Bodyweight Flag**: You can flag an exercise as `isBodyweight`. This triggers the special bodyweight EXP calculation and excludes it from your "Top Lifts" (so pushups don't accidentally compete with your heavy bench presses).

### Workout Master
Create reusable workout templates (e.g., "Push Day", "Leg Day"). 
*   Add exercises from your Exercise Master to a template.
*   You can edit templates at any time, and the app will display the total number of working sets in the template.
*   This makes logging your daily session a simple process.

### Record Session
Where you log your gains. You can select a pre-made template or build a session on the fly.
*   **Live Tracking**: Enter your sets, reps, and weight. The app instantly shows you how much EXP you are generating.
*   **Logging**: Once you hit "Finish Workout", the app calculates your total EXP, distributes it, and evaluates your streak. The primary purpose of recording sessions is to gain EXP to rank up your muscles.

### Logs & History
*   **Workout Log**: A detailed history of every workout you've ever completed, complete with dates, total volume lifted, and EXP earned.
*   **Change Log**: A timeline of your major milestones, such as ranking up a specific muscle.

---

## 3. Analytics & Dashboard

### The Dashboard
Your central hub. It provides an at-a-glance view of your current Streak Multiplier, total EXP gained, and your overall muscular development.

### The Bodygraph
A visually dynamic heat map of the human body. As your individual muscles rank up (from Wood to Demon), the corresponding muscle groups on the Bodygraph light up and change color, providing a tangible visualization of your real-world gains.

---

## 4. The Pokémon System

### Pack Pulls
Whenever you want to relax and build your collection, you can open digital Pokémon Booster Packs. You are not required to complete workouts to pull packs; you can pull them freely!
*   **Opening Packs**: Navigate to the Pack Pull section to tear open packs. Each pack drops random cards ranging from common Pokémon to ultra-rare Holographics and Shinies.
*   **The Grid**: Your packs are organized by expansion sets (e.g., "Chaos Rising", "Perfect Order").

### Pull Log
A chronological history of your recent pack pulls, showcasing the card art, the set it belongs to, and whether you got lucky and pulled a rare Shiny!

### Pokéweight
A fun, fitness-oriented Pokémon database. You can search for any Pokémon by name to discover its exact real-world weight in both Kilograms (kg) and Pounds (lbs). 
*   *Use Case*: Set a personal goal in the gym to Deadlift a Charizard (90.5kg) or Squat a Snorlax! (Note: These goals are purely personal milestones and are not tracked natively in the app).

---

## 5. Social & Friends

### My Card (Player Card)
Your Player Card is your public profile that summarizes your fitness journey. It displays:
1.  **Your Bodygraph**: Letting friends see your muscle development.
2.  **Top 3 Lifts**: Automatically tracks and displays your heaviest weighted lifts (ignoring bodyweight exercises).
3.  **Showcase Cards**: A display case where you can pin your 3 favorite or rarest Pokémon cards that you've pulled.

### Friends & Rivals
Fitness is better with rivals. 
*   **Search**: You can search for other MuscleRank users using their email addresses.
*   **View Profiles**: Clicking on a rival pulls up their Player Card, allowing you to compare your Bodygraphs, see who lifts heavier, and check out their Pokémon collection.

---

## 6. Settings & Data Management

### Cloud Sync
MuscleRank is backed by Firebase. Every time you log a workout, pull a pack, or change a setting, your data is seamlessly synced to the cloud. You can log in on any device and instantly pick up right where you left off.

### Reset App Data
If you want to completely restart your fitness journey, you can use the "Reset App Data" button in Settings. 
*   **What IS Reset**: Your entire workout history, EXP, Muscle Ranks, Bodygraph, custom Exercises, custom Templates, Streak Multiplier, and your ENTIRE Pokémon collection (cards and pulls).
*   **What is NOT Reset**: Your account login (email/password) remains intact, and you will not be signed out. The reset simply wipes your progress slate clean, allowing you to start fresh at Rank Wood.
