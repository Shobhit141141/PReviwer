<div align="center" style="display: flex; flex-direction: row; align-items: center;">
    <img src="client/public/git.png" alt="PR Viewer Logo" width="100px" height="100px">
    <h1 align="center" id="title" style="font-size: calc(100px / 2.5);">PR Viewer</h1>
</div>

<p id="description">PR Viewer is a cutting-edge platform that analyzes Pull Requests (PRs) using an advanced AI model (Gemini) to provide insightful comments directly on the PR. It integrates with GitHub REST APIs and uses Octokit for interacting with repositories, offering seamless authentication via JWT and secure token storage with MongoDB and CryptoJS.</p>

<h2>🚀 Live at </h2>

[frontend](https://prviwer.vercel.app)

[server](https://previwer-server.vercel.app)

<h2>🛠️ Tech Stack</h2>

- **Frontend:** React + Vite js , Radix UI, Ant Design, React Router Dom
- **Backend:** Node.js, Express.js, MongoDB, Octokit
- **Authentication:** JWT (JSON Web Tokens)
- **Token Encryption:** CryptoJS
- **AI Model:** Gemini-1.5-flash
  
<h2>📄 Features</h2>

| Feature                                   | Description                                                                                                                             |
|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| AI-Based PR Analysis 🧠                   | Uses the Gemini AI model to automatically analyze pull requests, generating insightful feedback and suggestions to improve code quality. |
| Seamless GitHub Integration 🌐            | Fully integrated with GitHub REST APIs and Octokit, enabling users to easily fetch, view, and comment on PRs without leaving the platform.|
| Automated PR Comments 📝                  | Automatically posts AI-generated comments on the PRs, highlighting areas of improvement and potential issues, improving code review workflows.|
| Secure JWT Authentication 🔐             | Ensures secure user authentication using JWT, giving developers peace of mind when interacting with their GitHub repositories.            |
| Encrypted Token Storage 🔑               | PR Viewer uses CryptoJS to store encrypted tokens in MongoDB, ensuring that sensitive information is securely managed.                    |
| Responsive Design 📱                      | Optimized for both desktop and mobile devices, making it easy to review PRs and manage your repositories on the go.                       |


## 📦 Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/prviewer.git
    ```

2. Set up environment variables:

    Create a `.env` file in the root directory and add the following:

    ```bash
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    JWT_SECRET=your_jwt_secret
    MONGODB_URI=your_mongodb_uri
    ENCRYPTION_KEY=your_enc_key
    GEMINI_API_KEY=your_gemini_key
    ```



<h2>🧪 Usage</h2>

1. **Login with GitHub**: Users can securely log in using their GitHub credentials.
2. **Analyze PRs**: The AI model will analyze your open PRs and provide automated suggestions for improvement.
3. **Post Comments**: With a single click, post AI-generated feedback directly onto the PR using GitHub's REST API.


<h2>🛡️ Security</h2>

- PR Viewer leverages **JWT authentication** for secure login.
- **CryptoJS** is used to encrypt tokens before storing them in **MongoDB**, ensuring sensitive data is protected.


