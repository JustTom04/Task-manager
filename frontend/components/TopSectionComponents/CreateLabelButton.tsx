import useStore from "@/frontend/store/useStore";

export default function CreateLabelButton() {
  const setShowLabelModal = useStore(s => s.setShowLabelModal);
  return (
    <button
      type="button"
      className="done"
      onClick={() => setShowLabelModal(true)}
    >
      <span aria-hidden="true">➕</span> Create label
    </button>
  );
}
