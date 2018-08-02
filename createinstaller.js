const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('creating windows installer')
  const rootPath = path.join('./')
  const outPath = path.join(rootPath, 'release-builds')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'LINESimulator-win32-x64/'),
    authors: 'Kenichiro Nakamura',
    noMsi: false,
    outputDirectory: path.join(outPath, 'windows-installer'),
    exe: 'LINESimulator.exe',
    setupExe: 'LINESimulatorInstaller.exe',
    setupIcon: path.join(rootPath, 'src', 'icons','favicon.ico')
  })
}