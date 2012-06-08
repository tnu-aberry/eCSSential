/*! eCSSential - v0.1.0 - 2012-06-07
* https://github.com/scottjehl/eCSSential
* Copyright (c) 2012 Scott Jehl, @scottjehl, Filament Group, Inc.; Licensed GPL, MIT; Includes matchMedia.js: http://j.mp/jay3wJ (MIT)  */

/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */

window.matchMedia = window.matchMedia || (function(doc, undefined){

  var bool,
      docElem  = doc.documentElement,
      refNode  = docElem.firstElementChild || docElem.firstChild,
      // fakeBody required for <FF4 when executed in <head>
      fakeBody = doc.createElement('body'),
      div      = doc.createElement('div');

  div.id = 'mq-test-1';
  div.style.cssText = "position:absolute;top:-100em";
  fakeBody.style.background = "none";
  fakeBody.appendChild(div);

  return function(q){

    div.innerHTML = '&shy;<style media="'+q+'"> #mq-test-1 { width: 42px; }</style>';

    docElem.insertBefore(fakeBody, refNode);
    bool = div.offsetWidth === 42;
    docElem.removeChild(fakeBody);

    return { matches: bool, media: q };
  };

}(document));
/*! eCSSential.js: An experiment in optimized loading of mobile-first responsive CSS. [c]2012 @scottjehl, MIT/GPLv2 */
window.eCSSential = function( css, config ){
	"use strict";
	var load = [],
		defer = [],
		// All options false or null by default; no need for a mixin
		o = config || {},
		w = window,
		d = w.document,
		insLoc = d.getElementsByTagName( "script" )[0],
		whre = /(min|max)-(width|height)/gmi,
		ieV = w.navigator.appVersion.match( /MSIE ([678])\./ ) && RegExp.$1,
		ieRe = new RegExp( "(IE" + ieV + ")|(IE)", "g" );
	
	for( var mq in css ){					
		if( css.hasOwnProperty( mq ) ){
			// if media query evaluates true,
			// or if the browser is IE 6-8 and the key is a IEx match, or the o.oldIE option is true,
			// queue the stylesheet for a renderer-blocking load
			var iekey = mq.match( ieRe );

			if( w.matchMedia( mq ).matches || ( ieV && ( o.oldIE || iekey && iekey[ 1 ] ) ) ){
				load.push( {
					//keep the media attribute, but leave it as "all" if it was an "IEx" key
					mq: o.oldIE || iekey ? "all" : mq,
					href: css[ mq ]
				} );
			}
			// otherwise, queue for deferred load some stylesheets that didn't evaluate true the first time
			// Note: this means many stylesheets intended for conditions that could never apply (such as a width wider than the maximum device width) will be loaded anyway, causing more HTTP requests.
			// min/max-width/height queries are by default evaluated to see if they could never apply on the current screen
			// by running them as a "device" query instead of a viewport query. 
			// You can disable this behavior and defer every stylesheet by setting the deferAll configuration option
			else if( !iekey && ( o.deferAll || !mq.match( whre ) || w.matchMedia( mq.replace( whre, "$1-device-$2" ) ).matches ) ){
				defer.push( { mq: mq, href: css[ mq ] } );
			}
		}
	}
	
	// Make link elements (or one concat'd link) from an array of Stylesheets
	// first argument is array of urls, second argument is bool for inserting meta element marker (only used in block)
	function makeLinks( arr ){
		var marker = arr === load ? '<meta id="eCSS">' : '',
			start = '<link href="',
			end = '" rel="stylesheet">',
			hrefs = [],
			hrefmqs = [];

		for( var i in arr ){
			if( arr.hasOwnProperty( i ) ){
				hrefs.push( arr[ i ].href );
				hrefmqs.push( arr[ i ].href + '" media="' + arr[ i ].mq );
			}
		}
		
		// if the concat option is specified (recommended), pass the array through it and dump the resulting string into a single stylesheet url
		if( o.concat ){
			return start + o.concat( hrefs ) + end + marker;
		}
		// otherwise, make separate link elements
		else {
			return start + hrefmqs.join( '" ' + end + start ) + end + marker;
		}
	}
	
	// document.write the stylesheet that should block
	if( load.length ){
		d.write( makeLinks( load ) );
		insLoc = d.getElementById( "eCSS" );
	}
	
	// defer the load of the stylesheet that could later apply
	if( defer.length ){
		var div = d.createElement( "div" );
		div.innerHTML = makeLinks( defer );
		insLoc.parentNode.insertBefore( div, insLoc );
	}
	// return data for testing
	return { css: css, config: config, block: load, defer: defer };
};
