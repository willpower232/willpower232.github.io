(function (n, d) {
	if ('share' in n === false && 'clipboard' in n === false) {
		return;
	}

	// https://plainjs.com/javascript/selecting/select-dom-elements-by-css-selector-4/
	var $ = function (selector, context) {
		return (context || d).querySelector(selector) || null;
	};

	var tehUrl = $('link[rel="canonical"]');

	if (tehUrl === null && location.protocol != 'file:') {
		return;
	}

	tehUrl = (tehUrl) ? tehUrl.getAttribute('href') : 'https://example.com';

	var tehText,tehEvent;

	if ('share' in n) {
		tehText = 'Share page URL';
		tehEvent = function () {
			n.share({
				title: $('title').textContent,
				url: tehUrl
			});
		};
	} else if ('clipboard' in n) {
		tehText = 'Copy page URL';
		tehEvent = function () {
			n.clipboard.writeText(tehUrl).then(function () {
				$('.js-share').innerText = 'Copied!';
			}).catch(function (err) {
				$('.js-share').innerText = 'Failed!';
				console.log(err);
			}).finally(function () {
				setTimeout(function () {
					$('.js-share').innerText = tehText;
				}, 800);
			});
		};
	}

	// wrap in a div to avoid subgrid
	$('body > main').insertAdjacentHTML('afterbegin', '<div><button class="js-share">' + tehText + '</button></div>');
	$('.js-share').addEventListener('click', tehEvent);
})(navigator, document);
