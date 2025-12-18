$ErrorActionPreference = 'Stop'

# Fetch cases from ae800.com and write to cases/data/cases.json
# Usage (PowerShell):
#   powershell -ExecutionPolicy Bypass -File .\tools\fetch_cases.ps1
#
# Notes:
# - This script makes external HTTP requests.
# - It scrapes https://www.ae800.com/case?p=N list pages and each /case/{id} detail page.
# - It downloads ALL images found in each case detail page (img src + background-image url).

$BaseUrl = 'https://www.ae800.com'
$ListPath = '/case'
$OutJson = Join-Path $PSScriptRoot '..\cases\data\cases.json'
$AssetsRoot = Join-Path $PSScriptRoot '..\cases\assets'

function Normalize-Url {
  param(
    [string]$Base,
    [string]$Raw
  )

  if (-not $Raw) { return $null }
  $u = $Raw.Trim().Trim('"',"'",'(',')')
  if (-not $u) { return $null }

  if ($u.StartsWith('//')) { return "https:$u" }
  if ($u.StartsWith('http://') -or $u.StartsWith('https://')) { return $u }
  if ($u.StartsWith('/')) { return "$Base$u" }
  return "$Base/$u"
}

function Ensure-Dir {
  param([string]$Path)
  if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path | Out-Null }
}

function Get-ExtensionFromUrl {
  param([string]$Url)
  try {
    $u = [System.Uri]$Url
    $ext = [System.IO.Path]::GetExtension($u.AbsolutePath)
    if ($ext) { return $ext }
  } catch {}
  return '.jpg'
}

function Extract-ImageUrls {
  param(
    [string]$Html,
    [string]$Base
  )

  $urls = New-Object System.Collections.Generic.HashSet[string]

  $imgMatches = [regex]::Matches($Html, '<img[^>]+src\s*=\s*["\'](?<src>[^"\']+)["\']', 'IgnoreCase')
  foreach ($m in $imgMatches) {
    $src = $m.Groups['src'].Value
    $full = Normalize-Url -Base $Base -Raw $src
    if ($full) { [void]$urls.Add($full) }
  }

  $bgMatches = [regex]::Matches($Html, 'background-image\s*:\s*url\((?<url>[^\)]+)\)', 'IgnoreCase')
  foreach ($m in $bgMatches) {
    $raw = $m.Groups['url'].Value
    $full = Normalize-Url -Base $Base -Raw $raw
    if ($full) { [void]$urls.Add($full) }
  }

  $filtered = @()
  foreach ($u in $urls) {
    if ($u -match '\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)') {
      if ($u -notmatch '/logo' -and $u -notmatch 'favicon' -and $u -notmatch 'font') {
        $filtered += $u
      }
    }
  }
  return $filtered
}

function Download-Images {
  param(
    [string]$CaseId,
    [string[]]$Urls
  )

  if (-not $Urls -or -not $Urls.Length) { return @() }

  Ensure-Dir -Path $AssetsRoot
  $caseDir = Join-Path $AssetsRoot $CaseId
  Ensure-Dir -Path $caseDir

  $saved = @()
  $i = 1
  foreach ($u in $Urls) {
    try {
      $ext = Get-ExtensionFromUrl -Url $u
      if (-not $ext.StartsWith('.')) { $ext = ".$ext" }
      $name = ('img-{0:d3}{1}' -f $i, $ext)
      $out = Join-Path $caseDir $name

      if (-not (Test-Path $out)) {
        Write-Host "  [img] $u -> $out"
        Invoke-WebRequest -Uri $u -OutFile $out -UseBasicParsing | Out-Null
      }

      $rel = "./assets/$CaseId/$name"
      $saved += $rel
      $i++
    } catch {
      Write-Warning "  Failed image $u: $($_.Exception.Message)"
    }
  }

  return $saved
}

