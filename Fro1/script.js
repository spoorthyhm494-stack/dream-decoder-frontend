const API = "https://dream-decoder-backend.onrender.com/";

// =================================================================
// 1. GLOBAL ELEMENT DEFINITIONS
// =================================================================
const progress = document.getElementById('progress-summary'); 
const reminderText = document.getElementById('reminderText');
const reminderTime = document.getElementById('reminderTime');
const reminderList = document.getElementById("reminderList");
const createReminderBtn = document.getElementById('createReminderBtn'); 
// Assuming these are also defined for their respective pages:
const dreamEntry = document.getElementById("dreamEntry"); // Used in saveDream
const dreamList = document.getElementById("dreamList");
const futureMsg = document.getElementById('futureMsg');        
const futureDate = document.getElementById('futureDate');      
const futureList = document.getElementById("futureList");      
const sendButton = document.getElementById('sendFutureBtn');


// =================================================================
// 2. AUTHENTICATION (No changes needed)
// =================================================================
function go(page) {
    window.location.href = `${page}.html`;
}

async function login() {
    const email = loginEmail.value; // Assuming loginEmail is defined globally on login.html
    const password = loginPassword.value; // Assuming loginPassword is defined globally on login.html

    const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
        localStorage.setItem("token", data.token);
        go("dashboard");
    } else {
        alert(data.message);
    }
}

async function signup() {
    const name = document.getElementById("name").value;
    const email = signupEmail.value; // Assuming signupEmail is defined globally
    const password = signupPassword.value; // Assuming signupPassword is defined globally

    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) alert("Signup successful!");
    else alert(data.message);
}

function logout() {
    localStorage.removeItem("token");
    go("index");
}

// Helper to get token in Bearer format
const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? `Bearer ${token}` : '';
};

// =================================================================
// 3. DREAM NOTES
// =================================================================

