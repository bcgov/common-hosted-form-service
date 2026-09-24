// User's optional note, else a form-name default. Never the UUID.
export function entryTitle(entry, t) {
  if (entry.note) return entry.note;
  if (entry.formName) {
    return t('trans.offlineSubmission.pendingDefaultDescription', {
      formName: entry.formName,
    });
  }
  return t('trans.offlineSubmission.pendingDefaultDescriptionNoName');
}
