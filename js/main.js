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
            listContainer.innerHTML = '';
            FIREBASE_DATABASE.ref(section.id).on('child_added', function (snapshot) {
                var data = snapshot.val();
                var item = render(section.querySelector('.template'), data);
                if (item && !listContainer.contains(item)) listContainer.insertAdjacentElement('afterBegin', item);
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
                if (tag.tagName === 'DATETIME') {
                    var date = new Date(content);
                    tag.textContent = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear() + ' ' + date.getHours() + 'h' + date.getMinutes();
                } else if (tag.tagName === 'IMG') tag.src = content;else tag.textContent = content;
            }
        });
        return container;
    }
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiZWxlbWVudCIsImNvbmZpZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImV4dGVuZE9iamVjdCIsIm9iaiIsInByb3BzIiwicHJvcCIsImlzT2JqZWN0IiwiZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJzbWFydGZvcm0iLCJxdWVyeVNlbGVjdG9yIiwiSFRNTEVsZW1lbnQiLCJIVE1MRm9ybUVsZW1lbnQiLCJfIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJlbnVtZXJhYmxlIiwiU21hcnRGb3JtIiwic2V0IiwiY2hhbmdlIiwiaW5wdXQiLCJzdWJtaXQiLCJyZXNldCIsInJvb3QiLCJlbGVtZW50cyIsImZvckVhY2giLCJmaWVsZCIsImdldCIsInByb3BlcnR5IiwidmFsdWUiLCJuYW1lIiwiZmlsbCIsImRhdGEiLCJ2YWx1ZU9mIiwianNvbiIsInR5cGUiLCJGSVJFQkFTRV9BVVRIIiwiZmlyZWJhc2UiLCJhdXRoIiwiRklSRUJBU0VfREFUQUJBU0UiLCJkYXRhYmFzZSIsInVpIiwic2lnbkluQnV0dG9uIiwiZXZlbnRzIiwiY2xpY2siLCJzaWduSW4iLCJzaWduT3V0QlV0dG9uIiwic2lnbk91dCIsInVzZXJuYW1lTGFiZWwiLCJzZWN0aW9ucyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJwYWdlTGlua3MiLCJjb21wb3NlIiwic2hvdyIsImhpZGUiLCJlbCIsInJlbW92ZUF0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsImVsZW1lbnQkJDEiLCJmbiIsInJlbmRlclNlY3Rpb24iLCJzZWN0aW9uIiwibGlzdENvbnRhaW5lciIsImlubmVySFRNTCIsInJlZiIsImlkIiwib24iLCJzbmFwc2hvdCIsInZhbCIsIml0ZW0iLCJyZW5kZXIiLCJjb250YWlucyIsImluc2VydEFkamFjZW50RWxlbWVudCIsIm1vZGFsIiwib3BlbkZvcm1CdXR0b24iLCJjbGFzc0xpc3QiLCJhZGQiLCJyZW1vdmUiLCJsaW5rIiwiaGFzaCIsInByZXZlbnREZWZhdWx0Iiwibm9kZXMiLCJvbkF1dGhTdGF0ZUNoYW5nZWQiLCJoYW5kbGVBdXRoU3RhdGVDaGFuZ2VkIiwiYXBwRm9ybXMiLCJ3aW5kb3ciLCJtYXAiLCJmb3JtIiwiZGF0YXNldCIsImFjdGlvbiIsInB1c2giLCJzaWduSW5XaXRoUG9wdXAiLCJHb29nbGVBdXRoUHJvdmlkZXIiLCJ1c2VyIiwidXNlclJlZiIsInVpZCIsIm9uY2UiLCJlbWFpbCIsImRpc3BsYXlOYW1lIiwicGhvdG9VUkwiLCJsYXN0U2lnbkluVGltZSIsIkRhdGUiLCJjaGlsZCIsImNsb25lTm9kZSIsImNvbnNvbGUiLCJsb2ciLCJjb250YWluZXIiLCJjb250ZW50IiwidGFnIiwiZ2V0QXR0cmlidXRlIiwidGFnTmFtZSIsImRhdGUiLCJ0ZXh0Q29udGVudCIsImdldERhdGUiLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwiZ2V0SG91cnMiLCJnZXRNaW51dGVzIiwic3JjIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUMsYUFBWTtBQUNiOztBQUVBLFFBQUlBLFVBQVUsaUJBQVNBLFFBQVQsRUFBa0JDLE1BQWxCLEVBQTBCOztBQUVwQyxZQUFJLE9BQU9ELFFBQVAsS0FBbUIsUUFBdkIsRUFBaUNBLFdBQVVFLFNBQVNDLGFBQVQsQ0FBdUJILFFBQXZCLENBQVY7QUFDakMsWUFBSSxDQUFDQSxRQUFMLEVBQWMsT0FBTyxLQUFQO0FBQ2QsWUFBSSxRQUFPQyxNQUFQLHlDQUFPQSxNQUFQLE9BQWtCLFFBQXRCLEVBQWdDRyxhQUFhSixRQUFiLEVBQXNCQyxNQUF0Qjs7QUFFaEMsaUJBQVNHLFlBQVQsQ0FBc0JDLEdBQXRCLEVBQTJCQyxLQUEzQixFQUFrQzs7QUFFOUIsaUJBQUssSUFBTUMsSUFBWCxJQUFtQkQsS0FBbkIsRUFBMEI7O0FBRXRCLG9CQUFNRSxXQUFXRCxRQUFRRixHQUFSLElBQWUsUUFBT0EsSUFBSUUsSUFBSixDQUFQLE1BQXFCLFFBQXJEO0FBQ0Esb0JBQUlBLFNBQVMsUUFBYixFQUF1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QUE2QjJGLFVBQVV4RCxnQkFBVixDQUEyQixjQUEzQixDQUE3QixFQUF5RSxlQUFPO0FBQzVFLGdCQUFNeUQsVUFBVTNFLEtBQUs0RSxJQUFJQyxZQUFKLENBQWlCLFlBQWpCLENBQUwsQ0FBaEI7QUFDQSxnQkFBSUYsT0FBSixFQUFhO0FBQ1Qsb0JBQUlDLElBQUlFLE9BQUosS0FBZ0IsVUFBcEIsRUFBZ0M7QUFDNUIsd0JBQU1DLE9BQU8sSUFBSVYsSUFBSixDQUFTTSxPQUFULENBQWI7QUFDQUMsd0JBQUlJLFdBQUosR0FBcUJELEtBQUtFLE9BQUwsRUFBckIsU0FBdUNGLEtBQUtHLFFBQUwsRUFBdkMsU0FBMERILEtBQUtJLFdBQUwsRUFBMUQsU0FBZ0ZKLEtBQUtLLFFBQUwsRUFBaEYsU0FBbUdMLEtBQUtNLFVBQUwsRUFBbkc7QUFDSCxpQkFIRCxNQUlLLElBQUlULElBQUlFLE9BQUosS0FBZ0IsS0FBcEIsRUFBMkJGLElBQUlVLEdBQUosR0FBVVgsT0FBVixDQUEzQixLQUNBQyxJQUFJSSxXQUFKLEdBQWtCTCxPQUFsQjtBQUNSO0FBQ0osU0FWRDtBQVdBLGVBQU9ELFNBQVA7QUFDSDtBQUVBLENBdE5BLEdBQUQiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBlbGVtZW50ID0gZnVuY3Rpb24oZWxlbWVudCwgY29uZmlnKSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudCk7XHJcbiAgICBpZiAoIWVsZW1lbnQpIHJldHVybiBmYWxzZTtcclxuICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnb2JqZWN0JykgZXh0ZW5kT2JqZWN0KGVsZW1lbnQsIGNvbmZpZyk7XHJcblxyXG4gICAgZnVuY3Rpb24gZXh0ZW5kT2JqZWN0KG9iaiwgcHJvcHMpIHtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHByb3BzKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBpc09iamVjdCA9IHByb3AgaW4gb2JqICYmIHR5cGVvZiBvYmpbcHJvcF0gPT09ICdvYmplY3QnO1xyXG4gICAgICAgICAgICBpZiAocHJvcCA9PT0gJ2V2ZW50cycpIGZvciAoY29uc3QgZSBpbiBwcm9wc1twcm9wXSkgb2JqLmFkZEV2ZW50TGlzdGVuZXIoZSwgcHJvcHNbcHJvcF1bZV0sIGZhbHNlKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoaXNPYmplY3QpIGV4dGVuZE9iamVjdChvYmpbcHJvcF0sIHByb3BzW3Byb3BdKTtcclxuICAgICAgICAgICAgZWxzZSBvYmpbcHJvcF0gPSBwcm9wc1twcm9wXTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGVsZW1lbnQ7XHJcblxyXG59O1xuXG52YXIgc21hcnRmb3JtID0gZnVuY3Rpb24oZWxlbWVudCwgY29uZmlnKSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCk7XHJcbiAgICBpZiAoIShlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm4gbnVsbDtcclxuICAgIGlmICghKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRm9ybUVsZW1lbnQpKSBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9ybScpO1xyXG5cclxuICAgIGNvbnN0IF8gPSBlbnVtZXJhYmxlID0+IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVudW1lcmFibGUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIFNtYXJ0Rm9ybSh7c2V0LCBjaGFuZ2UsIGlucHV0LCBzdWJtaXQsIHJlc2V0fSkge1xyXG4gICAgICAgIHRoaXMucm9vdCA9IGVsZW1lbnQ7XHJcbiAgICAgICAgaWYgKGNoYW5nZSkgXyhlbGVtZW50LmVsZW1lbnRzKS5mb3JFYWNoKGZpZWxkID0+IHtcclxuICAgICAgICAgICAgZmllbGQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZSkgeyBjaGFuZ2UuY2FsbCh0aGlzLCBlKTsgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKGlucHV0KSBfKGVsZW1lbnQuZWxlbWVudHMpLmZvckVhY2goZmllbGQgPT4ge1xyXG4gICAgICAgICAgICBmaWVsZC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGZ1bmN0aW9uKGUpIHsgaW5wdXQuY2FsbCh0aGlzLCBlKTsgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKHN1Ym1pdCkgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCAoZSkgPT4geyBzdWJtaXQuY2FsbCh0aGlzLCBlKTsgfSk7XHJcbiAgICAgICAgaWYgKHJlc2V0KSAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdyZXNldCcsICAoZSkgPT4geyAgcmVzZXQuY2FsbCh0aGlzLCBlKTsgfSk7XHJcbiAgICAgICAgc2V0ICYmIHNldC5jYWxsKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIFNtYXJ0Rm9ybS5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgZ2V0OiAgICAgZnVuY3Rpb24ocHJvcGVydHkpIHtyZXR1cm4gZWxlbWVudFtwcm9wZXJ0eV07fSxcclxuICAgICAgICBzZXQ6ICAgICBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtlbGVtZW50W3Byb3BlcnR5XSA9IHZhbHVlO30sXHJcbiAgICAgICAgcmVzZXQ6ICAgZnVuY3Rpb24oKSB7ZWxlbWVudC5yZXNldCgpO30sXHJcbiAgICAgICAgZmllbGQ6ICAgZnVuY3Rpb24obmFtZSkge3JldHVybiBlbGVtZW50LmVsZW1lbnRzW25hbWVdfSxcclxuICAgICAgICBmaWxsOiAgICBmdW5jdGlvbihkYXRhKSB7fSxcclxuICAgICAgICB2YWx1ZU9mOiBmdW5jdGlvbihuYW1lKSB7cmV0dXJuIHZhbHVlT2YuY2FsbCh0aGlzLCB0aGlzLmZpZWxkKG5hbWUpKX0sXHJcbiAgICAgICAganNvbjogICAgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICBjb25zdCBqc29uID0ge307XHJcbiAgICAgICAgICAgIF8odGhpcy5yb290LmVsZW1lbnRzKS5mb3JFYWNoKGZpZWxkID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpZWxkKGZpZWxkLm5hbWUpKSBqc29uW2ZpZWxkLm5hbWVdID0gdGhpcy52YWx1ZU9mKGZpZWxkLm5hbWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGpzb247XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFNtYXJ0Rm9ybShjb25maWcpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHZhbHVlT2YoZmllbGQpIHtcclxuXHJcbiAgICAgICAgaWYgKCFmaWVsZCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmaWVsZC52YWx1ZSA9PT0gJ3N0cmluZycpIHJldHVybiBmaWVsZC52YWx1ZTtcclxuXHJcbiAgICB9XHJcblxyXG59O1xuXG5jb25zdCBGSVJFQkFTRV9BVVRIID0gZmlyZWJhc2UuYXV0aCgpO1xyXG5jb25zdCBGSVJFQkFTRV9EQVRBQkFTRSA9IGZpcmViYXNlLmRhdGFiYXNlKCk7XHJcblxyXG5jb25zdCB1aSA9IHtcclxuICAgIHNpZ25JbkJ1dHRvbjogZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2lnbi1pbicpLCB7IGV2ZW50czoge2NsaWNrOiBzaWduSW59IH0pLFxyXG4gICAgc2lnbk91dEJVdHRvbjogZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2lnbi1vdXQnKSwgeyBldmVudHM6IHtjbGljazogc2lnbk91dH0gfSksXHJcbiAgICB1c2VybmFtZUxhYmVsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudXNlcm5hbWUnKSxcclxuICAgIHNlY3Rpb25zOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYXBwLXNlY3Rpb24nKSxcclxuICAgIHBhZ2VMaW5rczogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2UtbGluaycpLFxyXG4gICAgY29tcG9zZTogKHtzaG93LCBoaWRlfSkgPT4ge1xyXG4gICAgICAgIHNob3cgJiYgc2hvdy5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJykpO1xyXG4gICAgICAgIGhpZGUgJiYgaGlkZS5mb3JFYWNoKGVsID0+IGVsLnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgdHJ1ZSkpO1xyXG4gICAgfSxcclxuICAgIHNob3c6IChlbGVtZW50JCQxLCBmbikgPT4ge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudCQkMSA9PT0gJ3N0cmluZycpIGVsZW1lbnQkJDEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGVsZW1lbnQkJDEpO1xyXG4gICAgICAgIGlmIChlbGVtZW50JCQxIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGVsZW1lbnQkJDEucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKTtcclxuICAgICAgICBlbHNlIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWxlbWVudCQkMSwgZWwgPT4gZWwucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKSk7XHJcbiAgICAgICAgZm4gJiYgZm4oZWxlbWVudCQkMSk7XHJcbiAgICB9LFxyXG4gICAgaGlkZTogKGVsZW1lbnQkJDEsIGZuKSA9PiB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50JCQxID09PSAnc3RyaW5nJykgZWxlbWVudCQkMSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZWxlbWVudCQkMSk7XHJcbiAgICAgICAgaWYgKGVsZW1lbnQkJDEgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgZWxlbWVudCQkMS5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsIHRydWUpO1xyXG4gICAgICAgIGVsc2UgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbGVtZW50JCQxLCBlbCA9PiBlbC5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsIHRydWUpKTtcclxuICAgICAgICBmbiAmJiBmbihlbGVtZW50JCQxKTtcclxuICAgIH0sXHJcbiAgICByZW5kZXJTZWN0aW9uOiAoc2VjdGlvbikgPT4ge1xyXG4gICAgICAgIGNvbnN0IGxpc3RDb250YWluZXIgPSBzZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoJy5hcHAtbGlzdCcpO1xyXG4gICAgICAgIGxpc3RDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgRklSRUJBU0VfREFUQUJBU0UucmVmKHNlY3Rpb24uaWQpLm9uKCdjaGlsZF9hZGRlZCcsIHNuYXBzaG90ID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHNuYXBzaG90LnZhbCgpO1xyXG4gICAgICAgICAgICBjb25zdCBpdGVtID0gcmVuZGVyKHNlY3Rpb24ucXVlcnlTZWxlY3RvcignLnRlbXBsYXRlJyksIGRhdGEpO1xyXG4gICAgICAgICAgICBpZiAoaXRlbSAmJiAhbGlzdENvbnRhaW5lci5jb250YWlucyhpdGVtKSkgbGlzdENvbnRhaW5lci5pbnNlcnRBZGphY2VudEVsZW1lbnQoJ2FmdGVyQmVnaW4nLCBpdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBtb2RhbCA9IHNlY3Rpb24ucXVlcnlTZWxlY3RvcignW2RhdGEtbW9kYWxdJyk7XHJcbiAgICAgICAgY29uc3Qgb3BlbkZvcm1CdXR0b24gPSBzZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoJy5vcGVuLWZvcm0nKTtcclxuICAgICAgICBpZiAob3BlbkZvcm1CdXR0b24gJiYgbW9kYWwpIHtcclxuICAgICAgICAgICAgb3BlbkZvcm1CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ29uJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBtb2RhbC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1idG5+PVwiZmVjaGFyXCJdJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIG1vZGFsLmNsYXNzTGlzdC5yZW1vdmUoJ29uJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodWkucGFnZUxpbmtzLCBsaW5rID0+IGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAodGhpcy5oYXNoKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHVpLmhpZGUodWkuc2VjdGlvbnMpO1xyXG4gICAgICAgIHVpLnNob3codGhpcy5oYXNoLCBub2RlcyA9PiB1aS5yZW5kZXJTZWN0aW9uKG5vZGVzWzBdKSk7XHJcbiAgICB9XHJcbn0pKTtcclxuXHJcbkZJUkVCQVNFX0FVVEgub25BdXRoU3RhdGVDaGFuZ2VkKGhhbmRsZUF1dGhTdGF0ZUNoYW5nZWQpO1xyXG5cclxuY29uc3QgYXBwRm9ybXMgPSB3aW5kb3cuYXBwRm9ybXMgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnZm9ybScpLCBmb3JtID0+IHNtYXJ0Zm9ybShmb3JtLCB7XHJcbiAgICBzZXQ6ICAgIGZ1bmN0aW9uKCkge30sXHJcbiAgICBjaGFuZ2U6IGZ1bmN0aW9uKGUpIHt9LFxyXG4gICAgaW5wdXQ6ICBmdW5jdGlvbihlKSB7fSxcclxuICAgIHN1Ym1pdDogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBGSVJFQkFTRV9EQVRBQkFTRS5yZWYodGhpcy5yb290LmRhdGFzZXQuYWN0aW9uKS5wdXNoKHRoaXMuanNvbigpKTtcclxuICAgICAgICB0aGlzLnJvb3QucmVzZXQoKTtcclxuICAgIH0sXHJcbiAgICByZXNldDogIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1vZGFsXS5vbicpLCBtb2RhbCA9PiBtb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdvbicpKTtcclxuICAgIH1cclxufSkpO1xyXG5cclxuZnVuY3Rpb24gc2lnbkluKCkge1xyXG4gICAgRklSRUJBU0VfQVVUSC5zaWduSW5XaXRoUG9wdXAoIG5ldyBmaXJlYmFzZS5hdXRoLkdvb2dsZUF1dGhQcm92aWRlcigpICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpZ25PdXQoKSB7XHJcbiAgICBGSVJFQkFTRV9BVVRILnNpZ25PdXQoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlQXV0aFN0YXRlQ2hhbmdlZCh1c2VyKSB7XHJcblxyXG4gICAgdWkuaGlkZSh1aS5zZWN0aW9ucyk7XHJcbiAgICB1aS5oaWRlKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNncmVldGluZ3MgLmxvYWRpbmcnKSk7XHJcblxyXG4gICAgaWYgKHVzZXIpIHtcclxuXHJcbiAgICAgICAgY29uc3QgdXNlclJlZiA9IEZJUkVCQVNFX0RBVEFCQVNFLnJlZihgdXNlcnMvJHt1c2VyLnVpZH1gKTtcclxuICAgICAgICB1c2VyUmVmLm9uY2UoJ3ZhbHVlJywgc25hcHNob3QgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXNuYXBzaG90LnZhbCgpKSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyUmVmLnNldCh7XHJcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IHVzZXIuZGlzcGxheU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcGhvdG9VUkw6IHVzZXIucGhvdG9VUkwsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFNpZ25JblRpbWU6IERhdGUoKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyUmVmLmNoaWxkKCdsYXN0U2lnbkluVGltZScpLnNldChEYXRlKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHVpLmNvbXBvc2Uoe1xyXG4gICAgICAgICAgICBzaG93OiBbdWkuc2lnbk91dEJVdHRvbl0sXHJcbiAgICAgICAgICAgIGhpZGU6IFt1aS5zaWduSW5CdXR0b25dXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdWkudXNlcm5hbWVMYWJlbC5pbm5lckhUTUwgPSBgPHNwYW4gZGF0YS1ibG9jaz1cImlubGluZSBjaXJjXCI+PGltZyBzcmM9XCIke3VzZXIucGhvdG9VUkx9XCIgaGVpZ2h0PVwiMjVcIj48L3NwYW4+XHJcbiAgICAgICAgICAgIDxzbWFsbCB0aXRsZT1cIiR7dXNlci5lbWFpbH1cIiBjbGFzcz1cImRpc3BsYXktbmFtZVwiPiR7dXNlci5kaXNwbGF5TmFtZX08L3NtYWxsPmA7XHJcbiAgICAgICAgdWkuc2hvdyh1aS5wYWdlTGlua3MpO1xyXG4gICAgICAgIHVpLnNob3coJyNwcm9qZWN0cycsIG5vZGVzID0+IHVpLnJlbmRlclNlY3Rpb24obm9kZXNbMF0pKTtcclxuXHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB1aS5jb21wb3NlKHtcclxuICAgICAgICAgICAgaGlkZTogW3VpLnNpZ25PdXRCVXR0b25dLFxyXG4gICAgICAgICAgICBzaG93OiBbdWkuc2lnbkluQnV0dG9uXVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHVpLnVzZXJuYW1lTGFiZWwuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgdWkuaGlkZSh1aS5wYWdlTGlua3MpO1xyXG4gICAgICAgIHVpLnNob3coJyNncmVldGluZ3MnKTtcclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXIoZWxlbWVudCQkMSwgZGF0YSkge1xyXG4gICAgaWYgKCFlbGVtZW50JCQxIHx8ICFlbGVtZW50JCQxLmNsb25lTm9kZSkgcmV0dXJuIGNvbnNvbGUubG9nKCdUZW1wbGF0ZSBuw6NvIGVuY29udHJhZG8hJywgZWxlbWVudCQkMSwgZGF0YSk7XHJcbiAgICBjb25zdCBjb250YWluZXIgPSBlbGVtZW50JCQxLmNsb25lTm9kZSh0cnVlKTtcclxuICAgIGNvbnRhaW5lci5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpO1xyXG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbW9kZWxdJyksIHRhZyA9PiB7XHJcbiAgICAgICAgY29uc3QgY29udGVudCA9IGRhdGFbdGFnLmdldEF0dHJpYnV0ZSgnZGF0YS1tb2RlbCcpXTtcclxuICAgICAgICBpZiAoY29udGVudCkge1xyXG4gICAgICAgICAgICBpZiAodGFnLnRhZ05hbWUgPT09ICdEQVRFVElNRScpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShjb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHRhZy50ZXh0Q29udGVudCA9IGAke2RhdGUuZ2V0RGF0ZSgpfS8ke2RhdGUuZ2V0TW9udGgoKX0vJHtkYXRlLmdldEZ1bGxZZWFyKCl9ICR7ZGF0ZS5nZXRIb3VycygpfWgke2RhdGUuZ2V0TWludXRlcygpfWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodGFnLnRhZ05hbWUgPT09ICdJTUcnKSB0YWcuc3JjID0gY29udGVudDtcclxuICAgICAgICAgICAgZWxzZSB0YWcudGV4dENvbnRlbnQgPSBjb250ZW50O1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGNvbnRhaW5lcjtcclxufVxuXG59KCkpO1xuIl19