async function saveDream() {
    const content = dreamEntry.value;

    if (!content) {
        alert("Please type a dream to save.");
        return;
    }

    try {
        const res = await fetch(`${API}/dream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getAuthHeader() // ✅ FIX: Use consistent Bearer format
            },
            body: JSON.stringify({ 
                title: "Dream Note", 
                content: content 
            })
        });

        if (!res.ok) throw new Error("Failed to save dream.");
        
        alert("Dream saved!");
        dreamEntry.value = '';
        loadDreams();
    } catch (error) {
        console.error("Save Dream Error:", error);
        alert(error.message || "Error saving dream.");
    }
}

async function loadDreams() {
    if (!dreamList) return;

    try {
        const res = await fetch(`${API}/dream`, {
            method: "GET",
            headers: { 
                "Authorization": getAuthHeader() // ✅ FIX: Use consistent Bearer format
            }
        });

        if (!res.ok) {
            console.error("Failed to fetch dreams:", res.status);
            dreamList.innerHTML = `<p class="error-message">Could not load dreams. Please log in again.</p>`;
            return;
        }

        const data = await res.json();
        
        // Render logic to handle array or wrapper object
        let dreamsToRender = [];
        if (Array.isArray(data)) {
            dreamsToRender = data;
        } else if (data.dreams && Array.isArray(data.dreams)) {
            dreamsToRender = data.dreams;
        }

        if (dreamsToRender.length > 0) {
            dreamList.innerHTML = dreamsToRender.map(d => 
                `<p>🌙 ${d.content || d.text} <small>(${new Date(d.createdAt).toLocaleDateString()})</small></p>`
            ).join("");
        } else {
            dreamList.innerHTML = `<p>No dreams found. Start journaling!</p>`;
        }
    } catch (error) {
        console.error("LOAD DREAMS CRASH:", error);
        dreamList.innerHTML = `<p class="error-message">Error processing dream data.</p>`;
    }
}


// =================================================================
// 4. DREAM DECODER (Logic is fine, just cleaning up)
// =================================================================

async function decodeDream() {
    // ... (Your decodeDream logic remains mostly the same, as headers were correct) ...
    // Note: The element fetching logic inside this function is less efficient 
    // than defining them globally, but it works for a standalone decoder page.
    const dreamInput = document.getElementById('dreamInput');
    const loadingMessage = document.getElementById('loadingMessage');
    const decoderOutput = document.getElementById('decoderOutput');
    const outputSummary = document.getElementById('outputSummary');
    const outputEmotion = document.getElementById('outputEmotion');

    if (!dreamInput || !loadingMessage || !decoderOutput || !outputSummary || !outputEmotion) {
        console.error('Some required HTML elements are missing.');
        alert('Application Error: Missing required display elements.');
        return;
    }

    const input = dreamInput.value.trim();
    if (input === "") {
        alert("Please describe your dream before decoding.");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadingMessage.style.display = 'block';
    decoderOutput.style.display = 'none';

    try {
        const response = await fetch(`${API}/decoder/decode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify({ dreamText: input })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        loadingMessage.style.display = 'none';
        decoderOutput.style.display = 'block';
        outputSummary.textContent = data.decoded || 'Unable to decode dream';
        outputEmotion.textContent = data.emotion || 'Unable to determine emotion';

        decoderOutput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.style.display = 'none';
        alert('Error decoding dream. Please try again.');
    }
}

async function saveDreamEntry(event) {
    const dreamInput = document.getElementById('dreamInput');
    if (!dreamInput) return;

    const dreamText = dreamInput.value.trim();
    if (!dreamText) {
        alert("No dream to save.");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const btn = event.target;
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = '💾 Saving...';

    try {
        const response = await fetch(`${API}/decoder/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify({ title: 'Decoded Dream', description: dreamText, emotions: ['Analyzed'] })
        });

        if (response.ok) {
            btn.textContent = '✓ Saved!';
            btn.style.background = '#43e97b';
            setTimeout(() => {
                btn.textContent = '💾 Save Dream to Journal';
                btn.style.background = '';
                btn.disabled = false;
            }, 2000);
        } else {
            alert('Error saving dream.');
            btn.textContent = '💾 Save Dream to Journal';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving dream. Check server connection.');
        btn.textContent = '💾 Save Dream to Journal';
        btn.disabled = false;
    }
}


// =================================================================
// 5. ROADMAPS (Logic is fine, headers confirmed correct)
// =================================================================

async function createRoadmap() {
    const goal = document.getElementById("roadmapTitle").value;
    const token = localStorage.getItem("token");

    if (!goal) return alert("Enter a goal to generate a roadmap!");
    if (!token) return alert("You must log in to generate a roadmap.");

    document.getElementById("roadmapList").innerHTML = "<p>🤖 Generating roadmap with AI...</p>";

    try {
        const res = await fetch(`${API}/roadmap/generate`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": getAuthHeader() 
            },
            body: JSON.stringify({ goal }) 
        });

        const data = await res.json();
        if (res.ok) {
            alert("Roadmap created successfully!");
        } else {
            throw new Error(data.message || "Failed to create roadmap");
        }
        
        fetchRoadmaps();
    } catch (err) { 
        console.error(err); 
        alert("Failed to create roadmap: " + err.message); 
        document.getElementById("roadmapList").innerHTML = "<p>Error loading roadmaps.</p>";
    }
}

async function fetchRoadmaps() {
    const token = localStorage.getItem("token");
    const list = document.getElementById("roadmapList");
    list.innerHTML = "<p>Loading roadmaps...</p>";

    if (!token) {
        list.innerHTML = "<p>Please log in to view your roadmaps.</p>";
        return;
    }

    try {
        const res = await fetch(`${API}/roadmap`, { 
            method: "GET",
            headers: { 
                "Authorization": getAuthHeader()
            }
        });
        
        const data = await res.json();

        list.innerHTML = "";
        if (!res.ok) throw new Error(data.message || "Failed to load roadmaps.");
        const roadmaps = data.roadmap || [];

        if (roadmaps.length === 0) list.innerHTML = "<p>No roadmaps found. Create one above!</p>";

        roadmaps.forEach(r => {
            const div = document.createElement("div");
            div.className = "roadmap-card";

            let stepsHTML = "";
            r.steps.forEach((s, i) => {
                stepsHTML += `
                <div class="step">
                    <input type="checkbox" id="step-${r._id}-${i}" ${s.completed ? "checked" : ""} 
                        onchange="toggleStepCompletion('${r._id}', ${i})">
                    <label for="step-${r._id}-${i}" class="${s.completed ? "completed" : ""}">${s.title}</label>
                    <p class="interpretation">${s.description || s.interpretation || ""}</p>
                </div>`;
            });

            div.innerHTML = `<h3>${r.goal}</h3><div class="steps">${stepsHTML}</div>`; 
            list.appendChild(div);
        });
    } catch (err) { 
        console.error("Error loading roadmaps:", err); 
        list.innerHTML = `<p>Error loading roadmaps: ${err.message || "Server error"}</p>`; 
    }
}

window.toggleStepCompletion = async function(roadmapId, stepIndex) {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must log in to update steps.");

    try {
        const res = await fetch(`${API}/roadmap/update-step`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": getAuthHeader()
            },
            body: JSON.stringify({ roadmapId, stepIndex })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Update failed.");

        fetchRoadmaps(); 

    } catch (err) { 
        console.error(err); 
        alert("Failed to update step: " + err.message); 
    }
}


// =================================================================
// 6. FUTURE MESSAGES
// =================================================================

async function loadFutureHistory() {
    if (!futureList) return;

    futureList.innerHTML = "Loading...";

    try {
        const res = await fetch(`${API}/future-messages`, {
            method: "GET",
            headers: { "Authorization": getAuthHeader() } // ✅ FIX: Use consistent Bearer format
        });

        if (!res.ok) {
            futureList.innerHTML = `<p class="error-message">Error loading history. Status: ${res.status}</p>`;
            return;
        }

        const data = await res.json();
        const messages = data.messages;
        
        if (Array.isArray(messages) && messages.length > 0) {
            futureList.innerHTML = messages.map(m => {
                const displayDate = new Date(m.unlockDate).toLocaleDateString();
                return `<p>💌 <b>${m.message}</b> (Deliver at: ${displayDate})</p>`;
            }).join("");
        } else {
            futureList.innerHTML = `<p>No messages scheduled yet.</p>`;
        }
    } catch (error) {
        console.error("Future Message Load Error:", error);
        futureList.innerHTML = `<p class="error-message">⚠️ Data processing error. Could not display messages.</p>`;
    }
}

async function sendFuture() {
    const message = futureMsg.value;
    const deliverAt = futureDate.value;

    if (!message || !deliverAt) {
        alert("Please enter both a message and a delivery date.");
        return;
    }

    try {
        const res = await fetch(`${API}/future-messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getAuthHeader() // ✅ FIX: Use consistent Bearer format
            },
            body: JSON.stringify({ message, deliverAt })
        });

        if (!res.ok) {
            throw new Error("Failed to schedule message.");
        }

        alert("Message scheduled!");
        futureMsg.value = '';
        futureDate.value = '';
        loadFutureHistory(); 
    } catch (error) {
        console.error("Future Message POST failed:", error);
        alert(error.message || "Failed to schedule message. Check server logs.");
    }
}

