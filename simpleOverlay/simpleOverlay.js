var simpleOverlay = simpleOverlay || {}
simpleOverlay.Templates = simpleOverlay.Templates || {};

simpleOverlay.Templates.Overlay = {
	OverlayFramework: '<div class="ui-overlay"><div class="ui-overlay-container"><div class="ui-overlay-content"><span class="replaceme content"></span></div><span class="replaceme loadingIcon"></span><div class="ui-busy-wash"></div><div class="ui-loading-indicator ui-busy-indicator"></div></div><span class="replaceme closeIcon"></span></div>',
	OverlayScreen: '<div class="ui-overlay-screen"></div>',
	OverlayCloseIcon: '<span class="ui-overlay-close-icon"></span>'
};

simpleOverlay.Overlay = function (args, callback) {
	if (!(this instanceof arguments.callee))
		throw new Error("Constructor called as a function");
	var overlay = this;

	// The event that triggered the overlay
	//var evt = args.triggerEvent || null;

	// Method that will return the content for the overlay
	var content = args.content || null;
	if (content != null && typeof (content) != 'string' && typeof (content) != 'object') {
		content = null;
	}

	// Adds the supplied className to the overlay container
	var cssClass = args.cssClass || '';
	if (typeof (cssClass) != 'string')
		cssClass = '';

	// If the content of the overlay will be retrieved using ajax we should do extra work to make sure there is a state in between 
	// to let the user know that something is happening
	var ajaxContent = false;
	if (args.hasOwnProperty('ajaxContent')) {
		ajaxContent = args.ajaxContent;
	}
	if (typeof (ajaxContent) != 'boolean') {
		ajaxContent = false;
	}

	// Position overlay absolute or fixed
	var position = args.position || 'fixed';
	switch (position) {
		case 'absolute':
		case 'fixed':
			position = position;
			break;
		default:
			position = 'fixed';
	}

	var busyText = 'In Progress';
	if (args.hasOwnProperty('busyText')) {
		busyText = args.busyText;
	}

	var workCompleteText = 'Complete';
	if (args.hasOwnProperty('workCompleteText')) {
		workCompleteText = args.workCompleteText;
	}

	var onBeforeCloseFunctions = [];

	overlay.OnBeforeClose = function (func) {
		if (typeof (func) == 'function') {
			onBeforeCloseFunctions.push(func);
		}
	};

	var fixed = (position == 'fixed');

	overlay.IsFixed = function () {
		return fixed;
	};

	// ============================================
	//				Do the work
	// ============================================

	var ovlib = $(simpleOverlay.Templates.Overlay.OverlayFramework);
	var ov = ovlib.get(0);
	ov.bos_ui_overlay_object = overlay;
	
	$(document).bind('keydown.stopBackspaceFromDoingABrowserBackInTheOverlay', function (e) {
		if (e.which == 8 && e.target.nodeName.toLowerCase() != 'input' && e.target.nodeName.toLowerCase() != 'textarea') {
			e.preventDefault();
			e.stopPropagation();
		}
	});

	if (cssClass != '') {
		ovlib.addClass(cssClass);
	}

	// Add the Close method to the overlay container element
	overlay.Close = function () {
		$(document).unbind('keydown.stopBackspaceFromDoingABrowserBackInTheOverlay');

		var allowClose = true;
		for (var i = 0; i < onBeforeCloseFunctions.length; i++) {
			if (!onBeforeCloseFunctions[i]()) {
				allowClose = false;
			}
		}

		if (!allowClose) {
			return;
		}


		ovlib.fadeOut(function () { $(this).remove(); });
		if ($('body').find('.ui-overlay-screen').get(0).bos_ui_overlay_count <= 1) {
			$('body').find('.ui-overlay-screen').fadeOut(function () { $(this).remove(); });
		}
		$('body').find('.ui-overlay-screen').get(0).bos_ui_overlay_count--;
	};

	var loadingIcon = null;

	// Add loading icon if we're loading content via ajax
	if (ajaxContent) {
		loadingIcon = $(simpleOverlay.Templates.AjaxContentLoader);
		ovlib.find('.replaceme.loadingIcon').replaceWith(loadingIcon);
		ovlib.find('.ui-overlay-content').addClass('ajaxLoading');
	} else {
		ovlib.find('.replaceme.loadingIcon').remove();
		ovlib.find('.replaceme.content').replaceWith(content);
	}

	// Add the close button if we're going to need it
		var closeButton = $(simpleOverlay.Templates.Overlay.OverlayCloseIcon);
		closeButton.click(overlay.Close);
		ovlib.find('.replaceme.closeIcon').replaceWith(closeButton);


	if (ajaxContent) {
		overlay.Populate = function (overlayContent) {
			ovlib.find('.replaceme.content').replaceWith(overlayContent);
			var container = ovlib.find('.ui-overlay-container');

			container.width(container.width()).height(container.height());

			var paddingX = ovlib.outerWidth() - ovlib.width();
			var paddingY = ovlib.outerHeight() - ovlib.height();

			var width = ovlib.find('.ui-overlay-content').width();
			var height = ovlib.find('.ui-overlay-content').height();

			var left = ($(window).width() / 2) - ((width + paddingX) / 2);
			var top = ($(window).height() / 2) - ((height + paddingY) / 2);

			ovlib.animate({
				left: left,
				top: top
			}).dequeue();

			container.animate({
				width: width,
				height: height
			}, function () {
				$(window).trigger('resize');
				ovlib.find('.ui-overlay-content').removeClass('ajaxLoading');
				if (typeof (callback) == 'function') {
					callback();
				}
			});

			loadingIcon.remove();
		};
	}

	var overlayScreen;

	// Add the overlay screen
	if ($('body').find('.ui-overlay-screen').length > 0) {
		overlayScreen = $('body').find('.ui-overlay-screen').eq(0).get(0);
	} else {
		overlayScreen = $(simpleOverlay.Templates.Overlay.OverlayScreen).get(0);
		$(overlayScreen).fadeTo(0, 0);
		$('body').append(overlayScreen);

		var windowHeight = $(window).height(),
		    documentHeight = $(document).height();
		if (windowHeight > documentHeight) documentHeight = windowHeight;

		$(window).resize(function () {
			$(overlayScreen).width($(window).width()).height(documentHeight);
		});
		$(window).trigger('resize');

		$(overlayScreen).fadeTo(400, 0.7);
	}

	// Increment the count on the overlay screen so that if more than one overlay is present it only hides on the last removal
	if (!Object.prototype.hasOwnProperty.call(overlayScreen, 'bos_ui_overlay_count')) {
		overlayScreen.bos_ui_overlay_count = 1;
	} else {
		overlayScreen.bos_ui_overlay_count++;
	}

	ovlib.fadeTo(0, 0);
	$('body').append(ov);

	$(window).resize(function () {
		var left = 20;
		if (ovlib.width() + 40 <= $(window).width()) {
			left = ($(window).width() / 2) - (ovlib.outerWidth() / 2);
			if (position == 'fixed') {
				ovlib.css('position', 'fixed');
				fixed = true;
			}
		} else {
			ovlib.css('position', 'absolute');
			fixed = false;
		}
		ovlib.css('left', left);

		var top = 20;
		if (ovlib.height() + 40 <= $(window).height()) {
			top = ($(window).height() / 2) - (ovlib.outerHeight() / 2);
			if (position == 'fixed') {
				ovlib.css('position', 'fixed');
				fixed = true;
			}
		} else {
			ovlib.css('position', 'absolute');
			fixed = false;
		}
		ovlib.css('top', top);
		if (!fixed) {
			$(window).scrollTop(0);
		}
	});
	$(window).trigger('resize');


	ovlib.fadeTo(400, 1, function () {
		if (!ajaxContent && typeof (callback) == 'function') {
			callback();
		}
	});

	overlay.Working = function (working) {
		if (working) {
			var ind = ovlib.find('.ui-busy-indicator');
			ind.css('left', (ovlib.find('.ui-overlay-container').width() / 2) - (ind.width() / 2));
			ind.css('top', (ovlib.find('.ui-overlay-container').height() / 2) - (ind.height() / 2));
			ovlib.addClass('ui-busy');
		} else {
			ovlib.removeClass('ui-busy');
		}
	};

	overlay.SetWorking = function () {
		overlay.Working(true);
	};

	overlay.FinishWorking = function () {
		overlay.Working(false);
	};

	overlay.SubOverlay = {};


	return overlay;
};
