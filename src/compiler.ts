const solc = require('solc')
import * as path from 'path'
import * as fs from 'fs'

const outputPattern = {
    '*': [
        'abi',
        'evm.bytecode.object'
    ]
}
const sourceCache = new Map<string, string>()
const compiler = solc.setupMethods(require('../soljson-v0.4.24+commit.e67f0147.js'))

const logger = (str: string) => {
    process.stderr.write(str + '\n')
}

const Compile = (fileName: string, contractsDirectory: string) => {
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
            outputSelection: {
            }
        }
    }
    input.settings.outputSelection[fileName] = outputPattern
    input.sources[fileName] = { content: fileContent }

    const resolver = (dependency: string): object => {
        logger(`${dependency} needs to be resolved`)
        if (dependency.startsWith('/')) {
            return { error: 'require files in the root directory is not allowed' }
        }
        try {
            if (dependency.startsWith('/')) {
                throw new Error('require files in the root directory is not allowed')
            }
            if (!/\S.sol$/.test(fileName)) {
                throw new Error(`only .sol file accepted: ${fileName}`)
            }

            const targetPath = path.join(contractsDirectory, dependency)
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
    Compile
}
