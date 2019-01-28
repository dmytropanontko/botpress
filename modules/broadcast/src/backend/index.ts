//@ts-ignore
import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {}
const onBotMount = async (bp: typeof sdk, botId) => {
  console.log('bp: ', bp)
}

const entryPoint: sdk.ModuleEntryPoint = {
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
}

export default entryPoint
