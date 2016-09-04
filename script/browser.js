class Browser {
  constructor(Webview) {
    this.Webview = Webview;
    this.goBack = this.goBack.bind(this);
    this.goForward = this.goForward.bind(this);
    this.reload = this.reload.bind(this);
  }

  init() {
    const self = this;
    this.Webview.addEventListener(
      'loadstart', () => {
        if (self.reloadButton) {
          self.reloadButton.className = '-stop-';
        }
      }
    );
    this.Webview.addEventListener(
      'loadstop', () => {
        if (self.reloadButton) {
          self.reloadButton.className = '-reload-';
        }
      }
    );
  }

  set forwardButton(Button) {
    this._forwardButton = Button;
    this._forwardButton.addEventListener(
      'mouseup', this.goForward
    );
  }

  set backButton(Button) {
    this._backButton = Button;
    this._backButton.addEventListener(
      'mouseup', this.goBack
    );
  }

  set reloadButton(Button) {
    this._reloadButton = Button;
    this._reloadButton.addEventListener(
      'mouseup', this.reload
    );
  }

  get forwardButton() { return this._forwardButton; }
  get backButton() { return this._backButton; }
  get reloadButton() { return this._reloadButton; }

  goBack() {
    if (this._backButton && this.Webview.canGoBack()) {
      this.Webview.back();
    }
  }

  goForward() {
    if (this._forwardButton && this.Webview.canGoForward()) {
      this.Webview.forward();
    }
  }

  reload(e) {
    if (this._reloadButton) {
      if (e.target.className === '-reload-') {
        this.Webview.reload();
      } else {
        this.Webview.stop();
      }
    }
  }

  load(url) {
    this.Webview.src = url;
  }
}

module.exports = Browser;
