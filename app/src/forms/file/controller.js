const Problem = require('api-problem');

const log = require('../../components/log')(module.filename);
const service = require('./service');
const storageService = require('./storage/storageService');

const { StorageTypes } = require('../common/constants');

const DOWNLOAD_HEADERS = ['Cache-Control', 'Content-Disposition', 'Content-Length', 'Content-Type', 'Last-Modified', 'X-Content-Type-Options'];
const READ_FAILED = 'Unable to read the file from storage.';

const _trim = (r) => {
  if (r) {
    // don't want storage information going over the wire...
    return {
      id: r.id,
      originalName: r.originalName,
      size: r.size,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
    };
  }
  return r;
};

// Clears the download headers so an error response is not sent with the
// file's length, type or name.
const clearDownloadHeaders = (res) => {
  for (const header of DOWNLOAD_HEADERS) res.removeHeader(header);
};

// Sets Content-Disposition for a stored file name. Browser uploads are stored
// as the latin1 reading of their UTF-8 bytes, so a name made only of latin1
// characters is sent byte for byte in a quoted string and clients get the
// bytes that were uploaded. Control characters are dropped and a quote or
// backslash becomes an underscore, so the name cannot end the quoted string
// or the header. A name with characters beyond latin1 cannot be sent as raw
// bytes; res.attachment sends it with an ASCII fallback and an RFC 5987
// filename*.
const setAttachment = (res, name) => {
  const chars = Array.from(name);
  if (chars.some((ch) => ch.codePointAt(0) > 0xff)) {
    res.attachment(name);
    return;
  }

  const quoted = chars
    .filter((ch) => {
      const code = ch.codePointAt(0);
      return code >= 0x20 && code !== 0x7f;
    })
    .map((ch) => (ch === '"' || ch === '\\' ? '_' : ch))
    .join('');
  res.set('Content-Disposition', `attachment; filename="${quoted}"`);
};

// An HTTP date for a stored timestamp, or undefined when there is none.
const httpDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toUTCString();
};

// Pipes the stored file to the response. Resolves when the response finishes
// or closes, and rejects on a storage stream error. The response is left open
// on error so the caller can still answer. A response that closes while
// piping (the client went away) stops the storage read; the caller checks for
// a response that closed before this is called.
const sendStream = (stream, res) =>
  new Promise((resolve, reject) => {
    stream.on('error', reject);
    res.once('finish', resolve);
    res.once('close', () => {
      stream.destroy();
      resolve();
    });
    stream.pipe(res);
  });

module.exports = {
  create: async (req, res, next, formId = null) => {
    try {
      const response = await service.create(req.file, req.currentUser, StorageTypes.UPLOADS, { formId });
      res.status(201).json(_trim(response));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Streams the file in req.currentFileRecord (permissions are checked by the
   * route). The stored name and type are client-supplied: the name is quoted
   * (see setAttachment), and nosniff stops browsers second-guessing the type.
   * Storage that has no file, or fails before any byte is sent, is a logged
   * 502; a failure after that cuts the response off and is logged. Errors
   * opening the file are passed on. If the client has gone away, storage is
   * not read, or the opened file is closed again.
   */
  read: async (req, res, next) => {
    const fileStorage = req.currentFileRecord;
    if (res.destroyed) return undefined;

    let stream;
    try {
      stream = await storageService.read(fileStorage);
    } catch (error) {
      return next(error);
    }

    if (!stream) {
      log.warn('File not found in storage', { fileId: fileStorage.id });
      return next(new Problem(502, { detail: READ_FAILED }));
    }

    if (res.destroyed) {
      stream.destroy?.();
      return undefined;
    }

    try {
      setAttachment(res, fileStorage.originalName || fileStorage.id);
      res.set('Content-Type', fileStorage.mimeType || 'application/octet-stream');
      res.set('Content-Length', fileStorage.size);
      const lastModified = httpDate(fileStorage.updatedAt || fileStorage.createdAt);
      if (lastModified) res.set('Last-Modified', lastModified);
      res.set('Cache-Control', 'private, no-store');
      res.set('X-Content-Type-Options', 'nosniff');
    } catch (error) {
      stream.destroy?.();
      clearDownloadHeaders(res);
      return next(error);
    }

    try {
      await sendStream(stream, res);
    } catch (error) {
      if (res.headersSent) {
        log.warn('File download did not complete', { fileId: fileStorage.id, error: error.message });
        res.destroy();
        return undefined;
      }
      log.warn('File could not be read from storage', { fileId: fileStorage.id, error: error.message });
      clearDownloadHeaders(res);
      return next(new Problem(502, { detail: READ_FAILED }));
    }
    return undefined;
  },

  delete: async (req, res, next) => {
    try {
      // Permissions checked on this at the route level with middleware
      // ok, let's remove the file...
      await service.delete(req.params.fileId);
      res.sendStatus(202);
    } catch (error) {
      next(error);
    }
  },
};
