import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

document
  .getElementById('titlebar-minimize')
  ?.addEventListener('click', () => appWindow.minimize());
document
  .getElementById('titlebar-maximize')
  ?.addEventListener('click', () => appWindow.toggleMaximize());
document
  .getElementById('titlebar-close')
  ?.addEventListener('click', () => invoke("exit_app"));