# Minimal

* When clicking a file, instead of downloading it, display action buttons (with preview if image / PDF / etc.), also add previous/next buttons
* in WOPI/edit
* Change URL of parent window when switching folders
* Recursive download of directories in Zip file
* Display old file name when renaming
* Display more visible warning when deleting a folder "Tous les sous-dossiers et fichiers de ce dossier seront placés à la corbeille !"
* Navigation between images with buttons and keyboard
* Fix or remove dark theme

Host features:

* Support listing and deleting shares: https://docs.nextcloud.com/server/stable/developer_manual/client_apis/OCS/ocs-share-api.html#get-shares-from-a-specific-file-or-folder
* Support WebDAV SEARCH method, see https://docs.nextcloud.com/server/stable/developer_manual/client_apis/WebDAV/search.html
	* Also support for full-text search using `d:contains`: https://greenbytes.de/tech/specs/draft-reschke-webdav-search-04.html#rfc.section.5.15
* Support custom message when deleting a file / folder : "Seul un membre administrateur pourra récupérer le fichier dans la corbeille."
* Support for colors from NextCloud capabilities
* Custom navigation menu instead of "My files" in breadcrumbs
* Custom actions for one file (eg. list file versions)
* Custom actions for selected files (eg. assign files to accounting)
* Better integration if living inside an iframe
* Loading of resized image when previewing image (NextCloud API)

# Would be nice

General:

* Use SVG symbols for icons to allow custom icon colors https://www.alsacreations.com/tuto/lire/1944-appliquer-des-styles-css-a-svg.html
* Cancel download of selected files / zip during download
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
