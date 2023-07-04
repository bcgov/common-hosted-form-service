/* tslint:disable */
import NativePromise from 'native-promise-only';
var chefs = function (formio) {
    var addHeaders = function (xhr, options) {
        if (options) {
            if (options.headers) {
                Object.keys(options.headers).forEach(function (k) {
                    var v = options.headers[k];
                    xhr.setRequestHeader(k, v);
                });
            }
            // Allow manual setting of any supplied headers above, but need to get the latest
            // token from the containing app to deal with expiries and override auth
            if (options.chefsToken) {
                xhr.setRequestHeader('Authorization', options.chefsToken());
            }
        }
    };
    var xhrRequest = function (url, name, query, data, options, onprogress) {
        return new NativePromise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var json = (typeof data === 'string');
            var fd = new FormData();
            if (typeof onprogress === 'function') {
                xhr.upload.onprogress = onprogress;
            }
            if (!json) {
                for (var key in data) {
                    fd.append(key, data[key]);
                }
            }
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Need to test if xhr.response is decoded or not.
                    var respData = {};
                    try {
                        respData = (typeof xhr.response === 'string') ? JSON.parse(xhr.response) : {};
                        // @ts-ignore
                        respData = (respData && respData.data) ? respData.data : respData;
                    }
                    catch (err) {
                        respData = {};
                    }
                    // Get the url of the file.
                    // @ts-ignore
                    var respUrl = respData.hasOwnProperty('url') ? respData.url : "".concat(xhr.responseURL, "/").concat(name);
                    // If they provide relative url, then prepend the url.
                    if (respUrl && respUrl[0] === '/') {
                        respUrl = "".concat(url).concat(respUrl);
                    }
                    resolve({ url: respUrl, data: respData });
                }
                else {
                    reject(xhr.response || 'Unable to upload file');
                }
            };
            xhr.onerror = function () { return reject(xhr); };
            xhr.onabort = function () { return reject(xhr); };
            var requestUrl = url + (url.indexOf('?') > -1 ? '&' : '?');
            for (var key in query) {
                requestUrl += "".concat(key, "=").concat(query[key], "&");
            }
            if (requestUrl[requestUrl.length - 1] === '&') {
                requestUrl = requestUrl.substr(0, requestUrl.length - 1);
            }
            xhr.open('POST', requestUrl);
            if (json) {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }
            var token = formio.getToken();
            if (token) {
                xhr.setRequestHeader('x-jwt-token', token);
            }
            addHeaders(xhr, options);
            //Overrides previous request props
            if (options) {
                var parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
                for (var prop in parsedOptions) {
                    xhr[prop] = parsedOptions[prop];
                }
            }
            xhr.send(json ? data : fd);
        });
    };
    return {
        title: 'CHEFS',
        name: 'chefs',
        uploadFile: function (file, name, dir, progressCallback, url, options, fileKey) {
            var uploadRequest = function (form) {
                var _a;
                return xhrRequest(url, name, {}, (_a = {},
                    _a[fileKey] = file,
                    _a.name = name,
                    _a.dir = dir,
                    _a), options, progressCallback).then(function (response) {
                    response.data = response.data || {};
                    return {
                        storage: 'chefs',
                        name: response.data.originalname,
                        url: "".concat(url, "/").concat(response.data.id),
                        size: response.data.size,
                        type: response.data.mimetype,
                        data: { id: response.data.id }
                    };
                });
            };
            if (file.private && formio.formId) {
                return formio.loadForm().then(function (form) { return uploadRequest(form); });
            }
            else {
                // @ts-ignore
                return uploadRequest();
            }
        },
        deleteFile: function (fileInfo, options) {
            return new NativePromise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('DELETE', fileInfo.url, true);
                addHeaders(xhr, options);
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve('File deleted');
                    }
                    else {
                        reject(xhr.response || 'Unable to delete file');
                    }
                };
                xhr.send(null);
            });
        },
        downloadFile: function (file, options) {
            return new NativePromise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', file.url, true);
                addHeaders(xhr, options);
                xhr.responseType = 'blob';
                xhr.onload = function (event) {
                    var blob = xhr.response;
                    var fileName;
                    var contentType = xhr.getResponseHeader('content-type');
                    // IE/EDGE doesn't send all response headers
                    if (xhr.getResponseHeader('content-disposition')) {
                        var contentDisposition = xhr.getResponseHeader('content-disposition');
                        fileName = contentDisposition.substring(contentDisposition.indexOf('=') + 1);
                    }
                    else {
                        fileName = 'unnamed.' + contentType.substring(contentType.indexOf('/') + 1);
                    }
                    var url = window.URL.createObjectURL(blob);
                    var el = document.createElement('a');
                    el.href = url;
                    el.download = fileName;
                    el.click();
                    window.URL.revokeObjectURL(url);
                    el.remove();
                };
                xhr.send();
            });
        }
    };
};
chefs.title = 'CHEFS';
export default chefs;
