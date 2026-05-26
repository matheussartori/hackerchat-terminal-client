import { randomBytes } from 'crypto'

export type DecodedFrame =
  | { type: 'text'; data: string }
  | { type: 'ping'; payload: Buffer }
  | { type: 'close'; payload: Buffer }

export function encodeTextFrame(data: string): Buffer {
  const payload = Buffer.from(data, 'utf8')
  const len = payload.length

  let headerLength = 6 // 2 header bytes + 4 masking key bytes
  if (len > 65535) headerLength += 8
  else if (len > 125) headerLength += 2

  const frame = Buffer.allocUnsafe(headerLength + len)
  frame[0] = 0x81 // FIN=1, opcode=1 (text)

  if (len > 65535) {
    frame[1] = 0xFF
    frame.writeBigUInt64BE(BigInt(len), 2)
  } else if (len > 125) {
    frame[1] = 0xFE
    frame.writeUInt16BE(len, 2)
  } else {
    frame[1] = 0x80 | len
  }

  const maskOffset = headerLength - 4
  const mask = randomBytes(4)
  mask.copy(frame, maskOffset)

  for (let i = 0; i < len; i++) {
    frame[headerLength + i] = payload[i] ^ mask[i % 4]
  }

  return frame
}

export function encodeControlFrame(opcode: number, payload: Buffer = Buffer.alloc(0)): Buffer {
  const len = payload.length
  const frame = Buffer.allocUnsafe(6 + len)
  frame[0] = 0x80 | opcode
  frame[1] = 0x80 | len
  const mask = randomBytes(4)
  mask.copy(frame, 2)
  for (let i = 0; i < len; i++) {
    frame[6 + i] = payload[i] ^ mask[i % 4]
  }
  return frame
}

export class WebSocketFrameDecoder {
  private buffer = Buffer.alloc(0)

  decode(incoming: Buffer): DecodedFrame[] {
    this.buffer = Buffer.concat([this.buffer, incoming])
    const frames: DecodedFrame[] = []

    while (this.buffer.length >= 2) {
      const byte1 = this.buffer[0]
      const byte2 = this.buffer[1]
      const opcode = byte1 & 0x0f
      const masked = (byte2 & 0x80) !== 0
      let payloadLen = byte2 & 0x7f
      let headerLen = 2 + (masked ? 4 : 0)

      if (payloadLen === 126) {
        if (this.buffer.length < 4) break
        payloadLen = this.buffer.readUInt16BE(2)
        headerLen += 2
      } else if (payloadLen === 127) {
        if (this.buffer.length < 10) break
        payloadLen = Number(this.buffer.readBigUInt64BE(2))
        headerLen += 8
      }

      if (this.buffer.length < headerLen + payloadLen) break

      const rawPayload = this.buffer.subarray(headerLen, headerLen + payloadLen)

      if (opcode === 8) {
        frames.push({ type: 'close', payload: rawPayload })
      } else if (opcode === 9) {
        frames.push({ type: 'ping', payload: rawPayload })
      } else if (opcode === 1 || opcode === 0) {
        let data: Buffer
        if (masked) {
          const mask = this.buffer.subarray(headerLen - 4, headerLen)
          data = Buffer.allocUnsafe(payloadLen)
          for (let i = 0; i < payloadLen; i++) {
            data[i] = rawPayload[i] ^ mask[i % 4]
          }
        } else {
          data = rawPayload
        }
        frames.push({ type: 'text', data: data.toString('utf8') })
      }

      this.buffer = this.buffer.subarray(headerLen + payloadLen)
    }

    return frames
  }
}
