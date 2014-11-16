/* General javascript utils loaded on all pages */

/* A centered pop-up window for any cases that might need one */
function CenterPopUp( URL, name, width, height ) {
	var left = ( screen.width - width ) / 2;
	var top  = ( screen.height - height ) / 2;
	var settings;

	if( left < 0 ) left = 0;
	if( top < 0 ) top = 0;

	settings = 'width=' + width + ',';
	settings += 'height=' + height + ',';
	settings += 'top=' + top + ',';
	settings += 'left=' + left;

	window.open( URL, name, settings );
}

/* Use this when wanting a function to run onload. That way you allow
multiple functions to run onload without needing to be aware of the other */
function addLoadEvent(func) {
	if (typeof window.attachEvent != 'undefined') {
		window.attachEvent("onload", func);
	} else {
		var oldonload = window.onload;
		if (typeof window.onload != 'function') {
			window.onload = func;
		} else {
			window.onload = function() {
				oldonload();
				func();
			};
		}
	}
}

/* This adds JSON processing to the string class
See http://json.org for more info */
String.prototype.parseJSON = function () {
    try {
        return !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
                this.replace(/"(\\.|[^"\\])*"/g, ''))) &&
            eval('(' + this + ')');
    } catch (e) {
        return false;
    }
};

/* For upload forms */
function sendForm(form) {
    UploadBoxToggle()
    var fd = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", uploadProgress, false);
    xhr.upload.addEventListener("load", uploadComplete, false);
    xhr.open("POST", form.action += ((/\?/).test(form.action) ? "&" : "?") + (new Date()).getTime(), true);
    xhr.send(fd);
}

/* For upload forms */
function uploadProgress(evt) {
    var percentComplete = Math.round(evt.loaded * 100 / evt.total);
    document.getElementById('prog').value = percentComplete;
    document.getElementById('percent').innerHTML = percentComplete+"%<br />"+evt.loaded+" of "+evt.total;
}

/* For upload forms */
function uploadComplete(evt) {
    window.location = "http://yoursite.com/someredirect.php"
}

/* The below functions are for handling the XMLHttpRequest object */

/* Request a HTTP object. If there are multiple http requests going on then
we may have more than one object being used at a time */
function getHTTPObject(func) {
	
	function requestHandler() {
		var httpRequester = null;
		if (typeof window.XMLHttpRequest != 'undefined') {
			httpRequester = new XMLHttpRequest();
		} else if (typeof window.ActiveXObject != 'undefined') {
			try {
				httpRequester = new ActiveXObject("Msxml2.XMLHTTP");
			} catch(e) {
				try {
					httpRequester = new ActiveXObject("Microsoft.XMLHTTP");
				} catch(e) {
					httpRequester = null;
				}
			}
		}
		
		if (httpRequester) this.ready = true;
		else this.ready = false;
		
		var stateHandler = function() {
				if (httpRequester.readyState == 4) {
					func(httpRequester.responseText);
				}                             
			};
			
		this.requestData = function() {
			var pathName = location.pathname;
			
			var url = pathName.substring(pathName.lastIndexOf("/") + 1, pathName.length);
			
			if (arguments.length > 0) {
				url += '?a=' + arguments[0];
			}
			for (var i=1; (i + 1) < arguments.length; i+=2) {
				url += "&" + arguments[i] + "=" + escape(arguments[i+1]);
			}
			
			httpRequester.open("GET", url, true);
			httpRequester.onreadystatechange = stateHandler;
			httpRequester.send(null);
		};
	}
	
	var waystation = new requestHandler();
	
	if (!waystation.ready) return null;
	
	return waystation
}

/* this can be run in an onload event. It will make an HTTP request for the language
data for javascript and store it in a variable. Once done it will run the function
passed to 'alert' any other scripts */
var js_lang = null;
var js_lang_httpFetcher = null;

function load_js_lang(func) {
	if (js_lang === null) {
		var handler = function(text) {
			js_lang = text.parseJSON();
			func();
		};
		js_lang = false; // Set to false so we don't try again!
		js_lang_httpFetcher = getHTTPObject(handler);
		if (js_lang_httpFetcher === null) return false;
		
		js_lang_httpFetcher.requestData('jslang');

		return true; // It's okay. We are doing a request
	} else if (js_lang === false && js_lang_httpFetcher != null) {
		// Request may be already underway. Add the func to the alert list
		var oldAlert = js_lang_httpFetcher.onreadystatechange;
		js_lang_httpFetcher.onreadystatechange = function() {
			oldAlert();
			func();
		};
		return true;
	} else if (js_lang != false && js_lang != null) {
		// It's been run already
		func();
		return true;
	}
	return false; // Can't do it
}

function select_all_forums()
{
  opts = document.forms['search'].elements['forums[]'].options
  for(i=0; i<opts.length; i++)
  {
    opts[i].selected = true;
  }
}

function select_all_cats()
{
  opts = document.forms['search'].elements['cats[]'].options
  for(i=0; i<opts.length; i++)
  {
    opts[i].selected = true;
  }
}

function select_all_children(toSelect)
{
  var id;
  var pid;

  opts = document.forms['search'].elements['cats[]'].options
  for(i=0; i<opts.length; i++)
  {
    for(n = 0; n < select_all_children.arguments.length ; n++)
    {
      id = Number(select_all_children.arguments[n]);
      cid = Number(opts[i].value);
      if(id == cid)
        opts[i].selected = true;
    }
  }
}

function select_all_boxes()
{
  formElements = document.getElementsByTagName('input');
  for(i=0; i<formElements.length; i++)
  {
    if (formElements[i].type == 'checkbox') {
      formElements[i].checked = true;
    }
  }
}

function select_all_groups()
{
  opts = document.forms['mailer'].elements['groups[]'].options
  for (i=0; i<opts.length; i++)
  {
    opts[i].selected = true;
  }
}

function get_forum(select,link)
{
  if(select.value.substring(0, 1) == '.'){
    self.location.href = link + '?a=board&c=' + select.value.substring(1, select.value.length);
  }else{
    self.location.href = link + '?a=forum&f=' + select.value;
  }
}

function get_folder(select,link)
{
  self.location.href = link + '?a=pm&f=' + select.value;
}

function get_filecat(select,link)
{
   self.location.href = link + '?a=files&cid=' + select.value;
}

function get_newspost(select,link)
{
   self.location.href = link + '?a=newspost&t=' + select.value;
}