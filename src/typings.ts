export interface Compiler {
    compile: (input: string, importCallback: (dependency: string) => object) => string,
    loadRemoteVersion: (version: string, cb: (err: Error, ret: Compiler) => void) => void,
    version: () => string,
    setupMethods: (module: any) => Compiler
}

export type SolcOptions = Partial<{
    version: string,
    evmVersion: 'homestead' | 'tangerineWhistle' | 'spuriousDragon' | 'byzantium' | 'constantinople' | 'petersburg',
    libraries: {
        [fileName: string]: {
            [contractName: string]: string
        }
    };
    optimizer: object
}>

export interface FileMeta {
    [contractName: string]: ContractMeta
}
export interface ContractMeta {
    [index: string]: any
}

export interface JSONOutput {
    contracts: {
        [fileName: string]: FileMeta
    },
    errors: Array<{
        component: string,
        formattedMessage: string,
        message: string,
        severity: string,
        sourceLocation: object,
        type: 'Warning'|any
    }>,
    sources: object
}
