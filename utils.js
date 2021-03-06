const calcCrc8 = (buf, len) => {
  var dataandcrc
  // Generator polynomial: x**8 + x**5 + x**4 + 1 = 1001 1000 1
  var poly = 0x98800000
  var i

  if (len === null) return -1
  if (len !== 3) return -1
  if (buf === null) return -1

  // Justify the data on the MSB side. Note the poly is also
  // justified the same way.
  dataandcrc = (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8)
  for (i = 0; i < 24; i++) {
    if (dataandcrc & 0x80000000) {
      dataandcrc ^= poly
    }
    dataandcrc <<= 1
  }
  return (dataandcrc === 0)
}

const waitFor = ms => new Promise(resolve => {
  setTimeout(() => resolve(), ms)
})

const readSensor = async (bus, sensor) => {
  const data = Buffer.alloc(3)
  let sensorData = 0
  await bus.write(DEVICE_ADDRESS, 1, Buffer.from([sensor]))
  await waitFor(50)
  await bus.read(DEVICE_ADDRESS, 3, data)
  if ((data.length === 3) && calcCrc8(data, 3)) {
    sensorData = ((data[0] << 8) | data[1]) & 0xFFFC
  }
  return sensorData
}

const DEVICE_ADDRESS = 0x40
const READ_TEMP = 0xF3
const READ_HUMIDITY = 0xF5
module.exports = {
  DEVICE_ADDRESS,
  calcCrc8,
  waitFor,
  READ_TEMP,
  READ_HUMIDITY,
  readSensor
}
