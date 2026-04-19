// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    setPersistence, 
    browserLocalPersistence,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, // <-- Added for query
    query,      // <-- Added for query
    where,      // <-- Added for query
    getDocs     // <-- Added for query
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// --- Firebase Config ---
// (Keeping your provided config)
  const firebaseConfig = {
    apiKey: "AIzaSyCC7sNEByDpD-ftE936NoyF1W6KnHzCZME",
    authDomain: "salian-hub.firebaseapp.com",
    projectId: "salian-hub",
    storageBucket: "salian-hub.firebasestorage.app",
    messagingSenderId: "389748625220",
    appId: "1:389748625220:web:c5b5dabdd424f06ee65111",
    measurementId: "G-Z0Z062P4YP"
  };

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Set Persistence ---
(async () => {
    await setPersistence(auth, browserLocalPersistence);
})();

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const forgotPasswordFormContainer = document.getElementById('forgotPasswordFormContainer'); // New form
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm'); // New form

    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showForgotPasswordBtn = document.getElementById('showForgotPasswordBtn'); // New link
    const showLoginFromForgotBtn = document.getElementById('showLoginFromForgotBtn'); // New button

    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');

    const registerNameInput = document.getElementById('registerName');
    const registerEmailInput = document.getElementById('registerEmail');
    const registerPasswordInput = document.getElementById('registerPassword');
    const registerConfirmPasswordInput = document.getElementById('registerConfirmPassword');

    const forgotPasswordEmailInput = document.getElementById('forgotPasswordEmail'); // New input

    const loginMessageDiv = document.getElementById('loginMessage');
    const registerMessageDiv = document.getElementById('registerMessage');
    const forgotPasswordMessageDiv = document.getElementById('forgotPasswordMessage'); // New message div
    const emailStatusDiv = document.getElementById('emailStatus');

    // --- Register ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(registerMessageDiv);

        const username = registerNameInput.value.trim();
        const email = registerEmailInput.value.trim().toLowerCase();
        const password = registerPasswordInput.value;
        const confirmPassword = registerConfirmPasswordInput.value;
        const registerBtn = registerForm.querySelector("button[type='submit']");
        const originalText = registerBtn.innerHTML;

        // Validation
        if (!username || !email || !password || !confirmPassword) {
            showMessage(registerMessageDiv, 'Please fill in all fields.', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
            showMessage(registerMessageDiv, 'Enter a valid Gmail address.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage(registerMessageDiv, 'Passwords do not match.', 'error');
            return;
        }

        startLoading(registerBtn);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: email,
                role: "user",
                createdAt: new Date().toISOString()
            });

            
              // 2) Grant 14-day free trial for exactly 2 templates
  const TRIAL_TEMPLATES = ["poster-anna-poorna", "poster-sarapady"];

  // end-of-day ISO for the 14th day from today (today counts as day 1)
  const expiry = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + (14 - 1)); // +13 days → total 14 days including today
    d.setHours(23, 59, 59, 999);       // end of day
    return d.toISOString();
  })();

  const userRef = doc(db, "users", user.uid);

  // Build partial update with field paths (doesn't overwrite other access entries)
  const trialUpdate = {};
  TRIAL_TEMPLATES.forEach(tid => {
    trialUpdate[`access.${tid}.isRecharged`] = true;
    trialUpdate[`access.${tid}.rechargeExpiry`] = expiry;
    trialUpdate[`access.${tid}.freeTrial`] = true;
  });

  await updateDoc(userRef, trialUpdate);
            
                stopLoading(registerBtn, originalText);
                showMessage(registerMessageDiv, 'Registration successful! You can now sign in.', 'success');
                registerForm.reset();
                emailStatusDiv.textContent = '';
                setTimeout(() => {
                hideMessage(registerMessageDiv);
                showLoginBtn.click(); // Switch to login form
                }, 2000);

        } catch (err) {
            stopLoading(registerBtn, originalText);
            let msg = 'Registration failed. Try again.';
            if (err.code === 'auth/email-already-in-use') msg = 'Email is already registered.';
            else if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
            showMessage(registerMessageDiv, msg, 'error');
        }
    });

    // --- Login ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(loginMessageDiv);

        const email = loginEmailInput.value.trim().toLowerCase();
        const password = loginPasswordInput.value;
        const loginBtn = loginForm.querySelector("button[type='submit']");
        const originalText = loginBtn.innerHTML;

        if (!email || !password) {
            showMessage(loginMessageDiv, 'Please enter both email and password.', 'error');
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            showMessage(loginMessageDiv, 'Please enter a valid email address.', 'error');
            return;
        }

        startLoading(loginBtn);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

             // Fetch username from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            localStorage.setItem('loggedInUserId', user.uid);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('usergd', 'true');
            localStorage.setItem('userEmail', email);
            

const docRef = doc(db, "users", user.uid);
getDoc(docRef)
  .then((docSnap) => {
    if (docSnap.exists()) {
      const userData = docSnap.data(); // Firestore user data

      const username = userData.username; // from Firestore
      const email = user.email;           // from Firebase Auth
      const uid = user.uid;// from Firebase Auth
        const role = userData.role;
        
      if (username && email && uid) {
        const userInfo = {
          username: username,
          email: email,
          uid: uid,
            role: role
        };

        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        console.log("User info saved to localStorage");
      } else {
        console.log("Missing user info, not saved");
      }

    } else {
      console.log("No document found matching ID");
    }
  })
  .catch((error) => {
    console.error("Error fetching user document:", error);
  });

        
