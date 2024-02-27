const path = require('path');
const winapi = require('winapi-bindings');
const { fs, log, util } = require('vortex-api');

// Nexus Mods domain for the game. e.g. nexusmods.com/toweroffantasy
const GAME_ID = 'toweroffantasy';

//Steam Application ID, you can get this from https://steamdb.info/apps/
const STEAMAPP_ID = '2088380';

function main(context) {
  //This is the main function Vortex will run when detecting the game extension.

    context.registerGame({
      id: GAME_ID,
      name: '타워 오브 판타지',
      mergeMods: true,
      queryPath: findGame,
      supportedTools: [],
      queryModPath: () => 'Hotta/Content/Paks',
      logo: 'gameart.png',
      executable: () => 'Launcher/tof_launcher.exe',
      requiredFiles: ['Hotta/Binaries/Win64/QRSL.exe'],
      setup: prepareForModding,
      environment: {
        SteamAppId: STEAMAPP_ID,
      },
      details: {
        steamAppId: STEAMAPP_ID
      },
    });

    function findGame() {
      return util.GameStoreHelper.findByAppId([STEAMAPP_ID])
          .then(game => game.gamePath);
    }

    function prepareForModding(discovery) {
      // standalone version
      return fs.ensureDirAsync(path.join(discovery.path, 'Hotta', 'Content', 'Paks', '~mods'));
    }

    context.registerInstaller('toweroffantasy-korean', 25, testSupportedContent, installContent);

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