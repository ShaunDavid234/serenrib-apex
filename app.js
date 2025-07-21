import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { items } from './items.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNUwFIbN25rRuZW3URLvtXGzof2FhmW5E",
  authDomain: "fantasylife-ae5cf.firebaseapp.com",
  projectId: "fantasylife-ae5cf",
  storageBucket: "fantasylife-ae5cf.appspot.com",
  messagingSenderId: "694532802508",
  appId: "1:694532802508:web:512810d52ffb3bd9d2bf69",
  measurementId: "G-6RGP132EE9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const gameContainer = document.getElementById('game-container');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerButton = document.getElementById('register-button');
const switchToRegisterLink = document.getElementById('switch-to-register');
const switchToLoginLink = document.getElementById('switch-to-login');
const player = document.getElementById('player');

let playerId;
let playerRef;

loginButton.addEventListener('click', () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    loginContainer.classList.add('submitting');

    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Login failed:', errorCode, errorMessage);
        })
        .finally(() => {
            loginContainer.classList.remove('submitting');
        });
});

switchToRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.classList.add('hidden');
    setTimeout(() => {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
        registerContainer.classList.remove('hidden');
    }, 500);
});

switchToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerContainer.classList.add('hidden');
    setTimeout(() => {
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
        loginContainer.classList.remove('hidden');
    }, 500);
});

registerButton.addEventListener('click', () => {
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;

    registerContainer.classList.add('submitting');

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const playerRef = ref(database, 'players/' + user.uid);
            set(playerRef, {
                x: 400,
                y: 300,
                inventory: []
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Registration failed:', errorCode, errorMessage);
        })
        .finally(() => {
            registerContainer.classList.remove('submitting');
        });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        playerId = user.uid;
        playerRef = ref(database, 'players/' + playerId);
        set(playerRef, {
            x: 400,
            y: 300,
            inventory: []
        });

        loginContainer.style.display = 'none';
        gameContainer.style.display = 'block';

        const backgroundMusic = document.getElementById('background-music');
        backgroundMusic.play();

        initializeItems();
        initializeEnvironment();

        onValue(ref(database, 'players'), (snapshot) => {
            const players = snapshot.val();
            if (players) {
                Object.keys(players).forEach((id) => {
                    const playerPosition = players[id];
                    let playerElement = document.getElementById(id);
                    if (!playerElement) {
                        playerElement = createPlayerElement(id);
                    }
                    playerElement.style.left = playerPosition.x + 'px';
                    playerElement.style.top = playerPosition.y + 'px';
                });
            }
        });

        onValue(ref(database, 'environment'), (snapshot) => {
            const environment = snapshot.val();
            if (environment) {
                const treeElements = document.querySelectorAll('.tree');
                treeElements.forEach((treeElement) => {
                    treeElement.remove();
                });

                environment.trees.forEach((tree) => {
                    const treeElement = createTreeElement(tree);
                    treeElement.style.left = tree.x + 'px';
                    treeElement.style.top = tree.y + 'px';
                });

                const riverElements = document.querySelectorAll('.river');
                riverElements.forEach((riverElement) => {
                    riverElement.remove();
                });

                environment.river.forEach((segment) => {
                    const riverElement = createRiverElement(segment);
                    riverElement.style.left = segment.x + 'px';
                    riverElement.style.top = segment.y + 'px';
                });
            }
        });

        onValue(ref(database, 'items'), (snapshot) => {
            const items = snapshot.val();
            const itemElements = document.querySelectorAll('.item');
            itemElements.forEach((itemElement) => {
                if (!items || !items[itemElement.id]) {
                    itemElement.remove();
                }
            });

            if (items) {
                Object.keys(items).forEach((name) => {
                    const itemPosition = items[name];
                    let itemElement = document.getElementById(name);
                    if (!itemElement) {
                        itemElement = createItemElement(name);
                    }
                    itemElement.style.left = itemPosition.x + 'px';
                    itemElement.style.top = itemPosition.y + 'px';
                });
            }
        });
    }
});

function initializeItems() {
    const itemsRef = ref(database, 'items');
    const allItems = [
        ...items.weapons,
        ...items.staffs,
        ...items.foods,
        ...items.drinks,
        ...items.fun
    ];

    allItems.forEach((item) => {
        const itemRef = ref(database, 'items/' + item.name);
        set(itemRef, {
            x: Math.random() * 750,
            y: Math.random() * 550
        });
    });
}

function initializeEnvironment() {
    const environmentRef = ref(database, 'environment');
    const trees = [];
    for (let i = 0; i < 20; i++) {
        trees.push({
            x: Math.random() * 800,
            y: Math.random() * 600
        });
    }

    const river = [];
    let x = 0;
    let y = Math.random() * 200 + 200;
    while (x < 800) {
        river.push({ x, y });
        x += 10;
        y += (Math.random() - 0.5) * 10;
    }

    set(environmentRef, { trees, river });
}

function createPlayerElement(id) {
    const playerElement = document.createElement('div');
    playerElement.id = id;
    if (id === playerId) {
        playerElement.id = 'player';
    } else {
        playerElement.classList.add('player');
    }
    gameContainer.appendChild(playerElement);
    return playerElement;
}

function createItemElement(name) {
    const itemElement = document.createElement('div');
    itemElement.id = name;
    itemElement.classList.add('item');
    gameContainer.appendChild(itemElement);
    return itemElement;
}

function createTreeElement() {
    const treeElement = document.createElement('div');
    treeElement.classList.add('tree');
    gameContainer.appendChild(treeElement);
    return treeElement;
}

function createRiverElement() {
    const riverElement = document.createElement('div');
    riverElement.classList.add('river');
    gameContainer.appendChild(riverElement);
    return riverElement;
}

let isWalking = false;

document.addEventListener('keydown', (e) => {
    if (!playerId) return;
    const playerElement = document.getElementById('player');
    const playerPosition = {
        x: parseInt(playerElement.style.left) || 400,
        y: parseInt(playerElement.style.top) || 300
    };

    if (e.key === 'ArrowUp') {
        playerPosition.y -= 10;
    } else if (e.key === 'ArrowDown') {
        playerPosition.y += 10;
    } else if (e.key === 'ArrowLeft') {
        playerPosition.x -= 10;
    } else if (e.key === 'ArrowRight') {
        playerPosition.x += 10;
    }

    set(playerRef, { x: playerPosition.x, y: playerPosition.y });

    if (!isWalking) {
        isWalking = true;
        playerElement.classList.add('walking');
    }

    checkForItemCollision();
});

function checkForItemCollision() {
    const playerElement = document.getElementById('player');
    const playerRect = playerElement.getBoundingClientRect();
    const items = document.querySelectorAll('.item');
    items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        if (
            playerRect.x < itemRect.x + itemRect.width &&
            playerRect.x + playerRect.width > itemRect.x &&
            playerRect.y < itemRect.y + itemRect.height &&
            playerRect.y + playerRect.height > itemRect.y
        ) {
            const itemName = item.id;
            const itemRef = ref(database, 'items/' + itemName);
            set(itemRef, null);
            const playerInventoryRef = ref(database, 'players/' + playerId + '/inventory');
            onValue(playerInventoryRef, (snapshot) => {
                const inventory = snapshot.val() || [];
                inventory.push(itemName);
                set(playerInventoryRef, inventory);
            }, { onlyOnce: true });
        }
    });
}

document.addEventListener('keyup', (e) => {
    if (!playerId) return;
    const playerElement = document.getElementById('player');
    isWalking = false;
    playerElement.classList.remove('walking');
});
