import * as https from 'https'
import * as fs from 'fs'
import { Buffer } from 'buffer'

export const httpGet = <T>(url: string) => {
    return new Promise<T>((resolve, reject) => {
        https.get(url,
            res => {
                if (res.statusCode !== 200) {
                    reject(new Error('Invalid response code: ' + res.statusCode))
                }
                const chunks: Buffer[] = []
                res.on('data', chunk => {
                    chunks.push(chunk)
                })
                res.on('end', () => {
                    resolve(Buffer.concat(chunks).toString('utf8') as any)
                })
            }).on('error', err => {
                reject(err)
            })
    })
}

export const httpGetToStream = (url: string, stream: fs.WriteStream) => {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            if (res.statusCode !== 200) {
                reject(new Error('Invalid response code: ' + res.statusCode))
            }
            res.pipe(stream)
            res.on('end', () => {
                resolve()
            })
        }).on('error', (err) => {
            reject(err)
        })
    })
}