function Get-ListPageUrls {
  param([int]$MaxPages = 30)

  $urls = New-Object System.Collections.Generic.HashSet[string]
  for ($p = 1; $p -le $MaxPages; $p++) {
    $u = if ($p -eq 1) { "$BaseUrl$ListPath" } else { "$BaseUrl$ListPath?p=$p" }
    Write-Host "[list] $u"
    $html = (Invoke-WebRequest -Uri $u -UseBasicParsing).Content

    $matches = [regex]::Matches($html, 'href\s*=\s*"(?<href>/case/\d+)"')
    foreach ($m in $matches) {
      $href = $m.Groups['href'].Value
      if ($href) { [void]$urls.Add("$BaseUrl$href") }
    }
  }

  return $urls
}

function Parse-CaseDetail {
  param([string]$Url)

  Write-Host "[case] $Url"
  $html = (Invoke-WebRequest -Uri $Url -UseBasicParsing).Content

  $title = ''
  $mTitle = [regex]::Match($html, '<h1[^>]*>(?<t>[^<]+)</h1>', 'IgnoreCase')
  if ($mTitle.Success) { $title = ($mTitle.Groups['t'].Value).Trim() }

  $text = ($html -replace '<script[\s\S]*?</script>', '') -replace '<style[\s\S]*?</style>', ''
  $text = ($text -replace '<[^>]+>', "\n")
  $text = ($text -replace "\r", "")
  $lines = $text.Split("`n") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

  $category = ''
  $year = ''
  $city = ''
  $detail = ''

  foreach ($ln in $lines) {
    if (-not $category -and $ln -match '^项目类别[:：]\s*(.+)$') { $category = $Matches[1].Trim(); continue }
    if (-not $year -and $ln -match '^项目时间[:：]\s*(.+)$') { $year = $Matches[1].Trim(); continue }
    if (-not $city -and $ln -match '^项目地点[:：]\s*(.+)$') { $city = $Matches[1].Trim(); continue }
  }

  $idx = [Array]::IndexOf($lines, '项目详情')
  if ($idx -ge 0) {
    $detail = ($lines | Select-Object -Skip ($idx + 1) -First 8) -join "\n"
  }

  $catKey = 'all'
  if ($category -match '博物馆|纪念馆|文物|专题.*馆|展览馆|文化') { $catKey = 'museum' }
  elseif ($category -match '成就展|大型') { $catKey = 'achievement' }
  elseif ($category -match '城市|展厅|规划馆') { $catKey = 'city' }
  elseif ($category -match '标识|发光字|导视|形象|字') { $catKey = 'brand' }
  elseif ($category -match '商业|店|零售|餐饮|咖啡') { $catKey = 'retail' }

  $year4 = ''
  $mYear = [regex]::Match($year, '(\d{4})')
  if ($mYear.Success) { $year4 = $mYear.Groups[1].Value } else { $year4 = $year }

  $id = ''
  $mId = [regex]::Match($Url, '/case/(?<id>\d+)$')
  if ($mId.Success) { $id = 'case-' + $mId.Groups['id'].Value } else { $id = [guid]::NewGuid().ToString() }

  $imgUrls = Extract-ImageUrls -Html $html -Base $BaseUrl
  $images = Download-Images -CaseId $id -Urls $imgUrls

  return [ordered]@{
    id = $id
    title = $title
    category = $catKey
    original_category = $category
    city = $city
    year = $year4
    tags = @()
    scope = @()
    highlights = @()
    description = $detail
    source_url = $Url
    images = $images
  }
}

$allUrls = Get-ListPageUrls -MaxPages 20
$items = @()
foreach ($u in $allUrls) {
  try {
    $items += (Parse-CaseDetail -Url $u)
  } catch {
    Write-Warning "Failed to parse $u: $($_.Exception.Message)"
  }
}

$items = $items | Sort-Object -Property @{Expression='year';Descending=$true}, @{Expression='title';Descending=$false}

$dir = Split-Path $OutJson -Parent
Ensure-Dir -Path $dir

$out = @{ cases = $items }
$out | ConvertTo-Json -Depth 10 | Set-Content -Path $OutJson -Encoding UTF8
Write-Host "Wrote $($items.Count) cases to $OutJson"
