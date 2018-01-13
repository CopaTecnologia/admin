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
            ui.show('#projects', function (nodes) {
                return ui.renderSection(nodes[0]);
            });
        } else {
            ui.compose({
                hide: [ui.signOutBUtton],
                show: [ui.signInButton]
            });
            ui.usernameLabel.innerHTML = '';
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiZWxlbWVudCIsImNvbmZpZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImV4dGVuZE9iamVjdCIsIm9iaiIsInByb3BzIiwicHJvcCIsImlzT2JqZWN0IiwiZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJzbWFydGZvcm0iLCJxdWVyeVNlbGVjdG9yIiwiSFRNTEVsZW1lbnQiLCJIVE1MRm9ybUVsZW1lbnQiLCJfIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJlbnVtZXJhYmxlIiwiU21hcnRGb3JtIiwic2V0IiwiY2hhbmdlIiwiaW5wdXQiLCJzdWJtaXQiLCJyZXNldCIsInJvb3QiLCJlbGVtZW50cyIsImZvckVhY2giLCJmaWVsZCIsImdldCIsInByb3BlcnR5IiwidmFsdWUiLCJuYW1lIiwiZmlsbCIsImRhdGEiLCJ2YWx1ZU9mIiwianNvbiIsInR5cGUiLCJGSVJFQkFTRV9BVVRIIiwiZmlyZWJhc2UiLCJhdXRoIiwiRklSRUJBU0VfREFUQUJBU0UiLCJkYXRhYmFzZSIsInVpIiwic2lnbkluQnV0dG9uIiwiZXZlbnRzIiwiY2xpY2siLCJzaWduSW4iLCJzaWduT3V0QlV0dG9uIiwic2lnbk91dCIsInVzZXJuYW1lTGFiZWwiLCJzZWN0aW9ucyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJwYWdlTGlua3MiLCJjb21wb3NlIiwic2hvdyIsImhpZGUiLCJlbCIsInJlbW92ZUF0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsImVsZW1lbnQkJDEiLCJmbiIsInJlbmRlclNlY3Rpb24iLCJzZWN0aW9uIiwibGlzdENvbnRhaW5lciIsImlubmVySFRNTCIsInJlZiIsImlkIiwib24iLCJzbmFwc2hvdCIsInZhbCIsIml0ZW0iLCJyZW5kZXIiLCJjb250YWlucyIsImluc2VydEFkamFjZW50RWxlbWVudCIsIm1vZGFsIiwib3BlbkZvcm1CdXR0b24iLCJjbGFzc0xpc3QiLCJhZGQiLCJyZW1vdmUiLCJsaW5rIiwiaGFzaCIsInByZXZlbnREZWZhdWx0Iiwibm9kZXMiLCJvbkF1dGhTdGF0ZUNoYW5nZWQiLCJoYW5kbGVBdXRoU3RhdGVDaGFuZ2VkIiwiYXBwRm9ybXMiLCJ3aW5kb3ciLCJtYXAiLCJmb3JtIiwiZGF0YXNldCIsImFjdGlvbiIsInB1c2giLCJzaWduSW5XaXRoUG9wdXAiLCJHb29nbGVBdXRoUHJvdmlkZXIiLCJ1c2VyIiwidXNlclJlZiIsInVpZCIsIm9uY2UiLCJlbWFpbCIsImRpc3BsYXlOYW1lIiwicGhvdG9VUkwiLCJsYXN0U2lnbkluVGltZSIsIkRhdGUiLCJjaGlsZCIsImNsb25lTm9kZSIsImNvbnNvbGUiLCJsb2ciLCJjb250YWluZXIiLCJjb250ZW50IiwidGFnIiwiZ2V0QXR0cmlidXRlIiwidGFnTmFtZSIsImRhdGUiLCJ0ZXh0Q29udGVudCIsImdldERhdGUiLCJnZXRNb250aCIsImdldEZ1bGxZZWFyIiwiZ2V0SG91cnMiLCJnZXRNaW51dGVzIiwic3JjIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUMsYUFBWTtBQUNiOztBQUVBLFFBQUlBLFVBQVUsaUJBQVNBLFFBQVQsRUFBa0JDLE1BQWxCLEVBQTBCOztBQUVwQyxZQUFJLE9BQU9ELFFBQVAsS0FBbUIsUUFBdkIsRUFBaUNBLFdBQVVFLFNBQVNDLGFBQVQsQ0FBdUJILFFBQXZCLENBQVY7QUFDakMsWUFBSSxDQUFDQSxRQUFMLEVBQWMsT0FBTyxLQUFQO0FBQ2QsWUFBSSxRQUFPQyxNQUFQLHlDQUFPQSxNQUFQLE9BQWtCLFFBQXRCLEVBQWdDRyxhQUFhSixRQUFiLEVBQXNCQyxNQUF0Qjs7QUFFaEMsaUJBQVNHLFlBQVQsQ0FBc0JDLEdBQXRCLEVBQTJCQyxLQUEzQixFQUFrQzs7QUFFOUIsaUJBQUssSUFBTUMsSUFBWCxJQUFtQkQsS0FBbkIsRUFBMEI7O0FBRXRCLG9CQUFNRSxXQUFXRCxRQUFRRixHQUFSLElBQWUsUUFBT0EsSUFBSUUsSUFBSixDQUFQLE1BQXFCLFFBQXJEO0FBQ0Esb0JBQUlBLFNBQVMsUUFBYixFQUF1QixLQUFLLElBQU1FLENBQVgsSUFBZ0JILE1BQU1DLElBQU4sQ0FBaEI7QUFBNkJGLHdCQUFJSyxnQkFBSixDQUFxQkQsQ0FBckIsRUFBd0JILE1BQU1DLElBQU4sRUFBWUUsQ0FBWixDQUF4QixFQUF3QyxLQUF4QztBQUE3QixpQkFBdkIsTUFDSyxJQUFJRCxRQUFKLEVBQWNKLGFBQWFDLElBQUlFLElBQUosQ0FBYixFQUF3QkQsTUFBTUMsSUFBTixDQUF4QixFQUFkLEtBQ0FGLElBQUlFLElBQUosSUFBWUQsTUFBTUMsSUFBTixDQUFaO0FBRVI7QUFFSjs7QUFFRCxlQUFPUCxRQUFQO0FBRUgsS0FyQkQ7O0FBdUJBLFFBQUlXLFlBQVksU0FBWkEsU0FBWSxDQUFTWCxPQUFULEVBQWtCQyxNQUFsQixFQUEwQjs7QUFFdEMsWUFBSSxPQUFPRCxPQUFQLEtBQW1CLFFBQXZCLEVBQWlDQSxVQUFVRSxTQUFTVSxhQUFULENBQXVCWixPQUF2QixDQUFWO0FBQ2pDLFlBQUksRUFBRUEsbUJBQW1CYSxXQUFyQixDQUFKLEVBQXVDLE9BQU8sSUFBUDtBQUN2QyxZQUFJLEVBQUViLG1CQUFtQmMsZUFBckIsQ0FBSixFQUEyQ2QsVUFBVUUsU0FBU1UsYUFBVCxDQUF1QixNQUF2QixDQUFWOztBQUUzQyxZQUFNRyxJQUFJLFNBQUpBLENBQUk7QUFBQSxtQkFBY0MsTUFBTUMsU0FBTixDQUFnQkMsS0FBaEIsQ0FBc0JDLElBQXRCLENBQTJCQyxVQUEzQixDQUFkO0FBQUEsU0FBVjs7QUFFQSxpQkFBU0MsU0FBVCxPQUF3RDtBQUFBOztBQUFBLGdCQUFwQ0MsR0FBb0MsUUFBcENBLEdBQW9DO0FBQUEsZ0JBQS9CQyxNQUErQixRQUEvQkEsTUFBK0I7QUFBQSxnQkFBdkJDLEtBQXVCLFFBQXZCQSxLQUF1QjtBQUFBLGdCQUFoQkMsTUFBZ0IsUUFBaEJBLE1BQWdCO0FBQUEsZ0JBQVJDLEtBQVEsUUFBUkEsS0FBUTs7QUFDcEQsaUJBQUtDLElBQUwsR0FBWTNCLE9BQVo7QUFDQSxnQkFBSXVCLE1BQUosRUFBWVIsRUFBRWYsUUFBUTRCLFFBQVYsRUFBb0JDLE9BQXBCLENBQTRCLGlCQUFTO0FBQzdDQyxzQkFBTXBCLGdCQUFOLENBQXVCLFFBQXZCLEVBQWlDLFVBQVNELENBQVQsRUFBWTtBQUFFYywyQkFBT0osSUFBUCxDQUFZLElBQVosRUFBa0JWLENBQWxCO0FBQXVCLGlCQUF0RTtBQUNILGFBRlc7QUFHWixnQkFBSWUsS0FBSixFQUFXVCxFQUFFZixRQUFRNEIsUUFBVixFQUFvQkMsT0FBcEIsQ0FBNEIsaUJBQVM7QUFDNUNDLHNCQUFNcEIsZ0JBQU4sQ0FBdUIsT0FBdkIsRUFBZ0MsVUFBU0QsQ0FBVCxFQUFZO0FBQUVlLDBCQUFNTCxJQUFOLENBQVcsSUFBWCxFQUFpQlYsQ0FBakI7QUFBc0IsaUJBQXBFO0FBQ0gsYUFGVTtBQUdYLGdCQUFJZ0IsTUFBSixFQUFZekIsUUFBUVUsZ0JBQVIsQ0FBeUIsUUFBekIsRUFBbUMsVUFBQ0QsQ0FBRCxFQUFPO0FBQUVnQix1QkFBT04sSUFBUCxRQUFrQlYsQ0FBbEI7QUFBdUIsYUFBbkU7QUFDWixnQkFBSWlCLEtBQUosRUFBWTFCLFFBQVFVLGdCQUFSLENBQXlCLE9BQXpCLEVBQW1DLFVBQUNELENBQUQsRUFBTztBQUFHaUIsc0JBQU1QLElBQU4sUUFBaUJWLENBQWpCO0FBQXNCLGFBQW5FO0FBQ1phLG1CQUFPQSxJQUFJSCxJQUFKLENBQVMsSUFBVCxDQUFQO0FBQ0g7O0FBRURFLGtCQUFVSixTQUFWLEdBQXNCO0FBQ2xCYyxpQkFBUyxhQUFTQyxRQUFULEVBQW1CO0FBQUMsdUJBQU9oQyxRQUFRZ0MsUUFBUixDQUFQO0FBQTBCLGFBRHJDO0FBRWxCVixpQkFBUyxhQUFTVSxRQUFULEVBQW1CQyxLQUFuQixFQUEwQjtBQUFDakMsd0JBQVFnQyxRQUFSLElBQW9CQyxLQUFwQjtBQUEyQixhQUY3QztBQUdsQlAsbUJBQVMsaUJBQVc7QUFBQzFCLHdCQUFRMEIsS0FBUjtBQUFpQixhQUhwQjtBQUlsQkksbUJBQVMsZUFBU0ksSUFBVCxFQUFlO0FBQUMsdUJBQU9sQyxRQUFRNEIsUUFBUixDQUFpQk0sSUFBakIsQ0FBUDtBQUE4QixhQUpyQztBQUtsQkMsa0JBQVMsY0FBU0MsSUFBVCxFQUFlLENBQUUsQ0FMUjtBQU1sQkMscUJBQVMsaUJBQVNILElBQVQsRUFBZTtBQUFDLHVCQUFPRyxTQUFRbEIsSUFBUixDQUFhLElBQWIsRUFBbUIsS0FBS1csS0FBTCxDQUFXSSxJQUFYLENBQW5CLENBQVA7QUFBNEMsYUFObkQ7QUFPbEJJLGtCQUFTLGNBQVNDLElBQVQsRUFBZTtBQUFBOztBQUNwQixvQkFBTUQsT0FBTyxFQUFiO0FBQ0F2QixrQkFBRSxLQUFLWSxJQUFMLENBQVVDLFFBQVosRUFBc0JDLE9BQXRCLENBQThCLGlCQUFTO0FBQ25DLHdCQUFJLE9BQUtDLEtBQUwsQ0FBV0EsTUFBTUksSUFBakIsQ0FBSixFQUE0QkksS0FBS1IsTUFBTUksSUFBWCxJQUFtQixPQUFLRyxPQUFMLENBQWFQLE1BQU1JLElBQW5CLENBQW5CO0FBQy9CLGlCQUZEO0FBR0EsdUJBQU9JLElBQVA7QUFDSDtBQWJpQixTQUF0Qjs7QUFnQkEsZUFBTyxJQUFJakIsU0FBSixDQUFjcEIsTUFBZCxDQUFQOztBQUVBLGlCQUFTb0MsUUFBVCxDQUFpQlAsS0FBakIsRUFBd0I7O0FBRXBCLGdCQUFJLENBQUNBLEtBQUwsRUFBWSxPQUFPLElBQVA7QUFDWixnQkFBSSxPQUFPQSxNQUFNRyxLQUFiLEtBQXVCLFFBQTNCLEVBQXFDLE9BQU9ILE1BQU1HLEtBQWI7QUFFeEM7QUFFSixLQTlDRDs7QUFnREEsUUFBTU8sZ0JBQWdCQyxTQUFTQyxJQUFULEVBQXRCO0FBQ0EsUUFBTUMsb0JBQW9CRixTQUFTRyxRQUFULEVBQTFCOztBQUVBLFFBQU1DLEtBQUs7QUFDUEMsc0JBQWM5QyxRQUFRRSxTQUFTVSxhQUFULENBQXVCLFVBQXZCLENBQVIsRUFBNEMsRUFBRW1DLFFBQVEsRUFBQ0MsT0FBT0MsTUFBUixFQUFWLEVBQTVDLENBRFA7QUFFUEMsdUJBQWVsRCxRQUFRRSxTQUFTVSxhQUFULENBQXVCLFdBQXZCLENBQVIsRUFBNkMsRUFBRW1DLFFBQVEsRUFBQ0MsT0FBT0csT0FBUixFQUFWLEVBQTdDLENBRlI7QUFHUEMsdUJBQWVsRCxTQUFTVSxhQUFULENBQXVCLFdBQXZCLENBSFI7QUFJUHlDLGtCQUFVbkQsU0FBU29ELGdCQUFULENBQTBCLGNBQTFCLENBSkg7QUFLUEMsbUJBQVdyRCxTQUFTb0QsZ0JBQVQsQ0FBMEIsWUFBMUIsQ0FMSjtBQU1QRSxpQkFBUyx3QkFBa0I7QUFBQSxnQkFBaEJDLElBQWdCLFNBQWhCQSxJQUFnQjtBQUFBLGdCQUFWQyxJQUFVLFNBQVZBLElBQVU7O0FBQ3ZCRCxvQkFBUUEsS0FBSzVCLE9BQUwsQ0FBYTtBQUFBLHVCQUFNOEIsR0FBR0MsZUFBSCxDQUFtQixRQUFuQixDQUFOO0FBQUEsYUFBYixDQUFSO0FBQ0FGLG9CQUFRQSxLQUFLN0IsT0FBTCxDQUFhO0FBQUEsdUJBQU04QixHQUFHRSxZQUFILENBQWdCLFFBQWhCLEVBQTBCLElBQTFCLENBQU47QUFBQSxhQUFiLENBQVI7QUFDSCxTQVRNO0FBVVBKLGNBQU0sY0FBQ0ssVUFBRCxFQUFhQyxFQUFiLEVBQW9CO0FBQ3RCLGdCQUFJLE9BQU9ELFVBQVAsS0FBc0IsUUFBMUIsRUFBb0NBLGFBQWE1RCxTQUFTb0QsZ0JBQVQsQ0FBMEJRLFVBQTFCLENBQWI7QUFDcEMsZ0JBQUlBLHNCQUFzQmpELFdBQTFCLEVBQXVDaUQsV0FBV0YsZUFBWCxDQUEyQixRQUEzQixFQUF2QyxLQUNLNUMsTUFBTUMsU0FBTixDQUFnQlksT0FBaEIsQ0FBd0JWLElBQXhCLENBQTZCMkMsVUFBN0IsRUFBeUM7QUFBQSx1QkFBTUgsR0FBR0MsZUFBSCxDQUFtQixRQUFuQixDQUFOO0FBQUEsYUFBekM7QUFDTEcsa0JBQU1BLEdBQUdELFVBQUgsQ0FBTjtBQUNILFNBZk07QUFnQlBKLGNBQU0sY0FBQ0ksVUFBRCxFQUFhQyxFQUFiLEVBQW9CO0FBQ3RCLGdCQUFJLE9BQU9ELFVBQVAsS0FBc0IsUUFBMUIsRUFBb0NBLGFBQWE1RCxTQUFTb0QsZ0JBQVQsQ0FBMEJRLFVBQTFCLENBQWI7QUFDcEMsZ0JBQUlBLHNCQUFzQmpELFdBQTFCLEVBQXVDaUQsV0FBV0QsWUFBWCxDQUF3QixRQUF4QixFQUFrQyxJQUFsQyxFQUF2QyxLQUNLN0MsTUFBTUMsU0FBTixDQUFnQlksT0FBaEIsQ0FBd0JWLElBQXhCLENBQTZCMkMsVUFBN0IsRUFBeUM7QUFBQSx1QkFBTUgsR0FBR0UsWUFBSCxDQUFnQixRQUFoQixFQUEwQixJQUExQixDQUFOO0FBQUEsYUFBekM7QUFDTEUsa0JBQU1BLEdBQUdELFVBQUgsQ0FBTjtBQUNILFNBckJNO0FBc0JQRSx1QkFBZSx1QkFBQ0MsT0FBRCxFQUFhO0FBQ3hCLGdCQUFNQyxnQkFBZ0JELFFBQVFyRCxhQUFSLENBQXNCLFdBQXRCLENBQXRCO0FBQ0FzRCwwQkFBY0MsU0FBZCxHQUEwQixFQUExQjtBQUNBeEIsOEJBQWtCeUIsR0FBbEIsQ0FBc0JILFFBQVFJLEVBQTlCLEVBQWtDQyxFQUFsQyxDQUFxQyxhQUFyQyxFQUFvRCxvQkFBWTtBQUM1RCxvQkFBTWxDLE9BQU9tQyxTQUFTQyxHQUFULEVBQWI7QUFDQSxvQkFBTUMsT0FBT0MsT0FBT1QsUUFBUXJELGFBQVIsQ0FBc0IsV0FBdEIsQ0FBUCxFQUEyQ3dCLElBQTNDLENBQWI7QUFDQSxvQkFBSXFDLFFBQVEsQ0FBQ1AsY0FBY1MsUUFBZCxDQUF1QkYsSUFBdkIsQ0FBYixFQUEyQ1AsY0FBY1UscUJBQWQsQ0FBb0MsWUFBcEMsRUFBa0RILElBQWxEO0FBQzlDLGFBSkQ7QUFLQSxnQkFBTUksUUFBUVosUUFBUXJELGFBQVIsQ0FBc0IsY0FBdEIsQ0FBZDtBQUNBLGdCQUFNa0UsaUJBQWlCYixRQUFRckQsYUFBUixDQUFzQixZQUF0QixDQUF2QjtBQUNBLGdCQUFJa0Usa0JBQWtCRCxLQUF0QixFQUE2QjtBQUN6QkMsK0JBQWVwRSxnQkFBZixDQUFnQyxPQUFoQyxFQUF5QyxZQUFXO0FBQ2hEbUUsMEJBQU1FLFNBQU4sQ0FBZ0JDLEdBQWhCLENBQW9CLElBQXBCO0FBQ0gsaUJBRkQ7QUFHQUgsc0JBQU1qRSxhQUFOLENBQW9CLHNCQUFwQixFQUE0Q0YsZ0JBQTVDLENBQTZELE9BQTdELEVBQXNFLFlBQVc7QUFDN0VtRSwwQkFBTUUsU0FBTixDQUFnQkUsTUFBaEIsQ0FBdUIsSUFBdkI7QUFDSCxpQkFGRDtBQUdIO0FBQ0o7QUF4Q00sS0FBWDs7QUEyQ0FwQyxPQUFHVSxTQUFILENBQWExQixPQUFiLENBQXFCO0FBQUEsZUFBUXFELEtBQUt4RSxnQkFBTCxDQUFzQixPQUF0QixFQUErQixVQUFTRCxDQUFULEVBQVk7QUFDcEUsZ0JBQUksS0FBSzBFLElBQVQsRUFBZTtBQUNYMUUsa0JBQUUyRSxjQUFGO0FBQ0F2QyxtQkFBR2EsSUFBSCxDQUFRYixHQUFHUSxRQUFYO0FBQ0FSLG1CQUFHWSxJQUFILENBQVEsS0FBSzBCLElBQWIsRUFBbUI7QUFBQSwyQkFBU3RDLEdBQUdtQixhQUFILENBQWlCcUIsTUFBTSxDQUFOLENBQWpCLENBQVQ7QUFBQSxpQkFBbkI7QUFDSDtBQUNKLFNBTjRCLENBQVI7QUFBQSxLQUFyQjs7QUFRQTdDLGtCQUFjOEMsa0JBQWQsQ0FBaUNDLHNCQUFqQzs7QUFFQSxRQUFNQyxXQUFXQyxPQUFPRCxRQUFQLEdBQWtCeEUsTUFBTUMsU0FBTixDQUFnQnlFLEdBQWhCLENBQW9CdkUsSUFBcEIsQ0FBeUJqQixTQUFTb0QsZ0JBQVQsQ0FBMEIsTUFBMUIsQ0FBekIsRUFBNEQ7QUFBQSxlQUFRM0MsVUFBVWdGLElBQVYsRUFBZ0I7QUFDbkhyRSxpQkFBUSxlQUFXLENBQUUsQ0FEOEY7QUFFbkhDLG9CQUFRLGdCQUFTZCxDQUFULEVBQVksQ0FBRSxDQUY2RjtBQUduSGUsbUJBQVEsZUFBU2YsQ0FBVCxFQUFZLENBQUUsQ0FINkY7QUFJbkhnQixvQkFBUSxnQkFBU2hCLENBQVQsRUFBWTtBQUNoQkEsa0JBQUUyRSxjQUFGO0FBQ0F6QyxrQ0FBa0J5QixHQUFsQixDQUFzQixLQUFLekMsSUFBTCxDQUFVaUUsT0FBVixDQUFrQkMsTUFBeEMsRUFBZ0RDLElBQWhELENBQXFELEtBQUt4RCxJQUFMLEVBQXJEO0FBQ0EscUJBQUtYLElBQUwsQ0FBVUQsS0FBVjtBQUNILGFBUmtIO0FBU25IQSxtQkFBUSxlQUFTakIsQ0FBVCxFQUFZO0FBQ2hCTyxzQkFBTUMsU0FBTixDQUFnQlksT0FBaEIsQ0FBd0JWLElBQXhCLENBQTZCakIsU0FBU29ELGdCQUFULENBQTBCLGlCQUExQixDQUE3QixFQUEyRTtBQUFBLDJCQUFTdUIsTUFBTUUsU0FBTixDQUFnQkUsTUFBaEIsQ0FBdUIsSUFBdkIsQ0FBVDtBQUFBLGlCQUEzRTtBQUNIO0FBWGtILFNBQWhCLENBQVI7QUFBQSxLQUE1RCxDQUFuQzs7QUFjQSxhQUFTaEMsTUFBVCxHQUFrQjtBQUNkVCxzQkFBY3VELGVBQWQsQ0FBK0IsSUFBSXRELFNBQVNDLElBQVQsQ0FBY3NELGtCQUFsQixFQUEvQjtBQUNIOztBQUVELGFBQVM3QyxPQUFULEdBQW1CO0FBQ2ZYLHNCQUFjVyxPQUFkO0FBQ0g7O0FBRUQsYUFBU29DLHNCQUFULENBQWdDVSxJQUFoQyxFQUFzQzs7QUFFbENwRCxXQUFHYSxJQUFILENBQVFiLEdBQUdRLFFBQVg7O0FBRUEsWUFBSTRDLElBQUosRUFBVTs7QUFFTixnQkFBTUMsVUFBVXZELGtCQUFrQnlCLEdBQWxCLFlBQStCNkIsS0FBS0UsR0FBcEMsQ0FBaEI7QUFDQUQsb0JBQVFFLElBQVIsQ0FBYSxPQUFiLEVBQXNCLG9CQUFZO0FBQzlCLG9CQUFJLENBQUM3QixTQUFTQyxHQUFULEVBQUwsRUFBcUI7QUFDakIwQiw0QkFBUTVFLEdBQVIsQ0FBWTtBQUNSK0UsK0JBQU9KLEtBQUtJLEtBREo7QUFFUkMscUNBQWFMLEtBQUtLLFdBRlY7QUFHUkMsa0NBQVVOLEtBQUtNLFFBSFA7QUFJUkMsd0NBQWdCQztBQUpSLHFCQUFaO0FBTUgsaUJBUEQsTUFRSztBQUNEUCw0QkFBUVEsS0FBUixDQUFjLGdCQUFkLEVBQWdDcEYsR0FBaEMsQ0FBb0NtRixNQUFwQztBQUNIO0FBQ0osYUFaRDs7QUFjQTVELGVBQUdXLE9BQUgsQ0FBVztBQUNQQyxzQkFBTSxDQUFDWixHQUFHSyxhQUFKLENBREM7QUFFUFEsc0JBQU0sQ0FBQ2IsR0FBR0MsWUFBSjtBQUZDLGFBQVg7QUFJQUQsZUFBR08sYUFBSCxDQUFpQmUsU0FBakIsaURBQXlFOEIsS0FBS00sUUFBOUUseURBQ29CTixLQUFLSSxLQUR6QiwrQkFDd0RKLEtBQUtLLFdBRDdEO0FBRUF6RCxlQUFHWSxJQUFILENBQVEsV0FBUixFQUFxQjtBQUFBLHVCQUFTWixHQUFHbUIsYUFBSCxDQUFpQnFCLE1BQU0sQ0FBTixDQUFqQixDQUFUO0FBQUEsYUFBckI7QUFFSCxTQXpCRCxNQTBCSztBQUNEeEMsZUFBR1csT0FBSCxDQUFXO0FBQ1BFLHNCQUFNLENBQUNiLEdBQUdLLGFBQUosQ0FEQztBQUVQTyxzQkFBTSxDQUFDWixHQUFHQyxZQUFKO0FBRkMsYUFBWDtBQUlBRCxlQUFHTyxhQUFILENBQWlCZSxTQUFqQixHQUE2QixFQUE3QjtBQUNBdEIsZUFBR1ksSUFBSCxDQUFRLFlBQVI7QUFDSDtBQUVKOztBQUVELGFBQVNpQixNQUFULENBQWdCWixVQUFoQixFQUE0QjFCLElBQTVCLEVBQWtDO0FBQzlCLFlBQUksQ0FBQzBCLFVBQUQsSUFBZSxDQUFDQSxXQUFXNkMsU0FBL0IsRUFBMEMsT0FBT0MsUUFBUUMsR0FBUixDQUFZLDBCQUFaLEVBQXdDL0MsVUFBeEMsRUFBb0QxQixJQUFwRCxDQUFQO0FBQzFDLFlBQU0wRSxZQUFZaEQsV0FBVzZDLFNBQVgsQ0FBcUIsSUFBckIsQ0FBbEI7QUFDQUcsa0JBQVVsRCxlQUFWLENBQTBCLFFBQTFCO0FBQ0E1QyxjQUFNQyxTQUFOLENBQWdCWSxPQUFoQixDQUF3QlYsSUFBeEIsQ0FBNkIyRixVQUFVeEQsZ0JBQVYsQ0FBMkIsY0FBM0IsQ0FBN0IsRUFBeUUsZUFBTztBQUM1RSxnQkFBTXlELFVBQVUzRSxLQUFLNEUsSUFBSUMsWUFBSixDQUFpQixZQUFqQixDQUFMLENBQWhCO0FBQ0EsZ0JBQUlGLE9BQUosRUFBYTtBQUNULG9CQUFJQyxJQUFJRSxPQUFKLEtBQWdCLFVBQXBCLEVBQWdDO0FBQzVCLHdCQUFNQyxPQUFPLElBQUlWLElBQUosQ0FBU00sT0FBVCxDQUFiO0FBQ0FDLHdCQUFJSSxXQUFKLEdBQXFCRCxLQUFLRSxPQUFMLEVBQXJCLFNBQXVDRixLQUFLRyxRQUFMLEVBQXZDLFNBQTBESCxLQUFLSSxXQUFMLEVBQTFELFNBQWdGSixLQUFLSyxRQUFMLEVBQWhGLFNBQW1HTCxLQUFLTSxVQUFMLEVBQW5HO0FBQ0gsaUJBSEQsTUFJSyxJQUFJVCxJQUFJRSxPQUFKLEtBQWdCLEtBQXBCLEVBQTJCRixJQUFJVSxHQUFKLEdBQVVYLE9BQVYsQ0FBM0IsS0FDQUMsSUFBSUksV0FBSixHQUFrQkwsT0FBbEI7QUFDUjtBQUNKLFNBVkQ7QUFXQSxlQUFPRCxTQUFQO0FBQ0g7QUFFQSxDQW5OQSxHQUFEIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZWxlbWVudCA9IGZ1bmN0aW9uKGVsZW1lbnQsIGNvbmZpZykge1xyXG5cclxuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQpO1xyXG4gICAgaWYgKCFlbGVtZW50KSByZXR1cm4gZmFsc2U7XHJcbiAgICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gJ29iamVjdCcpIGV4dGVuZE9iamVjdChlbGVtZW50LCBjb25maWcpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGV4dGVuZE9iamVjdChvYmosIHByb3BzKSB7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBwcm9wcykge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaXNPYmplY3QgPSBwcm9wIGluIG9iaiAmJiB0eXBlb2Ygb2JqW3Byb3BdID09PSAnb2JqZWN0JztcclxuICAgICAgICAgICAgaWYgKHByb3AgPT09ICdldmVudHMnKSBmb3IgKGNvbnN0IGUgaW4gcHJvcHNbcHJvcF0pIG9iai5hZGRFdmVudExpc3RlbmVyKGUsIHByb3BzW3Byb3BdW2VdLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGlzT2JqZWN0KSBleHRlbmRPYmplY3Qob2JqW3Byb3BdLCBwcm9wc1twcm9wXSk7XHJcbiAgICAgICAgICAgIGVsc2Ugb2JqW3Byb3BdID0gcHJvcHNbcHJvcF07XHJcblxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVtZW50O1xyXG5cclxufTtcblxudmFyIHNtYXJ0Zm9ybSA9IGZ1bmN0aW9uKGVsZW1lbnQsIGNvbmZpZykge1xyXG5cclxuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsZW1lbnQpO1xyXG4gICAgaWYgKCEoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkgcmV0dXJuIG51bGw7XHJcbiAgICBpZiAoIShlbGVtZW50IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50KSkgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcclxuXHJcbiAgICBjb25zdCBfID0gZW51bWVyYWJsZSA9PiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlbnVtZXJhYmxlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBTbWFydEZvcm0oe3NldCwgY2hhbmdlLCBpbnB1dCwgc3VibWl0LCByZXNldH0pIHtcclxuICAgICAgICB0aGlzLnJvb3QgPSBlbGVtZW50O1xyXG4gICAgICAgIGlmIChjaGFuZ2UpIF8oZWxlbWVudC5lbGVtZW50cykuZm9yRWFjaChmaWVsZCA9PiB7XHJcbiAgICAgICAgICAgIGZpZWxkLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKGUpIHsgY2hhbmdlLmNhbGwodGhpcywgZSk7IH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChpbnB1dCkgXyhlbGVtZW50LmVsZW1lbnRzKS5mb3JFYWNoKGZpZWxkID0+IHtcclxuICAgICAgICAgICAgZmllbGQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBmdW5jdGlvbihlKSB7IGlucHV0LmNhbGwodGhpcywgZSk7IH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChzdWJtaXQpIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGUpID0+IHsgc3VibWl0LmNhbGwodGhpcywgZSk7IH0pO1xyXG4gICAgICAgIGlmIChyZXNldCkgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVzZXQnLCAgKGUpID0+IHsgIHJlc2V0LmNhbGwodGhpcywgZSk7IH0pO1xyXG4gICAgICAgIHNldCAmJiBzZXQuY2FsbCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBTbWFydEZvcm0ucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGdldDogICAgIGZ1bmN0aW9uKHByb3BlcnR5KSB7cmV0dXJuIGVsZW1lbnRbcHJvcGVydHldO30sXHJcbiAgICAgICAgc2V0OiAgICAgZnVuY3Rpb24ocHJvcGVydHksIHZhbHVlKSB7ZWxlbWVudFtwcm9wZXJ0eV0gPSB2YWx1ZTt9LFxyXG4gICAgICAgIHJlc2V0OiAgIGZ1bmN0aW9uKCkge2VsZW1lbnQucmVzZXQoKTt9LFxyXG4gICAgICAgIGZpZWxkOiAgIGZ1bmN0aW9uKG5hbWUpIHtyZXR1cm4gZWxlbWVudC5lbGVtZW50c1tuYW1lXX0sXHJcbiAgICAgICAgZmlsbDogICAgZnVuY3Rpb24oZGF0YSkge30sXHJcbiAgICAgICAgdmFsdWVPZjogZnVuY3Rpb24obmFtZSkge3JldHVybiB2YWx1ZU9mLmNhbGwodGhpcywgdGhpcy5maWVsZChuYW1lKSl9LFxyXG4gICAgICAgIGpzb246ICAgIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICAgICAgY29uc3QganNvbiA9IHt9O1xyXG4gICAgICAgICAgICBfKHRoaXMucm9vdC5lbGVtZW50cykuZm9yRWFjaChmaWVsZCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maWVsZChmaWVsZC5uYW1lKSkganNvbltmaWVsZC5uYW1lXSA9IHRoaXMudmFsdWVPZihmaWVsZC5uYW1lKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc29uO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIG5ldyBTbWFydEZvcm0oY29uZmlnKTtcclxuXHJcbiAgICBmdW5jdGlvbiB2YWx1ZU9mKGZpZWxkKSB7XHJcblxyXG4gICAgICAgIGlmICghZmllbGQpIHJldHVybiBudWxsO1xyXG4gICAgICAgIGlmICh0eXBlb2YgZmllbGQudmFsdWUgPT09ICdzdHJpbmcnKSByZXR1cm4gZmllbGQudmFsdWU7XHJcblxyXG4gICAgfVxyXG5cclxufTtcblxuY29uc3QgRklSRUJBU0VfQVVUSCA9IGZpcmViYXNlLmF1dGgoKTtcclxuY29uc3QgRklSRUJBU0VfREFUQUJBU0UgPSBmaXJlYmFzZS5kYXRhYmFzZSgpO1xyXG5cclxuY29uc3QgdWkgPSB7XHJcbiAgICBzaWduSW5CdXR0b246IGVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpZ24taW4nKSwgeyBldmVudHM6IHtjbGljazogc2lnbklufSB9KSxcclxuICAgIHNpZ25PdXRCVXR0b246IGVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpZ24tb3V0JyksIHsgZXZlbnRzOiB7Y2xpY2s6IHNpZ25PdXR9IH0pLFxyXG4gICAgdXNlcm5hbWVMYWJlbDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnVzZXJuYW1lJyksXHJcbiAgICBzZWN0aW9uczogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmFwcC1zZWN0aW9uJyksXHJcbiAgICBwYWdlTGlua3M6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYWdlLWxpbmsnKSxcclxuICAgIGNvbXBvc2U6ICh7c2hvdywgaGlkZX0pID0+IHtcclxuICAgICAgICBzaG93ICYmIHNob3cuZm9yRWFjaChlbCA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpKTtcclxuICAgICAgICBoaWRlICYmIGhpZGUuZm9yRWFjaChlbCA9PiBlbC5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsIHRydWUpKTtcclxuICAgIH0sXHJcbiAgICBzaG93OiAoZWxlbWVudCQkMSwgZm4pID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQkJDEgPT09ICdzdHJpbmcnKSBlbGVtZW50JCQxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChlbGVtZW50JCQxKTtcclxuICAgICAgICBpZiAoZWxlbWVudCQkMSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBlbGVtZW50JCQxLnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJyk7XHJcbiAgICAgICAgZWxzZSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVsZW1lbnQkJDEsIGVsID0+IGVsLnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJykpO1xyXG4gICAgICAgIGZuICYmIGZuKGVsZW1lbnQkJDEpO1xyXG4gICAgfSxcclxuICAgIGhpZGU6IChlbGVtZW50JCQxLCBmbikgPT4ge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudCQkMSA9PT0gJ3N0cmluZycpIGVsZW1lbnQkJDEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGVsZW1lbnQkJDEpO1xyXG4gICAgICAgIGlmIChlbGVtZW50JCQxIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGVsZW1lbnQkJDEuc2V0QXR0cmlidXRlKCdoaWRkZW4nLCB0cnVlKTtcclxuICAgICAgICBlbHNlIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWxlbWVudCQkMSwgZWwgPT4gZWwuc2V0QXR0cmlidXRlKCdoaWRkZW4nLCB0cnVlKSk7XHJcbiAgICAgICAgZm4gJiYgZm4oZWxlbWVudCQkMSk7XHJcbiAgICB9LFxyXG4gICAgcmVuZGVyU2VjdGlvbjogKHNlY3Rpb24pID0+IHtcclxuICAgICAgICBjb25zdCBsaXN0Q29udGFpbmVyID0gc2VjdGlvbi5xdWVyeVNlbGVjdG9yKCcuYXBwLWxpc3QnKTtcclxuICAgICAgICBsaXN0Q29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIEZJUkVCQVNFX0RBVEFCQVNFLnJlZihzZWN0aW9uLmlkKS5vbignY2hpbGRfYWRkZWQnLCBzbmFwc2hvdCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBzbmFwc2hvdC52YWwoKTtcclxuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHJlbmRlcihzZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoJy50ZW1wbGF0ZScpLCBkYXRhKTtcclxuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgIWxpc3RDb250YWluZXIuY29udGFpbnMoaXRlbSkpIGxpc3RDb250YWluZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KCdhZnRlckJlZ2luJywgaXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgbW9kYWwgPSBzZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW1vZGFsXScpO1xyXG4gICAgICAgIGNvbnN0IG9wZW5Gb3JtQnV0dG9uID0gc2VjdGlvbi5xdWVyeVNlbGVjdG9yKCcub3Blbi1mb3JtJyk7XHJcbiAgICAgICAgaWYgKG9wZW5Gb3JtQnV0dG9uICYmIG1vZGFsKSB7XHJcbiAgICAgICAgICAgIG9wZW5Gb3JtQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5jbGFzc0xpc3QuYWRkKCdvbicpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgbW9kYWwucXVlcnlTZWxlY3RvcignW2RhdGEtYnRufj1cImZlY2hhclwiXScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdvbicpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG51aS5wYWdlTGlua3MuZm9yRWFjaChsaW5rID0+IGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAodGhpcy5oYXNoKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHVpLmhpZGUodWkuc2VjdGlvbnMpO1xyXG4gICAgICAgIHVpLnNob3codGhpcy5oYXNoLCBub2RlcyA9PiB1aS5yZW5kZXJTZWN0aW9uKG5vZGVzWzBdKSk7XHJcbiAgICB9XHJcbn0pKTtcclxuXHJcbkZJUkVCQVNFX0FVVEgub25BdXRoU3RhdGVDaGFuZ2VkKGhhbmRsZUF1dGhTdGF0ZUNoYW5nZWQpO1xyXG5cclxuY29uc3QgYXBwRm9ybXMgPSB3aW5kb3cuYXBwRm9ybXMgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnZm9ybScpLCBmb3JtID0+IHNtYXJ0Zm9ybShmb3JtLCB7XHJcbiAgICBzZXQ6ICAgIGZ1bmN0aW9uKCkge30sXHJcbiAgICBjaGFuZ2U6IGZ1bmN0aW9uKGUpIHt9LFxyXG4gICAgaW5wdXQ6ICBmdW5jdGlvbihlKSB7fSxcclxuICAgIHN1Ym1pdDogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBGSVJFQkFTRV9EQVRBQkFTRS5yZWYodGhpcy5yb290LmRhdGFzZXQuYWN0aW9uKS5wdXNoKHRoaXMuanNvbigpKTtcclxuICAgICAgICB0aGlzLnJvb3QucmVzZXQoKTtcclxuICAgIH0sXHJcbiAgICByZXNldDogIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1vZGFsXS5vbicpLCBtb2RhbCA9PiBtb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdvbicpKTtcclxuICAgIH1cclxufSkpO1xyXG5cclxuZnVuY3Rpb24gc2lnbkluKCkge1xyXG4gICAgRklSRUJBU0VfQVVUSC5zaWduSW5XaXRoUG9wdXAoIG5ldyBmaXJlYmFzZS5hdXRoLkdvb2dsZUF1dGhQcm92aWRlcigpICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpZ25PdXQoKSB7XHJcbiAgICBGSVJFQkFTRV9BVVRILnNpZ25PdXQoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlQXV0aFN0YXRlQ2hhbmdlZCh1c2VyKSB7XHJcblxyXG4gICAgdWkuaGlkZSh1aS5zZWN0aW9ucyk7XHJcblxyXG4gICAgaWYgKHVzZXIpIHtcclxuXHJcbiAgICAgICAgY29uc3QgdXNlclJlZiA9IEZJUkVCQVNFX0RBVEFCQVNFLnJlZihgdXNlcnMvJHt1c2VyLnVpZH1gKTtcclxuICAgICAgICB1c2VyUmVmLm9uY2UoJ3ZhbHVlJywgc25hcHNob3QgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXNuYXBzaG90LnZhbCgpKSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyUmVmLnNldCh7XHJcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IHVzZXIuZGlzcGxheU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcGhvdG9VUkw6IHVzZXIucGhvdG9VUkwsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFNpZ25JblRpbWU6IERhdGUoKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyUmVmLmNoaWxkKCdsYXN0U2lnbkluVGltZScpLnNldChEYXRlKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHVpLmNvbXBvc2Uoe1xyXG4gICAgICAgICAgICBzaG93OiBbdWkuc2lnbk91dEJVdHRvbl0sXHJcbiAgICAgICAgICAgIGhpZGU6IFt1aS5zaWduSW5CdXR0b25dXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdWkudXNlcm5hbWVMYWJlbC5pbm5lckhUTUwgPSBgPHNwYW4gZGF0YS1ibG9jaz1cImlubGluZSBjaXJjXCI+PGltZyBzcmM9XCIke3VzZXIucGhvdG9VUkx9XCIgaGVpZ2h0PVwiMjVcIj48L3NwYW4+XHJcbiAgICAgICAgICAgIDxzbWFsbCB0aXRsZT1cIiR7dXNlci5lbWFpbH1cIiBjbGFzcz1cImRpc3BsYXktbmFtZVwiPiR7dXNlci5kaXNwbGF5TmFtZX08L3NtYWxsPmA7XHJcbiAgICAgICAgdWkuc2hvdygnI3Byb2plY3RzJywgbm9kZXMgPT4gdWkucmVuZGVyU2VjdGlvbihub2Rlc1swXSkpO1xyXG5cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHVpLmNvbXBvc2Uoe1xyXG4gICAgICAgICAgICBoaWRlOiBbdWkuc2lnbk91dEJVdHRvbl0sXHJcbiAgICAgICAgICAgIHNob3c6IFt1aS5zaWduSW5CdXR0b25dXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdWkudXNlcm5hbWVMYWJlbC5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICB1aS5zaG93KCcjZ3JlZXRpbmdzJyk7XHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyKGVsZW1lbnQkJDEsIGRhdGEpIHtcclxuICAgIGlmICghZWxlbWVudCQkMSB8fCAhZWxlbWVudCQkMS5jbG9uZU5vZGUpIHJldHVybiBjb25zb2xlLmxvZygnVGVtcGxhdGUgbsOjbyBlbmNvbnRyYWRvIScsIGVsZW1lbnQkJDEsIGRhdGEpO1xyXG4gICAgY29uc3QgY29udGFpbmVyID0gZWxlbWVudCQkMS5jbG9uZU5vZGUodHJ1ZSk7XHJcbiAgICBjb250YWluZXIucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKTtcclxuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1vZGVsXScpLCB0YWcgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBkYXRhW3RhZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtbW9kZWwnKV07XHJcbiAgICAgICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAgICAgaWYgKHRhZy50YWdOYW1lID09PSAnREFURVRJTUUnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB0YWcudGV4dENvbnRlbnQgPSBgJHtkYXRlLmdldERhdGUoKX0vJHtkYXRlLmdldE1vbnRoKCl9LyR7ZGF0ZS5nZXRGdWxsWWVhcigpfSAke2RhdGUuZ2V0SG91cnMoKX1oJHtkYXRlLmdldE1pbnV0ZXMoKX1gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRhZy50YWdOYW1lID09PSAnSU1HJykgdGFnLnNyYyA9IGNvbnRlbnQ7XHJcbiAgICAgICAgICAgIGVsc2UgdGFnLnRleHRDb250ZW50ID0gY29udGVudDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBjb250YWluZXI7XHJcbn1cblxufSgpKTtcbiJdfQ==
