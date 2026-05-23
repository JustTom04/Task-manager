# Task Manager React Application

This project is a simple **Task Manager** application built using React and modern JavaScript (ES6+) technologies.

![alt text](/src/assets/screenshot.png)

## Folder Structure
- assets → static files such as images, icons, SVGs  
- component → reusable React components  
- hooks → custom React hooks for state management and logic  
- modal → popup windows and modal elements  
- styles → global and component-specific styles  

## Main Features

- **Project management**
  - Create and delete multiple projects.
  - Select an active project.

- **Labels**
  - Each new project has unique labels.
  - Add labels to tasks.
  - Delete labels individually or remove all labels from a project.

- **Task management**
  - Add new tasks to projects.
  - Edit, delete, and update task status (done / in progress).
  - Track time spent on tasks and automatically save it in **localStorage**.

- **Filtering and sorting**
  - Filter tasks by status, labels, and priority (**high**, **medium**, **low**).
  - Display task list based on the current filters.

- **User interface and state persistence**
  - Responsive design for mobile and desktop views.
  - Modal components, dropdowns, and label panels for easier usability.
  - Projects and tasks are saved in **localStorage**, so data persists after page refresh.



## Usage

### Top-section

* Initially, you have a default project called "General". You can create a new one using the **"Add project"** button in the top-right corner.
* You can filter tasks using the **Filter** dropdown menu to display only the tasks you need.
* You can delete a task using the **"x"** button on the right side of the task. You can also mark it as complete using the **"Mark complete"** checkbox on the left side, but the task will still remain in the list.
* Click on an existing task to edit its title, priority, or labels.

## State persistence

* All projects, tasks, and labels are stored in `localStorage`.
* Time tracking for tasks is also stored individually in `localStorage`.
* The active project remains saved even after refreshing the page.

## Styling

* The CSS files include responsive layouts and custom styles for tasks, labels, modals, and buttons.
* The user experience is handled separately for mobile and desktop views.

## Dependencies

* React
* react-dom

## Run the project

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```



