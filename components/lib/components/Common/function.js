export function reArrangeComponents(neededposition, components) {
    if (neededposition === void 0) { neededposition = []; }
    if (components === void 0) { components = []; }
    var newPosition = [];
    // tslint:disable-next-line: no-unused-expression
    neededposition.length && neededposition.map(function (posKey) {
        components.findIndex(function (comp) {
            if (comp.key === posKey) {
                newPosition.push(comp);
            }
        });
    });
    return Array.from(new Set(newPosition.map(function (a) { return a.key; })))
        .map(function (key) {
        return newPosition.find(function (a) { return a.key === key; });
    });
}
