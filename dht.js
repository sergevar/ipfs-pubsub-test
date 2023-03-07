import { create } from 'libp2p-kad-dht'

/**
 * @param {Libp2p} libp2p
 */
async function addDHT(libp2p) {
    const customDHT = create({
        libp2p,
        protocolPrefix: '/custom'
    })
    await customDHT.start()

    return customDHT
}
