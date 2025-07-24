export function importExternalFile(document, uri, onloadCallback = null) {
  let extension = uri.split('.').pop();
  let file = null;
  switch (extension) {
    case 'js':
      file = document.createElement('script');
      file.setAttribute('src', uri);
      break;
    case 'css':
      file = document.createElement('link');
      file.setAttribute('rel', 'stylesheet');
      file.setAttribute('href', uri);
      break;
  }

  if (file !== null) {
    file.onload = onloadCallback;
    document.body.appendChild(file);
  }
}
