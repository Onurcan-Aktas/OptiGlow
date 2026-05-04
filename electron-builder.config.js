module.exports = {
  appId: 'com.optiglow.app',
  productName: 'OptiGlow',
  copyright: 'Copyright © 2025 OptiGlow',
  directories: {
    output: 'dist-exe'
  },
  files: [
    'out/**/*',
    'resources/**/*'
  ],
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'appx', arch: ['x64'] }
    ],
    icon: 'resources/icon.ico',
    requestedExecutionLevel: 'asInvoker'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    installerIcon: 'resources/icon.ico',
    uninstallerIcon: 'resources/icon.ico'
  },
  appx: {
    applicationId: 'OptiGlow',
    backgroundColor: '#141414',
    showNameOnTiles: true,
    capabilities: ['graphicsCapture']
  }
}
