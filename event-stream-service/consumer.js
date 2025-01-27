const { AckPolicy, connect, millis } = require("nats");
// connection info
const servers = ["localhost:4222", "localhost:4223", "localhost:4224"];

let nc = undefined; // nats connection
let js = undefined; // jet stream
let jsm = undefined; // jet stream manager

// stream info
const name = "CHEFS";

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

const consume = async () => {
  console.log(`connect to nats server(s) ${servers} as 'anonymous'...`);
  nc = await connect({
    servers: servers,
  });

  console.log("access jetstream...");
  js = nc.jetstream();
  console.log("get jetstream manager...");
  jsm = await js.jetstreamManager();

  // The new consumer API is a pull consumer
  // Let's create an ephemeral consumer. An ephemeral consumer
  // will be reaped by the server when inactive for some time
  console.log(
    `\nadd ephemeral consumer of stream '${name}' to jetstream manager...`
  );
  let ci = await jsm.consumers.add(name, { ack_policy: AckPolicy.None });
  console.log(`get consumer by name '${ci.name}'...`);
  const c = await js.consumers.get(name, ci.name);
  console.log(
    "ephemeral consumer will live until inactivity of ",
    millis((await c.info(true)).config.inactive_threshold),
    "millis"
  );

  // you can retrieve messages one at time with next():
  console.log("retrieve messages by calling next on consumer...");
  let m = await c.next();
  if (!m) {
    // no messages, publisher may have cleared the stream...
    console.log("No messages, publisher may have cleared the stream...");
    console.log("drain nats connection...");
    await nc.drain();
    return;
  }
  printMsg(m);

  m = await c.next();
  printMsg(m);

  m = await c.next();
  printMsg(m);

  // Let's create another consumer, this time well use fetch
  // we'll make this a durable
  console.log("\nadd consumer with durable_name 'A'");
  await jsm.consumers.add(name, {
    ack_policy: AckPolicy.Explicit,
    durable_name: "A",
  });
  console.log("get consumer by name 'A'...");
  const c2 = await js.consumers.get(name, "A");
  console.log("fetch 3 messages (max)...");
  let iter = await c2.fetch({ max_messages: 3 });
  console.log("iterate over results and ack each one...");
  for await (const m of iter) {
    printMsg(m);
    m.ack();
  }
  // if you know you don't need to save the state of the consumer, you can
  // delete it:
  console.log("delete consumer...");
  await c2.delete();

  // Lastly we'll create another one but this time use consume
  // this consumer will be an ordered consumer - this one is an ephemeral
  // that guarantees that messages are delivered in order
  // These have a special shortcut, we only need the name of the stream
  // the underlying consumer is managed under the covers
  console.log("\nget ordered consumer (ephemeral)...");
  const c3 = await js.consumers.get(name);
  console.log("consume 3 messages (max)...");
  iter = await c3.consume({ max_messages: 3 });
  for await (const m of iter) {
    printMsg(m);
    // if we don't break, consume would keep waiting for messages
    // we know when we have seen all messages when no more are pending
    if (m.info.pending === 0) {
      console.log("no more messages, break.");
      break;
    }
  }

  console.log("drain nats connection...");
  await nc.drain();
};

consume();
