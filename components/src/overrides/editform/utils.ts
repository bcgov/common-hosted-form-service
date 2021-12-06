import EditFormUtils from 'formiojs/components/_classes/component/editForm/utils';

const originalLogicVariablesTable = EditFormUtils.logicVariablesTable;

// decorate this function to include global updates to evalContext.
function logicVariablesTable(additional = '') {
  // Avoid this showing up twice in the table (don't see a currently supported better way to override this atm)
  // https://github.com/formio/formio.js/blob/3ee8def5e873c1bb957cee856926bcd76dc2e52a/src/components/_classes/component/editForm/Component.edit.data.js#L109
  if (
    additional ===
    '<tr><th>token</th><td>The decoded JWT token for the authenticated user.</td></tr>'
  ) {
    additional = '';
  }

  const customEval =
    '<tr><th>token</th><td>The decoded JWT token for the authenticated user.</td></tr>' +
    '<tr><th>user</th><td>The currently logged in user</td></tr>';
  return originalLogicVariablesTable(additional + customEval);
}

EditFormUtils.logicVariablesTable = logicVariablesTable;
