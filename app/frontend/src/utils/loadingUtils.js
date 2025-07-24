export function genObjectLoader(id, objectsToLoad = []) {
  return {
    id: id,
    objectsToLoad: objectsToLoad,
    objectsLoaded: [],
  };
}
