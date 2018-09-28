#!/usr/bin/env node

const chalk = require('chalk');

(async () => {
  // Clear the console
  process.stdout.write('\033c')
  // Welcome
  console.log(`${chalk.green('ILP PowerSwitch')} for TP-Link Smart Plugs\n  By ${chalk.yellow('@WietseWind')}\n`)

  const mac = process.argv.length >= 3 && process.argv[2].trim().match(/^([A-F0-9]{2}:){5}[A-F0-9]{2}$/i)

  if (!mac) {
    console.log(`Please enter a valid HWADDR (MAC) as argument, eg.`)
    console.log('   ' + chalk.whiteBright.bgBlue(`npm run go AC:12:34:56:78:90\n`))
    console.log(`\nIf you don't know your HWADDR (MAC), run:`)
    console.log('   ' + chalk.whiteBright.bgBlue(`npm run discover\n`))
    process.exit(0)
  }

  await require('./src/tunnel')()
  await require('./src/switch')(mac)
  await require('./src/ilp')()

  // Done
})()

// process.on('SIGINT', () => {})
