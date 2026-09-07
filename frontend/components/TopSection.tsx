import FiltersBar from "./TopSectionComponents/FiltersBar";
import DeleteActions from "./TopSectionComponents/DeleteActions";
import AddLabelDropdown from "./TopSectionComponents/AddLabelDropdown";
import AddTaskForm from "./TopSectionComponents/AddTaskForm";
import CreateLabelButton from "./TopSectionComponents/CreateLabelButton";

interface TopSectionProps {
  isMobile?: boolean;
}

function TopSection({
  isMobile,
}: TopSectionProps) {

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

          {/* ===== Labels Section ===== */}
          <div className="section buttons">
            <AddLabelDropdown />
            <CreateLabelButton />
          </div>
        </div>

        <div className="section-group">
          {/* ===== Add Task Section ===== */}
          <AddTaskForm isMobile={true} />

          {/* ===== Delete Actions Section ===== */}
          <div className="section buttons">
            <DeleteActions />
          </div>
        </div>

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

        {/* ===== Create Label Section ===== */}
        <div className="section buttons">
          <CreateLabelButton />
        </div>
      </div>

      <div className="section-group">
        {/* ===== Add Task Section ===== */}
        <AddTaskForm isMobile={false}>
          <AddLabelDropdown />
        </AddTaskForm>

        {/* ===== Delete Actions Section ===== */}
        <div className="section buttons">
          <DeleteActions />
        </div>
      </div>

    </div>
  );
}

export default TopSection;


