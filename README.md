# WebDAV Manager, a lightweight JS WebDAV client

This is drop-in JS client that you can use to enhance the web interface of a WebDAV file server. Or you can use it on your computer to access any WebDAV server without installing anything.

![](https://kd2org.github.io/webdav-manager.js/scr_2.jpg)

## Features

* Create new directories
* Create and edit text file
* Delete files and directories
* Rename and move files and directories
* Upload files directly from browser
* Upload files using copy and paste!
* Upload files with drag and drop
* Preview of images, text, videos, audio, MarkDown and PDF
* [MarkDown live preview when editing MarkDown files](https://kd2org.github.io/webdav-manager.js/scr_1.jpg)
* Support for viewing/editing document files via WOPI clients (OnlyOffice, Collabora Online, MS Office)
* Download files
* Localization support
* Responsive: works with mobiles and desktop browsers
* Support for light and dark theme
* Only 8KB gzipped!
* Single file, self-contained, no dependencies, no silly NPM stuff!

### Planned features

* Order files by date or size
* Select multiple items to move/delete
* Upload progress status for large files
* [Resumable upload via TUS](https://tus.io/protocols/resumable-upload.html) to upload large files

## Compatibility

This has been tested with the following servers:

* [KaraDAV](https://github.com/kd2org/karadav/)
* Apache 2.4 mod_dav
* NextCloud

## Demo

You can try the demo live at [https://kd2org.github.io/webdav-manager.js/demo.html](https://kd2org.github.io/webdav-manager.js/demo.html).

You can review the source code in this repo: the password is never stored, and only sent to the WebDAV server as part of basic auth.

This demo will only work with a WebDAV server that allows cross-origin requests (see section on CORS below).

## Usage

If your HTML page has a `data-webdav-url` attribute, the file manager will open up automatically using this URL when loading the javascript:

```
<html data-webdav-url="http://localhost:8080/dav/files/user/">
<body>
<script type="text/javascript" src="webdav.js"></script>
</body>
</html>
```

If you want to specify extra options, you can also just call the `WebDAVNavigator` function, the fist parameter being the WebDAV URL and the second being an object defining options.

```
WebDAVNavigator('http://localhost:8080/dav/', {'user': 'demo', 'password': 'abcd'});
```

### Options

* `user`: HTTP basic auth user name
* `password`: HTTP basic auth user password (not required if the HTML page is already in a password-protected directory)
* `wopi_host_url`: URL of the WOPI host to edit Office documents
* `wopi_discovery_url`: URL of the WOPI discovery XML, used to edit Office documents

## Install as the client for your WebDAV server

Just copy the `webdav.js`, `webdav.css` and `index.html` files to the root of your web server.

Edit the `index.html` file and change `data-webdav-url="/dav/"` to the actual web path of your WebDAV server. For example with ownCloud this might be `data-webdav-url="/owncloud/remote.php/webdav/"`.

### With Apache

Follow a [tutorial to setup WebDAV in your Apache](https://www.digitalocean.com/community/tutorials/how-to-configure-webdav-access-with-apache-on-ubuntu-18-04) and change the virtual host to something like that:

```
<VirtualHost *:80>
	ServerName webdav.localhost
	DocumentRoot /home/web/webdav-manager.js
	DAVLockDB /home/web/davlock.db

	# Actually store files in /home/web/data
	Alias /dav /home/web/data

	<Location />
		AuthType Basic
		AuthName "webdav"
		AuthUserFile /home/web/users.htpasswd
		Require valid-user
	</Location>
</VirtualHost>

<Directory /home/web/data>
	# Disable handlers
	<FilesMatch ".+\.*$">
		SetHandler !
	</FilesMatch>

	# Disable PHP
	<IfModule mod_php.c>
		php_flag engine off
	</IfModule>

	DAV On

	# Magic: use WebDAV manager for directory listings
	RewriteEngine On
	RewriteCond %{REQUEST_METHOD} GET
	RewriteRule .*\/$|^$ /
</Directory>
```

## Install as a local client

Just copy the `webdav.js`, `webdav.css` and `demo.html` pages to a directory on your computer, open `demo.html` with a web browser, then fill-in the server URL, user login and password, and you'll be connected :)

### CORS

For the client to work in this mode, your WebDAV server MUST set the following HTTP headers for `OPTIONS` requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Authorization, *
Access-Control-Allow-Methods: GET,HEAD,PUT,DELETE,COPY,MOVE,PROPFIND,MKCOL,LOCK,UNLOCK
```

If your server doesn't set these headers, you won't be able to use this client, this is a security limitation of web browsers.

### NextCloud

As an example, here is the Apache configuration that will allow your local client to make requests to a NextCloud server:

```
<Location /remote.php>
	<Limit OPTIONS>
		Header always set Access-Control-Allow-Origin "*"
		Header always set Access-Control-Allow-Credentials "true"
		Header always set Access-Control-Allow-Headers "Authorization, *"
		Header always set Access-Control-Allow-Methods "GET,HEAD,PUT,DELETE,COPY,MOVE,PROPFIND,MKCOL,LOCK,UNLOCK"
		Header always set Allow "GET,HEAD,PUT,DELETE,COPY,MOVE,PROPFIND,MKCOL,LOCK,UNLOCK"
	</Limit>

	RewriteEngine On
	RewriteCond %{REQUEST_METHOD} OPTIONS
	RewriteRule ^(.*)$ $1 [R=200,L]
</Location>
```

## License

This software is available as:

* GNU Affero GPL v3 (this repo)
* A commercial license to include in proprietary products

Contact us :)

## Authors

* KD2.org / BohwaZ <https://bohwaz.net/> 2022

## Other solutions

* [webdav-js](https://github.com/dom111/webdav-js)
* [WebDavFileTree](https://github.com/Kysic/webdavFileTree)
* [WebDAV Drive](https://github.com/club-1/webdav-drive)