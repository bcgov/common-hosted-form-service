const bytes = require('bytes');
const config = require('config');
const jwt = require('jsonwebtoken');
const log = require('npmlog');
const unirest = require('unirest');

const { performance } = require('perf_hooks');

log.level = config.get('logLevel');
log.addLevel('debug', 1500, { fg: 'cyan' });

const printObj = (o) => {
  if (log.levels[log.level] < log.levels['info']) {
    console.log(o); // eslint-disable-line no-console
  }
};

const formName = () => {
  const name = config.get('submissions.name');
  return `${name} - ${new Date().toISOString()} - (${config.get(
    'submissions.count'
  )})`;
};

const schemaTemplate = () => {
  return require(`./schemas/${config.get('submissions.schema')}_schema.json`);
};

const submissionTemplate = () => {
  return require(`./submissions/${config.get(
    'submissions.schema'
  )}_submission.json`);
};

const tokenExpired = (token) => {
  let expired = true;
  if (token) {
    expired = false;
    const decoded = jwt.decode(token);
    const now = Date.now().valueOf() / 1000;
    if (typeof decoded.exp !== 'undefined' && decoded.exp < now) {
      expired = true;
    }
    if (typeof decoded.nbf !== 'undefined' && decoded.nbf > now) {
      expired = true;
    }
  }
  return expired;
};

const parseOk = (start, res) => {
  const finish = performance.now();
  const elapsedMs = finish - start;
  let size = 0;
  let json = {};
  try {
    json = res.body;
  } catch (e) {
    log.error(`Error getting json body of response: ${e.message}`);
  }
  try {
    size = Buffer.from(JSON.stringify(json), 'utf8').length;
  } catch (e) {
    log.error(`Error calculating size of response: ${e.message}`);
  }
  return {
    metrics: {
      elapsedMs: elapsedMs,
      size: size,
    },
    json: res.body,
  };
};

const getToken = async () => {
  log.debug('===========> getToken');
  const auth = config.get('auth');

  return new Promise((resolve, reject) => {
    const endpoint = `${auth.host}/realms/${auth.realm}/protocol/openid-connect/token`;
    const start = performance.now();
    unirest('POST', endpoint)
      .headers({
        'Content-Type': 'application/x-www-form-urlencoded',
      })
      .send('grant_type=password')
      .send(`client_id=${auth.clientId}`)
      .send(`username=${auth.username}`)
      .send(`password=${auth.password}`)
      .end(function (res) {
        if (res.error) {
          log.debug(`Failure in getToken for POST "${endpoint}": ` + res.error);
          reject(new Error(res.error));
        } else {
          const result = parseOk(start, res);
          log.debug('>', result);
          resolve({
            ...result.metrics,
            accessToken: result.json.access_token,
          });
        }
      });
  });
};

