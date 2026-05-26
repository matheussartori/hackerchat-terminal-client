import { describe, it, expect, beforeEach } from 'vitest'
import { encodeTextFrame, encodeControlFrame, WebSocketFrameDecoder } from '../../src/network/web-socket-frame'

// Build an unmasked text frame for deterministic decoder tests
function buildUnmaskedTextFrame(text: string): Buffer {
  const payload = Buffer.from(text, 'utf8')
  const len = payload.length

  if (len <= 125) {
    const frame = Buffer.allocUnsafe(2 + len)
    frame[0] = 0x81
    frame[1] = len
    payload.copy(frame, 2)
    return frame
  }

  if (len <= 65535) {
    const frame = Buffer.allocUnsafe(4 + len)
    frame[0] = 0x81
    frame[1] = 126
    frame.writeUInt16BE(len, 2)
    payload.copy(frame, 4)
    return frame
  }

  const frame = Buffer.allocUnsafe(10 + len)
  frame[0] = 0x81
  frame[1] = 127
  frame.writeBigUInt64BE(BigInt(len), 2)
  payload.copy(frame, 10)
  return frame
}

describe('encodeTextFrame()', () => {
  it('sets FIN + text opcode in first byte', () => {
    const frame = encodeTextFrame('hi')
    expect(frame[0]).toBe(0x81)
  })

  it('sets MASK bit for short payloads', () => {
    const frame = encodeTextFrame('hi')
    expect(frame[1] & 0x80).toBe(0x80)
  })

  it('encodes short payload length (≤ 125) directly', () => {
    const text = 'hello'
    const frame = encodeTextFrame(text)
    expect(frame[1] & 0x7f).toBe(text.length)
    expect(frame.length).toBe(6 + text.length) // 2 header + 4 mask + payload
  })

  it('uses 16-bit extended length for payloads 126–65535 bytes', () => {
    const text = 'x'.repeat(200)
    const frame = encodeTextFrame(text)
    expect(frame[1] & 0x7f).toBe(126)
    expect(frame.readUInt16BE(2)).toBe(200)
    expect(frame.length).toBe(8 + 200) // 2 header + 2 extended + 4 mask + payload
  })

  it('uses 64-bit extended length for payloads > 65535 bytes', () => {
    const text = 'x'.repeat(70000)
    const frame = encodeTextFrame(text)
    expect(frame[1] & 0x7f).toBe(127)
    expect(Number(frame.readBigUInt64BE(2))).toBe(70000)
    expect(frame.length).toBe(14 + 70000) // 2 header + 8 extended + 4 mask + payload
  })
})

describe('encodeControlFrame()', () => {
  it('sets FIN bit and correct opcode for ping (9)', () => {
    const frame = encodeControlFrame(9)
    expect(frame[0]).toBe(0x89)
  })

  it('sets FIN bit and correct opcode for close (8)', () => {
    const frame = encodeControlFrame(8)
    expect(frame[0]).toBe(0x88)
  })

  it('sets MASK bit', () => {
    const frame = encodeControlFrame(9)
    expect(frame[1] & 0x80).toBe(0x80)
  })

  it('encodes empty payload with length 0', () => {
    const frame = encodeControlFrame(9)
    expect(frame[1] & 0x7f).toBe(0)
    expect(frame.length).toBe(6) // 2 header + 4 mask
  })

  it('encodes a payload', () => {
    const payload = Buffer.from([0x01, 0x02])
    const frame = encodeControlFrame(8, payload)
    expect(frame[1] & 0x7f).toBe(2)
    expect(frame.length).toBe(8)
  })
})

describe('WebSocketFrameDecoder', () => {
  let decoder: WebSocketFrameDecoder

  beforeEach(() => {
    decoder = new WebSocketFrameDecoder()
  })

  describe('text frames', () => {
    it('decodes an unmasked text frame', () => {
      const frame = buildUnmaskedTextFrame('hello')
      const frames = decoder.decode(frame)
      expect(frames).toHaveLength(1)
      expect(frames[0]).toEqual({ type: 'text', data: 'hello' })
    })

    it('decodes a masked text frame (round-trip with encodeTextFrame)', () => {
      const frame = encodeTextFrame('hello world')
      const frames = decoder.decode(frame)
      expect(frames).toHaveLength(1)
      expect(frames[0]).toEqual({ type: 'text', data: 'hello world' })
    })

    it('round-trips medium payload (>125 bytes)', () => {
      const text = 'a'.repeat(300)
      const frame = encodeTextFrame(text)
      const frames = decoder.decode(frame)
      expect(frames).toHaveLength(1)
      expect(frames[0]).toEqual({ type: 'text', data: text })
    })

    it('round-trips large payload (>65535 bytes)', () => {
      const text = 'z'.repeat(70000)
      const frame = encodeTextFrame(text)
      const frames = decoder.decode(frame)
      expect(frames).toHaveLength(1)
      expect(frames[0]).toEqual({ type: 'text', data: text })
    })

    it('handles UTF-8 multibyte characters', () => {
      const text = 'olá mundo 🌍'
      const frames = decoder.decode(encodeTextFrame(text))
      expect(frames[0]).toEqual({ type: 'text', data: text })
    })
  })

  describe('control frames', () => {
    it('decodes an unmasked ping frame', () => {
      const frame = Buffer.from([0x89, 0x00])
      const frames = decoder.decode(frame)
      expect(frames).toHaveLength(1)
      expect(frames[0].type).toBe('ping')
    })

    it('decodes an unmasked close frame', () => {
      const frame = Buffer.from([0x88, 0x00])
      const frames = decoder.decode(frame)
      expect(frames).toHaveLength(1)
      expect(frames[0].type).toBe('close')
    })
  })

  describe('buffering', () => {
    it('buffers an incomplete frame and returns nothing', () => {
      const frame = buildUnmaskedTextFrame('hello')
      const partial = frame.subarray(0, 3)
      const frames = decoder.decode(partial)
      expect(frames).toHaveLength(0)
    })

    it('reassembles a frame split across two chunks', () => {
      const frame = buildUnmaskedTextFrame('hello')
      decoder.decode(frame.subarray(0, 3))
      const frames = decoder.decode(frame.subarray(3))
      expect(frames).toHaveLength(1)
      expect(frames[0]).toEqual({ type: 'text', data: 'hello' })
    })
  })

  describe('multiple frames', () => {
    it('decodes two concatenated frames in one chunk', () => {
      const a = buildUnmaskedTextFrame('foo')
      const b = buildUnmaskedTextFrame('bar')
      const combined = Buffer.concat([a, b])
      const frames = decoder.decode(combined)
      expect(frames).toHaveLength(2)
      expect(frames[0]).toEqual({ type: 'text', data: 'foo' })
      expect(frames[1]).toEqual({ type: 'text', data: 'bar' })
    })

    it('decodes a text frame followed by a ping frame', () => {
      const text = buildUnmaskedTextFrame('msg')
      const ping = Buffer.from([0x89, 0x00])
      const frames = decoder.decode(Buffer.concat([text, ping]))
      expect(frames).toHaveLength(2)
      expect(frames[0]).toEqual({ type: 'text', data: 'msg' })
      expect(frames[1].type).toBe('ping')
    })
  })
})
