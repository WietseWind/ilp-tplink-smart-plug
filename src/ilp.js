const makePlugin = require('ilp-plugin')
const { Server } = require('ilp-protocol-stream')
const Koa = require('koa')
const app = new Koa()
const crypto = require('crypto')

const EventEmitter = require('events')
class IlpStreamEmitter extends EventEmitter {}
const Emitter = new IlpStreamEmitter()

const TimeoutSeconds = 10

module.exports = async () => {
  return new Promise(async (resolve, reject) => {
    console.log('Connecting to ILP (moneyd?)...')
  
    const streamPlugin = makePlugin()
    await streamPlugin.connect()
  
    const streamServer = new Server({ plugin: streamPlugin, serverSecret: crypto.randomBytes(32) })

    let noPacketsTimeout
    streamServer.on('connection', connection => {
      let totalDrops = 0

      // console.log('+ New connection')
      connection.on('stream', stream => {
        stream.setReceiveMax(1000000000)
        stream.on('money', amount => {
          if (totalDrops === 0) {
            Emitter.emit('start', {
              sourceAccount: connection.sourceAccount,
              destinationAccount: connection.destinationAccount
            })
          }
  
          clearTimeout(noPacketsTimeout)
          noPacketsTimeout = setTimeout(() => {
            totalDrops = Math.max(connection.totalReceived, totalDrops)

            Emitter.emit('stop', {
              sourceAccount: connection.sourceAccount,
              destinationAccount: connection.destinationAccount,
              streamTotalDrops: totalDrops
            })
  
            // console.log(`# Connection closed`)
    
            connection.destroy().then(() => { 
              // console.log(`  - Connection cleaned up`) 
            }).catch(console.error)
          }, TimeoutSeconds * 1000)
          totalDrops += parseInt(amount)

          // console.log(`  » Got packet for ${amount} units - Sum: ${Math.max(connection.totalReceived, totalDrops)} drops (${Math.max(connection.totalReceived, totalDrops)/1000000} XRP)`)

          Emitter.emit('packet', {
            sourceAccount: connection.sourceAccount,
            destinationAccount: connection.destinationAccount,
            streamTotalDrops: totalDrops,
            packetDrops: parseInt(amount)
          })
        })
      })
    })
  
    await streamServer.listen()
  
    console.log('Created Receiver...')

    async function handleSPSP (ctx, next) {
      // console.log(`Request at domain ${ctx.host} with path ${ctx.originalUrl}`)
  
      if (ctx.get('Accept').indexOf('application/spsp4+json') !== -1) {
        const details = streamServer.generateAddressAndSecret() // No tag
        ctx.body = { destination_account: details.destinationAccount, shared_secret: details.sharedSecret.toString('base64') }
        ctx.set('Content-Type', 'application/spsp4+json')
        ctx.set('Access-Control-Allow-Origin', '*')
      } else {
        ctx.status = 404
        ctx.body = `ILP Deposit Endpoint\n\nPlease send ILP payments here.`;
        return next()
      }
    }
    
    app
      .use(handleSPSP)
      .listen(1337)
    
    resolve({
      IlpEvents: Emitter
    })
  })
}
