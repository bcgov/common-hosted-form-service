/* tslint:disable */
import { Components, Utils } from 'formiojs';
const ParentComponent = (Components as any).components.file;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';
import uniqueName = Utils.uniqueName;

const ID = 'simplefile';
const DISPLAY = 'File Upload';

export default class Component extends ParentComponent {
  static schema(...extend) {
    return ParentComponent.schema(
      {
        type: ID,
        label: DISPLAY,
        key: ID,
        storage: 'chefs',
        url: '/files',
        fileKey: 'files',
        fileNameTemplate: '{{fileName}}',
        image: false,
        webcam: false,
        webcamSize: 320,
        privateDownload: false,
        imageSize: '200',
        filePattern: '',
        fileMinSize: '0KB',
        fileMaxSize: '1GB',
        uploadOnly: false,
        customClass: 'formio-component-file',
      },
      ...extend
    );
  }

  public static readonly editForm = editForm;

  static get builderInfo() {
    return {
      title: DISPLAY,
      group: 'simple',
      icon: 'file',
      weight: 13,
      documentation: Constants.DEFAULT_HELP_LINK,
      schema: Component.schema(),
    };
  }

  // we will read these in from runtime
  private readonly _enabled: boolean;

  constructor(...args) {
    super(...args);
    if (this.options?.componentOptions) {
      // componentOptions are passed in from the viewer, basically runtime configuration
      const opts = this.options.componentOptions[ID];
      this.component.options = { ...this.component.options, ...opts };
      // the config.uploads object will say what size our server can handle and what path to use.
      if (opts?.config?.uploads) {
        const remSlash = (s) => s.replace(/^(\s*\/?\s*)$|^(\s*\/?\s*)$/gm, '');

        const cfg = opts.config;
        const uploads = cfg.uploads;

        this.component.fileMinSize = uploads.fileMinSize;
        this.component.fileMaxSize = uploads.fileMaxSize;
        // set the default url to be for uploads.
        this.component.url = `/${remSlash(cfg.basePath)}/${remSlash(
          cfg.apiPath
        )}/${remSlash(uploads.path)}`;
        // no idea what to do with this yet...
        this._enabled = uploads.enabled;
      }
    }
  }

  deleteFile(fileInfo) {
    const { options = {} } = this.component;
    if (fileInfo) {
      options.deleteFile(fileInfo);
    }
  }

  upload(files) {
    // Only allow one upload if not multiple.
    if (!this.component.multiple) {
      files = Array.prototype.slice.call(files, 0, 1);
    }
    if (this.component && files?.length) {
      // files is not really an array and does not have a forEach method, so fake it.
      Array.prototype.forEach.call(files, async (file) => {
        const fileName = uniqueName(
          file.name,
          this.component.fileNameTemplate,
          this.evalContext()
        );
        const fileUpload = {
          originalName: file.name,
          name: fileName,
          size: file.size,
          status: 'info',
          message: this.t('Starting upload'),
        };
        const fileNameLower = file.name.toLowerCase();
        const systemBlockedExtensions = [
          '.exe',
          '.bat',
          '.scr',
          '.com',
          '.pif',
          '.cmd',
          '.jar',
          '.app',
          '.deb',
          '.dmg',
          '.msi',
          '.run',
          '.bin',
          '.sh',
          '.ps1',
          '.vbs',
          '.js',
          '.html',
          '.php',
          '.py',
          '.rb',
        ];
        if (
          systemBlockedExtensions.some((ext) => fileNameLower.endsWith(ext))
        ) {
          fileUpload.status = 'error';
          fileUpload.message = this.t(
            'This file type is not supported for security reasons.'
          );
          this.statuses.push(fileUpload);
          this.redraw();
          return; // Stop processing this file immediately
        }

        // Check file pattern
        const pattern = this.component.filePattern ?? undefined;

        if (pattern && !this.validatePattern(file, pattern)) {
          fileUpload.status = 'error';
          fileUpload.message = this.t(
            'File type not allowed. Supported: {{ pattern }}',
            {
              pattern: this.component.filePattern,
            }
          );
        }

        // Check file minimum size
        if (
          this.component.fileMinSize &&
          !this.validateMinSize(file, this.component.fileMinSize)
        ) {
          fileUpload.status = 'error';
          fileUpload.message = this.t(
            'File is too small; it must be at least {{ size }}',
            {
              size: this.component.fileMinSize,
            }
          );
        }

        // Check file maximum size
        if (
          this.component.fileMaxSize &&
          !this.validateMaxSize(file, this.component.fileMaxSize)
        ) {
          fileUpload.status = 'error';
          fileUpload.message = this.t(
            'File is too big; it must be at most {{ size }}',
            {
              size: this.component.fileMaxSize,
            }
          );
        }

        // Get a unique name for this file to keep file collisions from occurring.
        const dir = this.interpolate(this.component.dir ?? '');
        const { fileService } = this;
        if (!fileService) {
          fileUpload.status = 'error';
          fileUpload.message = this.t('File Service not provided.');
        }

        this.statuses.push(fileUpload);
        this.redraw();

        if (fileUpload.status !== 'error') {
          if (this.component.privateDownload) {
            file.private = true;
          }
          const { options = {} } = this.component;
          const url = this.interpolate(this.component.url);

          const fileKey = this.component.fileKey ?? 'file';

          const blob = new Blob([file], { type: file.type });
          const fileFromBlob = new File([blob], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          });
          const formData = new FormData();
          const data = {
            [fileKey]: fileFromBlob,
            fileName,
            dir,
          };
          for (const key in data) {
            formData.append(key, data[key]);
          }
          options
            .uploadFile(formData, {
              onUploadProgress: (evt) => {
                fileUpload.status = 'progress';
                const p = (100.0 * evt.loaded) / evt.total;
                // @ts-ignore
                fileUpload.progress = p;
                delete fileUpload.message;
                this.redraw();
              },
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            .then((response) => {
              response.data = response.data ?? {};
              const index = this.statuses.indexOf(fileUpload);
              if (index !== -1) {
                this.statuses.splice(index, 1);
              }
              let fileInfo = {
                storage: 'chefs',
                name: response.data.originalname,
                originalName: '',
                url: `${url}/${response.data.id}`,
                size: response.data.size,
                type: response.data.mimetype,
                data: { id: response.data.id },
              };
              fileInfo.originalName = file.name;
              if (!this.hasValue()) {
                this.dataValue = [];
              }
              this.dataValue.push(fileInfo);
              this.redraw();
              this.triggerChange();
            })
            .catch((response) => {
              fileUpload.status = 'error';
              // we do not get API Problem objects, only http error
              // not much information to provide our users.
              let message = 'An unexpected error occured during file upload.';
              if (response.status === 409 || response.detail.includes('409')) {
                message = 'File did not pass the virus scanner.';
              } else if (
                response.status === 400 ||
                response.detail.includes('400')
              ) {
                message = 'File could not be uploaded.';
              }
              fileUpload.message = this.t(message);
              // @ts-ignore
              delete fileUpload.progress;
              this.redraw();
            });
        }
      });
    }
  }

  getFile(fileInfo) {
    const fileId = fileInfo?.data?.id ?? fileInfo.id;
    const { options = {} } = this.component;
    options.getFile(fileId, { responseType: 'blob' }).catch((response) => {
      // Is alert the best way to do this?
      // User is expecting an immediate notification due to attempting to download a file.
      alert(response);
    });
  }
}
