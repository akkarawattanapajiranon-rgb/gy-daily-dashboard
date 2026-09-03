$form = @{
    userid = 'aa11909'
    userpwd = 'GOODYEARthailand1234'
    tnsname = 'db_server'
}

$res1 = Invoke-WebRequest -Uri 'https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi' -Method Post -Body $form -SessionVariable 'cmsSession' -UseBasicParsing -ErrorAction SilentlyContinue

$orapwd = ''
if ($res1.Content -match 'name="orapwd"\s+value="([^"]+)"') {
    $orapwd = $matches[1]
} elseif ($res1.Content -match 'value="([^"]+)"\s+name="orapwd"') {
    $orapwd = $matches[1]
}

if (-not $orapwd) {
    "Failed to find orapwd"
    exit
}

$today = Get-Date -Format "M/d/yy"
$reportForm = @{
    report = 'mixer_oee.sql'
    extraparams = "start=$today end=$today crew=ALL mixer=1,2,3,12,13,81,83,84 cmpd=%"
    userid = 'aa11909'
    orapwd = $orapwd
    tnsname = 'db_server'
    action = 'runtable'
}

$res2 = Invoke-WebRequest -Uri 'https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi' -Method Post -Body $reportForm -WebSession $cmsSession -UseBasicParsing -ErrorAction SilentlyContinue

if ($res2) {
    $res2.Content | Out-File -FilePath "report_output.html" -Encoding utf8
    "Success! Saved to report_output.html"
} else {
    "Failed to fetch report"
}
