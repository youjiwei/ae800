function HtmlEscape([string]$s) {
    if ($null -eq $s) { return '' }
    # 转义 HTML 特殊字符
    return ($s -replace '&', '&amp;') -replace '<', '&lt;' -replace '>', '&gt;' -replace '"', '&quot;' -replace "'", '&#39;'
}

# 拼接路径时确保跨平台兼容性
$JsonPath = Join-Path $PSScriptRoot '..\cases\data\cases.json'
$OutDir = Join-Path $PSScriptRoot '..\cases'

if (-not (Test-Path $JsonPath)) {
    throw "Missing JSON: $JsonPath"
}

$casesRaw = Get-Content $JsonPath -Raw | ConvertFrom-Json
if ($casesRaw -eq $null) { throw 'JSON parse failed' }
$cases = if ($null -ne $casesRaw.cases) { $casesRaw.cases } else { $casesRaw }

# 生成页面的函数
function MakePage($c) {
    $id = if ($null -ne $c.id) { $c.id.ToString() } else { '' }
    $title = HtmlEscape($c.title)

    $descRaw = ''
    if ($null -ne $c.description) { $descRaw = $c.description.ToString() }
    $desc = HtmlEscape($descRaw)
    if (-not $desc) { $desc = '案例详情（本地化模板）。' }
    if ($desc.Length -gt 140) { $desc = $desc.Substring(0, 140) }

    $cityRaw = ''
    if ($null -ne $c.city) { $cityRaw = $c.city.ToString() }
    $city = HtmlEscape($cityRaw)

    $yearRaw = ''
    if ($null -ne $c.year) { $yearRaw = $c.year.ToString() }
    $year = HtmlEscape($yearRaw)

    $catRaw = ''
    if ($null -ne $c.category) { $catRaw = $c.category.ToString() }
    $cat = HtmlEscape($catRaw)

    $scope = @($c.scope) | Where-Object { $_ -ne $null -and $_.ToString().Trim() -ne '' } | ForEach-Object { HtmlEscape($_) }
    $high = @($c.highlights) | Where-Object { $_ -ne $null -and $_.ToString().Trim() -ne '' } | ForEach-Object { HtmlEscape($_) }
    $scopeLi = ($scope | ForEach-Object { "<li>$_</li>" }) -join "`n"
    $highLi = ($high | ForEach-Object { "<li>$_</li>" }) -join "`n"

    # 生成 JSON-LD 数据
    $jsonLd = @"
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "首页", "item": "https://www.ae800.com/"},
        {"@type": "ListItem", "po
