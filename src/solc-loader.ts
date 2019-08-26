const solc: Compiler = require('solc')
const debug = require('debug')('sharp:solc-loader')

import * as semver from 'semver'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

import { Compiler } from './typings'
import { httpGet } from './utils'

interface VersionList {
    releases: {
        [index: string]: string
    },
    latestRelease: string
}

const RepoHost = 'https://ethereum.github.io/solc-bin/bin/'
let versionList: VersionList

const getMatchedVersion = async (ver: string) => {
    const list = await getVerList()
    const versions = Object.keys(list.releases)
    const v = semver.maxSatisfying(versions, ver)
    if (v) {
        return list.releases[v]
    } else {
        throw new Error('can not find the matched version: ' + ver)
    }
}

const getVerList = async () => {
    if (versionList) {
        return versionList
    } else {
        const url = 'https://ethereum.github.io/solc-bin/bin/list.json'
        const data = await httpGet<string>(url)
        versionList = JSON.parse(data) as VersionList
    }
    return versionList
}

const localOrRemote = async (ver: string) => {
    debug('supply the compiler:', ver)
    const p = path.join(__dirname, '../solc-bin', ver)
    if (fs.existsSync(p)) {
        debug('load solc from local cache')
        const com = solc.setupMethods(require(p))
        return com
    } else {
        debug('load solc from remote')
        const stream = fs.createWriteStream(p)
        await new Promise((resolve, reject) => {
            https.get(RepoHost + ver, res => {
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
        return solc.setupMethods(require(p))
    }
}

const getSolidityCompiler = async (verReq: string) => {
    verReq = (() => {
        if (verReq) {
            if (!semver.validRange(verReq)) {
                throw new Error('invalid version requirement: ' + verReq)
            }
            return verReq
        } else {
            return 'latest'
         }
    })()
    const list = await getVerList()

    const verStr = await getMatchedVersion(verReq === 'latest' ? list.latestRelease : verReq )
    debug('supply the solc by version: ' + verStr)
    const compiler = await localOrRemote(verStr)
    debug('supplied solc: ' + compiler.version())
    return compiler
}

export {
    getSolidityCompiler
}
