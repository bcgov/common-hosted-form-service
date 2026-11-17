const http = require('node:http');
const { Readable } = require('node:stream');
const express = require('express');
const request = require('supertest');
const uuid = require('uuid');

const mockLog = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), verbose: jest.fn(), warn: jest.fn() };
jest.mock('../../../../src/components/log', () => () => mockLog);

const { expressHelper } = require('../../../common/helper');
const controller = require('../../../../src/forms/file/controller');
const storageService = require('../../../../src/forms/file/storage/storageService');

//
// controller.read against a real Express response and a real HTTP server.
// Only the object store (storageService.read) and the logger are stubbed.
//

const record = (overrides) => ({
  id: uuid.v4(),
  originalName: 'report.txt',
  mimeType: 'text/plain',
  size: 10,
  updatedAt: '2026-11-17T05:00:00.000Z',
  ...overrides,
});

// Browser uploads are stored as the latin1 reading of their UTF-8 bytes.
const storedBrowserName = (name) => Buffer.from(name, 'utf8').toString('latin1');

let currentRecord;
let currentResponse;
let arrived;
let readDone;

const router = express.Router();
router.get('/:fileId', (req, res, next) => {
  req.currentFileRecord = currentRecord;
  readDone = controller.read(req, res, next);
  return readDone;
});
// Runs the controller only once the client has gone away.
router.get('/after-close/:fileId', (req, res, next) => {
  req.currentFileRecord = currentRecord;
  readDone = new Promise((resolve) => res.once('close', () => resolve(controller.read(req, res, next))));
  arrived();
});
// Holds the response so a storage stub can wait for it to close.
router.get('/while-opening/:fileId', (req, res, next) => {
  req.currentFileRecord = currentRecord;
  currentResponse = res;
  readDone = controller.read(req, res, next);
  arrived();
  return readDone;
});
const app = expressHelper('/files', router);

let server;
let baseUrl;

