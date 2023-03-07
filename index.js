(async function () {
    const IPFS = await(await Function('return import("ipfs-core")')());
    const tcp = await(await Function('return import("@libp2p/tcp")')()).tcp;
    const gossipsub = await(await Function('return import("@chainsafe/libp2p-gossipsub")')()).gossipsub;
    const mplex = await(await Function('return import("@libp2p/mplex")')()).mplex;
    const noise = await(await Function('return import("@chainsafe/libp2p-noise")')()).noise;

    const randomNumber = (min, max) => { return Math.floor(Math.random() * (max - min + 1)) + min; }

    const nodeID = randomNumber(100, 500);

    const portStartRange = 10000;
    const port = portStartRange + nodeID

    const ipfsRepoPath = 'ipfs-repos/' + nodeID;

    // Create an IPFS node

    const node = await IPFS.create({
        repo: ipfsRepoPath,
        config: {
            Addresses: {
                Swarm: ["/ip4/0.0.0.0/tcp/" + port, "/ip4/127.0.0.1/tcp/"+(port+1)+"/ws"],
                // API: "/ip4/127.0.0.1/tcp/5012",
                // Gateway: "/ip4/127.0.0.1/tcp/9191",
                // RPC: "/ip4/127.0.0.1/tcp/4839",
            }
        },
        libp2p: {
            // addresses: {
            //     listen: [
            //         '/ip4/0.0.0.0/tcp/' + port,
            //         '/ip6/::/tcp/' + port,
            //         '/ip4/0.0.0.0/tcp/' + (port+1),
            //         '/ip6/::/tcp/' + (port+1),
            //     ]
            // },
            // transports: [tcp()],
            streamMuxers: [mplex()],
            connectionEncryption: [noise()],
            // we add the Pubsub module we want
            pubsub: new gossipsub({
                allowPublishToZeroPeers: true,
                fallbackToFloodsub: true,
                emitSelf: true,
                maxInboundStreams: 64,
                maxOutboundStreams: 128
            }),
            datastore: undefined,
            nat: {enabled: true}
        }
    });

    const { cid } = await node.add('Hello world')
    console.info(cid)

    // Subscribe to a topic
    const topic = 'applejuice';
    const subscription = node.pubsub.subscribe(topic, {discover: true}, (message) => {
        console.log(`Received message "${message.data.toString('utf-8')}" on topic "${message.topic}"`);
    });
    console.log(`Subscribed to topic "${topic}"`);

    // Publish a message
    setInterval(async() => {
        const message = 'Hello, world! NodeID: ' + nodeID;
        const messageBuffer = Buffer.from(message);
        await node.pubsub.publish(topic, messageBuffer);
        console.log(`Published message "${message}" to topic "${topic}"`);

        const peers = await node.swarm.peers(topic);
        const pubsubPeers = await node.pubsub.peers(topic);
        console.log('Swarm Peers: ', peers.length, 'PubsubPeers: ', pubsubPeers.length);
    }, 2000);
})();
