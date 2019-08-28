const debug = require('debug')('sharp:solc-compile')
import * as path from 'path'
import * as fs from 'fs'
import { Compiler } from './typings'

const outputSelection = {
    '*': {
        '*': [
            '*'
        ]
    }
}

const sourceCache = new Map<string, string>()

const compile = async (compiler: Compiler, fileName: string, contractsDirectory: string): Promise<object> => {
    if (!fs.statSync(contractsDirectory).isDirectory()) {
        throw new Error('contract_directory expected a directory')
    }
    if (!/\S.sol$/.test(fileName)) {
        throw new Error(`only .sol file accepted: ${fileName}`)
    }

    const filePath = path.join(contractsDirectory, fileName)
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' })

    // Input
    const input: any = {
        language: 'Solidity',
        sources: {},
        settings: {
            outputSelection
        }
    }
    input.sources[fileName] = { content: fileContent }

    const resolver = (dependency: string): object => {
        debug(`dep: ${dependency}`)
        try {
            if (!/\S.sol$/.test(fileName)) {
                throw new Error(`only .sol file accepted: ${fileName}`)
            }

            let targetPath: string
            if (path.isAbsolute(dependency)) {
                const rPath = path.relative(contractsDirectory, dependency)
                if (rPath.startsWith('../')) {
                    throw new Error('require files beyond the build directory is not supported')
                } else {
                    targetPath = dependency
                }
            }
            targetPath = path.join(contractsDirectory, dependency)

            if (sourceCache.has(targetPath)) {
                return {contents: sourceCache.get(targetPath)}
            }
            const data = fs.readFileSync(targetPath, { encoding: 'utf-8' })
            sourceCache.set(targetPath, data)
            return { contents: data }
        } catch (e) {
            return { error: (e as Error).message }
        }
    }
    const ret = compiler.compile(JSON.stringify(input), resolver)

    return JSON.parse(ret)
}

export {
    compile
}
