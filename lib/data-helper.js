'use strict'

exports.prepareData = prepareData
function prepareData (
  data,
  opts = { bufferSizelimit: 1000 },
  cb
) {
  createSlices(data, opts, (err, chunks) => {
    if (err) return cb(err)

    if (chunks.length === 0) {
      return cb(new Error('no chunks to prepare'))
    }

    return cb(null, chunks)
  })
}

exports.createSlices = createSlices
function createSlices (
  data,
  opts = { bufferSizelimit: 1000 },
  cb
) {
  const { bufferSizelimit } = opts

  if (!data || data.length === 0) {
    return cb(null, [])
  }

  if (typeof data !== 'string') {
    data = JSON.stringify(data)
  }

  const maxSpacePerBuffer = getMaxBufferSizeString(bufferSizelimit)

  if (maxSpacePerBuffer < 3) {
    return cb(new Error('buffer size too low'))
  }

  const regx = new RegExp('[\\s\\S]{1,' + maxSpacePerBuffer + '}', 'g')
  const res = data.match(regx)

  return cb(null, res)
}

exports.getMaxPointersPerBuffer = getMaxPointersPerBuffer
function getMaxPointersPerBuffer (bufferSizelimit, addressSize = 40, wrapHelper) {
  // addressSize: utf8 sha for grenache 40 chars
  const stringifiedTemplate = wrapHelper([])
  // pointers are stored as stringified json
  const initialSpace = getMaxBufferSizeString(bufferSizelimit)
  const elementSize = addressSize + ('"",'.length)

  const tmp = (initialSpace - stringifiedTemplate.length) / elementSize

  return Math.floor(tmp)
}

// returns the max amount of same-sized elements for a bencoded list
// example:
// ['a', 'b', 'c'] -> 'l1:a1:b1:ce'
exports.getMaxBufferSizeList = getMaxBufferSizeList
function getMaxBufferSizeList (bufferSizelimit, elementsize = 40) {
  const startIndicator = 'l'
  const endIndicator = 'e'
  const checksum = ('' + elementsize) + ':'

  const encodedSizeElement = elementsize + checksum.length
  const initialSpace = bufferSizelimit - (startIndicator + endIndicator).length

  return Math.floor(initialSpace / encodedSizeElement)
}

// max size of a bencode buffer, given a certain limit
// defines the max size of a data chunk in the dht
// example:
// 'foo' -> '3:foo'
exports.getMaxBufferSizeString = getMaxBufferSizeString
function getMaxBufferSizeString (bufferSizelimit) {
  const checksum = ('' + bufferSizelimit - 1) + ':'

  return bufferSizelimit - checksum.length
}