# Full-Stack Task Manager (Next.js 16 Architecture)

This project is a modern full-stack **Task Manager** application built with a monolithic **Next.js 16 (App Router)** architecture, leveraging **React 19**, **Server Actions**, **Prisma ORM**, and a **PostgreSQL** database.

![alt text](assets/screenshot.png)

## Architecture & Tech Stack

This repository demonstrates a unified monolithic structure where front-end UI and backend database interactions reside within a single codebase, eliminating traditional REST API overhead and multi-port CORS barriers.

### Tech Stack
* **Core Framework:** Next.js 16 (App Router & Turbopack)
* **UI & Client Components:** React 19 with optimistic state management
* **Styling:** Custom Vanilla CSS with highly responsive layouts
* **Database:** PostgreSQL
* **ORM & Data Queries:** Prisma ORM integrated via Next.js Server Actions (`"use server";`)

---

## Folder Structure

The project incorporates a clean separation of presentation, state management, and direct backend actions:

### Frontend (Client Components & State)
- **`app/`** → Next.js App Router root layout (`layout.js`) and main application dashboard (`page.js`)
- **`frontend/components/`** → Reusable interactive React components
- **`frontend/hooks/`** → Modular custom React hooks (`useProjectState`, `useTaskState`, `useLabelState`) with optimistic UI updating
- **`frontend/modals/`** → Popup dialogues and interactive item pickers
- **`frontend/styles/`** → Modular custom CSS stylesheets
- **`frontend/utils.js`** → UI event propagation helpers, timestamp conversion, and user UUID management
- **`public/assets/`** → Static media, icons, and interface SVGs

### Backend (Server Actions & ORM)
- **`backend/actions/`** → Next.js Server Actions (`projectActions.js`, `taskActions.js`, `labelActions.js`) for direct database mutations
- **`backend/lib/prisma.js`** → Cached global Prisma Client portal designed for efficient connection pooling during development
- **`backend/utils/`** → Seeding structures and initial defaults for brand-new users (`defaultData.js`)
- **`prisma/`** → Database architecture definitions (`schema.prisma`)

---

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

---

## Data Storage & API

* All projects, tasks, and labels are securely stored in a **PostgreSQL database**.
* The frontend communicates directly with the database using **Next.js Server Actions** and **Prisma ORM**, eliminating the need for external REST API endpoints.
* The active project state remains saved even after refreshing the page.

---

## Run the Project Locally

Because the front-end UI and back-end database queries are compiled into a unified Next.js application, running the complete development suite requires just **a single terminal window**:

### 1. Installation & Environment
1. Clone the repository and navigate into the project directory:
   ```bash
   git clone https://github.com/JustTom04/Task-manager.git
   cd Task-manager
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and input your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
   ```

### 2. Database Compilation & Launch
1. Generate the type-safe Prisma JavaScript client:
   ```bash
   npx prisma generate
   ```
2. Synchronize your tables with the database schema:
   ```bash
   npx prisma db push
   ```
3. Boot up the local Next.js full-stack development server:
   ```bash
   npm run dev
   ```
4. Open your web browser and navigate to **`http://localhost:4000`** to interact with the application live!

---

## Database Schema (ERD)

The application utilizes a robust relational architecture mapped directly via Prisma:

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
