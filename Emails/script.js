// Mock backend endpoints
const API_BASE = "https://your-backend-api.com"; // Replace with your backend URL

// Fetch a new temporary email
async function fetchTempEmail() {
  const response = await fetch(`${API_BASE}/generate-email`);
  const data = await response.json();
  return data.email;
}

// Fetch emails from the temporary inbox
async function fetchEmails() {
  const response = await fetch(`${API_BASE}/get-emails`);
  const data = await response.json();
  return data.emails || [];
}

// Update the email address on the UI
async function displayTempEmail() {
  const email = await fetchTempEmail();
  document.getElementById("tempEmail").textContent = email;
}

// Update the emails on the UI
async function displayEmails() {
  const emails = await fetchEmails();
  const container = document.getElementById("emailsContainer");
  container.innerHTML = ""; // Clear previous emails

  if (emails.length === 0) {
    container.innerHTML = "<p>No emails yet. Check back soon!</p>";
  } else {
    emails.forEach((email) => {
      const emailDiv = document.createElement("div");
      emailDiv.className = "email";
      emailDiv.innerHTML = `
        <strong>From:</strong> ${email.sender}<br>
        <strong>Subject:</strong> ${email.subject}<br>
        <strong>Body:</strong> ${email.body}
      `;
      container.appendChild(emailDiv);
    });
  }
}

// Event listener for refreshing emails
document
  .getElementById("refreshEmails")
  .addEventListener("click", displayEmails);

// Initialize UI
displayTempEmail();
displayEmails();
