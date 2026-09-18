using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Windows.Forms;

namespace GoodyearDorApp
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            string localLocalhostUrl = "http://localhost:3001/";
            string localServerUrl = "http://10.124.148.210:3001/";
            string cloudUrl = "https://gy-daily-dashboard.vercel.app/";

            string targetUrl = cloudUrl;

            try
            {
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(localLocalhostUrl + "api/waste?date=2026-09-17");
                request.Timeout = 1200;
                request.Method = "HEAD";
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    if (response.StatusCode == HttpStatusCode.OK)
                    {
                        targetUrl = localLocalhostUrl;
                    }
                }
            }
            catch
            {
                try
                {
                    HttpWebRequest request = (HttpWebRequest)WebRequest.Create(localServerUrl + "api/waste?date=2026-09-17");
                    request.Timeout = 1200;
                    request.Method = "HEAD";
                    using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                    {
                        if (response.StatusCode == HttpStatusCode.OK)
                        {
                            targetUrl = localServerUrl;
                        }
                    }
                }
                catch
                {
                    targetUrl = cloudUrl;
                }
            }

            bool launched = false;

            string[] edgePaths = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe")
            };

            string[] chromePaths = new string[]
            {
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string path in edgePaths)
            {
                if (File.Exists(path))
                {
                    try
                    {
                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = path;
                        psi.Arguments = string.Format("--app=\"{0}\" --window-size=1600,1000", targetUrl);
                        psi.UseShellExecute = true;
                        Process.Start(psi);
                        launched = true;
                        break;
                    }
                    catch { }
                }
            }

            if (!launched)
            {
                foreach (string path in chromePaths)
                {
                    if (File.Exists(path))
                    {
                        try
                        {
                            ProcessStartInfo psi = new ProcessStartInfo();
                            psi.FileName = path;
                            psi.Arguments = string.Format("--app=\"{0}\" --window-size=1600,1000", targetUrl);
                            psi.UseShellExecute = true;
                            Process.Start(psi);
                            launched = true;
                            break;
                        }
                        catch { }
                    }
                }
            }

            if (!launched)
            {
                try
                {
                    Process.Start(new ProcessStartInfo(targetUrl) { UseShellExecute = true });
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Cannot open DOR Dashboard: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }
    }
}
