import { app, BrowserWindow, ipcMain, Notification, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { createRequire } from 'module';
import type { AppUpdater } from 'electron-updater';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater') as { autoUpdater: AppUpdater };


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Windows 작업 표시줄 및 알림 연동을 위한 AppUserModelId 설정
if (process.platform === 'win32') {
  app.setAppUserModelId('com.fluentcal.classic');
}

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../assets/icon.ico')
    : path.join(__dirname, '../assets/icon.png');

  mainWindow = new BrowserWindow({
    title: 'Classic Calendar',
    icon: iconPath,
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

  // 페이지 로드 오류 로깅 및 사용자 알림 (빈 화면 버그 방지)
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] Failed to load URL: ${validatedURL} (${errorCode}: ${errorDescription})`);
    if (app.isPackaged) {
      dialog.showErrorBox(
        'Classic Calendar - 로드 실패',
        `프로그램 화면 리소스를 불러오는 데 실패했습니다.\n\n경로: ${validatedURL}\n오류 코드: ${errorCode} (${errorDescription})\n\n최신 릴리스 패키지로 재설치하거나 파일 무결성을 확인해 주세요.`
      );
    }
  });

  // 렌더러 프로세스 비정상 종료 감지
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Electron] Render process gone:', details);
    if (details.reason !== 'clean-exit' && details.reason !== 'killed') {
      dialog.showErrorBox(
        'Classic Calendar - 렌더러 프로세스 오류',
        `화면 렌더링 프로세스가 예기치 않게 종료되었습니다.\n\n원인: ${details.reason} (종료 코드: ${details.exitCode})`
      );
    }
  });

  // 디버깅을 위한 개발자 도구 단축키 (Ctrl+Shift+I 또는 F12)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

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
    const notifIcon = path.join(__dirname, '../assets/icon.png');
    new Notification({
      title: title || 'Classic Calendar',
      body: body || '',
      icon: notifIcon,
    }).show();
  }
});

// Windows 10/11 네이티브 Wi-Fi Geolocation (Windows.Devices.Geolocation) 핸들러
ipcMain.handle('get-native-geolocation', async () => {
  if (process.platform !== 'win32') return null;

  return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
    const script = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' }
[Windows.Devices.Geolocation.Geolocator, Windows.Devices.Geolocation, ContentType = WindowsRuntime] | Out-Null
$locator = [Windows.Devices.Geolocation.Geolocator]::new()
$op = $locator.GetGeopositionAsync()
$asTask = $asTaskGeneric[0].MakeGenericMethod([Windows.Devices.Geolocation.Geoposition])
$task = $asTask.Invoke($null, @($op))
if ($task.Wait(4500)) {
    $p = $task.Result.Coordinate.Point.Position
    Write-Output "$($p.Latitude),$($p.Longitude)"
}
`;
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`, { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout) {
        resolve(null);
        return;
      }
      const lines = stdout.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const coordLine = lines.find((l) => /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(l));
      if (coordLine) {
        const [latStr, lonStr] = coordLine.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lon)) {
          resolve({ latitude: lat, longitude: lon });
          return;
        }
      }
      resolve(null);
    });
  });
});

// ==========================================
// 지속적 자동 업데이트 (electron-updater) 구성
// ==========================================
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function broadcastUpdateStatus(payload: {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  error?: string;
}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app-update:status', payload);
  }
}

autoUpdater.on('checking-for-update', () => {
  broadcastUpdateStatus({ status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  broadcastUpdateStatus({
    status: 'available',
    version: info.version,
  });
});

autoUpdater.on('update-not-available', (info) => {
  broadcastUpdateStatus({
    status: 'not-available',
    version: info.version,
  });
});

autoUpdater.on('download-progress', (progressObj) => {
  broadcastUpdateStatus({
    status: 'downloading',
    percent: Math.round(progressObj.percent),
    transferred: progressObj.transferred,
    total: progressObj.total,
    bytesPerSecond: progressObj.bytesPerSecond,
  });
});

autoUpdater.on('update-downloaded', (info) => {
  broadcastUpdateStatus({
    status: 'downloaded',
    version: info.version,
  });
  if (Notification.isSupported()) {
    new Notification({
      title: 'Classic Calendar 업데이트 준비 완료',
      body: `새 버전 v${info.version} 다운로드가 완료되었습니다. 앱을 재시작하면 최신 버전이 즉시 적용됩니다.`,
      icon: path.join(__dirname, '../assets/icon.png'),
    }).show();
  }
});

autoUpdater.on('error', (err) => {
  broadcastUpdateStatus({
    status: 'error',
    error: err?.message || String(err),
  });
});

ipcMain.handle('app-update:check', async () => {
  if (!app.isPackaged) {
    // 개발 모드에서는 현재 버전 안내
    broadcastUpdateStatus({
      status: 'not-available',
      version: app.getVersion(),
    });
    return { status: 'dev-mode' };
  }
  try {
    return await autoUpdater.checkForUpdates();
  } catch (err: any) {
    broadcastUpdateStatus({
      status: 'error',
      error: err?.message || '업데이트 확인 중 오류 발생',
    });
    return null;
  }
});

ipcMain.on('app-update:restart-and-install', () => {
  autoUpdater.quitAndInstall(false, true);
});

app.whenReady().then(() => {
  createWindow();

  // 패키징된 배포 환경에서 시작 5초 후 백그라운드 자동 업데이트 확인
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 5000);

    // 4시간마다 주기적 백그라운드 체크
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 4 * 60 * 60 * 1000);
  }

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
