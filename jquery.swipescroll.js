/*!
 * jQuery UI SwipeScroll 0.2.0
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
(function($) {
	// check if this is a ipad
	var momentumDamp = "momentumDamp", momentumTime = "momentumTime", durationThreshold = "durationThreshold";
	// if is a ipad, use the larger values
	if (!!navigator.platform.match(/ipad/i)) {
		momentumDamp = "iPadMomentumDamp";
		momentumTime = "iPadMomentumTime";
		durationThreshold = "iPadDurationThreshold";
	}

	$.widget("ui.swipescroll", {
		widgetEventPrefix : "swipescroll",
		options : {
			momentum : true,
			momentumDamp : 0.9,
			momentumTime : 1000,
			durationThreshold : 250,
			iPadMomentumDamp : 0.95,
			iPadMomentumTime : 1200,
			iPadDurationThreshold : 250,
			eventSupressionThreshold : 10,
			distanceThreshold : 20,
			minMomentumDistance : 40,
			maxMomentumDistance : 2000,
			scrollX : false,
			scrollY : true,
			touchTags : [ "select", "input", "textarea" ]
		},
		_create : function() {
			var self = this;

			// if there is no touch support, then no event binding
			if (!("ontouchstart" in window)) {
				return;
			}

			// bind the touchstart event
			this.element.bind("touchstart.swipescroll", function(e) {
				self._touchStart(e);
			});

			// we need to add this to enable gpu acceleration on mobile devices
			this.element.css("-webkit-transform", "translateZ(0)");
		},
		destroy : function() {
			// just remove all the events attached
			this.element.unbind(".swipescroll");
			// remove the transform
			this.element.css("-webkit-transform", "");
			// and do whatever else it needs to do
			$.Widget.prototype.destroy.apply(this);
		},
		_getTouches : function(e) {
			// try to get the touch handles
			if (e.originalEvent) {
				if (e.originalEvent.touches && e.originalEvent.touches.length) {
					return e.originalEvent.touches;
				} else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
					return e.originalEvent.changedTouches;
				}
			}
			return e.touches;
		},
		_getPositionX : function() {
			return this.element.scrollLeft();
		},
		_getPositionY : function() {
			return this.element.scrollTop();
		},
		_scrollBy : function(x, y) {
			if (this.options.scrollY) {
				this.element.scrollTop(y + this._getPositionY());
			}
			if (this.options.scrollX) {
				this.element.scrollLeft(x + this._getPositionX());
			}
		},
		_scrollTo : function(destX, destY) {
			var animate = false, opts = {};
			if (this.options.scrollY && destY !== this._getPositionY()) {
				opts.scrollTop = Math.max(destY, 0);
				animate = true;
			}
			if (this.options.scrollX && destX !== this._getPositionX()) {
				opts.scrollLeft = Math.max(destX, 0);
				animate = true;
			}
			// make sure something changed
			if (animate) {
				// do a jquery ui easing animation to handle the bicubic easing
				this.element.animate(opts, this.options[momentumTime], "easeOutCubic");
			}
		},
		_calculateDistance : function(distance, momentumDamp, maxDist) {
			var absoluteDistance = Math.abs(distance), delta = 0;
			// Calculate the total distance
			while (absoluteDistance > 0.1) {
				absoluteDistance *= momentumDamp;
				delta += absoluteDistance;
			}
			// Limit to within min and max distances
			if (delta > maxDist) {
				delta = maxDist;
			}
			return distance < 0 ? -delta : delta;
		},
		_momentumScroll : function(x, y) {
			var o = this.options, dy = 0, dx = 0;

			// Calculate the total distance
			dx = this._calculateDistance(x, o[momentumDamp], o.maxMomentumDistance);
			dy = this._calculateDistance(y, o[momentumDamp], o.maxMomentumDistance);

			if (Math.abs(dy) > o.minMomentumDistance || Math.abs(dx) > o.minMomentumDistance) {
				// Perform scroll
				this._scrollTo(Math.round(dx + this._getPositionX()), Math.round(dy + this._getPositionY()));
			}
		},
		_touchStart : function(e) {
			// get the object that has the touch position
			var self = this, touches = this._getTouches(e), data = touches[0] || e;

			// Allow certain HTML tags to receive touch events or if we have already stopped the event propagation
			if (touches.length !== 1 || $.inArray(e.target.tagName.toLowerCase(), this.options.touchTags) !== -1) {
				return;
			}

			// stop all animation
			this.element.stop();

			// keep track of where and when we started
			this.track = {
				time : (new Date()).getTime(),
				start : [ data.pageX, data.pageY ],
				stop : [ data.pageX, data.pageY ]
			};

			// only bind the events if we are scrolling
			this.element.bind("touchmove.swipescroll", function(e) {
				// execute the touchmove callback
				self._touchMove(e);
			}).one("touchend.swipescroll touchcancel.swipescroll", function() {
				// unbind the events when touch end to save memory
				self.element.unbind("touchmove.swipescroll touchend.swipescroll touchcancel.swipescroll");
				// execute the touchend callback
				self._touchEnd();
			});
		},
		_touchMove : function(e) {
			// get the object that has the touch position
			var touches = this._getTouches(e), data = touches[0] || e;

			// only 1 finger scrolling
			if (touches.length !== 1) {
				return;
			}

			// stop the default scrolling
			e.preventDefault();

			// scroll by the delta
			this._scrollBy(this.track.stop[0] - data.pageX, this.track.stop[1] - data.pageY);

			// keep track of where we are
			this.track.stop = [ data.pageX, data.pageY ];
		},
		_touchEnd : function() {
			// calculate the deltas
			var o = this.options, dx = this.track.start[0] - this.track.stop[0], dy = this.track.start[1] - this.track.stop[1];

			// do kinetic scrolling
			if (o.momentum && (Math.abs(dx) > o.distanceThreshold || Math.abs(dy) > o.distanceThreshold) && (new Date()).getTime() - this.track.time < o[durationThreshold]) {
				this._momentumScroll(dx, dy);
			}
		}
	});
})(jQuery);