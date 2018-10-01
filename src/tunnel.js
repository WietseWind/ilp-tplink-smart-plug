const localtunnel = require('localtunnel')

module.exports = async (subdomain) => {
  return new Promise((resolve, reject) => {
    console.log('Starting `localtunnel`...')
    let options = {}
    if (subdomain) options.subdomain = subdomain
    localtunnel(1337, options, (err, tunnel) => {
      if (err) {
        reject(err)
      } else {
        const paymentPointer = '$' + tunnel.url.split('/')[2]
        resolve({ 
          paymentPointer: paymentPointer
        })
      }
    })
  })
}
