export const getContextButtons = (context)=> {
  const values = [];

  context.utils.eachComponent(context.instance.options.editForm.components, (component) => {
    if (component.type === 'button') {
      values.push({
        label: `${component.key} (${component.label})`,
        value: component.key,
      });
    }
  });

  return values;
}