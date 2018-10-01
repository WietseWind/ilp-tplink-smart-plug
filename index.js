#!/usr/bin/env node

const chalk = require('chalk');

(async () => {
  process.stdout.write('\033c')
  console.log(`${chalk.green('ILP PowerSwitch')} for TP-Link Smart Plugs\n  By ${chalk.yellow('@WietseWind')}\n`)

  const mac = process.argv.length >= 3 && !!process.argv[2].trim().match(/^([A-F0-9]{2}:){5}[A-F0-9]{2}$/i)
  const tunnelDomain = process.argv.length >= 4 && !!process.argv[3].trim().match(/^[a-z0-9-]+$/)

  if (!mac) {
    console.log(`Please enter a valid HWADDR (MAC) as argument, eg.`)
    console.log('   ' + chalk.whiteBright.bgBlue(`npm run go AC:12:34:56:78:90\n`))
    console.log(`\nIf you don't know your HWADDR (MAC), run:`)
    console.log('   ' + chalk.whiteBright.bgBlue(`npm run discover\n`))
    process.exit(0)
  }

  const { Plug, PlugEvents } = await require('./src/switch')(process.argv[2].trim()).catch(e => {
    console.log('/src/switch Error', e)
    process.exit(1)
  })

  const { IlpEvents } = await require('./src/ilp')()

  const { paymentPointer } = await require('./src/tunnel')(tunnelDomain ? process.argv[3].trim() : null).catch(e => {
    console.log('/src/tunnel Error', e)
    process.exit(1)
  })

  console.log(`Tunnel ready, ILP paymentPointer: ${chalk.bgGreen.whiteBright(paymentPointer)}`)

  /**
   * ILP - Switch binding
   */
  let Session = {
    dropsReceived: 0,
    usedWh: 0,
    state: false
  }

  PlugEvents.on('off', () => {
    Session.dropsReceived = 0
    Session.usedWh = 0
    Session.state = false
  })

  IlpEvents.on('start', r => {
    // Start can run when power still on @ new connection (closed stream)
    console.log(chalk.green(`>> [NEW STREAM] TURN ON (IF REQUIRED)...`))
    Plug.setPowerState(true).then(s => {
      if (!Session.state) {
        Session.state = true
        console.log(chalk.bgGreen.whiteBright(`   << TURNED [ ON ]`))
      }
    })
  })

  IlpEvents.on('stop', r => {
    // Stop will run when no packets came in for X seconds (timeout, default 10)
    console.log(chalk.red(`>> [STREAM STOPPED] TURN OFF...`))
    Plug.setPowerState(false).then(s => {
      console.log(chalk.bgRed.whiteBright(`   << TURNED [ OFF ]`))
    })
  })

  IlpEvents.on('packet', r => {
    Session.dropsReceived += r.packetDrops
  })

  /**
   * Display stats
   */
  PlugEvents.on('state', state => {
    console.log(`Power state change: ` + chalk.bgWhiteBright.black(`${chalk.green(state.power)}W @ ${chalk.green(state.voltage)}V, ${chalk.blue(state.usageWh)} Wh Δ`))
    Session.usedWh = state.usageWh
  })
  setInterval(() => {
    if (Session.state) {
      console.log(chalk.bgWhiteBright.magenta(`      >>>> ${chalk.bgGreen.black(' ON ')}, Δ Drops: ${Session.dropsReceived}, Δ Wh: ${Session.usedWh}`))
    } else {
      console.log(chalk.bgWhiteBright.magenta(`      >>>> ${chalk.bgRed.black(' OFF ')}`))
    }
  }, 2500)
})()

// process.on('SIGINT', () => {})
