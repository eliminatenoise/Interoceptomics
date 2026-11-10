INTEROCEPTOMICS: OPEN THE CURRENT PREVIEW

Open the current script hub, then choose the technical or simple script as PDF or editable DOCX. Your normal document viewer opens the downloaded file.

Windows: download Interoceptomics-Windows.url and double-click it.
macOS: download Interoceptomics-macOS.webloc and double-click it.
Linux: open Interoceptomics-Linux.desktop with your desktop's normal launcher handling.
Keep each filename's extension. If the browser displays the file as text,
download the ZIP, extract it, and open the launcher for your system.
Follow normal OS opening/trust prompts. Native Windows/macOS operation has
not been tested by this package's Linux-only format checks.

For a Linux application-menu entry, extract the ZIP, open a terminal in that
folder and run:
  sh Install-Interoceptomics-Linux.sh
The installer opens no browser. It writes one per-user application entry in
${XDG_DATA_HOME:-$HOME/.local/share}/applications. It prefers the installed
Omarchy web-app opener, otherwise xdg-open. It needs normal Linux shell/core
utilities and a configured browser; it installs no software or background job.
An identical managed entry is left intact. Any different file or symlink
using the destination name is preserved. The URL stays current when the
published preview changes, so a new build does not require reinstallation.
To remove the menu entry later, delete brain2body-interoceptomics.desktop from the
location printed by the installer. Downloaded bookmarks can be deleted normally.

Direct preview: https://eliminatenoise.github.io/Interoceptomics/
Project and source: https://github.com/eliminatenoise/Interoceptomics
Source ZIP: https://github.com/eliminatenoise/Interoceptomics/archive/refs/heads/main.zip

This is a partial script preview. The newer slide deck is excluded while exact image permissions remain unresolved. Older deck and model downloads are historical and do not form a matching package with these scripts.

These are online URL launchers, not offline model/app bundles. Opening the
public preview needs a network connection and browser. No Node/Python install
is needed to open it. Document viewing may use your normal PDF/DOCX application.
The launchers contain no weights, recordings, credentials or private paths.
SHA256SUMS identifies the five launcher/instruction files in this package;
it does not establish OS trust, scientific validation or source authentication.
