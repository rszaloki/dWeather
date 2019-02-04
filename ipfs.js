const fs = require('fs');
const IPFS = require('ipfs');
const Room = require("ipfs-pubsub-room");
const MAIN_DIR = '/dweather'
const REPONAME = 'repo'
const NL = '\n'
let __ipfs__ = null
let ROOM = null
let ROOM_NAME = 'dweather'

function getIpfs() {
  if (!__ipfs__) {
    const isRepoExists = fs.existsSync(REPONAME)
    console.log('repo exists: ', isRepoExists)
    const ipfs = new IPFS({
      init: !isRepoExists,
      repo: REPONAME,
      // relay: { enabled: true, hop: { enabled: true, active: false } },
      EXPERIMENTAL: {
        pubsub: true
      },
      config: {
        Addresses: {
          Swarm: [
            '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
          ]
        }
      }
    })

    __ipfs__ = new Promise(resolve => {
      ipfs.on('ready', () => {
        ROOM = Room(ipfs, ROOM_NAME)
        ROOM.on('subscribed', () => {
          console.log('subscribed to ', ROOM_NAME)
          resolve(ipfs)
        })
      })
    })
  }
  return __ipfs__
}


async function addItem(temp, humid, sensorId = 'main') {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = (now.getUTCMonth() + 1).toString(10).padStart(2, '0')
  const day = now.getUTCDate().toString(10).padStart(2, '0')
  const ts = now.getTime()
  const filename = `${MAIN_DIR}/${year}-${month}-${day}.txt`
  const line = Buffer.from(`${ts},${sensorId},${temp},${humid}${NL}`)
  const ipfs = await getIpfs()

  console.log(filename, line.toString())

  let content = null
  try {
    content = await ipfs.files.read(filename)
  }
  catch (e) {
    console.log('create a new file')
    content = Buffer.from('')
  }
  console.log('additem - read,', content.length, Date.now())

  await ipfs.files.write(filename, Buffer.concat([content, line]), { create: true, parents: true })
  console.log('additem - write,', Date.now())
  const dir = await ipfs.files.stat(MAIN_DIR)
  await ipfs.files.flush()
  if (ROOM) {
    ROOM.broadcast(dir.hash)
  }
  return dir
}

async function stopIpfs() {
  const ipfs = await getIpfs()
  await ROOM.leave()
  return ipfs.stop()
}


module.exports = {
  addItem,
  getIpfs,
  stopIpfs
}
