const RivalsModule = {
    init() {
        this.bindEvents();
        
        // When auth is ready, listen for friend requests
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.listenForRequests();
                this.loadFriends();
                this.ensureProfile();
            }
        });
    },

    bindEvents() {
        const searchBtn = document.getElementById('rival-search-btn');
        const searchInput = document.getElementById('rival-search-input');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchRival());
        }
        
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.searchRival();
                }
            });
        }

        const closeCard = document.getElementById('player-card-close');
        if (closeCard) {
            closeCard.addEventListener('click', () => {
                document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
                document.getElementById('rivals').classList.remove('hidden');
            });
        }

        // myCardBtn listener moved to main.js
    },

    async ensureProfile() {
        if (!FirebaseModule.currentUser) return;
        try {
            await db.collection('user_profiles').doc(FirebaseModule.currentUser.uid).set({
                email: FirebaseModule.currentUser.email
            }, { merge: true });
        } catch(e) {
            console.error('Error saving profile', e);
        }
    },

    async searchRival() {
        const email = document.getElementById('rival-search-input').value.trim();
        const resultsDiv = document.getElementById('rival-search-results');
        
        if (!email) {
            resultsDiv.innerHTML = '<span style="color: #ff4444;">Please enter an email address.</span>';
            return;
        }
        if (email === FirebaseModule.currentUser.email) {
            resultsDiv.innerHTML = '<span style="color: #ff4444;">You cannot add yourself as a rival!</span>';
            return;
        }

        resultsDiv.innerHTML = 'Searching...';

        try {
            const usersRef = db.collection('user_profiles');
            const snapshot = await usersRef.where('email', '==', email).get();
            
            if (snapshot.empty) {
                resultsDiv.innerHTML = '<span style="color: #ff4444;">User not found. Make sure they have logged in at least once!</span>';
                return;
            }

            const targetUser = snapshot.docs[0];
            const targetData = targetUser.data();
            
            resultsDiv.innerHTML = `
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color);">
                    <div>
                        <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 5px;">${targetData.email}</div>
                    </div>
                    <button class="action-btn primary-btn" style="width: auto; padding: 8px 15px; font-size: 0.9rem; margin: 0;" onclick="RivalsModule.sendRequest('${targetUser.id}', '${targetData.email}')">Send Request</button>
                </div>
            `;
        } catch (error) {
            console.error('Search error:', error);
            resultsDiv.innerHTML = '<span style="color: #ff4444;">Error searching for user.</span>';
        }
    },

    async sendRequest(targetId, targetEmail) {
        if (!FirebaseModule.currentUser) return;
        
        const myId = FirebaseModule.currentUser.uid;
        const myEmail = FirebaseModule.currentUser.email;

        try {
            // Check for pending request or existing friend
            const existingRef = db.collection('friend_requests');
            const q1 = await existingRef.where('senderId', '==', myId).where('receiverId', '==', targetId).where('status', '==', 'pending').get();
            const q2 = await existingRef.where('senderId', '==', targetId).where('receiverId', '==', myId).where('status', '==', 'pending').get();
            
            const friendDoc = await db.collection('user_profiles').doc(myId).collection('friends').doc(targetId).get();

            if (!q1.empty || !q2.empty) {
                document.getElementById('rival-search-results').innerHTML = '<span style="color: #ff4444;">A pending request already exists!</span>';
                return;
            }
            if (friendDoc.exists) {
                document.getElementById('rival-search-results').innerHTML = '<span style="color: var(--neon-primary);">You are already friends!</span>';
                return;
            }

            await db.collection('friend_requests').add({
                senderId: myId,
                senderEmail: myEmail,
                receiverId: targetId,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            ChangeLogModule.log('social', `Sent a rival request to ${targetEmail}`);
            document.getElementById('rival-search-results').innerHTML = '<span style="color: #00ff00;">Rival Request Sent!</span>';
        } catch (error) {
            console.error('Request error:', error);
            alert('Failed to send request.');
        }
    },

    listenForRequests() {
        if (!FirebaseModule.currentUser) return;
        
        db.collection('friend_requests')
          .where('receiverId', '==', FirebaseModule.currentUser.uid)
          .where('status', '==', 'pending')
          .onSnapshot(snapshot => {
              const pendingPanel = document.getElementById('rival-pending-panel');
              const pendingList = document.getElementById('rival-pending-list');
              
              if (snapshot.empty) {
                  pendingPanel.style.display = 'none';
                  pendingList.innerHTML = '';
                  return;
              }

              pendingPanel.style.display = 'block';
              pendingList.innerHTML = '';
              
              snapshot.forEach(doc => {
                  const req = doc.data();
                  const div = document.createElement('div');
                  div.style.cssText = 'background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';
                  div.innerHTML = `
                      <div><strong>${req.senderEmail}</strong> wants to be your rival!</div>
                      <div style="display: flex; gap: 8px;">
                          <button class="action-btn primary-btn" style="width: auto; padding: 5px 10px; font-size: 0.8rem; margin: 0;" onclick="RivalsModule.acceptRequest('${doc.id}', '${req.senderId}', '${req.senderEmail}')">Accept</button>
                          <button class="action-btn danger-btn" style="width: auto; padding: 5px 10px; font-size: 0.8rem; margin: 0;" onclick="RivalsModule.rejectRequest('${doc.id}')">Reject</button>
                      </div>
                  `;
                  pendingList.appendChild(div);
              });
          });
    },

    async acceptRequest(requestId, senderId, senderEmail) {
        try {
            await db.collection('friend_requests').doc(requestId).update({ status: 'accepted' });
            
            // Add to my friends
            await db.collection('user_profiles').doc(FirebaseModule.currentUser.uid)
                    .collection('friends').doc(senderId).set({ email: senderEmail, addedAt: firebase.firestore.FieldValue.serverTimestamp() });
            
            // Add me to their friends
            await db.collection('user_profiles').doc(senderId)
                    .collection('friends').doc(FirebaseModule.currentUser.uid).set({ email: FirebaseModule.currentUser.email, addedAt: firebase.firestore.FieldValue.serverTimestamp() });

            ChangeLogModule.log('social', `Accepted rival request from ${senderEmail}`);
            this.loadFriends();
        } catch (e) {
            console.error('Accept error:', e);
        }
    },

    async rejectRequest(requestId) {
        try {
            await db.collection('friend_requests').doc(requestId).delete();
            ChangeLogModule.log('social', `Rejected a rival request.`);
        } catch (e) {
            console.error('Reject error:', e);
        }
    },

    async removeRival(friendId, friendEmail) {
        if (!FirebaseModule.currentUser) return;
        const confirmRemove = confirm(`Are you sure you want to remove ${friendEmail} as a rival?`);
        if (!confirmRemove) return;

        try {
            // Remove from my friends
            await db.collection('user_profiles').doc(FirebaseModule.currentUser.uid)
                    .collection('friends').doc(friendId).delete();
            
            // Remove me from their friends
            await db.collection('user_profiles').doc(friendId)
                    .collection('friends').doc(FirebaseModule.currentUser.uid).delete();

            ChangeLogModule.log('social', `Removed ${friendEmail} from your rivals list.`);
        } catch (e) {
            console.error('Remove rival error:', e);
        }
    },

    async loadFriends() {
        if (!FirebaseModule.currentUser) return;
        
        db.collection('user_profiles').doc(FirebaseModule.currentUser.uid).collection('friends')
          .onSnapshot(snapshot => {
              const grid = document.getElementById('rival-friends-grid');
              
              if (snapshot.empty) {
                  grid.innerHTML = '<p style="color: var(--text-secondary);">You haven\'t added any rivals yet.</p>';
                  return;
              }

              grid.innerHTML = '';
              snapshot.forEach(doc => {
                  const friend = doc.data();
                  const friendId = doc.id;
                  
                  const card = document.createElement('div');
                  card.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; cursor: pointer; transition: transform 0.2s, background 0.2s;';
                  card.innerHTML = `
                      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                          <div>
                              <div style="font-weight: 700; font-size: 1.1rem; color: var(--neon-primary); margin-bottom: 5px;">${friend.email}</div>
                              <div style="font-size: 0.8rem; color: var(--text-secondary);">Tap to view Player Card</div>
                          </div>
                          <button class="action-btn danger-btn" style="width: auto; padding: 4px 8px; font-size: 0.75rem; margin: 0;" onclick="event.stopPropagation(); RivalsModule.removeRival('${friendId}', '${friend.email}')">Unfriend</button>
                      </div>
                  `;
                  
                  card.onmouseover = () => card.style.background = 'rgba(255,255,255,0.1)';
                  card.onmouseout = () => card.style.background = 'rgba(255,255,255,0.05)';
                  
                  card.onclick = () => this.viewPlayerCard(friendId, friend.email);
                  
                  grid.appendChild(card);
              });
          });
    },

    async viewPlayerCard(friendId, friendEmail) {
        document.getElementById('player-card-name').textContent = friendEmail;
        
        // Define isMe
        const isMe = (FirebaseModule.currentUser && FirebaseModule.currentUser.uid === friendId);

        // Switch view
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById('my-card').classList.remove('hidden');
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if (isMe) {
            const myCardBtn = document.querySelector('[data-target="my-card"]');
            if (myCardBtn) myCardBtn.classList.add('active');
            document.getElementById('player-card-close').style.display = 'none';
        } else {
            document.getElementById('player-card-close').style.display = 'flex';
        }

        // Reset fields
        document.getElementById('player-card-bw').textContent = 'Loading...';
        document.getElementById('player-card-last-workout').textContent = 'Loading...';
        document.getElementById('player-card-top-lifts').innerHTML = '';
        document.getElementById('player-card-showcase').innerHTML = '';
        document.getElementById('player-card-bodygraph').innerHTML = '';
        document.getElementById('player-card-perfect-weeks').textContent = '--';

        try {
            let data, profileData;
            
            if (isMe) {
                data = {
                    mr_bodyweight_history: localStorage.getItem('mr_bodyweight_history'),
                    mr_history: localStorage.getItem('mr_history'),
                    mr_settings: localStorage.getItem('mr_settings'),
                    mr_muscles: localStorage.getItem('mr_muscles')
                };
                profileData = {
                    mr_pokemon: localStorage.getItem('mr_pokemon_showcase')
                };
            } else {
                const [doc, profileDoc] = await Promise.all([
                    db.collection('user_data').doc(friendId).get(),
                    db.collection('user_profiles').doc(friendId).get()
                ]);
                
                if (!doc.exists) {
                    document.getElementById('player-card-bw').textContent = 'No Data';
                    document.getElementById('player-card-last-workout').textContent = 'No Data';
                    return;
                }
                
                data = doc.data().data || {};
                profileData = profileDoc.exists ? profileDoc.data() : {};
            }

            // Pinned Cards (fetch from user_profiles)
            if (profileData && profileData.mr_pokemon) {
                let showcaseUrls = [];
                try {
                    showcaseUrls = JSON.parse(profileData.mr_pokemon);
                } catch(e) {}
                this.renderRivalShowcase(showcaseUrls, isMe);
            }

            // Extract Bodyweight
            if (data.mr_bodyweight_history) {
                const bwHist = JSON.parse(data.mr_bodyweight_history);
                if (bwHist.length > 0) {
                    document.getElementById('player-card-bw').textContent = bwHist[bwHist.length - 1].weight + ' kg';
                }
            }

            // Extract Last Workout
            let historyLog = [];
            if (data.mr_history) {
                historyLog = JSON.parse(data.mr_history);
                if (historyLog.length > 0) {
                    const last = historyLog[0];
                    const date = new Date(last.date).toLocaleDateString();
                    document.getElementById('player-card-last-workout').textContent = (last.name || 'Workout') + ' (' + date + ')';
                } else {
                    document.getElementById('player-card-last-workout').textContent = 'None';
                }
            }

            // Calculate Perfect Weeks
            let perfectWeeks = 0;
            if (data.mr_settings && historyLog.length > 0) {
                try {
                    const settings = JSON.parse(data.mr_settings);
                    const weeklyGoal = settings.weeklyGoal || 5;
                    const weekMap = {};
                    historyLog.forEach(h => {
                        if (typeof StreakEngine !== 'undefined') {
                            const weekStr = StreakEngine.getStartOfWeek(h.date).toISOString();
                            if (!weekMap[weekStr]) weekMap[weekStr] = 0;
                            weekMap[weekStr]++;
                        }
                    });
                    for (const w in weekMap) {
                        if (weekMap[w] >= weeklyGoal) perfectWeeks++;
                    }
                } catch(e) { console.error('Error calculating perfect weeks', e); }
            }
            document.getElementById('player-card-perfect-weeks').textContent = perfectWeeks;

            // Bodygraph
            const muscles = data.mr_muscles ? JSON.parse(data.mr_muscles) : {};
            this.renderRivalBodygraph(muscles);

            // Top Lifts
            if (data.mr_history) {
                const log = JSON.parse(data.mr_history);
                this.calculateRivalTopLifts(log);
            }

        } catch (error) {
            console.error('Error fetching player card:', error);
        }
    },

    renderRivalBodygraph(muscles) {
        const container = document.getElementById('player-card-bodygraph');
        container.innerHTML = '';
        
        const existingGraph = document.querySelector('.body-map-container svg');
        if (existingGraph) {
            const clone = existingGraph.cloneNode(true);
            clone.style.width = '100%';
            clone.style.maxWidth = '600px';
            clone.style.height = 'auto';
            clone.style.display = 'block';
            clone.style.margin = '0 auto';
            
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
                const percent = (3 - tier) * 0.20;
                if (percent === 0) return baseVisuals;
                
                const shadeHexColor = (color, percent) => {
                    const f = parseInt(color.slice(1), 16),
                          t = percent < 0 ? 0 : 255,
                          p = Math.abs(percent),
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

            const tooltip = document.getElementById('muscle-tooltip');

            muscles.forEach(m => {
                const slugs = muscleToSlugs[m.id] || [];
                
                // Dynamically calculate the rank from XP, falling back to m.rank or Wood 1 if XP is somehow missing
                let currentRankName = 'Wood 1';
                if (typeof m.xp === 'number' && typeof RankingModule !== 'undefined') {
                    currentRankName = RankingModule.getRankForXP(m.xp).name;
                } else if (m.rank) {
                    currentRankName = m.rank;
                }
                
                slugs.forEach(slug => {
                    const paths = clone.querySelectorAll(`.muscle-path[data-muscle="${slug}"]`);
                    paths.forEach(path => {
                        const rankVisuals = getRankVisuals(currentRankName);
                        const rankColor = rankVisuals.solid;
                        path.style.fill = rankColor;
                        
                        // Add interactivity
                        path.style.cursor = 'pointer';
                        path.style.transition = 'filter 0.2s';
                        
                        // Lowered drop shadow slightly because the paths are tightly packed
                        if (currentRankName.indexOf('Unranked') === -1) {
                            path.style.filter = `drop-shadow(0 0 3px ${rankColor})`;
                        } else {
                            path.style.filter = 'none';
                        }
                        
                        path.addEventListener('mousemove', (e) => {
                            path.style.filter = 'brightness(1.5)';
                            if (tooltip) {
                                tooltip.innerHTML = `<strong>${m.name}</strong><br><span style="color:${rankColor}">${currentRankName}</span>`;
                                tooltip.style.opacity = '1';
                                tooltip.classList.remove('hidden');
                                tooltip.style.left = e.pageX + 'px';
                                tooltip.style.top = (e.pageY - 40) + 'px';
                            }
                        });
                        
                        path.addEventListener('mouseleave', () => {
                            if (currentRankName.indexOf('Unranked') === -1) {
                                path.style.filter = `drop-shadow(0 0 3px ${rankColor})`;
                            } else {
                                path.style.filter = 'none';
                            }
                            if (tooltip) {
                                tooltip.style.opacity = '0';
                                setTimeout(() => tooltip.classList.add('hidden'), 200);
                            }
                        });
                    });
                });
            });

            container.innerHTML = '';
            container.appendChild(clone);
        }
    },

    calculateRivalTopLifts(logs) {
        const bestLifts = {};
        logs.forEach(session => {
            if (!session.exercises) return;
            session.exercises.forEach(ex => {
                // Ignore bodyweight exercises for top 3 lifts
                if (typeof ExerciseModule !== 'undefined') {
                    const dbEx = ExerciseModule.getExerciseById(ex.id);
                    if (dbEx && dbEx.isBodyweight) return;
                }
                
                if (!ex.sets) return;
                ex.sets.forEach(set => {
                    if (set.reps > 0 && set.weight > 0) {
                        if (!bestLifts[ex.id] || bestLifts[ex.id].weight < set.weight) {
                            bestLifts[ex.id] = { weight: set.weight, reps: set.reps, name: ex.name || ex.id };
                        }
                    }
                });
            });
        });

        const sorted = Object.values(bestLifts).sort((a, b) => b.weight - a.weight).slice(0, 3);
        const container = document.getElementById('player-card-top-lifts');
        container.innerHTML = '';
        
        if (sorted.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 1.1rem;">No lifts recorded.</p>';
            return;
        }

        sorted.forEach((lift, idx) => {
            const div = document.createElement('div');
            div.style.cssText = 'background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ' + (idx === 0 ? 'gold' : idx === 1 ? 'silver' : '#CD7F32');
            div.innerHTML = `
                <div style="font-weight: bold; font-size: 1.2rem;">${lift.name}</div>
                <div style="color: var(--neon-primary); font-weight: bold; font-size: 1.3rem;">${lift.weight}kg <span style="color: var(--text-secondary); font-weight: normal; font-size: 1rem;">x ${lift.reps}</span></div>
            `;
            container.appendChild(div);
        });
    },

    renderRivalShowcase(urls, isMe = false) {
        const container = document.getElementById('player-card-showcase');
        
        if (!urls || urls.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem; align-self: center;">No cards showcased.</p>';
            return;
        }

        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.gap = '25px';
        container.style.flexWrap = 'nowrap';
        container.style.overflowX = 'auto';
        container.style.padding = '40px 20px';
        container.style.maxWidth = '100%';

        urls.forEach((url, index) => {
            const cardWrap = document.createElement('div');
            const isShiny = url.includes('Shiny');
            const borderColor = isShiny ? '#FFD700' : 'var(--neon-primary)';
            
            // Apply responsive classes
            cardWrap.className = 'showcase-card-wrapper';
            cardWrap.style.border = '2px solid ' + borderColor;
            cardWrap.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8), 0 0 12px ' + borderColor + '60';
            
            const img = document.createElement('img');
            img.src = url;
            img.className = 'showcase-card-img';
            
            // Hover effect for the card itself
            cardWrap.onmouseover = () => {
                img.style.transform = 'scale(1.05)';
            };
            cardWrap.onmouseout = () => {
                img.style.transform = 'scale(1)';
            };
            
            // Full screen view on click
            cardWrap.style.cursor = 'pointer';
            cardWrap.onclick = () => {
                if(window.openLightbox) window.openLightbox(urls, index);
            };

            cardWrap.appendChild(img);
            
            const itemContainer = document.createElement('div');
            itemContainer.style.display = 'flex';
            itemContainer.style.flexDirection = 'column';
            itemContainer.style.alignItems = 'center';
            itemContainer.style.gap = '10px';
            itemContainer.appendChild(cardWrap);

            container.appendChild(itemContainer);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    RivalsModule.init();
});
