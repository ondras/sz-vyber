var Select = OZ.Class();

Select.prototype.init = function(select) {
	this._items = [];
	this._selectedIndex = select.selectedIndex;
	this._opened = false;
	this._dom = {
		list: null,
		parent: select.parentNode
	};
	
	this._scan(select);
	this._build(select);
	this._dom.parent.removeChild(select);
	
	OZ.Event.add(document, "mousedown", this.bind(this._close));
}

Select.prototype._scan = function(select) {
	var options = select.getElementsByTagName("option");
	for (var i=0;i<options.length;i++) {
		this._items.push(options[i]);
	}
}

Select.prototype._build = function(select) {
	this._dom.parent.style.position = "relative";
	this._dom.parent.style.cursor = "pointer";

	var list = OZ.DOM.elm("p", {position: "absolute", display: "none", top: "0px"});
	this._dom.list = list;
	
	for (var i=0;i<this._items.length;i++) {
		var item = this._items[i];
		var a = OZ.DOM.elm("a", {display: "block"});
		if (i == this._selectedIndex) { OZ.DOM.addClass(a, "selected"); }
		if (i == 0) { OZ.DOM.addClass(a, "first"); }
		if (i == this._items.length-1) { OZ.DOM.addClass(a, "last"); }
		a.innerHTML = item.innerHTML;
		if (i != this._selectedIndex) { 
			a.href = item.value; 
			OZ.Event.add(a, "mousedown", OZ.Event.stop);
		}
		list.appendChild(a);
	}
	
	this._dom.parent.appendChild(list);
	OZ.Event.add(this._dom.parent, "click", this.bind(this._open));
}

Select.prototype._open = function(e) {
	if (this._opened) { return; }
	this._opened = true;
	this._dom.list.style.display = "";
	OZ.DOM.addClass(this._dom.parent, "opened");
}

Select.prototype._close = function(e) {
	if (!this._opened) { return; }
	this._opened = false;
	
	this._dom.list.style.display = "none";
	OZ.DOM.removeClass(this._dom.parent, "opened");
}

var App = OZ.Class();

App.Modules = [];

App.prototype.init = function(content, thumbnails, bottom) {
	this._index = -1;
	this._padding = 8;
	this._modules = [];
	this._moduleIndex = -1;
	
	this._dom = {
		content: content,
		thumbnails: thumbnails,
		bottom: bottom,
		images: [],
		loader: OZ.DOM.elm("img"),
		dummy: OZ.DOM.elm("div", {visibility:"hidden", position:"absolute", overflow:"hidden", width:"1px", height:"1px"})
	}
	this._dom.dummy.appendChild(this._dom.loader);
	document.body.insertBefore(this._dom.dummy, document.body.firstChild);
	
	this._getThumbnails();
	this._addEvents();
	
	for (var i=0;i<App.Modules.length;i++) {
		var ctor = App.Modules[i];
		this._modules.push(new ctor(this));
	}
	
	this._buildNav();
	this._syncSize();

	this.setModule(0);
	var r = document.location.hash.match(/[0-9]+/);
	var index = (r ? parseInt(r[0]) : 0);
	this.go(index);
}

App.prototype.go = function(index) {
	var targetIndex = index;
	if (typeof(index) == "string") { targetIndex = eval(this._index + index); }
	
/*	if (targetIndex == this._index) { return; } */
	if (targetIndex < 0) { return; }
	if (targetIndex >= this._dom.images.length) { return; }
	
	if (this._index != -1) {
		OZ.DOM.removeClass(this._dom.images[this._index], "selected");
	}
	this._index = targetIndex;
	if (this._index) {
		document.location.hash = this._index;
	} else if (document.location.hash.length) {
		document.location.hash = "";
	}
	OZ.DOM.addClass(this._dom.images[this._index], "selected");
	this._adjustScroll();

	this._modules[this._moduleIndex].update();
}

App.prototype.setModule = function(moduleIndex) {
	if (this._moduleIndex != -1) { 
		OZ.DOM.removeClass(this._dom.links[this._moduleIndex], "selected");
		this._modules[this._moduleIndex].deactivate(); 
	}
	OZ.DOM.clear(this._dom.content);
	this._moduleIndex = moduleIndex;
	this._modules[this._moduleIndex].activate();
	
	if (this._index != -1) { this._modules[this._moduleIndex].update(); }
	OZ.DOM.addClass(this._dom.links[this._moduleIndex], "selected");
}

