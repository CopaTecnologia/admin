import element from './lib/element';

const FIREBASE_AUTH = firebase.auth();
const FIREBASE_DATABASE = firebase.database();

const ui = {
    signInButton: element(document.querySelector('.sign-in'), { events: {click: signIn} }),
    signOutBUtton: element(document.querySelector('.sign-out'), { events: {click: signOut} }),
    usernameLabel: document.querySelector('.username'),
    sections: document.querySelectorAll('.app-section'),
    pageLinks: document.querySelectorAll('.page-link'),
    compose: ({show, hide}) => {
        show && show.forEach(el => el.removeAttribute('hidden'));
        hide && hide.forEach(el => el.setAttribute('hidden', true));
    },
    show: (element, fn) => {
        if (typeof element === 'string') element = document.querySelectorAll(element);
        if (element instanceof HTMLElement) element.removeAttribute('hidden');
        else Array.prototype.forEach.call(element, el => el.removeAttribute('hidden'));
        fn && fn(element);
    },
    hide: (element, fn) => {
        if (typeof element === 'string') element = document.querySelectorAll(element);
        if (element instanceof HTMLElement) element.setAttribute('hidden', true);
        else Array.prototype.forEach.call(element, el => el.setAttribute('hidden', true));
        fn && fn(element);
    },
    renderSection: (section) => {
        console.log(section);
    }
};

ui.pageLinks.forEach(link => link.addEventListener('click', function(e) {
    if (this.hash) {
        e.preventDefault();
        ui.hide(ui.sections);
        ui.show(this.hash, nodes => ui.renderSection(nodes[0]));
    }
}));

FIREBASE_AUTH.onAuthStateChanged(handleAuthStateChanged);

function signIn() {
    FIREBASE_AUTH.signInWithPopup( new firebase.auth.GoogleAuthProvider() );
};

function signOut() {
    FIREBASE_AUTH.signOut();
};

function handleAuthStateChanged(user) {

    ui.hide(ui.sections);

    if (user) {

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

        ui.compose({
            show: [ui.signOutBUtton],
            hide: [ui.signInButton]
        });
        ui.usernameLabel.innerHTML = `<span data-block="inline circ"><img src="${user.photoURL}" height="25"></span>
            <small title="${user.email}" class="display-name">${user.displayName}</small>`;
        ui.show('#projects');

    }
    else {
        ui.compose({
            hide: [ui.signOutBUtton],
            show: [ui.signInButton]
        });
        ui.usernameLabel.innerHTML = '';
        ui.show('#greetings');
    }

};
