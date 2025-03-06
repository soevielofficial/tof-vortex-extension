const path = require('path');
const winapi = require('winapi-bindings');
const { fs, log, util } = require('vortex-api');
const GAME_ID = 'toweroffantasy';
const STEAMAPP_ID = '2064650';

function main(context) {
    context.registerGame({
      id: GAME_ID,
      name: 'Tower of Fantasy',
      mergeMods: true,
      queryPath: findGame,
      supportedTools: [],
      queryModPath: () => 'Client/WindowsNoEditor/Hotta/Content/Paks/~mods',
      logo: 'gameart.png',
      executable: () => 'WmGpLaunch/WmgpLauncher.exe',
      requiredFiles: ['Client/WindowsNoEditor/Hotta/Binaries/Win64/QRSL.exe'],
      setup: prepareForModding,
      environment: {
        SteamAppId: STEAMAPP_ID,
      },

      details: {
        steamAppId: STEAMAPP_ID
      },

    });

    function findGame() {
      try {
        const instPath = winapi.RegGetValue(
          'HKEY_LOCAL_MACHINE',
          'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\TowerOfFantasy_Global',
          'GameInstallPath');

        if (!instPath) {
          throw new Error('GameInstallPath not found in registry');
        }

        return Promise.resolve(instPath.value);

      } catch (err) {
        return util.GameStoreHelper.findByAppId([STEAMAPP_ID])
          .then((game) => {
            log('debug', 'game.gamePath: ' + game.gamePath);
            const steamPath = path.join(game.gamePath, 'Tower of Fantasy');
            log('debug', 'Steam path: ' + steamPath);
            return steamPath;
          });
      }
    }

    function prepareForModding(discovery) {
      return fs.ensureDirAsync(path.join(discovery.path, 'Client', 'WindowsNoEditor', 'Hotta', 'Content', 'Paks', '~mods'));
    }

    context.registerInstaller('toweroffantasy', 25, testSupportedContent, installContent);

    const MOD_FILE_EXT = ".pak";

    function testSupportedContent(files, gameId) {
      let supported = (gameId === GAME_ID) &&
        (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);
    
      return Promise.resolve({
        supported,
        requiredFiles: [],
      });
    }

    function installContent(files) {
      const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT);
      const idx = modFile.indexOf(path.basename(modFile));
      const rootPath = path.dirname(modFile);
      
      const filtered = files.filter(file => 
        ((file.indexOf(rootPath) !== -1) 
        && (!file.endsWith(path.sep))));
    
      const instructions = filtered.map(file => {
        return {
          type: 'copy',
          source: file,
          destination: path.join(file.substr(idx)),
        };
      });
    
      return Promise.resolve({ instructions });
    }
	
	return true
  
}

module.exports = {
    default: main,
}