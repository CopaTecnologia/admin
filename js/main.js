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
        signInButton: element(document.querySelector('.sign-in'), { events: { click: signIn } }),
        signOutBUtton: element(document.querySelector('.sign-out'), { events: { click: signOut } }),
        usernameLabel: document.querySelector('.username'),
        sections: document.querySelectorAll('.app-section'),
        pageLinks: document.querySelectorAll('.page-link'),
        compose: function compose(_ref) {
            var show = _ref.show,
                hide = _ref.hide;

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
            console.log(section);
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
            ui.show('#projects');
        } else {
            ui.compose({
                hide: [ui.signOutBUtton],
                show: [ui.signInButton]
            });
            ui.usernameLabel.innerHTML = '';
            ui.show('#greetings');
        }
    }
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiZWxlbWVudCIsImNvbmZpZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImV4dGVuZE9iamVjdCIsIm9iaiIsInByb3BzIiwicHJvcCIsImlzT2JqZWN0IiwiZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJGSVJFQkFTRV9BVVRIIiwiZmlyZWJhc2UiLCJhdXRoIiwiRklSRUJBU0VfREFUQUJBU0UiLCJkYXRhYmFzZSIsInVpIiwic2lnbkluQnV0dG9uIiwicXVlcnlTZWxlY3RvciIsImV2ZW50cyIsImNsaWNrIiwic2lnbkluIiwic2lnbk91dEJVdHRvbiIsInNpZ25PdXQiLCJ1c2VybmFtZUxhYmVsIiwic2VjdGlvbnMiLCJxdWVyeVNlbGVjdG9yQWxsIiwicGFnZUxpbmtzIiwiY29tcG9zZSIsInNob3ciLCJoaWRlIiwiZm9yRWFjaCIsImVsIiwicmVtb3ZlQXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwiZWxlbWVudCQkMSIsImZuIiwiSFRNTEVsZW1lbnQiLCJBcnJheSIsInByb3RvdHlwZSIsImNhbGwiLCJyZW5kZXJTZWN0aW9uIiwic2VjdGlvbiIsImNvbnNvbGUiLCJsb2ciLCJsaW5rIiwiaGFzaCIsInByZXZlbnREZWZhdWx0Iiwibm9kZXMiLCJvbkF1dGhTdGF0ZUNoYW5nZWQiLCJoYW5kbGVBdXRoU3RhdGVDaGFuZ2VkIiwic2lnbkluV2l0aFBvcHVwIiwiR29vZ2xlQXV0aFByb3ZpZGVyIiwidXNlciIsInVzZXJSZWYiLCJyZWYiLCJ1aWQiLCJvbmNlIiwic25hcHNob3QiLCJ2YWwiLCJzZXQiLCJlbWFpbCIsImRpc3BsYXlOYW1lIiwicGhvdG9VUkwiLCJsYXN0U2lnbkluVGltZSIsIkRhdGUiLCJjaGlsZCIsImlubmVySFRNTCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFDLGFBQVk7QUFDYjs7QUFFQSxRQUFJQSxVQUFVLGlCQUFTQSxRQUFULEVBQWtCQyxNQUFsQixFQUEwQjs7QUFFcEMsWUFBSSxPQUFP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OztBQUVOLGdCQUFNQyxVQUFVeEMsa0JBQWtCeUMsR0FBbEIsWUFBK0JGLEtBQUtHLEdBQXBDLENBQWhCO0FBQ0FGLG9CQUFRRyxJQUFSLENBQWEsT0FBYixFQUFzQixvQkFBWTtBQUM5QixvQkFBSSxDQUFDQyxTQUFTQyxHQUFULEVBQUwsRUFBcUI7QUFDakJMLDRCQUFRTSxHQUFSLENBQVk7QUFDUkMsK0JBQU9SLEtBQUtRLEtBREo7QUFFUkMscUNBQWFULEtBQUtTLFdBRlY7QUFHUkMsa0NBQVVWLEtBQUtVLFFBSFA7QUFJUkMsd0NBQWdCQztBQUpSLHFCQUFaO0FBTUgsaUJBUEQsTUFRSztBQUNEWCw0QkFBUVksS0FBUixDQUFjLGdCQUFkLEVBQWdDTixHQUFoQyxDQUFvQ0ssTUFBcEM7QUFDSDtBQUNKLGFBWkQ7O0FBY0FqRCxlQUFHWSxPQUFILENBQVc7QUFDUEMsc0JBQU0sQ0FBQ2IsR0FBR00sYUFBSixDQURDO0FBRVBRLHNCQUFNLENBQUNkLEdBQUdDLFlBQUo7QUFGQyxhQUFYO0FBSUFELGVBQUdRLGFBQUgsQ0FBaUIyQyxTQUFqQixpREFBeUVkLEtBQUtVLFFBQTlFLHlEQUNvQlYsS0FBS1EsS0FEekIsK0JBQ3dEUixLQUFLUyxXQUQ3RDtBQUVBOUMsZUFBR2EsSUFBSCxDQUFRLFdBQVI7QUFFSCxTQXpCRCxNQTBCSztBQUNEYixlQUFHWSxPQUFILENBQVc7QUFDUEUsc0JBQU0sQ0FBQ2QsR0FBR00sYUFBSixDQURDO0FBRVBPLHNCQUFNLENBQUNiLEdBQUdDLFlBQUo7QUFGQyxhQUFYO0FBSUFELGVBQUdRLGFBQUgsQ0FBaUIyQyxTQUFqQixHQUE2QixFQUE3QjtBQUNBbkQsZUFBR2EsSUFBSCxDQUFRLFlBQVI7QUFDSDtBQUVKO0FBRUEsQ0FuSEEsR0FBRCIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgpIHtcbid1c2Ugc3RyaWN0JztcblxudmFyIGVsZW1lbnQgPSBmdW5jdGlvbihlbGVtZW50LCBjb25maWcpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50KTtcclxuICAgIGlmICghZWxlbWVudCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgaWYgKHR5cGVvZiBjb25maWcgPT09ICdvYmplY3QnKSBleHRlbmRPYmplY3QoZWxlbWVudCwgY29uZmlnKTtcclxuXHJcbiAgICBmdW5jdGlvbiBleHRlbmRPYmplY3Qob2JqLCBwcm9wcykge1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gcHJvcHMpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGlzT2JqZWN0ID0gcHJvcCBpbiBvYmogJiYgdHlwZW9mIG9ialtwcm9wXSA9PT0gJ29iamVjdCc7XHJcbiAgICAgICAgICAgIGlmIChwcm9wID09PSAnZXZlbnRzJykgZm9yIChjb25zdCBlIGluIHByb3BzW3Byb3BdKSBvYmouYWRkRXZlbnRMaXN0ZW5lcihlLCBwcm9wc1twcm9wXVtlXSwgZmFsc2UpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChpc09iamVjdCkgZXh0ZW5kT2JqZWN0KG9ialtwcm9wXSwgcHJvcHNbcHJvcF0pO1xyXG4gICAgICAgICAgICBlbHNlIG9ialtwcm9wXSA9IHByb3BzW3Byb3BdO1xyXG5cclxuICAgICAgICB9XHJcbiAgICBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlbWVudDtcclxuXHJcbn07XG5cbmNvbnN0IEZJUkVCQVNFX0FVVEggPSBmaXJlYmFzZS5hdXRoKCk7XHJcbmNvbnN0IEZJUkVCQVNFX0RBVEFCQVNFID0gZmlyZWJhc2UuZGF0YWJhc2UoKTtcclxuXHJcbmNvbnN0IHVpID0ge1xyXG4gICAgc2lnbkluQnV0dG9uOiBlbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zaWduLWluJyksIHsgZXZlbnRzOiB7Y2xpY2s6IHNpZ25Jbn0gfSksXHJcbiAgICBzaWduT3V0QlV0dG9uOiBlbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zaWduLW91dCcpLCB7IGV2ZW50czoge2NsaWNrOiBzaWduT3V0fSB9KSxcclxuICAgIHVzZXJuYW1lTGFiZWw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy51c2VybmFtZScpLFxyXG4gICAgc2VjdGlvbnM6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hcHAtc2VjdGlvbicpLFxyXG4gICAgcGFnZUxpbmtzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZS1saW5rJyksXHJcbiAgICBjb21wb3NlOiAoe3Nob3csIGhpZGV9KSA9PiB7XHJcbiAgICAgICAgc2hvdyAmJiBzaG93LmZvckVhY2goZWwgPT4gZWwucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKSk7XHJcbiAgICAgICAgaGlkZSAmJiBoaWRlLmZvckVhY2goZWwgPT4gZWwuc2V0QXR0cmlidXRlKCdoaWRkZW4nLCB0cnVlKSk7XHJcbiAgICB9LFxyXG4gICAgc2hvdzogKGVsZW1lbnQkJDEsIGZuKSA9PiB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50JCQxID09PSAnc3RyaW5nJykgZWxlbWVudCQkMSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZWxlbWVudCQkMSk7XHJcbiAgICAgICAgaWYgKGVsZW1lbnQkJDEgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgZWxlbWVudCQkMS5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpO1xyXG4gICAgICAgIGVsc2UgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbGVtZW50JCQxLCBlbCA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpKTtcclxuICAgICAgICBmbiAmJiBmbihlbGVtZW50JCQxKTtcclxuICAgIH0sXHJcbiAgICBoaWRlOiAoZWxlbWVudCQkMSwgZm4pID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQkJDEgPT09ICdzdHJpbmcnKSBlbGVtZW50JCQxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChlbGVtZW50JCQxKTtcclxuICAgICAgICBpZiAoZWxlbWVudCQkMSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBlbGVtZW50JCQxLnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgdHJ1ZSk7XHJcbiAgICAgICAgZWxzZSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVsZW1lbnQkJDEsIGVsID0+IGVsLnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgdHJ1ZSkpO1xyXG4gICAgICAgIGZuICYmIGZuKGVsZW1lbnQkJDEpO1xyXG4gICAgfSxcclxuICAgIHJlbmRlclNlY3Rpb246IChzZWN0aW9uKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coc2VjdGlvbik7XHJcbiAgICB9XHJcbn07XHJcblxyXG51aS5wYWdlTGlua3MuZm9yRWFjaChsaW5rID0+IGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAodGhpcy5oYXNoKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHVpLmhpZGUodWkuc2VjdGlvbnMpO1xyXG4gICAgICAgIHVpLnNob3codGhpcy5oYXNoLCBub2RlcyA9PiB1aS5yZW5kZXJTZWN0aW9uKG5vZGVzWzBdKSk7XHJcbiAgICB9XHJcbn0pKTtcclxuXHJcbkZJUkVCQVNFX0FVVEgub25BdXRoU3RhdGVDaGFuZ2VkKGhhbmRsZUF1dGhTdGF0ZUNoYW5nZWQpO1xyXG5cclxuZnVuY3Rpb24gc2lnbkluKCkge1xyXG4gICAgRklSRUJBU0VfQVVUSC5zaWduSW5XaXRoUG9wdXAoIG5ldyBmaXJlYmFzZS5hdXRoLkdvb2dsZUF1dGhQcm92aWRlcigpICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpZ25PdXQoKSB7XHJcbiAgICBGSVJFQkFTRV9BVVRILnNpZ25PdXQoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlQXV0aFN0YXRlQ2hhbmdlZCh1c2VyKSB7XHJcblxyXG4gICAgdWkuaGlkZSh1aS5zZWN0aW9ucyk7XHJcblxyXG4gICAgaWYgKHVzZXIpIHtcclxuXHJcbiAgICAgICAgY29uc3QgdXNlclJlZiA9IEZJUkVCQVNFX0RBVEFCQVNFLnJlZihgdXNlcnMvJHt1c2VyLnVpZH1gKTtcclxuICAgICAgICB1c2VyUmVmLm9uY2UoJ3ZhbHVlJywgc25hcHNob3QgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXNuYXBzaG90LnZhbCgpKSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyUmVmLnNldCh7XHJcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IHVzZXIuZGlzcGxheU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcGhvdG9VUkw6IHVzZXIucGhvdG9VUkwsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFNpZ25JblRpbWU6IERhdGUoKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyUmVmLmNoaWxkKCdsYXN0U2lnbkluVGltZScpLnNldChEYXRlKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHVpLmNvbXBvc2Uoe1xyXG4gICAgICAgICAgICBzaG93OiBbdWkuc2lnbk91dEJVdHRvbl0sXHJcbiAgICAgICAgICAgIGhpZGU6IFt1aS5zaWduSW5CdXR0b25dXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdWkudXNlcm5hbWVMYWJlbC5pbm5lckhUTUwgPSBgPHNwYW4gZGF0YS1ibG9jaz1cImlubGluZSBjaXJjXCI+PGltZyBzcmM9XCIke3VzZXIucGhvdG9VUkx9XCIgaGVpZ2h0PVwiMjVcIj48L3NwYW4+XHJcbiAgICAgICAgICAgIDxzbWFsbCB0aXRsZT1cIiR7dXNlci5lbWFpbH1cIiBjbGFzcz1cImRpc3BsYXktbmFtZVwiPiR7dXNlci5kaXNwbGF5TmFtZX08L3NtYWxsPmA7XHJcbiAgICAgICAgdWkuc2hvdygnI3Byb2plY3RzJyk7XHJcblxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdWkuY29tcG9zZSh7XHJcbiAgICAgICAgICAgIGhpZGU6IFt1aS5zaWduT3V0QlV0dG9uXSxcclxuICAgICAgICAgICAgc2hvdzogW3VpLnNpZ25JbkJ1dHRvbl1cclxuICAgICAgICB9KTtcclxuICAgICAgICB1aS51c2VybmFtZUxhYmVsLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIHVpLnNob3coJyNncmVldGluZ3MnKTtcclxuICAgIH1cclxuXHJcbn1cblxufSgpKTtcbiJdfQ==
