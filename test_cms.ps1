$form = @{
  userid = 'aa11909'
  userpwd = 'GOODYEARthailand1234'
  tnsname = 'ORA'
}
$res1 = Invoke-WebRequest -Uri 'https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi' -Method Post -Body $form -SessionVariable sess -SkipCertificateCheck
$res1.Content
