/**
 * IMPORTANT
 * These numbers are the values used PER TEST. That means that if you run tests hitting 5 endpoints, each
 * with its own test, you will get 5 times the number of users specified by the stages of total traffic.
 * These values were entered assuming 1 test is run at a time. Adjust them accordingly.
 */
const TEST_RUN_USERS = __ENV.TEST_RUN_USERS ? __ENV.TEST_RUN_USERS : 1;
const MIN_USERS = __ENV.MIN_USERS ? __ENV.MIN_USERS : 20;
const MAX_USERS = __ENV.MAX_USERS ? __ENV.MAX_USERS : 200;
const AVERAGE_USERS = __ENV.AVERAGE_USERS ? __ENV.AVERAGE_USERS : 75;
const STRESS_LOAD_USERS = __ENV.STRESS_LOAD_USERS
  ? __ENV.STRESS_LOAD_USERS
  : 150;

export const STAGES = {
  // Test run stages to make sure all scenarios are working
  test_run: [
    { duration: "5s", target: TEST_RUN_USERS },
    { duration: "10s", target: TEST_RUN_USERS },
    { duration: "5s", target: 0 },
  ],

  // Smoke tests for minimum expected load
  smoke: [
    { duration: "1m", target: MIN_USERS }, // ramp-up of traffic to the smoke users
    { duration: "2m", target: MIN_USERS }, // stay at minimum users for 10 minutes
    { duration: "1m", target: 0 }, // ramp-down to 0 users
  ],

  // Load tests at average load
  load: [
    { duration: "1m", target: AVERAGE_USERS }, // ramp up to average user  base
    { duration: "10m", target: AVERAGE_USERS }, // maintain average user base
    { duration: "1m", target: 0 }, // ramp down
  ],

  // Load tests for average load with a spike to stress load
  load_with_spike: [
    { duration: "1m", target: MIN_USERS }, // ramp up to minimum users
    { duration: "2m", target: MIN_USERS }, // maintain minimum users
    { duration: "1m", target: AVERAGE_USERS }, // ramp up to average user  base
    { duration: "10m", target: AVERAGE_USERS }, // maintain average user base
    // Small spike
    { duration: "1m", target: STRESS_LOAD_USERS }, // scale up to stress load
    { duration: "2m", target: STRESS_LOAD_USERS }, // briefly maintain stress load
    { duration: "1m", target: AVERAGE_USERS }, // scale back to average users
    { duration: "2m", target: AVERAGE_USERS }, // briefly maintain average users
    { duration: "1m", target: 0 }, // maintain average users
  ],

  // Stress tests for heavy load
  stress: [
    { duration: "2m", target: MIN_USERS }, // ramp up to minimum users
    { duration: "1m", target: MIN_USERS }, // maintain minimum users
    { duration: "3m", target: AVERAGE_USERS }, // maintain average users
    { duration: "5m", target: AVERAGE_USERS }, // maintain average users
    { duration: "5m", target: STRESS_LOAD_USERS }, // ramp up to stress load
    { duration: "30m", target: STRESS_LOAD_USERS }, // maintain stress load
    { duration: "10m", target: 0 }, // gradually drop to 0 users
  ],

  // Spike tests for maximum expected load (e.g. entire expected user base)
  // Initial scenario this is intended to simulate is the COS wide training session
  // when a significant portion of the user base will likely all log on at the same time.
  spike: [
    { duration: "2m", target: MAX_USERS }, // simulate fast ramp up of users to max users
    { duration: "20m", target: MAX_USERS }, // stay at max users
    { duration: "2m", target: 0 }, // ramp-down to 0 users
  ],

  // Soak tests for extended varrying standard load
  soak: [
    { duration: "2m", target: MIN_USERS }, // ramp up to minimum users
    { duration: "5m", target: MIN_USERS }, // maintain minimum users
    { duration: "5m", target: AVERAGE_USERS }, // ramp up to average user  base
    { duration: "480m", target: AVERAGE_USERS }, // maintain average user base
    { duration: "5m", target: MIN_USERS }, // slow down to minimum users
    { duration: "20m", target: MIN_USERS }, // maintain low numbers
    { duration: "10m", target: 0 }, // gradually drop to 0 users
  ],
};
