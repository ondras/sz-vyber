var BigImage = OZ.Class().extend(App.Module);
App.Modules.push(BigImage);

BigImage.prototype.init = function(app) {
	this.app = app;
	
	this._label = "Obrázek";
	this._active = false;
	this._mode = 0;
	
	this._image = OZ.DOM.elm("img");
	
	var c = app.getContent();
	this._top = OZ.DOM.pos(c)[1];
	
	this._addEvents();
}

BigImage.prototype.activate = function() {
	this._active = true;
	var c = this.app.getContent();
	OZ.DOM.addClass(c, "bigimage");
	c.appendChild(this._image);
}

BigImage.prototype.deactivate = function() {
	this._active = false;
	var c = this.app.getContent();
	OZ.DOM.removeClass(c, "bigimage");
}

BigImage.prototype.update = function() {
	this.app.preload(this.bind(this._loadedImage));
}

BigImage.prototype.resize = function() {
	var availw = this.app.getContent().offsetWidth - 2;
	var availh = this.app.getContent().offsetHeight - 2;
	
	var size = this.app.resizeTo(availw, availh);
	this._image.style.width = size[0]+"px";
	this._image.style.height = size[1]+"px";
}

BigImage.prototype._addEvents = function() {
	OZ.Event.add(this._image, "mousemove", this.bind(this._mousemove));
	OZ.Event.add(this._image, "click", this.bind(this._clickImage));
}

BigImage.prototype._loadedImage = function(src) {
	this._image.src = src;
	this.resize();
}

BigImage.prototype._mousemove = function(e) {
	if (!this._active) { return; }
	var pos = OZ.DOM.pos(this._image)[0];
	var limit = this._image.offsetWidth/2;
	var index = this.app.currentIndex();
	var m = 0;
	if (e.clientX >= pos + limit && index+1 < this.app.imageCount()) {
		m = 1;
	} else if (e.clientX < pos + limit && index > 0) {
		m = -1;
	}
	
	if (m != this._mode) { this._updateMode(m); }
}

BigImage.prototype._updateMode = function(mode) {
	this._mode = mode;
	var names = {
		"-1": "prev",
		"0": "",
		"1": "next"
	}
	this._image.className = names[mode];
}

BigImage.prototype._clickImage = function(e) {
	if (!this._mode) { return; }
	var index = this.app.currentIndex();
	this.app.go(index + this._mode); 
	if (this._mode == -1 && index == 0) { this._updateMode(0); }
	if (this._mode == 1 && index+1 == this.app.imageCount()) { this._updateMode(0); }
}
