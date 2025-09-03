// api/songs.js  (Vercel Serverless Function: Next.js 以外でも動作)
const BASE = 'https://api.jsonstorage.net/v1/json'

// 必要に応じて設定（Vercelダッシュボード -> Project -> Settings -> Environment Variables）
const DOCUMENT_ID = process.env.JSONSTORAGE_DOCUMENT_ID || '' // 初回は空でもOK
const API_KEY = process.env.JSONSTORAGE_API_KEY || ''         // 使わない場合は未設定でOK

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function getDocId() {
  if (DOCUMENT_ID) return DOCUMENT_ID

  // まだドキュメントIDがなければ新規作成（空配列で初期化）
  const resp = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'apiKey': API_KEY } : {}),
    },
    body: JSON.stringify([]),
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`jsonstorage POST failed: ${resp.status} - ${t}`)
  }
  const data = await resp.json()
  // 返却が {uri} または {id} の場合があるため両対応
  const id = data?.id || (data?.uri ? String(data.uri).split('/').pop() : '')
  if (!id) throw new Error('jsonstorage: could not parse created document id')

  console.log('[jsonstorage] Created document id:', id)
  // ★重要：コンソールに出た id を Vercel 環境変数 JSONSTORAGE_DOCUMENT_ID にセットして再デプロイしてください
  return id
}

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const id = await getDocId()

    if (req.method === 'GET') {
      const r = await fetch(`${BASE}/${id}`, {
        headers: { ...(API_KEY ? { 'apiKey': API_KEY } : {}) },
      })
      if (r.status === 404) {
        // なくなっていたら作り直し
        const created = await fetch(BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(API_KEY ? { 'apiKey': API_KEY } : {}),
          },
          body: JSON.stringify([]),
        })
        if (!created.ok) {
          const tt = await created.text()
          throw new Error(`jsonstorage recreate failed: ${created.status} - ${tt}`)
        }
        return res.status(200).json([])
      }
      if (!r.ok) {
        const t = await r.text()
        throw new Error(`jsonstorage GET failed: ${r.status} - ${t}`)
      }
      const data = await r.json()
      return res.status(200).json(data)
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? [])
      let r = await fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'apiKey': API_KEY } : {}),
        },
        body,
      })

      if (r.status === 404) {
        // ドキュメントが未作成なら POST で作成
        const created = await fetch(BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(API_KEY ? { 'apiKey': API_KEY } : {}),
          },
          body,
        })
        if (!created.ok) {
          const tt = await created.text()
          throw new Error(`jsonstorage POST after 404 failed: ${created.status} - ${tt}`)
        }
        r = created
      }

      if (!r.ok) {
        const t = await r.text()
        throw new Error(`jsonstorage PUT/POST failed: ${r.status} - ${t}`)
      }
      const data = await r.json().catch(() => ({}))
      return res.status(200).json(data)
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err?.message || 'Internal Error' })
  }
}