const { AckPolicy, JSONCodec, nkeyAuthenticator } = require("nats");
const Cryptr = require("cryptr");
const falsey = require("falsey");
const { v4: uuidv4 } = require("uuid");
/*
 command line pass in environment variables for:
 SERVERS - which nats instance to connect to (default is local from docker-compose)
 DURABLE_NAME - name for the consumer, makes a persistant/durable consumer that will remain listening through periods of inactivity (default is generated uuid)
 WEBSOCKET - connect via nats protocol or websockets. true/false (default false, connect via nats)
 ENCRYPTION_KEY - what encryption key to decrypt (Cryptr - aes-256-gcm) private payloads
 SOURCE - filter messages based on meta.source (default is none)
 NKEY_USER, NKEY_SEED - NKEY User and seed, defaults will work with localhost
 Examples:
  SERVERS=stream-dev.apps.silver.devops.gov.bc.ca WEBSOCKETS=true DURABLE_NAME=pullConsumer ENCRYPTION_KEY=ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985 SOURCE=pr-1444 NKEY_SEED=<your nkey user> NKEY_SEED=<your nkey seed>node pullConsumer.js
  SERVERS=stream-dev.apps.silver.devops.gov.bc.ca WEBSOCKETS=true ENCRYPTION_KEY=ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985 SOURCE=pr-1444 NKEY_SEED=<your nkey user> NKEY_SEED=<your nkey seed> node pullConsumer.js  

  // runs with all defaults against localhost
  node pullConsumer.js
*/

// different connection libraries if we are using websockets or nats protocols.
const WEBSOCKETS = !falsey(process.env.WEBSOCKETS);

let natsConnect;
if (WEBSOCKETS) {
  console.log("connect via ws");
  // shim the websocket library
  globalThis.WebSocket = require("websocket").w3cwebsocket;
  const { connect } = require("nats.ws");
  natsConnect = connect;
} else {
  console.log("connect via nats");
  const { connect } = require("nats");
  natsConnect = connect;
}

// connection info
let servers = [];
if (process.env.SERVERS) {
  servers = process.env.SERVERS.split(",");
} else {
  // running locally
  servers = "localhost:4222,localhost:4223,localhost:4224".split(",");
}

let nc; // nats connection
let js; // jet stream
let jsm; // jet stream manager
let consumer; // pull consumer (ordered, ephemeral)

// stream info
const STREAM_NAME = "CHEFS";
const FILTER_SUBJECTS = ["PUBLIC.forms.>", "PRIVATE.forms.>"];
const MAX_MESSAGES = 2;
const DURABLE_NAME = process.env.DURABLE_NAME || uuidv4();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || undefined;
const SOURCE_FILTER = process.env.SOURCE || false;

// nkey is set in .devcontainer/chefs_local/config/jetstream.conf
// this account is not authorized in any other environment.
const NKEY_USER =
  process.env.NKEY_USER ||
  "UAG36HKWH3PZMLYAK5CAAVVXTXXBNA3YKUYMOF2J66UKHBVMTYMTM2ID";
const NKEY_SEED_VALUE =
  process.env.NKEY_SEED ||
  "SUAJEDVLSUFPYFUCVNMEGT6Z6CVREEZMJOSIHLCZPSMYEZMLRNSNICIRNQ";

const NKEY_SEED = new TextEncoder().encode(NKEY_SEED_VALUE);

const printMsg = (m) => {
  // illustrate grabbing the sequence and timestamp from the nats message...
  try {
    const ts = new Date(m.info.timestampNanos / 1000000).toISOString();
    console.log(
      `msg seq: ${m.seq}, subject: ${m.subject}, timestamp: ${ts}, streamSequence: ${m.info.streamSequence}, deliverySequence: ${m.info.deliverySequence}`
    );
    // illustrate (one way of) grabbing message content as json
    const jsonCodec = JSONCodec();
    const data = jsonCodec.decode(m.data);
    let process = true;
    if (SOURCE_FILTER) {
      process = data["meta"]["source"] === SOURCE_FILTER;
      if (!process) {
        console.log(
          `  not processing message. filter = ${SOURCE_FILTER}, meta.source = ${data["meta"]["source"]}`
        );
      }
    }
    if (process) {
      console.log(data);
      try {
        if (data && data["error"]) {
          console.log(`error with payload: ${data["error"]["message"]}`);
        } else if (
          data &&
          data["payload"] &&
          data["payload"]["data"] &&
          ENCRYPTION_KEY
        ) {
          const cryptr = new Cryptr(ENCRYPTION_KEY);
          const decryptedData = cryptr.decrypt(data["payload"]["data"]);
          const jsonData = JSON.parse(decryptedData);
          console.log("decrypted payload data:");
          console.log(jsonData);
        }
      } catch (err) {
        console.error("  Error decrypting payload.data - check ENCRYPTION_KEY");
      }
    }
  } catch (e) {
    console.error(`Error printing message: ${e.message}`);
  }
};

const init = async () => {
  if (nc && nc.info != undefined) {
    // already connected.
    return;
  } else {
    // open a connection...
    try {
      // no credentials provided.
      // anonymous connections have read access to the stream
      console.log(`connect to nats server(s) ${servers} as '${NKEY_USER}'...`);
      nc = await natsConnect({
        servers: servers,
        reconnectTimeWait: 10 * 1000, // 10s
        authenticator: nkeyAuthenticator(NKEY_SEED),
      });

      console.log("access jetstream...");
      js = nc.jetstream();
      console.log("get jetstream manager...");
      jsm = await js.jetstreamManager();
      await jsm.consumers.add(STREAM_NAME, {
        ack_policy: AckPolicy.Explicit,
        durable_name: DURABLE_NAME,
      });
      console.log(
        `get consumer: stream = ${STREAM_NAME}, durable name = ${DURABLE_NAME}...`
      );
      consumer = await js.consumers.get(STREAM_NAME, DURABLE_NAME);
    } catch (e) {
      console.error(e);
      process.exit(0);
    }
  }
};

const pull = async () => {
  console.log("fetch...");
  let iter = await consumer.fetch({
    filterSubjects: FILTER_SUBJECTS,
    max_messages: MAX_MESSAGES,
  });
  for await (const m of iter) {
    printMsg(m);
    m.ack();
  }
};

const main = async () => {
  await init();
  await pull();
  setTimeout(main, 5000); // process a batch every 5 seconds
};

main();

const shutdown = async () => {
  console.log("\nshutdown...");
  console.log("drain connection...");
  await nc.drain();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGUSR1", shutdown);
process.on("SIGUSR2", shutdown);
process.on("exit", () => {
  console.log("exit.");
});
