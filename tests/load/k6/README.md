# CHEFS K6 Tests

The K6 scripts contained here are for load testing purposes in CHEFS.

If you are not familiar with K6, please start with the documentation on [their site](https://k6.io/docs/#what-is-k6).

It is important not to run load test scripts against production (or other important environments) unless controlled. As well, if load tests are ever being run against an OpenShift hosted CHEFS instance using a very high volume (in the thousands of requests or higher) you should check with platform services as high network incoming traffic should be monitored and done outside peak times.

## Running Scripts

See K6 documentation on [running scripts](https://k6.io/docs/getting-started/running-k6/)

As each different load tests scenario/test case will have different prerquestite setup and different input parameters. Each different test case will have a readme in their respective directory.

### Current scripts

- [public-form-submit](./public-form-submit): a script to load a form, submit a pre-made submission, and load the submission. No authentication, uses public-type forms.

## Understanding Results

See the K6 documentation around [analyzing results](https://k6.io/docs/cloud/analyzing-results/overview/).