App.prototype.currentBig = function() {
	if (this._index == -1) { return null; }
	var small = this._dom.images[this._index];
	var src = small.src;
	return src.replace(/\/small\//,"/big/");
}

App.prototype.currentFile = function() {
	if (this._index == -1) { return null; }
	var small = this._dom.images[this._index];
	return small.src.match(/[^/]+$/);
}

App.prototype.currentSmall = function() {
	if (this._index == -1) { return null; }
	var small = this._dom.images[this._index];
	return small.src;
}

App.prototype.currentIndex = function() {
	return this._index;
}

App.prototype.getContent = function() {
	return this._dom.content;
}

App.prototype.imageCount = function() {
	return this._dom.images.length;
}

App.prototype.preload = function(callback) {
	this._preloadCallback = callback;
	this._dom.loader.src = this.currentBig();
}

App.prototype.resizeTo = function(maxX, maxY) {
	var w = this._dom.loader.offsetWidth;
	var h = this._dom.loader.offsetHeight;
	
	var rw = (maxX ? w/maxX : 0);
	var rh = (maxY ? h/maxY : 0);

	var max = Math.max(rw, rh);
	if (max > 1) { 
		w = Math.round(w/max);
		h = Math.round(h/max);
	}
	return [w, h];
}

App.prototype._buildNav = function() {
	var nav = OZ.DOM.elm("table", {id:"nav"});
	if (this._modules.length > 1) { this._dom.bottom.appendChild(nav); }
	this._dom.links = [];
	
	var tbody = OZ.DOM.elm("tbody");
	nav.appendChild(tbody);
	var tr = OZ.DOM.elm("tr");
	tbody.appendChild(tr);
	
	
	for (var i=0;i<this._modules.length;i++) {
		var label = this._modules[i].getLabel();
		var link = OZ.DOM.elm("td", {innerHTML:label});
		if (i == 0) { OZ.DOM.addClass(link, "first"); }
		if (i+1 == this._modules.length) { OZ.DOM.addClass(link, "last"); }
		tr.appendChild(link);
		this._dom.links.push(link);
		OZ.Event.add(link, "click", this.bind(this._nav));
	}
}

App.prototype._nav = function(e) {
	OZ.Event.prevent(e);
	var target = OZ.Event.target(e);
	var index = this._dom.links.indexOf(target);
	this.setModule(index);
}

App.prototype._loadedImage = function(e) {
	this._preloadCallback(this._dom.loader.src);
}

App.prototype._getThumbnails = function() {
	var all = this._dom.thumbnails.getElementsByTagName("img");
	for (var i=0;i<all.length;i++) {
		this._dom.images.push(all[i]);
	}
}

App.prototype._addEvents = function() {
	OZ.Event.add(document, "keydown", this.bind(this._keydown));
	OZ.Event.add(window, "resize", this.bind(this._resize));
	OZ.Event.add(this._dom.thumbnails, "click", this.bind(this._clickThumbnail));
	OZ.Event.add(this._dom.loader, "load", this.bind(this._loadedImage));
}

App.prototype._resize = function(e) {
	this._syncSize();
	this._modules[this._moduleIndex].resize();
}

App.prototype._syncSize = function() {
	/* synchronize height */
	var top = OZ.DOM.pos(this._dom.thumbnails)[1];
	var avail = OZ.DOM.win()[1];
	this._dom.thumbnails.style.height = (avail - top - this._padding) + "px";
	
	var top = OZ.DOM.pos(this._dom.content)[1];
	var h = avail - top - this._padding - this._dom.bottom.offsetHeight;
	this._dom.content.style.height = h+"px";
}

App.prototype._clickThumbnail = function(e) {
	var t = OZ.Event.target(e);
	if (t.nodeName.toLowerCase() != "img") { return; }
	var index = this._dom.images.indexOf(t);
	this.go(index);
}

App.prototype._keydown = function(e) {
	var done = true;
	var tmp = this._dom.images[0];
	var cols = Math.floor(this._dom.thumbnails.offsetWidth / tmp.offsetWidth);
	switch (e.keyCode) {
		case 37:
			this.go("-1");
		break;
		case 38:
			this.go("-" + cols);
		break;
		case 39:
			this.go("+1");
		break;
		case 40:
			this.go("+" + cols);
		break;
		default:
			done = false;
		break;
	}
	if (done) {
		OZ.Event.stop(e);
		OZ.Event.prevent(e);
	}
}

App.prototype._adjustScroll = function() {
	var img = this._dom.images[this._index];
	var top = img.offsetTop;
	var height = img.offsetHeight;
	
	var scroll = this._dom.thumbnails.scrollTop;
	var avail = this._dom.thumbnails.offsetHeight;
	
	if (top+height > scroll+avail) {
		/* thumbnail is in lower part */
		this._dom.thumbnails.scrollTop = top+height - avail;
	} else if (top < scroll) {
		/* thumbnail is in upper part */
		this._dom.thumbnails.scrollTop = top;
	}
}

App.Module = OZ.Class();
App.Module.prototype.init = function(app) {}
App.Module.prototype.activate = function() {}
App.Module.prototype.deactivate = function() {}
App.Module.prototype.resize = function() {}
App.Module.prototype.update = function() {}
App.Module.prototype.getLabel = function() { return this._label; }