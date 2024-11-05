import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { customAlphabet } from 'nanoid'

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const passphrase = customAlphabet('1234567890abcdef', 10)()
  const bingosyncURL = 'https://www.bingosync.com'
  const initialReq = await fetch(bingosyncURL)
  const html = await initialReq.text()
  const cookies = initialReq.headers.get('set-cookie')
  const page = await cheerio.load(html)
  const csrfmiddlewaretoken = page(
    '#new_room_form form input[name="csrfmiddlewaretoken"]',
  ).attr('value')!
  const body = new FormData()
  body.append('csrfmiddlewaretoken', csrfmiddlewaretoken)
  body.append('room_name', payload.roomName)
  body.append('passphrase', passphrase)
  body.append('nickname', 'SMMC24')
  // game_type 4 is for Super Metroid
  body.append('game_type', '4')
  // variant_type 4 is for Super Metroid: Normal
  body.append('variant_type', '4')
  // lockout_mode 1 is for Non-Lockout
  body.append('lockout_mode', '1')
  body.append('is_spectator', 'on')
  body.append('hide_card', 'on')
  body.append('seed', '')
  body.append('custom_json', '')

  const res = await fetch(bingosyncURL, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Cookie': cookies!,
      'Origin': bingosyncURL,
      'Referer': bingosyncURL,
    },
    body,
  })

  const roomPath = res.headers.get('location')

  if (res.status !== 302 || !roomPath) {
    throw new Error(`Expected 302 status code. Got ${res.status}`)
  }

  const roomURL = new URL(roomPath!, bingosyncURL)
  return NextResponse.json({ url: roomURL.toString() })
}
