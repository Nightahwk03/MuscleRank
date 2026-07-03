$setsUrl = "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json"
$cardsBaseUrl = "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/"

Write-Host "Fetching sets..."
$setsResponse = Invoke-RestMethod -Uri $setsUrl

# Sort sets by release date descending
$sortedSets = $setsResponse | Sort-Object { [datetime]$_.releaseDate } -Descending

# Take all sets
$recentSets = $sortedSets

$finalData = @{}

foreach ($set in $recentSets) {
    Write-Host "Fetching cards for set: $($set.name) ($($set.id))..."
    $cardsUrl = "$cardsBaseUrl$($set.id).json"
    
    try {
        $cardsResponse = Invoke-RestMethod -Uri $cardsUrl
        
        $mappedCards = @()
        foreach ($c in $cardsResponse) {
            $imageUrl = ""
            if ($null -ne $c.images) {
                if ($null -ne $c.images.large) {
                    $imageUrl = $c.images.large
                } elseif ($null -ne $c.images.small) {
                    $imageUrl = $c.images.small
                }
            }
            
            $rarity = "Common"
            if ($null -ne $c.rarity) {
                $rarity = $c.rarity
            }
            
            $mappedCards += @{
                id = $c.id
                name = $c.name
                rarity = $rarity
                image = $imageUrl
            }
        }
        
        $finalData[$set.name] = $mappedCards
    } catch {
        Write-Host "Failed to fetch cards for $($set.name)"
    }
}

Write-Host "Generating JS file..."
$jsonString = $finalData | ConvertTo-Json -Depth 5
$jsContent = "const PACK_PULL_DATA = $jsonString;"

Set-Content -Path ".\js\pack-pull-data.js" -Value $jsContent
Write-Host "Done! Wrote to .\js\pack-pull-data.js"