const apiPath = () => {
  const t = (s) => s.replace(/^\s*\/*\s*|\s*\/*\s*$/gm, '');
  const api = config.get('api');
  return `${t(api.host)}/${t(api.basePath)}/${t(api.apiPath)}`;
};

const createForm = async (token, schema) => {
  log.debug('===========> createForm');
  return new Promise((resolve, reject) => {
    log.info(`creating form ${formName()}`);
    const form = {
      name: formName(),
      description: 'Load testing',
      schema: schema,
    };
    // send it...
    const start = performance.now();
    unirest('POST', `${apiPath()}/forms`)
      .headers({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .send(form)
      .end(function (res) {
        if (res.error) {
          reject(new Error(res.error));
        } else {
          const result = parseOk(start, res);
          log.debug('>', result);
          resolve({
            ...result.metrics,
            formId: result.json.id,
            formDraftId: result.json.draft.id,
          });
        }
      });
  });
};

const publish = async (token, formId, formVersionId) => {
  log.debug('===========> publish');
  return new Promise((resolve, reject) => {
    const endpoint = `${apiPath()}/forms/${formId}/drafts/${formVersionId}/publish`;
    const start = performance.now();
    // send it...
    unirest('POST', endpoint)
      .headers({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .end(function (res) {
        if (res.error) {
          log.debug(`Failure in publish for POST "${endpoint}": ` + res.error);
          reject(new Error(res.error));
        } else {
          const result = parseOk(start, res);
          log.debug('>', result);
          resolve({
            ...result.metrics,
            formId: result.json.formId,
            formVersionId: result.json.id,
          });
        }
      });
  });
};

const createSubmission = async (token, formId, formVersionId, submission) => {
  log.debug('===========> createSubmission');
  return new Promise((resolve, reject) => {
    const endpoint = `${apiPath()}/forms/${formId}/versions/${formVersionId}/submissions`;
    const start = performance.now();
    // send it...
    unirest('POST', endpoint)
      .headers({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .send(submission)
      .end(function (res) {
        if (res.error) {
          log.debug(
            `Failure in createSubmission for POST "${endpoint}": ` + res.error
          );
          reject(new Error(res.error));
        } else {
          const result = parseOk(start, res);
          log.debug('>', result);
          resolve(result.metrics);
        }
      });
  });
};

const getSubmissions = async (token, formId) => {
  log.debug('===========> getSubmissions');
  return new Promise((resolve, reject) => {
    const endpoint = `${apiPath()}/forms/${formId}/submissions`;
    const start = performance.now();
    unirest('GET', endpoint)
      .headers({
        Authorization: `Bearer ${token}`,
      })
      .end(function (res) {
        if (res.error) {
          log.debug(
            `Failure in getSubmissions for GET "${endpoint}": ` + res.error
          );
          reject(new Error(res.error));
        } else {
          const result = parseOk(start, res);
          log.debug('>', result);
          resolve(result.metrics);
        }
      });
  });
};

const exportSubmissions = async (token, formId) => {
  log.debug('===========> exportSubmissions');
  return new Promise((resolve, reject) => {
    const endpoint = `${apiPath()}/forms/${formId}/export?format=json&type=submissions`;
    const start = performance.now();
    unirest('GET', endpoint)
      .headers({
        Authorization: `Bearer ${token}`,
      })
      .end(function (res) {
        if (res.error) {
          log.debug(
            `Failure in exportSubmissions for GET "${endpoint}": ` + res.error
          );
          reject(new Error(res.error));
        } else {
          const result = parseOk(start, res);
          log.debug('>', result);
          resolve(result.metrics);
        }
      });
  });
};

const loadSubmissions = async (
  token,
  formId,
  formVersionId,
  submission,
  count = 1
) => {
  const pad = (n) => n.toString().padStart(count.toString().length, ' ');

  try {
    let accessToken = token;
    const results = [];
    for (let i = 0; i < count; i++) {
      log.verbose(`${pad(i + 1)}/${count}`);
      try {
        if (tokenExpired(accessToken)) {
          log.debug('token expired, get new token.');
          const tokenResult = await getToken();
          accessToken = tokenResult.accessToken;
        }
        const result = await createSubmission(
          accessToken,
          formId,
          formVersionId,
          submission
        );
        log.verbose(`${pad('')} ${result.elapsedMs} ms`);
        results.push(result);
      } catch (e) {
        log.error(e.message);
      }
    }
    return results;
  } catch (e) {
    log.error(e);
  }
};

const fetchSubmissions = async (token, formId) => {
  log.debug('===========> fetchSubmissions');
  try {
    let accessToken = token;
    if (tokenExpired(accessToken)) {
      console.log('token expired, get new token.'); // eslint-disable-line no-console
      const tokenResult = await getToken();
      accessToken = tokenResult.accessToken;
    }
    const getResult = await getSubmissions(accessToken, formId);
    const exportResult = await exportSubmissions(accessToken, formId);
    return {
      getResults: getResult,
      exportResults: exportResult,
    };
  } catch (e) {
    log.error(e.message);
  }
};

const printStats = (
  createFormResult,
  createSubmissionResult,
  fetchSubmissionResult
) => {
  const padLabel = (s) => s.padEnd(34, ' ');
  const padMs = (n) => Math.ceil(n).toString().padStart(10, ' ');
  const padBytes = (n) => bytes(n, { unit: 'kb' }).padStart(12, ' ');

  log.info('');
  log.info(
    '=============================================================================='
  );
  log.info(`             API: ${apiPath()}`);
  log.info(`            User: ${config.get('auth.username')}`);
  log.info(`            Form: ${formName()}`);
  log.info(`Submission Count: ${config.get('submissions.count')}`);
  log.info(
    '=============================================================================='
  );
  log.info('');
  try {
    log.info(
      `${padLabel('Create Form ElapsedMS')}: ${padMs(
        createFormResult.elapsedMs
      )}`
    );
  } catch (e) {
    log.error(`${padLabel('Create Form Error')}: ${e.message}`);
  }
  log.info('');
  try {
    const submissionsMs = createSubmissionResult.map((x) => x.elapsedMs);
    const minMs = Math.min(...submissionsMs);
    const maxMs = Math.max(...submissionsMs);
    const avgMs = submissionsMs.reduce((a, b) => a + b) / submissionsMs.length;
    log.info(
      `${padLabel('Create Submissions (Avg) ElapsedMS')}: ${padMs(avgMs)}`
    );
    log.info(
      `${padLabel('Create Submissions (Min) ElapsedMS')}: ${padMs(minMs)}`
    );
    log.info(
      `${padLabel('Create Submissions (Max) ElapsedMS')}: ${padMs(maxMs)}`
    );
  } catch (e) {
    log.error(`${padLabel('Create Submissions Error')}: ${e.message}`);
  }
  log.info('');
  try {
    log.info(
      `${padLabel('Get Submissions ElapsedMS')}: ${padMs(
        fetchSubmissionResult.getResults.elapsedMs
      )}`
    );
    log.info(
      `${padLabel('Export Submissions ElapsedMS')}: ${padMs(
        fetchSubmissionResult.exportResults.elapsedMs
      )}`
    );
    log.info('');
    log.info(
      `${padLabel('Get Submissions Size')}: ${padBytes(
        fetchSubmissionResult.getResults.size
      )}`
    );
    log.info(
      `${padLabel('Export Submissions Size')}: ${padBytes(
        fetchSubmissionResult.exportResults.size
      )}`
    );
  } catch (e) {
    log.error(`${padLabel('Get/Export Submissions Error')}: ${e.message}`);
  }
  log.info('');
  log.info(
    '=============================================================================='
  );
  log.info('');
};

const main = () => {
  (async () => {
    try {
      // Error out first, if we don't have a schema or submission template
      const formSchema = schemaTemplate();
      const formSubmission = submissionTemplate();

      const tokenResult = await getToken();
      printObj(tokenResult);

      const formResult = await createForm(tokenResult.accessToken, formSchema);
      printObj(formResult);

      const publishResult = await publish(
        tokenResult.accessToken,
        formResult.formId,
        formResult.formDraftId
      );
      printObj(publishResult);

      const submissionResults = await loadSubmissions(
        tokenResult.accessToken,
        publishResult.formId,
        publishResult.formVersionId,
        formSubmission,
        config.get('submissions.count')
      );
      printObj(submissionResults);

      const fetchResults = await fetchSubmissions(
        tokenResult.accessToken,
        formResult.formId
      );

      printStats(formResult, submissionResults, fetchResults);
    } catch (exception) {
      log.error('Failed', exception);
    }
  })();
};

main();
