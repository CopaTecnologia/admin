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

    var FIREBASE_AUTH = firebase.auth();
    var FIREBASE_DATABASE = firebase.database();

    var ui = {
        signInButton: element(document.querySelector('.sign-in'), {
            events: {
                click: signIn
            }
        }),
        signOutBUtton: element(document.querySelector('.sign-out'), {
            events: {
                click: signOut
            }
        }),
        usernameLabel: document.querySelector('.username'),
        compose: function compose(_ref) {
            var show = _ref.show,
                hide = _ref.hide;

            show && show.forEach(function (el) {
                return el.removeAttribute('hidden');
            });
            hide && hide.forEach(function (el) {
                return el.setAttribute('hidden', true);
            });
        }
    };

    FIREBASE_AUTH.onAuthStateChanged(handleAuthStateChanged);

    function signIn() {
        FIREBASE_AUTH.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }

    function signOut() {
        FIREBASE_AUTH.signOut();
    }

    function handleAuthStateChanged(user) {

        if (user) {
            ui.compose({
                show: [ui.signOutBUtton],
                hide: [ui.signInButton]
            });
            ui.usernameLabel.innerHTML = '<span data-block="inline circ"><img src="' + user.photoURL + '" height="25"></span>\n            <small title="' + user.email + '">' + user.displayName + '</small>';
        } else {
            ui.compose({
                hide: [ui.signOutBUtton],
                show: [ui.signInButton]
            });
            ui.usernameLabel.innerHTML = '';
        }
    }
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiZWxlbWVudCIsImNvbmZpZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImV4dGVuZE9iamVjdCIsIm9iaiIsInByb3BzIiwicHJvcCIsImlzT2JqZWN0IiwiZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJGSVJFQkFTRV9BVVRIIiwiZmlyZWJhc2UiLCJhdXRoIiwiRklSRUJBU0VfREFUQUJBU0UiLCJkYXRhYmFzZSIsInVpIiwic2lnbkluQnV0dG9uIiwicXVlcnlTZWxlY3RvciIsImV2ZW50cyIsImNsaWNrIiwic2lnbkluIiwic2lnbk91dEJVdHRvbiIsInNpZ25PdXQiLCJ1c2VybmFtZUxhYmVsIiwiY29tcG9zZSIsInNob3ciLCJoaWRlIiwiZm9yRWFjaCIsImVsIiwicmVtb3ZlQXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwib25BdXRoU3RhdGVDaGFuZ2VkIiwiaGFuZGxlQXV0aFN0YXRlQ2hhbmdlZCIsInNpZ25JbldpdGhQb3B1cCIsIkdvb2dsZUF1dGhQcm92aWRlciIsInVzZXIiLCJpbm5lckhUTUwiLCJwaG90b1VSTCIsImVtYWlsIiwiZGlzcGxheU5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQyxhQUFZO0FBQ2I7O0FBRUEsUUFBSUEsVUFBVSxpQkFBU0EsUUFBVCxFQUFrQkMsTUFBbEIsRUFBMEI7O0FBRXBDLFlBQUksT0FBT0QsUUFBUCxLQUFtQixRQUF2QixFQUFpQ0EsV0FBVUUsU0FBU0MsYUFBVCxDQUF1QkgsUUFBdkIsQ0FBVjtBQUNqQyxZQUFJLENBQUNBLFFBQUwsRUFBYyxPQUFPLEtBQVA7QUFDZCxZQUFJLFFBQU9DLE1BQVAseUNBQU9BLE1BQVAsT0FBa0IsUUFBdEIsRUFBZ0NHLGFBQWFKLFFBQWIsRUFBc0JDLE1BQXRCOztBQUVoQyxpQkFBU0csWUFBVCxDQUFzQkMsR0FBdEIsRUFBMkJDLEtBQTNCLEVBQWtDOztBQUU5QixpQkFBSyxJQUFNQyxJQUFYLElBQW1CRCxLQUFuQixFQUEwQjs7QUFFdEIsb0JBQU1FLFdBQVdELFFBQVFGLEdBQVIsSUFBZSxRQUFPQSxJQUFJRSxJQUFKLENBQVAsTUFBcUIsUUFBckQ7QUFDQSxvQkFBSUEsU0FBUyxRQUFiLEVBQXVCLEtBQUssSUFBTUUsQ0FBWCxJQUFnQkgsTUFBTUMsSUFBTixDQUFoQjtBQUE2QkYsd0JBQUlLLGdCQUFKLENBQXFCRCxDQUFyQixFQUF3QkgsTUFBTUMsSUFBTixFQUFZRSxDQUFaLENBQXhCLEVBQXdDLEtBQXhDO0FBQTdCLGlCQUF2QixNQUNLLElBQUlELFFBQUosRUFBY0osYUFBYUMsSUFBSUUsSUFBSixDQUFiLEVBQXdCRCxNQUFNQyxJQUFOLENBQXhCLEVBQWQsS0FDQUYsSUFBSUUsSUFBSixJQUFZRCxNQUFNQyxJQUFOLENBQVo7QUFFUjtBQUVKOztBQUVELGVBQU9QLFFBQVA7QUFFSCxLQXJCRDs7QUF1QkEsUUFBTVcsZ0JBQWdCQyxTQUFTQyxJQUFULEVBQXRCO0FBQ0EsUUFBTUMsb0JBQW9CRixTQUFTRyxRQUFULEVBQTFCOztBQUVBLFFBQU1DLEtBQUs7QUFDUEMsc0JBQWNqQixRQUFRRSxTQUFTZ0IsYUFBVCxDQUF1QixVQUF2QixDQUFSLEVBQTRDO0FBQ3REQyxvQkFBUTtBQUNKQyx1QkFBT0M7QUFESDtBQUQ4QyxTQUE1QyxDQURQO0FBTVBDLHVCQUFldEIsUUFBUUUsU0FBU2dCLGFBQVQsQ0FBdUIsV0FBdkIsQ0FBUixFQUE2QztBQUN4REMsb0JBQVE7QUFDSkMsdUJBQU9HO0FBREg7QUFEZ0QsU0FBN0MsQ0FOUjtBQVdQQyx1QkFBZXRCLFNBQVNnQixhQUFULENBQXVCLFdBQXZCLENBWFI7QUFZUE8saUJBQVMsdUJBQWtCO0FBQUEsZ0JBQWhCQyxJQUFnQixRQUFoQkEsSUFBZ0I7QUFBQSxnQkFBVkMsSUFBVSxRQUFWQSxJQUFVOztBQUN2QkQsb0JBQVFBLEtBQUtFLE9BQUwsQ0FBYTtBQUFBLHVCQUFNQyxHQUFHQyxlQUFILENBQW1CLFFBQW5CLENBQU47QUFBQSxhQUFiLENBQVI7QUFDQUgsb0JBQVFBLEtBQUtDLE9BQUwsQ0FBYTtBQUFBLHVCQUFNQyxHQUFHRSxZQUFILENBQWdCLFFBQWhCLEVBQTBCLElBQTFCLENBQU47QUFBQSxhQUFiLENBQVI7QUFDSDtBQWZNLEtBQVg7O0FBa0JBcEIsa0JBQWNxQixrQkFBZCxDQUFpQ0Msc0JBQWpDOztBQUVBLGFBQVNaLE1BQVQsR0FBa0I7QUFDZFYsc0JBQWN1QixlQUFkLENBQStCLElBQUl0QixTQUFTQyxJQUFULENBQWNzQixrQkFBbEIsRUFBL0I7QUFDSDs7QUFFRCxhQUFTWixPQUFULEdBQW1CO0FBQ2ZaLHNCQUFjWSxPQUFkO0FBQ0g7O0FBRUQsYUFBU1Usc0JBQVQsQ0FBZ0NHLElBQWhDLEVBQXNDOztBQUVsQyxZQUFJQSxJQUFKLEVBQVU7QUFDTnBCLGVBQUdTLE9BQUgsQ0FBVztBQUNQQyxzQkFBTSxDQUFDVixHQUFHTSxhQUFKLENBREM7QUFFUEssc0JBQU0sQ0FBQ1gsR0FBR0MsWUFBSjtBQUZDLGFBQVg7QUFJQUQsZUFBR1EsYUFBSCxDQUFpQmEsU0FBakIsaURBQXlFRCxLQUFLRSxRQUE5RSx5REFDb0JGLEtBQUtHLEtBRHpCLFVBQ21DSCxLQUFLSSxXQUR4QztBQUVILFNBUEQsTUFRSztBQUNEeEIsZUFBR1MsT0FBSCxDQUFXO0FBQ1BFLHNCQUFNLENBQUNYLEdBQUdNLGFBQUosQ0FEQztBQUVQSSxzQkFBTSxDQUFDVixHQUFHQyxZQUFKO0FBRkMsYUFBWDtBQUlBRCxlQUFHUSxhQUFILENBQWlCYSxTQUFqQixHQUE2QixFQUE3QjtBQUNIO0FBRUo7QUFFQSxDQTdFQSxHQUFEIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZWxlbWVudCA9IGZ1bmN0aW9uKGVsZW1lbnQsIGNvbmZpZykge1xyXG5cclxuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQpO1xyXG4gICAgaWYgKCFlbGVtZW50KSByZXR1cm4gZmFsc2U7XHJcbiAgICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gJ29iamVjdCcpIGV4dGVuZE9iamVjdChlbGVtZW50LCBjb25maWcpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGV4dGVuZE9iamVjdChvYmosIHByb3BzKSB7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBwcm9wcykge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaXNPYmplY3QgPSBwcm9wIGluIG9iaiAmJiB0eXBlb2Ygb2JqW3Byb3BdID09PSAnb2JqZWN0JztcclxuICAgICAgICAgICAgaWYgKHByb3AgPT09ICdldmVudHMnKSBmb3IgKGNvbnN0IGUgaW4gcHJvcHNbcHJvcF0pIG9iai5hZGRFdmVudExpc3RlbmVyKGUsIHByb3BzW3Byb3BdW2VdLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGlzT2JqZWN0KSBleHRlbmRPYmplY3Qob2JqW3Byb3BdLCBwcm9wc1twcm9wXSk7XHJcbiAgICAgICAgICAgIGVsc2Ugb2JqW3Byb3BdID0gcHJvcHNbcHJvcF07XHJcblxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVtZW50O1xyXG5cclxufTtcblxuY29uc3QgRklSRUJBU0VfQVVUSCA9IGZpcmViYXNlLmF1dGgoKTtcclxuY29uc3QgRklSRUJBU0VfREFUQUJBU0UgPSBmaXJlYmFzZS5kYXRhYmFzZSgpO1xyXG5cclxuY29uc3QgdWkgPSB7XHJcbiAgICBzaWduSW5CdXR0b246IGVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpZ24taW4nKSwge1xyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBjbGljazogc2lnbkluXHJcbiAgICAgICAgfVxyXG4gICAgfSksXHJcbiAgICBzaWduT3V0QlV0dG9uOiBlbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zaWduLW91dCcpLCB7XHJcbiAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgIGNsaWNrOiBzaWduT3V0XHJcbiAgICAgICAgfVxyXG4gICAgfSksXHJcbiAgICB1c2VybmFtZUxhYmVsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudXNlcm5hbWUnKSxcclxuICAgIGNvbXBvc2U6ICh7c2hvdywgaGlkZX0pID0+IHtcclxuICAgICAgICBzaG93ICYmIHNob3cuZm9yRWFjaChlbCA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpKTtcclxuICAgICAgICBoaWRlICYmIGhpZGUuZm9yRWFjaChlbCA9PiBlbC5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsIHRydWUpKTtcclxuICAgIH1cclxufTtcclxuXHJcbkZJUkVCQVNFX0FVVEgub25BdXRoU3RhdGVDaGFuZ2VkKGhhbmRsZUF1dGhTdGF0ZUNoYW5nZWQpO1xyXG5cclxuZnVuY3Rpb24gc2lnbkluKCkge1xyXG4gICAgRklSRUJBU0VfQVVUSC5zaWduSW5XaXRoUG9wdXAoIG5ldyBmaXJlYmFzZS5hdXRoLkdvb2dsZUF1dGhQcm92aWRlcigpICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpZ25PdXQoKSB7XHJcbiAgICBGSVJFQkFTRV9BVVRILnNpZ25PdXQoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlQXV0aFN0YXRlQ2hhbmdlZCh1c2VyKSB7XHJcblxyXG4gICAgaWYgKHVzZXIpIHtcclxuICAgICAgICB1aS5jb21wb3NlKHtcclxuICAgICAgICAgICAgc2hvdzogW3VpLnNpZ25PdXRCVXR0b25dLFxyXG4gICAgICAgICAgICBoaWRlOiBbdWkuc2lnbkluQnV0dG9uXVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHVpLnVzZXJuYW1lTGFiZWwuaW5uZXJIVE1MID0gYDxzcGFuIGRhdGEtYmxvY2s9XCJpbmxpbmUgY2lyY1wiPjxpbWcgc3JjPVwiJHt1c2VyLnBob3RvVVJMfVwiIGhlaWdodD1cIjI1XCI+PC9zcGFuPlxyXG4gICAgICAgICAgICA8c21hbGwgdGl0bGU9XCIke3VzZXIuZW1haWx9XCI+JHt1c2VyLmRpc3BsYXlOYW1lfTwvc21hbGw+YDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHVpLmNvbXBvc2Uoe1xyXG4gICAgICAgICAgICBoaWRlOiBbdWkuc2lnbk91dEJVdHRvbl0sXHJcbiAgICAgICAgICAgIHNob3c6IFt1aS5zaWduSW5CdXR0b25dXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdWkudXNlcm5hbWVMYWJlbC5pbm5lckhUTUwgPSAnJztcclxuICAgIH1cclxuXHJcbn1cblxufSgpKTtcbiJdfQ==
