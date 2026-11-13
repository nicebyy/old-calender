import { app, BrowserWindow, ipcMain, Notification, dialog, shell } from 'electron';
import http from 'http';
import path from 'path';
import { fileURLToPath, URL } from 'url';
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
// Google OAuth2 루프백 인증 핸들러 (RFC 8252)
// ==========================================
let activeOAuthServer: http.Server | null = null;
let activeOAuthTimeout: NodeJS.Timeout | null = null;

function closeActiveOAuthServer() {
  if (activeOAuthTimeout) {
    clearTimeout(activeOAuthTimeout);
    activeOAuthTimeout = null;
  }
  if (activeOAuthServer) {
    try {
      activeOAuthServer.close();
    } catch {}
    activeOAuthServer = null;
  }
}

ipcMain.handle('google-oauth:start', async (_event, { clientId, clientSecret }) => {
  if (!clientId) {
    return { success: false, error: 'Google Client ID가 필요합니다.' };
  }

  closeActiveOAuthServer();

  const OAUTH_PORT = 52123;
  const redirectUri = `http://127.0.0.1:${OAUTH_PORT}/oauth2callback`;

  return new Promise((resolve) => {
    const server = http.createServer();
    activeOAuthServer = server;

    // 3분 안전 타임아웃
    activeOAuthTimeout = setTimeout(() => {
      closeActiveOAuthServer();
      resolve({ success: false, error: '인증 대기 시간이 초과되었습니다. (3분)' });
    }, 180000);

    server.on('request', async (req, res) => {
      try {
        const reqUrl = new URL(req.url || '', `http://127.0.0.1:${OAUTH_PORT}`);
        if (reqUrl.pathname !== '/oauth2callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const code = reqUrl.searchParams.get('code');
        const error = reqUrl.searchParams.get('error');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        if (error || !code) {
          res.end(`
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>Classic Calendar - 인증 실패</title>
            <style>body{background:#1f1f1f;color:#fff;font-family:'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style>
            </head>
            <body>
              <div style="text-align:center;max-width:400px;padding:32px;background:#2b2b2b;border-radius:8px;border:1px solid #444;">
                <h2 style="color:#e81123;margin-top:0;">Google 로그인 취소 또는 오류</h2>
                <p style="color:#aaa;font-size:14px;">${error || '인가 코드를 수신하지 못했습니다.'}</p>
                <p style="color:#888;font-size:12px;">이 브라우저 창을 닫고 Classic Calendar로 돌아가세요.</p>
              </div>
            </body></html>
          `);
          closeActiveOAuthServer();
          resolve({ success: false, error: error || '사용자가 인증을 취소했거나 오류가 발생했습니다.' });
          return;
        }

        res.end(`
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><title>Classic Calendar - 연동 완료</title>
          <style>body{background:#1f1f1f;color:#fff;font-family:'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style>
          </head>
          <body>
            <div style="text-align:center;max-width:440px;padding:36px;background:#262626;border-radius:8px;border:1px solid #0078d7;box-shadow:0 8px 30px rgba(0,0,0,0.6);">
              <div style="width:52px;height:52px;border-radius:50%;background:#0078d7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:26px;">✓</div>
              <h2 style="margin:0 0 10px;font-size:20px;color:#fff;">Google 캘린더 연동 성공</h2>
              <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 16px;">Google 계정 인증이 완료되었습니다.<br>이 브라우저 창을 닫고 <strong>Classic Calendar</strong> 앱으로 돌아가 캘린더 목록을 선택해 주세요.</p>
              <div style="font-size:12px;color:#777;">Classic Calendar Windows 10 Edition</div>
            </div>
          </body></html>
        `);
        closeActiveOAuthServer();

        // 토큰 교환 요청 (POST https://oauth2.googleapis.com/token)
        const tokenParams = new URLSearchParams({
          code,
          client_id: clientId,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        });
        if (clientSecret) {
          tokenParams.append('client_secret', clientSecret);
        }

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenParams.toString(),
        });

        const tokenData = (await tokenRes.json()) as any;
        if (!tokenRes.ok || tokenData.error) {
          resolve({
            success: false,
            error: tokenData.error_description || tokenData.error || 'Google 토큰 발급에 실패했습니다.',
          });
          return;
        }

        // 사용자 프로필 정보 조회 (email, name)
        let userInfo: { email?: string; name?: string; picture?: string } = {};
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (userRes.ok) {
            userInfo = (await userRes.json()) as any;
          }
        } catch {}

        resolve({
          success: true,
          tokens: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
            expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
          },
          userInfo: {
            email: userInfo.email,
            name: userInfo.name || userInfo.email,
            picture: userInfo.picture,
          },
        });
      } catch (err: any) {
        closeActiveOAuthServer();
        resolve({ success: false, error: err?.message || '인증 응답 처리 중 오류가 발생했습니다.' });
      }
    });

    server.on('error', (err: any) => {
      closeActiveOAuthServer();
      resolve({
        success: false,
        error: `로컬 인증 리스너 실행 실패 (${err.code || err.message}). 포트 ${OAUTH_PORT}가 사용 중인지 확인하세요.`,
      });
    });

    server.listen(OAUTH_PORT, '127.0.0.1', async () => {
      const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar',
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
        scopes
      )}&access_type=offline&prompt=consent`;

      try {
        await shell.openExternal(authUrl);
      } catch (err: any) {
        closeActiveOAuthServer();
        resolve({ success: false, error: `기본 웹 브라우저를 열 수 없습니다: ${err.message}` });
      }
    });
  });
});

ipcMain.handle('google-oauth:refresh-token', async (_event, { clientId, clientSecret, refreshToken }) => {
  if (!clientId || !refreshToken) {
    return { success: false, error: 'clientId 및 refreshToken이 필요합니다.' };
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = (await res.json()) as any;
    if (!res.ok || data.error) {
      return { success: false, error: data.error_description || data.error || '토큰 갱신 실패' };
    }

    return {
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || '토큰 갱신 통신 오류' };
  }
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
