var wopi = {discovery_url: null, mimes: {}, extensions: {}};

wopi.OPENDOCUMENT_TEMPLATES = {
	'ods': 'UEsDBBQAAAAAAOw6wVCFbDmKLgAAAC4AAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0UEsDBBQAAAAIABxZFFFL43PrmgAAAEABAAAVAAAATUVUQS1JTkYvbWFuaWZlc3QueG1slVDRDoMgDHz3KwjvwvZK1H9poEYSKETqon8vLpluWfawPrXXy921XQTyIxY2r0asMVA5x14uM5kExRdDELEYtiZlJJfsEpHYfPLNXd2kGBpRqzvB0QdsK3nexIUtIbQZeOqllhcc0XloecvYS8g5eAvsE+kHOfWMod7dVckzgisTIkv9p61NxIdGveBHAMaV9bGu0p3++tXQ7FBLAwQUAAAACAAAWRRRA4GGVIkAAAD/AAAACwAAAGNvbnRlbnQueG1sXY/RCsIwDEWf9SvG3uv0Ncz9S01TLLTNWFJwf29xbljzEu49N1wysvcBCRxjSZTVIGetu3ulmAU2eu/LkoGtBIFsEwkoAs+U9yv4TcPtcu2nc1dn/DqCS5hVuqG1fe0y3iIZRxg/+LQzW5ST1YBGdI3Uwge7tcpDy7yQdfIk0i03NMFD/n85vQFQSwECFAMUAAAAAADsOsFQhWw5ii4AAAAuAAAACAAAAAAAAAAAAAAAtIEAAAAAbWltZXR5cGVQSwECFAMUAAAACAAcWRRRS+Nz65oAAABAAQAAFQAAAAAAAAAAAAAAtIFUAAAATUVUQS1JTkYvbWFuaWZlc3QueG1sUEsBAhQDFAAAAAgAAFkUUQOBhlSJAAAA/wAAAAsAAAAAAAAAAAAAALSBIQEAAGNvbnRlbnQueG1sUEsFBgAAAAADAAMAsgAAANMBAAAAAA==',
	'odp': 'UEsDBBQAAAAAAC6dVEszJqyoLwAAAC8AAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvblBLAwQUAAAACAAsYRRRP7fJFJoAAABBAQAAFQAAAE1FVEEtSU5GL21hbmlmZXN0LnhtbJVQwQqDMAy97ytK77bbNaj/EmpkhTYtNg79+1VhujF2WC5JXh7vJWkjsh+pCLwKtcTA5Wg7PU8MCYsvwBipgDhImXhIbo7EAp98uJmrVv1F1WgPcPSBmkqeVnVicwhNRrl32uoTjjR4bGTN1GnMOXiH4hPbBw9mX8O8u5s8Ual552j7p69LLJtIPeHHBkKL2G1cpVv79az+8gRQSwMEFAAAAAgAMl4UUXz4vRWJAAAA/gAAAAsAAABjb250ZW50LnhtbF2P0QqDMAxFn+dXiO+d22tw/ksXUyjYpJgI8+8tOGVdXsK994Qkg4QQkWASXBOxORS20ttPmlnhSF/dujCI16jAPpGCIUgmPqfgl4bn/dGNTVtq+DqKS8ymbT82t9MLZZELHslNhHOd+dUkeYvo1LaZ6vAt01bkpfNCWm4ouPAB9hV5yf8fx2YHUEsBAhQDFAAAAAAALp1USzMmrKgvAAAALwAAAAgAAAAAAAAAAAAAALSBAAAAAG1pbWV0eXBlUEsBAhQDFAAAAAgALGEUUT+3yRSaAAAAQQEAABUAAAAAAAAAAAAAALSBVQAAAE1FVEEtSU5GL21hbmlmZXN0LnhtbFBLAQIUAxQAAAAIADJeFFF8+L0ViQAAAP4AAAALAAAAAAAAAAAAAAC0gSIBAABjb250ZW50LnhtbFBLBQYAAAAAAwADALIAAADUAQAAAAA=',
	'odg': 'UEsDBBQAAAAAAE8+S1PfJa3pNAAAADQAAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmdyYXBoaWNzLXRlbXBsYXRlUEsDBBQAAAAIALZDh1ScUI71nQAAAEEBAAAVAAAATUVUQS1JTkYvbWFuaWZlc3QueG1slVDNDoIwDD7LU5Ddt+l1Ad+lGUWWbF3DioG3F0kEjfHgrf365ftpk4BCj0Xca6jnFKnsa6umkVyGEoojSFiceJcZqct+SkjiPvnuYs7qWp2aHehDRL0Sx6U+sClGzSBDq6w64IRdAC0LY6uAOQYPEjLZO3Vmi2Denc1tBB6CL1owcQRBVdt/rH0meeqsDX6EEJzFbudVuLFfz7pWD1BLAwQUAAAACADDQ4dUUZP77oMAAAD2AAAACwAAAGNvbnRlbnQueG1sXY9BCoNADEXX9RTifmq7Dda7TDOZMjCTiIlUb1/BVrSr8PJ+CL+TGBMSBMGpEJtDYVtnPZfMCpt9NNPIIF6TAvtCCoYgA/HvCo5puF9vTV9dui8qjmkwrdvDLq5fXPRILhDms/OTSfGW0Kktmc7yKWFZcecw+nfi15ZpT6Ed/7v11QdQSwECFAMUAAAAAABPPktT3yWt6TQAAAA0AAAACAAAAAAAAAAAAAAAtIEAAAAAbWltZXR5cGVQSwECFAMUAAAACAC2Q4dUnFCO9Z0AAABBAQAAFQAAAAAAAAAAAAAAtIFaAAAATUVUQS1JTkYvbWFuaWZlc3QueG1sUEsBAhQDFAAAAAgAw0OHVFGT++6DAAAA9gAAAAsAAAAAAAAAAAAAALSBKgEAAGNvbnRlbnQueG1sUEsFBgAAAAADAAMAsgAAANYBAAAAAA==',
	'odt': 'UEsDBBQAAAAAAPMbH0texjIMJwAAACcAAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHRQSwMEFAAAAAgA3U0SUeqX5meSAAAAMQEAABUAAABNRVRBLUlORi9tYW5pZmVzdC54bWyVUEEOgzAMu+8VqHfa7Rq1/CUqQavUphUNE/wemDTYNO2wW2I7thWbkMNAVeA1NHOKXI/VqWlkyFhDBcZEFcRDLsR99lMiFvjUw01fVXdp7AEMIVK7CcelObEpxrag3J0y6oQT9QFbWQo5haXE4FFCZvPgXj8r6PdkLTSLMv+E+cyyX26df8TunmanN19rvr7TrVBLAwQUAAAACACQThJRWmJBaH8AAADjAAAACwAAAGNvbnRlbnQueG1sXY/RCsMgDEXf+xWj767ba+j8FxcjCGpKE6H9+wlbRfYUbs69uWTlECISeMaaqahBLtrm7cipCHzpa657AXYSBYrLJKAIvFG5UjC64Xl/zHZaf0pwj5vKYq9FaA0mOCTjCdMAXFXOTiMa0TNRI/3Im/3ZfUqHttQysqnL/0/sB1BLAQIUAxQAAAAAAPMbH0texjIMJwAAACcAAAAIAAAAAAAAAAAAAACkgQAAAABtaW1ldHlwZVBLAQIUAxQAAAAIAN1NElHql+ZnkgAAADEBAAAVAAAAAAAAAAAAAACkgU0AAABNRVRBLUlORi9tYW5pZmVzdC54bWxQSwECFAMUAAAACACQThJRWmJBaH8AAADjAAAACwAAAAAAAAAAAAAApIESAQAAY29udGVudC54bWxQSwUGAAAAAAMAAwCyAAAAugEAAAAA'
};

