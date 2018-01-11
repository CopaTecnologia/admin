export default function(element, config) {

    if (typeof element === 'string') element = document.createElement(element);
    if (!element) return false;
    if (typeof config === 'object') extendObject(element, config);

    function extendObject(obj, props) {

        for (const prop in props) {

            const isObject = prop in obj && typeof obj[prop] === 'object';

            if (isObject) extendObject(obj[prop], props[prop]);
            else obj[prop] = props[prop];

        }
    
    };

    return element;

};