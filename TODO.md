General:

* finish refactor
* Refactor / clean CSS
* Export markdown preview to HTML
* Drag and drop to move files
* Keyboard navigation (up, down, check file, open file, move between buttons)
* Better accessibility
* Upload progress status for large files
* Better mobile UI
* Fix dark theme
* Add breadcrumbs navigation

Multimedia:

* Gallery view
* Navigation between images with buttons and keyboard
* Upload of images from the markdown editor

Host features:

* Support WebDAV property that says if file has a thumbnail to display
* Support for NextCloud sharing
* Support for colors from NextCloud capabilities
* Support for custom additional CSS
* Custom toolbar buttons (eg. search)
* Custom actions for one file (eg. list file versions)
* Custom actions for selected files (eg. assign files to accounting)
* Support for NextCloud upload by chunks for large files (maybe?)
* Support locking parent level directory access
* Save sorting preference and gallery/list preference in server
* Better integration if living inside an iframe
* Loading of resized image when previewing image (NextCloud API)
* Support for virtual folders (eg. last modified files) -> the server just provides a WebDAV endpoint, but it clearly says in PROPFIND that this is virtual, so that the manager shows the actual location of the file
* Custom folder color?