# public-form-submit

A script to load a form, submit a pre-made submission, and load the submission. No authentication, uses public-type forms.

See parent directory README for general K6 details.

## Prerequesites

This script will require you to add the form to the CHEFS instance that you want to test. This folder includes a `fixtures` folder with schema definitions that correspond to the test data.

To add the form, just 

- Create A New Form in CHEFS, (name it whatever wanted)
- Set Form Access to **Public**
- Leave all other settings default (do **not** set a confirmation email)
- In the form designer use the Import Design button to pick one of the schemas in the `fixtures` folder
- Save the form and then publish it from the Manage page
- Copy the form ID for the form you just published (can be found in the Share form link from the Manage page). You will need this form ID as a parameter.

The `fixtures` folder includes 3 form example schemas, *<small,medium,large>_form_schema.json*.
When running the form there are corresponding test data files that will be loaded to match these form designs (see Parameters).

## Parameters

See more details about K6 

| Parameter  | Description |
| ------------- | ------------- |
| URL  | The CHEFS url to test, use the root URL with the slash at the end (example: `http://localhost:8081/`, or `https://chefs-dev.apps.silver.devops.gov.bc.ca/`)  |
| FORM_ID  | The ID for the form that you created as a prerequesite  |
| FORM_TYPE  | Which size of form to use for the load test. `small`, `medium`, or `large`. The form ID you use must match the FORM_TYPE you created the form with and use here.  |

See more K6 details on how [Environment Variables](https://k6.io/docs/using-k6/environment-variables/) work

## Command example

`k6 run -e FORM_ID=c9ec0f0f-3302-4e65-be72-e77f92a22dac -e URL=http://localhost:8081/ -e FORM_TYPE=large  --vus=10 --iterations=100 script.js`