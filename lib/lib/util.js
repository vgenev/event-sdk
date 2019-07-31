"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getNestedObject = (parent, path) => {
    let result = {};
    if (!path)
        result = parent;
    else {
        let child = Object.assign({}, parent);
        let id = path.split('.');
        for (let i = 0; i < id.length; i++) {
            if (i !== id.length - 1) {
                child = child[id[i]];
            }
            else {
                result = child[id[i]];
            }
        }
    }
    return result;
};
exports.getNestedObject = getNestedObject;
//# sourceMappingURL=util.js.map