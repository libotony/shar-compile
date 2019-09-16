import * as https from 'https'
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
