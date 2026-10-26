import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isWindowMaximized: () => Promise<boolean>;
  onWindowStateChange: (callback: (state: { isMaximized: boolean }) => void) => () => void;
  showNotification: (options: { title: string; body: string }) => void;
}

const electronAPI: ElectronAPI = {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
  showNotification: (options) => ipcRenderer.send('show-notification', options),
  onWindowStateChange: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, state: { isMaximized: boolean }) => callback(state);
    ipcRenderer.on('window-state-change', handler);
    return () => {
      ipcRenderer.removeListener('window-state-change', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
