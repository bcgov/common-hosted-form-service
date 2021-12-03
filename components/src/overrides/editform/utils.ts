import EditFormUtils from 'formiojs/components/_classes/component/editForm/utils';

const originalLogicVariablesTable = EditFormUtils.logicVariablesTable;

// decorate this function to inclue global updates to evalContext.
function logicVariablesTable(additional) {
  const customEval =
    '<tr><th>token</th><td>The parsed JWT token</td></tr>' +
    '<tr><th>user</th><td>The currently logged in user</td></tr>';
  return originalLogicVariablesTable(additional + customEval);
}

EditFormUtils.logicVariablesTable = logicVariablesTable;
