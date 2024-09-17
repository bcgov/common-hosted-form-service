// @vitest-environment happy-dom
// happy-dom is required to access window.URL
import { vi } from 'vitest';
import * as printOptionsComposables from '~/composables/printOptions';

describe('printOptions.js', () => {
  it('createDownload should createObjectURL, click the url then revokeObjectURL', () => {
    let createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    createObjectURLSpy.mockImplementation((data) => data);
    let revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL');
    revokeObjectURLSpy.mockImplementation((data) => data);
    printOptionsComposables.createDownload();
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
  });
});
