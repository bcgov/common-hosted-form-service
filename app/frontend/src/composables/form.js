export function exportFormSchema(formName, formSchema, snake) {
  let snek = snake;
  if (!snek) {
    snek = formName
      .replace(/\s+/g, '_')
      .replace(/[^-_0-9a-z]/gi, '')
      .toLowerCase();
  }

  const a = document.createElement('a');
  a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(formSchema)
  )}`;
  a.download = `${snek}_schema.json`;
  a.style.display = 'none';
  a.classList.add('hiddenDownloadTextElement');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  return { snek };
}
