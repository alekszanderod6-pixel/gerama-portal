# GERAMA Academic Resources Portal

A modern web application for UENR students to access academic resources, past questions, and collaborative learning materials.

## Features

- **User Authentication**: Secure signup/login with Supabase
- **Secret Code Protection**: Only GERAMA members can join (code: GERAMA2026)
- **Resource Library**: Organized academic materials by level, program, and course
- **Dashboard Analytics**: Track downloads and contributions
- **Profile Management**: Edit user profiles and settings
- **Responsive Design**: Works on all devices
- **Modern UI**: Glassmorphism design with green and gold theme

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Supabase Auth
- **Styling**: Custom CSS with modern design patterns
- **Icons**: Font Awesome
- **Deployment**: Vercel

## Project Structure

```
gerama/
|-- css/
|   |-- style.css          # Main stylesheet
|-- js/
|   |-- main.js            # Core functionality & sidebar
|   |-- supabase-config.js # Supabase configuration
|-- images/                # Image assets
|-- materials/             # Academic resources
|-- index.html             # Home page
|-- login.html             # Login page
|-- signup.html            # Signup page
|-- dashboard.html         # User dashboard
|-- resources.html         # Resource library
|-- about.html             # About page
|-- contact.html           # Contact page
```

## Getting Started

### Prerequisites
- A modern web browser
- Supabase project (already configured)

### Local Development
1. Clone this repository
2. Start a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```
3. Open `http://localhost:8000` in your browser

### Authentication Setup
The application uses Supabase for authentication with the following configuration:
- **Project URL**: `https://hdrnnvvrtbwjsxtrxzfj.supabase.co`
- **Secret Code**: `GERAMA2026`

## Usage

### For Students
1. **Sign Up**: Use the secret code "GERAMA2026" to create an account
2. **Verify Email**: Check your email for verification link
3. **Login**: Access your account and explore resources
4. **Browse Resources**: Filter by level, program, and course
5. **Download Materials**: Access slides, books, past questions, and videos
6. **Contribute**: Upload your own materials for review

### For Administrators
- Monitor user activity through the dashboard
- Review and approve contributed materials
- Manage user accounts through Supabase dashboard

## Deployment

This project is designed for deployment on Vercel:

1. **GitHub**: Push code to GitHub repository
2. **Vercel**: Connect repository and deploy
3. **Supabase**: Update site URL and redirect URLs
4. **Test**: Verify all functionality works

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Features Breakdown

### Authentication System
- Email/password authentication via Supabase
- Secret code verification for member access
- Session management and automatic redirects
- Profile management and editing

### Resource Management
- Organized by Level (L100-L400)
- Categorized by Engineering Programs
- Filtered by Course and Material Type
- Download tracking and analytics

### User Interface
- Glassmorphism design with modern aesthetics
- Responsive sidebar navigation
- Interactive dashboard with statistics
- Clean, professional layout

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the GERAMA academic initiative at UENR.

## Contact

- **Email**: gerama.uenr@gmail.com
- **Phone**: +233 55 574 9497
- **Location**: University of Energy and Natural Resources, Sunyani

---

**GERAMA** - Promoting Academic Excellence
