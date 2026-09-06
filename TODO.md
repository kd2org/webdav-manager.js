# Minimal

* Support displaying used / available quota
* Display old file name when renaming
* Display more visible warning when deleting a folder "Tous les sous-dossiers et fichiers de ce dossier seront placés à la corbeille !"
* Add breadcrumbs navigation
* Navigation between images with buttons and keyboard
* Fix or remove dark theme
* Change "OK" action buttons to have an actionable verb (eg. "Delete", "Rename", etc.)

Host features:

* Support for options.has_trash to have different dialogs/messages if the server puts files in trash
* Support custom message when deleting a file / folder : "Seul un membre administrateur pourra récupérer le fichier dans la corbeille."
* Support for basic NextCloud sharing API
* Support for colors from NextCloud capabilities
* Support for search button
* Custom actions for one file (eg. list file versions)
* Custom actions for selected files (eg. assign files to accounting)
* Better integration if living inside an iframe
* Loading of resized image when previewing image (NextCloud API)

# Would be nice

General:

* Export markdown preview to HTML
* Drag and drop to move files
* Keyboard navigation (up, down, check file, open file)
* Better accessibility
* Upload progress status for large files

Multimedia:

* Upload of images from the markdown editor

Host features:

* Support for custom additional CSS
* Save sorting preference and gallery/list preference in server

NextCloud features:

* Support for NextCloud upload by chunks for large files (maybe?)
* Support for virtual folders (eg. last modified files) -> the server just provides a WebDAV endpoint, but it clearly says in PROPFIND that this is virtual, so that the manager shows the actual location of the file
* Custom folder colors?
