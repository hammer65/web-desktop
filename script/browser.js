const url = require('url');

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
        this.setUpRedirect(this.Webview.request);
        this.insertBaseDir(this.Webview.request);
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

  set base(base) {
    this.baseDir = base;
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

  insertBaseDir(reqObj) {
    // ,
    // types: ['main_frame', 'sub_frame']
    const filter = {
      urls: ['*://localhost/*']
    };
    reqObj.onBeforeRequest.addListener(
      (req) => {
        const parsed = url.parse(req.url);
        if (parsed.path.indexOf(this.baseDir) === -1) {
          const newPath = `/${this.baseDir}${parsed.path}`;
          const redir = req.url.replace(parsed.path, newPath);
          return {
            redirectUrl: redir
          };
        }
      }, filter, ['blocking']
    );
  }

  setUpRedirect(reqObj) {
    const filter = {
      urls: ['<all_urls>'],
      types: [
        'main_frame',
        'sub_frame',
        'other'
      ]
    };
    reqObj.onBeforeRequest.addListener(
      (req) => {
        if(req.url.indexOf('localhost') === -1) {
          nw.Shell.openExternal(req.url);
          return { cancel: true };
        }
      },filter,['blocking']
    );
  }

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
