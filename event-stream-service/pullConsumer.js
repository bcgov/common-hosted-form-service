const { AckPolicy, connect } = require("nats");

// connection info
const servers = ["localhost:4222", "localhost:4223", "localhost:4224"];

let nc = undefined; // nats connection
let js = undefined; // jet stream
let jsm = undefined; // jet stream manager
let consumer = undefined; // pull consumer (ordered, ephemeral)

// stream info
const STREAM_NAME = "CHEFS";
const FILTER_SUBJECTS = ["PUBLIC.forms.>", "PRIVATE.forms.>"];
const MAX_MESSAGES = 2;
const DURABLE_NAME = "pullConsumer";

const printMsg = (m) => {
  // illustrate grabbing the sequence and timestamp from the nats message...
  try {
    const ts = new Date(m.info.timestampNanos / 1000000).toISOString();
    console.log(
      `msg seq: ${m.seq}, subject: ${m.subject}, timestamp: ${ts}, streamSequence: ${m.info.streamSequence}, deliverySequence: ${m.info.deliverySequence}`
    );
    // illustrate (one way of) grabbing message content as json
    console.log(JSON.stringify(m.json(), null, 2));
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
