// ==========================================
// ELEMENTS
// ==========================================

const memoryList = document.getElementById("memoryList");
const memoryCount = document.getElementById("memoryCount");

const memoryModal = document.getElementById("memoryModal");
const memoryForm = document.getElementById("memoryForm");

const addMemoryBtn = document.getElementById("addMemoryBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const modalTitle = document.getElementById("modalTitle");

const memoryId = document.getElementById("memoryId");
const memoryKey = document.getElementById("memoryKey");
const memoryValue = document.getElementById("memoryValue");


// ==========================================
// MEMORIES
// ==========================================

let memories = [];


// ==========================================
// LOAD MEMORIES FROM HTML
// ==========================================

function loadMemoriesFromHTML() {

    const cards = document.querySelectorAll(".memory-card");

    memories = [];

    cards.forEach((card) => {

        const id = card.dataset.id;

        const keyElement = card.querySelector(".memory-key");
        const valueElement = card.querySelector(".memory-value");

        if (!id || !keyElement || !valueElement) {
            return;
        }

        memories.push({
            _id: id,
            key: keyElement.textContent.trim(),
            value: valueElement.textContent.trim(),
        });

    });
}


// ==========================================
// INITIAL LOAD
// ==========================================

loadMemoriesFromHTML();


// ==========================================
// ADD MEMORY MODAL
// ==========================================

addMemoryBtn.addEventListener("click", () => {

    modalTitle.textContent = "Add Memory";

    memoryId.value = "";
    memoryKey.value = "";
    memoryValue.value = "";

    memoryModal.classList.remove("hidden");

    memoryKey.focus();

});


// ==========================================
// CLOSE MODAL
// ==========================================

closeModalBtn.addEventListener("click", closeModal);

cancelBtn.addEventListener("click", closeModal);


function closeModal() {

    memoryModal.classList.add("hidden");

    memoryForm.reset();

    memoryId.value = "";

}


// ==========================================
// ADD / UPDATE MEMORY
// ==========================================

memoryForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const key = memoryKey.value.trim();
    const value = memoryValue.value.trim();
    const id = memoryId.value;

    // Validate
    if (!key || !value) {

        alert("Key and value are required.");

        return;
    }

    try {

        let response;


        // ==========================================
        // UPDATE
        // ==========================================

        if (id) {

            response = await fetch(`/memory/${id}`, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    key,
                    value,
                }),

            });

        }


        // ==========================================
        // ADD
        // ==========================================

        else {

            response = await fetch("/memory", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    key,
                    value,
                }),

            });

        }


        // ==========================================
        // READ RESPONSE
        // ==========================================

        const data = await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message || "Failed to save memory"
            );

        }


        // ==========================================
        // UPDATE LOCAL ARRAY
        // ==========================================

        if (id) {

            const index = memories.findIndex(
                (memory) =>
                    String(memory._id) === String(id)
            );

            if (index !== -1) {

                memories[index] = data.memory;

            }

        }


        // ==========================================
        // ADD TO LOCAL ARRAY
        // ==========================================

        else {

            memories.unshift(data.memory);

        }


        // ==========================================
        // CLOSE MODAL
        // ==========================================

        closeModal();


        // ==========================================
        // RENDER
        // ==========================================

        renderMemories();

    } catch (error) {

        console.error("SAVE MEMORY ERROR:", error);

        alert(error.message);

    }

});


// ==========================================
// EDIT MEMORY
// ==========================================

window.editMemory = function (id) {

    const memory = memories.find(
        (item) =>
            String(item._id) === String(id)
    );

    if (!memory) {

        console.error("Memory not found:", id);

        return;
    }


    modalTitle.textContent = "Edit Memory";

    memoryId.value = memory._id;

    memoryKey.value = memory.key;

    memoryValue.value = memory.value;

    memoryModal.classList.remove("hidden");

    memoryKey.focus();

};


// ==========================================
// DELETE MEMORY
// ==========================================

window.deleteMemory = async function (id) {

    const memory = memories.find(
        (item) =>
            String(item._id) === String(id)
    );

    if (!memory) {

        console.error("Memory not found:", id);

        return;
    }


    const confirmed = confirm(
        `Delete "${memory.key}" memory?`
    );

    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `/memory/${id}`,
            {
                method: "DELETE",
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message || "Failed to delete memory"
            );

        }


        // ==========================================
        // REMOVE FROM LOCAL ARRAY
        // ==========================================

        memories = memories.filter(
            (item) =>
                String(item._id) !== String(id)
        );


        // ==========================================
        // RENDER
        // ==========================================

        renderMemories();

    } catch (error) {

        console.error(
            "DELETE MEMORY ERROR:",
            error
        );

        alert(error.message);

    }

};


// ==========================================
// RENDER MEMORIES
// ==========================================

function renderMemories() {

    // ==========================================
    // UPDATE COUNT
    // ==========================================

    memoryCount.textContent =
        `${memories.length} ${
            memories.length === 1
                ? "memory"
                : "memories"
        }`;


    // ==========================================
    // NO MEMORIES
    // ==========================================

    if (memories.length === 0) {

        memoryList.innerHTML = `
            <div class="empty-memory">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    No memories yet
                </h3>

                <p>
                    As you chat with Nexora,
                    useful information about you
                    will appear here.
                </p>

            </div>
        `;

        return;
    }


    // ==========================================
    // CLEAR LIST
    // ==========================================

    memoryList.innerHTML = "";


    // ==========================================
    // CREATE CARDS
    // ==========================================

    memories.forEach((memory) => {

        const card = document.createElement("div");

        card.className = "memory-card";

        card.dataset.id = memory._id;


        card.innerHTML = `

            <div class="memory-details">

                <span class="memory-key">
                    ${escapeHTML(memory.key)}
                </span>

                <div class="memory-value">
                    ${escapeHTML(memory.value)}
                </div>

            </div>


            <div class="memory-actions">

                <button
                    type="button"
                    class="memory-action"
                    onclick="editMemory('${memory._id}')"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="memory-action delete"
                    onclick="deleteMemory('${memory._id}')"
                >
                    Delete
                </button>

            </div>

        `;


        memoryList.appendChild(card);

    });

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text ?? "";

    return div.innerHTML;

}


// ==========================================
// CLOSE MODAL WITH ESC
// ==========================================

document.addEventListener("keydown", (event) => {

    if (event.key !== "Escape") {
        return;
    }

    if (!memoryModal.classList.contains("hidden")) {

        closeModal();

    }

});