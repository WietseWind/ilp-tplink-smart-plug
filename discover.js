#!/usr/bin/env node

const { Client } = require('tplink-smarthome-api')
const chalk = require('chalk')
const client = new Client()

// Clear the console
process.stdout.write('\033c')

console.log(`Discovering TP-Link Smart Plugs on the local network...\n  (Please note: connect them to your local network first)\n`)

let plugCount = 0
let plugs = []
client.startDiscovery({
  deviceTypes: [ 'plug' ]
}).on('plug-new', (Plug) => {
  plugs.push(Plug)
  Plug.getInfo().then(r => {
    plugCount++
    console.log(`${r.sysInfo.type}: ${chalk.yellow(r.sysInfo.model)} @ HWADDR: [ ${chalk.green(r.sysInfo.mac)} ] "${r.sysInfo.alias}" @ ${r.emeter.realtime.voltage.toFixed(0)}V`)
  })
})

setTimeout(() => {
  if (plugCount > 0) {
    console.log(`\nFound ${ plugCount } plug(s) ^^\n\nPlease copy the HWADDR (mac) of the device you want to connect to ILP.\n\nThen run:\n   npm run go HWADDR\n   eg.`)
    console.log('   ' + chalk.whiteBright.bgBlue(`npm run go ${plugs[0].sysInfo.mac}\n`))
  } else {
    console.log(`\nDidn't find any plugs.\nPlease make sure both the plug(s) and the host running this code are on the same network.\n`)
  }
  client.stopDiscovery()
}, 5000)
