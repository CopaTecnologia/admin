'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function () {
    'use strict';

    var element = function element(_element, config) {

        if (typeof _element === 'string') _element = document.createElement(_element);
        if (!_element) return false;
        if ((typeof config === 'undefined' ? 'undefined' : _typeof(config)) === 'object') extendObject(_element, config);

        function extendObject(obj, props) {

            for (var prop in props) {

                var isObject = prop in obj && _typeof(obj[prop]) === 'object';
                if (prop === 'events') for (var e in props[prop]) {
                    obj.addEventListener(e, props[prop][e], false);
                } else if (isObject) extendObject(obj[prop], props[prop]);else obj[prop] = props[prop];
            }
        }

        return _element;
    };

    var smartform = function smartform(element, config) {

        if (typeof element === 'string') element = document.querySelector(element);
        if (!(element instanceof HTMLElement)) return null;
        if (!(element instanceof HTMLFormElement)) element = document.querySelector('form');

        var _ = function _(enumerable) {
            return Array.prototype.slice.call(enumerable);
        };

        function SmartForm(_ref) {
            var _this = this;

            var set = _ref.set,
                change = _ref.change,
                input = _ref.input,
                submit = _ref.submit,
                reset = _ref.reset;

            this.root = element;
            if (change) _(element.elements).forEach(function (field) {
                field.addEventListener('change', function (e) {
                    change.call(this, e);
                });
            });
            if (input) _(element.elements).forEach(function (field) {
                field.addEventListener('input', function (e) {
                    input.call(this, e);
                });
            });
            if (submit) element.addEventListener('submit', function (e) {
                submit.call(_this, e);
            });
            if (reset) element.addEventListener('reset', function (e) {
                reset.call(_this, e);
            });
            set && set.call(this);
        }

        SmartForm.prototype = {
            get: function get(property) {
                return element[property];
            },
            set: function set(property, value) {
                element[property] = value;
            },
            reset: function reset() {
                element.reset();
            },
            field: function field(name) {
                return element.elements[name];
            },
            fill: function fill(data) {},
            valueOf: function valueOf(name) {
                return _valueOf.call(this, this.field(name));
            },
            json: function json(type) {
                var _this2 = this;

                var json = {};
                _(this.root.elements).forEach(function (field) {
                    if (_this2.field(field.name)) json[field.name] = _this2.valueOf(field.name);
                });
                return json;
            }
        };

        return new SmartForm(config);

        function _valueOf(field) {

            if (!field) return null;
            if (typeof field.value === 'string') return field.value;
        }
    };

    var FIREBASE_AUTH = firebase.auth();
    var FIREBASE_DATABASE = firebase.database();

    var ui = {
        signInButton: element(document.querySelector('.sign-in'), { events: { click: signIn } }),
        signOutBUtton: element(document.querySelector('.sign-out'), { events: { click: signOut } }),
        usernameLabel: document.querySelector('.username'),
        sections: document.querySelectorAll('.app-section'),
        pageLinks: document.querySelectorAll('.page-link'),
        compose: function compose(_ref2) {
            var show = _ref2.show,
                hide = _ref2.hide;

            show && show.forEach(function (el) {
                return el.removeAttribute('hidden');
            });
            hide && hide.forEach(function (el) {
                return el.setAttribute('hidden', true);
            });
        },
        show: function show(element$$1, fn) {
            if (typeof element$$1 === 'string') element$$1 = document.querySelectorAll(element$$1);
            if (element$$1 instanceof HTMLElement) element$$1.removeAttribute('hidden');else Array.prototype.forEach.call(element$$1, function (el) {
                return el.removeAttribute('hidden');
            });
            fn && fn(element$$1);
        },
        hide: function hide(element$$1, fn) {
            if (typeof element$$1 === 'string') element$$1 = document.querySelectorAll(element$$1);
            if (element$$1 instanceof HTMLElement) element$$1.setAttribute('hidden', true);else Array.prototype.forEach.call(element$$1, function (el) {
                return el.setAttribute('hidden', true);
            });
            fn && fn(element$$1);
        },
        renderSection: function renderSection(section) {
            var listContainer = section.querySelector('.app-list');
            var template = listContainer.querySelector('.template');
            listContainer.innerHTML = '';
            FIREBASE_DATABASE.ref(section.id).on('child_added', function (snapshot) {
                var data = snapshot.val();
                var item = render(template, data);
                if (!item) return;
                item.id = snapshot.key;
                listContainer.insertAdjacentElement('afterBegin', item);
            });
            var modal = section.querySelector('[data-modal]');
            var openFormButton = section.querySelector('.open-form');
            if (openFormButton && modal) {
                openFormButton.addEventListener('click', function () {
                    modal.classList.add('on');
                });
                modal.querySelector('[data-btn~="fechar"]').addEventListener('click', function () {
                    modal.classList.remove('on');
                });
            }
        }
    };

    Array.prototype.forEach.call(ui.pageLinks, function (link) {
        return link.addEventListener('click', function (e) {
            if (this.hash) {
                e.preventDefault();
                ui.hide(ui.sections);
                ui.show(this.hash, function (nodes) {
                    return ui.renderSection(nodes[0]);
                });
            }
        });
    });

    FIREBASE_AUTH.onAuthStateChanged(handleAuthStateChanged);

    var appForms = window.appForms = Array.prototype.map.call(document.querySelectorAll('form'), function (form) {
        return smartform(form, {
            set: function set() {},
            change: function change(e) {},
            input: function input(e) {},
            submit: function submit(e) {
                e.preventDefault();
                FIREBASE_DATABASE.ref(this.root.dataset.action).push(this.json());
                this.root.reset();
            },
            reset: function reset(e) {
                Array.prototype.forEach.call(document.querySelectorAll('[data-modal].on'), function (modal) {
                    return modal.classList.remove('on');
                });
            }
        });
    });

    appForms.forEach(function (form) {
        Array.prototype.forEach.call(form.root.querySelectorAll('select'), function (el) {
            if (el.getAttribute('data-ref')) {
                var template = el.querySelector('.template');
                if (!template) return;
                FIREBASE_DATABASE.ref(el.getAttribute('data-ref')).on('child_added', function (snapshot) {
                    var data = snapshot.val();
                    var item = template.cloneNode(true);
                    if (!item) return;
                    item.value = snapshot.key;
                    item.textContent = data[item.getAttribute('data-model')];
                    item.removeAttribute('hidden');
                    el.appendChild(item);
                });
            }
        });
    });

    function signIn() {
        FIREBASE_AUTH.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }

    function signOut() {
        FIREBASE_AUTH.signOut();
    }

    function handleAuthStateChanged(user) {

        ui.hide(ui.sections);
        ui.hide(document.querySelector('#greetings .loading'));

        if (user) {

            var userRef = FIREBASE_DATABASE.ref('users/' + user.uid);
            userRef.once('value', function (snapshot) {
                if (!snapshot.val()) {
                    userRef.set({
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        lastSignInTime: Date()
                    });
                } else {
                    userRef.child('lastSignInTime').set(Date());
                }
            });

            ui.compose({
                show: [ui.signOutBUtton],
                hide: [ui.signInButton]
            });
            ui.usernameLabel.innerHTML = '<span data-block="inline circ"><img src="' + user.photoURL + '" height="25"></span>\n            <small title="' + user.email + '" class="display-name">' + user.displayName + '</small>';
            ui.show(ui.pageLinks);
            ui.show('#projects', function (nodes) {
                return ui.renderSection(nodes[0]);
            });
        } else {
            ui.compose({
                hide: [ui.signOutBUtton],
                show: [ui.signInButton]
            });
            ui.usernameLabel.innerHTML = '';
            ui.hide(ui.pageLinks);
            ui.show('#greetings');
        }
    }

    function render(element$$1, data) {
        if (!element$$1 || !element$$1.cloneNode) return console.log('Template não encontrado!', element$$1, data);
        var container = element$$1.cloneNode(true);
        container.removeAttribute('hidden');
        Array.prototype.forEach.call(container.querySelectorAll('[data-model]'), function (tag) {
            var content = data[tag.getAttribute('data-model')];
            if (content) {
                if (tag.tagName === 'TIME') {
                    var date = new Date(content);
                    tag.textContent = '' + date.toLocaleString();
                } else if (tag.tagName === 'IMG') tag.src = content;else tag.textContent = content;
            }
        });
        Array.prototype.forEach.call(container.querySelectorAll('[data-ref]'), function (tag) {
            if (!tag.getAttribute('data-key') || !tag.getAttribute('data-ref') || !tag.getAttribute('data-ref-model')) return;
            var key = data[tag.getAttribute('data-key')];
            if (!key) return;
            FIREBASE_DATABASE.ref(tag.getAttribute('data-ref') + '/' + key).on('value', function (snapshot) {
                var data = snapshot.val();
                tag.textContent = data[tag.getAttribute('data-ref-model')];
            });
        });
        return container;
    }
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiZWxlbWVudCIsImNvbmZpZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImV4dGVuZE9iamVjdCIsIm9iaiIsInByb3BzIiwicHJvcCIsImlzT2JqZWN0IiwiZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJzbWFydGZvcm0iLCJxdWVyeVNlbGVjdG9yIiwiSFRNTEVsZW1lbnQiLCJIVE1MRm9ybUVsZW1lbnQiLCJfIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJlbnVtZXJhYmxlIiwiU21hcnRGb3JtIiwic2V0IiwiY2hhbmdlIiwiaW5wdXQiLCJzdWJtaXQiLCJyZXNldCIsInJvb3QiLCJlbGVtZW50cyIsImZvckVhY2giLCJmaWVsZCIsImdldCIsInByb3BlcnR5IiwidmFsdWUiLCJuYW1lIiwiZmlsbCIsImRhdGEiLCJ2YWx1ZU9mIiwianNvbiIsInR5cGUiLCJGSVJFQkFTRV9BVVRIIiwiZmlyZWJhc2UiLCJhdXRoIiwiRklSRUJBU0VfREFUQUJBU0UiLCJkYXRhYmFzZSIsInVpIiwic2lnbkluQnV0dG9uIiwiZXZlbnRzIiwiY2xpY2siLCJzaWduSW4iLCJzaWduT3V0QlV0dG9uIiwic2lnbk91dCIsInVzZXJuYW1lTGFiZWwiLCJzZWN0aW9ucyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJwYWdlTGlua3MiLCJjb21wb3NlIiwic2hvdyIsImhpZGUiLCJlbCIsInJlbW92ZUF0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsImVsZW1lbnQkJDEiLCJmbiIsInJlbmRlclNlY3Rpb24iLCJzZWN0aW9uIiwibGlzdENvbnRhaW5lciIsInRlbXBsYXRlIiwiaW5uZXJIVE1MIiwicmVmIiwiaWQiLCJvbiIsInNuYXBzaG90IiwidmFsIiwiaXRlbSIsInJlbmRlciIsImtleSIsImluc2VydEFkamFjZW50RWxlbWVudCIsIm1vZGFsIiwib3BlbkZvcm1CdXR0b24iLCJjbGFzc0xpc3QiLCJhZGQiLCJyZW1vdmUiLCJsaW5rIiwiaGFzaCIsInByZXZlbnREZWZhdWx0Iiwibm9kZXMiLCJvbkF1dGhTdGF0ZUNoYW5nZWQiLCJoYW5kbGVBdXRoU3RhdGVDaGFuZ2VkIiwiYXBwRm9ybXMiLCJ3aW5kb3ciLCJtYXAiLCJmb3JtIiwiZGF0YXNldCIsImFjdGlvbiIsInB1c2giLCJnZXRBdHRyaWJ1dGUiLCJjbG9uZU5vZGUiLCJ0ZXh0Q29udGVudCIsImFwcGVuZENoaWxkIiwic2lnbkluV2l0aFBvcHVwIiwiR29vZ2xlQXV0aFByb3ZpZGVyIiwidXNlciIsInVzZXJSZWYiLCJ1aWQiLCJvbmNlIiwiZW1haWwiLCJkaXNwbGF5TmFtZSIsInBob3RvVVJMIiwibGFzdFNpZ25JblRpbWUiLCJEYXRlIiwiY2hpbGQiLCJjb25zb2xlIiwibG9nIiwiY29udGFpbmVyIiwiY29udGVudCIsInRhZyIsInRhZ05hbWUiLCJkYXRlIiwidG9Mb2NhbGVTdHJpbmciLCJzcmMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQyxhQUFZO0FBQ2I7O0FBRUEsUUFBSUEsVUFBVSxpQkFBU0EsUUFBVCxFQUFrQkMsTUFBbEIsRUFBMEI7O0FBRXBDLFlBQUksT0FBT0QsUUFBUCxLQUFtQixRQUF2QixFQUFpQ0EsV0FBVUUsU0FBU0MsYUFBVCxDQUF1QkgsUUFBdkIsQ0FBVjtBQUNqQyxZQUFJLENBQUNBLFFBQUwsRUFBYyxPQUFPLEtBQVA7QUFDZCxZQUFJLFFBQU9DLE1BQVAseUNBQU9BLE1BQVAsT0FBa0IsUUFBdEIsRUFBZ0NHLGFBQWFKLFFBQWIsRUFBc0JDLE1BQXRCOztBQUVoQyxpQkFBU0csWUFBVCxDQUFzQkMsR0FBdEIsRUFBMkJDLEtBQTNCLEVBQWtDOztBQUU5QixpQkFBSyxJQUFNQyxJQUFYLElBQW1CRCxLQUFuQixFQUEwQjs7QUFFdEIsb0JBQU1FLFdBQVdELFFBQVFGLEdBQVIsSUFBZSxRQUFPQSxJQUFJRSxJQUFKLENBQVAsTUFBcUIsUUFBckQ7QUFDQSxvQkFBSUEsU0FBUyxRQUFiLEVBQXVCLEtBQUssSUFBTUUsQ0FBWCxJQUFn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Q0FBU0ssT0FBVCxDQUFiO0FBQ0FDLHdCQUFJbEIsV0FBSixRQUFxQm9CLEtBQUtDLGNBQUwsRUFBckI7QUFDSCxpQkFIRCxNQUlLLElBQUlILElBQUlDLE9BQUosS0FBZ0IsS0FBcEIsRUFBMkJELElBQUlJLEdBQUosR0FBVUwsT0FBVixDQUEzQixLQUNBQyxJQUFJbEIsV0FBSixHQUFrQmlCLE9BQWxCO0FBQ1I7QUFDSixTQVZEO0FBV0FuRyxjQUFNQyxTQUFOLENBQWdCWSxPQUFoQixDQUF3QlYsSUFBeEIsQ0FBNkIrRixVQUFVNUQsZ0JBQVYsQ0FBMkIsWUFBM0IsQ0FBN0IsRUFBdUUsZUFBTztBQUMxRSxnQkFBSSxDQUFDOEQsSUFBSXBCLFlBQUosQ0FBaUIsVUFBakIsQ0FBRCxJQUFpQyxDQUFDb0IsSUFBSXBCLFlBQUosQ0FBaUIsVUFBakIsQ0FBbEMsSUFBa0UsQ0FBQ29CLElBQUlwQixZQUFKLENBQWlCLGdCQUFqQixDQUF2RSxFQUEyRztBQUMzRyxnQkFBTXBCLE1BQU14QyxLQUFLZ0YsSUFBSXBCLFlBQUosQ0FBaUIsVUFBakIsQ0FBTCxDQUFaO0FBQ0EsZ0JBQUksQ0FBQ3BCLEdBQUwsRUFBVTtBQUNWakMsOEJBQWtCMEIsR0FBbEIsQ0FBc0IrQyxJQUFJcEIsWUFBSixDQUFpQixVQUFqQixJQUErQixHQUEvQixHQUFxQ3BCLEdBQTNELEVBQWdFTCxFQUFoRSxDQUFtRSxPQUFuRSxFQUE0RSxvQkFBWTtBQUNwRixvQkFBTW5DLE9BQU9vQyxTQUFTQyxHQUFULEVBQWI7QUFDQTJDLG9CQUFJbEIsV0FBSixHQUFrQjlELEtBQUtnRixJQUFJcEIsWUFBSixDQUFpQixnQkFBakIsQ0FBTCxDQUFsQjtBQUNILGFBSEQ7QUFJSCxTQVJEO0FBU0EsZUFBT2tCLFNBQVA7QUFDSDtBQUVBLENBcFBBLEdBQUQiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBlbGVtZW50ID0gZnVuY3Rpb24oZWxlbWVudCwgY29uZmlnKSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudCk7XHJcbiAgICBpZiAoIWVsZW1lbnQpIHJldHVybiBmYWxzZTtcclxuICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnb2JqZWN0JykgZXh0ZW5kT2JqZWN0KGVsZW1lbnQsIGNvbmZpZyk7XHJcblxyXG4gICAgZnVuY3Rpb24gZXh0ZW5kT2JqZWN0KG9iaiwgcHJvcHMpIHtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHByb3BzKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBpc09iamVjdCA9IHByb3AgaW4gb2JqICYmIHR5cGVvZiBvYmpbcHJvcF0gPT09ICdvYmplY3QnO1xyXG4gICAgICAgICAgICBpZiAocHJvcCA9PT0gJ2V2ZW50cycpIGZvciAoY29uc3QgZSBpbiBwcm9wc1twcm9wXSkgb2JqLmFkZEV2ZW50TGlzdGVuZXIoZSwgcHJvcHNbcHJvcF1bZV0sIGZhbHNlKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoaXNPYmplY3QpIGV4dGVuZE9iamVjdChvYmpbcHJvcF0sIHByb3BzW3Byb3BdKTtcclxuICAgICAgICAgICAgZWxzZSBvYmpbcHJvcF0gPSBwcm9wc1twcm9wXTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGVsZW1lbnQ7XHJcblxyXG59O1xuXG52YXIgc21hcnRmb3JtID0gZnVuY3Rpb24oZWxlbWVudCwgY29uZmlnKSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCk7XHJcbiAgICBpZiAoIShlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm4gbnVsbDtcclxuICAgIGlmICghKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRm9ybUVsZW1lbnQpKSBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9ybScpO1xyXG5cclxuICAgIGNvbnN0IF8gPSBlbnVtZXJhYmxlID0+IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVudW1lcmFibGUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIFNtYXJ0Rm9ybSh7c2V0LCBjaGFuZ2UsIGlucHV0LCBzdWJtaXQsIHJlc2V0fSkge1xyXG4gICAgICAgIHRoaXMucm9vdCA9IGVsZW1lbnQ7XHJcbiAgICAgICAgaWYgKGNoYW5nZSkgXyhlbGVtZW50LmVsZW1lbnRzKS5mb3JFYWNoKGZpZWxkID0+IHtcclxuICAgICAgICAgICAgZmllbGQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZSkgeyBjaGFuZ2UuY2FsbCh0aGlzLCBlKTsgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKGlucHV0KSBfKGVsZW1lbnQuZWxlbWVudHMpLmZvckVhY2goZmllbGQgPT4ge1xyXG4gICAgICAgICAgICBmaWVsZC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGZ1bmN0aW9uKGUpIHsgaW5wdXQuY2FsbCh0aGlzLCBlKTsgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKHN1Ym1pdCkgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCAoZSkgPT4geyBzdWJtaXQuY2FsbCh0aGlzLCBlKTsgfSk7XHJcbiAgICAgICAgaWYgKHJlc2V0KSAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdyZXNldCcsICAoZSkgPT4geyAgcmVzZXQuY2FsbCh0aGlzLCBlKTsgfSk7XHJcbiAgICAgICAgc2V0ICYmIHNldC5jYWxsKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIFNtYXJ0Rm9ybS5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgZ2V0OiAgICAgZnVuY3Rpb24ocHJvcGVydHkpIHtyZXR1cm4gZWxlbWVudFtwcm9wZXJ0eV07fSxcclxuICAgICAgICBzZXQ6ICAgICBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtlbGVtZW50W3Byb3BlcnR5XSA9IHZhbHVlO30sXHJcbiAgICAgICAgcmVzZXQ6ICAgZnVuY3Rpb24oKSB7ZWxlbWVudC5yZXNldCgpO30sXHJcbiAgICAgICAgZmllbGQ6ICAgZnVuY3Rpb24obmFtZSkge3JldHVybiBlbGVtZW50LmVsZW1lbnRzW25hbWVdfSxcclxuICAgICAgICBmaWxsOiAgICBmdW5jdGlvbihkYXRhKSB7fSxcclxuICAgICAgICB2YWx1ZU9mOiBmdW5jdGlvbihuYW1lKSB7cmV0dXJuIHZhbHVlT2YuY2FsbCh0aGlzLCB0aGlzLmZpZWxkKG5hbWUpKX0sXHJcbiAgICAgICAganNvbjogICAgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICBjb25zdCBqc29uID0ge307XHJcbiAgICAgICAgICAgIF8odGhpcy5yb290LmVsZW1lbnRzKS5mb3JFYWNoKGZpZWxkID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpZWxkKGZpZWxkLm5hbWUpKSBqc29uW2ZpZWxkLm5hbWVdID0gdGhpcy52YWx1ZU9mKGZpZWxkLm5hbWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGpzb247XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFNtYXJ0Rm9ybShjb25maWcpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHZhbHVlT2YoZmllbGQpIHtcclxuXHJcbiAgICAgICAgaWYgKCFmaWVsZCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmaWVsZC52YWx1ZSA9PT0gJ3N0cmluZycpIHJldHVybiBmaWVsZC52YWx1ZTtcclxuXHJcbiAgICB9XHJcblxyXG59O1xuXG5jb25zdCBGSVJFQkFTRV9BVVRIID0gZmlyZWJhc2UuYXV0aCgpO1xyXG5jb25zdCBGSVJFQkFTRV9EQVRBQkFTRSA9IGZpcmViYXNlLmRhdGFiYXNlKCk7XHJcblxyXG5jb25zdCB1aSA9IHtcclxuICAgIHNpZ25JbkJ1dHRvbjogZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2lnbi1pbicpLCB7IGV2ZW50czoge2NsaWNrOiBzaWduSW59IH0pLFxyXG4gICAgc2lnbk91dEJVdHRvbjogZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2lnbi1vdXQnKSwgeyBldmVudHM6IHtjbGljazogc2lnbk91dH0gfSksXHJcbiAgICB1c2VybmFtZUxhYmVsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudXNlcm5hbWUnKSxcclxuICAgIHNlY3Rpb25zOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYXBwLXNlY3Rpb24nKSxcclxuICAgIHBhZ2VMaW5rczogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2UtbGluaycpLFxyXG4gICAgY29tcG9zZTogKHtzaG93LCBoaWRlfSkgPT4ge1xyXG4gICAgICAgIHNob3cgJiYgc2hvdy5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJykpO1xyXG4gICAgICAgIGhpZGUgJiYgaGlkZS5mb3JFYWNoKGVsID0+IGVsLnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgdHJ1ZSkpO1xyXG4gICAgfSxcclxuICAgIHNob3c6IChlbGVtZW50JCQxLCBmbikgPT4ge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudCQkMSA9PT0gJ3N0cmluZycpIGVsZW1lbnQkJDEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGVsZW1lbnQkJDEpO1xyXG4gICAgICAgIGlmIChlbGVtZW50JCQxIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGVsZW1lbnQkJDEucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKTtcclxuICAgICAgICBlbHNlIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWxlbWVudCQkMSwgZWwgPT4gZWwucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKSk7XHJcbiAgICAgICAgZm4gJiYgZm4oZWxlbWVudCQkMSk7XHJcbiAgICB9LFxyXG4gICAgaGlkZTogKGVsZW1lbnQkJDEsIGZuKSA9PiB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50JCQxID09PSAnc3RyaW5nJykgZWxlbWVudCQkMSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZWxlbWVudCQkMSk7XHJcbiAgICAgICAgaWYgKGVsZW1lbnQkJDEgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgZWxlbWVudCQkMS5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsIHRydWUpO1xyXG4gICAgICAgIGVsc2UgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbGVtZW50JCQxLCBlbCA9PiBlbC5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsIHRydWUpKTtcclxuICAgICAgICBmbiAmJiBmbihlbGVtZW50JCQxKTtcclxuICAgIH0sXHJcbiAgICByZW5kZXJTZWN0aW9uOiAoc2VjdGlvbikgPT4ge1xyXG4gICAgICAgIGNvbnN0IGxpc3RDb250YWluZXIgPSBzZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoJy5hcHAtbGlzdCcpO1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gbGlzdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudGVtcGxhdGUnKTtcclxuICAgICAgICBsaXN0Q29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIEZJUkVCQVNFX0RBVEFCQVNFLnJlZihzZWN0aW9uLmlkKS5vbignY2hpbGRfYWRkZWQnLCBzbmFwc2hvdCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBzbmFwc2hvdC52YWwoKTtcclxuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHJlbmRlcih0ZW1wbGF0ZSwgZGF0YSk7XHJcbiAgICAgICAgICAgIGlmICghaXRlbSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpdGVtLmlkID0gc25hcHNob3Qua2V5O1xyXG4gICAgICAgICAgICBsaXN0Q29udGFpbmVyLmluc2VydEFkamFjZW50RWxlbWVudCgnYWZ0ZXJCZWdpbicsIGl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IG1vZGFsID0gc2VjdGlvbi5xdWVyeVNlbGVjdG9yKCdbZGF0YS1tb2RhbF0nKTtcclxuICAgICAgICBjb25zdCBvcGVuRm9ybUJ1dHRvbiA9IHNlY3Rpb24ucXVlcnlTZWxlY3RvcignLm9wZW4tZm9ybScpO1xyXG4gICAgICAgIGlmIChvcGVuRm9ybUJ1dHRvbiAmJiBtb2RhbCkge1xyXG4gICAgICAgICAgICBvcGVuRm9ybUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuY2xhc3NMaXN0LmFkZCgnb24nKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWJ0bn49XCJmZWNoYXJcIl0nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnb24nKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh1aS5wYWdlTGlua3MsIGxpbmsgPT4gbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmICh0aGlzLmhhc2gpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdWkuaGlkZSh1aS5zZWN0aW9ucyk7XHJcbiAgICAgICAgdWkuc2hvdyh0aGlzLmhhc2gsIG5vZGVzID0+IHVpLnJlbmRlclNlY3Rpb24obm9kZXNbMF0pKTtcclxuICAgIH1cclxufSkpO1xyXG5cclxuRklSRUJBU0VfQVVUSC5vbkF1dGhTdGF0ZUNoYW5nZWQoaGFuZGxlQXV0aFN0YXRlQ2hhbmdlZCk7XHJcblxyXG5jb25zdCBhcHBGb3JtcyA9IHdpbmRvdy5hcHBGb3JtcyA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdmb3JtJyksIGZvcm0gPT4gc21hcnRmb3JtKGZvcm0sIHtcclxuICAgIHNldDogICAgZnVuY3Rpb24oKSB7fSxcclxuICAgIGNoYW5nZTogZnVuY3Rpb24oZSkge30sXHJcbiAgICBpbnB1dDogIGZ1bmN0aW9uKGUpIHt9LFxyXG4gICAgc3VibWl0OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIEZJUkVCQVNFX0RBVEFCQVNFLnJlZih0aGlzLnJvb3QuZGF0YXNldC5hY3Rpb24pLnB1c2godGhpcy5qc29uKCkpO1xyXG4gICAgICAgIHRoaXMucm9vdC5yZXNldCgpO1xyXG4gICAgfSxcclxuICAgIHJlc2V0OiAgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbW9kYWxdLm9uJyksIG1vZGFsID0+IG1vZGFsLmNsYXNzTGlzdC5yZW1vdmUoJ29uJykpO1xyXG4gICAgfVxyXG59KSk7XHJcblxyXG5hcHBGb3Jtcy5mb3JFYWNoKGZvcm0gPT4ge1xyXG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChmb3JtLnJvb3QucXVlcnlTZWxlY3RvckFsbCgnc2VsZWN0JyksIGVsID0+IHtcclxuICAgICAgICBpZiAoZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXJlZicpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZWwucXVlcnlTZWxlY3RvcignLnRlbXBsYXRlJyk7XHJcbiAgICAgICAgICAgIGlmICghdGVtcGxhdGUpIHJldHVybjtcclxuICAgICAgICAgICAgRklSRUJBU0VfREFUQUJBU0UucmVmKGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1yZWYnKSkub24oJ2NoaWxkX2FkZGVkJywgc25hcHNob3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHNuYXBzaG90LnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRlbXBsYXRlLmNsb25lTm9kZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGlmICghaXRlbSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgaXRlbS52YWx1ZSA9IHNuYXBzaG90LmtleTtcclxuICAgICAgICAgICAgICAgIGl0ZW0udGV4dENvbnRlbnQgPSBkYXRhW2l0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLW1vZGVsJyldO1xyXG4gICAgICAgICAgICAgICAgaXRlbS5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpO1xyXG4gICAgICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoaXRlbSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmZ1bmN0aW9uIHNpZ25JbigpIHtcclxuICAgIEZJUkVCQVNFX0FVVEguc2lnbkluV2l0aFBvcHVwKCBuZXcgZmlyZWJhc2UuYXV0aC5Hb29nbGVBdXRoUHJvdmlkZXIoKSApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaWduT3V0KCkge1xyXG4gICAgRklSRUJBU0VfQVVUSC5zaWduT3V0KCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZUF1dGhTdGF0ZUNoYW5nZWQodXNlcikge1xyXG5cclxuICAgIHVpLmhpZGUodWkuc2VjdGlvbnMpO1xyXG4gICAgdWkuaGlkZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZ3JlZXRpbmdzIC5sb2FkaW5nJykpO1xyXG5cclxuICAgIGlmICh1c2VyKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHVzZXJSZWYgPSBGSVJFQkFTRV9EQVRBQkFTRS5yZWYoYHVzZXJzLyR7dXNlci51aWR9YCk7XHJcbiAgICAgICAgdXNlclJlZi5vbmNlKCd2YWx1ZScsIHNuYXBzaG90ID0+IHtcclxuICAgICAgICAgICAgaWYgKCFzbmFwc2hvdC52YWwoKSkge1xyXG4gICAgICAgICAgICAgICAgdXNlclJlZi5zZXQoe1xyXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiB1c2VyLmRpc3BsYXlOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHBob3RvVVJMOiB1c2VyLnBob3RvVVJMLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhc3RTaWduSW5UaW1lOiBEYXRlKClcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdXNlclJlZi5jaGlsZCgnbGFzdFNpZ25JblRpbWUnKS5zZXQoRGF0ZSgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB1aS5jb21wb3NlKHtcclxuICAgICAgICAgICAgc2hvdzogW3VpLnNpZ25PdXRCVXR0b25dLFxyXG4gICAgICAgICAgICBoaWRlOiBbdWkuc2lnbkluQnV0dG9uXVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHVpLnVzZXJuYW1lTGFiZWwuaW5uZXJIVE1MID0gYDxzcGFuIGRhdGEtYmxvY2s9XCJpbmxpbmUgY2lyY1wiPjxpbWcgc3JjPVwiJHt1c2VyLnBob3RvVVJMfVwiIGhlaWdodD1cIjI1XCI+PC9zcGFuPlxyXG4gICAgICAgICAgICA8c21hbGwgdGl0bGU9XCIke3VzZXIuZW1haWx9XCIgY2xhc3M9XCJkaXNwbGF5LW5hbWVcIj4ke3VzZXIuZGlzcGxheU5hbWV9PC9zbWFsbD5gO1xyXG4gICAgICAgIHVpLnNob3codWkucGFnZUxpbmtzKTtcclxuICAgICAgICB1aS5zaG93KCcjcHJvamVjdHMnLCBub2RlcyA9PiB1aS5yZW5kZXJTZWN0aW9uKG5vZGVzWzBdKSk7XHJcblxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdWkuY29tcG9zZSh7XHJcbiAgICAgICAgICAgIGhpZGU6IFt1aS5zaWduT3V0QlV0dG9uXSxcclxuICAgICAgICAgICAgc2hvdzogW3VpLnNpZ25JbkJ1dHRvbl1cclxuICAgICAgICB9KTtcclxuICAgICAgICB1aS51c2VybmFtZUxhYmVsLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIHVpLmhpZGUodWkucGFnZUxpbmtzKTtcclxuICAgICAgICB1aS5zaG93KCcjZ3JlZXRpbmdzJyk7XHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyKGVsZW1lbnQkJDEsIGRhdGEpIHtcclxuICAgIGlmICghZWxlbWVudCQkMSB8fCAhZWxlbWVudCQkMS5jbG9uZU5vZGUpIHJldHVybiBjb25zb2xlLmxvZygnVGVtcGxhdGUgbsOjbyBlbmNvbnRyYWRvIScsIGVsZW1lbnQkJDEsIGRhdGEpO1xyXG4gICAgY29uc3QgY29udGFpbmVyID0gZWxlbWVudCQkMS5jbG9uZU5vZGUodHJ1ZSk7XHJcbiAgICBjb250YWluZXIucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKTtcclxuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1vZGVsXScpLCB0YWcgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBkYXRhW3RhZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtbW9kZWwnKV07XHJcbiAgICAgICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAgICAgaWYgKHRhZy50YWdOYW1lID09PSAnVElNRScpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShjb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHRhZy50ZXh0Q29udGVudCA9IGAke2RhdGUudG9Mb2NhbGVTdHJpbmcoKX1gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRhZy50YWdOYW1lID09PSAnSU1HJykgdGFnLnNyYyA9IGNvbnRlbnQ7XHJcbiAgICAgICAgICAgIGVsc2UgdGFnLnRleHRDb250ZW50ID0gY29udGVudDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJlZl0nKSwgdGFnID0+IHtcclxuICAgICAgICBpZiAoIXRhZy5nZXRBdHRyaWJ1dGUoJ2RhdGEta2V5JykgfHwgIXRhZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVmJykgfHwgIXRhZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVmLW1vZGVsJykpIHJldHVybjtcclxuICAgICAgICBjb25zdCBrZXkgPSBkYXRhW3RhZy5nZXRBdHRyaWJ1dGUoJ2RhdGEta2V5JyldO1xyXG4gICAgICAgIGlmICgha2V5KSByZXR1cm47XHJcbiAgICAgICAgRklSRUJBU0VfREFUQUJBU0UucmVmKHRhZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVmJykgKyAnLycgKyBrZXkpLm9uKCd2YWx1ZScsIHNuYXBzaG90ID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHNuYXBzaG90LnZhbCgpO1xyXG4gICAgICAgICAgICB0YWcudGV4dENvbnRlbnQgPSBkYXRhW3RhZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVmLW1vZGVsJyldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gY29udGFpbmVyO1xyXG59XG5cbn0oKSk7XG4iXX0=
