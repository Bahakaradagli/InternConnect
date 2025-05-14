# Admin Panel Project

## Overview
This project is an admin panel built using React Native and Firebase. It provides a user-friendly interface for admin users to manage various functionalities and access relevant data.

## Project Structure
```
adminSide
├── components
│   └── AdminDashboard.tsx       # Main interface for admin users
├── screens
│   ├── AdminLogin.tsx           # Handles admin login process
│   └── AdminRedirect.tsx        # Redirects users based on their role
├── utils
│   └── authHelpers.ts           # Utility functions for authentication
├── styles
│   └── commonStyles.ts          # Common styles for consistent UI
└── README.md                    # Project documentation
```

## Features
- **Admin Login**: Secure login for admin users using Firebase authentication.
- **Role-Based Redirection**: Automatically redirects users to the appropriate screen based on their userType.
- **Admin Dashboard**: A dedicated dashboard for admin users to access various functionalities.

## Setup Instructions
1. **Clone the Repository**:
   ```
   git clone <repository-url>
   cd adminSide
   ```

2. **Install Dependencies**:
   ```
   npm install
   ```

3. **Firebase Configuration**:
   - Set up a Firebase project and add your configuration in the `firebase.js` file.

4. **Run the Application**:
   ```
   npm start
   ```

## Usage Guidelines
- Use the AdminLogin screen to log in as an admin.
- Upon successful login, admins will be redirected to the AdminDashboard.
- Ensure that the userType is set to 'admin' in the Firebase database for proper access.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.