# Sharp Compile

Compile contracts written in solidity. Wrap of [solc-js](https://github.com/ethereum/solc-js) for [sharp-cli](https://github.com/libotony/sharp-cli) `compile` command.

+ Load solidity compiler by semver
+ Compile contract source
+ Resolve local file dependencies

## API

### Load solidity compiler

``` javascript
// accept semver range as the parameter
import { getSolidityCompiler } from '@****/sharp-compile'

const solc = getSolidityCompiler('^0.4.24')
```

### Compile contract source

``` javascript
import { compile } from '@****/sharp-compile'

const jsonOutput = compile(solc, { contractsDirectory, file, options })
```
