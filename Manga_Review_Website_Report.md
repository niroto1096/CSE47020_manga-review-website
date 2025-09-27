# Manga Review Website Project Report

---

# Manga Review Website
**Course:** CSE470 - Software Engineering  
**Section:** 20  
**Student ID:** [Your Student ID]  
**Date:** September 16, 2025  
**Repository:** https://github.com/niroto1096/CSE47020_manga-review-website  
**Project Management:** [GitHub Projects Board]  
**License:** MIT

---

# Table of Contents
1. [Introduction](#introduction)
2. [Installation and Execution](#installation-and-execution)
3. [Feature Overview](#feature-overview)
4. [Feature Demonstrations](#feature-demonstrations)
   - [0. Authentication](#0-authentication)
   - [1. Admin Manga Upload](#1-admin-manga-upload)
   - [2. Featured Manga Display](#2-featured-manga-display)
   - [3. Manga Search](#3-manga-search)
   - [4. Review and Rating](#4-review-and-rating)
   - [5. Reviewed by You](#5-reviewed-by-you)
   - [6. Favorites](#6-favorites)
   - [7. Personal List](#7-personal-list)
   - [8. Top 5 Rated Manga](#8-top-5-rated-manga)
   - [9. Recently Viewed](#9-recently-viewed)
   - [10. Like/Dislike Review](#10-likedislike-review)
   - [11. Light/Dark Mode](#11-lightdark-mode)
   - [12. Surprise Me!](#12-surprise-me)
   - [13. Follow/Unfollow Users](#13-followunfollow-users)
   - [14. Public Lists](#14-public-lists)
5. [Project Design Overview](#project-design-overview)
6. [MVC Application Example](#mvc-application-example)
7. [Directory Structure](#directory-structure)
8. [Architectural Design (UML/ER)](#architectural-design-umler)
9. [Future Improvement Scopes](#future-improvement-scopes)
10. [Repository, Project Management, License](#repository-project-management-license)
11. [Conclusion](#conclusion)

---

# Introduction

**Motivation:**
The manga community is vast, but most platforms lack deep review, rating, and social features. This project aims to create a modern, user-friendly manga review website where users can discover, rate, review, and organize manga, while building a social network with privacy controls.

**Why this project?**
I wanted to combine the best aspects of review aggregation, personal content management, and social networking for manga fans, using a scalable full-stack architecture.

---

# Installation and Execution

**Prerequisites:**
- Node.js and npm
- MongoDB (local or remote)

**Backend Setup:**
1. Navigate to the `server` folder
2. Install dependencies:
   ```
   npm install
   ```
3. Configure `.env` with your MongoDB URI and secrets
4. Start the backend server:
   ```
   npm start
   ```

**Frontend Setup:**
1. Navigate to the `client` folder
2. Install dependencies:
   ```
   npm install
   ```
3. Start the frontend dev server:
   ```
   npm run dev
   ```
4. Access the app at `http://localhost:5173`

*Note: All MongoDB collections are auto-created by Mongoose.*

---

# Feature Overview

| Feature | Description |
|---------|-------------|
| **Authentication** | Secure login, registration, OTP verification |
| **Admin Manga Upload** | Admins can upload new manga |
| **Featured Manga Display** | Admins can mark manga as featured |
| **Manga Search** | Search by title, genre, author |
| **Review and Rating** | Users submit reviews and ratings (1-5) |
| **Reviewed by You** | Users see manga they've reviewed |
| **Favorites** | Users can favorite manga |
| **Personal List** | Track manga as Reading, Completed, Planned |
| **Top 5 Rated Manga** | Homepage shows top 5 rated manga |
| **Recently Viewed** | Users see their recently viewed manga |
| **Like/Dislike Review** | Users can like/dislike reviews |
| **Light/Dark Mode** | Users can toggle UI theme |
| **Surprise Me!** | Button shows a random manga |
| **Follow/Unfollow Users** | Social features for following users |
| **Public Lists** | Users control privacy of lists/reviews/favorites |

---

# Feature Demonstrations

## 0. Authentication
**URL:** `/login`, `/register`
**Steps:**
1. Register with email, password, and details
2. Verify OTP sent to email
3. Login with credentials
**Activity Description:**
Secure authentication using JWT and cookies.
**Screenshot:**
*Blank page for screenshot*

---

## 1. Admin Manga Upload
**URL:** `/admin/upload`
**Steps:**
1. Admin logs in
2. Navigates to upload page
3. Fills manga details and uploads image
**Activity Description:**
Admins can add new manga to the database.
**Screenshot:**
*Blank page for screenshot*

---

## 2. Featured Manga Display
**URL:** `/home`
**Steps:**
1. Admin marks manga as featured
2. Featured manga appears on homepage
**Activity Description:**
Highlight special manga for users.
**Screenshot:**
*Blank page for screenshot*

---

## 3. Manga Search
**URL:** `/all-manga`
**Steps:**
1. Use search bar
2. Filter by genre, author
**Activity Description:**
Find manga easily using search and filters.
**Screenshot:**
*Blank page for screenshot*

---

## 4. Review and Rating
**URL:** `/manga-detail/:id`
**Steps:**
1. Write review and select rating
2. Submit review
**Activity Description:**
Users share opinions and rate manga.
**Screenshot:**
*Blank page for screenshot*

---

## 5. Reviewed by You
**URL:** `/profile`
**Steps:**
1. Go to profile
2. View "Reviewed by You" section
**Activity Description:**
See all manga reviewed by the user.
**Screenshot:**
*Blank page for screenshot*

---

## 6. Favorites
**URL:** `/profile`
**Steps:**
1. Add manga to favorites
2. View favorites in profile
**Activity Description:**
Quick access to favorite manga.
**Screenshot:**
*Blank page for screenshot*

---

## 7. Personal List
**URL:** `/profile`
**Steps:**
1. Add manga to personal list
2. Set status (Reading, Completed, Planned)
**Activity Description:**
Organize manga reading progress.
**Screenshot:**
*Blank page for screenshot*

---

## 8. Top 5 Rated Manga
**URL:** `/home`
**Steps:**
1. Homepage displays top 5 rated manga
**Activity Description:**
Discover highly rated manga.
**Screenshot:**
*Blank page for screenshot*

---

## 9. Recently Viewed
**URL:** `/home`, `/manga-detail/:id`
**Steps:**
1. View recently accessed manga
**Activity Description:**
Track manga you've recently viewed.
**Screenshot:**
*Blank page for screenshot*

---

## 10. Like/Dislike Review
**URL:** `/manga-detail/:id`
**Steps:**
1. Like or dislike reviews
**Activity Description:**
Engage with community reviews.
**Screenshot:**
*Blank page for screenshot*

---

## 11. Light/Dark Mode
**URL:** `/profile/settings`
**Steps:**
1. Toggle light/dark mode
**Activity Description:**
Personalize UI appearance.
**Screenshot:**
*Blank page for screenshot*

---

## 12. Surprise Me!
**URL:** `/home`
**Steps:**
1. Click "Surprise Me!"
2. Random manga is shown
**Activity Description:**
Discover new manga randomly.
**Screenshot:**
*Blank page for screenshot*

---

## 13. Follow/Unfollow Users
**URL:** `/profile`, `/user-profile/:id`
**Steps:**
1. Click follow/unfollow on user profiles
2. View followers/following
**Activity Description:**
Build your manga social network.
**Screenshot:**
*Blank page for screenshot*

---

## 14. Public Lists
**URL:** `/user-profile/:id`
**Steps:**
1. View another user's public lists
2. Set privacy in your profile
**Activity Description:**
Control visibility of your lists, reviews, favorites.
**Screenshot:**
*Blank page for screenshot*

---

# Project Design Overview

**Why MVC?**
MVC (Model-View-Controller) separates data, business logic, and UI, making the project scalable, maintainable, and testable. It allows independent development of backend and frontend, and clean API design.

---

# MVC Application Example

**Feature:** Review and Rating

**Model:**
Defines review schema (user, manga, review text, rating).

**Controller:**
Handles review creation, update, and retrieval.

**View:**
React component for submitting and displaying reviews.

**Execution Workflow Diagram:**
User → View (form) → Controller (API) → Model (DB) → Controller (response) → View (update) → User

**Code Snippet:**
```javascript
// Controller
exports.createOrUpdateReview = async (req, res) => {
  // ...existing code...
  const reviewDoc = await Review.findOneAndUpdate(
    { user: userId, manga: mangaId },
    { review, rating },
    { new: true, upsert: true }
  );
  // ...existing code...
};
```

---

# Directory Structure

*Insert screenshot(s) of your project directory here. If too long, partition and place side by side.*

---

# Architectural Design (UML/ER)

*Insert UML class diagram and/or ER diagram here.*

---

# Future Improvement Scopes

- Advanced recommendation engine
- Improved search (fuzzy, tag-based)
- Reading groups and discussions
- Direct messaging and notifications
- Multi-language support
- Rich media integration (video, audio)
- Native mobile app / PWA
- Analytics dashboard
- Performance optimization (caching, CDN)
- Premium subscription features
- Publisher partnerships
- AI-powered moderation

---

# Repository, Project Management, License

- **Repository:** https://github.com/niroto1096/CSE47020_manga-review-website  
- **Project Management:** [GitHub Projects Board]  
- **License:** MIT

---

# Conclusion

This project demonstrates a full-stack, scalable manga review platform with rich social and organizational features. It applies modern web development and software engineering principles, and provides a strong foundation for future growth and community engagement.

---

**[Insert page breaks between features and major sections as needed]**

---

**Typography:**
- Regular text: Times New Roman, 11pt, single space  
- Code: Courier New, 10pt, single space  
- Highlighting: bold, italic, underline only (no color)  
- Use headers for titles

---

**To generate your final submission:**
- Copy this content into Microsoft Word  
- Apply the required typography  
- Insert screenshots where indicated  
- Add your student ID and any missing links

---
