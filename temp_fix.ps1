$content = Get-Content "index.html" -Raw -Encoding UTF8
$content = $content -replace "� Discord Nitro Preise", "💰 Current Pricing"
$content = $content -replace "Discord Nitro Preise", "💰 Current Pricing"
$content | Set-Content "index.html" -Encoding UTF8
