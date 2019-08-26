export interface Compiler {
    compile: (input: string, importCallback: (dependency: string) => object) => string,
    loadRemoteVersion: (version: string, cb: (err: Error, ret: Compiler) => void) => void,
    version: () => string,
    setupMethods: (module: any) => Compiler
}
