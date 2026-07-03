$sourceDir = "C:\Users\Kavish Doshi\Downloads\Card Pulls"
$outPath = "C:\Users\Kavish Doshi\Downloads\MuscleRank\js\pack-pull-data.js"
$data = @{}

$dirs = Get-ChildItem -Path $sourceDir -Directory
foreach ($dir in $dirs) {
    $files = Get-ChildItem -Path $dir.FullName -File -Include *.jpg,*.jpeg,*.png -Recurse
    $filePaths = @()
    foreach ($file in $files) {
        $filePaths += "file:///$($file.FullName -replace '\\','/')"
    }
    if ($filePaths.Count -gt 0) {
        $data[$dir.Name] = $filePaths
    }
}

$json = $data | ConvertTo-Json -Depth 5
$jsContent = "const PACK_PULL_DATA = $json;"
Set-Content -Path $outPath -Value $jsContent -Encoding UTF8
Write-Host "pack-pull-data.js generated successfully!"