stopLoading(loginBtn, originalText);
            showMessage(loginMessageDiv, `Welcome back, ${userData.username || 'User'}!`, 'success');            loginForm.reset();
            setTimeout(() => {
                // Check if redirect URL is saved
const redirectUrl = localStorage.getItem("redirectUrl");

if (redirectUrl) {
  // Redirect to saved page
  window.location.href = redirectUrl;

  // Remove it after redirect to avoid reuse
  localStorage.removeItem("redirectUrl");
} else {
  // If no saved URL, redirect to home page
  window.location.href = '../../index.html';

}
            }, 1500);

        } catch (err) {
            stopLoading(loginBtn, originalText);
            let msg = 'Login failed. Try again.';
            if (err.code === 'auth/user-not-found') msg = 'No user found with that email.';
            else if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
            showMessage(loginMessageDiv, msg, 'error');
        }
    });

    // --- Forgot Password ---
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(forgotPasswordMessageDiv);

        const email = forgotPasswordEmailInput.value.trim();
        const resetBtn = forgotPasswordForm.querySelector("button[type='submit']");
        const originalText = resetBtn.innerHTML;

        if (!email) {
            showMessage(forgotPasswordMessageDiv, 'Please enter your email address.', 'error');
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            showMessage(forgotPasswordMessageDiv, 'Please enter a valid email address.', 'error');
            return;
        }

        startLoading(resetBtn);

        try {
            // **NEW STEP: Check if email exists in Firestore 'users' collection first**
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // No user found in Firestore with this email
                throw new Error("auth/user-not-found");
            }

            // **User found, now proceed to send reset email**
            await sendPasswordResetEmail(auth, email);
            
            stopLoading(resetBtn, originalText);
            showMessage(forgotPasswordMessageDiv, 'Password reset email sent! Check your inbox (and spam folder).', 'success');
            forgotPasswordForm.reset();

        } catch (err) {
            stopLoading(resetBtn, originalText);
            let msg = 'Failed to send reset email. Try again.';
            
            // Handle the "auth/user-not-found" error specifically
            // This will be triggered by our manual check (throw new Error) or by Firebase Auth
            if (err.code === 'auth/user-not-found' || err.message === 'auth/user-not-found') {
                msg = 'No user found with this email address.';
            }
            
            showMessage(forgotPasswordMessageDiv, msg, 'error');
        }
    });


            function showMessage(el, message, type = 'error') {
                el.textContent = message;
                el.className = 'message-box'; // Reset classes
                if (type === 'success') {
                    el.classList.add('success-message');
                } else { // Default to error for simplicity if not success
                    el.classList.add('error-message');
                }
                el.classList.add('show'); // Trigger animation
            }

            /**
             * Hides the message div.
             * @param {HTMLElement} el - The message div element.
             */
            function hideMessage(el) {
                el.classList.remove('show');
                // Optional: clear text after animation
                setTimeout(() => {
                    if (!el.classList.contains('show')) { // Check if it wasnt reshown quickly
                         el.textContent = '';
                    }
                }, 300); // Match transition duration
            }
            
            /**
             * Switches between login and registration forms with animation.
             * @param {HTMLElement} toHide - The form container to hide.
             * @param {HTMLElement} toShow - The form container to show.
             */
            function switchForms(toHide, toShow) {
                toHide.classList.remove('visible-form');
                toHide.classList.add('hidden-form');

                // Wait for the hide animation to complete before showing the new form
                setTimeout(() => {
                    toShow.classList.remove('hidden-form');
                    toShow.classList.add('visible-form');
                }, 50); // A small delay can help ensure the class changes apply for transition
            }


            // --- Form Switching Logic ---
            showRegisterBtn.addEventListener('click', () => {
                switchForms(loginFormContainer, registerFormContainer);
                hideMessage(loginMessageDiv);
                loginForm.reset();
                document.querySelectorAll('#loginForm .form-input').forEach(input => {
                    input.dispatchEvent(new Event('blur')); 
                });
            });

            showLoginBtn.addEventListener('click', () => {
                switchForms(registerFormContainer, loginFormContainer);
                hideMessage(registerMessageDiv);
                emailStatusDiv.textContent = '';
                registerForm.reset();
                document.querySelectorAll('#registerForm .form-input').forEach(input => {
                    input.dispatchEvent(new Event('blur'));
                });
            });

            // --- New Forgot Password Switching ---
            showForgotPasswordBtn.addEventListener('click', () => {
                switchForms(loginFormContainer, forgotPasswordFormContainer);
                hideMessage(loginMessageDiv);
                loginForm.reset();
                 document.querySelectorAll('#loginForm .form-input').forEach(input => {
                    input.dispatchEvent(new Event('blur'));
                });
            });

            showLoginFromForgotBtn.addEventListener('click', () => {
                switchForms(forgotPasswordFormContainer, loginFormContainer);
                hideMessage(forgotPasswordMessageDiv);
                forgotPasswordForm.reset();
                document.querySelectorAll('#forgotPasswordForm .form-input').forEach(input => {
                    input.dispatchEvent(new Event('blur'));
                });
            });

// Function to apply theme on page load
window.addEventListener('DOMContentLoaded', () => {
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    document.body.classList.add('dark');
  }
    
 const shouldShowRegister = localStorage.getItem("showRegister");

  if (shouldShowRegister === "true") {
    localStorage.removeItem("showRegister");

    const registerBtn = document.getElementById("showRegisterBtn");
    if (registerBtn) {
      registerBtn.click(); // Open the register section or form
    }
  }   
    
});

// Toggle theme and store preference
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
});

function startLoading(button) {
    button.disabled = true;
    button.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2 inline-block text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg> Loading...`;
}

function stopLoading(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
}


});