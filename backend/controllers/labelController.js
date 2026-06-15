// In-memory array for global labels
let labels = [
    { id: 1, name: "Work", color: "#f28b82" },
    { id: 2, name: "Personal", color: "#fbbc04" },
    { id: 3, name: "Urgent", color: "#34a853" }
];

// @desc    Get all labels
// @route   GET /api/labels
const getLabels = (req, res) => {
    console.log(`[GET] Fetched all labels. Total count: ${labels.length}`);
    res.status(200).json(labels);
};

// @desc    Create a new label
// @route   POST /api/labels
const createLabel = (req, res) => {
    const newLabel = req.body;
    
    // Safety check if frontend didn't provide ID
    if (!newLabel.id) {
        newLabel.id = Date.now().toString();
    }
    
    labels.push(newLabel);
    console.log(`[POST] Created new label: "${newLabel.name}"`);
    res.status(201).json(newLabel);
};

// @desc    Delete a label
// @route   DELETE /api/labels/:id
const deleteLabel = (req, res) => {
    // Note: req.params.id might be a string. We use toString() for safe comparison.
    const labelId = req.params.id;
    
    labels = labels.filter(label => label.id.toString() !== labelId.toString());
    
    console.log(`[DELETE] Removed label ID: ${labelId}`);
    res.status(200).json({ message: "Label removed successfully", id: labelId });
};

// @desc    Delete ALL labels
// @route   DELETE /api/labels
const deleteAllLabels = (req, res) => {
    labels = [];
    console.log(`[DELETE] Removed ALL labels.`);
    res.status(200).json({ message: "All labels removed successfully" });
};

module.exports = {
    getLabels,
    createLabel,
    deleteLabel,
    deleteAllLabels
};
