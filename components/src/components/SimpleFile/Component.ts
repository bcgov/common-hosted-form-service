/* tslint:disable */
import {Components, Utils} from 'formiojs';
const ParentComponent = (Components as any).components.file;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';
import uniqueName = Utils.uniqueName;

const ID = 'simplefile';
const DISPLAY = 'File Upload';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
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
            filePattern: '*',
            fileMinSize: '0KB',
            fileMaxSize: '1GB',
            uploadOnly: false,
            customClass: 'formio-component-file'
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'file',
            weight: 13,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }

    // we will read these in from runtime
    private _enabled: boolean;

    constructor(...args) {
        super(...args);
        try {
            if (this.options && this.options.componentOptions) {
                // componentOptions are passed in from the viewer, basically runtime configuration
                const opts = this.options.componentOptions[ID];
                this.component.options = {...this.component.options, ...opts};
                // the config.uploads object will say what size our server can handle and what path to use.
                if (opts.config && opts.config.uploads) {
                    const remSlash = (s) => s.replace(/^\s*\/*\s*|\s*\/*\s*$/gm, '');

                    const cfg = opts.config;
                    const uploads = cfg.uploads;

                    this.component.fileMinSize = uploads.fileMinSize;
                    this.component.fileMaxSize = uploads.fileMaxSize;
                    // set the default url to be for uploads.
                    this.component.url = `/${remSlash(cfg.basePath)}/${remSlash(cfg.apiPath)}/${remSlash(uploads.path)}`;
                    // no idea what to do with this yet...
                    this._enabled = uploads.enabled;
                }
            }
        } catch (e) {};
    }

    deleteFile(fileInfo) {
        const { options = {} } = this.component;
        const Provider = Formio.Providers.getProvider('storage', this.component.storage);
        if (Provider) {
            const provider = new Provider(this);
            if (fileInfo && provider && typeof provider.deleteFile === 'function') {
                provider.deleteFile(fileInfo, options)
            }
        }
    }

    upload(files) {
        // Only allow one upload if not multiple.
        if (!this.component.multiple) {
            files = Array.prototype.slice.call(files, 0, 1);
        }
        if (this.component.storage && files && files.length) {
            // files is not really an array and does not have a forEach method, so fake it.
            Array.prototype.forEach.call(files, (file) => {
                const fileName = uniqueName(file.name, this.component.fileNameTemplate, this.evalContext());
                const fileUpload = {
                    originalName: file.name,
                    name: fileName,
                    size: file.size,
                    status: 'info',
                    message: this.t('Starting upload'),
                };

                // Check file pattern
                if (this.component.filePattern && !this.validatePattern(file, this.component.filePattern)) {
                    fileUpload.status = 'error';
                    fileUpload.message = this.t('File is the wrong type; it must be {{ pattern }}', {
                        pattern: this.component.filePattern,
                    });
                }

                // Check file minimum size
                if (this.component.fileMinSize && !this.validateMinSize(file, this.component.fileMinSize)) {
                    fileUpload.status = 'error';
                    fileUpload.message = this.t('File is too small; it must be at least {{ size }}', {
                        size: this.component.fileMinSize,
                    });
                }

                // Check file maximum size
                if (this.component.fileMaxSize && !this.validateMaxSize(file, this.component.fileMaxSize)) {
                    fileUpload.status = 'error';
                    fileUpload.message = this.t('File is too big; it must be at most {{ size }}', {
                        size: this.component.fileMaxSize,
                    });
                }

                // Get a unique name for this file to keep file collisions from occurring.
                const dir = this.interpolate(this.component.dir || '');
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
                    const { storage, options = {} } = this.component;
                    const url = this.interpolate(this.component.url);
                    let groupKey = null;
                    let groupPermissions = null;

                    //Iterate through form components to find group resource if one exists
                    this.root.everyComponent((element) => {
                        if (element.component?.submissionAccess || element.component?.defaultPermission) {
                            groupPermissions = !element.component.submissionAccess ? [
                                {
                                    type: element.component.defaultPermission,
                                    roles: [],
                                },
                            ] : element.component.submissionAccess;

                            groupPermissions.forEach((permission) => {
                                groupKey = ['admin', 'write', 'create'].includes(permission.type) ? element.component.key : null;
                            });
                        }
                    });

                    const fileKey = this.component.fileKey || 'file';
                    const groupResourceId = groupKey ? this.currentForm.submission.data[groupKey]._id : null;
                    fileService.uploadFile(storage, file, fileName, dir, (evt) => {
                        fileUpload.status = 'progress';
                        // @ts-ignore
                        fileUpload.progress = parseInt(100.0 * evt.loaded / evt.total);
                        delete fileUpload.message;
                        this.redraw();
                    }, url, options, fileKey, groupPermissions, groupResourceId)
                        .then((fileInfo) => {
                            const index = this.statuses.indexOf(fileUpload);
                            if (index !== -1) {
                                this.statuses.splice(index, 1);
                            }
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
                            // grab the detail out our api-problem response.
                            fileUpload.message = response.detail;
                            // @ts-ignore
                            delete fileUpload.progress;
                            this.redraw();
                        });
                }
            });
        }
    }

    getFile(fileInfo) {
        const { options = {} } = this.component;
        const { fileService } = this;
        if (!fileService) {
            return alert('File Service not provided');
        }
        fileService.downloadFile(fileInfo, options)
        .catch((response) => {
            // Is alert the best way to do this?
            // User is expecting an immediate notification due to attempting to download a file.
            alert(response);
        });
    }
}
