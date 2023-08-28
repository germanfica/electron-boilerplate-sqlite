const electron = require('electron');
const sqlite3 = require('sqlite3').verbose();
const { ipcMain } = require('electron');

const app = electron.app;
var BrowserWindow = electron.BrowserWindow;

let mainWindow;
let db = new sqlite3.Database(':memory:');

console.log("Directorio actual:", __dirname);
// Print the complete path of the sqlite3 module
console.log("Ubicación de sqlite3:", require.resolve('sqlite3'));

app.on('window-all-closed', function () {
  app.quit();
});

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,  // protect against prototype pollution
    }
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html');

  mainWindow.webContents.openDevTools();

  // Initialize SQLite database
  db.serialize(() => {
    db.run("CREATE TABLE lorem (info TEXT)");

    var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
    for (var i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i);
    }
    stmt.finalize();
  });

  ipcMain.on('get-data', (event, arg) => {
    db.all("SELECT rowid AS id, info FROM lorem", [], (err, rows) => {
      if (err) {
        throw err;
      }
      event.reply('send-data', rows);
    });
  });

  ipcMain.on('get-sqlite3-location', (event, arg) => {
    var result = "Ubicación de sqlite3:" + require.resolve('sqlite3');
    event.reply('send-sqlite3-location', result);
  });

  ipcMain.on('get-dirname-location', (event, arg) => {
    var result = "Directorio actual:" + __dirname;
    event.reply('send-dirname-location', result);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});