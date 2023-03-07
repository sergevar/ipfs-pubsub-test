;(async function () {
    const IPFS = await(await Function('return import("ipfs-core")')());
    const OrbitDB = await(await Function('return import("orbit-db")')()).default;

    const randomNumber = (min, max) => { return Math.floor(Math.random() * (max - min + 1)) + min; }

    const nodeID = randomNumber(100, 500);

    const portStartRange = 10000;
    const port = portStartRange + nodeID

    const ipfsRepoPath = 'ipfs-repos/' + nodeID;

    const ipfs = await IPFS.create({
        repo: ipfsRepoPath,
        config: {
            Addresses: {
                Swarm: ["/ip4/0.0.0.0/tcp/" + port, "/ip4/127.0.0.1/tcp/" + (port + 1) + "/ws"],
                // API: "/ip4/127.0.0.1/tcp/5012",
                // Gateway: "/ip4/127.0.0.1/tcp/9191",
                // RPC: "/ip4/127.0.0.1/tcp/4839",
                API: '',
                Gateway: '',
            },
        }
    })

    const orbitdb = await OrbitDB.createInstance(ipfs, {
        directory: './ipfs-repos/orbitdb/' + nodeID
    })

    // Create / Open a database
    const db = await orbitdb.log("hello")
    await db.load()

    // Listen for updates from peers
    db.events.on("replicated", address => {
        console.log('replicated', db.iterator({ limit: -1 }).collect())
    })

    // Current time formatted
    const now = () => new Date().toLocaleTimeString()

    // Add an entry
    setInterval(async () => {
        const hash = await db.add("world " + now() + " nodeID: " + nodeID)
        // console.log(hash)

        // turn hash into data
        const data = await db.get(hash)

        const data2 = data.payload.value;

        console.log(hash, data2);

    }, 2000);

    // Query
    const result = db.iterator({ limit: -1 }).collect()
    console.log(JSON.stringify(result, null, 2))
})()
