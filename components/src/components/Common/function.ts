export function reArrangeComponents(neededposition=[], components=[]) {
    const newPosition = [];
    // tslint:disable-next-line: no-unused-expression
    neededposition.length && neededposition.map((posKey) => {
        components.findIndex((comp) => {
            if(comp.key === posKey){
                newPosition.push(comp);
            }
    });
});

    return Array.from(new Set(newPosition.map(a => a.key)))
    .map(key => {
      return newPosition.find(a => a.key === key)
    });
}