// =================================================================
// 7. REMINDERS
// =================================================================
async function createReminder() {
    const text = reminderText.value;
    const time = reminderTime.value;

    if (!text || !time) {
        alert("Please enter both reminder text and a time.");
        return;
    }

    try {
        const res = await fetch(`${API}/reminders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getAuthHeader() // ✅ FIX: Use consistent Bearer format
            },
            body: JSON.stringify({ text, time })
        });

        if (res.ok) {
            alert("✅ Reminder created successfully!");
            reminderText.value = '';
            reminderTime.value = ''; 
            loadReminders();
        } else if (res.status === 401) {
            alert("❌ Failed to create reminder: Unauthorized. Please log in again.");
        } else {
            alert(`❌ Failed to create reminder: Status ${res.status}. Check server logs.`);
        }
    } catch (error) {
        console.error("CREATE REMINDER FETCH ERROR:", error);
        alert("⚠️ Network error. Could not connect to the server.");
    }
}

async function loadReminders() {
    if (!reminderList) return;

    reminderList.innerHTML = "Loading reminders...";

    try {
        const res = await fetch(`${API}/reminders`, {
            headers: { "Authorization": getAuthHeader() } // ✅ FIX: Use consistent Bearer format
        });

        if (!res.ok) {
            console.error(`Failed to load reminders: Status ${res.status}`);
            reminderList.innerHTML = `<p class="error-message">❌ Error loading reminders (Status: ${res.status}).</p>`;
            return;
        }

        const data = await res.json();
        
        if (data.length === 0) {
             reminderList.innerHTML = "<p>You have no scheduled reminders.</p>";
             return;
        }

        reminderList.innerHTML = data
            .map(r => `<p>🔔 ${r.title} — <b>${new Date(r.time).toLocaleTimeString()}</b></p>`) // ✅ FIX: Display r.title
            .join("");

    } catch (error) {
        console.error("LOAD REMINDERS FETCH ERROR:", error);
        reminderList.innerHTML = `<p class="error-message">⚠️ Data processing error. Could not display reminders.</p>`;
    }
}

// =================================================================
// 8. PROGRESS
// =================================================================

async function loadProgress() {
    if (!progress) {
        console.error("Progress container element not found!");
        return; 
    }
    
    progress.innerHTML = "Loading progress data...";

    try {
        const res = await fetch(`${API}/progress`, {
            method: "GET",
            headers: { "Authorization": getAuthHeader() } // ✅ FIX: Use consistent Bearer format
        });
        
        if (!res.ok) {
            console.error(`Server failed to load progress: Status ${res.status}`);
            progress.innerHTML = `<p class="error-message">❌ Failed to load progress (Status: ${res.status}). Check server logs!</p>`;
            return;
        }

        const data = await res.json();
        
        progress.innerHTML = `
            <h3>Dashboard Summary</h3>
            <p>🛣 Roadmaps Created: <b>${data.roadmapCount || 0}</b></p>
            <p>📨 Future Messages Scheduled: <b>${data.futureMessages || 0}</b></p> 
            <p>🌙 Dreams Saved: <b>${data.dreamCount || 0}</b></p>
            <p>✅ Tasks Completed: <b>${data.completedTasks || 0}</b></p>
        `;

    } catch (error) {
        console.error("PROGRESS FETCH CRASH:", error);
        progress.innerHTML = `<p class="error-message">⚠️ Data Processing Error. Cannot display progress.</p>`;
    }
}


// =================================================================
// 9. FINAL INITIALIZATION HANDLER (Consolidated)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem("token");
    const isDashboardPage = document.title.includes("Dashboard"); // Simple way to check page context

    if (!token) {
        if (isDashboardPage) {
            console.warn("User not authenticated. Redirecting to login.");
            // OPTIONAL: Uncomment to force redirect if not logged in
            // go("index"); 
        }
        return; 
    } 

    // --- Feature Initialization (Load data only if element exists) ---
    
    // Dashboard Summary
    if (progress) { 
        loadProgress();
    }
    
    // Reminders
    if (createReminderBtn) {
        createReminderBtn.addEventListener('click', createReminder);
    }
    if (reminderList) {
        loadReminders(); 
    }
    
    // Dreams
    const saveDreamBtn = document.getElementById("saveDreamBtn"); // Assuming this button exists
    if (saveDreamBtn) saveDreamBtn.addEventListener('click', saveDream);
    if (dreamList) {
        loadDreams();
    }
    
    // Future Messages
    if (sendButton) {
        sendButton.addEventListener('click', sendFuture);
    }
    if (futureList) {
        loadFutureHistory();
    }
    
    // Roadmap Page
    const createRoadmapBtn = document.getElementById("createRoadmapBtn");
    if (createRoadmapBtn) {
        createRoadmapBtn.addEventListener("click", createRoadmap);
        fetchRoadmaps(); // Also loads the list if on the roadmap page
    }

});
