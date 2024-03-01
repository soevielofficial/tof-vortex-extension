const path = require('path');
const winapi = require('winapi-bindings');
const { fs, log, util } = require('vortex-api');

// Nexus Mods domain for the game. e.g. nexusmods.com/toweroffantasy
const GAME_ID = 'toweroffantasy';

// Steam Application ID, you can get this from https://steamdb.info/apps/
const STEAMAPP_ID = '2147450'; // CN SteamAPP_ID

function main(context) {
  // This is the main function Vortex will run when detecting the game extension.

    context.registerGame({
      id: GAME_ID,
      name: '幻塔',
      mergeMods: true,
      queryPath: findGame,
      supportedTools: [],
      queryModPath: () => 'Client/WindowsNoEditor/Hotta/Content/Paks',
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
        // Find the standalone version of the game through registry
        const instPath = winapi.RegGetValue(
          'HKEY_LOCAL_MACHINE',
          'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Hotta',
          'GameInstallPath'); // Official launcher registry key

        if (!instPath) {
          throw new Error('empty registry key');
        }

        return Promise.resolve(instPath.value);

      // Find the steam version if the standalone version is not found in the registry
      } catch (err) {
        return util.GameStoreHelper.findByAppId([STEAMAPP_ID])
          .then((game) => {
            log('debug', 'game.gamePath: ' + game.gamePath);
            // Append \\幻塔 to game path for Steam version
            const steamPath = path.join(game.gamePath, '幻塔');
            log('debug', 'Steam path: ' + steamPath);
            return steamPath;
          });
      }
    }

    function prepareForModding(discovery) {
      // Standalone version
      return fs.ensureDirAsync(path.join(discovery.path, 'Hotta', 'Content', 'Paks', '~mods'));
    }

    context.registerInstaller('toweroffantasy-chinese', 25, testSupportedContent, installContent);

    const MOD_FILE_EXT = ".pak";

    function testSupportedContent(files, gameId) {
      // Make sure we're able to support this mod.
      let supported = (gameId === GAME_ID) &&
        (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);
    
      return Promise.resolve({
        supported,
        requiredFiles: [],
      });
    }

    function installContent(files) {
      // The .pak file is expected to always be positioned in the mods directory we're going to disregard anything placed outside the root.
      const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT);
      const idx = modFile.indexOf(path.basename(modFile));
      const rootPath = path.dirname(modFile);
      
      // Remove directories and anything that isn't in the rootPath.
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
  };