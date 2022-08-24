
# Common Hosted Form Service [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE) [![img](https://img.shields.io/badge/Lifecycle-Stable-97ca00)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

![Tests](https://github.com/bcgov/common-hosted-form-service/workflows/Tests/badge.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/950b1d6c61567a1da227/maintainability)](https://codeclimate.com/github/bcgov/common-hosted-form-service/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/950b1d6c61567a1da227/test_coverage)](https://codeclimate.com/github/bcgov/common-hosted-form-service/test_coverage)

Create, edit and publish forms.

## Directory Structure

    .github/                   - PR and Issue templates
    app/                       - Application Root
    ├── frontend/              - Frontend Root
    │   ├── src/               - Vue.js frontend web application
    │   └── tests/             - Vue.js frontend web application tests
    ├── src/                   - Node.js backend web application
    │   ├── db/migrations      - data migration scripts
    │   ├── docs/              - OpenAPI 3.0 Specification
    │   └── forms/             - Models, Controllers, Routes for the forms
    └── tests/                 - Node.js backend web application tests
    components/                - Form.io Custom Components Library
    openshift/                 - OpenShift-deployment and shared pipeline files
    tests/                     - External test frameworks
    ├── functional/            - Supporting functional tests
    │   └── cypress/           - Cypress functional test suite
    └── load/                  - Supporting load tests
        └── load-test/         - Chefs API load test suite
    CODE-OF-CONDUCT.md         - Code of Conduct
    COMPLIANCE.yaml            - BCGov PIA/STRA compliance status
    CONTRIBUTING.md            - Contributing Guidelines
    Jenkinsfile                - Top-level Pipeline
    Jenkinsfile.cicd           - Pull-Request Pipeline
    LICENSE                    - License
    vetur.config.js            - Vetur configuration
    SECURITY.md                - Security Policy and Reporting

## Documentation

* [Application Readme](app/README.md)
* [Frontend Readme](app/frontend/README.md)
* [Openshift Readme](openshift/README.md)
* [Cypress Test Readme](tests/functional/cypress/README.md)
* [CHEFS Load Test Readme](tests/load/load-test/README.md)
* [Devops Tools Setup](https://github.com/bcgov/nr-showcase-devops-tools)
* [Security Reporting](SECURITY.md)
* [Product Roadmap](https://github.com/bcgov/common-hosted-form-service/wiki/Product-Roadmap)

## Getting Help or Reporting an Issue

To report bugs/issues/features requests, please file an [issue](https://github.com/bcgov/common-hosted-form-service/issues).

## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

    Copyright 2020 Province of British Columbia

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
