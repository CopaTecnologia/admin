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
        } else {
            ui.compose({
                hide: [ui.signOutBUtton],
                show: [ui.signInButton]
            });
            ui.usernameLabel.innerHTML = '';
        }
    }
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiZWxlbWVudCIsImNvbmZpZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImV4dGVuZE9iamVjdCIsIm9iaiIsInByb3BzIiwicHJvcCIsImlzT2JqZWN0IiwiZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJGSVJFQkFTRV9BVVRIIiwiZmlyZWJhc2UiLCJhdXRoIiwiRklSRUJBU0VfREFUQUJBU0UiLCJkYXRhYmFzZSIsInVpIiwic2lnbkluQnV0dG9uIiwicXVlcnlTZWxlY3RvciIsImV2ZW50cyIsImNsaWNrIiwic2lnbkluIiwic2lnbk91dEJVdHRvbiIsInNpZ25PdXQiLCJ1c2VybmFtZUxhYmVsIiwiY29tcG9zZSIsInNob3ciLCJoaWRlIiwiZm9yRWFjaCIsImVsIiwicmVtb3ZlQXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwib25BdXRoU3RhdGVDaGFuZ2VkIiwiaGFuZGxlQXV0aFN0YXRlQ2hhbmdlZCIsInNpZ25JbldpdGhQb3B1cCIsIkdvb2dsZUF1dGhQcm92aWRlciIsInVzZXIiLCJpbm5lckhUTUwiLCJwaG90b1VSTCIsImVtYWlsIiwiZGlzcGxheU5hbWUiLCJ1c2VyUmVmIiwicmVmIiwidWlkIiwib25jZSIsInNuYXBzaG90IiwidmFsIiwic2V0IiwibGFzdFNpZ25JblRpbWUiLCJEYXRlIiwiY2hpbGQiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQyxhQUFZO0FBQ2I7O0FBRUEsUUFBSUEsVUFBVSxpQkFBU0EsUUFBVCxFQUFrQkMsTUFBbEIsRUFBMEI7O0FBRXBDLFlBQUksT0FBT0QsUUFBUCxLQUFtQixRQUF2QixFQUFpQ0EsV0FBVUUsU0FBU0MsYUFBVCxDQUF1QkgsUUFBdkIsQ0FBVjtBQUNqQyxZQUFJLENBQUNBLFFBQUwsRUFBYyxPQUFPLEtBQVA7QUFDZCxZQUFJLFFBQU9DLE1BQVAseUNBQU9BLE1BQVAsT0FBa0IsUUFBdEIsRUFBZ0NHLGFBQWFKLFFBQWIsRUFBc0JDLE1BQXRCOztBQUVoQyxp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YyxnQkFBZCxFQUFnQ0gsR0FBaEMsQ0FBb0NFLE1BQXBDO0FBQ0g7QUFDSixhQVpEO0FBY0gsU0F2QkQsTUF3Qks7QUFDRGpDLGVBQUdTLE9BQUgsQ0FBVztBQUNQRSxzQkFBTSxDQUFDWCxHQUFHTSxhQUFKLENBREM7QUFFUEksc0JBQU0sQ0FBQ1YsR0FBR0MsWUFBSjtBQUZDLGFBQVg7QUFJQUQsZUFBR1EsYUFBSCxDQUFpQmEsU0FBakIsR0FBNkIsRUFBN0I7QUFDSDtBQUVKO0FBRUEsQ0E3RkEsR0FBRCIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgpIHtcbid1c2Ugc3RyaWN0JztcblxudmFyIGVsZW1lbnQgPSBmdW5jdGlvbihlbGVtZW50LCBjb25maWcpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50KTtcclxuICAgIGlmICghZWxlbWVudCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgaWYgKHR5cGVvZiBjb25maWcgPT09ICdvYmplY3QnKSBleHRlbmRPYmplY3QoZWxlbWVudCwgY29uZmlnKTtcclxuXHJcbiAgICBmdW5jdGlvbiBleHRlbmRPYmplY3Qob2JqLCBwcm9wcykge1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gcHJvcHMpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGlzT2JqZWN0ID0gcHJvcCBpbiBvYmogJiYgdHlwZW9mIG9ialtwcm9wXSA9PT0gJ29iamVjdCc7XHJcbiAgICAgICAgICAgIGlmIChwcm9wID09PSAnZXZlbnRzJykgZm9yIChjb25zdCBlIGluIHByb3BzW3Byb3BdKSBvYmouYWRkRXZlbnRMaXN0ZW5lcihlLCBwcm9wc1twcm9wXVtlXSwgZmFsc2UpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChpc09iamVjdCkgZXh0ZW5kT2JqZWN0KG9ialtwcm9wXSwgcHJvcHNbcHJvcF0pO1xyXG4gICAgICAgICAgICBlbHNlIG9ialtwcm9wXSA9IHByb3BzW3Byb3BdO1xyXG5cclxuICAgICAgICB9XHJcbiAgICBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlbWVudDtcclxuXHJcbn07XG5cbmNvbnN0IEZJUkVCQVNFX0FVVEggPSBmaXJlYmFzZS5hdXRoKCk7XHJcbmNvbnN0IEZJUkVCQVNFX0RBVEFCQVNFID0gZmlyZWJhc2UuZGF0YWJhc2UoKTtcclxuXHJcbmNvbnN0IHVpID0ge1xyXG4gICAgc2lnbkluQnV0dG9uOiBlbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zaWduLWluJyksIHtcclxuICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgY2xpY2s6IHNpZ25JblxyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgc2lnbk91dEJVdHRvbjogZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2lnbi1vdXQnKSwge1xyXG4gICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICBjbGljazogc2lnbk91dFxyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgdXNlcm5hbWVMYWJlbDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnVzZXJuYW1lJyksXHJcbiAgICBjb21wb3NlOiAoe3Nob3csIGhpZGV9KSA9PiB7XHJcbiAgICAgICAgc2hvdyAmJiBzaG93LmZvckVhY2goZWwgPT4gZWwucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKSk7XHJcbiAgICAgICAgaGlkZSAmJiBoaWRlLmZvckVhY2goZWwgPT4gZWwuc2V0QXR0cmlidXRlKCdoaWRkZW4nLCB0cnVlKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5GSVJFQkFTRV9BVVRILm9uQXV0aFN0YXRlQ2hhbmdlZChoYW5kbGVBdXRoU3RhdGVDaGFuZ2VkKTtcclxuXHJcbmZ1bmN0aW9uIHNpZ25JbigpIHtcclxuICAgIEZJUkVCQVNFX0FVVEguc2lnbkluV2l0aFBvcHVwKCBuZXcgZmlyZWJhc2UuYXV0aC5Hb29nbGVBdXRoUHJvdmlkZXIoKSApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaWduT3V0KCkge1xyXG4gICAgRklSRUJBU0VfQVVUSC5zaWduT3V0KCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZUF1dGhTdGF0ZUNoYW5nZWQodXNlcikge1xyXG5cclxuICAgIGlmICh1c2VyKSB7XHJcbiAgICAgICAgdWkuY29tcG9zZSh7XHJcbiAgICAgICAgICAgIHNob3c6IFt1aS5zaWduT3V0QlV0dG9uXSxcclxuICAgICAgICAgICAgaGlkZTogW3VpLnNpZ25JbkJ1dHRvbl1cclxuICAgICAgICB9KTtcclxuICAgICAgICB1aS51c2VybmFtZUxhYmVsLmlubmVySFRNTCA9IGA8c3BhbiBkYXRhLWJsb2NrPVwiaW5saW5lIGNpcmNcIj48aW1nIHNyYz1cIiR7dXNlci5waG90b1VSTH1cIiBoZWlnaHQ9XCIyNVwiPjwvc3Bhbj5cclxuICAgICAgICAgICAgPHNtYWxsIHRpdGxlPVwiJHt1c2VyLmVtYWlsfVwiPiR7dXNlci5kaXNwbGF5TmFtZX08L3NtYWxsPmA7XHJcblxyXG4gICAgICAgIGNvbnN0IHVzZXJSZWYgPSBGSVJFQkFTRV9EQVRBQkFTRS5yZWYoYHVzZXJzLyR7dXNlci51aWR9YCk7XHJcbiAgICAgICAgdXNlclJlZi5vbmNlKCd2YWx1ZScsIHNuYXBzaG90ID0+IHtcclxuICAgICAgICAgICAgaWYgKCFzbmFwc2hvdC52YWwoKSkge1xyXG4gICAgICAgICAgICAgICAgdXNlclJlZi5zZXQoe1xyXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiB1c2VyLmRpc3BsYXlOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHBob3RvVVJMOiB1c2VyLnBob3RvVVJMLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhc3RTaWduSW5UaW1lOiBEYXRlKClcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdXNlclJlZi5jaGlsZCgnbGFzdFNpZ25JblRpbWUnKS5zZXQoRGF0ZSgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHVpLmNvbXBvc2Uoe1xyXG4gICAgICAgICAgICBoaWRlOiBbdWkuc2lnbk91dEJVdHRvbl0sXHJcbiAgICAgICAgICAgIHNob3c6IFt1aS5zaWduSW5CdXR0b25dXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdWkudXNlcm5hbWVMYWJlbC5pbm5lckhUTUwgPSAnJztcclxuICAgIH1cclxuXHJcbn1cblxufSgpKTtcbiJdfQ==
