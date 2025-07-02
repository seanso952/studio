
# EstateMind - Real Estate Management Platform

This is a Next.js application built with Firebase Studio.

## Getting Started

1.  **Install dependencies** for both the root and functions directory:
    ```bash
    # From project root
    npm install

    # From functions directory
    cd functions
    npm install
    cd ..
    ```

2.  **Configure Environment:**
    *   Create a `.env` file in the project root.
    *   Copy the contents of `.env.example` into `.env`.
    *   Fill in your Firebase project credentials in the `.env` file.

3.  **Deploy Functions:**
    *   Deploy the Firebase Functions to your project:
    ```bash
    firebase deploy --only functions
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) to view the application. The default admin account is `seanso259@gmail.com`.
