const crypto = require('crypto');

function getDefaultProjectsData() {
    const labelReviewId = crypto.randomUUID();
    const labelFrontendId = crypto.randomUUID();
    const labelBackendId = crypto.randomUUID();
    const labelUrgentId = crypto.randomUUID();

    return {
        create: [
            {
                name: 'General',
                labels: {
                    create: [
                        { id: labelReviewId, name: 'Review', color: '#8b5cf6' },
                        { id: labelFrontendId, name: 'Frontend', color: '#3b82f6' },
                        { id: labelBackendId, name: 'Backend', color: '#10b981' },
                        { id: labelUrgentId, name: 'Urgent', color: '#ef4444' }
                    ]
                },
                tasks: {
                    create: [
                        {
                            title: 'Hire Imre as a Developer! 🚀',
                            priority: 'high',
                            orderIndex: 1,
                            labels: { connect: [{ id: labelUrgentId }, { id: labelReviewId }] } // 2 labels on one task!
                        },
                        {
                            title: 'Test the Anonymous Session functionality',
                            priority: 'high',
                            done: true,
                            orderIndex: 2,
                            labels: { connect: [{ id: labelBackendId }] }
                        },
                        {
                            title: 'Check out the React source code on GitHub',
                            priority: 'mid',
                            orderIndex: 3,
                            labels: { connect: [{ id: labelFrontendId }] }
                        },
                        {
                            title: 'Create your own custom label and assign it',
                            priority: 'mid',
                            orderIndex: 4,
                            labels: { connect: [{ id: labelFrontendId }] }
                        },
                        {
                            title: 'Try deleting this specific task',
                            priority: 'low',
                            orderIndex: 5
                        },
                        {
                            title: 'Rename this project by clicking on its title',
                            priority: 'low',
                            done: true,
                            orderIndex: 6
                        },
                        {
                            title: 'Change the priority of a task',
                            priority: 'mid',
                            orderIndex: 7,
                            labels: { connect: [{ id: labelReviewId }] }
                        },
                        {
                            title: 'Create a new project',
                            priority: 'mid',
                            orderIndex: 8
                        }
                    ]
                }
            }
        ]
    };
}

function getEmptyGeneralProjectData() {
    return {
        create: [
            {
                name: 'General',
                labels: {
                    create: []
                },
                tasks: {
                    create: [] // Completely empty tasks!
                }
            }
        ]
    };
}

module.exports = { getDefaultProjectsData, getEmptyGeneralProjectData };
