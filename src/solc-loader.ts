
const solc = require('solc')
import * as https from 'https'
import { Buffer } from 'buffer'
import * as semver from 'semver'
const debug = require('debug')('sharp:solc-loader')

interface VersionList {
    releases: {
        [index: string]: string
    }
}

const getMatchedVersion = async (ver: string) => {
    const list = await getListFromRemote()
    const versions = Object.keys(list.releases)
    const v = semver.maxSatisfying(versions, ver)
    if (v) {
        const matched = list.releases[v].replace(/^soljson-/, '').replace(/.js$/, '')
        return matched
    } else {
        throw new Error('can not find the matched version: ' + ver)
    }
}

const getListFromRemote = async () => {
    const url = 'https://ethereum.github.io/solc-bin/bin/list.json'
    const data = await httpGet<string>(url)
    return JSON.parse(data) as VersionList
}

const httpGet = <T>(url: string) => {
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

const supplySolc = async (ver: string) => {
    let compiler = solc
    if (ver) {
        if (!semver.validRange(ver)) {
            throw new Error('invalid version requirement: ' + ver)
        }
        const verStr = await getMatchedVersion(ver)
        debug('load from remote: ' + verStr)
        compiler = await new Promise((resolve, reject) => {
            solc.loadRemoteVersion(verStr, (err: Error, ret: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(ret)
                }
            })
        })
        debug('supply the remote solc: ' + compiler.version())
    } else {
        debug('supply the default version of solc:', solc.version())
    }
    return compiler
}
