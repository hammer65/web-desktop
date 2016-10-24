#Creating a "PHP on the Desktop" Application in nw.js

PHP is a very popular web application platform. Millions of web sites use it. One common question about PHP I have heard many times in the past is "what about desktop applications with PHP?".

A lot of attempts have been made to do this. There was even a GTK GUI binding for PHP at one time. Others have tried to cram the PHP interpreter into various packages, some with built in web servers. Not a lot of these projects have caught on but thanks to node.js and the Chromium project we have some more options. this tutorial will guide you through one possible way to do this, with several potential modifications that could make it quite useful in many areas where PHP applications are useful.

##NW.JS

NW.JS (formally node Webkit) is a project which combines node.js and Chromium (Google's open source version of Chrome) to create a desktop application shell.This application shell provides access to all node.js APIs, all web APIs and most Chrome app, Chrome extension APIs and with the right preparation, the Google native client and Pepper plugin APIs. Some of those work in different Javascript contexts within nw.js but can be used together in various ways. Taken together it is an extremely versatile system with a lot of possibilities with multiple ways to connect to outside resources such as databases, the file system and network resources.

##Getting NW.JS

For this project you will need NW.JS which you can get [here](http://nwjs.io "nw.js website"). There are two main "flavors" of nw.js. One is the normal version you might use when packaging your application. The other is the SDK version which includes the Chrome developer tools to aid in debugging. NW.JS is available for Mac (64bit), Windows (64bit and 32bit) and Linux (64bit and 32bit).

I developed the code for this tutorial on a 64bit Ubuntu 15 machine. The setup was pretty straight forward. For development I chose the "normal" flavor because as much as I wanted dev tools to work with, the SDK version is not as up to date but it does have NaCL (native client) support.

The normal build is the slimmest version without dev tools and without NaCL. There is a third version which is the same as the normal flavor but does include NaCL.

Native client allows a developer to run C++ based code in the browser. It is used in games and in other situations where Javascript just can't do the number crunching or where access to native OS resources in a very sandboxed, secure way is needed. Unlike plugins this code is downloaded with page content. If you aren't going to use Native client then there is no need for it. We won't be using it here.

I put my unpacked nw directory in an "applications" directory in my home directory, then sym linked it in the /usr/bin directory so it was in the command path. When packaging an app, you will want to put the nw executable in the same directory as your project. Instructions for how to bundle apps for distribution is on the nw.js [web site](http://nwjs.io) in the documentation section.

##What else do I need?

I'm glad you asked. You will need the PHP CGI SAPI. In Ubuntu this is easy to get.

`sudo apt-get install php5-cgi`

A guide for getting PHP on Windows is  [here](http://php.net/manual/en/install.windows.php) and getting it on a Mac usually involves using something like "Brew" to get the latest version.

You also need NPM for your platform. You can get it from [here](https://docs.npmjs.com/getting-started/installing-node). Node and NPM go hand in hand and there is no harm in installing node as well. However to avoid issues I highly recommend using NVM (node version manager) which if you have done any Ruby work is very similar to RVM. It is a version manager and can be indispensible in development. You can get NVM [here](https://github.com/creationix/nvm)

Once you have all that it's time to make a project folder somewhere appropriate and start setting up your new application. We will be installing a couple of node modules using NPM but we need a few things set up first.

##Project setup

Projects which use node modules use a common configuration file called `package.json`. There are a lot of options for this file but rather than overwhelming you we only need a few of them. There is a link in the nw.js docs to learn more about all the possible options which pertain to nw.js. The file is in pure JSON format (double quotes around keys and string values) and goes in the root of your project

```Javascript
{
  "name": "desktop_php",
  "main": "index.html",
  "window": {
    "width": 1000,
    "height": 650
  },
  "webview": {
    "partitions": [
       {
         "name": "trusted",
         "accessible_resources": [ "<all_urls>" ]
       }
    ]
  }
  "chromium-args": "--enable-logging=stderr"
}
```

Our project needs a name (no spaces), and a file which acts as the root of the application. This can be an HTML file or a js file. If it's a js file the app starts in the node javascript context and you must then use the nw api to open a window. If it's an HTML file the app opens in the browser javascript context and that page is the initial window of your application. In this case we want an HTML file. It can be called whatever you like but we are going here with the convention of using `index.html`.

The `window` option sets the initial size of our main window.

The 'webview' option contains settings for a special HTML tag we will be using in our application later. This setting sets permissions to load external resources for the webview tag.

The last option would be something you use in development and then not use in a packaged application. It allows you to call console.log() in your browser context code and see the logged message in the command line. Without the dev tools this is the only way you have of troubleshooting what you are doing. `chromium-args` can set a lot of other parameters related to the Chrome part of your app. There is documentation for these linked from the nw.js documentation.

Once we have this file complete and saved we can then use NPM to install the two modules we need.

```
npm install --save node-php
npm install --save express
```

By using the flag `--save` we get some additional things in our package.json file. these come in useful When you want to reinstall these packages. Rather than executing the commands above you can simply execute the command

`npm install`

in your project directory and those modules will be reinstalled. You can uninstall with npm as well. The lines added to package.json will be something like this.

```Javascript
"dependencies": {
  "express": "^4.14.0",
  "node-php": "0.0.1"
}
```

Read up on npm for more information

##First Code

Lets start with index.html.

```html
<html>
  <head>
    <title>Web Desktop</title>
  </head>
  <body>
    <div class="application">
      <webview
        partition="trusted"
        id="app-view"
        src="main.html"
      />
    </div>
  </body>
</html>
```

On this page we have a tag you may not have seen before. It's the `webview` tag. This is similar to an iFrame, but it is a sandboxed version of a full browser window which can be embedded in an application. Chrome applications use webview tags to embed HTML content which has only limited connectivity with the host application. Much like the JavaFX browser control in my Nashorn browser project tutorial.

Related to the permission settings we put in package.json, the "partition" attribute should match the name we set in our permissions settings. This allows us to load a local "splash page" called `main.html`. Which can be designed to look any way you like.

In the newest nw.js versions the webview tag is a full Chrome browser window, with an extensive API for controlling it. This makes it ideal to hold the content from a PHP application without that application having any access we don't want it to have with our parent application. But it is just a window. It has no back button, no forward button, no reload or stop controls. So again much like Nashorn Browser we have to build those things. Fortunately this time it's a little bit easier.

```html
<div class="application">
  <div class="control-bar">
    <button class="-back-" id="back-btn"></button>
    <button class="-reload-" id="reload-btn"></button>
    <button class="-forward-" id="forward-btn"></button>
  </div>
  <webview
    partition="trusted"
    id="app-view"
    src="main.html"
  />
</div>
```

Above we add buttons. Button tags are at home inside HTML forms or out. This time we don't need a form tag. In order for the user to navigate the application with standard back, forward and reload/stop buttons as needed (depending on the application it may not be) we will implement these buttons at the top of our application. To that end we need some code to do this.

##The CSS

We can get the CSS styling done first. Make a directory in your project root called "css" and inside that directory a file called `main.css`. The following code should go in that file.

```css
body {
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.control-bar {
  display: flex;
  align-items: flex-start;
  padding: 5px;
  border-bottom: 2px outset;
}

.control-bar button {
  margin: 4px;
  width: 30px;
  height: 30px;
  background-size: 22px 22px;
  background-position: center;
  background-repeat: no-repeat;
}

.-reload- {
  background-image: url(../images/refresh.svg);
}

.-stop- {
  background-image: url(../images/stop-button.svg);
}

.-back- {
  background-image: url(../images/left.svg);
}

.-forward- {
  background-image: url(../images/right.svg  );
}

.application {
  display: flex;
  flex-direction: column;
}
```

I found some nice SVG icons for the buttons. Other ways of decorating the buttons are always options. These images are in the source code for the project posted on github. A link to that source is at the bottom of the tutorial. Include the file in index.html just below the title tag.

```html
<link rel="stylesheet" href="css/main.css" />
```

##The Browser Class

Much like Nashorn Browser we will set up a browser class to use for controlling the webview. And I do mean CLASS. There is something I've yet to tell you about the newest version of nw.js which is pretty nice. The version of Chromium and the V8 javascript engine used here fully (well almost) implements  the ECMAScript 2015 standard. Yes ES6 in all it's goodness is available save for one unfortunate exception for now. That exception is the module specification. Fortunately, because we are using node.js APIs as well we have a fully operational "require" function. Scripts loaded with require, do work within the node context but that's fine for our purposes.

Even though this will be a module, we want to keep our node_modules directory clear of anything not managed by NPM so we will make a `script` directory in ourW project root to put this file into. Call the file `browser.js`.

```javascript
class Browser {
  constructor(Webview) {
    this.Webview = Webview;
    this.goBack = this.goBack.bind(this);
    this.goForward = this.goForward.bind(this);
    this.reload = this.reload.bind(this);
    this.baseDir = '';
  }
}
```

The constructor for our class accepts a reference to our webview tag. In addition it binds a few methods we haven't written yet to our object instance. In ES6 methods you use for event handling must be bound to the instance of the class manually. By doing that `this` refers to that instance. This is a pretty simple operation using the `bind` method of the function object. A `baseDir` property is also set. We will see what that is later.

Another nice feature are getters and setters. As with most languages which use these they are useful for allowing controlled access to private members and computed values based on private members. Javascript does not actually have the concept of private members but the convention of starting the names of methods and properties intended to be private using an underscore is still used. For setters and getters you can't have an object property of the same name, they must accesss or set something else. In this case we need to inject a reference to each controller button in our page into our object instance and assign them to "private" members.

```Javascript
set forwardButton(Button) {
  this._forwardButton = Button;
  this._forwardButton.addEventListener(
    'mouseup', this.goForward
  );
}
```

This is more useful than setting a property to assign a button reference to an object property because at the same time we set it, we have the opportunity to set an event listener to use with the button. Now add the other setters.

```javascript
set base(base) {
  this.baseDir = base;
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
```

Now when you use these setters the code is pretty clean.

```javascript
// just an example not for use in the application
myBrowserObject.reloadButton = referenceToReloadButton;
```

Now a few getters. These are smaller.

```javascript
get forwardButton() { return this._forwardButton; }
get backButton() { return this._backButton; }
get reloadButton() { return this._reloadButton; }
```

###Event Handlers

Now lets implement our event handlers.

```javascript
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
```

Forward and back buttons are pretty straight forward. Reload requires switching the button between the two CSS classes for the buttons we wrote before.

The final control function we need is a way to tell the webview to load a URL. This is also pretty straight forward.

```javascript
load(url) {
  this.Webview.src = url;
}
```

###The init() Method

One final method which will add some event handlers to the webview itself are needed.

```javascript
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
```

This code introduces yet another ES6 feature called `arrow functions`. Several other languages can express functions this way. It's a nice short hand to use in javascript. No `function` keyword is needed. You lead with the parenthesis characters, followed by => and then the block section of the function. It the function code is a single line you don't even need the curly braces.

What the init method does is establish handling of `loadstart` and `loadstop` events of the webview in order to properly toggle the appearance of the reload/stop button and to do some special processing of requests before the browser makes them. The methods `setUpRedirect()` and `insertBaseDir()` aren't there yet. We will cover those in a moment. The callback function of `addEventListener` is expressed as an arrow function but is no different than writing

```javascript
// alternate example code not meant to go in the project
this.webView.addEventListener('loadstop', function(){
  if (self.reloadButton) {
    self.reloadButton.className = '-reload-';
  }
});
```

##The Web Request API

Because NW.js can utilitze Chrome application and extension APIs. we have at our disposal the <b>WebRequest API</b>. This API can intercept web requests or any kind done by a browser window. It can then block those requests, manipulate them and then pass them on or just log the details of those requests. In this case we have two design goals in mind.

1. Make sure links in our loaded applications which lead to external URL's load in the users default web browser instead of our desktop application. Our interface isn't really for surfing the web so opening external links in a standard browser helps keep this content separate from our application.
2. We want our application to be able to switch between multiple PHP applications which will each be in it's own subfolder. In order to do that we will need to direct links to the subfolder rather than the "root" directory of the web server.

So we add the two methods mentioned above used on `loadstart` below the setter and getter methods.

```javascript
insertBaseDir(reqObj) {
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
```

When a 'loadstart' event is triggered the first method which is called `insertBaseDir` accepts the request object of the webview. Web requests have several "lifecycle" methods but the one we are interested in here is `onBeforeRequest` which is triggered before the browser makes the request to the network. Event listeners for `onBeforeRequest` need a URL pattern to act upon. A pattern of `<all_urls>` will act on all requests but these can be narrowed down via a different pattern. In this case we want to act upon all localhost requests. These filter patterns are documented [here]{https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns}

We need to parse a URL so we will need the node.js "url" module. At the top of browser.js include the following line.

`const url = require('url');`

We then parse the incoming url to get it's constituent parts.

`const parsed = url.parse(req.url);`

Our project will have an "applications" directory and inside that will be individual directories (our base directory) for the PHP applications which our desktop app can access we will create later. When we tell our desktop app which PHP application to launch, it will tell the browser class which base directory to direct links. This listener function will append the base directory to the path being accessed so that all requests made by the application are accessed properly.

```javascript
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
```
If the path portion of the URL does not include our base directory then we create a path which does and then replace that sub string of the url. The callback then returns the newly modified url. The return value must be an object and in this case it must have a `redirectUrl` property with a value of the modified url.

The second and third arguments of the `addListener` method are our filter object and an array which in this case just tells the request API to make this a blocking listener. A request will not be made until this function has returned a value. A listener which is not blocking will allow a request to go forward while the callback executes.

The `setUpRedirect` method is similar. It sets up another listerner for `onBeforeRequest` this time with a different filter. Now we are acting on all URLs and are only interested in specific types of requests. This method will allow us to redirect links for external content to the user's default browser. Unfortunately the web request API doesn't have "negative" filters to execute listeners if a URL does not match so we have to take a slightly different strategy here.

```javascript
(req) => {
  if(req.url.indexOf('localhost') === -1) {
    nw.Shell.openExternal(req.url);
    return { cancel: true };
  }
},filter,['blocking']
```

Here we are checking if the url contains "localhost" and if it does we call a special object and method provided by NW.js which will load the URL into the users default internet browser. We then return an object which contains `{ cancel: false }` to tell the browser to cancel the request.

The only thing left to do with our browser class is export the it as a module. Unlike everything else we just wrote that code goes <strong>outside of the class body</strong>.

```javascript
module.exports = Browser;
```

That concludes the initial coding of the Browser class.

##Using the Browser Class

Now lets use the Browser class in our `index.html`. In the head of your `index.html` below the title tag put this code.

```html
<script>
  const Browser = require('./script/browser');
</script>
```

For those of you who haven't done node.js development, require automatically gets a file from the node_modules directory unless you put a different path in or it cannot find it in your project node_modules directory. We also don't need the file extension here.

At the bottom of the body of `index.html` put this code

```html
<script>
  const appView = document.getElementById('app-view');
  const browser = new Browser(appView);
  browser.backButton = document.getElementById('back-btn');
  browser.reloadButton = document.getElementById('reload-btn');
  browser.forwardButton = document.getElementById('forward-btn');
  browser.init();
</script>
```

Here we get a reference to the webview tag, an instance of the Browser class is then created using the reference to the webview and references to our buttons are injected into our instance. The `init` method is then called.

#Building a Menu

Because this is a desktop application shell, it can create native OS menus for your application. We need to create two menus here. A `File` menu with a `quit` option to quit the application and an `application` menu to select PHP applications to load into the webview.

We can construct a `config` module which allows us to configure Web Desktop to load as many different applications as we want. Create an `app-config.js` file in the root of your project directory which looks like this.

```javascript
module.exports = {
  root: 'applications',
  port: 9090,
  applications: {
    example: {
      tooltip: "My example application",
      dir: 'example'
    }
  }
};
```

Save that and go back to `index.html`.

Require this file in the script tag in the head section of `index.html` above where we required the browser class.

```html
<script>
  const CONFIG = require('./app-config');
  const Browser = require('./script/browser');
</script>
```

A word about the `const` keyword. A lot of programming languages have constants. PHP has constants which can only be set to numbers and strings. Constants are meant to be immutable (you can't change them once you set them). In Javascript constants cannot be reset but they can hold anything. This is actually a trend in in new languages where by default variables should be immutable. If you look at the Rust language you will see the concept strictly enforced.

If there is no need to ever reassign a variable to something else use a constant. If you assign an object or an array to a constant, you can still manipulate and add to that object, you just can't reassign the variable to something else. it's good programming practice enforced in the language itself to the extent that it can be. If you know a variable will be reassigned use the `let` keyword. The `var` keyword is deprecated. There is more to the `let` keyword but that is what you need to know for this project.

Now lets do a seperate script file to create our menus using the nw menu API. We want this to use the browser context so we will use an old fashioned script tag to include it. below the script tag which creates the browser object, just above the closing body tag place this code.

```html
<script src="script/menu.js"></script>
```

This file will go inside the "script" directory we made earlier.

```javascript
(() => {
  // all code goes here
})();
```

"What is this?" you may ask. It's not alien writing it's actually a self executing javascript function. just as many jQuery plugins use and as many other js libraries use but it's using an ES6 arrow function.

inside this construct we first need a named function which puts together a localhost URL based on it's arguments. We will be using another feature of ES6 here called "template strings" which if you are familiar with PHP you have seen before with slightly different syntax. Instead of using single or double quotes for strings, you use backtick characters (\`). This allows you to do multiline strings and embed code and variables inside the string rather than manually concatenating strings together with the "+" symbol. Variables or code are injected into the string with this syntax `${value}`

Inside our self executing function we put the first bit of code.

```javascript
const createURL = (dir, port) => {
  return `http://localhost:${port}/${dir}`;
}
```

What this is for will become clear soon. Next we create a menubar with the nw.js menu API

```javascript
const menubar = new nw.Menu({ type: 'menubar' });
```

This is our master object that we will attach menus to as children which in turn have menu items as children.

```javascript
const fileMenu = new nw.Menu();
fileMenu.append(new nw.MenuItem({
  label: 'Exit',
  click: () => {
    nw.App.quit();
  }
}));
```

This creates a new menu to add to the menu bar which has a single menu item labeled `Exit`. A click handler is attached which calls the nw.App API `quit` method. This will quit the application when selected.

```javascript
menubar.append(new nw.MenuItem({
  label: 'File',
  submenu: fileMenu
}));
```

We then add that `File` menu to the menubar.

Below we need to loop through each application in the config file we just built. Because this file contains just a function included in `index.js` through a script tag we have CONFIG and browser available in the global scope.

```javascript
const appMenu = new nw.Menu();
let url;
let tooltip;
for(let i in CONFIG.applications) {
  url = createURL(CONFIG.applications[i].dir, CONFIG.port)
  tooltip = CONFIG.applications[i].tooltip ?
    CONFIG.applications[i].tooltip
    :
    i;
  appMenu.append(new nw.MenuItem({
    label: i,
    tooltip,
    click: () => {
      browser.base = CONFIG.application[i].dir;
      browser.load(url);
    }
  }));
}
```

The `createURL` function at the top is called for each application with the home directory and port we will be using for our application server. We look to see if a tooltip has been set and if not then we use the home directory name for the tooltip. the newly created `menuitem` is appended to the application menu and a click handler is setup to first set the base directory for the selected PHP application and then call the load method of the browser with the selected URL. When the desktop application is running, the user will be able to go to the application menu, select a PHP application and that application will load in the webview.

The three OSs which run nw.js will handle menus slightly different. You may know that the Mac OS gives every app a single menubar at the top while Linux and Windows attaches the menubar to the top of each window. It's best to use the same menu bar regardless.

##The Server part

In your project directory root create an `applications` directory and inside that an `example` directory. Inside the example directory create a file called `index.php`.

```php
<html>
  <head>
    <title>My PHP application</title>
  </head>
  <body>
    <?php echo phpinfo(); ?>
  </body>
</html>
```

This will be your sample PHP application. In practice you may have a "Wordpress" directory with an install of Wordpress in it as well as directories for other applications. This suffices for now.

Now in your script directory create a file called `server.js`. With the following code to start with.

```javascript
module.exports = (port, root) {
  // code goes here
};
```

When brought in with `require()` this will be a function you can execute in your code.

```javascript
const express = require('express');
const php = require("node-php");
const path = require("path");
```

Put inside the function, this code will bring in all the needed modules for our server. Below we create an instance of express which is a routing and request handling module often used to build complex web applications in node.js. It can use "middleware" to alter or use information from incoming requests to the server or to respond to incoming requests to the server. If the middleware simply uses information from the request or modifies it in some way, it will call a `next()` method to then pass on the request to the next piece of middleware.

```javascript
const app = express();
```

One thing we have to do here is deal with requests for a favicon. favicons are icons which appear in the URL bar of most browsers. You can have one if you like, but either way we can't allow the PHP CGI to try to load it. Though our node-php module can deal with other static files, a request for `favicon.ico` will trip it up. Middleware to the rescue. Middleware in Express is just a function which handles the request and calls the `next()` method if necessary. If it sees a request for a favicon it sends the correct headers back to the browser and the PHP CGI never touches it. If it's not a request for a favicon, then it gets sent on it's way to the PHP CGI module.

```javascript
app.use((req, res, next) => {
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end(/* icon content */);
  } else {
    next();
  }
});
```

Express uses the `use()` method to include middleware. Each is executed in the order that it is included. The node-php module is actually also middleware.

```javascript
app.use("/", php.cgi(root));

app.listen(port);

console.log(`Server listening on port ${port}`);
```

The app is then told to start the server listening on the port set in our config file and a friendly message is printed out to the console. The only thing left to do now is go back to index.html and put in some code to call this function with the proper arguments.

```html
<script>
  const CONFIG = require('./app-config');
  const Browser = require('./script/browser');
  const startServer = require('./script/server');
  const myDir = nw.global.__dirname;
  startServer(CONFIG.port, `${myDir}/${CONFIG.root}`);
</script>
```

The script tag at the top of `index.html` should now look like this. Of note here  is the use of nw.global which is how you access node.js globals in the browser context. The global `__dirname` (two leading underscores) is in this case your project root path. We put that together with the application root directory we set in the `config` file (using a template string) and feed it with the port we want to use to our server code.

##Launching It

the command to launch the app is

`nw ./`

If the nw executable was in your project directory alongside your package.json file and index.html and it would just be

`nw`

Instructions for how to package apps is on the nw.js website.

##Possible modifications

As I mentioned before nw.js supports APIs spread across node.js, Chromeium app and extension APIs and web APIs as well as their own. Webview tags have the ability to allow access from the host application to pretty much anything in the webview frame. Access going the other way can be done with the post message API.

By accessing the webview tag API you can do things like inject helper scripts into running applications. Do special notifications to users, insert custom style sheets for users. You could implement macros for users of certain applications by recording their actions in the webview. You could launch different applicaions in different windows if you like as well.

Some notable newer Chrome APIs to try would be the bluetooth and USB APIs. Unlike with Chrome apps and extensions all of these APIs are enabled by default.

On the server side you have everything that node can do. Sockets, file system access, database access. Express can handle multiple routing paths so you could have the server handle more than just requests to PHP. Middleware is available to allow for secure login including single signon solutions.

PHP CGI isn't the fastest performer. It's probably fine for single users. You can access the server started in this application with regular browsers as well. Depending on the network settings it could be served over a network.

There are other PHP interpreter modules out there. Some of them even embed an interpeter into a native node extension. If you use native extensions you will need to follow some special instructions on the nw.js web site to get them to work, In addition, it's not just PHP you can execute. You could have express route to a traditional node web application as well. There are modules for running ruby, C#, perl and other languages as well.

##Conclusion

This example should get you started on exploring using PHP with nw.js on the desktop. I hope you have enjoyed the tutorial. Source code is available for download at github [here](https://github.com/hammer65/web-desktop) enjoy.
