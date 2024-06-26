import { formService } from '~/services';

export async function fetchDocumentTemplates(formId) {
  let documentTemplates = [];

  const result = await formService.documentTemplateList(formId);
  // Iterate through each document in the result
  result.data.forEach((doc) => {
    documentTemplates.push({
      filename: doc.filename,
      createdAt: doc.createdAt,
      templateId: doc.id,
      actions: '',
    });
  });

  return documentTemplates;
}

export async function getDocumentTemplate(formId, templateId, filename) {
  const { data } = await formService.documentTemplateRead(formId, templateId);
  if (!data) throw new Error('There was no data in the document.');

  const base64EncodedData = data.template.data
    .map((byte) => String.fromCharCode(byte))
    .join('');
  // Decode the base64 string to binary data
  const binaryString = atob(base64EncodedData);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], {
    type: getMimeType(filename),
  });

  return window.URL.createObjectURL(blob);
}

export function getMimeType(filename) {
  const extension = filename.slice(filename.lastIndexOf('.') + 1);
  const mimeTypes = {
    txt: 'text/plain',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    html: 'text/html',
    odt: 'application/vnd.oasis.opendocument.text',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[extension];
}

export async function readFile(uploadedFile) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(uploadedFile);
    reader.onload = () => {
      // Strip the Data URL scheme part (everything up to, and including, the comma)
      const base64Content = reader.result.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}
