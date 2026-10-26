import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    frame: false, // Windows 10 커스텀 타이틀바 적용
    backgroundColor: '#1f1f1f',
    show: false, // 깜빡임 방지용 ready-to-show 패턴
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // 개발 환경 또는 프로덕션 로드
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 준비 완료 시 즉시 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 창 제어 이벤트 리스너 등록
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-state-change', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-state-change', { isMaximized: false });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC 창 제어 핸들러
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('is-window-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// Windows 10 네이티브 토스트 알림 표시 핸들러
ipcMain.on('show-notification', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || '일정 알림',
      body: body || '',
    }).show();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
