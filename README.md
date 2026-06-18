# Task Manager React Application

This project is a full-stack **Task Manager** application built using **React** on the frontend, and **Node.js, Express, Prisma, and PostgreSQL** on the backend.

![alt text](assets/screenshot.png)

## Folder Structure

The project is divided into two main parts: the `frontend` (React client) and the `backend` (Node.js API).

### Frontend (Client-side)
*Structure of the `src` directory:*
- **`assets/`** → Static files such as images, icons, SVGs
- **`components/`** → Reusable React components
- **`hooks/`** → Custom React hooks for state management and logic
- **`modals/`** → Popup windows and modal elements
- **`styles/`** → Global and component-specific styles

### Backend (Server-side)
*Core logic and configurations:*
- **`controllers/`** → Business logic and request handling
- **`routes/`** → API endpoint definitions
- **`prisma/`** → Database schema (`schema.prisma`)
- **`prismaClient.js`** → Prisma ORM database connection initialization
- **`server.js`** → Server entry point and Express setup

## Main Features

- **Project management**
  - Create and delete multiple projects.
  - Select an active project.
  
  ![Projects](assets/projects.png)

- **Labels**
  - Each new project has unique labels.
  - Add labels to tasks.
  - Delete labels individually or remove all labels from a project.
  
  ![Labels](assets/labels.png)

- **Task management**
  - Add new tasks to projects.
  - Edit, delete, and update task status (done / in progress).
  - Track time spent on tasks and automatically save data.
  
  ![Task Edit](assets/edit_task.png)

- **Filtering and sorting**
  - Filter tasks by status, labels, and priority (**high**, **medium**, **low**).
  - Display task list based on the current filters.
  
  ![Filters](assets/filters.png)

- **User interface and state persistence**
  - Responsive design for mobile and desktop views.
  - Modal components, dropdowns, and label panels for easier usability.
  - Projects and tasks are saved in a **PostgreSQL Database** via **Prisma ORM**, ensuring robust data persistence.
  
  ![Mobile View](assets/phone.png)



## Usage

### Top-section

* Initially, you have a default project called "General". You can create a new one using the **"Add project"** button in the top-right corner.
* You can filter tasks using the **Filter** dropdown menu to display only the tasks you need.
* You can delete a task using the **"x"** button on the right side of the task. You can also mark it as complete using the **"Mark complete"** checkbox on the left side, but the task will still remain in the list.
* Click on an existing task to edit its title, priority, or labels.

## Data Storage & API

* All projects, tasks, and labels are securely stored in a **PostgreSQL database**.
* The frontend communicates with a **Node.js/Express** backend via REST API.
* The active project state remains saved even after refreshing the page.

## Styling

* The CSS files include responsive layouts and custom styles for tasks, labels, modals, and buttons.
* The user experience is handled separately for mobile and desktop views.

## Tech Stack

**Frontend:**
* React (with Vite)
* Custom CSS

**Backend & Database:**
* Node.js & Express.js
* PostgreSQL
* Prisma ORM

## Run the project

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and set your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   ```
4. Push the schema to the database:
   ```bash
   npx prisma db push
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema (ERD)

The application uses a relational database design with the following entity relationships:

```mermaid
classDiagram
    direction LR

    class Project {
        String id [PK]
        String name
        DateTime createdAt
    }
    
    class Task {
        String id [PK]
        String title
        Boolean done
        String priority
        String projectId [FK]
        DateTime createdAt
    }
    
    class Label {
        String id [PK]
        String name
        String color
        String projectId [FK]
        DateTime createdAt
    }

    Project "1" --> "*" Task : contains
    Project "1" --> "*" Label : owns
    Task "*" -- "*" Label : has
```
