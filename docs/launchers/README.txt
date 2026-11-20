INTEROCEPTOMICS: SHORTCUTS TO THE PROJECT PAGE

Each file here is a bookmark. It opens the Interoceptomics project page in
your browser:

  https://eliminatenoise.github.io/Interoceptomics/

That page has the download of the atlas viewer and the two scripts. The
shortcuts do not start the viewer. It has its own start files inside its
download.

Windows: double-click Interoceptomics-Windows.url.
macOS:   double-click Interoceptomics-macOS.webloc.
Linux:   open Interoceptomics-Linux.desktop from your file manager.

Keep each filename's extension. Your system may ask whether you trust the
file before it opens it.

LINUX APPLICATION MENU

Open a terminal in this folder and run:

  sh Install-Interoceptomics-Linux.sh

The installer writes one entry, brain2body-interoceptomics.desktop, into
${XDG_DATA_HOME:-$HOME/.local/share}/applications, for your user only,
and does nothing else. The entry opens the page with xdg-open. On one
Linux distribution the installer finds that system's own web-app opener
and uses it instead.

If the same entry is already there, it leaves it. If a different file has
that name, it leaves that too and tells you. An entry installed from an
earlier version of these shortcuts counts as different: delete it first.

To remove the entry, delete brain2body-interoceptomics.desktop from the
folder the installer printed. A downloaded shortcut can simply be deleted.

WHAT HAS BEEN CHECKED

The file formats of all three shortcuts, and the Linux installer in a test
folder. The Windows and macOS shortcuts have not yet been opened on those
systems.

SHA256SUMS lists the checksums of the five files in this package. A
matching checksum shows that a file arrived unchanged. It says nothing
else about it.

Repository: https://github.com/eliminatenoise/Interoceptomics
