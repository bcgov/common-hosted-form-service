const toArray = (values) => {
  if (values) {
    return Array.isArray(values) ? values.filter(p => p && p.trim().length > 0) : [values].filter(p => p && p.trim().length > 0);
  }
  return [];
};
const inArrayClause = (column, values) => {
  return values.map(p => `'${p}' = ANY("${column}")`).join(' or ');
};

const inArrayFilter = (column, values) => {
  const clause = inArrayClause(column, values);
  return `(array_length("${column}", 1) > 0 and (${clause}))`;
};

const tableNames = (models) => {
  return Object.values(models).map(model => model.tableName);
};

module.exports = {
  toArray: toArray,
  inArrayClause: inArrayClause,
  inArrayFilter: inArrayFilter,
  tableNames
};
