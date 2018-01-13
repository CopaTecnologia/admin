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

    ui.pageLinks.forEach(function (link) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiZWxlbWVudCIsImNvbmZpZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImV4dGVuZE9iamVjdCIsIm9iaiIsInByb3BzIiwicHJvcCIsImlzT2JqZWN0IiwiZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJzbWFydGZvcm0iLCJxdWVyeVNlbGVjdG9yIiwiSFRNTEVsZW1lbnQiLCJIVE1MRm9ybUVsZW1lbnQiLCJfIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJlbnVtZXJhYmxlIiwiU21hcnRGb3JtIiwic2V0IiwiY2hhbmdlIiwiaW5wdXQiLCJzdWJtaXQiLCJyZXNldCIsInJvb3QiLCJlbGVtZW50cyIsImZvckVhY2giLCJmaWVsZCIsImdldCIsInByb3BlcnR5IiwidmFsdWUiLCJuYW1lIiwiZmlsbCIsImRhdGEiLCJ2YWx1ZU9mIiwianNvbiIsInR5cGUiLCJGSVJFQkFTRV9BVVRIIiwiZmlyZWJhc2UiLCJhdXRoIiwiRklSRUJBU0VfREFUQUJBU0UiLCJkYXRhYmFzZSIsInVpIiwic2lnbkluQnV0dG9uIiwiZXZlbnRzIiwiY2xpY2siLCJzaWduSW4iLCJzaWduT3V0QlV0dG9uIiwic2lnbk91dCIsInVzZXJuYW1lTGFiZWwiLCJzZWN0aW9ucyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJwYWdlTGlua3MiLCJjb21wb3NlIiwic2hvdyIsImhpZGUiLCJlbCIsInJlbW92ZUF0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsImVsZW1lbnQkJDEiLCJmbiIsInJlbmRlclNlY3Rpb24iLCJzZWN0aW9uIiwibGlzdENvbnRhaW5lciIsImlubmVySFRNTCIsInJlZiIsImlkIiwib24iLCJzbmFwc2hvdCIsInZhbCIsIml0ZW0iLCJyZW5kZXIiLCJjb250YWlucyIsImluc2VydEFkamFjZW50RWxlbWVudCIsIm1vZGFsIiwib3BlbkZvcm1CdXR0b24iLCJjbGFzc0xpc3QiLCJhZGQiLCJyZW1vdmUiLCJsaW5rIiwiaGFzaCIsInByZXZlbnREZWZhdWx0Iiwibm9kZXMiLCJvbkF1dGhTdGF0ZUNoYW5nZWQiLCJoYW5kbGVBdXRoU3RhdGVDaGFuZ2VkIiwiYXBwRm9ybXMiLCJ3aW5kb3ciLCJtYXAiLCJmb3JtIiwiZGF0YXNldCIsImFjdGlvbiIsInB1c2giLCJzaWduSW5XaXRoUG9wdXAiLCJHb29nbGVBdXRoUHJvdmlkZXIiLCJ1c2VyIiwidXNlclJlZiIsInVpZCIsIm9uY2UiLCJlbWFpbCIsImRpc3BsYXlOYW1lIiwicGhvdG9VUkwiLCJsYXN0U2lnbkluVGltZSIsIkRhdGUiLCJjaGlsZCIsImNsb25lTm9kZSIsImNvbnNvbGUiLCJsb2ciLCJjb250YWluZXIiLCJjb250ZW50IiwidGFnIiwiZ2V0QXR0cmlidXRlIiwidGFnTmFtZSIsImRhdGUiLCJ0ZXh0Q29udGVudCIsImdldERhdGUiLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwiZ2V0SG91cnMiLCJnZXRNaW51dGVzIiwic3JjIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUMsYUFBWTtBQUNiOztBQUVBLFFBQUlBLFVBQVUsaUJBQVNBLFFBQVQsRUFBa0JDLE1BQWxCLEVBQTBCOztBQUVwQyxZQUFJLE9BQU9ELFFBQVAsS0FBbUIsUUFBdkIsRUFBaUNBLFdBQVVFLFNBQVNDLGFBQVQsQ0FBdUJILFFBQXZCLENBQVY7QUFDakMsWUFBSSxDQUFDQSxRQUFMLEVBQWMsT0FBTyxLQUFQO0FBQ2QsWUFBSSxRQUFPQyxNQUFQLHlDQUFPQSxNQUFQLE9BQWtCLFFBQXRCLEVBQWdDRyxhQUFhSixRQUFiLEVBQXNCQyxNQUF0Qjs7QUFFaEMsaUJBQVNHLFlBQVQsQ0FBc0JDLEdBQXRCLEVBQTJCQyxLQUEzQixFQUFrQzs7QUFFOUIsaUJBQUssSUFBTUMsSUFBWCxJQUFtQkQsS0FBbkIsRUFBMEI7O0FBRXRCLG9CQUFNRSxXQUFXRCxRQUFRRixHQUFSLElBQWUsUUFBT0EsSUFBSUUsSUFBSixDQUFQLE1BQXFCLFFBQXJEO0FBQ0Esb0JBQUlBLFNBQVMsUUFBYixFQUF1QixLQUFLLElBQU1FLENBQVgsSUFBZ0JILE1BQU1DLElBQU4sQ0FBaEI7QUFBNkJGLHdCQUFJSyxnQkFBSixDQUFxQkQsQ0FBckIsRUFBd0JILE1BQU1DLElBQU4sRUFBWUUsQ0FBWixDQUF4QixFQUF3QyxLQUF4QztBQUE3QixpQkFBdkIsTUFDSyxJQUFJRCxRQUFKLEVBQWNKLGFBQWFDLElBQUlFLElBQUosQ0FBYixFQUF3QkQsTUFBTUMsSUFBTixDQUF4QixFQUFkLEtBQ0FGLElBQUlFLElBQUosSUFBWUQsTUFBTUMsSUFBTixDQUFaO0FBRVI7QUFFSjs7QUFFRCxlQUFPUCxRQUFQO0FBRUgsS0FyQkQ7O0FBdUJBLFFBQUlXLFlBQVksU0FBWkEsU0FBWSxDQUFTWCxPQUFULEVBQWtCQyxNQUFsQixFQUEwQjs7QUFFdEMsWUFBSSxPQUFPRCxPQUFQLEtBQW1CLFFBQXZCLEVBQWlDQSxVQUFVRSxTQUFTVSxhQUFULENBQXVCWixPQUF2QixDQUFWO0FBQ2pDLFlBQUksRUFBRUEsbUJBQW1CYSxXQUFyQixDQUFKLEVBQXVDLE9BQU8sSUFBUDtBQUN2QyxZQUFJLEVBQUViLG1CQUFtQmMsZUFBckIsQ0FBSixFQUEyQ2QsVUFBVUUsU0FBU1UsYUFBVCxDQUF1QixNQUF2QixDQUFWOztBQUUzQyxZQUFNRyxJQUFJLFNBQUpBLENBQUk7QUFBQSxtQkFBY0MsTUFBTUMsU0FBTixDQUFnQkMsS0FBaEIsQ0FBc0JDLElBQXRCLENBQTJCQyxVQUEzQixDQUFkO0FBQUEsU0FBVjs7QUFFQSxpQkFBU0MsU0FBVCxPQUF3RDtBQUFBOztBQUFBLGdCQUFwQ0MsR0FBb0MsUUFBcENBLEdBQW9DO0FBQUEsZ0JBQS9CQyxNQUErQixRQUEvQkEsTUFBK0I7QUFBQSxnQkFBdkJDLEtBQXVCLFFBQXZCQSxLQUF1QjtBQUFBLGdCQUFoQkMsTUFBZ0IsUUFBaEJBLE1BQWdCO0FBQUEsZ0JBQVJDLEtBQVEsUUFBUkEsS0FBUTs7QUFDcEQsaUJBQUtDLElBQUwsR0FBWTNCLE9BQVo7QUFDQSxnQkFBSXVCLE1BQUosRUFBWVIsRUFBRWYsUUFBUTRCLFFBQVYsRUFBb0JDLE9BQXBCLENBQTRCLGlCQUFTO0FBQzdDQyxzQkFBTXBCLGdCQUFOLENBQXVCLFFBQXZCLEVBQWlDLFVBQVNELENBQVQsRUFBWTtBQUFFYywyQkFBT0osSUFBUCxDQUFZLElBQVosRUFBa0JWLENBQWxCO0FBQXVCLGlCQUF0RTtBQUNILGFBRlc7QUFHWixnQkFBSWUsS0FBSixFQUFXVCxFQUFFZixRQUFRNEIsUUFBVixFQUFvQkMsT0FBcEIsQ0FBNEIsaUJBQVM7QUFDNUNDLHNCQUFNcEIsZ0JBQU4sQ0FBdUIsT0FBdkIsRUFBZ0MsVUFBU0QsQ0FBVCxFQUFZO0FBQUVlLDBCQUFNTCxJQUFOLENBQVcsSUFBWCxFQUFpQlYsQ0FBakI7QUFBc0IsaUJBQXBFO0FBQ0gsYUFGVTtBQUdYLGdCQUFJZ0IsTUFBSixFQUFZekIsUUFBUVUsZ0JBQVIsQ0FBeUIsUUFBekIsRUFBbUMsVUFBQ0QsQ0FBRCxFQUFPO0FBQUVnQix1QkFBT04sSUFBUCxRQUFrQlYsQ0FBbEI7QUFBdUIsYUFBbkU7QUFDWixnQkFBSWlCLEtBQUosRUFBWTFCLFFBQVFVLGdCQUFSLENBQXlCLE9BQXpCLEVBQW1DLFVBQUNELENBQUQsRUFBTztBQUFHaUIsc0JBQU1QLElBQU4sUUFBaUJWLENBQWpCO0FBQXNCLGFBQW5FO0FBQ1phLG1CQUFPQSxJQUFJSCxJQUFKLENBQVMsSUFBVCxDQUFQO0FBQ0g7O0FBRURFLGtCQUFVSixTQUFWLEdBQXNCO0FBQ2xCYyxpQkFBUyxhQUFTQyxRQUFULEVBQW1CO0FBQUMsdUJBQU9oQyxRQUFRZ0MsUUFBUixDQUFQO0FBQTBCLGFBRHJDO0FBRWxCVixpQkFBUyxhQUFTVSxRQUFULEVBQW1CQyxLQUFuQixFQUEwQjtBQUFDakMsd0JBQVFnQyxRQUFSLElBQW9CQyxLQUFwQjtBQUEyQixhQUY3QztBQUdsQlAsbUJBQVMsaUJBQVc7QUFBQzFCLHdCQUFRMEIsS0FBUjtBQUFpQixhQUhwQjtBQUlsQkksbUJBQVMsZUFBU0ksSUFBVCxFQUFlO0FBQUMsdUJBQU9sQyxRQUFRNEIsUUFBUixDQUFpQk0sSUFBakIsQ0FBUDtBQUE4QixhQUpyQztBQUtsQkMsa0JBQVMsY0FBU0MsSUFBVCxFQUFlLENBQUUsQ0FMUjtBQU1sQkMscUJBQVMsaUJBQVNILElBQVQsRUFBZTtBQUFDLHVCQUFPRyxTQUFRbEIsSUFBUixDQUFhLElBQWIsRUFBbUIsS0FBS1csS0FBTCxDQUFXSSxJQUFYLENBQW5CLENBQVA7QUFBNEMsYUFObkQ7QUFPbEJJLGtCQUFTLGNBQVNDLElBQVQsRUFBZTtBQUFBOztBQUNwQixvQkFBTUQsT0FBTyxFQUFiO0FBQ0F2QixrQkFBRSxLQUFLWSxJQUFMLENBQVVDLFFBQVosRUFBc0JDLE9BQXRCLENBQThCLGlCQUFTO0FBQ25DLHdCQUFJLE9BQUtDLEtBQUwsQ0FBV0EsTUFBTUksSUFBakIsQ0FBSixFQUE0QkksS0FBS1IsTUFBTUksSUFBWCxJQUFtQixPQUFLRyxPQUFMLENBQWFQLE1BQU1JLElBQW5CLENBQW5CO0FBQy9CLGlCQUZEO0FBR0EsdUJBQU9JLElBQVA7QUFDSDtBQWJpQixTQUF0Qjs7QUFnQkEsZUFBTyxJQUFJakIsU0FBSixDQUFjcEIsTUFBZCxDQUFQOztBQUVBLGlCQUFTb0MsUUFBVCxDQUFpQlAsS0FBakIsRUFBd0I7O0FBRXBCLGdCQUFJLENBQUNBLEtBQUwsRUFBWSxPQUFPLElBQVA7QUFDWixnQkFBSSxPQUFPQSxNQUFNRyxLQUFiLEtBQXVCLFFBQTNCLEVBQXFDLE9BQU9ILE1BQU1HLEtBQWI7QUFFeEM7QUFFSixLQTlDRDs7QUFnREEsUUFBTU8sZ0JBQWdCQyxTQUFTQyxJQUFULEVBQXRCO0FBQ0EsUUFBTUMsb0JBQW9CRixTQUFTRyxRQUFULEVBQTFCOztBQUVBLFFBQU1DLEtBQUs7QUFDUEMsc0JBQWM5QyxRQUFRRSxTQUFTVSxhQUFULENBQXVCLFVBQXZCLENBQVIsRUFBNEMsRUFBRW1DLFFBQVEsRUFBQ0MsT0FBT0MsTUFBUixFQUFWLEVBQTVDLENBRFA7QUFFUEMsdUJBQWVsRCxRQUFRRSxTQUFTVSxhQUFULENBQXVCLFdBQXZCLENBQVIsRUFBNkMsRUFBRW1DLFFBQVEsRUFBQ0MsT0FBT0csT0FBUixFQUFWLEVBQTdDLENBRlI7QUFHUEMsdUJBQWVsRCxTQUFTVSxhQUFULENBQXVCLFdBQXZCLENBSFI7QUFJUHlDLGtCQUFVbkQsU0FBU29ELGdCQUFULENBQTBCLGNBQTFCLENBSkg7QUFLUEMsbUJBQVdyRCxTQUFTb0QsZ0JBQVQsQ0FBMEIsWUFBMUIsQ0FMSjtBQU1QRSxpQkFBUyx3QkFBa0I7QUFBQSxnQkFBaEJDLElBQWdCLFNBQWhCQSxJQUFnQjtBQUFBLGdCQUFWQyxJQUFVLFNBQVZBLElBQVU7O0FBQ3ZCRCxvQkFBUUEsS0FBSzVCLE9BQUwsQ0FBYTtBQUFBLHVCQUFNOEIsR0FBR0MsZUFBSCxDQUFtQixRQUFuQixDQUFOO0FBQUEsYUFBYixDQUFSO0FBQ0FGLG9CQUFRQSxLQUFLN0IsT0FBTCxDQUFhO0FBQUEsdUJBQU04QixHQUFHRSxZQUFILENBQWdCLFFBQWhCLEVBQTBCLElBQTFCLENBQU47QUFBQSxhQUFiLENBQVI7QUFDSCxTQVRNO0FBVVBKLGNBQU0sY0FBQ0ssVUFBRCxFQUFhQyxFQUFiLEVBQW9CO0FBQ3RCLGdCQUFJLE9BQU9ELFVBQVAsS0FBc0IsUUFBMUIsRUFBb0NBLGFBQWE1RCxTQUFTb0QsZ0JBQVQsQ0FBMEJRLFVBQTFCLENBQWI7QUFDcEMsZ0JBQUlBLHNCQUFzQmpELFdBQTFCLEVBQXVDaUQsV0FBV0YsZUFBWCxDQUEyQixRQUEzQixFQUF2QyxLQUNLNUMsTUFBTUMsU0FBTixDQUFnQlksT0FBaEIsQ0FBd0JWLElBQXhCLENBQTZCMkMsVUFBN0IsRUFBeUM7QUFBQSx1QkFBTUgsR0FBR0MsZUFBSCxDQUFtQixRQUFuQixDQUFOO0FBQUEsYUFBekM7QUFDTEcsa0JBQU1BLEdBQUdELFVBQUgsQ0FBTjtBQUNILFNBZk07QUFnQlBKLGNBQU0sY0FBQ0ksVUFBRCxFQUFhQyxFQUFiLEVBQW9CO0FBQ3RCLGdCQUFJLE9BQU9ELFVBQVAsS0FBc0IsUUFBMUIsRUFBb0NBLGFBQWE1RCxTQUFTb0QsZ0JBQVQsQ0FBMEJRLFVBQTFCLENBQWI7QUFDcEMsZ0JBQUlBLHNCQUFzQmpELFdBQTFCLEVBQXVDaUQsV0FBV0QsWUFBWCxDQUF3QixRQUF4QixFQUFrQyxJQUFsQyxFQUF2QyxLQUNLN0MsTUFBTUMsU0FBTixDQUFnQlksT0FBaEIsQ0FBd0JWLElBQXhCLENBQTZCMkMsVUFBN0IsRUFBeUM7QUFBQSx1QkFBTUgsR0FBR0UsWUFBSCxDQUFnQixRQUFoQixFQUEwQixJQUExQixDQUFOO0FBQUEsYUFBekM7QUFDTEUsa0JBQU1BLEdBQUdELFVBQUgsQ0FBTjtBQUNILFNBckJNO0FBc0JQRSx1QkFBZSx1QkFBQ0MsT0FBRCxFQUFhO0FBQ3hCLGdCQUFNQyxnQkFBZ0JELFFBQVFyRCxhQUFSLENBQXNCLFdBQXRCLENBQXRCO0FBQ0FzRCwwQkFBY0MsU0FBZCxHQUEwQixFQUExQjtBQUNBeEIsOEJBQWtCeUIsR0FBbEIsQ0FBc0JILFFBQVFJLEVBQTlCLEVBQWtDQyxFQUFsQyxDQUFxQyxhQUFyQyxFQUFvRCxvQkFBWTtBQUM1RCxvQkFBTWxDLE9BQU9tQyxTQUFTQyxHQUFULEVBQWI7QUFDQSxvQkFBTUMsT0FBT0MsT0FBT1QsUUFBUXJELGFBQVIsQ0FBc0IsV0FBdEIsQ0FBUCxFQUEyQ3dCLElBQTNDLENBQWI7QUFDQSxvQkFBSXFDLFFBQVEsQ0FBQ1AsY0FBY1MsUUFBZCxDQUF1QkYsSUFBdkIsQ0FBYixFQUEyQ1AsY0FBY1UscUJBQWQsQ0FBb0MsWUFBcEMsRUFBa0RILElBQWxEO0FBQzlDLGFBSkQ7QUFLQSxnQkFBTUksUUFBUVosUUFBUXJELGFBQVIsQ0FBc0IsY0FBdEIsQ0FBZDtBQUNBLGdCQUFNa0UsaUJBQWlCYixRQUFRckQsYUFBUixDQUFzQixZQUF0QixDQUF2QjtBQUNBLGdCQUFJa0Usa0JBQWtCRCxLQUF0QixFQUE2QjtBQUN6QkMsK0JBQWVwRSxnQkFBZixDQUFnQyxPQUFoQyxFQUF5QyxZQUFXO0FBQ2hEbUUsMEJBQU1FLFNBQU4sQ0FBZ0JDLEdBQWhCLENBQW9CLElBQXBCO0FBQ0gsaUJBRkQ7QUFHQUgsc0JBQU1qRSxhQUFOLENBQW9CLHNCQUFwQixFQUE0Q0YsZ0JBQTVDLENBQTZELE9BQTdELEVBQXNFLFlBQVc7QUFDN0VtRSwwQkFBTUUsU0FBTixDQUFnQkUsTUFBaEIsQ0FBdUIsSUFBdkI7QUFDSCxpQkFGRDtBQUdIO0FBQ0o7QUF4Q00sS0FBWDs7QUEyQ0FwQyxPQUFHVSxTQUFILENBQWExQixPQUFiLENBQXFCO0FBQUEsZUFBUXFELEtBQUt4RSxnQkFBTCxDQUFzQixPQUF0QixFQUErQixVQUFTRCxDQUFULEVBQVk7QUFDcEUsZ0JBQUksS0FBSzBFLElBQVQsRUFBZTtBQUNYMUUsa0JBQUUyRSxjQUFGO0FBQ0F2QyxtQkFBR2EsSUFBSCxDQUFRYixHQUFHUSxRQUFYO0FBQ0FSLG1CQUFHWSxJQUFILENBQVEsS0FBSzBCLElBQWIsRUFBbUI7QUFBQSwyQkFBU3RDLEdBQUdtQixhQUFILENBQWlCcUIsTUFBTSxDQUFOLENBQWpCLENBQVQ7QUFBQSxpQkFBbkI7QUFDSDtBQUNKLFNBTjRCLENBQVI7QUFBQSxLQUFyQjs7QUFRQTdDLGtCQUFjOEMsa0JBQWQsQ0FBaUNDLHNCQUFqQzs7QUFFQSxRQUFNQyxXQUFXQyxPQUFPRCxRQUFQLEdBQWtCeEUsTUFBTUMsU0FBTixDQUFnQnlFLEdBQWhCLENBQW9CdkUsSUFBcEIsQ0FBeUJqQixTQUFTb0QsZ0JBQVQsQ0FBMEIsTUFBMUIsQ0FBekIsRUFBNEQ7QUFBQSxlQUFRM0MsVUFBVWdGLElBQVYsRUFBZ0I7QUFDbkhyRSxpQkFBUSxlQUFXLENBQUUsQ0FEOEY7QUFFbkhDLG9CQUFRLGdCQUFTZCxDQUFULEVBQVksQ0FBRSxDQUY2RjtBQUduSGUsbUJBQVEsZUFBU2YsQ0FBVCxFQUFZLENBQUUsQ0FINkY7QUFJbkhnQixvQkFBUSxnQkFBU2hCLENBQVQsRUFBWTtBQUNoQkEsa0JBQUUyRSxjQUFGO0FBQ0F6QyxrQ0FBa0J5QixHQUFsQixDQUFzQixLQUFLekMsSUFBTCxDQUFVaUUsT0FBVixDQUFrQkMsTUFBeEMsRUFBZ0RDLElBQWhELENBQXFELEtBQUt4RCxJQUFMLEVBQXJEO0FBQ0EscUJBQUtYLElBQUwsQ0FBVUQsS0FBVjtBQUNILGFBUmtIO0FBU25IQSxtQkFBUSxlQUFTakIsQ0FBVCxFQUFZO0FBQ2hCTyxzQkFBTUMsU0FBTixDQUFnQlksT0FBaEIsQ0FBd0JWLElBQXhCLENBQTZCakIsU0FBU29ELGdCQUFULENBQTBCLGlCQUExQixDQUE3QixFQUEyRTtBQUFBLDJCQUFTdUIsTUFBTUUsU0FBTixDQUFnQkUsTUFBaEIsQ0FBdUIsSUFBdkIsQ0FBVDtBQUFBLGlCQUEzRTtBQUNIO0FBWGtILFNBQWhCLENBQVI7QUFBQSxLQUE1RCxDQUFuQzs7QUFjQSxhQUFTaEMsTUFBVCxHQUFrQjtBQUNkVCxzQkFBY3VELGVBQWQsQ0FBK0IsSUFBSXRELFNBQVNDLElBQVQsQ0FBY3NELGtCQUFsQixFQUEvQjtBQUNIOztBQUVELGFBQVM3QyxPQUFULEdBQW1CO0FBQ2ZYLHNCQUFjVyxPQUFkO0FBQ0g7O0FBRUQsYUFBU29DLHNCQUFULENBQWdDVSxJQUFoQyxFQUFzQzs7QUFFbENwRCxXQUFHYSxJQUFILENBQVFiLEdBQUdRLFFBQVg7QUFDQVIsV0FBR2EsSUFBSCxDQUFReEQsU0FBU1UsYUFBVCxDQUF1QixxQkFBdkIsQ0FBUjs7QUFFQSxZQUFJcUYsSUFBSixFQUFVOztBQUVOLGdCQUFNQyxVQUFVdkQsa0JBQWtCeUIsR0FBbEIsWUFBK0I2QixLQUFLRSxHQUFwQyxDQUFoQjtBQUNBRCxvQkFBUUUsSUFBUixDQUFhLE9BQWIsRUFBc0Isb0JBQVk7QUFDOUIsb0JBQUksQ0FBQzdCLFNBQVNDLEdBQVQsRUFBTCxFQUFxQjtBQUNqQjBCLDRCQUFRNUUsR0FBUixDQUFZO0FBQ1IrRSwrQkFBT0osS0FBS0ksS0FESjtBQUVSQyxxQ0FBYUwsS0FBS0ssV0FGVjtBQUdSQyxrQ0FBVU4sS0FBS00sUUFIUDtBQUlSQyx3Q0FBZ0JDO0FBSlIscUJBQVo7QUFNSCxpQkFQRCxNQVFLO0FBQ0RQLDRCQUFRUSxLQUFSLENBQWMsZ0JBQWQsRUFBZ0NwRixHQUFoQyxDQUFvQ21GLE1BQXBDO0FBQ0g7QUFDSixhQVpEOztBQWNBNUQsZUFBR1csT0FBSCxDQUFXO0FBQ1BDLHNCQUFNLENBQUNaLEdBQUdLLGFBQUosQ0FEQztBQUVQUSxzQkFBTSxDQUFDYixHQUFHQyxZQUFKO0FBRkMsYUFBWDtBQUlBRCxlQUFHTyxhQUFILENBQWlCZSxTQUFqQixpREFBeUU4QixLQUFLTSxRQUE5RSx5REFDb0JOLEtBQUtJLEtBRHpCLCtCQUN3REosS0FBS0ssV0FEN0Q7QUFFQXpELGVBQUdZLElBQUgsQ0FBUVosR0FBR1UsU0FBWDtBQUNBVixlQUFHWSxJQUFILENBQVEsV0FBUixFQUFxQjtBQUFBLHVCQUFTWixHQUFHbUIsYUFBSCxDQUFpQnFCLE1BQU0sQ0FBTixDQUFqQixDQUFUO0FBQUEsYUFBckI7QUFFSCxTQTFCRCxNQTJCSztBQUNEeEMsZUFBR1csT0FBSCxDQUFXO0FBQ1BFLHNCQUFNLENBQUNiLEdBQUdLLGFBQUosQ0FEQztBQUVQTyxzQkFBTSxDQUFDWixHQUFHQyxZQUFKO0FBRkMsYUFBWDtBQUlBRCxlQUFHTyxhQUFILENBQWlCZSxTQUFqQixHQUE2QixFQUE3QjtBQUNBdEIsZUFBR2EsSUFBSCxDQUFRYixHQUFHVSxTQUFYO0FBQ0FWLGVBQUdZLElBQUgsQ0FBUSxZQUFSO0FBQ0g7QUFFSjs7QUFFRCxhQUFTaUIsTUFBVCxDQUFnQlosVUFBaEIsRUFBNEIxQixJQUE1QixFQUFrQztBQUM5QixZQUFJLENBQUMwQixVQUFELElBQWUsQ0FBQ0EsV0FBVzZDLFNBQS9CLEVBQTBDLE9BQU9DLFFBQVFDLEdBQVIsQ0FBWSwwQkFBWixFQUF3Qy9DLFVBQXhDLEVBQW9EMUIsSUFBcEQsQ0FBUDtBQUMxQyxZQUFNMEUsWUFBWWhELFdBQVc2QyxTQUFYLENBQXFCLElBQXJCLENBQWxCO0FBQ0FHLGtCQUFVbEQsZUFBVixDQUEwQixRQUExQjtBQUNBNUMsY0FBTUMsU0FBTixDQUFnQlksT0FBaEIsQ0FBd0JWLElBQXhCLENBQTZCMkYsVUFBVXhELGdCQUFWLENBQTJCLGNBQTNCLENBQTdCLEVBQXlFLGVBQU87QUFDNUUsZ0JBQU15RCxVQUFVM0UsS0FBSzRFLElBQUlDLFlBQUosQ0FBaUIsWUFBakIsQ0FBTCxDQUFoQjtBQUNBLGdCQUFJRixPQUFKLEVBQWE7QUFDVCxvQkFBSUMsSUFBSUUsT0FBSixLQUFnQixVQUFwQixFQUFnQztBQUM1Qix3QkFBTUMsT0FBTyxJQUFJVixJQUFKLENBQVNNLE9BQVQsQ0FBYjtBQUNBQyx3QkFBSUksV0FBSixHQUFxQkQsS0FBS0UsT0FBTCxFQUFyQixTQUF1Q0YsS0FBS0csUUFBTCxFQUF2QyxTQUEwREgsS0FBS0ksV0FBTCxFQUExRCxTQUFnRkosS0FBS0ssUUFBTCxFQUFoRixTQUFtR0wsS0FBS00sVUFBTCxFQUFuRztBQUNILGlCQUhELE1BSUssSUFBSVQsSUFBSUUsT0FBSixLQUFnQixLQUFwQixFQUEyQkYsSUFBSVUsR0FBSixHQUFVWCxPQUFWLENBQTNCLEtBQ0FDLElBQUlJLFdBQUosR0FBa0JMLE9BQWxCO0FBQ1I7QUFDSixTQVZEO0FBV0EsZUFBT0QsU0FBUDtBQUNIO0FBRUEsQ0F0TkEsR0FBRCIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgpIHtcbid1c2Ugc3RyaWN0JztcblxudmFyIGVsZW1lbnQgPSBmdW5jdGlvbihlbGVtZW50LCBjb25maWcpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50KTtcclxuICAgIGlmICghZWxlbWVudCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgaWYgKHR5cGVvZiBjb25maWcgPT09ICdvYmplY3QnKSBleHRlbmRPYmplY3QoZWxlbWVudCwgY29uZmlnKTtcclxuXHJcbiAgICBmdW5jdGlvbiBleHRlbmRPYmplY3Qob2JqLCBwcm9wcykge1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gcHJvcHMpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGlzT2JqZWN0ID0gcHJvcCBpbiBvYmogJiYgdHlwZW9mIG9ialtwcm9wXSA9PT0gJ29iamVjdCc7XHJcbiAgICAgICAgICAgIGlmIChwcm9wID09PSAnZXZlbnRzJykgZm9yIChjb25zdCBlIGluIHByb3BzW3Byb3BdKSBvYmouYWRkRXZlbnRMaXN0ZW5lcihlLCBwcm9wc1twcm9wXVtlXSwgZmFsc2UpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChpc09iamVjdCkgZXh0ZW5kT2JqZWN0KG9ialtwcm9wXSwgcHJvcHNbcHJvcF0pO1xyXG4gICAgICAgICAgICBlbHNlIG9ialtwcm9wXSA9IHByb3BzW3Byb3BdO1xyXG5cclxuICAgICAgICB9XHJcbiAgICBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlbWVudDtcclxuXHJcbn07XG5cbnZhciBzbWFydGZvcm0gPSBmdW5jdGlvbihlbGVtZW50LCBjb25maWcpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KTtcclxuICAgIGlmICghKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHJldHVybiBudWxsO1xyXG4gICAgaWYgKCEoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxGb3JtRWxlbWVudCkpIGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XHJcblxyXG4gICAgY29uc3QgXyA9IGVudW1lcmFibGUgPT4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZW51bWVyYWJsZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gU21hcnRGb3JtKHtzZXQsIGNoYW5nZSwgaW5wdXQsIHN1Ym1pdCwgcmVzZXR9KSB7XHJcbiAgICAgICAgdGhpcy5yb290ID0gZWxlbWVudDtcclxuICAgICAgICBpZiAoY2hhbmdlKSBfKGVsZW1lbnQuZWxlbWVudHMpLmZvckVhY2goZmllbGQgPT4ge1xyXG4gICAgICAgICAgICBmaWVsZC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihlKSB7IGNoYW5nZS5jYWxsKHRoaXMsIGUpOyB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoaW5wdXQpIF8oZWxlbWVudC5lbGVtZW50cykuZm9yRWFjaChmaWVsZCA9PiB7XHJcbiAgICAgICAgICAgIGZpZWxkLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgZnVuY3Rpb24oZSkgeyBpbnB1dC5jYWxsKHRoaXMsIGUpOyB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoc3VibWl0KSBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChlKSA9PiB7IHN1Ym1pdC5jYWxsKHRoaXMsIGUpOyB9KTtcclxuICAgICAgICBpZiAocmVzZXQpICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2V0JywgIChlKSA9PiB7ICByZXNldC5jYWxsKHRoaXMsIGUpOyB9KTtcclxuICAgICAgICBzZXQgJiYgc2V0LmNhbGwodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgU21hcnRGb3JtLnByb3RvdHlwZSA9IHtcclxuICAgICAgICBnZXQ6ICAgICBmdW5jdGlvbihwcm9wZXJ0eSkge3JldHVybiBlbGVtZW50W3Byb3BlcnR5XTt9LFxyXG4gICAgICAgIHNldDogICAgIGZ1bmN0aW9uKHByb3BlcnR5LCB2YWx1ZSkge2VsZW1lbnRbcHJvcGVydHldID0gdmFsdWU7fSxcclxuICAgICAgICByZXNldDogICBmdW5jdGlvbigpIHtlbGVtZW50LnJlc2V0KCk7fSxcclxuICAgICAgICBmaWVsZDogICBmdW5jdGlvbihuYW1lKSB7cmV0dXJuIGVsZW1lbnQuZWxlbWVudHNbbmFtZV19LFxyXG4gICAgICAgIGZpbGw6ICAgIGZ1bmN0aW9uKGRhdGEpIHt9LFxyXG4gICAgICAgIHZhbHVlT2Y6IGZ1bmN0aW9uKG5hbWUpIHtyZXR1cm4gdmFsdWVPZi5jYWxsKHRoaXMsIHRoaXMuZmllbGQobmFtZSkpfSxcclxuICAgICAgICBqc29uOiAgICBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzb24gPSB7fTtcclxuICAgICAgICAgICAgXyh0aGlzLnJvb3QuZWxlbWVudHMpLmZvckVhY2goZmllbGQgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmllbGQoZmllbGQubmFtZSkpIGpzb25bZmllbGQubmFtZV0gPSB0aGlzLnZhbHVlT2YoZmllbGQubmFtZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4ganNvbjtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBuZXcgU21hcnRGb3JtKGNvbmZpZyk7XHJcblxyXG4gICAgZnVuY3Rpb24gdmFsdWVPZihmaWVsZCkge1xyXG5cclxuICAgICAgICBpZiAoIWZpZWxkKSByZXR1cm4gbnVsbDtcclxuICAgICAgICBpZiAodHlwZW9mIGZpZWxkLnZhbHVlID09PSAnc3RyaW5nJykgcmV0dXJuIGZpZWxkLnZhbHVlO1xyXG5cclxuICAgIH1cclxuXHJcbn07XG5cbmNvbnN0IEZJUkVCQVNFX0FVVEggPSBmaXJlYmFzZS5hdXRoKCk7XHJcbmNvbnN0IEZJUkVCQVNFX0RBVEFCQVNFID0gZmlyZWJhc2UuZGF0YWJhc2UoKTtcclxuXHJcbmNvbnN0IHVpID0ge1xyXG4gICAgc2lnbkluQnV0dG9uOiBlbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zaWduLWluJyksIHsgZXZlbnRzOiB7Y2xpY2s6IHNpZ25Jbn0gfSksXHJcbiAgICBzaWduT3V0QlV0dG9uOiBlbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zaWduLW91dCcpLCB7IGV2ZW50czoge2NsaWNrOiBzaWduT3V0fSB9KSxcclxuICAgIHVzZXJuYW1lTGFiZWw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy51c2VybmFtZScpLFxyXG4gICAgc2VjdGlvbnM6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hcHAtc2VjdGlvbicpLFxyXG4gICAgcGFnZUxpbmtzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZS1saW5rJyksXHJcbiAgICBjb21wb3NlOiAoe3Nob3csIGhpZGV9KSA9PiB7XHJcbiAgICAgICAgc2hvdyAmJiBzaG93LmZvckVhY2goZWwgPT4gZWwucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKSk7XHJcbiAgICAgICAgaGlkZSAmJiBoaWRlLmZvckVhY2goZWwgPT4gZWwuc2V0QXR0cmlidXRlKCdoaWRkZW4nLCB0cnVlKSk7XHJcbiAgICB9LFxyXG4gICAgc2hvdzogKGVsZW1lbnQkJDEsIGZuKSA9PiB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50JCQxID09PSAnc3RyaW5nJykgZWxlbWVudCQkMSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZWxlbWVudCQkMSk7XHJcbiAgICAgICAgaWYgKGVsZW1lbnQkJDEgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgZWxlbWVudCQkMS5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpO1xyXG4gICAgICAgIGVsc2UgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbGVtZW50JCQxLCBlbCA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpKTtcclxuICAgICAgICBmbiAmJiBmbihlbGVtZW50JCQxKTtcclxuICAgIH0sXHJcbiAgICBoaWRlOiAoZWxlbWVudCQkMSwgZm4pID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQkJDEgPT09ICdzdHJpbmcnKSBlbGVtZW50JCQxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChlbGVtZW50JCQxKTtcclxuICAgICAgICBpZiAoZWxlbWVudCQkMSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBlbGVtZW50JCQxLnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgdHJ1ZSk7XHJcbiAgICAgICAgZWxzZSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVsZW1lbnQkJDEsIGVsID0+IGVsLnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgdHJ1ZSkpO1xyXG4gICAgICAgIGZuICYmIGZuKGVsZW1lbnQkJDEpO1xyXG4gICAgfSxcclxuICAgIHJlbmRlclNlY3Rpb246IChzZWN0aW9uKSA9PiB7XHJcbiAgICAgICAgY29uc3QgbGlzdENvbnRhaW5lciA9IHNlY3Rpb24ucXVlcnlTZWxlY3RvcignLmFwcC1saXN0Jyk7XHJcbiAgICAgICAgbGlzdENvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICBGSVJFQkFTRV9EQVRBQkFTRS5yZWYoc2VjdGlvbi5pZCkub24oJ2NoaWxkX2FkZGVkJywgc25hcHNob3QgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gc25hcHNob3QudmFsKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSByZW5kZXIoc2VjdGlvbi5xdWVyeVNlbGVjdG9yKCcudGVtcGxhdGUnKSwgZGF0YSk7XHJcbiAgICAgICAgICAgIGlmIChpdGVtICYmICFsaXN0Q29udGFpbmVyLmNvbnRhaW5zKGl0ZW0pKSBsaXN0Q29udGFpbmVyLmluc2VydEFkamFjZW50RWxlbWVudCgnYWZ0ZXJCZWdpbicsIGl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IG1vZGFsID0gc2VjdGlvbi5xdWVyeVNlbGVjdG9yKCdbZGF0YS1tb2RhbF0nKTtcclxuICAgICAgICBjb25zdCBvcGVuRm9ybUJ1dHRvbiA9IHNlY3Rpb24ucXVlcnlTZWxlY3RvcignLm9wZW4tZm9ybScpO1xyXG4gICAgICAgIGlmIChvcGVuRm9ybUJ1dHRvbiAmJiBtb2RhbCkge1xyXG4gICAgICAgICAgICBvcGVuRm9ybUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuY2xhc3NMaXN0LmFkZCgnb24nKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWJ0bn49XCJmZWNoYXJcIl0nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnb24nKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxudWkucGFnZUxpbmtzLmZvckVhY2gobGluayA9PiBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xyXG4gICAgaWYgKHRoaXMuaGFzaCkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB1aS5oaWRlKHVpLnNlY3Rpb25zKTtcclxuICAgICAgICB1aS5zaG93KHRoaXMuaGFzaCwgbm9kZXMgPT4gdWkucmVuZGVyU2VjdGlvbihub2Rlc1swXSkpO1xyXG4gICAgfVxyXG59KSk7XHJcblxyXG5GSVJFQkFTRV9BVVRILm9uQXV0aFN0YXRlQ2hhbmdlZChoYW5kbGVBdXRoU3RhdGVDaGFuZ2VkKTtcclxuXHJcbmNvbnN0IGFwcEZvcm1zID0gd2luZG93LmFwcEZvcm1zID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2Zvcm0nKSwgZm9ybSA9PiBzbWFydGZvcm0oZm9ybSwge1xyXG4gICAgc2V0OiAgICBmdW5jdGlvbigpIHt9LFxyXG4gICAgY2hhbmdlOiBmdW5jdGlvbihlKSB7fSxcclxuICAgIGlucHV0OiAgZnVuY3Rpb24oZSkge30sXHJcbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgRklSRUJBU0VfREFUQUJBU0UucmVmKHRoaXMucm9vdC5kYXRhc2V0LmFjdGlvbikucHVzaCh0aGlzLmpzb24oKSk7XHJcbiAgICAgICAgdGhpcy5yb290LnJlc2V0KCk7XHJcbiAgICB9LFxyXG4gICAgcmVzZXQ6ICBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tb2RhbF0ub24nKSwgbW9kYWwgPT4gbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnb24nKSk7XHJcbiAgICB9XHJcbn0pKTtcclxuXHJcbmZ1bmN0aW9uIHNpZ25JbigpIHtcclxuICAgIEZJUkVCQVNFX0FVVEguc2lnbkluV2l0aFBvcHVwKCBuZXcgZmlyZWJhc2UuYXV0aC5Hb29nbGVBdXRoUHJvdmlkZXIoKSApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaWduT3V0KCkge1xyXG4gICAgRklSRUJBU0VfQVVUSC5zaWduT3V0KCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZUF1dGhTdGF0ZUNoYW5nZWQodXNlcikge1xyXG5cclxuICAgIHVpLmhpZGUodWkuc2VjdGlvbnMpO1xyXG4gICAgdWkuaGlkZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZ3JlZXRpbmdzIC5sb2FkaW5nJykpO1xyXG5cclxuICAgIGlmICh1c2VyKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHVzZXJSZWYgPSBGSVJFQkFTRV9EQVRBQkFTRS5yZWYoYHVzZXJzLyR7dXNlci51aWR9YCk7XHJcbiAgICAgICAgdXNlclJlZi5vbmNlKCd2YWx1ZScsIHNuYXBzaG90ID0+IHtcclxuICAgICAgICAgICAgaWYgKCFzbmFwc2hvdC52YWwoKSkge1xyXG4gICAgICAgICAgICAgICAgdXNlclJlZi5zZXQoe1xyXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiB1c2VyLmRpc3BsYXlOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHBob3RvVVJMOiB1c2VyLnBob3RvVVJMLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhc3RTaWduSW5UaW1lOiBEYXRlKClcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdXNlclJlZi5jaGlsZCgnbGFzdFNpZ25JblRpbWUnKS5zZXQoRGF0ZSgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB1aS5jb21wb3NlKHtcclxuICAgICAgICAgICAgc2hvdzogW3VpLnNpZ25PdXRCVXR0b25dLFxyXG4gICAgICAgICAgICBoaWRlOiBbdWkuc2lnbkluQnV0dG9uXVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHVpLnVzZXJuYW1lTGFiZWwuaW5uZXJIVE1MID0gYDxzcGFuIGRhdGEtYmxvY2s9XCJpbmxpbmUgY2lyY1wiPjxpbWcgc3JjPVwiJHt1c2VyLnBob3RvVVJMfVwiIGhlaWdodD1cIjI1XCI+PC9zcGFuPlxyXG4gICAgICAgICAgICA8c21hbGwgdGl0bGU9XCIke3VzZXIuZW1haWx9XCIgY2xhc3M9XCJkaXNwbGF5LW5hbWVcIj4ke3VzZXIuZGlzcGxheU5hbWV9PC9zbWFsbD5gO1xyXG4gICAgICAgIHVpLnNob3codWkucGFnZUxpbmtzKTtcclxuICAgICAgICB1aS5zaG93KCcjcHJvamVjdHMnLCBub2RlcyA9PiB1aS5yZW5kZXJTZWN0aW9uKG5vZGVzWzBdKSk7XHJcblxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdWkuY29tcG9zZSh7XHJcbiAgICAgICAgICAgIGhpZGU6IFt1aS5zaWduT3V0QlV0dG9uXSxcclxuICAgICAgICAgICAgc2hvdzogW3VpLnNpZ25JbkJ1dHRvbl1cclxuICAgICAgICB9KTtcclxuICAgICAgICB1aS51c2VybmFtZUxhYmVsLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIHVpLmhpZGUodWkucGFnZUxpbmtzKTtcclxuICAgICAgICB1aS5zaG93KCcjZ3JlZXRpbmdzJyk7XHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyKGVsZW1lbnQkJDEsIGRhdGEpIHtcclxuICAgIGlmICghZWxlbWVudCQkMSB8fCAhZWxlbWVudCQkMS5jbG9uZU5vZGUpIHJldHVybiBjb25zb2xlLmxvZygnVGVtcGxhdGUgbsOjbyBlbmNvbnRyYWRvIScsIGVsZW1lbnQkJDEsIGRhdGEpO1xyXG4gICAgY29uc3QgY29udGFpbmVyID0gZWxlbWVudCQkMS5jbG9uZU5vZGUodHJ1ZSk7XHJcbiAgICBjb250YWluZXIucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKTtcclxuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1vZGVsXScpLCB0YWcgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBkYXRhW3RhZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtbW9kZWwnKV07XHJcbiAgICAgICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAgICAgaWYgKHRhZy50YWdOYW1lID09PSAnREFURVRJTUUnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB0YWcudGV4dENvbnRlbnQgPSBgJHtkYXRlLmdldERhdGUoKX0vJHtkYXRlLmdldE1vbnRoKCl9LyR7ZGF0ZS5nZXRGdWxsWWVhcigpfSAke2RhdGUuZ2V0SG91cnMoKX1oJHtkYXRlLmdldE1pbnV0ZXMoKX1gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRhZy50YWdOYW1lID09PSAnSU1HJykgdGFnLnNyYyA9IGNvbnRlbnQ7XHJcbiAgICAgICAgICAgIGVsc2UgdGFnLnRleHRDb250ZW50ID0gY29udGVudDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBjb250YWluZXI7XHJcbn1cblxufSgpKTtcbiJdfQ==
