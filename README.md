# CrowdFund Hub

CrowdFund Hub is a locally hosted crowdfunding web application for creating campaigns, accepting UPI/PhonePe donations, tracking campaign progress, and viewing donor records through a creator or universal admin dashboard.


## Features

- Create crowdfunding campaigns with a title, description, goal amount, deadline, and payment QR image.
- Upload validation for PNG, JPG, and JPEG QR images with a 2 MB size limit.
- Campaign listing with raised amount, goal amount, percentage funded, and progress bars.
- UPI/PhonePe donation flow with donor name and amount tracking.
- Automatic campaign removal from active listings after the target amount is reached.
- Creator admin code for campaign-specific records.
- Universal admin view for all campaigns and donor entries.
- Friendly 404 and generic error pages.
- SQLite database with campaign and donation tables.

## Tech Stack

- Node.js
- Express.js
- SQLite
- Multer
- dotenv
- Vanilla HTML, CSS, and JavaScript

Bootstrap and EJS are not currently used; the project keeps a lightweight static frontend served by Express.

## Folder Structure

```text
CrowdFund Hub/
├── config/              # App paths and environment configuration
├── controllers/         # Request handlers for pages, campaigns, and admin data
├── database/            # SQLite connection and schema setup
├── middleware/          # Upload validation, async wrapper, and error handling
├── models/              # SQLite query helpers for campaigns and donations
├── public/
│   ├── css/             # Frontend styles
│   └── js/              # Browser JavaScript
├── routes/              # Express route definitions
├── uploads/             # Local uploaded QR images
├── views/               # HTML pages and error pages
├── app.js               # Express app configuration
├── server.js            # Server startup
└── package.json
```

## Installation

1. Clone the repository.

```bash
git clone <repository-url>
cd crowd_funding-
```

2. Install dependencies.

```bash
npm install
```

3. Create a `.env` file in the project root.

```env
PORT=3000
SESSION_SECRET=yourSecretKey
UNIVERSAL_ADMIN_CODE=8726
```

## Run Locally

```bash
npm start
```

Open the app at:

```text
http://localhost:3000
```

## Database

The project uses SQLite and stores local data in `crowdfunding.db`. The main tables are:

- `fundings`
- `donations`

Uploaded QR images are stored under `uploads/qr`, while the database stores the file path.

## Future Improvements

- Add user authentication for creators and admins.
- Add campaign categories and search filters.
- Add image previews for campaign cards.
- Add downloadable donation reports for admins.
- Add automated tests for controllers and models.
- Add deployment documentation.

## Contributors

- Your Name

## License

This project is available under the MIT License. Add a `LICENSE` file before publishing if you want to include the full license text.