wopi.propfind_xml = '<' + `?xml version="1.0" encoding="UTF-8"?>
	<D:propfind xmlns:D="DAV:" xmlns:W="https://interoperability.blob.core.windows.net/files/MS-WOPI/">
		<D:prop>
			<W:wopi-url/><W:token/><W:token-ttl/>
		</D:prop>
	</D:propfind>`;

wopi.init = async function (discovery_url) {
	try {
		var d = await reqXML('GET', discovery_url);
	}
	catch (e) {
		// FIXME: notify
		return;
	}

	d.querySelectorAll('app').forEach(app => {
		var mime = (a = app.getAttribute('name').match(/^.*\/.*$/)) ? a[0] : null;
		wopi.mimes[mime] = {};

		app.querySelectorAll('action').forEach(action => {
			var ext = action.getAttribute('ext').toUpperCase();
			var url = action.getAttribute('urlsrc').replace(/<[^>]*&>/g, '');
			var name = action.getAttribute('name');

			if (mime) {
				wopi.mimes[mime][name] = url;
			}
			else {
				if (!wopi.extensions.hasOwnProperty(ext)) {
					wopi.extensions[ext] = {};
				}

				wopi.extensions[ext][name] = url;
			}
		});
	});
};

wopi.getEditURL = (name, mime) => {
	var file_ext = name.replace(/^.*\.(\w+)$/, '$1').toUpperCase();

	if (wopi.mimes.hasOwnProperty(mime) && wopi.mimes[mime].hasOwnProperty('edit')) {
		return wopi.mimes[mime].edit;
	}
	else if (wopi.extensions.hasOwnProperty(file_ext) && wopi.extensions[file_ext].hasOwnProperty('edit')) {
		return wopi.extensions[file_ext].edit;
	}

	return null;
};

wopi.getViewURL = (name, mime) => {
	var file_ext = name.replace(/^.*\.(\w+)$/, '$1').toUpperCase();

	if (wopi.mimes.hasOwnProperty(mime) && wopi.mimes[mime].hasOwnProperty('view')) {
		return wopi.mimes[mime].view;
	}
	else if (wopi.extensions.hasOwnProperty(file_ext) && wopi.extensions[file_ext].hasOwnProperty('view')) {
		return wopi.extensions[file_ext].view;
	}

	return wopi.getEditURL(name, mime);
};

wopi.open = async (document_url, wopi_url) => {
	var properties = await reqXML('PROPFIND', document_url, wopi.propfind_xml, {'Depth': '0'});
	var src = (a = properties.querySelector('wopi-url')) ? a.textContent : null;
	var token = (a = properties.querySelector('token')) ? a.textContent : null;
	var token_ttl = (a = properties.querySelector('token-ttl')) ? a.textContent : +(new Date(Date.now() + 3600 * 1000));

	if (!src || !token) {
		alert('Cannot open document: WebDAV server did not return WOPI properties');
	}

	wopi_url += '&WOPISrc=' + encodeURIComponent(src);

	browser.openDialog(wopi_dialog, false);
	$('dialog').className = 'preview';

	var f = $('dialog form');
	f.target = 'wopi_frame';
	f.action = wopi_url;
	f.method = 'post';
	f.insertAdjacentHTML('beforeend', `<input name="access_token" value="${token}" type="hidden" /><input name="access_token_ttl" value="${token_ttl}" type="hidden" />`);
	f.submit();
};