beforeAll(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

const fileBody = () => Readable.from([Buffer.from('file-bytes')]);

const failingStream = (error, chunksFirst = []) => {
  const chunks = [...chunksFirst];
  return new Readable({
    read() {
      if (chunks.length) this.push(chunks.shift());
      else this.destroy(error);
    },
  });
};

const endlessStream = () =>
  new Readable({
    read() {
      setTimeout(() => this.push(Buffer.alloc(1024)), 1);
    },
  });

// Raw Content-Disposition bytes, read as UTF-8.
const rawDisposition = (path) =>
  new Promise((resolve, reject) => {
    http
      .get(`${baseUrl}${path}`, (res) => {
        const index = res.rawHeaders.findIndex((h) => h.toLowerCase() === 'content-disposition');
        res.resume();
        res.on('end', () => resolve(Buffer.from(res.rawHeaders[index + 1], 'latin1').toString('utf8')));
      })
      .on('error', reject);
  });

// Sends a request and drops it once the server has it.
const dropOnArrival = async (path) => {
  const hasArrived = new Promise((resolve) => {
    arrived = resolve;
  });
  const req = http.get(`${baseUrl}${path}`);
  req.on('error', () => {});
  await hasArrived;
  req.destroy();
};

describe('read', () => {
  it('streams the file with download headers', async () => {
    currentRecord = record();
    jest.spyOn(storageService, 'read').mockResolvedValue(fileBody());

    const response = await request(app).get(`/files/${currentRecord.id}`);

    expect(storageService.read).toBeCalledWith(currentRecord);
    expect(response.status).toBe(200);
    expect(response.text).toBe('file-bytes');
    expect(response.headers['content-disposition']).toBe('attachment; filename="report.txt"');
    expect(response.headers['content-type']).toMatch(/^text\/plain/);
    expect(response.headers['content-length']).toBe('10');
    expect(response.headers['last-modified']).toBe('Tue, 17 Nov 2026 05:00:00 GMT');
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('quotes a name with spaces, commas and semicolons', async () => {
    currentRecord = record({ originalName: 'my report, v2; final.txt' });
    jest.spyOn(storageService, 'read').mockResolvedValue(fileBody());

    const response = await request(app).get(`/files/${currentRecord.id}`);

    expect(response.headers['content-disposition']).toBe('attachment; filename="my report, v2; final.txt"');
  });

  it('sends a browser-uploaded non-ASCII name as its original UTF-8 bytes', async () => {
    const name = 'r\u00e9sum\u00e9 \u4e2d\u6587 It\u2019s.pdf';
    currentRecord = record({ originalName: storedBrowserName(name) });
    jest.spyOn(storageService, 'read').mockResolvedValue(fileBody());

    expect(await rawDisposition(`/files/${currentRecord.id}`)).toBe(`attachment; filename="${name}"`);
  });

  it('sends a name with characters beyond latin1 with an ASCII fallback and an RFC 5987 filename*', async () => {
    currentRecord = record({ originalName: '\u4e2d.pdf' });
    jest.spyOn(storageService, 'read').mockResolvedValue(fileBody());

    const response = await request(app).get(`/files/${currentRecord.id}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toBe(`attachment; filename="?.pdf"; filename*=UTF-8''%E4%B8%AD.pdf`);
    expect(response.headers['content-type']).toMatch(/^text\/plain/);
  });

  it('replaces quotes and backslashes and drops control characters in the name', async () => {
    currentRecord = record({ originalName: 'a"b\\c\r\nX-Injected: 1\t.txt' });
    jest.spyOn(storageService, 'read').mockResolvedValue(fileBody());

    const response = await request(app).get(`/files/${currentRecord.id}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toBe('attachment; filename="a_b_cX-Injected: 1.txt"');
  });

  it('sends a file with no stored type as application/octet-stream', async () => {
    currentRecord = record({ mimeType: null });
    jest.spyOn(storageService, 'read').mockResolvedValue(fileBody());

    const response = await request(app).get(`/files/${currentRecord.id}`);

    expect(response.headers['content-type']).toBe('application/octet-stream');
  });

  it('uses the creation time when there is no update time, and omits Last-Modified when there is neither', async () => {
    currentRecord = record({ updatedAt: null, createdAt: '2026-11-16T01:02:03.000Z' });
    jest.spyOn(storageService, 'read').mockImplementation(async () => fileBody());

    const created = await request(app).get(`/files/${currentRecord.id}`);
    currentRecord = record({ updatedAt: null });
    const neither = await request(app).get(`/files/${currentRecord.id}`);

    expect(created.headers['last-modified']).toBe('Mon, 16 Nov 2026 01:02:03 GMT');
    expect(neither.status).toBe(200);
    expect(neither.headers['last-modified']).toBeUndefined();
  });

  it('passes a storage open error on', async () => {
    currentRecord = record();
    jest.spyOn(storageService, 'read').mockRejectedValue(new Error('no such key'));

    const response = await request(app).get(`/files/${currentRecord.id}`);

    expect(response.status).toBe(500);
    expect(response.headers['content-disposition']).toBeUndefined();
  });

  it('502s and logs when storage has no file', async () => {
    currentRecord = record();
    jest.spyOn(storageService, 'read').mockResolvedValue(undefined);

    const response = await request(app).get(`/files/${currentRecord.id}`);

    expect(response.status).toBe(502);
    expect(response.headers['content-disposition']).toBeUndefined();
    expect(mockLog.warn).toBeCalledWith('File not found in storage', { fileId: currentRecord.id });
  });

  it('502s and logs, without download headers, when storage fails before any byte', async () => {
    currentRecord = record();
    jest.spyOn(storageService, 'read').mockResolvedValue(failingStream(new Error('storage reset')));

    const response = await request(app).get(`/files/${currentRecord.id}`);

    expect(response.status).toBe(502);
    expect(response.body.detail).toBe('Unable to read the file from storage.');
    expect(response.headers['content-disposition']).toBeUndefined();
    expect(response.headers['cache-control']).toBeUndefined();
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(mockLog.warn).toBeCalledWith('File could not be read from storage', { fileId: currentRecord.id, error: 'storage reset' });
  });

  it('cuts the response off and logs when storage fails part way', async () => {
    currentRecord = record();
    jest.spyOn(storageService, 'read').mockResolvedValue(failingStream(new Error('storage reset'), [Buffer.from('abc')]));

    const received = await new Promise((resolve) => {
      const chunks = [];
      const req = http.get(`${baseUrl}/files/${currentRecord.id}`, (res) => {
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('close', () => resolve({ status: res.statusCode, complete: res.complete, body: Buffer.concat(chunks).toString() }));
      });
      req.on('error', () => resolve({ status: undefined, complete: false, body: Buffer.concat(chunks).toString() }));
    });
    await readDone;

    expect(received.complete).toBe(false);
    expect(received.body).toBe('abc');
    expect(mockLog.warn).toBeCalledWith('File download did not complete', { fileId: currentRecord.id, error: 'storage reset' });
  });

  it('stops reading from storage when the client goes away part way', async () => {
    currentRecord = record({ size: 1000000 });
    const source = endlessStream();
    jest.spyOn(storageService, 'read').mockResolvedValue(source);
    const closed = new Promise((resolve) => source.once('close', resolve));

    const req = http.get(`${baseUrl}/files/${currentRecord.id}`, (res) => {
      res.once('data', () => req.destroy());
    });
    req.on('error', () => {});
    await closed;
    await readDone;

    expect(source.destroyed).toBe(true);
  });

  it('does not read storage when the client has gone away before the download starts', async () => {
    currentRecord = record();
    jest.spyOn(storageService, 'read').mockResolvedValue(fileBody());

    await dropOnArrival(`/files/after-close/${currentRecord.id}`);
    await readDone;

    expect(storageService.read).not.toBeCalled();
  });

  it('closes the file when the client goes away while storage opens it', async () => {
    currentRecord = record();
    const source = endlessStream();
    jest.spyOn(storageService, 'read').mockImplementation(() => new Promise((resolve) => currentResponse.once('close', () => resolve(source))));

    await dropOnArrival(`/files/while-opening/${currentRecord.id}`);
    await readDone;

    expect(source.destroyed).toBe(true);
  });
});
