import { contextBridge, ipcRenderer } from 'electron';

export interface UpdateStatusPayload {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  error?: string;
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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
