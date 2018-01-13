import element from './lib/element';
import smartform from './lib/smartform';

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
        const listContainer = section.querySelector('.app-list');
        listContainer.innerHTML = '';
        FIREBASE_DATABASE.ref(section.id).on('child_added', snapshot => {
            const data = snapshot.val();
            const item = render(section.querySelector('.template'), data);
            if (item && !listContainer.contains(item)) listContainer.insertAdjacentElement('afterBegin', item);
        });
        const modal = section.querySelector('[data-modal]');
        const openFormButton = section.querySelector('.open-form');
        if (openFormButton && modal) {
            openFormButton.addEventListener('click', function() {
                modal.classList.add('on');
            });
            modal.querySelector('[data-btn~="fechar"]').addEventListener('click', function() {
                modal.classList.remove('on');
            });
        }
    }
};

Array.prototype.forEach.call(ui.pageLinks, link => link.addEventListener('click', function(e) {
    if (this.hash) {
        e.preventDefault();
        ui.hide(ui.sections);
        ui.show(this.hash, nodes => ui.renderSection(nodes[0]));
    }
}));

FIREBASE_AUTH.onAuthStateChanged(handleAuthStateChanged);

const appForms = window.appForms = Array.prototype.map.call(document.querySelectorAll('form'), form => smartform(form, {
    set:    function() {},
    change: function(e) {},
    input:  function(e) {},
    submit: function(e) {
        e.preventDefault();
        FIREBASE_DATABASE.ref(this.root.dataset.action).push(this.json());
        this.root.reset();
    },
    reset:  function(e) {
        Array.prototype.forEach.call(document.querySelectorAll('[data-modal].on'), modal => modal.classList.remove('on'));
    }
}));

function signIn() {
    FIREBASE_AUTH.signInWithPopup( new firebase.auth.GoogleAuthProvider() );
};

function signOut() {
    FIREBASE_AUTH.signOut();
};

function handleAuthStateChanged(user) {

    ui.hide(ui.sections);
    ui.hide(document.querySelector('#greetings .loading'));

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
        ui.show(ui.pageLinks);
        ui.show('#projects', nodes => ui.renderSection(nodes[0]));

    }
    else {
        ui.compose({
            hide: [ui.signOutBUtton],
            show: [ui.signInButton]
        });
        ui.usernameLabel.innerHTML = '';
        ui.hide(ui.pageLinks);
        ui.show('#greetings');
    }
    
};

function render(element, data) {
    if (!element || !element.cloneNode) return console.log('Template não encontrado!', element, data);
    const container = element.cloneNode(true);
    container.removeAttribute('hidden');
    Array.prototype.forEach.call(container.querySelectorAll('[data-model]'), tag => {
        const content = data[tag.getAttribute('data-model')];
        if (content) {
            if (tag.tagName === 'DATETIME') {
                const date = new Date(content);
                tag.textContent = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}h${date.getMinutes()}`;
            }
            else if (tag.tagName === 'IMG') tag.src = content;
            else tag.textContent = content;
        }
    });
    return container;
}
