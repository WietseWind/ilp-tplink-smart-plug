const { Client } = require('tplink-smarthome-api')
const client = new Client({
  logLevel: 'silent',
  defaultSendOptions: {
    // timeout: 2500,
    transport: 'udp'
  }
})

const EventEmitter = require('events')
class PowerSwitchEmitter extends EventEmitter {}
const Emitter = new PowerSwitchEmitter()

Emitter.emit('start', {})

module.exports = async (mac) => {
  let Timeout
  let InitialInfo = {}
  let lastState

  return new Promise((resolve, reject) => {
    console.log(`Connecting TP-Link Smart Plug [ ${mac} ]...`)

    Timeout = setTimeout(() => {
      reject(new Error(`Device not found on network, timeout.`))
    }, 10 * 1000)

    client.startDiscovery({
      macAddresses: [ mac ],
      deviceTypes: [ 'plug' ]
    }).on('error', e => {
      console.log('Error', e)
    }).on('plug-new', plug => {
      plug.getInfo().then(r => {
        console.log(`Connected, ${r.sysInfo.type} ${r.sysInfo.model} (${r.sysInfo.dev_name}), "${r.sysInfo.alias}"`)
        plug.getPowerState().then(c => {
          client.stopDiscovery()
          console.log(`  > Current power state: ${c ? 'ON' : 'OFF'}`)

          const Init = () => {
            setInterval(() => {
              plug.getInfo().then(i => {
                // console.log('Plug GetInfo', i)
              }).catch(e => {
                // console.log('Plug GetInfo Error', e)
              })
            }, 2000)
  
            clearTimeout(Timeout)
  
            plug.on('emeter-realtime-update', e => {
              if (typeof InitialInfo.total_wh === 'undefined') {
                InitialInfo = e
              }
              const newState = {
                power: e.power.toFixed(0),
                voltage: e.voltage.toFixed(0),
                usageWh: (e.total_wh - InitialInfo.total_wh).toFixed(0)
              }
              if (JSON.stringify(newState) !== lastState) {
                Emitter.emit('state', newState)
              }
              lastState = JSON.stringify(newState)
            })
  
            resolve({
              Plug: plug,
              PlugEvents: Emitter
            })
     
            plug.on('power-off', () => {
              // console.log('POWER OFF (Resetting `__usage` counter)')
              InitialInfo = {}
              Emitter.emit('off')
            })
          }

          if (c) {
            console.log(`  > Turning OFF to start.`)
            plug.setPowerState(false).then(s => {
              Init()
            })
          } else {
            Init()
          }
          
          // console.log('Manual call', plug.emeter.getRealtime({
          //   timeout: 100,
          //   transport: 'udp'
          // }).then(console.log))
          // plug.on('power-on', e => console.log('power-on', e))
          // plug.on('power-update', e => console.log('power-update', e))
          // plug.on('in-use', e => console.log('in-use', e))
          // plug.on('in-use-update', e => console.log('in-use-update', e))
        })
      })
    })
  })
}
