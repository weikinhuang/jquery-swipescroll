/*!
 * jQuery UI SwipeScroll 0.1.0
 *
 * Copyright (c) 2011 Wei Kin Huang (<a href="http://www.closedinterval.com">Closed Interval</a>)
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Depends:
 *	jquery.ui.widget.js
 */
(function($, undefined) {
	// check if this is a ipad
	var isiPad = !!navigator.platform.match(/ipad/i);

	$.widget("ui.swipescroll", {
		widgetEventPrefix : "swipescroll",
		options : {
			momentum : true,
			momentumDamp : 0.9,
			momentumTime : 1000,
			durationThreshold : 250,
			iPadMomentumDamp : 0.95,
			iPadMomentumTime : 1200,
			iPadDurationThreshold : 500,
			eventSupressionThreshold : 10,
			touchTags : [ "select", "input", "textarea" ]
		},
		_create : function() {
			var self = this;

			// bind the touch events
			this.element.bind("touchstart.swipescroll", function(e) {
				self._touchStart(e);
			});
		},
		_setOption : function(key, value) {
			$.Widget.prototype._setOption.apply(this, arguments);
		},
		destroy : function() {
			this.element.unbind(".swipescroll");
			$.Widget.prototype.destroy.apply(this);
		},
		_getTouches : function(e) {
			if (e.originalEvent) {
				if (e.originalEvent.touches && e.originalEvent.touches.length) {
					return e.originalEvent.touches;
				} else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
					return e.originalEvent.changedTouches;
				}
			}
			return e.touches;
		},
		_getPosition : function() {
			return this.element[0].scrollTop;
		},
		_scrollBy : function(y) {
			return this.element.scrollTop((-y) + this._getPosition());
		},
		_scrollTo : function(destY, time) {
			if (destY === this._getPosition()) {
				return;
			}

			this.element.animate({
				scrollTop : Math.max(destY, 0)
			}, time, "easeOutCubic");
		},

		// Perform a momentum-based scroll using CSS
		_momentumScroll : function(d, k, minDist, maxDist, t) {
			var ad = Math.abs(d), dy = 0;

			// Calculate the total distance
			while (ad > 0.1) {
				ad *= k;
				dy += ad;
			}

			// Limit to within min and max distances
			if (dy > maxDist) {
				dy = maxDist;
			}
			if (dy > minDist) {
				if (d < 0) {
					dy = -dy;
				}
				dy += this._getPosition();

				// Perform scroll
				this._scrollTo(Math.round(dy), t);
			}
		},

		// Perform a touch start event
		_touchStart : function(e) {
			var self = this, touch = this._getTouches(e);
			// Allow certain HTML tags to receive touch events or if we have already stopped the event propagation
			if (touch.length === 1 || $.inArray(e.target.tagName.toLowerCase(), this.options.touchTags) !== -1) {
				return;
			}

			// stop all animation
			this.element.stop();

			this.movedY = 0;
			this.startTime = (new Date()).getTime();
			// current touch scroll position
			this.startY = touch[0].pageY;
			this.touchY = touch[0].pageY;

			// only bind the events if we are scrolling
			this.element.bind("touchmove.swipescroll", function(e) {
				self._touchMove(e);
			}).one("touchend.swipescroll touchcancel.swipescroll", function(e) {
				self.element.unbind("touchmove.swipescroll touchend.swipescroll touchcancel.swipescroll");
				self._touchEnd(e);
			});
		},

		// Perform a touch move event
		_touchMove : function(e) {
			// Stop the default scrolling
			e.preventDefault();

			var touch = this._getTouches(e)[0];

			var dy = touch.pageY - this.touchY;
			this.touchY = touch.pageY;
			this.movedY = this.startY - touch.pageY;

			// scroll by the delta
			this._scrollBy(dy);
		},

		// Perform a touch end event
		_touchEnd : function(e) {
			// if we have moved, and we are doing momentum scrolling, then do kinetic scrolling
			if (((new Date()).getTime() - this.startTime) < this.options.durationThreshold && Math.abs(this.movedY) > 0 && this.options.momentum) {
				// Free scroll with momentum
				this._momentumScroll(this.movedY, isiPad ? this.options.iPadMomentumDamp : this.options.momentumDamp, 40, 2000, isiPad ? this.options.iPadMomentumTime : this.options.momentumTime);
			}
		}
	});
})(jQuery);