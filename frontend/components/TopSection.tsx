import { useState } from "react";
import FiltersBar from "./TopSectionComponents/FiltersBar";
import DeleteActions from "./TopSectionComponents/DeleteActions";
import AddLabelDropdown from "./TopSectionComponents/AddLabelDropdown";
import AddTaskForm from "./TopSectionComponents/AddTaskForm";
import CreateLabelButton from "./TopSectionComponents/CreateLabelButton";
import TaskDescriptionInput from "./TopSectionComponents/TaskDescriptionInput";

interface TopSectionProps {
  isMobile?: boolean;
}

function TopSection({
  isMobile,
}: TopSectionProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  // =====================================================
  // ===================== MOBILE ========================
  // =====================================================
  if (isMobile) {
    return (
      <div className="top-section">

        <div className="section-group">
          {/* ===== Filters Section ===== */}
          <div className="section">
            <FiltersBar />
          </div>

          {/* ===== Delete Actions Section ===== */}
          <div className="section buttons">
            <AddLabelDropdown />
            <DeleteActions />
          </div>
        </div>

        <div className="section-group">
          {/* ===== Add Task Section ===== */}
          <AddTaskForm
            isMobile={true}
            isDescriptionOpen={isDescriptionOpen}
            setIsDescriptionOpen={setIsDescriptionOpen}
          />

          {/* ===== Create Label Section ===== */}
          <div className="section buttons">
            <CreateLabelButton />
          </div>
        </div>

        {/* ===== Row 3: Full Width Task Description ===== */}
        <TaskDescriptionInput isOpen={isDescriptionOpen} />

      </div>
    );
  }

  // =====================================================
  // ==================== DESKTOP ========================
  // =====================================================
  return (
    <div className="top-section">

      <div className="section-group">
        {/* ===== Filters Section ===== */}
        <div className="section">
          <FiltersBar />
        </div>

        {/* ===== Delete Actions Section ===== */}
        <div className="section buttons">
          <DeleteActions />
        </div>
      </div>

      <div className="section-group">
        {/* ===== Add Task Section ===== */}
        <AddTaskForm
          isMobile={false}
          isDescriptionOpen={isDescriptionOpen}
          setIsDescriptionOpen={setIsDescriptionOpen}
        >
          <AddLabelDropdown />
        </AddTaskForm>

        {/* ===== Create Label Section ===== */}
        <div className="section buttons">
          <CreateLabelButton />
        </div>
      </div>

      {/* ===== Row 3: Full Width Task Description ===== */}
      <TaskDescriptionInput isOpen={isDescriptionOpen} />

    </div>
  );
}

export default TopSection;


