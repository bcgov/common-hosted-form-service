const { connect } = require("nats");

// connection info
const servers = ["localhost:4222", "localhost:4223", "localhost:4224"];
const username = "chefs";
const password = "password";

let nc = undefined; // nats connection
let js = undefined; // jet stream
let jsm = undefined; // jet stream manager

// stream info
const name = "CHEFS";
const subj = "PUBLIC.forms";
const privatesubj = "PRIVATE.forms";

const publish = async () => {
  console.log(`connect to nats server(s) ${servers} as '${username}'...`);
  nc = await connect({
    servers: servers,
    user: username,
    pass: password,
  });

  console.log("access jetstream...");
  js = nc.jetstream();
  console.log("get jetstream manager...");
  jsm = await js.jetstreamManager();

  console.log(`add stream '${name}' to jetstream manager...`);

  await jsm.streams.add({
    name,
    subjects: [`${subj}.>`, `${privatesubj}.>`],
  });

  console.log("publish 3 messages...");
  let ack = await js.publish(
    `${subj}.1`,
    JSON.stringify({ meta: { id: 1 }, payload: { data: "one" } })
  );
  console.log(`ack stream: ${ack.stream}, seq: ${ack.seq}`);
  ack = await js.publish(
    `${subj}.2`,
    JSON.stringify({ meta: { id: 2 }, payload: { data: "two" } })
  );
  console.log(`ack stream: ${ack.stream}, seq: ${ack.seq}`);
  ack = await js.publish(
    `${subj}.3`,
    JSON.stringify({ meta: { id: 3 }, payload: { data: "three" } })
  );
  console.log(`ack stream: ${ack.stream}, seq: ${ack.seq}`);

  // find a stream that stores a specific subject:
  const sname = await jsm.streams.find(`${subj}.1`);
  // retrieve info about the stream by its name
  const si = await jsm.streams.info(sname);
  console.log(
    `stream messages: ${si.state.messages}, first_seq: ${si.state.first_seq}, last_seq: ${si.state.last_seq}, last_ts: ${si.state.last_ts}`
  );

  console.log("CTRL-C to close.");
};

publish();

const close = async () => {
  console.log(`\npurge messages from '${name}' stream`);
  await jsm.streams.purge(name);
  console.log("drain nats connection...");
  await nc.drain();
  console.log("done.");
};

process.on("SIGINT", close);
