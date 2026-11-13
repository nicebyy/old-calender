import { contextBridge, ipcRenderer, webFrame } from 'electron';

export interface UpdateStatusPayload {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  error?: string;
}

export interface GoogleOAuthResult {
  success: boolean;
  error?: string;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    expiresAt?: number;
  };
  userInfo?: {
    email?: string;
    name?: string;
    picture?: string;
  };
}

export interface GoogleRefreshResult {
  success: boolean;
  error?: string;
  accessToken?: string;
  expiresIn?: number;
  expiresAt?: number;
}

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isWindowMaximized: () => Promise<boolean>;
  onWindowStateChange: (callback: (state: { isMaximized: boolean }) => void) => () => void;
  showNotification: (options: { title: string; body: string }) => void;
  getNativeGeolocation?: () => Promise<{ latitude: number; longitude: number } | null>;
  checkForUpdates?: () => Promise<any>;
  quitAndInstallUpdate?: () => void;
  onUpdateStatus?: (callback: (payload: UpdateStatusPayload) => void) => () => void;
  setZoomFactor?: (factor: number) => void;
  getZoomFactor?: () => number;
  startGoogleOAuth?: (params: { clientId: string; clientSecret?: string }) => Promise<GoogleOAuthResult>;
  refreshGoogleToken?: (params: { clientId: string; clientSecret?: string; refreshToken: string }) => Promise<GoogleRefreshResult>;
}

const electronAPI: ElectronAPI = {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
  showNotification: (options) => ipcRenderer.send('show-notification', options),
  getNativeGeolocation: () => ipcRenderer.invoke('get-native-geolocation'),
  checkForUpdates: () => ipcRenderer.invoke('app-update:check'),
  quitAndInstallUpdate: () => ipcRenderer.send('app-update:restart-and-install'),
  onUpdateStatus: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: UpdateStatusPayload) => callback(payload);
    ipcRenderer.on('app-update:status', handler);
    return () => {
      ipcRenderer.removeListener('app-update:status', handler);
    };
  },
  onWindowStateChange: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, state: { isMaximized: boolean }) => callback(state);
    ipcRenderer.on('window-state-change', handler);
    return () => {
      ipcRenderer.removeListener('window-state-change', handler);
    };
  },
  setZoomFactor: (factor: number) => {
    webFrame.setZoomFactor(factor);
  },
  getZoomFactor: () => {
    return webFrame.getZoomFactor();
  },
  startGoogleOAuth: (params) => ipcRenderer.invoke('google-oauth:start', params),
  refreshGoogleToken: (params) => ipcRenderer.invoke('google-oauth:refresh-token', params),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
