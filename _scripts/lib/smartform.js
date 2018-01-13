export default function(element, config) {

    if (typeof element === 'string') element = document.querySelector(element);
    if (!(element instanceof HTMLElement)) return null;
    if (!(element instanceof HTMLFormElement)) element = document.querySelector('form');

    const _ = enumerable => Array.prototype.slice.call(enumerable);

    function SmartForm({set, change, input, submit, reset}) {
        this.root = element;
        if (change) _(element.elements).forEach(field => {
            field.addEventListener('change', function(e) { change.call(this, e) });
        });
        if (input) _(element.elements).forEach(field => {
            field.addEventListener('input', function(e) { input.call(this, e) });
        });
        if (submit) element.addEventListener('submit', (e) => { submit.call(this, e) });
        if (reset)  element.addEventListener('reset',  (e) => {  reset.call(this, e) });
        set && set.call(this);
    };

    SmartForm.prototype = {
        get:     function(property) {return element[property];},
        set:     function(property, value) {element[property] = value;},
        reset:   function() {element.reset();},
        field:   function(name) {return element.elements[name]},
        fill:    function(data) {},
        valueOf: function(name) {return valueOf.call(this, this.field(name))},
        json:    function(type) {
            const json = {};
            _(this.root.elements).forEach(field => {
                if (this.field(field.name)) json[field.name] = this.valueOf(field.name);
            });
            return json;
        }
    };

    return new SmartForm(config);

    function valueOf(field) {

        if (!field) return null;
        if (typeof field.value === 'string') return field.value;

    };

};