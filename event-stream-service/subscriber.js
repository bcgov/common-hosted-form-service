const { connect, consumerOpts } = require("nats");
// connection info
const servers = ["localhost:4222", "localhost:4223", "localhost:4224"];

let nc = undefined; // nats connection
let js = undefined; // jet stream

// stream info
const SUBJECTS = ["PUBLIC.forms.>", "PRIVATE.forms.>"];

const printMsg = (m) => {
  try {
    const ts = new Date(m.info.timestampNanos / 1000000).toISOString();
    console.log(
      `msg seq: ${m.seq}, subject: ${m.subject}, timestamp: ${ts}, streamSequence: ${m.info.streamSequence}, deliverySequence: ${m.info.deliverySequence}`
    );
    console.log(JSON.stringify(m.json(), null, 2));
  } catch (e) {
    console.error(`Error printing message: ${e.message}`);
  }
};

const subscribe = async () => {
  console.log(`connect to nats server(s) ${servers} as 'anonymous'...`);
  nc = await connect({
    servers: servers,
  });

  console.log("access jetstream...");
  js = nc.jetstream();

  SUBJECTS.forEach(async (key) => {
    const opts = consumerOpts();
    opts.maxMessages(100);
    opts.ackExplicit();
    opts.deliverNew();
    opts.deliverTo("_INBOX.push_consumer");
    console.log(`subscribe to ${key}`);
    const sub = await js.subscribe(key, opts);
    await (async () => {
      for await (const m of sub) {
        printMsg(m);
        m.ack();
      }
    })();
  });

  console.log("CTRL-C to close.");
};

subscribe();

const close = async () => {
  console.log("drain nats connection...");
  await nc.drain();
  console.log("done.");
};

process.on("SIGINT", close);
