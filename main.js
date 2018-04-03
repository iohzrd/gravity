const Config = require('electron-config');
const fs = require('fs');
const path = require('path');
const url = require('url');
const uuid = require('uuid/v4');
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
} = require('electron');

let mainWindow;
const config = new Config();
const configPath = path.dirname(config.path);
const audioPath = `${configPath}/Audio`;
if (!fs.existsSync(audioPath)) {
  fs.mkdirSync(audioPath);
}

function saveFile(source) {
  if (source && source.length > 0) {
    source.forEach(singlePath => new Promise((() => {
      const uid = uuid();
      const fileName = path.basename(singlePath);
      const ext = path.extname(singlePath);
      const fileNameNoExt = fileName.substring(0, fileName.lastIndexOf('.'));
      const newPath = `${audioPath}/${uid}${ext}`;
      const rd = fs.createReadStream(singlePath);
      const wr = fs.createWriteStream(newPath);
      const root = config.get();
      if (root.files === undefined) {
        root.files = {};
      }
      root.files[uid] = {
        name: fileNameNoExt,
        path: newPath,
        rate: 0.99,
        uid,
        volume: 0.99,
      };
      if (rd.pipe(wr)) {
        config.set(root);
      }
    })));
  }
}

function selectFile() {
  return dialog.showOpenDialog({
    filters: [{
      name: 'Audio',
      extensions: ['aif', 'flac', 'm4a', 'mp3', 'ogg', 'wav'],
    }],
    properties: ['openFile', 'multiSelections'],
  });
}

ipcMain.on('dragDropFiles', (event, arg) => {
  saveFile(arg);
});

ipcMain.on('importFile', () => {
  const filePath = selectFile();
  saveFile(filePath);
});

ipcMain.on('quit', () => {
  app.quit();
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
  app.quit();
});
