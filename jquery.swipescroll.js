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
	// Helpers
	var has3d = "WebKitCSSMatrix" in window && "m11" in new WebKitCSSMatrix(),
	// the translate handlers
	trnOpen = "translate" + (has3d ? "3d(" : "("), trnClose = has3d ? ",0)" : ")",
	// get the vendor prefix for the transform & translate styles
	vendor = (/webkit/i).test(navigator.appVersion) ? "webkit" : (/firefox/i).test(navigator.userAgent) ? "Moz" : "opera" in window ? "O" : "",
	// test for transform support
	hasTransform = vendor + "Transform" in document.documentElement.style,
	// check if this is a ipad
	momentumDamp = "momentumDamp", momentumTime = "momentumTime", durationThreshold = "durationThreshold";
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
			overflow : true,
			overflowTime : 500,
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

			// if it supports transform, then apply the overflow scroll styles
			if (hasTransform) {
				// Set some default styles
				this.element[0].style[vendor + "TransitionProperty"] = "-" + vendor.toLowerCase() + "-transform";
				this.element[0].style[vendor + "TransitionDuration"] = "0";
				this.element[0].style[vendor + "TransformOrigin"] = "0 0";
				this.element[0].style[vendor + "TransitionTimingFunction"] = "cubic-bezier(0.33,0.66,0.66,1)";
			}
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
		_scrollBy : function(dx, dy) {
			// the current style
			var style = getComputedStyle(this.element[0], null),
			// the original offsets
			ox, oy,
			// the new offsets
			ex, ey,
			// the transform matrix positions
			mx, my,
			// the buffered offsets
			bx = 0, by = 0,
			// the max horizontal scroll
			lx = this.element[0].scrollWidth - (style.width.replace("px", "") * 1),
			// the max vertical scroll
			ly = this.element[0].scrollHeight - (style.height.replace("px", "") * 1),
			// change indicator
			changed_x = false, changed_y = false, matrix;

			if (hasTransform && this.options.overflow) {
				// get the current matrix
				matrix = style[vendor + "Transform"].replace(/[^0-9-.,]/g, "").split(",");
				mx = (matrix[4] || 0) * 1;
				my = (matrix[5] || 0) * 1;

				// standard style changing
				if (this.options.scrollX && dx !== 0) {
					ox = this._getPositionX();
					if (dx + ox < 0 || mx > 0) {
						// if we're going to overflow at the top
						ex = 0;
						bx = Math.max(mx - (dx + ox), 0);
					} else if (dx + ox > lx || mx < 0) {
						// if we're overflowing at the bottom
						ex = lx;
						bx = Math.min(mx - ((dx + ox) - lx), 0);
					} else {
						// we're just scrolling
						ex = Math.min(Math.max(0, dx + ox), lx);
					}

					if (ox !== ex) {
						this.element.scrollLeft(ex);
						changed_x = true;
					}
				} else {
					bx = mx;
				}
				if (this.options.scrollY && dy !== 0) {
					oy = this._getPositionY();
					if (dy + oy < 0 || my > 0) {
						// if we're going to overflow at the top
						ey = 0;
						by = Math.max(my - (dy + oy), 0);
					} else if (dy + oy > ly || my < 0) {
						// if we're overflowing at the bottom
						ey = ly;
						by = Math.min(my - ((dy + oy) - ly), 0);
					} else {
						// we're just scrolling
						ey = Math.min(Math.max(0, dy + oy), ly);
					}
					if (oy !== ey) {
						this.element.scrollTop(ey);
						changed_y = true;
					}
				} else {
					by = my;
				}

				this.element[0].style[vendor + "TransitionDuration"] = "0";
				this.element[0].style[vendor + "Transform"] = trnOpen + bx + "px," + by + "px" + trnClose + " scale(1)";
				return true;
			} else {
				// standard style changing
				if (this.options.scrollX) {
					ox = this._getPositionX();
					ex = Math.min(Math.max(0, dx + ox), lx);
					if (ox !== ex) {
						this.element.scrollLeft(ex);
						changed_x = true;
					}
				}
				if (this.options.scrollY) {
					oy = this._getPositionY();
					ey = Math.min(Math.max(0, dy + oy), ly);
					if (oy !== ey) {
						this.element.scrollTop(ey);
						changed_y = true;
					}
				}
			}

			return changed_x || changed_y;
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
				stop : [ data.pageX, data.pageY ],
				target : e.target
			};

			// prevent "fastclick"
			e.preventDefault();

			// only bind the events if we are scrolling
			this.element.bind("touchmove.swipescroll", function(e) {
				// execute the touchmove callback
				self._touchMove(e);
			}).one("touchend.swipescroll touchcancel.swipescroll", function(e) {
				// unbind the events when touch end to save memory
				self.element.unbind("touchmove.swipescroll touchend.swipescroll touchcancel.swipescroll");
				// execute the touchend callback
				self._touchEnd(e);
			});
		},
		_touchMove : function(e) {
			// get the object that has the touch position
			var touches = this._getTouches(e), data = touches[0] || e;

			// only 1 finger scrolling
			if (touches.length !== 1) {
				return;
			}

			// scroll by the delta
			if (this._scrollBy(this.track.stop[0] - data.pageX, this.track.stop[1] - data.pageY)) {
				// stop the default scrolling if we scrolled
				e.preventDefault();
			}

			// keep track of where we are
			this.track.stop = [ data.pageX, data.pageY ];
		},
		_touchEnd : function(e) {
			// quick reference
			var o = this.options,
			// calculate the deltas for x
			dx = this.track.start[0] - this.track.stop[0],
			// calculate the deltas for y
			dy = this.track.start[1] - this.track.stop[1];

			// allow it to go back to it's default position if it has changed
			if (hasTransform && this.options.overflow) {
				this.element[0].style[vendor + "TransitionDuration"] = this.options.overflowTime + "ms";
				this.element[0].style[vendor + "Transform"] = trnOpen + "0px,0px" + trnClose;
			}

			// do kinetic scrolling
			if (o.momentum && (Math.abs(dx) > o.distanceThreshold || Math.abs(dy) > o.distanceThreshold) && (new Date()).getTime() - this.track.time < o[durationThreshold]) {
				e.preventDefault();
				this._momentumScroll(dx, dy);
			} else if (Math.abs(dx) <= o.distanceThreshold && Math.abs(dy) <= o.distanceThreshold) {
				// retrigger for a fastclick event if we didn't move within the threshold
				$(this.track.target).trigger("click");
			}
		}
	});
})(jQuery);