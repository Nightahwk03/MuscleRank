const fs = require('fs');
const https = require('https');

const SETS_URL = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json';
const CARDS_BASE_URL = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/';

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    console.log('Fetching sets...');
    let sets;
    try {
        sets = await fetchJson(SETS_URL);
    } catch(err) {
        console.error('Error fetching sets:', err);
        return;
    }

    // Sort sets by release date descending (newest first)
    sets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

    // Limit to the 30 most recent sets (approx all of Scarlet/Violet & Sword/Shield)
    const recentSets = sets.slice(0, 30);
    console.log(`Processing ${recentSets.length} sets...`);

    const finalData = {};

    for (const set of recentSets) {
        console.log(`Fetching cards for set: ${set.name} (${set.id})...`);
        try {
            const cards = await fetchJson(`${CARDS_BASE_URL}${set.id}.json`);
            
            finalData[set.name] = cards.map(c => ({
                id: c.id,
                name: c.name,
                rarity: c.rarity || 'Common',
                image: c.images ? c.images.large : (c.images ? c.images.small : '')
            }));
            
            // Sleep slightly to avoid overwhelming github raw limit
            await new Promise(r => setTimeout(r, 100));
        } catch(err) {
            console.error(`Failed to fetch cards for ${set.name}:`, err.message);
        }
    }

    console.log('Generating JS file...');
    const jsContent = `const PACK_PULL_DATA = ${JSON.stringify(finalData, null, 4)};`;
    
    fs.writeFileSync('./js/pack-pull-data.js', jsContent);
    console.log('Done! Wrote to ./js/pack-pull-data.js');
}

run();
