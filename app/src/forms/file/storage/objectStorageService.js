const { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const config = require('config');
const fs = require('fs-extra');
const mime = require('mime-types');
const path = require('path');
const { Readable } = require('stream');

const StorageTypes = require('../../common/constants').StorageTypes;
const errorToProblem = require('../../../components/errorToProblem');
const log = require('../../../components/log')(module.filename);

const fileUpload = require('../middleware/upload').fileUpload;

// The AWS SDK requires a region, even though it isn't used.
const DUMMY_REGION = 'ca-west-1';
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
    this._s3 = new S3Client({
      credentials: {
        accessKeyId: this._accessKeyId,
        secretAccessKey: this._secretAccessKey,
      },
      endpoint: this._endpoint,
      forcePathStyle: true,
      params: {
        Bucket: this._bucket,
      },
      region: DUMMY_REGION,
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

  /**
   * Gets the contents of a file from the local filesystem. Will error if the
   * requested file is not in the allowed file uploads directory.
   *
   * @param {string} filename the filename of the file to be read.
   * @returns a Buffer containing the file contents.
   * @throws an Error if the filename is not within the allowed directory.
   */
  _readLocalFile(filename) {
    let fileUploadsDir = fileUpload.getFileUploadsDir();
    if (!fileUploadsDir.endsWith('/')) {
      fileUploadsDir += '/';
    }

    const resolvedFilename = fs.realpathSync(path.resolve(fileUploadsDir, filename));
    if (!resolvedFilename.startsWith(fileUploadsDir)) {
      throw new Error(`Invalid path '${filename}'`);
    }

    return fs.readFileSync(resolvedFilename);
  }

  async uploadFile(fileStorage) {
    try {
      const fileContent = this._readLocalFile(fileStorage.path);

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

      await this._s3.send(new PutObjectCommand(params));

      return {
        path: params.Key,
        storage: StorageTypes.OBJECT_STORAGE,
      };
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

      return await this._s3.send(new DeleteObjectCommand(params));
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

      const response = await this._s3.send(new GetObjectCommand(params));

      return Readable.from(response.Body);
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

        await this._s3.send(new DeleteObjectCommand(params));

        return newPath;
      }
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }

  async copyFile(fileStorage, ...subdirs) {
    try {
      const key = this._join(this._key, ...subdirs, fileStorage.id);

      const params = {
        Bucket: this._bucket,
        CopySource: `${this._bucket}/${fileStorage.path}`,
        Key: key,
      };

      return await this._s3.send(new CopyObjectCommand(params));
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
