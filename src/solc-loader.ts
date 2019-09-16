const solc: Compiler = require('solc')
const debug = require('debug')('sharp:solc-loader')
const requireFromString = require('require-from-string')

import * as semver from 'semver'
import * as fs from 'fs'
import * as path from 'path'

import { Compiler } from './typings'
import { httpGet } from './utils'

interface VersionList {
    releases: {
        [index: string]: string
    },
    latestRelease: string
}

const RepoHost = 'https://ethereum.github.io/solc-bin/bin/'
const listFile = path.join(__dirname, '../solc-bin/list.json')
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
        if (fs.existsSync(listFile)) {
            const stats = fs.lstatSync(listFile)
            if (new Date().getTime() - stats.mtime.getTime() <= 24 * 60 * 60 * 1000) {
                versionList = require(listFile) as VersionList
                return versionList
            }
        }

        const url = 'https://ethereum.github.io/solc-bin/bin/list.json'
        const data = await httpGet<string>(url)
        versionList = JSON.parse(data) as VersionList

        const fd = fs.openSync(listFile, 'w')
        fs.writeSync(fd, JSON.stringify(versionList, null, 4), null, 'utf-8')
        fs.closeSync(fd)

        return versionList
    }
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
        const content = await httpGet(RepoHost + ver)
        const com = solc.setupMethods(requireFromString(content))
        try {
            const fd = fs.openSync(p, 'w')
            fs.writeSync(fd, content, null, 'utf-8')
            fs.closeSync(fd)
        } catch (e) {
            debug('write solc to file failed: ', e)
        }
        return com

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
