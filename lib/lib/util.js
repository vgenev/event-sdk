"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getNestedObject = (parent, path) => {
    let child = Object.assign({}, parent);
    let result = {};
    let id = path.split('.');
    for (let i = 0; i < id.length; i++) {
        if (i !== id.length - 1) {
            child = child[id[i]];
        }
        else {
            result = child[id[i]];
        }
    }
    return result || null;
};
exports.getNestedObject = getNestedObject;
//# sourceMappingURL=util.js.map