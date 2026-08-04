(function (d,n) {
    // do a tiny bit of IE support
    // kudos https://github.com/jonathantneal/svg4everybody/blob/master/lib/svg4everybody.js
    if (! /\bTrident\/[567]\b|\bMSIE (?:9|10)\.0\b/.test(n.userAgent)) {
        return;
    }

    var us = d.getElementsByTagName('use');

    for (var i = 0; i < us.length; i++) {
        var u = us[i],
            h = u.getAttribute('xlink:href'),
            l = h.substring(0, h.indexOf('#')),
            x = new XMLHttpRequest();

        if (l.length < 1 || l.substr(-4) != '.svg') {
            continue;
        }

        x.open('GET', l);
        x.onreadystatechange = function() {
            if (x.readyState === 4) {
                var c = d.implementation.createHTMLDocument('');
                c.body.innerHTML = x.responseText;
                // c.domain = d.domain; // this errors?

                var s = c.getElementsByTagName('svg')[0].cloneNode(true);
                var fragment = d.createDocumentFragment();

                fragment.appendChild(s);
                d.body.appendChild(fragment);

                u.setAttribute('xlink:href', h.substring(h.indexOf('#')));
            }
        };
        x.send();
    }
}(document, navigator));
