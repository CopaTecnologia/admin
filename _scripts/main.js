import element from './lib/element';

const FIREBASE_AUTH = firebase.auth();
const FIREBASE_DATABASE = firebase.database();

const ui = {
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
    compose: ({show, hide}) => {
        show && show.forEach(el => el.removeAttribute('hidden'));
        hide && hide.forEach(el => el.setAttribute('hidden', true));
    }
};

FIREBASE_AUTH.onAuthStateChanged(handleAuthStateChanged);

function signIn() {
    FIREBASE_AUTH.signInWithPopup( new firebase.auth.GoogleAuthProvider() );
};

function signOut() {
    FIREBASE_AUTH.signOut();
};

function handleAuthStateChanged(user) {

    if (user) {
        ui.compose({
            show: [ui.signOutBUtton],
            hide: [ui.signInButton]
        });
        ui.usernameLabel.innerHTML = `<span data-block="inline circ"><img src="${user.photoURL}" height="25"></span>
            <small title="${user.email}">${user.displayName}</small>`;

        const userRef = FIREBASE_DATABASE.ref(`users/${user.uid}`);
        userRef.once('value', snapshot => {
            if (!snapshot.val()) {
                userRef.set({
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastSignInTime: Date()
                });
            }
            else {
                userRef.child('lastSignInTime').set(Date());
            }
        });

    }
    else {
        ui.compose({
            hide: [ui.signOutBUtton],
            show: [ui.signInButton]
        });
        ui.usernameLabel.innerHTML = '';
    }

};
