// Rev.01: MJH  9/17/2001.  Initial release.
// Rev.02: MJH 12/17/2001.  Fix to correct problem where cmpd typed but focus not removed from cmpdtext field.
// Rev.03: MJH 10/11/2005.  Added conversion of mixer to string variable (previously done in cgi script).  Allows easier passing to mixspecprompt.
// Rev.04: NPS 08/14/2008.  Added support for CMPD_VIEW to view Booksheets
// Rev.05: NPS 09/22/2008.  Restricted access to booksheet, book_percent, passratio, and cost reports to just compounders
// Rev.06: NPS 12/14/2008.  Added lut_mixspec report support
// Rev.06: NPS 11/05/2010.  Added tpk_mixspec report support
//

function selectreport(selectedreport, inputprompt, inputdefault) {

  if (((selectedreport=="booksheet") || (selectedreport=="book_percent") || (selectedreport=="passratio") || (selectedreport=="cost") || (selectedreport=="minper1000") || (selectedreport=="specphasecompare"))
  && ((document.parameterform.priv.value != "C") && (document.promptform.priv.value != "V") && (document.promptform.priv.value != "Z"))) {
     alert("This report requires Compounder or Verifier privilege in MASDA.");
  }
  else {

   var mixer = '';
   for(var x=1;x<100;x++) {
      if (typeof(document.parameterform["cb"+x]) != "undefined") {
         if (document.parameterform["cb"+x].checked) {mixer = mixer + document.parameterform["cb"+x].value + ',';}
      }
   }
   document.parameterform.mixer.value = mixer;

   var selectedaction = document.parameterform.action;
   var valueaction = selectedaction.options[selectedaction.selectedIndex].value;
   document.parameterform.report.value = selectedreport;
   if (document.parameterform.cmpdtext.value=='')
      {var selectedcmpd = document.parameterform.cmpdselect;
       document.parameterform.cmpd.value = selectedcmpd.options[selectedcmpd.selectedIndex].value;
      }
   else
      {document.parameterform.cmpd.value = document.parameterform.cmpdtext.value;
      }
   document.parameterform.reportentry.focus();
   if (inputprompt==null) {inputprompt="";}
   if (inputdefault==null) {inputdefault="";}
   document.parameterform.extraparams.value = inputdefault;
   document.parameterform.inputprompt.value = inputprompt;

   var ah = screen.availHeight - 30;
   var aw = screen.availWidth - 10;

   if (valueaction=="help") {
      window.open("/cms/reporthelp/" + selectedreport + ".htm","_blank","toolbar=no,location=yes,directories=no,status=yes,menubar=yes,scrollbars=yes,resizable=yes");
   }
   else if (inputprompt != "") {
      var wd = 600;
      var ht = 200;
      newinputwin = window.open("/cms/inputprompt.html","inputprompt","width=" + wd + ",height=" + ht + ",screenX=" + ((aw-wd)/2) + ",screenY=" + ((ah-ht)/2) + ",top=" + ((ah-ht)/2) + ",left=" + ((aw-wd)/2) + ",toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no");
      newinputwin.focus();
   }
   else if ((selectedreport=="booksheet") || (selectedreport=="mixspec") || (selectedreport=="pigspec") || (selectedreport=="mixspecman") || (selectedreport=="pigspecman") || (selectedreport=="fay_mixspec") || (selectedreport=="lut_mixspec") || (selectedreport=="lut_slbspec") || (selectedreport=="balespec") || (selectedreport=="tpk_mixspec") || (selectedreport=="tpk_slbspec") ) {
         var wd = 700;
         var ht = 600;
         document.promptform.cmpd.value = document.parameterform.cmpd.value;
         document.promptform.report.value = document.parameterform.report.value;
         document.promptform.mixer.value = mixer;
         newpromptwin = window.open("/cms/connecting.html","promptwindow","width=" + wd + ",height=" + ht + ",screenX=" + ((aw-wd)/2) + ",screenY=" + ((ah-ht)/2) + ",top=" + ((ah-ht)/2) + ",left=" + ((aw-wd)/2) + ",toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no");
         newpromptwin.opener.document.promptform.submit();
         newpromptwin.focus();
   }
   else {
      document.parameterform.submit();
   }
  }
}
