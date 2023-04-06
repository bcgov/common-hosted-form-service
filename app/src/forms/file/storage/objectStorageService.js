const config = require('config');
const fs = require('fs-extra');
const mime = require('mime-types');
const path = require('path');
const Problem = require('api-problem');
const S3 = require('aws-sdk/clients/s3');

const StorageTypes = require('../../common/constants').StorageTypes;
const errorToProblem = require('../../../components/errorToProblem');
const log = require('../../../components/log')(module.filename);

const SERVICE = 'ObjectStorage';
const TEMP_DIR = 'uploads';
const Delimiter = '/';

class ObjectStorageService {
  constructor({ endpoint, bucket, key, accessKeyId, secretAccessKey }) {
    log.debug(`Constructed with ${endpoint}, ${bucket}, ${key}, ${accessKeyId}, secretAccessKey`, { function: 'constructor' });
    if (!endpoint || !bucket || !key || !accessKeyId || !secretAccessKey) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error('ObjectStorageService is not configured. Check configuration.');
    }
    this._endpoint = endpoint;
    this._bucket = bucket;
    this._key = this._delimit(key);
    this._accessKeyId = accessKeyId;
    this._secretAccessKey = secretAccessKey;
    this._s3 = new S3({
      endpoint: this._endpoint,
      accessKeyId: this._accessKeyId,
      secretAccessKey: this._secretAccessKey,
      s3ForcePathStyle: true,
      params: {
        Bucket: this._bucket,
      },
    });
  }

  _join(...items) {
    if (items && items.length) {
      const parts = [];
      items.map((p) => {
        if (p) {
          p.split('/').map((x) => {
            if (x && x.trim().length) parts.push(x);
          });
        }
      });
      return parts.join(Delimiter);
    }
    return '';
  }

  _delimit(s) {
    if (s) {
      return s.endsWith(Delimiter) ? s : `${s}${Delimiter}`;
    }
    return '';
  }

  async uploadFile(fileStorage) {
    try {
      const fileContent = fs.readFileSync(fileStorage.path);

      // uploads can go to a 'holding' area, we can shuffle it later if we want to.
      const key = this._join(this._key, TEMP_DIR, fileStorage.id);

      const params = {
        Bucket: this._bucket,
        Key: key,
        Body: fileContent,
        Metadata: {
          name: fileStorage.originalName,
          id: fileStorage.id,
        },
      };

      if (mime.contentType(path.extname(fileStorage.originalName))) {
        params.ContentType = mime.contentType(path.extname(fileStorage.originalName));
      }

      return new Promise((resolve, reject) => {
        // eslint-disable-next-line no-unused-vars
        this._s3.upload(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              path: data.Key,
              storage: StorageTypes.OBJECT_STORAGE,
            });
          }
        });
      });
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }

  async delete(fileStorage) {
    try {
      const params = {
        Bucket: this._bucket,
        Key: fileStorage.path,
      };
      return new Promise((resolve, reject) => {
        this._s3.deleteObject(params, (err, data) => {
          if (err) {
            // doesn't throw a 404 when given a bad key
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }

  async read(fileStorage) {
    try {
      const params = {
        Bucket: this._bucket,
        Key: fileStorage.path,
      };
      return new Promise((resolve, reject) => {
        const _local_s3 = this._s3;
        // eslint-disable-next-line
        _local_s3.headObject(params, function (err, data) {
          if (err) {
            if (404 === err.statusCode) {
              reject(new Problem(404, 'File not found'));
            } else {
              reject(err);
            }
          } else {
            // want to return the stream...
            resolve(_local_s3.getObject(params).createReadStream());
          }
        });
      });
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }

  async move(fileStorage, ...subdirs) {
    try {
      const sourcePath = fileStorage.path;
      const file = await this.copyFile(fileStorage, ...subdirs);
      if (file) {
        // this doesn't return the new key/path, but we can build it
        const newPath = this._join(this._key, ...subdirs, fileStorage.id);
        // now delete original...
        const params = {
          Bucket: this._bucket,
          Key: sourcePath,
        };

        return new Promise((resolve, reject) => {
          // eslint-disable-next-line no-unused-vars
          this._s3.deleteObject(params, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(newPath);
            }
          });
        });
      }
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }

  async copyFile(fileStorage, ...subdirs) {
    try {
      const destPath = this._join(...subdirs);

      const params = {
        Bucket: `${this._bucket}/${this._key}${destPath}`,
        CopySource: `${this._bucket}/${fileStorage.path}`,
        Key: fileStorage.id,
      };

      return new Promise((resolve, reject) => {
        // eslint-disable-next-line no-unused-vars
        this._s3.copyObject(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }
}

const endpoint = config.get('files.objectStorage.endpoint');
const bucket = config.get('files.objectStorage.bucket');
const key = config.get('files.objectStorage.key');
const accessKeyId = config.get('files.objectStorage.accessKeyId');
const secretAccessKey = config.get('files.objectStorage.secretAccessKey');

let objectStorageService = new ObjectStorageService({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  endpoint: endpoint,
  bucket: bucket,
  key: key,
});
module.exports = objectStorageService;
