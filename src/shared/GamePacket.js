export const PACKET_TYPE = {
  NULL: 0,
  JOIN_WORLD: 1,
  UPDATE_PLAYER: 2,
  SYNC_WORLD: 3,
  WORLD_EVENT: 4,
}

export const WORLD_EVENT = {
  NULL: 0,
  PLAYER_MOVE_FORWARD: 1,
  PLAYER_MOVE_FORWARD_END: 2,
  PLAYER_MOVE_BACKWARD: 3,
  PLAYER_MOVE_BACKWARD_END: 4,
  PLAYER_JUMP: 5,
  PLAYER_ATTACK: 6,
}

export const CHARACTERS_TYPE = {
  NULL: 0,
  GAVIN: 1,
  NIGHTSHADE: 2,
}

export default class GamePacket {

  constructor(data) {
    this._data = data ? [...new Uint8Array(data)] : []
    this._offset = 0
    return this
  }

  getData() {
    const buffer = new ArrayBuffer(this._offset)
    const view = new DataView(buffer)
    for (let i = 0; i < this._offset; i++) {
      view.setInt8(i, this._data[i])
    }
    return buffer
  }

  get offset() {
    return this._offset
  }

  get length() {
    return this._data.length
  }

  setOffset(offset) {
    this._offset = offset
  }

  writeInt8(value) {
    if (value > 0xFF) {
      throw new Error('Too large')
    }
    this._data.push(value)
    this._offset += 1
    return this
  }

  writeInt16(value) {
    if (value > 0xFFFF) {
      throw new Error('Too large')
    }
    this._data.push(value & 0xFF)
    this._data.push((value >> 8) & 0xFF)
    this._offset += 2
    return this
  }

  writeInt32(value) {
    if (value > 0xFFFFFFFF) {
      throw new Error('Too large')
    }
    this._data.push(value & 0xFF)
    this._data.push((value >> 8) & 0xFF)
    this._data.push((value >> 16) & 0xFF)
    this._data.push((value >> 24) & 0xFF)
    this._offset += 4
    return this
  }

  writeInt64(value) {
    // eslint-disable-next-line no-loss-of-precision
    if (value > 0xFFFFFFFFFFFFFFFF) {
      throw new Error('Too large')
    }
    this._data.push(value & 0xFF)
    this._data.push((value >> 8) & 0xFF)
    this._data.push((value >> 16) & 0xFF)
    this._data.push((value >> 24) & 0xFF)
    this._data.push((value >> 32) & 0xFF)
    this._data.push((value >> 40) & 0xFF)
    this._data.push((value >> 48) & 0xFF)
    this._data.push((value >> 56) & 0xFF)
    this._offset += 8
    return this
  }

  writeFloat32(value) {
    const buffer = new ArrayBuffer(4)
    const view = new DataView(buffer)
    view.setFloat32(0, value, true)
    this._data.push(...new Uint8Array(buffer))
    this._offset += 4
    return this
  }

  writeFloat64(value) {
    const buffer = new ArrayBuffer(8)
    const view = new DataView(buffer)
    view.setFloat64(0, value, true)
    this._data.push(...new Uint8Array(buffer))
    this._offset += 8
    return this
  }

  writeString(value) {
    const buffer = new TextEncoder('utf-8').encode(value)
    this.writeInt16(buffer.length)
    this._data.push(...buffer)
    this._offset += buffer.length
    return this
  }

  writeLongString(value) {
    const buffer = new TextEncoder('utf-8').encode(value)
    this.writeInt32(buffer.length)
    this._data.push(...buffer)
    this._offset += buffer.length
    return this
  }

  writeRawData(arrayBuffer) {
    const uint8array = new Uint8Array(arrayBuffer)
    this._data.push(...uint8array)
    this._offset += uint8array.length
    return this
  }

  readInt8() {
    const value = this._data[this._offset]
    this._offset += 1
    return value
  }

  readInt16() {
    const value = this._data[this._offset]
            | (this._data[this._offset + 1] << 8)
    this._offset += 2
    return value
  }

  readInt32() {
    const value = this._data[this._offset]
            | (this._data[this._offset + 1] << 8)
            | (this._data[this._offset + 2] << 16)
            | (this._data[this._offset + 3] << 24)
    this._offset += 4
    return value
  }

  readInt64() {
    const value = this._data[this._offset]
            | (this._data[this._offset + 1] << 8)
            | (this._data[this._offset + 2] << 16)
            | (this._data[this._offset + 3] << 24)
            | (this._data[this._offset + 4] << 32)
            | (this._data[this._offset + 5] << 40)
            | (this._data[this._offset + 6] << 48)
            | (this._data[this._offset + 7] << 56)
    this._offset += 8
    return value
  }

  readFloat32() {
    const buffer = new ArrayBuffer(4)
    const view = new DataView(buffer)
    for (let i = 0; i < 4; i++) {
      view.setUint8(i, this._data[this._offset + i])
    }
    this._offset += 4
    return view.getFloat32(0, true)
  }

  readFloat64() {
    const buffer = new ArrayBuffer(8)
    const view = new DataView(buffer)
    for (let i = 0; i < 8; i++) {
      view.setUint8(i, this._data[this._offset + i])
    }
    this._offset += 8
    return view.getFloat64(0, true)
  }

  readString() {
    const length = this.readInt16()
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)
    for (let i = 0; i < length; i++) {
      view.setUint8(i, this._data[this._offset + i])
    }
    this._offset += length
    return new TextDecoder('utf-8').decode(buffer)
  }

  readLongString() {
    const length = this.readInt32()
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)
    for (let i = 0; i < length; i++) {
      view.setUint8(i, this._data[this._offset + i])
    }
    this._offset += length
    return new TextDecoder('utf-8').decode(buffer)
  }
}
