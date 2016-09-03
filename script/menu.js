(() => {
  const createURL = (dir, port) => {
    return `http://localhost:${port}/${dir}`;
  }

  const menubar = new nw.Menu({ type: 'menubar' });

  const fileMenu = new nw.Menu();
  fileMenu.append(new nw.MenuItem({
    label: 'Exit',
    click: () => {
      nw.App.quit();
    }
  }));

  menubar.append(new nw.MenuItem({
    label: 'File',
    submenu: fileMenu
  }));

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
        browser.load(url);
      }
    }));
  }

  menubar.append(new nw.MenuItem({
    label: 'Applications',
    submenu: appMenu
  }));

  nw.Window.get().menu = menubar;
})();
