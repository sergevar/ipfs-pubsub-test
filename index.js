(async function () {
    const IPFS = await(await Function('return import("ipfs-core")')());
    const tcp = await(await Function('return import("@libp2p/tcp")')()).tcp;
    const gossipsub = await(await Function('return import("@chainsafe/libp2p-gossipsub")')()).gossipsub;
    const floodsub = await(await Function('return import("@libp2p/floodsub")')()).floodsub;
    const mplex = await(await Function('return import("@libp2p/mplex")')()).mplex;
    const noise = await(await Function('return import("@chainsafe/libp2p-noise")')()).noise;
    const webRTCStar = await(await Function('return import("@libp2p/webrtc-star")')()).webRTCStar;
    const pubsubPeerDiscovery = await(await Function('return import("@libp2p/pubsub-peer-discovery")')()).pubsubPeerDiscovery;
    const KadDHT = await(await Function('return import("@libp2p/kad-dht")')()).KadDHT;

    const randomNumber = (min, max) => { return Math.floor(Math.random() * (max - min + 1)) + min; }

    const nodeID = randomNumber(100, 500);

    const portStartRange = 10000;
    const port = portStartRange + nodeID

    const ipfsRepoPath = 'ipfs-repos/' + nodeID;

    // Create an IPFS node


    const webRTC = webRTCStar({

    })

    let StaticRelays = [];

    const node = await IPFS.create({
        repo: ipfsRepoPath,
        config: {
            Addresses: {
                Swarm: [
                    "/ip4/0.0.0.0/tcp/" + port,
                    "/ip6/::/tcp/" + port,
                    "/ip4/0.0.0.0/tcp/"+(port+1)+"/ws",
                    // "/ip6/::/tcp/"+(port+1)+"/ws",
                    "/ip4/0.0.0.0/udp/"+port+"/quic",
                    "/ip6/::/udp/"+port+"/quic",
                    "/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star",
                ],
                "Announce": [],
                "AppendAnnounce": null,
                "NoAnnounce": [],
                // API: "/ip4/127.0.0.1/tcp/5012",
                // Gateway: "/ip4/127.0.0.1/tcp/9191",
                // RPC: "/ip4/127.0.0.1/tcp/4839",
                API: '',
                Gateway: '',
            },
            "AutoNAT": {},
            Swarm: {
                EnableHolePunching: true,
                RelayClient: {
                    Enabled: true,
                    // StaticRelays
                },
                RelayService: {
                    Enabled: false
                }
            },
            "Discovery": {
                "MDNS": {
                    "Enabled": true,
                    "Interval": 10
                },
                "webRTCStar": {
                    "Enabled": true
                }
            },
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
            // peerDiscovery: [MulticastDNS],
            peerDiscovery: [
                pubsubPeerDiscovery(),
                webRTC.discovery,
                // MulticastDNS
            ],
            dht: {
                enabled: true,
                randomWalk: {
                    enabled: true
                }
            },
            relay: {                   // Circuit Relay options
                enabled: true,           // Allows you to dial and accept relayed connections. Does not make you a relay.
                hop: {
                    enabled: true,         // Allows you to be a relay for other peers.
                    timeout: 30 * 1000,    // Incoming hop requests must complete within this timeout
                    applyConnectionLimits: true, // Apply data/duration limits to relayed connections (default: true)
                    limit: {
                        duration: 120 * 1000, // the maximum amount of ms a relayed connection can be open for
                        data: BigInt(1 << 17), // the maximum amount of data that can be transferred over a relayed connection
                    }
                },
                advertise: {
                    enabled: true,         // Allows you to disable advertising the Hop service
                    bootDelay: 15 * 60 * 1000, // Delay before HOP relay service is advertised on the network
                    ttl: 30 * 60 * 1000    // Delay Between HOP relay service advertisements on the network
                },
                reservationManager: {    // the reservation manager creates reservations on discovered relays
                    enabled: true,         // enable the reservation manager, default: false
                    // maxReservations: 1     // the maximum number of relays to create reservations on
                },
                active: true,
                autoRelay: {
                    enabled: true,
                    // maxListeners: 3
                },
            },
            dht: KadDHT,
            streamMuxers: [mplex()],
            connectionEncryption: [noise()],
            // we add the Pubsub module we want
            // pubsub: new gossipsub({
            //     allowPublishToZeroPeers: true,
            //     fallbackToFloodsub: true,
            //     emitSelf: true,
            //     maxInboundStreams: 64,
            //     maxOutboundStreams: 128
            // }),
            pubsub: floodsub(),
            datastore: undefined,
            nat: {enabled: true}
        }
    });

    const { cid } = await node.add('Hello world')
    console.info(cid)

    // Subscribe to a topic
    const topic = 'applejuice';
    const subscription = node.pubsub.subscribe(topic, (message) => {
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

        const id = await node.id();
        console.log('ID: ', id.id);
    }, 2000);
})();
