"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

//@ts-ignore
const onServerStarted = async bp => {};

const onServerReady = async bp => {};

const onBotMount = async (bp, botId) => {
  console.log('bp: ', bp);
};

const entryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  definition: {
    name: 'broadcast',
    menuIcon: 'settings_input_antenna',
    menuText: 'Broadcast',
    fullName: 'Botpress Broadcast',
    homepage: 'https://botpress.io',
    noInterface: false
  }
};
var _default = entryPoint;
exports.default = _default;