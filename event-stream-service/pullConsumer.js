const { AckPolicy } = require("nats");
const Cryptr = require("cryptr");

// shim the websocket library
globalThis.WebSocket = require("websocket").w3cwebsocket;
const { connect } = require("nats.ws");

// connection info
const servers = ["ess-a191b5-dev.apps.silver.devops.gov.bc.ca"]; //["localhost:4222", "localhost:4223", "localhost:4224"];

let nc = undefined; // nats connection
let js = undefined; // jet stream
let jsm = undefined; // jet stream manager
let consumer = undefined; // pull consumer (ordered, ephemeral)

// stream info
const STREAM_NAME = "CHEFS";
const FILTER_SUBJECTS = ["PUBLIC.forms.>", "PRIVATE.forms.>"];
const MAX_MESSAGES = 2;
const DURABLE_NAME = "pullConsumer";
const ENCRYPTION_KEY =
  "ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985";

const printMsg = (m) => {
  // illustrate grabbing the sequence and timestamp from the nats message...
  try {
    const ts = new Date(m.info.timestampNanos / 1000000).toISOString();
    console.log(
      `msg seq: ${m.seq}, subject: ${m.subject}, timestamp: ${ts}, streamSequence: ${m.info.streamSequence}, deliverySequence: ${m.info.deliverySequence}`
    );
    // illustrate (one way of) grabbing message content as json
    const data = m.json();
    console.log(JSON.stringify(data, null, 2));
    try {
      if (
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
      console.error("Error decrypting payload.data", err);
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
      console.log(`connect to nats server(s) ${servers} as 'anonymous'...`);
      nc = await connect({
        servers: servers,
      });

      console.log("access jetstream...");
      js = nc.jetstream();
      console.log("get jetstream manager...");
      jsm = await js.jetstreamManager();
      await jsm.consumers.add(STREAM_NAME, {
        ack_policy: AckPolicy.Explicit,
        durable_name: DURABLE_NAME,
      });
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
