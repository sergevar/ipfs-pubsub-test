// const IPFS = require('ipfs')
// const BCHJS = require('@psf/bch-js')
// const IpfsCoord = require('ipfs-coord')
//
// async function start() {
//     // Create an instance of bch-js and IPFS.
//     const bchjs = new BCHJS()
//     const ipfs = await IPFS.create()
//
//     // Pass bch-js and IPFS to ipfs-coord when instantiating it.
//     const ipfsCoord = new IpfsCoord({
//         ipfs,
//         bchjs,
//         type: 'node.js'
//     })
//
//     await ipfsCoord.start()
//     console.log('IPFS and the coordination library is ready.')
// }
// start()

(async() => {
    const IPFS = await(await Function('return import("ipfs-core")')());
    const BCHJS = await(await Function('return import("@psf/bch-js")')()).default;
    const IpfsCoord = await(await Function('return import("ipfs-coord")')());

    async function start() {
        // Create an instance of bch-js and IPFS.
        const bchjs = new BCHJS()
        const ipfs = await IPFS.create()

        // Pass bch-js and IPFS to ipfs-coord when instantiating it.
        const ipfsCoord = new IpfsCoord({
            ipfs,
            bchjs,
            type: 'browser'
        })

        await ipfsCoord.start()
        console.log('IPFS and the coordination library is ready.')
    }
    start()
})()
