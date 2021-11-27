/* tslint:disable */
import NativePromise from 'native-promise-only';

const chefs = (formio) => {
  const addHeaders = (xhr, options) => {
    if (options && options.headers) {
      Object.keys(options.headers).forEach(k => {
        const v = options.headers[k];
        xhr.setRequestHeader(k, v);
      });
    }
  };

  const xhrRequest = (url, name, query, data, options, onprogress) => {
    return new NativePromise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const json = (typeof data === 'string');
      const fd = new FormData();
      if (typeof onprogress === 'function') {
        xhr.upload.onprogress = onprogress;
      }

      if (!json) {
        for (const key in data) {
          fd.append(key, data[key]);
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Need to test if xhr.response is decoded or not.
          let respData = {};
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
          let respUrl = respData.hasOwnProperty('url') ? respData.url : `${xhr.responseURL}/${name}`;

          // If they provide relative url, then prepend the url.
          if (respUrl && respUrl[0] === '/') {
            respUrl = `${url}${respUrl}`;
          }
          resolve({ url: respUrl, data: respData });
        }
        else {
          reject(xhr.response || 'Unable to upload file');
        }
      };

      xhr.onerror = () => reject(xhr);
      xhr.onabort = () => reject(xhr);

      let requestUrl = url + (url.indexOf('?') > -1 ? '&' : '?');
      for (const key in query) {
        requestUrl += `${key}=${query[key]}&`;
      }
      if (requestUrl[requestUrl.length - 1] === '&') {
        requestUrl = requestUrl.substr(0, requestUrl.length - 1);
      }

      xhr.open('POST', requestUrl);
      if (json) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      const token = formio.getToken();
      if (token) {
        xhr.setRequestHeader('x-jwt-token', token);
      }

      addHeaders(xhr, options);

      //Overrides previous request props
      if (options) {
        const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
        for (const prop in parsedOptions) {
          xhr[prop] = parsedOptions[prop];
        }
      }
      xhr.send(json ? data : fd);
    });
  };

  return {
    title: 'CHEFS',
    name: 'chefs',
    uploadFile(file, name, dir, progressCallback, url, options, fileKey) {
      const uploadRequest = function(form) {
        return xhrRequest(url, name, {}, {
          [fileKey]:file,
          name,
          dir
        }, options, progressCallback).then(response => {
          response.data = response.data || {};
          return {
            storage: 'chefs',
            name: response.data.originalname,
            url: `${url}/${response.data.id}`,
            size: response.data.size,
            type: response.data.mimetype,
            data: {id: response.data.id}
          };
        });
      };
      if (file.private && formio.formId) {
        return formio.loadForm().then((form) => uploadRequest(form));
      }
      else {
        // @ts-ignore
        return uploadRequest();
      }
    },
    deleteFile(fileInfo, options) {
      return new NativePromise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('DELETE', fileInfo.url, true);
        addHeaders(xhr, options);
        xhr.onload = () => {
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
    downloadFile(file, options) {
      return new NativePromise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', file.url, true);
        addHeaders(xhr, options);
        xhr.responseType = 'blob';
        xhr.onload = function (event) {
          const blob = xhr.response;
          let fileName;
          const contentType = xhr.getResponseHeader('content-type');

          // IE/EDGE doesn't send all response headers
          if (xhr.getResponseHeader('content-disposition')) {
            const contentDisposition = xhr.getResponseHeader('content-disposition');
            fileName = contentDisposition.substring(contentDisposition.indexOf('=')+1);
          } else {
            fileName = 'unnamed.' + contentType.substring(contentType.indexOf('/')+1);
          }

          const url = window.URL.createObjectURL(blob);
          let el = document.createElement('a');
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
